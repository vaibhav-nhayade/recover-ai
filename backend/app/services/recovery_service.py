from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.services.recovery_engine import determine_recovery_strategy
from app.services.recovery_message import generate_recovery_message


def process_recovery_case(
    case_id: UUID,
    merchant_id: UUID,
    db: Session,
) -> RecoveryAttempt:
    """
    Process a recovery case, determine its strategy,
    generate a recovery message, and create a recovery attempt.
    """

    case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.id == case_id,
            RecoveryCase.merchant_id == merchant_id,
        )
    )

    if not case:
        raise ValueError("Recovery case not found.")

    if case.status in {"RECOVERED", "FAILED", "CLOSED"}:
        raise ValueError(
            f"Cannot process a recovery case with status '{case.status}'."
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

    strategy = determine_recovery_strategy(
        transaction=transaction,
        recovery_case=case,
    )

    message = generate_recovery_message(
        transaction=transaction,
        recovery_case=case,
        strategy=strategy,
    )

    case.recovery_strategy = strategy
    case.status = "IN_PROGRESS"

    attempt = RecoveryAttempt(
        recovery_case_id=case.id,
        channel="SYSTEM",
        action=strategy,
        status="PENDING",
        message=message,
        attempted_at=datetime.now(timezone.utc),
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return attempt