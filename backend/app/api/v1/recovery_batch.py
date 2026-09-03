from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.transaction import Transaction
from app.schemas.recovery_batch import (
    BatchRecoveryResultResponse,
    BatchRecoverySummaryResponse,
)
from app.services.recovery_batch import evaluate_batch


router = APIRouter(
    prefix="/recovery-batch",
    tags=["Recovery Batch"],
)


@router.post(
    "/evaluate",
    response_model=BatchRecoverySummaryResponse,
)
def evaluate_recovery_batch(
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> BatchRecoverySummaryResponse:
    """
    Evaluate the merchant's most recent failed transactions.

    This endpoint performs an AI recovery evaluation only.
    It does not execute real payment retries or contact customers.
    """

    transactions = db.scalars(
        select(Transaction)
        .where(
            Transaction.merchant_id == current_merchant.id,
            Transaction.status == "FAILED",
        )
        .order_by(
            Transaction.occurred_at.desc()
        )
        .limit(limit)
    ).all()

    if not transactions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No failed transactions are available for batch evaluation.",
        )

    summary = evaluate_batch(
        transactions=transactions,
        db=db,
    )

    return BatchRecoverySummaryResponse(
        total_transactions=summary.total_transactions,
        eligible_transactions=summary.eligible_transactions,
        skipped_transactions=summary.skipped_transactions,
        revenue_at_risk=summary.revenue_at_risk,
        expected_recovery=summary.expected_recovery,
        recovered_revenue=summary.recovered_revenue,
        recovery_rate=summary.recovery_rate,
        intervention_success_rate=summary.intervention_success_rate,
        average_recovery_probability=summary.average_recovery_probability,
        average_confidence=summary.average_confidence,
        human_escalations=summary.human_escalations,
        results=[
            BatchRecoveryResultResponse(
                transaction_id=result.transaction_id,
                transaction_reference=result.transaction_reference,
                amount=result.amount,
                recovery_probability=result.recovery_probability,
                confidence=result.confidence,
                risk_band=result.risk_band,
                selected_strategy=result.selected_strategy,
                selected_channel=result.selected_channel,
                intervention_score=result.intervention_score,
                expected_recovery=result.expected_recovery,
                simulated_recovered_amount=result.simulated_recovered_amount,
                outcome=result.outcome,
                evidence=result.evidence,
            )
            for result in summary.results
        ],
    )