from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class AgentCaseResultResponse(BaseModel):
    case_id: UUID
    transaction_id: UUID
    transaction_reference: str

    amount_at_risk: Decimal
    action: str
    status: str
    recovered_amount: Decimal

    escalation_required: bool
    reason: str


class AgentRunResponse(BaseModel):
    run_id: str
    merchant_id: UUID

    cases_detected: int
    cases_processed: int
    recovered_cases: int
    escalated_cases: int
    failed_cases: int

    revenue_at_risk: Decimal
    recovered_revenue: Decimal
    recovery_rate: float

    results: list[AgentCaseResultResponse]