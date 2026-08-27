from decimal import Decimal

from app.models.recovery_case import RecoveryCase


def choose_recovery_strategy(case: RecoveryCase) -> str:
    """
    Choose a recovery strategy for a recovery case.

    The initial rule-based engine uses case priority
    and amount at risk to determine the strategy.
    """

    if case.priority == "HIGH":
        return "PAYMENT_RETRY"

    if case.priority == "MEDIUM":
        if case.amount_at_risk >= Decimal("5000"):
            return "PAYMENT_RETRY"

        return "EMAIL_REMINDER"

    return "EMAIL_REMINDER"