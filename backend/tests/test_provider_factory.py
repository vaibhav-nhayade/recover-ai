import pytest

from app.services.channel_providers import (
    MockEmailProvider,
    MockManualProvider,
    MockPaymentProvider,
)
from app.services.provider_factory import get_recovery_provider


def test_payment_channel_returns_payment_provider():
    provider = get_recovery_provider("PAYMENT")

    assert isinstance(provider, MockPaymentProvider)


def test_email_channel_returns_email_provider():
    provider = get_recovery_provider("EMAIL")

    assert isinstance(provider, MockEmailProvider)


def test_manual_channel_returns_manual_provider():
    provider = get_recovery_provider("MANUAL")

    assert isinstance(provider, MockManualProvider)


def test_channel_lookup_is_case_insensitive():
    provider = get_recovery_provider("email")

    assert isinstance(provider, MockEmailProvider)


def test_unknown_channel_raises_error():
    with pytest.raises(ValueError, match="Unsupported recovery channel"):
        get_recovery_provider("UNKNOWN")