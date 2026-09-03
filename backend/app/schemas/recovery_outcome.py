from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RecoveryOutcomeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    merchant_id: UUID
    recovery_case_id: UUID
    recovery_attempt_id: UUID

    outcome: str
    verification_status: str

    recovered_amount: Decimal
    currency: str

    provider_reference: str | None
    verification_source: str
    reason: str | None

    verified_at: datetime