from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Transaction(TimestampMixin, Base):
    __tablename__ = "transactions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    merchant_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    transaction_reference: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )

    customer_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    customer_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        nullable=False,
    )

    payment_method: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        default="FAILED",
        nullable=False,
        index=True,
    )

    failure_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )