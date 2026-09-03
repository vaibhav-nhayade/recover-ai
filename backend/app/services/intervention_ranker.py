from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from app.services.recovery_scoring import RecoveryScore


@dataclass(frozen=True)
class Intervention:
    name: str
    strategy: str
    channel: str
    score: float
    expected_recovery: Decimal
    confidence: float
    allowed: bool
    reason: str
    priority: int


@dataclass(frozen=True)
class InterventionRanking:
    selected: Intervention
    alternatives: list[Intervention]


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _amount_penalty(amount: Decimal) -> float:
    value = float(amount)

    if value <= 1000:
        return 0.00

    if value <= 5000:
        return 0.05

    if value <= 10000:
        return 0.15

    if value <= 25000:
        return 0.30

    return 0.50


def _retry_fit(
    recovery_score: RecoveryScore,
    payment_method: str,
    failure_reason: str,
) -> float:
    score = recovery_score.probability

    method = payment_method.upper()
    reason = failure_reason.lower()

    if method == "UPI":
        score += 0.08

    elif method == "CARD":
        score += 0.04

    elif method in {"NET_BANKING", "BANK_TRANSFER"}:
        score -= 0.04

    if any(
        term in reason
        for term in (
            "timeout",
            "timed out",
            "gateway",
            "temporary",
        )
    ):
        score += 0.10

    if any(
        term in reason
        for term in (
            "blocked",
            "expired",
            "invalid",
        )
    ):
        score -= 0.25

    return _clamp(score, 0.0, 1.0)


def _contact_fit(
    recovery_score: RecoveryScore,
    payment_method: str,
    failure_reason: str,
) -> float:
    score = recovery_score.probability * 0.85

    method = payment_method.upper()
    reason = failure_reason.lower()

    if method in {"NET_BANKING", "BANK_TRANSFER", "WALLET"}:
        score += 0.10

    if any(
        term in reason
        for term in (
            "decline",
            "declined",
            "limit",
            "insufficient",
            "balance",
        )
    ):
        score += 0.12

    return _clamp(score, 0.0, 1.0)


def _manual_review_fit(
    amount: Decimal,
    recovery_score: RecoveryScore,
) -> float:
    amount_value = float(amount)

    score = 0.25 + (recovery_score.confidence * 0.20)

    if amount_value >= 10000:
        score += 0.30

    if amount_value >= 25000:
        score += 0.25

    if recovery_score.probability < 0.35:
        score += 0.15

    return _clamp(score, 0.0, 1.0)


def rank_interventions(
    amount: Decimal,
    payment_method: str,
    failure_reason: str,
    recovery_score: RecoveryScore,
) -> InterventionRanking:
    """
    Rank bounded recovery interventions using the AI recovery score,
    transaction context, expected recovery value, and policy constraints.

    This layer intentionally does not execute an intervention.
    It only determines which action should be considered next.
    """

    retry_fit = _retry_fit(
        recovery_score=recovery_score,
        payment_method=payment_method,
        failure_reason=failure_reason,
    )

    contact_fit = _contact_fit(
        recovery_score=recovery_score,
        payment_method=payment_method,
        failure_reason=failure_reason,
    )

    manual_fit = _manual_review_fit(
        amount=amount,
        recovery_score=recovery_score,
    )

    amount_penalty = _amount_penalty(amount)

    retry_score = _clamp(
        (
            retry_fit * 0.65
            + recovery_score.confidence * 0.20
            + (1.0 - amount_penalty) * 0.15
        ),
        0.0,
        1.0,
    )

    contact_score = _clamp(
        (
            contact_fit * 0.65
            + recovery_score.confidence * 0.20
            + amount_penalty * 0.15
        ),
        0.0,
        1.0,
    )

    manual_score = _clamp(
        (
            manual_fit * 0.70
            + recovery_score.confidence * 0.15
            + amount_penalty * 0.15
        ),
        0.0,
        1.0,
    )

    retry_allowed = (
        amount < Decimal("10000")
        and recovery_score.probability >= 0.35
    )

    contact_allowed = recovery_score.probability >= 0.20

    manual_allowed = True

    retry_expected = (
        amount * Decimal(str(retry_score))
        if retry_allowed
        else Decimal("0")
    )

    contact_expected = (
        amount * Decimal(str(contact_score))
        if contact_allowed
        else Decimal("0")
    )

    manual_expected = (
        amount * Decimal(str(manual_score))
        if manual_allowed
        else Decimal("0")
    )

    retry = Intervention(
        name="Payment Retry",
        strategy="PAYMENT_RETRY",
        channel="PAYMENT",
        score=round(retry_score, 4),
        expected_recovery=retry_expected.quantize(Decimal("0.01")),
        confidence=recovery_score.confidence,
        allowed=retry_allowed,
        reason=(
            "High recovery probability and compatible payment method."
            if retry_allowed
            else "Automatic payment retry is restricted by recovery probability or transaction value."
        ),
        priority=1,
    )

    contact = Intervention(
        name="Customer Contact",
        strategy="CUSTOMER_CONTACT",
        channel="EMAIL",
        score=round(contact_score, 4),
        expected_recovery=contact_expected.quantize(Decimal("0.01")),
        confidence=recovery_score.confidence,
        allowed=contact_allowed,
        reason=(
            "Customer communication provides a bounded recovery path."
            if contact_allowed
            else "Recovery probability is too low for automated customer outreach."
        ),
        priority=2,
    )

    manual = Intervention(
        name="Manual Review",
        strategy="MANUAL_REVIEW",
        channel="MANUAL",
        score=round(manual_score, 4),
        expected_recovery=manual_expected.quantize(Decimal("0.01")),
        confidence=recovery_score.confidence,
        allowed=manual_allowed,
        reason=(
            "Human review provides a safe fallback for high-value or uncertain cases."
        ),
        priority=3,
    )

    candidates = [
        retry,
        contact,
        manual,
    ]

    allowed_candidates = [
        item
        for item in candidates
        if item.allowed
    ]

    selected = max(
        allowed_candidates,
        key=lambda item: (
            item.expected_recovery,
            item.score,
            -item.priority,
        ),
    )

    alternatives = sorted(
        [
            item
            for item in candidates
            if item.name != selected.name
        ],
        key=lambda item: item.score,
        reverse=True,
    )

    return InterventionRanking(
        selected=selected,
        alternatives=alternatives,
    )