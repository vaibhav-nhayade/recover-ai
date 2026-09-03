from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.services.recovery_config import MAX_RECOVERY_ATTEMPTS


@dataclass(frozen=True)
class RetryDecision:
    allowed: bool
    should_escalate: bool
    attempt_count: int
    remaining_attempts: int
    reason: str


def count_recovery_attempts(
    case_id: UUID,
    db: Session,
) -> int:
    return int(
        db.scalar(
            select(func.count(RecoveryAttempt.id)).where(
                RecoveryAttempt.recovery_case_id == case_id,
            )
        )
        or 0
    )


def get_latest_recovery_attempt(
    case_id: UUID,
    db: Session,
) -> RecoveryAttempt | None:
    return db.scalar(
        select(RecoveryAttempt)
        .where(
            RecoveryAttempt.recovery_case_id == case_id,
        )
        .order_by(
            RecoveryAttempt.created_at.desc(),
        )
    )


def has_pending_recovery_attempt(
    case_id: UUID,
    db: Session,
) -> bool:
    return (
        db.scalar(
            select(func.count(RecoveryAttempt.id)).where(
                RecoveryAttempt.recovery_case_id == case_id,
                RecoveryAttempt.status == "PENDING",
            )
        )
        or 0
    ) > 0


def can_retry_recovery(
    case: RecoveryCase,
    db: Session,
) -> bool:
    """
    Determine whether autonomous recovery may execute another attempt.

    Retry policy:
        - RECOVERED/CLOSED -> never retry
        - PENDING attempt -> never create another attempt
        - OPEN with zero attempts -> allowed
        - FAILED -> only retry when the latest attempt failed
        - IN_PROGRESS -> never duplicate execution
        - maximum attempts -> never retry
    """

    if case.status in {"RECOVERED", "CLOSED"}:
        return False

    if has_pending_recovery_attempt(case.id, db):
        return False

    attempt_count = count_recovery_attempts(
        case.id,
        db,
    )

    if attempt_count >= MAX_RECOVERY_ATTEMPTS:
        return False

    if case.status == "OPEN":
        return attempt_count == 0

    if case.status == "FAILED":
        latest_attempt = get_latest_recovery_attempt(
            case.id,
            db,
        )

        return (
            latest_attempt is not None
            and latest_attempt.status == "FAILED"
        )

    return False


def get_retry_decision(
    case: RecoveryCase,
    db: Session,
) -> RetryDecision:
    """
    Return an explicit retry/stop/escalation decision.

    This is the policy boundary for autonomous retry execution.
    """

    attempt_count = count_recovery_attempts(
        case.id,
        db,
    )

    remaining_attempts = max(
        0,
        MAX_RECOVERY_ATTEMPTS - attempt_count,
    )

    if case.status == "RECOVERED":
        return RetryDecision(
            allowed=False,
            should_escalate=False,
            attempt_count=attempt_count,
            remaining_attempts=remaining_attempts,
            reason="Revenue has already been recovered.",
        )

    if case.status == "CLOSED":
        return RetryDecision(
            allowed=False,
            should_escalate=False,
            attempt_count=attempt_count,
            remaining_attempts=remaining_attempts,
            reason="Recovery case is already closed.",
        )

    if has_pending_recovery_attempt(case.id, db):
        return RetryDecision(
            allowed=False,
            should_escalate=False,
            attempt_count=attempt_count,
            remaining_attempts=remaining_attempts,
            reason="A recovery attempt is already pending; duplicate execution is blocked.",
        )

    if attempt_count >= MAX_RECOVERY_ATTEMPTS:
        return RetryDecision(
            allowed=False,
            should_escalate=True,
            attempt_count=attempt_count,
            remaining_attempts=0,
            reason=(
                "Maximum autonomous recovery attempts reached. "
                "Further automated execution is blocked and human review is required."
            ),
        )

    if case.status == "OPEN" and attempt_count == 0:
        return RetryDecision(
            allowed=True,
            should_escalate=False,
            attempt_count=attempt_count,
            remaining_attempts=remaining_attempts,
            reason="Initial autonomous recovery attempt is allowed.",
        )

    if case.status == "FAILED":
        latest_attempt = get_latest_recovery_attempt(
            case.id,
            db,
        )

        if latest_attempt is None:
            return RetryDecision(
                allowed=False,
                should_escalate=True,
                attempt_count=attempt_count,
                remaining_attempts=remaining_attempts,
                reason=(
                    "Case is marked failed but has no recorded recovery attempt. "
                    "Automatic execution is blocked pending review."
                ),
            )

        if latest_attempt.status != "FAILED":
            return RetryDecision(
                allowed=False,
                should_escalate=False,
                attempt_count=attempt_count,
                remaining_attempts=remaining_attempts,
                reason=(
                    "The latest recovery attempt is not failed; "
                    "another autonomous attempt cannot be started."
                ),
            )

        return RetryDecision(
            allowed=True,
            should_escalate=False,
            attempt_count=attempt_count,
            remaining_attempts=remaining_attempts,
            reason=(
                f"Previous recovery attempt failed. "
                f"Bounded retry {attempt_count + 1} of "
                f"{MAX_RECOVERY_ATTEMPTS} is allowed."
            ),
        )

    return RetryDecision(
        allowed=False,
        should_escalate=False,
        attempt_count=attempt_count,
        remaining_attempts=remaining_attempts,
        reason=(
            f"Case status '{case.status}' is not eligible for autonomous execution."
        ),
    )