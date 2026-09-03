from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.schemas.audit_event import AuditEventResponse
from app.services.audit_service import get_case_audit_events


router = APIRouter(
    prefix="/audit",
    tags=["Audit Trail"],
)


@router.get(
    "/case/{case_id}",
    response_model=list[AuditEventResponse],
)
def get_recovery_case_audit(
    case_id: UUID,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> list[AuditEventResponse]:
    """
    Return the complete chronological audit trail for a recovery case.
    """

    events = get_case_audit_events(
        merchant_id=current_merchant.id,
        recovery_case_id=case_id,
        db=db,
    )

    return [
        AuditEventResponse.model_validate(event)
        for event in events
    ]