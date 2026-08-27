from uuid import uuid4

from app.services.recovery_provider import (
    RecoveryProvider,
    RecoveryProviderResult,
)


class MockPaymentProvider(RecoveryProvider):
    """Mock provider for payment recovery actions."""

    def execute(
        self,
        action: str,
        message: str,
        recipient: str | None = None,
    ) -> RecoveryProviderResult:
        return RecoveryProviderResult(
            success=True,
            provider_reference=f"MOCK-PAY-{uuid4().hex[:12].upper()}",
            message=message,
        )


class MockEmailProvider(RecoveryProvider):
    """Mock provider for email recovery actions."""

    def execute(
        self,
        action: str,
        message: str,
        recipient: str | None = None,
    ) -> RecoveryProviderResult:
        return RecoveryProviderResult(
            success=True,
            provider_reference=f"MOCK-EMAIL-{uuid4().hex[:12].upper()}",
            message=message,
        )


class MockManualProvider(RecoveryProvider):
    """Mock provider for manual recovery actions."""

    def execute(
        self,
        action: str,
        message: str,
        recipient: str | None = None,
    ) -> RecoveryProviderResult:
        return RecoveryProviderResult(
            success=True,
            provider_reference=f"MOCK-MANUAL-{uuid4().hex[:12].upper()}",
            message=message,
        )