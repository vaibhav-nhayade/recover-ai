from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class RecoveryProviderResult:
    success: bool
    provider_reference: str | None = None
    message: str | None = None


class RecoveryProvider(ABC):
    """Base interface for recovery action providers."""

    @abstractmethod
    def execute(
        self,
        action: str,
        message: str,
        recipient: str | None = None,
    ) -> RecoveryProviderResult:
        """
        Execute a recovery action through the provider.
        """
        raise NotImplementedError