from app.services.channel_providers import (
    MockEmailProvider,
    MockManualProvider,
    MockPaymentProvider,
)
from app.services.recovery_provider import RecoveryProviderResult


def test_payment_provider_returns_success():
    provider = MockPaymentProvider()

    result = provider.execute(
        action="PAYMENT_RETRY",
        message="Please retry your payment.",
        recipient="customer@example.com",
    )

    assert isinstance(result, RecoveryProviderResult)
    assert result.success is True
    assert result.provider_reference.startswith("MOCK-")


def test_email_provider_returns_success():
    provider = MockEmailProvider()

    result = provider.execute(
        action="CUSTOMER_CONTACT",
        message="Please contact support.",
        recipient="customer@example.com",
    )

    assert isinstance(result, RecoveryProviderResult)
    assert result.success is True
    assert result.provider_reference.startswith("MOCK-")


def test_manual_provider_returns_success():
    provider = MockManualProvider()

    result = provider.execute(
        action="MANUAL_REVIEW",
        message="Our team will review this payment.",
        recipient=None,
    )

    assert isinstance(result, RecoveryProviderResult)
    assert result.success is True
    assert result.provider_reference.startswith("MOCK-")