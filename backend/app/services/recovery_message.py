from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction


def generate_recovery_message(
    transaction: Transaction,
    recovery_case: RecoveryCase,
    strategy: str,
) -> str:
    """
    Generate a customer-facing recovery message
    based on the selected recovery strategy.
    """

    customer_name = transaction.customer_name or "Customer"
    amount = transaction.amount
    currency = transaction.currency

    if strategy == "PAYMENT_RETRY":
        return (
            f"Hi {customer_name}, your payment of "
            f"{currency} {amount} could not be completed. "
            "Please try the payment again using your preferred method."
        )

    if strategy == "CUSTOMER_CONTACT":
        return (
            f"Hi {customer_name}, we noticed an issue with your "
            f"{currency} {amount} payment. "
            "Please contact us so we can help resolve the issue."
        )

    if strategy == "MANUAL_REVIEW":
        return (
            f"Hi {customer_name}, we are reviewing your "
            f"{currency} {amount} payment issue. "
            "Our team will contact you with the next steps."
        )

    return (
        f"Hi {customer_name}, we noticed an issue with your "
        f"{currency} {amount} payment. "
        "Please contact us for assistance."
    )