from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

from app.services.recovery_scoring import score_transaction


def make_transaction(
    amount="2499.50",
    payment_method="CARD",
    failure_reason="Card declined",
    email="customer@example.com",
):
    return SimpleNamespace(
        id="current",
        merchant_id="merchant",
        transaction_reference="TXN-TEST",
        amount=Decimal(amount),
        currency="INR",
        payment_method=payment_method,
        failure_reason=failure_reason,
        customer_email=email,
        occurred_at=datetime.now(timezone.utc),
    )


class FakeScalar:
    def __init__(self, values):
        self.values = iter(values)

    def __call__(self, statement):
        return next(self.values)


class FakeDB:
    def __init__(self, values):
        self.scalar = FakeScalar(values)


def test_recovery_score_returns_probability():
    transaction = make_transaction()

    db = FakeDB(
        [
            3,
            2,
            1,
        ]
    )

    result = score_transaction(
        transaction=transaction,
        db=db,
    )

    assert 0.05 <= result.probability <= 0.95
    assert 0.45 <= result.confidence <= 0.95
    assert 0 <= result.score <= 100
    assert result.risk_band in {
        "HIGH_RECOVERABILITY",
        "MEDIUM_RECOVERABILITY",
        "LOW_RECOVERABILITY",
    }


def test_high_value_transaction_is_manual_review():
    transaction = make_transaction(
        amount="15000.00",
        payment_method="CARD",
        failure_reason="Card declined",
    )

    db = FakeDB(
        [
            0,
            0,
            0,
        ]
    )

    result = score_transaction(
        transaction=transaction,
        db=db,
    )

    assert result.recommended_strategy == "MANUAL_REVIEW"


def test_upi_timeout_is_high_recovery_signal():
    transaction = make_transaction(
        amount="2000.00",
        payment_method="UPI",
        failure_reason="UPI timeout",
    )

    db = FakeDB(
        [
            4,
            3,
            1,
        ]
    )

    result = score_transaction(
        transaction=transaction,
        db=db,
    )

    assert result.features["failure_signal"] >= 0.80
    assert result.features["payment_method_signal"] >= 0.75
    assert result.recommended_strategy == "PAYMENT_RETRY"


def test_no_customer_history_does_not_fail():
    transaction = make_transaction(
        email=None,
    )

    db = FakeDB(
        [
            0,
            0,
            0,
        ]
    )

    result = score_transaction(
        transaction=transaction,
        db=db,
    )

    assert result.probability > 0
    assert any(
        "No previous transactions" in item
        or "No customer email" in item
        for item in result.evidence
    )