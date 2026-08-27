from decimal import Decimal
from types import SimpleNamespace

from app.services.recovery_eligibility import (
    is_transaction_recoverable,
)


def make_transaction(
    status="FAILED",
    amount="100.00",
    payment_method="CARD",
):
    return SimpleNamespace(
        status=status,
        amount=Decimal(amount),
        payment_method=payment_method,
    )


def test_failed_transaction_is_recoverable():
    transaction = make_transaction()

    assert is_transaction_recoverable(transaction) is True


def test_non_failed_transaction_is_not_recoverable():
    transaction = make_transaction(
        status="SUCCESS",
    )

    assert is_transaction_recoverable(transaction) is False


def test_zero_amount_transaction_is_not_recoverable():
    transaction = make_transaction(
        amount="0.00",
    )

    assert is_transaction_recoverable(transaction) is False


def test_transaction_without_payment_method_is_not_recoverable():
    transaction = make_transaction(
        payment_method=None,
    )

    assert is_transaction_recoverable(transaction) is False