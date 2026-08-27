from uuid import uuid4

from app.services.recovery_provider import (
    RecoveryProvider,
    RecoveryProviderResult,
)


class MockRecoveryProvider(RecoveryProvider):
    """
    Development provider used until real external providers
    are integrated.
    """

    def execute(
        self,
        action: str,
        message: str,
        recipient: str | None = None,
    ) -> RecoveryProviderResult:
        """Simulate a successful recovery action."""

        return RecoveryProviderResult(
            success=True,
            provider_reference=f"MOCK-{uuid4().hex[:12].upper()}",
            message=message,
        )