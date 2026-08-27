from decimal import Decimal

from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction


def determine_recovery_strategy(
    transaction: Transaction,
    recovery_case: RecoveryCase,
) -> str:
    """
    Determine the recommended recovery strategy for a failed transaction.
    """

    amount = Decimal(transaction.amount)
    payment_method = (transaction.payment_method or "").upper()
    reason = (recovery_case.reason or "").lower()

    # High-value transactions get a more deliberate recovery strategy.
    if amount >= Decimal("10000"):
        return "MANUAL_REVIEW"

    # Card failures can generally be retried.
    if payment_method == "CARD":
        if "declin" in reason or "failed" in reason:
            return "PAYMENT_RETRY"

    # UPI failures should generally trigger a payment retry.
    if payment_method == "UPI":
        return "PAYMENT_RETRY"

    # Bank-transfer failures may require customer follow-up.
    if payment_method in {"BANK_TRANSFER", "NET_BANKING"}:
        return "CUSTOMER_CONTACT"

    # Default strategy for unknown failure/payment combinations.
    return "CUSTOMER_CONTACT"