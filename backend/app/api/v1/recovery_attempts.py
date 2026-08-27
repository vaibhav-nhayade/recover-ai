from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.schemas.recovery_attempt import (
    RecoveryAttemptCreateRequest,
    RecoveryAttemptResponse,
    RecoveryAttemptStatusUpdateRequest,
)


router = APIRouter(
    prefix="/recovery-attempts",
    tags=["Recovery Attempts"],
)


@router.post(
    "",
    response_model=RecoveryAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_recovery_attempt(
    payload: RecoveryAttemptCreateRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryAttemptResponse:
    """Record a recovery action for one of the merchant's cases."""

    recovery_case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.id == payload.recovery_case_id,
            RecoveryCase.merchant_id == current_merchant.id,
        )
    )

    if not recovery_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery case not found.",
        )

    attempt = RecoveryAttempt(
        recovery_case_id=recovery_case.id,
        channel=payload.channel.upper(),
        action=payload.action.upper(),
        status="PENDING",
        message=payload.message,
        attempted_at=datetime.now(timezone.utc),
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return RecoveryAttemptResponse.model_validate(attempt)


@router.get(
    "",
    response_model=list[RecoveryAttemptResponse],
)
def list_recovery_attempts(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> list[RecoveryAttemptResponse]:
    """List recovery attempts belonging to the authenticated merchant."""

    attempts = db.scalars(
        select(RecoveryAttempt)
        .join(
            RecoveryCase,
            RecoveryCase.id == RecoveryAttempt.recovery_case_id,
        )
        .where(
            RecoveryCase.merchant_id == current_merchant.id,
        )
        .order_by(
            RecoveryAttempt.attempted_at.desc()
        )
    ).all()

    return [
        RecoveryAttemptResponse.model_validate(attempt)
        for attempt in attempts
    ]


@router.get(
    "/case/{case_id}",
    response_model=list[RecoveryAttemptResponse],
)
def list_recovery_attempts_for_case(
    case_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> list[RecoveryAttemptResponse]:
    """List recovery attempts belonging to one recovery case."""

    recovery_case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.id == case_id,
            RecoveryCase.merchant_id == current_merchant.id,
        )
    )

    if not recovery_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery case not found.",
        )

    attempts = db.scalars(
        select(RecoveryAttempt)
        .where(
            RecoveryAttempt.recovery_case_id == recovery_case.id,
        )
        .order_by(
            RecoveryAttempt.attempted_at.desc()
        )
    ).all()

    return [
        RecoveryAttemptResponse.model_validate(attempt)
        for attempt in attempts
    ]


@router.get(
    "/{attempt_id}",
    response_model=RecoveryAttemptResponse,
)
def get_recovery_attempt(
    attempt_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryAttemptResponse:
    """Get one recovery attempt belonging to the merchant."""

    attempt = db.scalar(
        select(RecoveryAttempt)
        .join(
            RecoveryCase,
            RecoveryCase.id == RecoveryAttempt.recovery_case_id,
        )
        .where(
            RecoveryAttempt.id == attempt_id,
            RecoveryCase.merchant_id == current_merchant.id,
        )
    )

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery attempt not found.",
        )

    return RecoveryAttemptResponse.model_validate(attempt)


@router.patch(
    "/{attempt_id}/status",
    response_model=RecoveryAttemptResponse,
)
def update_recovery_attempt_status(
    attempt_id: UUID,
    payload: RecoveryAttemptStatusUpdateRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryAttemptResponse:
    """Update a recovery attempt and synchronize its recovery case."""

    attempt = db.scalar(
        select(RecoveryAttempt)
        .join(
            RecoveryCase,
            RecoveryCase.id == RecoveryAttempt.recovery_case_id,
        )
        .where(
            RecoveryAttempt.id == attempt_id,
            RecoveryCase.merchant_id == current_merchant.id,
        )
    )

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery attempt not found.",
        )

    allowed_statuses = {
        "PENDING",
        "COMPLETED",
        "FAILED",
    }

    new_status = payload.status.upper()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Invalid status. Allowed values: "
                "PENDING, COMPLETED, FAILED."
            ),
        )

    attempt.status = new_status

    recovery_case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.id == attempt.recovery_case_id,
            RecoveryCase.merchant_id == current_merchant.id,
        )
    )

    if recovery_case:
        if new_status == "COMPLETED":
            recovery_case.status = "RECOVERED"

        elif new_status == "FAILED":
            recovery_case.status = "FAILED"

        elif new_status == "PENDING":
            recovery_case.status = "IN_PROGRESS"

    db.commit()
    db.refresh(attempt)

    return RecoveryAttemptResponse.model_validate(attempt)