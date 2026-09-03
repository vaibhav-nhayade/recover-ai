from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.transaction import Transaction
from app.schemas.recovery_score import RecoveryScoreResponse
from app.services.recovery_scoring import score_transaction


router = APIRouter(
    prefix="/recovery-scoring",
    tags=["Recovery Scoring"],
)


@router.get(
    "/transaction/{transaction_id}",
    response_model=RecoveryScoreResponse,
)
def get_transaction_recovery_score(
    transaction_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> RecoveryScoreResponse:
    """
    Predict the probability that a failed transaction can be recovered.
    """

    transaction = db.scalar(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.merchant_id == current_merchant.id,
        )
    )

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    if transaction.status.upper() != "FAILED":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Recovery scoring is only available for failed transactions.",
        )

    result = score_transaction(
        transaction=transaction,
        db=db,
    )

    return RecoveryScoreResponse(
        transaction_id=transaction.id,
        transaction_reference=transaction.transaction_reference,
        amount=transaction.amount,
        currency=transaction.currency,
        probability=result.probability,
        probability_percent=round(result.probability * 100, 2),
        confidence=result.confidence,
        confidence_percent=round(result.confidence * 100, 2),
        score=result.score,
        risk_band=result.risk_band,
        recommended_strategy=result.recommended_strategy,
        features=result.features,
        evidence=result.evidence,
    )