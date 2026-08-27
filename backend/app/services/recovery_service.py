from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.services.provider_factory import get_recovery_provider
from app.services.recovery_channel import determine_recovery_channel
from app.services.recovery_engine import determine_recovery_strategy
from app.services.recovery_message import generate_recovery_message
from app.services.recovery_result import apply_recovery_result
from app.services.recovery_retry import can_retry_recovery


def process_recovery_case(
    case_id: UUID,
    merchant_id: UUID,
    db: Session,
) -> RecoveryAttempt:
    """
    Process a recovery case, determine its strategy and channel,
    generate a message, execute the action through the appropriate
    provider, and record the result.
    """

    case = db.scalar(
        select(RecoveryCase).where(
            RecoveryCase.id == case_id,
            RecoveryCase.merchant_id == merchant_id,
        )
    )

    if not case:
        raise ValueError("Recovery case not found.")

    if case.status in {"RECOVERED", "CLOSED"}:
        raise ValueError(
            f"Cannot process a recovery case with status '{case.status}'."
        )

    if case.status == "FAILED":
        if not can_retry_recovery(case, db):
            raise ValueError(
                "Recovery case cannot be retried."
            )

    transaction = db.scalar(
        select(Transaction).where(
            Transaction.id == case.transaction_id,
            Transaction.merchant_id == merchant_id,
        )
    )

    if not transaction:
        raise ValueError("Transaction not found.")

    existing_attempt = db.scalar(
        select(RecoveryAttempt)
        .where(
            RecoveryAttempt.recovery_case_id == case.id,
            RecoveryAttempt.status == "PENDING",
        )
        .order_by(RecoveryAttempt.created_at.desc())
    )

    if existing_attempt:
        return existing_attempt

    strategy = determine_recovery_strategy(
        transaction=transaction,
        recovery_case=case,
    )

    channel = determine_recovery_channel(strategy)

    message = generate_recovery_message(
        transaction=transaction,
        recovery_case=case,
        strategy=strategy,
    )

    provider = get_recovery_provider(channel)

    provider_result = provider.execute(
        action=strategy,
        message=message,
        recipient=transaction.customer_email,
    )

    case.recovery_strategy = strategy

    if provider_result.success:
        case.status = "RECOVERED"
    else:
        case.status = "FAILED"

    attempt = RecoveryAttempt(
        recovery_case_id=case.id,
        channel=channel,
        action=strategy,
        status="PENDING",
        message=message,
        attempted_at=datetime.now(timezone.utc),
    )

    db.add(attempt)
    db.flush()

    return apply_recovery_result(
        attempt=attempt,
        recovery_case=case,
        provider_result=provider_result,
        db=db,
    )