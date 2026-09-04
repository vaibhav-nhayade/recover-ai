from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.schemas.analytics import (
    AnalyticsResponse,
    StrategyMetricResponse,
)
from app.services.analytics_service import calculate_analytics


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get(
    "",
    response_model=AnalyticsResponse,
)
def get_analytics(
    period_days: int = Query(
        default=30,
        ge=1,
        le=365,
    ),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> AnalyticsResponse:
    """
    Return database-backed revenue recovery analytics.

    Supported period:
        1–365 days.

    Revenue recovery metrics are based on verified RecoveryOutcome
    records rather than simulated batch estimates.
    """

    result = calculate_analytics(
        merchant_id=current_merchant.id,
        db=db,
        period_days=period_days,
    )

    return AnalyticsResponse(
        period_days=result.period_days,
        period_start=result.period_start,
        period_end=result.period_end,
        revenue_at_risk=result.revenue_at_risk,
        verified_recovered_revenue=result.verified_recovered_revenue,
        unrecovered_revenue=result.unrecovered_revenue,
        recovery_rate=result.recovery_rate,
        failed_transactions=result.failed_transactions,
        active_cases=result.active_cases,
        recovered_cases=result.recovered_cases,
        escalated_cases=result.escalated_cases,
        total_attempts=result.total_attempts,
        successful_attempts=result.successful_attempts,
        failed_attempts=result.failed_attempts,
        intervention_success_rate=result.intervention_success_rate,
        escalation_rate=result.escalation_rate,
        average_recovery_time_minutes=result.average_recovery_time_minutes,
        payment_retry_attempts=result.payment_retry_attempts,
        customer_contact_attempts=result.customer_contact_attempts,
        manual_review_cases=result.manual_review_cases,
        strategy_metrics=[
            StrategyMetricResponse(
                strategy=item.strategy,
                attempts=item.attempts,
                successful_attempts=item.successful_attempts,
                failed_attempts=item.failed_attempts,
                success_rate=item.success_rate,
                recovered_revenue=item.recovered_revenue,
            )
            for item in result.strategy_metrics
        ],
    )