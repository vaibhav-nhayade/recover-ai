from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent


def record_audit_event(
    *,
    merchant_id: UUID,
    db: Session,
    event_type: str,
    actor: str = "RECOVERAI_AGENT",
    recovery_case_id: UUID | None = None,
    transaction_id: UUID | None = None,
    action: str | None = None,
    status: str | None = None,
    reason: str | None = None,
    event_data: dict[str, Any] | None = None,
) -> AuditEvent:
    """
    Persist an immutable business-level audit event.

    Audit events capture:
        - what happened
        - who/what caused it
        - which case/transaction was affected
        - selected action
        - resulting status
        - decision reason
        - structured decision metadata
    """

    event = AuditEvent(
        merchant_id=merchant_id,
        recovery_case_id=recovery_case_id,
        transaction_id=transaction_id,
        event_type=event_type,
        actor=actor,
        action=action,
        status=status,
        reason=reason,
        event_data=event_data or {},
        occurred_at=datetime.now(timezone.utc),
    )

    db.add(event)
    db.flush()

    return event


def get_case_audit_events(
    *,
    merchant_id: UUID,
    recovery_case_id: UUID,
    db: Session,
) -> list[AuditEvent]:
    """
    Return the chronological audit history for one recovery case.
    """

    return list(
        db.scalars(
            select(AuditEvent)
            .where(
                AuditEvent.merchant_id == merchant_id,
                AuditEvent.recovery_case_id == recovery_case_id,
            )
            .order_by(
                AuditEvent.occurred_at.asc(),
                AuditEvent.created_at.asc(),
            )
        ).all()
    )