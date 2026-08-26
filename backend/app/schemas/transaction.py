from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TransactionCreateRequest(BaseModel):
    transaction_reference: str = Field(
        min_length=1,
        max_length=64,
    )
    customer_name: str | None = Field(
        default=None,
        max_length=150,
    )
    customer_email: EmailStr | None = None
    amount: Decimal = Field(
        gt=0,
        decimal_places=2,
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
    )
    payment_method: str | None = Field(
        default=None,
        max_length=32,
    )
    status: str = Field(
        default="FAILED",
        max_length=32,
    )
    failure_reason: str | None = None
    occurred_at: datetime


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    merchant_id: UUID
    transaction_reference: str
    customer_name: str | None
    customer_email: EmailStr | None
    amount: Decimal
    currency: str
    payment_method: str | None
    status: str
    failure_reason: str | None
    occurred_at: datetime
    created_at: datetime
    updated_at: datetime