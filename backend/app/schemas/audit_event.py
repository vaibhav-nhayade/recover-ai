from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    merchant_id: UUID
    recovery_case_id: UUID | None
    transaction_id: UUID | None
    event_type: str
    actor: str
    action: str | None
    status: str | None
    reason: str | None
    event_data: dict[str, Any]
    occurred_at: datetime