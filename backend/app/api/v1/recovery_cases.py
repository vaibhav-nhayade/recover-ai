from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.schemas.recovery_attempt import RecoveryAttemptResponse
from app.schemas.recovery_case import (
    RecoveryCaseCreateRequest,
    RecoveryCaseResponse,
    RecoveryCaseStatusUpdateRequest,
)
from app.services.recovery_case_service import (
    create_recovery_case_for_transaction,
)
from app.services.recovery_retry import can_retry_recovery
from app.services.recovery_service import process_recovery_case


router = APIRouter(
    prefix="/recovery-cases",
    tags=["Recovery Cases"],
)


@router.post(
    "",
    response_model=RecoveryCaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_recovery_case(
    payload: RecoveryCaseCreateRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryCaseResponse:
    """Create a recovery case for one of the merchant's transactions."""

    transaction = db.scalar(
        select(Transaction).where(
            Transaction.id == payload.transaction_id,
            Transaction.merchant_id == current_merchant.id,
        )
    )

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    existing_case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.transaction_id == transaction.id,
        )
    )

    if existing_case:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A recovery case already exists for this transaction.",
        )

    case = RecoveryCase(
        merchant_id=current_merchant.id,
        transaction_id=transaction.id,
        amount_at_risk=transaction.amount,
        reason=payload.reason,
        status="OPEN",
        priority=payload.priority.upper(),
        recovery_strategy=payload.recovery_strategy,
        notes=payload.notes,
    )

    db.add(case)
    db.commit()
    db.refresh(case)

    return RecoveryCaseResponse.model_validate(case)


@router.post(
    "/{transaction_id}/auto-create",
    response_model=RecoveryCaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def auto_create_recovery_case(
    transaction_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryCaseResponse:
    """
    Automatically create a recovery case when the transaction
    is eligible for recovery.
    """

    try:
        case = create_recovery_case_for_transaction(
            transaction_id=transaction_id,
            merchant_id=current_merchant.id,
            db=db,
        )
    except ValueError as exc:
        message = str(exc)

        if message == "Transaction not found.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=message,
        ) from exc

    return RecoveryCaseResponse.model_validate(case)


@router.get(
    "",
    response_model=list[RecoveryCaseResponse],
)
def list_recovery_cases(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> list[RecoveryCaseResponse]:
    """List recovery cases belonging to the authenticated merchant."""

    cases = db.scalars(
        select(RecoveryCase)
        .where(
            RecoveryCase.merchant_id == current_merchant.id,
        )
        .order_by(RecoveryCase.created_at.desc())
    ).all()

    return [
        RecoveryCaseResponse.model_validate(case)
        for case in cases
    ]


@router.get(
    "/{case_id}",
    response_model=RecoveryCaseResponse,
)
def get_recovery_case(
    case_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryCaseResponse:
    """Get one recovery case belonging to the merchant."""

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

    return RecoveryCaseResponse.model_validate(case)


@router.patch(
    "/{case_id}/status",
    response_model=RecoveryCaseResponse,
)
def update_recovery_case_status(
    case_id: UUID,
    payload: RecoveryCaseStatusUpdateRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryCaseResponse:
    """Update the status of a recovery case."""

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

    allowed_statuses = {
        "OPEN",
        "IN_PROGRESS",
        "RECOVERED",
        "FAILED",
        "CLOSED",
    }

    new_status = payload.status.upper()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Invalid status. Allowed values: "
                "OPEN, IN_PROGRESS, RECOVERED, FAILED, CLOSED."
            ),
        )

    case.status = new_status

    db.commit()
    db.refresh(case)

    return RecoveryCaseResponse.model_validate(case)


@router.post(
    "/{case_id}/process",
    response_model=RecoveryAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
def process_case(
    case_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryAttemptResponse:
    """Process a recovery case and create a recovery attempt."""

    try:
        attempt = process_recovery_case(
            case_id=case_id,
            merchant_id=current_merchant.id,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return RecoveryAttemptResponse.model_validate(attempt)


@router.post(
    "/{case_id}/retry",
    response_model=RecoveryAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
def retry_case(
    case_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryAttemptResponse:
    """Retry a failed recovery case."""

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

    if not can_retry_recovery(case, db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Recovery case cannot be retried.",
        )

    case.status = "IN_PROGRESS"
    db.commit()

    try:
        attempt = process_recovery_case(
            case_id=case.id,
            merchant_id=current_merchant.id,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return RecoveryAttemptResponse.model_validate(attempt)