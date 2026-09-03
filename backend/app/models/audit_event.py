from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AuditEvent(TimestampMixin, Base):
    __tablename__ = "audit_events"

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

    recovery_case_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("recovery_cases.id"),
        nullable=True,
        index=True,
    )

    transaction_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("transactions.id"),
        nullable=True,
        index=True,
    )

    event_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    actor: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="RECOVERAI_AGENT",
    )

    action: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    status: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    event_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )


Index(
    "ix_audit_events_merchant_occurred",
    AuditEvent.merchant_id,
    AuditEvent.occurred_at,
)

Index(
    "ix_audit_events_case_occurred",
    AuditEvent.recovery_case_id,
    AuditEvent.occurred_at,
)