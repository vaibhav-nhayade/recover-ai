from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class RecoveryOutcome(TimestampMixin, Base):
    __tablename__ = "recovery_outcomes"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    merchant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("merchants.id"),
        nullable=False,
        index=True,
    )

    recovery_case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("recovery_cases.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    recovery_attempt_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("recovery_attempts.id"),
        nullable=False,
        index=True,
    )

    outcome: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    verification_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="VERIFIED",
    )

    recovered_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0"),
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="INR",
    )

    provider_reference: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    verification_source: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="RECOVERY_PROVIDER",
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )