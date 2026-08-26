from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RecoveryAttemptCreateRequest(BaseModel):
    recovery_case_id: UUID
    channel: str = Field(min_length=1, max_length=32)
    action: str = Field(min_length=1, max_length=64)
    message: str | None = None


class RecoveryAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recovery_case_id: UUID
    channel: str
    action: str
    status: str
    message: str | None
    provider_reference: str | None
    attempted_at: datetime
    created_at: datetime
    updated_at: datetime