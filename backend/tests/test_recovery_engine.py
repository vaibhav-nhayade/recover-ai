from decimal import Decimal
from types import SimpleNamespace

from app.services.recovery_engine import determine_recovery_strategy


def make_transaction(
    amount="1000.00",
    payment_method="CARD",
):
    return SimpleNamespace(
        amount=Decimal(amount),
        payment_method=payment_method,
    )


def make_case(reason="Payment declined"):
    return SimpleNamespace(
        reason=reason,
    )


def test_high_value_transaction_requires_manual_review():
    transaction = make_transaction(
        amount="10000.00",
        payment_method="CARD",
    )

    strategy = determine_recovery_strategy(
        transaction,
        make_case(),
    )

    assert strategy == "MANUAL_REVIEW"


def test_card_decline_uses_payment_retry():
    transaction = make_transaction(
        payment_method="CARD",
    )

    strategy = determine_recovery_strategy(
        transaction,
        make_case("Card declined"),
    )

    assert strategy == "PAYMENT_RETRY"


def test_upi_failure_uses_payment_retry():
    transaction = make_transaction(
        payment_method="UPI",
    )

    strategy = determine_recovery_strategy(
        transaction,
        make_case(),
    )

    assert strategy == "PAYMENT_RETRY"


def test_bank_transfer_uses_customer_contact():
    transaction = make_transaction(
        payment_method="BANK_TRANSFER",
    )

    strategy = determine_recovery_strategy(
        transaction,
        make_case(),
    )

    assert strategy == "CUSTOMER_CONTACT"


def test_unknown_payment_method_defaults_to_customer_contact():
    transaction = make_transaction(
        payment_method="UNKNOWN",
    )

    strategy = determine_recovery_strategy(
        transaction,
        make_case(),
    )

    assert strategy == "CUSTOMER_CONTACT"