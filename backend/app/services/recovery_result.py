from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.services.recovery_provider import RecoveryProviderResult


def apply_recovery_result(
    attempt: RecoveryAttempt,
    recovery_case: RecoveryCase,
    provider_result: RecoveryProviderResult,
    db: Session,
) -> RecoveryAttempt:
    """
    Apply a provider result to the recovery attempt and case.

    The attempt and recovery case are committed together so their
    final states remain synchronized.
    """

    attempt.provider_reference = provider_result.provider_reference

    if provider_result.message:
        attempt.message = provider_result.message

    if provider_result.success:
        attempt.status = "COMPLETED"
        recovery_case.status = "RECOVERED"
    else:
        attempt.status = "FAILED"
        recovery_case.status = "FAILED"

    db.commit()
    db.refresh(attempt)

    return attempt