from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.services.recovery_eligibility import (
    is_transaction_recoverable,
)


def create_recovery_case_for_transaction(
    transaction_id: UUID,
    merchant_id: UUID,
    db: Session,
    reason: str = "PAYMENT_FAILURE",
    priority: str = "MEDIUM",
) -> RecoveryCase:
    """
    Create a recovery case automatically for an eligible transaction.
    """

    transaction = db.scalar(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.merchant_id == merchant_id,
        )
    )

    if not transaction:
        raise ValueError("Transaction not found.")

    if not is_transaction_recoverable(transaction):
        raise ValueError(
            "Transaction is not eligible for recovery."
        )

    existing_case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.transaction_id == transaction.id,
        )
    )

    if existing_case:
        return existing_case

    recovery_case = RecoveryCase(
        merchant_id=merchant_id,
        transaction_id=transaction.id,
        amount_at_risk=transaction.amount,
        reason=reason,
        status="OPEN",
        priority=priority.upper(),
    )

    db.add(recovery_case)
    db.commit()
    db.refresh(recovery_case)

    return recovery_case