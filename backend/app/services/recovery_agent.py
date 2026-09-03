from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.services.recovery_batch import evaluate_transaction
from app.services.recovery_config import MAX_RECOVERY_ATTEMPTS
from app.services.recovery_retry import (
    get_retry_decision,
    count_recovery_attempts,
)
from app.services.recovery_service import process_recovery_case


MAX_AGENT_CASES_PER_RUN = 100
AUTONOMOUS_MIN_PROBABILITY = 0.20


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
    attempt_count: int


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
            RecoveryAttempt.created_at.desc(),
        )
    )


def _recovered_amount(
    case: RecoveryCase,
    attempt: RecoveryAttempt | None,
) -> Decimal:
    if attempt is None:
        return Decimal("0")

    if attempt.status != "COMPLETED":
        return Decimal("0")

    return Decimal(case.amount_at_risk)


def _escalate_case(
    case: RecoveryCase,
    reason: str,
) -> None:
    """
    The database intentionally uses CLOSED rather than inventing
    an ESCALATED status.

    Escalation is represented through:
        status = CLOSED
        recovery_strategy = MANUAL_REVIEW
        notes = structured escalation record
    """

    case.status = "CLOSED"
    case.recovery_strategy = "MANUAL_REVIEW"

    existing_notes = case.notes or ""

    escalation_record = (
        "\n\n"
        "RECOVERAI ESCALATION\n"
        "--------------------\n"
        f"reason: {reason}\n"
        "action: MANUAL_REVIEW\n"
        "autonomous_execution: STOPPED"
    )

    case.notes = (
        existing_notes + escalation_record
    ).strip()


def run_recovery_agent(
    merchant_id: UUID,
    db: Session,
    limit: int = MAX_AGENT_CASES_PER_RUN,
) -> AgentRunResult:
    """
    Execute one bounded autonomous recovery-agent run.

    Autonomous loop:

        Detect
          ↓
        Score
          ↓
        Policy check
          ↓
        Execute
          ↓
        Verify
          ↓
        Retry OR Stop
          ↓
        Escalate when required

    Hard safety limits:
        - Maximum 100 cases per agent run
        - Maximum 3 attempts per recovery case
        - No duplicate pending execution
        - No execution for recovered/closed cases
        - Low probability cases are escalated
        - Manual-review decisions stop automation
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
                ["OPEN", "FAILED", "IN_PROGRESS"],
            ),
        )
        .order_by(
            RecoveryCase.priority.desc(),
            RecoveryCase.created_at.asc(),
        )
        .limit(limit),
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

    run_id = f"AGENT-{uuid4()}"

    for case in cases:
        transaction = db.scalar(
            select(Transaction).where(
                Transaction.id == case.transaction_id,
                Transaction.merchant_id == merchant_id,
            )
        )

        if not transaction:
            _escalate_case(
                case,
                "Associated transaction could not be found.",
            )

            escalated_cases += 1

            results.append(
                AgentCaseResult(
                    case_id=case.id,
                    transaction_id=case.transaction_id,
                    transaction_reference="UNKNOWN",
                    amount_at_risk=Decimal(case.amount_at_risk),
                    action="MANUAL_REVIEW",
                    status="ESCALATED",
                    recovered_amount=Decimal("0"),
                    escalation_required=True,
                    reason="Associated transaction could not be found.",
                    attempt_count=count_recovery_attempts(
                        case.id,
                        db,
                    ),
                )
            )

            continue

        retry_decision = get_retry_decision(
            case=case,
            db=db,
        )

        if not retry_decision.allowed:
            if retry_decision.should_escalate:
                _escalate_case(
                    case,
                    retry_decision.reason,
                )

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
                        reason=retry_decision.reason,
                        attempt_count=retry_decision.attempt_count,
                    )
                )

            else:
                failed_cases += 1

                results.append(
                    AgentCaseResult(
                        case_id=case.id,
                        transaction_id=transaction.id,
                        transaction_reference=transaction.transaction_reference,
                        amount_at_risk=Decimal(case.amount_at_risk),
                        action=case.recovery_strategy or "NONE",
                        status=case.status,
                        recovered_amount=Decimal("0"),
                        escalation_required=False,
                        reason=retry_decision.reason,
                        attempt_count=retry_decision.attempt_count,
                    )
                )

            continue

        evaluation = evaluate_transaction(
            transaction=transaction,
            db=db,
        )

        if evaluation.recovery_probability < AUTONOMOUS_MIN_PROBABILITY:
            reason = (
                "Recovery probability is below the autonomous "
                f"execution threshold of "
                f"{AUTONOMOUS_MIN_PROBABILITY:.0%}."
            )

            _escalate_case(
                case,
                reason,
            )

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
                    reason=reason,
                    attempt_count=retry_decision.attempt_count,
                )
            )

            continue

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
                    attempt_count=count_recovery_attempts(
                        case.id,
                        db,
                    ),
                )
            )

            continue

        db.refresh(case)

        latest_attempt = _latest_attempt(
            case.id,
            db,
        )

        attempt_count = count_recovery_attempts(
            case.id,
            db,
        )

        recovered_amount = _recovered_amount(
            case,
            latest_attempt,
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
                    attempt_count=attempt_count,
                )
            )

            continue

        if attempt_count >= MAX_RECOVERY_ATTEMPTS:
            reason = (
                "Recovery attempt failed and the maximum autonomous "
                f"limit of {MAX_RECOVERY_ATTEMPTS} attempts has been reached."
            )

            _escalate_case(
                case,
                reason,
            )

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
                    reason=reason,
                    attempt_count=attempt_count,
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
                    "Intervention did not recover revenue. "
                    f"{MAX_RECOVERY_ATTEMPTS - attempt_count} "
                    "autonomous attempt(s) remain."
                ),
                attempt_count=attempt_count,
            )
        )

    db.commit()

    recovery_rate = (
        float(
            recovered_revenue / revenue_at_risk,
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
            Decimal("0.01"),
        ),
        recovered_revenue=recovered_revenue.quantize(
            Decimal("0.01"),
        ),
        recovery_rate=round(
            recovery_rate,
            4,
        ),
        results=results,
    )