from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.services.recovery_batch import evaluate_transaction
from app.services.recovery_service import process_recovery_case


MAX_AGENT_CASES_PER_RUN = 100
MAX_ATTEMPTS_PER_CASE = 3


@dataclass(frozen=True)
class AgentCaseResult:
    case_id: UUID
    transaction_id: UUID
    transaction_reference: str
    amount_at_risk: Decimal
    action: str
    status: str
    recovered_amount: Decimal
    escalation_required: bool
    reason: str


@dataclass(frozen=True)
class AgentRunResult:
    run_id: str
    merchant_id: UUID
    cases_detected: int
    cases_processed: int
    recovered_cases: int
    escalated_cases: int
    failed_cases: int
    revenue_at_risk: Decimal
    recovered_revenue: Decimal
    recovery_rate: float
    results: list[AgentCaseResult]


def _count_attempts(
    case_id: UUID,
    db: Session,
) -> int:
    return int(
        db.scalar(
            select(func.count(RecoveryAttempt.id)).where(
                RecoveryAttempt.recovery_case_id == case_id,
            )
        )
        or 0
    )


def _latest_attempt(
    case_id: UUID,
    db: Session,
) -> RecoveryAttempt | None:
    return db.scalar(
        select(RecoveryAttempt)
        .where(
            RecoveryAttempt.recovery_case_id == case_id,
        )
        .order_by(
            RecoveryAttempt.created_at.desc()
        )
    )


def _extract_recovered_amount(
    attempt: RecoveryAttempt | None,
    case: RecoveryCase,
) -> Decimal:
    if not attempt:
        return Decimal("0")

    if attempt.status != "COMPLETED":
        return Decimal("0")

    return Decimal(case.amount_at_risk)


def _should_escalate(
    case: RecoveryCase,
    attempt: RecoveryAttempt | None,
    attempt_count: int,
) -> tuple[bool, str]:
    if case.status == "RECOVERED":
        return False, "Revenue was successfully recovered."

    if case.status == "CLOSED":
        return False, "Recovery case is already closed."

    if attempt_count >= MAX_ATTEMPTS_PER_CASE:
        return True, "Maximum recovery attempts reached."

    if case.recovery_strategy == "MANUAL_REVIEW":
        return True, "AI selected manual review for this recovery case."

    if attempt and attempt.status == "FAILED":
        if attempt_count >= MAX_ATTEMPTS_PER_CASE:
            return True, "Recovery failed and the retry limit has been reached."

        return False, "Recovery failed; the case remains eligible for bounded retry."

    return False, "Recovery case remains within autonomous execution limits."


def run_recovery_agent(
    merchant_id: UUID,
    db: Session,
    limit: int = MAX_AGENT_CASES_PER_RUN,
) -> AgentRunResult:
    """
    Execute one bounded autonomous recovery-agent run.

    Agent loop:

        1. Detect open recovery cases.
        2. Evaluate AI recovery opportunity.
        3. Execute the selected bounded intervention.
        4. Inspect the outcome.
        5. Escalate when policy limits are reached.
        6. Stop after the configured case limit.

    The agent never bypasses the existing recovery service,
    provider abstraction, or retry controls.
    """

    limit = max(
        1,
        min(
            limit,
            MAX_AGENT_CASES_PER_RUN,
        ),
    )

    cases = db.scalars(
        select(RecoveryCase)
        .where(
            RecoveryCase.merchant_id == merchant_id,
            RecoveryCase.status.in_(
                ["OPEN", "FAILED", "IN_PROGRESS"]
            ),
        )
        .order_by(
            RecoveryCase.priority.desc(),
            RecoveryCase.created_at.asc(),
        )
        .limit(limit)
    ).all()

    revenue_at_risk = sum(
        (
            Decimal(case.amount_at_risk)
            for case in cases
        ),
        Decimal("0"),
    )

    results: list[AgentCaseResult] = []

    recovered_cases = 0
    escalated_cases = 0
    failed_cases = 0
    recovered_revenue = Decimal("0")

    run_id = f"AGENT-{merchant_id}-{len(cases)}"

    for case in cases:
        transaction = db.scalar(
            select(Transaction).where(
                Transaction.id == case.transaction_id,
                Transaction.merchant_id == merchant_id,
            )
        )

        if not transaction:
            failed_cases += 1

            results.append(
                AgentCaseResult(
                    case_id=case.id,
                    transaction_id=case.transaction_id,
                    transaction_reference="UNKNOWN",
                    amount_at_risk=Decimal(case.amount_at_risk),
                    action="NONE",
                    status="FAILED",
                    recovered_amount=Decimal("0"),
                    escalation_required=True,
                    reason="Associated transaction could not be found.",
                )
            )

            continue

        attempt_count_before = _count_attempts(
            case.id,
            db,
        )

        # -----------------------------------------------------
        # STOPPING RULE 1 — MAX ATTEMPTS
        # -----------------------------------------------------

        if attempt_count_before >= MAX_ATTEMPTS_PER_CASE:
            case.status = "CLOSED"

            escalated_cases += 1

            results.append(
                AgentCaseResult(
                    case_id=case.id,
                    transaction_id=transaction.id,
                    transaction_reference=transaction.transaction_reference,
                    amount_at_risk=Decimal(case.amount_at_risk),
                    action="MANUAL_REVIEW",
                    status="ESCALATED",
                    recovered_amount=Decimal("0"),
                    escalation_required=True,
                    reason="Maximum autonomous recovery attempts reached.",
                )
            )

            continue

        # -----------------------------------------------------
        # 1. DETECT + SCORE
        # -----------------------------------------------------

        evaluation = evaluate_transaction(
            transaction=transaction,
            db=db,
        )

        # -----------------------------------------------------
        # STOPPING RULE 2 — LOW RECOVERY OPPORTUNITY
        # -----------------------------------------------------

        if evaluation.recovery_probability < 0.20:
            case.recovery_strategy = "MANUAL_REVIEW"
            case.status = "CLOSED"

            escalated_cases += 1

            results.append(
                AgentCaseResult(
                    case_id=case.id,
                    transaction_id=transaction.id,
                    transaction_reference=transaction.transaction_reference,
                    amount_at_risk=Decimal(case.amount_at_risk),
                    action="MANUAL_REVIEW",
                    status="ESCALATED",
                    recovered_amount=Decimal("0"),
                    escalation_required=True,
                    reason=(
                        "Recovery probability is below the autonomous "
                        "execution threshold."
                    ),
                )
            )

            continue

        # -----------------------------------------------------
        # 2. EXECUTE BOUNDED INTERVENTION
        # -----------------------------------------------------

        try:
            attempt = process_recovery_case(
                case_id=case.id,
                merchant_id=merchant_id,
                db=db,
            )

        except ValueError as exc:
            failed_cases += 1

            results.append(
                AgentCaseResult(
                    case_id=case.id,
                    transaction_id=transaction.id,
                    transaction_reference=transaction.transaction_reference,
                    amount_at_risk=Decimal(case.amount_at_risk),
                    action=case.recovery_strategy or "NONE",
                    status="FAILED",
                    recovered_amount=Decimal("0"),
                    escalation_required=False,
                    reason=str(exc),
                )
            )

            continue

        # -----------------------------------------------------
        # 3. VERIFY OUTCOME
        # -----------------------------------------------------

        db.refresh(case)

        attempt_count_after = _count_attempts(
            case.id,
            db,
        )

        latest_attempt = _latest_attempt(
            case.id,
            db,
        )

        recovered_amount = _extract_recovered_amount(
            latest_attempt,
            case,
        )

        should_escalate, escalation_reason = _should_escalate(
            case=case,
            attempt=latest_attempt,
            attempt_count=attempt_count_after,
        )

        if case.status == "RECOVERED":
            recovered_cases += 1
            recovered_revenue += recovered_amount

            results.append(
                AgentCaseResult(
                    case_id=case.id,
                    transaction_id=transaction.id,
                    transaction_reference=transaction.transaction_reference,
                    amount_at_risk=Decimal(case.amount_at_risk),
                    action=case.recovery_strategy or "UNKNOWN",
                    status="RECOVERED",
                    recovered_amount=recovered_amount,
                    escalation_required=False,
                    reason="Recovery provider reported a successful recovery.",
                )
            )

            continue

        if should_escalate:
            case.status = "CLOSED"
            escalated_cases += 1

            results.append(
                AgentCaseResult(
                    case_id=case.id,
                    transaction_id=transaction.id,
                    transaction_reference=transaction.transaction_reference,
                    amount_at_risk=Decimal(case.amount_at_risk),
                    action=case.recovery_strategy or "MANUAL_REVIEW",
                    status="ESCALATED",
                    recovered_amount=Decimal("0"),
                    escalation_required=True,
                    reason=escalation_reason,
                )
            )

            continue

        failed_cases += 1

        results.append(
            AgentCaseResult(
                case_id=case.id,
                transaction_id=transaction.id,
                transaction_reference=transaction.transaction_reference,
                amount_at_risk=Decimal(case.amount_at_risk),
                action=case.recovery_strategy or "UNKNOWN",
                status=case.status,
                recovered_amount=Decimal("0"),
                escalation_required=False,
                reason=(
                    "Intervention did not recover revenue; "
                    "case remains eligible for bounded retry."
                ),
            )
        )

    db.commit()

    recovery_rate = (
        float(
            recovered_revenue / revenue_at_risk
        )
        if revenue_at_risk > 0
        else 0.0
    )

    return AgentRunResult(
        run_id=run_id,
        merchant_id=merchant_id,
        cases_detected=len(cases),
        cases_processed=len(results),
        recovered_cases=recovered_cases,
        escalated_cases=escalated_cases,
        failed_cases=failed_cases,
        revenue_at_risk=revenue_at_risk.quantize(
            Decimal("0.01")
        ),
        recovered_revenue=recovered_revenue.quantize(
            Decimal("0.01")
        ),
        recovery_rate=round(
            recovery_rate,
            4,
        ),
        results=results,
    )