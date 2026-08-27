from decimal import Decimal

from app.models.transaction import Transaction


MINIMUM_RECOVERY_AMOUNT = Decimal("1.00")

RECOVERABLE_TRANSACTION_STATUSES = {
    "FAILED",
}


def is_transaction_recoverable(
    transaction: Transaction,
) -> bool:
    """
    Determine whether a transaction is eligible
    for revenue recovery.
    """

    if transaction.status.upper() not in RECOVERABLE_TRANSACTION_STATUSES:
        return False

    if transaction.amount < MINIMUM_RECOVERY_AMOUNT:
        return False

    if not transaction.payment_method:
        return False

    return True