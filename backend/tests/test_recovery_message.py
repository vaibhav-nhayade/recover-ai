from decimal import Decimal
from types import SimpleNamespace

from app.services.recovery_message import (
    generate_recovery_message,
)


def make_transaction():
    return SimpleNamespace(
        customer_name="Vaibhav",
        amount=Decimal("1500.00"),
        currency="INR",
    )


def make_case():
    return SimpleNamespace()


def test_payment_retry_message():
    message = generate_recovery_message(
        transaction=make_transaction(),
        recovery_case=make_case(),
        strategy="PAYMENT_RETRY",
    )

    assert "Vaibhav" in message
    assert "INR" in message
    assert "1500.00" in message
    assert "try the payment again" in message


def test_customer_contact_message():
    message = generate_recovery_message(
        transaction=make_transaction(),
        recovery_case=make_case(),
        strategy="CUSTOMER_CONTACT",
    )

    assert "Vaibhav" in message
    assert "contact us" in message


def test_manual_review_message():
    message = generate_recovery_message(
        transaction=make_transaction(),
        recovery_case=make_case(),
        strategy="MANUAL_REVIEW",
    )

    assert "Vaibhav" in message
    assert "reviewing" in message