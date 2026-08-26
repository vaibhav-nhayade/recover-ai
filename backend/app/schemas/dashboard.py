from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

class DashboardSummaryResponse(BaseModel):
    total_transactions: int
    failed_transactions: int
    total_transaction_amount: Decimal
    total_amount_at_risk: Decimal
    total_recovery_cases: int
    open_recovery_cases: int
    recovered_recovery_cases: int
    total_recovery_attempts: int
    completed_recovery_attempts: int
    recovery_rate: Decimal



class RecentRecoveryAttemptResponse(BaseModel):
    id: UUID
    recovery_case_id: UUID
    channel: str
    action: str
    status: str
    attempted_at: datetime