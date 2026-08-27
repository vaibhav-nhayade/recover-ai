from decimal import Decimal

from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.services.recovery_config import RECOVERY_STRATEGIES


def determine_recovery_strategy(
    transaction: Transaction,
    recovery_case: RecoveryCase,
) -> str:
    """
    Determine the recommended recovery strategy for a failed transaction.
    """

    amount = Decimal(transaction.amount)
    payment_method = (transaction.payment_method or "").upper()

    transaction_failure_reason = (
        getattr(transaction, "failure_reason", None) or ""
    ).lower()

    case_reason = (
        getattr(recovery_case, "reason", None) or ""
    ).lower()

    reason = (
        transaction_failure_reason
        if transaction_failure_reason
        else case_reason
    )

    if amount >= Decimal("10000"):
        strategy = "MANUAL_REVIEW"

    elif payment_method == "CARD":
        if "declin" in reason or "failed" in reason:
            strategy = "PAYMENT_RETRY"
        else:
            strategy = "CUSTOMER_CONTACT"

    elif payment_method == "UPI":
        strategy = "PAYMENT_RETRY"

    elif payment_method in {"BANK_TRANSFER", "NET_BANKING"}:
        strategy = "CUSTOMER_CONTACT"

    else:
        strategy = "CUSTOMER_CONTACT"

    if strategy not in RECOVERY_STRATEGIES:
        raise ValueError(
            f"Unsupported recovery strategy: {strategy}"
        )

    return strategy