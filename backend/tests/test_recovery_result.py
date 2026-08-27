from types import SimpleNamespace

from app.services.recovery_result import apply_recovery_result
from app.services.recovery_provider import RecoveryProviderResult


class FakeSession:
    def commit(self):
        pass

    def refresh(self, obj):
        pass


def test_successful_provider_result_completes_attempt():
    attempt = SimpleNamespace(
        provider_reference=None,
        message=None,
        status="PENDING",
    )

    recovery_case = SimpleNamespace(
        status="IN_PROGRESS",
    )

    provider_result = RecoveryProviderResult(
        success=True,
        provider_reference="MOCK-123",
        message="Payment retry sent.",
    )

    result = apply_recovery_result(
        attempt=attempt,
        recovery_case=recovery_case,
        provider_result=provider_result,
        db=FakeSession(),
    )

    assert result.status == "COMPLETED"
    assert result.provider_reference == "MOCK-123"
    assert result.message == "Payment retry sent."
    assert recovery_case.status == "RECOVERED"


def test_failed_provider_result_fails_attempt():
    attempt = SimpleNamespace(
        provider_reference=None,
        message=None,
        status="PENDING",
    )

    recovery_case = SimpleNamespace(
        status="IN_PROGRESS",
    )

    provider_result = RecoveryProviderResult(
        success=False,
        provider_reference="MOCK-FAIL",
        message="Provider failed.",
    )

    result = apply_recovery_result(
        attempt=attempt,
        recovery_case=recovery_case,
        provider_result=provider_result,
        db=FakeSession(),
    )

    assert result.status == "FAILED"
    assert result.provider_reference == "MOCK-FAIL"
    assert result.message == "Provider failed."
    assert recovery_case.status == "FAILED"