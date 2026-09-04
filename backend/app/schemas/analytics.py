from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class StrategyMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    strategy: str
    attempts: int
    successful_attempts: int
    failed_attempts: int
    success_rate: float
    recovered_revenue: Decimal


class AnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    period_days: int
    period_start: datetime
    period_end: datetime

    revenue_at_risk: Decimal
    verified_recovered_revenue: Decimal
    unrecovered_revenue: Decimal
    recovery_rate: float

    failed_transactions: int
    active_cases: int
    recovered_cases: int
    escalated_cases: int

    total_attempts: int
    successful_attempts: int
    failed_attempts: int

    intervention_success_rate: float
    escalation_rate: float

    average_recovery_time_minutes: float

    payment_retry_attempts: int
    customer_contact_attempts: int
    manual_review_cases: int

    strategy_metrics: list[StrategyMetricResponse]