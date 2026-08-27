from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.services.recovery_config import MAX_RECOVERY_ATTEMPTS


RETRYABLE_CASE_STATUSES = {
    "FAILED",
    "IN_PROGRESS",
}


def can_retry_recovery(
    recovery_case: RecoveryCase,
    db: Session,
) -> bool:
    """
    Determine whether a recovery case is eligible for another attempt.
    """

    if recovery_case.status in {"RECOVERED", "CLOSED"}:
        return False

    if recovery_case.status not in RETRYABLE_CASE_STATUSES:
        return False

    attempt_count = db.scalar(
        select(func.count(RecoveryAttempt.id)).where(
            RecoveryAttempt.recovery_case_id == recovery_case.id,
        )
    ) or 0

    if attempt_count >= MAX_RECOVERY_ATTEMPTS:
        return False

    latest_attempt = db.scalar(
        select(RecoveryAttempt)
        .where(
            RecoveryAttempt.recovery_case_id == recovery_case.id,
        )
        .order_by(
            RecoveryAttempt.created_at.desc()
        )
    )

    if not latest_attempt:
        return False

    if latest_attempt.status != "FAILED":
        return False

    return True