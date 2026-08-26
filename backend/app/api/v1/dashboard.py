from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_merchant
from app.core.database import get_db
from app.models.merchant import Merchant
from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RecentRecoveryAttemptResponse,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def get_dashboard_summary(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    """Return recovery and transaction metrics for the merchant."""

    total_transactions = db.scalar(
        select(func.count(Transaction.id)).where(
            Transaction.merchant_id == current_merchant.id
        )
    ) or 0

    failed_transactions = db.scalar(
        select(func.count(Transaction.id)).where(
            Transaction.merchant_id == current_merchant.id,
            Transaction.status == "FAILED",
        )
    ) or 0

    total_transaction_amount = db.scalar(
        select(
            func.coalesce(
                func.sum(Transaction.amount),
                0,
            )
        ).where(
            Transaction.merchant_id == current_merchant.id
        )
    ) or Decimal("0")

    total_amount_at_risk = db.scalar(
        select(
            func.coalesce(
                func.sum(RecoveryCase.amount_at_risk),
                0,
            )
        ).where(
            RecoveryCase.merchant_id == current_merchant.id
        )
    ) or Decimal("0")

    total_recovery_cases = db.scalar(
        select(func.count(RecoveryCase.id)).where(
            RecoveryCase.merchant_id == current_merchant.id
        )
    ) or 0

    open_recovery_cases = db.scalar(
        select(func.count(RecoveryCase.id)).where(
            RecoveryCase.merchant_id == current_merchant.id,
            RecoveryCase.status == "OPEN",
        )
    ) or 0

    recovered_recovery_cases = db.scalar(
        select(func.count(RecoveryCase.id)).where(
            RecoveryCase.merchant_id == current_merchant.id,
            RecoveryCase.status == "RECOVERED",
        )
    ) or 0

    total_recovery_attempts = db.scalar(
        select(func.count(RecoveryAttempt.id))
        .join(
            RecoveryCase,
            RecoveryCase.id == RecoveryAttempt.recovery_case_id,
        )
        .where(
            RecoveryCase.merchant_id == current_merchant.id
        )
    ) or 0

    completed_recovery_attempts = db.scalar(
        select(func.count(RecoveryAttempt.id))
        .join(
            RecoveryCase,
            RecoveryCase.id == RecoveryAttempt.recovery_case_id,
        )
        .where(
            RecoveryCase.merchant_id == current_merchant.id,
            RecoveryAttempt.status == "COMPLETED",
        )
    ) or 0

    recovery_rate = (
        Decimal(recovered_recovery_cases)
        / Decimal(total_recovery_cases)
        * Decimal("100")
        if total_recovery_cases
        else Decimal("0")
    )

    return DashboardSummaryResponse(
        total_transactions=total_transactions,
        failed_transactions=failed_transactions,
        total_transaction_amount=total_transaction_amount,
        total_amount_at_risk=total_amount_at_risk,
        total_recovery_cases=total_recovery_cases,
        open_recovery_cases=open_recovery_cases,
        recovered_recovery_cases=recovered_recovery_cases,
        total_recovery_attempts=total_recovery_attempts,
        completed_recovery_attempts=completed_recovery_attempts,
        recovery_rate=recovery_rate,
    )


@router.get(
    "/recent-attempts",
    response_model=list[RecentRecoveryAttemptResponse],
)
def get_recent_recovery_attempts(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
) -> list[RecentRecoveryAttemptResponse]:
    """Return the merchant's most recent recovery attempts."""

    attempts = db.scalars(
        select(RecoveryAttempt)
        .join(
            RecoveryCase,
            RecoveryCase.id == RecoveryAttempt.recovery_case_id,
        )
        .where(
            RecoveryCase.merchant_id == current_merchant.id,
        )
        .order_by(
            RecoveryAttempt.attempted_at.desc()
        )
        .limit(10)
    ).all()

    return [
        RecentRecoveryAttemptResponse.model_validate(attempt)
        for attempt in attempts
    ]