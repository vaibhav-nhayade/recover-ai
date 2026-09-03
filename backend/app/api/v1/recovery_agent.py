from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.schemas.recovery_agent import (
    AgentCaseResultResponse,
    AgentRunResponse,
)
from app.services.recovery_agent import run_recovery_agent


router = APIRouter(
    prefix="/recovery-agent",
    tags=["Recovery Agent"],
)


@router.post(
    "/run",
    response_model=AgentRunResponse,
)
def run_agent(
    limit: int = Query(
        default=100,
        ge=1,
        le=100,
    ),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> AgentRunResponse:
    """
    Run one bounded autonomous revenue-recovery cycle.
    """

    result = run_recovery_agent(
        merchant_id=current_merchant.id,
        db=db,
        limit=limit,
    )

    return AgentRunResponse(
        run_id=result.run_id,
        merchant_id=result.merchant_id,
        cases_detected=result.cases_detected,
        cases_processed=result.cases_processed,
        recovered_cases=result.recovered_cases,
        escalated_cases=result.escalated_cases,
        failed_cases=result.failed_cases,
        revenue_at_risk=result.revenue_at_risk,
        recovered_revenue=result.recovered_revenue,
        recovery_rate=result.recovery_rate,
        results=[
            AgentCaseResultResponse(
                case_id=item.case_id,
                transaction_id=item.transaction_id,
                transaction_reference=item.transaction_reference,
                amount_at_risk=item.amount_at_risk,
                action=item.action,
                status=item.status,
                recovered_amount=item.recovered_amount,
                escalation_required=item.escalation_required,
                reason=item.reason,
            )
            for item in result.results
        ],
    )