from __future__ import annotations

import hashlib
from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable
from uuid import UUID

from app.models.transaction import Transaction
from app.services.intervention_ranker import (
    InterventionRanking,
    rank_interventions,
)
from app.services.recovery_scoring import (
    RecoveryScore,
    score_transaction,
)


@dataclass(frozen=True)
class BatchRecoveryResult:
    transaction_id: UUID
    transaction_reference: str
    amount: Decimal
    recovery_probability: float
    confidence: float
    risk_band: str
    selected_strategy: str
    selected_channel: str
    intervention_score: float
    expected_recovery: Decimal
    simulated_recovered_amount: Decimal
    outcome: str
    evidence: list[str]


@dataclass(frozen=True)
class BatchRecoverySummary:
    total_transactions: int
    eligible_transactions: int
    skipped_transactions: int
    revenue_at_risk: Decimal
    expected_recovery: Decimal
    recovered_revenue: Decimal
    recovery_rate: float
    intervention_success_rate: float
    average_recovery_probability: float
    average_confidence: float
    human_escalations: int
    results: list[BatchRecoveryResult]


def _stable_random_value(transaction_id: UUID) -> float:
    """
    Generate a deterministic pseudo-random value for evaluation.

    Using a transaction-specific hash means the same transaction
    produces the same evaluation result across repeated runs.
    """

    digest = hashlib.sha256(
        str(transaction_id).encode("utf-8")
    ).hexdigest()

    integer = int(digest[:12], 16)

    return (integer % 1_000_000) / 1_000_000


def _simulate_outcome(
    transaction: Transaction,
    ranking: InterventionRanking,
) -> tuple[str, Decimal]:
    """
    Simulate an outcome using the model probability.

    This is an evaluation mechanism, not a real payment execution.
    """

    selected = ranking.selected

    random_value = _stable_random_value(transaction.id)

    probability = selected.score

    if selected.strategy == "MANUAL_REVIEW":
        # Manual review is not counted as autonomous recovery.
        return "ESCALATED", Decimal("0")

    if random_value <= probability:
        return (
            "RECOVERED",
            transaction.amount,
        )

    return "FAILED", Decimal("0")


def evaluate_transaction(
    transaction: Transaction,
    db,
) -> BatchRecoveryResult:
    """
    Evaluate one failed transaction through the complete AI
    decision pipeline without executing a real provider action.
    """

    recovery_score: RecoveryScore = score_transaction(
        transaction=transaction,
        db=db,
    )

    ranking: InterventionRanking = rank_interventions(
        amount=Decimal(transaction.amount),
        payment_method=transaction.payment_method or "",
        failure_reason=transaction.failure_reason or "",
        recovery_score=recovery_score,
    )

    selected = ranking.selected

    outcome, recovered_amount = _simulate_outcome(
        transaction=transaction,
        ranking=ranking,
    )

    return BatchRecoveryResult(
        transaction_id=transaction.id,
        transaction_reference=transaction.transaction_reference,
        amount=transaction.amount,
        recovery_probability=recovery_score.probability,
        confidence=recovery_score.confidence,
        risk_band=recovery_score.risk_band,
        selected_strategy=selected.strategy,
        selected_channel=selected.channel,
        intervention_score=selected.score,
        expected_recovery=selected.expected_recovery,
        simulated_recovered_amount=recovered_amount,
        outcome=outcome,
        evidence=recovery_score.evidence,
    )


def evaluate_batch(
    transactions: Iterable[Transaction],
    db,
) -> BatchRecoverySummary:
    """
    Evaluate a collection of failed transactions.

    The function produces measurable recovery metrics without
    changing transaction or recovery-case state.
    """

    results: list[BatchRecoveryResult] = []

    total_transactions = 0
    skipped_transactions = 0

    for transaction in transactions:
        total_transactions += 1

        if transaction.status.upper() != "FAILED":
            skipped_transactions += 1
            continue

        result = evaluate_transaction(
            transaction=transaction,
            db=db,
        )

        results.append(result)

    eligible_transactions = len(results)

    revenue_at_risk = sum(
        (
            result.amount
            for result in results
        ),
        Decimal("0"),
    )

    expected_recovery = sum(
        (
            result.expected_recovery
            for result in results
        ),
        Decimal("0"),
    )

    recovered_revenue = sum(
        (
            result.simulated_recovered_amount
            for result in results
        ),
        Decimal("0"),
    )

    recovery_rate = (
        float(
            recovered_revenue / revenue_at_risk
        )
        if revenue_at_risk > 0
        else 0.0
    )

    autonomous_results = [
        result
        for result in results
        if result.selected_strategy != "MANUAL_REVIEW"
    ]

    successful_autonomous_results = [
        result
        for result in autonomous_results
        if result.outcome == "RECOVERED"
    ]

    intervention_success_rate = (
        len(successful_autonomous_results)
        / len(autonomous_results)
        if autonomous_results
        else 0.0
    )

    average_recovery_probability = (
        sum(
            result.recovery_probability
            for result in results
        )
        / len(results)
        if results
        else 0.0
    )

    average_confidence = (
        sum(
            result.confidence
            for result in results
        )
        / len(results)
        if results
        else 0.0
    )

    human_escalations = sum(
        1
        for result in results
        if result.outcome == "ESCALATED"
    )

    return BatchRecoverySummary(
        total_transactions=total_transactions,
        eligible_transactions=eligible_transactions,
        skipped_transactions=skipped_transactions,
        revenue_at_risk=revenue_at_risk.quantize(
            Decimal("0.01")
        ),
        expected_recovery=expected_recovery.quantize(
            Decimal("0.01")
        ),
        recovered_revenue=recovered_revenue.quantize(
            Decimal("0.01")
        ),
        recovery_rate=round(
            recovery_rate,
            4,
        ),
        intervention_success_rate=round(
            intervention_success_rate,
            4,
        ),
        average_recovery_probability=round(
            average_recovery_probability,
            4,
        ),
        average_confidence=round(
            average_confidence,
            4,
        ),
        human_escalations=human_escalations,
        results=results,
    )