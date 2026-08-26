from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RecoveryCaseCreateRequest(BaseModel):
    transaction_id: UUID

    reason: str = Field(
        min_length=1,
        max_length=100,
    )

    priority: str = Field(
        default="MEDIUM",
        max_length=16,
    )

    recovery_strategy: str | None = Field(
        default=None,
        max_length=64,
    )

    notes: str | None = None


class RecoveryCaseStatusUpdateRequest(BaseModel):
    status: str = Field(
        min_length=1,
        max_length=32,
    )


class RecoveryCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    merchant_id: UUID
    transaction_id: UUID
    amount_at_risk: Decimal
    reason: str
    status: str
    priority: str
    recovery_strategy: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime