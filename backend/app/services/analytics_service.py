from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent
from app.models.recovery_attempt import RecoveryAttempt
from app.models.recovery_case import RecoveryCase
from app.models.recovery_outcome import RecoveryOutcome
from app.models.transaction import Transaction


@dataclass(frozen=True)
class StrategyMetric:
    strategy: str
    attempts: int
    successful_attempts: int
    failed_attempts: int
    success_rate: float
    recovered_revenue: Decimal


@dataclass(frozen=True)
class AnalyticsResult:
    period_days: int
    period_start: datetime
    period_end: datetime

    revenue_at_risk: Decimal
    verified_recovered_revenue: Decimal
    unrecovered_revenue: Decimal
    recovery_rate: float

    failed_transactions: int
    active_cases: int
    recovered_cases: int
    escalated_cases: int

    total_attempts: int
    successful_attempts: int
    failed_attempts: int

    intervention_success_rate: float
    escalation_rate: float

    average_recovery_time_minutes: float

    payment_retry_attempts: int
    customer_contact_attempts: int
    manual_review_cases: int

    strategy_metrics: list[StrategyMetric]


def _period_start(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


def _safe_rate(
    numerator: int | Decimal,
    denominator: int | Decimal,
) -> float:
    if denominator == 0:
        return 0.0

    return round(
        float(numerator) / float(denominator),
        4,
    )


def _strategy_metrics(
    merchant_id: UUID,
    period_start: datetime,
    period_end: datetime,
    db: Session,
) -> list[StrategyMetric]:
    rows = db.execute(
        select(
            RecoveryAttempt.action,
            func.count(RecoveryAttempt.id),
            func.sum(
                func.case(
                    (
                        RecoveryAttempt.status == "COMPLETED",
                        1,
                    ),
                    else_=0,
                )
            ),
            func.sum(
                func.case(
                    (
                        RecoveryAttempt.status == "FAILED",
                        1,
                    ),
                    else_=0,
                )
            ),
        )
        .join(
            RecoveryCase,
            RecoveryCase.id == RecoveryAttempt.recovery_case_id,
        )
        .where(
            RecoveryCase.merchant_id == merchant_id,
            RecoveryAttempt.created_at >= period_start,
            RecoveryAttempt.created_at <= period_end,
        )
        .group_by(
            RecoveryAttempt.action,
        )
        .order_by(
            RecoveryAttempt.action.asc(),
        )
    ).all()

    metrics: list[StrategyMetric] = []

    for action, attempts, successful, failed in rows:
        attempts = int(attempts or 0)
        successful = int(successful or 0)
        failed = int(failed or 0)

        recovered_revenue = Decimal(
            db.scalar(
                select(
                    func.coalesce(
                        func.sum(RecoveryOutcome.recovered_amount),
                        0,
                    )
                )
                .join(
                    RecoveryAttempt,
                    RecoveryAttempt.id
                    == RecoveryOutcome.recovery_attempt_id,
                )
                .join(
                    RecoveryCase,
                    RecoveryCase.id
                    == RecoveryOutcome.recovery_case_id,
                )
                .where(
                    RecoveryCase.merchant_id == merchant_id,
                    RecoveryAttempt.action == action,
                    RecoveryOutcome.outcome == "RECOVERED",
                    RecoveryOutcome.verification_status == "VERIFIED",
                    RecoveryOutcome.verified_at >= period_start,
                    RecoveryOutcome.verified_at <= period_end,
                )
            )
            or 0
        )

        metrics.append(
            StrategyMetric(
                strategy=action or "UNKNOWN",
                attempts=attempts,
                successful_attempts=successful,
                failed_attempts=failed,
                success_rate=_safe_rate(
                    successful,
                    attempts,
                ),
                recovered_revenue=recovered_revenue.quantize(
                    Decimal("0.01"),
                ),
            )
        )

    return metrics


def calculate_analytics(
    merchant_id: UUID,
    db: Session,
    period_days: int = 30,
) -> AnalyticsResult:
    """
    Calculate database-backed revenue recovery analytics.

    Revenue metrics are based on actual database records:

        Revenue at risk
            = failed transactions in the selected period

        Verified recovered revenue
            = RecoveryOutcome records marked
              RECOVERED + VERIFIED

        Recovery rate
            = verified recovered revenue / revenue at risk

    No simulated recovery values are included in these metrics.
    """

    period_days = max(
        1,
        min(
            period_days,
            365,
        ),
    )

    period_end = datetime.now(timezone.utc)
    period_start = period_end - timedelta(days=period_days)

    revenue_at_risk = Decimal(
        db.scalar(
            select(
                func.coalesce(
                    func.sum(Transaction.amount),
                    0,
                )
            ).where(
                Transaction.merchant_id == merchant_id,
                func.upper(Transaction.status) == "FAILED",
                Transaction.occurred_at >= period_start,
                Transaction.occurred_at <= period_end,
            )
        )
        or 0
    )

    failed_transactions = int(
        db.scalar(
            select(
                func.count(Transaction.id),
            ).where(
                Transaction.merchant_id == merchant_id,
                func.upper(Transaction.status) == "FAILED",
                Transaction.occurred_at >= period_start,
                Transaction.occurred_at <= period_end,
            )
        )
        or 0
    )

    verified_recovered_revenue = Decimal(
        db.scalar(
            select(
                func.coalesce(
                    func.sum(RecoveryOutcome.recovered_amount),
                    0,
                )
            ).where(
                RecoveryOutcome.merchant_id == merchant_id,
                RecoveryOutcome.outcome == "RECOVERED",
                RecoveryOutcome.verification_status == "VERIFIED",
                RecoveryOutcome.verified_at >= period_start,
                RecoveryOutcome.verified_at <= period_end,
            )
        )
        or 0
    )

    recovered_cases = int(
        db.scalar(
            select(
                func.count(RecoveryOutcome.id),
            ).where(
                RecoveryOutcome.merchant_id == merchant_id,
                RecoveryOutcome.outcome == "RECOVERED",
                RecoveryOutcome.verification_status == "VERIFIED",
                RecoveryOutcome.verified_at >= period_start,
                RecoveryOutcome.verified_at <= period_end,
            )
        )
        or 0
    )

    active_cases = int(
        db.scalar(
            select(
                func.count(RecoveryCase.id),
            ).where(
                RecoveryCase.merchant_id == merchant_id,
                RecoveryCase.status.in_(
                    ["OPEN", "IN_PROGRESS", "FAILED"],
                ),
            )
        )
        or 0
    )

    escalated_cases = int(
        db.scalar(
            select(
                func.count(AuditEvent.id),
            ).where(
                AuditEvent.merchant_id == merchant_id,
                AuditEvent.event_type == "ESCALATION",
                AuditEvent.occurred_at >= period_start,
                AuditEvent.occurred_at <= period_end,
            )
        )
        or 0
    )

    total_attempts = int(
        db.scalar(
            select(
                func.count(RecoveryAttempt.id),
            )
            .join(
                RecoveryCase,
                RecoveryCase.id == RecoveryAttempt.recovery_case_id,
            )
            .where(
                RecoveryCase.merchant_id == merchant_id,
                RecoveryAttempt.created_at >= period_start,
                RecoveryAttempt.created_at <= period_end,
            )
        )
        or 0
    )

    successful_attempts = int(
        db.scalar(
            select(
                func.count(RecoveryAttempt.id),
            )
            .join(
                RecoveryCase,
                RecoveryCase.id == RecoveryAttempt.recovery_case_id,
            )
            .where(
                RecoveryCase.merchant_id == merchant_id,
                RecoveryAttempt.status == "COMPLETED",
                RecoveryAttempt.created_at >= period_start,
                RecoveryAttempt.created_at <= period_end,
            )
        )
        or 0
    )

    failed_attempts = int(
        db.scalar(
            select(
                func.count(RecoveryAttempt.id),
            )
            .join(
                RecoveryCase,
                RecoveryCase.id == RecoveryAttempt.recovery_case_id,
            )
            .where(
                RecoveryCase.merchant_id == merchant_id,
                RecoveryAttempt.status == "FAILED",
                RecoveryAttempt.created_at >= period_start,
                RecoveryAttempt.created_at <= period_end,
            )
        )
        or 0
    )

    payment_retry_attempts = int(
        db.scalar(
            select(
                func.count(RecoveryAttempt.id),
            )
            .join(
                RecoveryCase,
                RecoveryCase.id == RecoveryAttempt.recovery_case_id,
            )
            .where(
                RecoveryCase.merchant_id == merchant_id,
                RecoveryAttempt.action == "PAYMENT_RETRY",
                RecoveryAttempt.created_at >= period_start,
                RecoveryAttempt.created_at <= period_end,
            )
        )
        or 0
    )

    customer_contact_attempts = int(
        db.scalar(
            select(
                func.count(RecoveryAttempt.id),
            )
            .join(
                RecoveryCase,
                RecoveryCase.id == RecoveryAttempt.recovery_case_id,
            )
            .where(
                RecoveryCase.merchant_id == merchant_id,
                RecoveryAttempt.action == "CUSTOMER_CONTACT",
                RecoveryAttempt.created_at >= period_start,
                RecoveryAttempt.created_at <= period_end,
            )
        )
        or 0
    )

    manual_review_cases = int(
        db.scalar(
            select(
                func.count(RecoveryCase.id),
            )
            .where(
                RecoveryCase.merchant_id == merchant_id,
                RecoveryCase.recovery_strategy == "MANUAL_REVIEW",
                RecoveryCase.created_at >= period_start,
                RecoveryCase.created_at <= period_end,
            )
        )
        or 0
    )

    recovery_times = db.execute(
        select(
            RecoveryOutcome.verified_at,
            RecoveryAttempt.attempted_at,
        )
        .join(
            RecoveryAttempt,
            RecoveryAttempt.id == RecoveryOutcome.recovery_attempt_id,
        )
        .where(
            RecoveryOutcome.merchant_id == merchant_id,
            RecoveryOutcome.outcome == "RECOVERED",
            RecoveryOutcome.verification_status == "VERIFIED",
            RecoveryOutcome.verified_at >= period_start,
            RecoveryOutcome.verified_at <= period_end,
        )
    ).all()

    recovery_durations: list[float] = []

    for verified_at, attempted_at in recovery_times:
        if verified_at and attempted_at:
            duration = (
                verified_at - attempted_at
            ).total_seconds() / 60

            if duration >= 0:
                recovery_durations.append(duration)

    average_recovery_time_minutes = round(
        sum(recovery_durations) / len(recovery_durations)
        if recovery_durations
        else 0.0,
        2,
    )

    unrecovered_revenue = max(
        Decimal("0"),
        revenue_at_risk - verified_recovered_revenue,
    )

    strategy_metrics = _strategy_metrics(
        merchant_id=merchant_id,
        period_start=period_start,
        period_end=period_end,
        db=db,
    )

    return AnalyticsResult(
        period_days=period_days,
        period_start=period_start,
        period_end=period_end,
        revenue_at_risk=revenue_at_risk.quantize(
            Decimal("0.01"),
        ),
        verified_recovered_revenue=verified_recovered_revenue.quantize(
            Decimal("0.01"),
        ),
        unrecovered_revenue=unrecovered_revenue.quantize(
            Decimal("0.01"),
        ),
        recovery_rate=_safe_rate(
            verified_recovered_revenue,
            revenue_at_risk,
        ),
        failed_transactions=failed_transactions,
        active_cases=active_cases,
        recovered_cases=recovered_cases,
        escalated_cases=escalated_cases,
        total_attempts=total_attempts,
        successful_attempts=successful_attempts,
        failed_attempts=failed_attempts,
        intervention_success_rate=_safe_rate(
            successful_attempts,
            total_attempts,
        ),
        escalation_rate=_safe_rate(
            escalated_cases,
            failed_transactions,
        ),
        average_recovery_time_minutes=average_recovery_time_minutes,
        payment_retry_attempts=payment_retry_attempts,
        customer_contact_attempts=customer_contact_attempts,
        manual_review_cases=manual_review_cases,
        strategy_metrics=strategy_metrics,
    )