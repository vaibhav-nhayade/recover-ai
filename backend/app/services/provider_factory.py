from app.services.channel_providers import (
    MockEmailProvider,
    MockManualProvider,
    MockPaymentProvider,
)
from app.services.recovery_provider import RecoveryProvider


def get_recovery_provider(channel: str) -> RecoveryProvider:
    """
    Return the provider responsible for a recovery channel.
    """

    providers = {
        "PAYMENT": MockPaymentProvider(),
        "EMAIL": MockEmailProvider(),
        "MANUAL": MockManualProvider(),
    }

    try:
        return providers[channel.upper()]
    except KeyError as exc:
        raise ValueError(
            f"Unsupported recovery channel: {channel}"
        ) from exc