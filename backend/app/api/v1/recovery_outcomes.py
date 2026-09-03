from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.recovery_case import RecoveryCase
from app.schemas.recovery_outcome import RecoveryOutcomeResponse
from app.services.recovery_outcome import get_recovery_outcome


router = APIRouter(
    prefix="/recovery-outcomes",
    tags=["Recovery Outcomes"],
)


@router.get(
    "/case/{case_id}",
    response_model=RecoveryOutcomeResponse,
)
def get_case_recovery_outcome(
    case_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryOutcomeResponse:
    case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.id == case_id,
            RecoveryCase.merchant_id == current_merchant.id,
        )
    )

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery case not found.",
        )

    outcome = get_recovery_outcome(
        case_id=case.id,
        db=db,
    )

    if not outcome:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery outcome has not been recorded.",
        )

    return RecoveryOutcomeResponse.model_validate(outcome)