from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BatchRecoveryResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    transaction_id: UUID
    transaction_reference: str
    amount: Decimal

    recovery_probability: float
    confidence: float
    risk_band: str

    selected_strategy: str
    selected_channel: str
    intervention_score: float

    expected_recovery: Decimal
    simulated_recovered_amount: Decimal

    outcome: str
    evidence: list[str]


class BatchRecoverySummaryResponse(BaseModel):
    total_transactions: int
    eligible_transactions: int
    skipped_transactions: int

    revenue_at_risk: Decimal
    expected_recovery: Decimal
    recovered_revenue: Decimal

    recovery_rate: float
    intervention_success_rate: float

    average_recovery_probability: float
    average_confidence: float

    human_escalations: int

    results: list[BatchRecoveryResultResponse]