from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.models.recovery_outcome import RecoveryOutcome
from app.models.transaction import Transaction
from app.services.audit_service import record_audit_event


RECOVERY_OUTCOME_RECOVERED = "RECOVERED"
RECOVERY_OUTCOME_FAILED = "FAILED"

VERIFICATION_VERIFIED = "VERIFIED"
VERIFICATION_FAILED = "FAILED"


def get_recovery_outcome(
    case_id: UUID,
    db: Session,
) -> RecoveryOutcome | None:
    return db.scalar(
        select(RecoveryOutcome).where(
            RecoveryOutcome.recovery_case_id == case_id,
        )
    )


def record_recovery_outcome(
    *,
    merchant_id: UUID,
    case: RecoveryCase,
    transaction: Transaction,
    attempt: RecoveryAttempt,
    db: Session,
) -> RecoveryOutcome:
    """
    Persist one verified recovery outcome.

    A recovery case may have multiple attempts, but only one final
    RecoveryOutcome is recorded for the case.

    IMPORTANT:
    Provider success is treated as the recovery verification signal
    in the current mock/provider architecture. A future live Razorpay
    integration can replace this with payment-status verification.
    """

    existing = get_recovery_outcome(
        case_id=case.id,
        db=db,
    )

    if existing:
        return existing

    if attempt.status == "COMPLETED":
        outcome = RECOVERY_OUTCOME_RECOVERED
        verification_status = VERIFICATION_VERIFIED
        recovered_amount = Decimal(case.amount_at_risk)
        reason = (
            "Recovery provider reported successful execution and the "
            "recovery amount was recorded as verified under the current "
            "provider abstraction."
        )
    else:
        outcome = RECOVERY_OUTCOME_FAILED
        verification_status = VERIFICATION_FAILED
        recovered_amount = Decimal("0")
        reason = (
            "Recovery intervention did not produce a successful provider outcome."
        )

    result = RecoveryOutcome(
        merchant_id=merchant_id,
        recovery_case_id=case.id,
        recovery_attempt_id=attempt.id,
        outcome=outcome,
        verification_status=verification_status,
        recovered_amount=recovered_amount,
        currency=transaction.currency,
        provider_reference=attempt.provider_reference,
        verification_source="RECOVERY_PROVIDER",
        reason=reason,
    )

    db.add(result)
    db.flush()

    record_audit_event(
        merchant_id=merchant_id,
        recovery_case_id=case.id,
        transaction_id=transaction.id,
        db=db,
        event_type="RECOVERY_OUTCOME_VERIFIED",
        actor="RECOVERAI_AGENT",
        action="VERIFY_RECOVERY",
        status=outcome,
        reason=reason,
        event_data={
            "verification_status": verification_status,
            "recovered_amount": str(recovered_amount),
            "currency": transaction.currency,
            "provider_reference": attempt.provider_reference,
            "verification_source": "RECOVERY_PROVIDER",
        },
    )

    return result