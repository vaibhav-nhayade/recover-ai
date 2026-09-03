from datetime import datetime, timezone
from decimal import Decimal
from json import dumps
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.services.intervention_ranker import rank_interventions
from app.services.provider_factory import get_recovery_provider
from app.services.recovery_channel import determine_recovery_channel
from app.services.recovery_message import generate_recovery_message
from app.services.recovery_result import apply_recovery_result
from app.services.recovery_retry import can_retry_recovery
from app.services.recovery_scoring import score_transaction


def process_recovery_case(
    case_id: UUID,
    merchant_id: UUID,
    db: Session,
) -> RecoveryAttempt:
    """
    Process a recovery case through the autonomous recovery workflow.

    Decision flow:

        Transaction
            ↓
        AI recovery scoring
            ↓
        Intervention ranking
            ↓
        Policy / retry checks
            ↓
        Recovery provider
            ↓
        Recovery outcome

    The AI layer recommends an intervention but does not bypass
    existing recovery-state and retry controls.
    """

    case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.id == case_id,
            RecoveryCase.merchant_id == merchant_id,
        )
    )

    if not case:
        raise ValueError("Recovery case not found.")

    if case.status in {"RECOVERED", "CLOSED"}:
        raise ValueError(
            f"Cannot process a recovery case with status '{case.status}'."
        )

    if case.status == "FAILED" and not can_retry_recovery(case, db):
        raise ValueError(
            "Recovery case cannot be retried."
        )

    transaction = db.scalar(
        select(Transaction).where(
            Transaction.id == case.transaction_id,
            Transaction.merchant_id == merchant_id,
        )
    )

    if not transaction:
        raise ValueError("Transaction not found.")

    existing_attempt = db.scalar(
        select(RecoveryAttempt)
        .where(
            RecoveryAttempt.recovery_case_id == case.id,
            RecoveryAttempt.status == "PENDING",
        )
        .order_by(RecoveryAttempt.created_at.desc())
    )

    if existing_attempt:
        return existing_attempt

    # ---------------------------------------------------------
    # 1. AI RECOVERY SCORING
    # ---------------------------------------------------------

    recovery_score = score_transaction(
        transaction=transaction,
        db=db,
    )

    # ---------------------------------------------------------
    # 2. INTERVENTION RANKING
    # ---------------------------------------------------------

    intervention_ranking = rank_interventions(
        amount=Decimal(transaction.amount),
        payment_method=transaction.payment_method or "",
        failure_reason=transaction.failure_reason or case.reason or "",
        recovery_score=recovery_score,
    )

    selected_intervention = intervention_ranking.selected

    strategy = selected_intervention.strategy

    # ---------------------------------------------------------
    # 3. SAFETY CHECK
    # ---------------------------------------------------------

    if not selected_intervention.allowed:
        raise ValueError(
            "AI-selected intervention is not allowed by recovery policy."
        )

    channel = determine_recovery_channel(strategy)

    # ---------------------------------------------------------
    # 4. GENERATE RECOVERY MESSAGE
    # ---------------------------------------------------------

    message = generate_recovery_message(
        transaction=transaction,
        recovery_case=case,
        strategy=strategy,
    )

    # ---------------------------------------------------------
    # 5. STORE AI DECISION EXPLANATION
    # ---------------------------------------------------------

    decision_record = {
        "engine": "RecoverAI Recovery Decision Engine",
        "model_type": "explainable_baseline",
        "recovery_probability": recovery_score.probability,
        "recovery_probability_percent": round(
            recovery_score.probability * 100,
            2,
        ),
        "model_confidence": recovery_score.confidence,
        "model_confidence_percent": round(
            recovery_score.confidence * 100,
            2,
        ),
        "risk_band": recovery_score.risk_band,
        "selected_intervention": selected_intervention.name,
        "selected_strategy": selected_intervention.strategy,
        "selected_channel": selected_intervention.channel,
        "intervention_score": selected_intervention.score,
        "expected_recovery": str(
            selected_intervention.expected_recovery
        ),
        "features": recovery_score.features,
        "evidence": recovery_score.evidence,
        "alternatives": [
            {
                "name": item.name,
                "strategy": item.strategy,
                "score": item.score,
                "expected_recovery": str(
                    item.expected_recovery
                ),
                "allowed": item.allowed,
            }
            for item in intervention_ranking.alternatives
        ],
    }

    existing_notes = case.notes or ""

    decision_notes = (
        "\n\n"
        "RECOVERAI AI DECISION\n"
        "---------------------\n"
        f"{dumps(decision_record, indent=2)}"
    )

    case.notes = (
        existing_notes + decision_notes
    ).strip()

    # ---------------------------------------------------------
    # 6. UPDATE CASE STATE
    # ---------------------------------------------------------

    case.recovery_strategy = strategy
    case.status = "IN_PROGRESS"

    # ---------------------------------------------------------
    # 7. CREATE RECOVERY ATTEMPT
    # ---------------------------------------------------------

    attempt = RecoveryAttempt(
        recovery_case_id=case.id,
        channel=channel,
        action=strategy,
        status="PENDING",
        message=message,
        attempted_at=datetime.now(timezone.utc),
    )

    db.add(attempt)
    db.flush()

    # ---------------------------------------------------------
    # 8. EXECUTE THROUGH PROVIDER
    # ---------------------------------------------------------

    provider = get_recovery_provider(channel)

    try:
        provider_result = provider.execute(
            action=strategy,
            message=message,
            recipient=transaction.customer_email,
        )

    except Exception as exc:
        attempt.status = "FAILED"

        attempt.message = (
            f"{message}\n\n"
            f"Provider execution failed: {exc}"
        )

        case.status = "FAILED"

        db.commit()
        db.refresh(attempt)

        return attempt

    # ---------------------------------------------------------
    # 9. APPLY ACTUAL PROVIDER OUTCOME
    # ---------------------------------------------------------

    return apply_recovery_result(
        attempt=attempt,
        recovery_case=case,
        provider_result=provider_result,
        db=db,
    )