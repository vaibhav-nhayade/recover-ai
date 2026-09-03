from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


@dataclass(frozen=True)
class RecoveryScore:
    probability: float
    confidence: float
    score: float
    risk_band: str
    recommended_strategy: str
    features: dict[str, float]
    evidence: list[str]


def _sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, value))))


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _normalise_payment_method(payment_method: str | None) -> str:
    return (payment_method or "").strip().upper().replace("-", "_").replace(" ", "_")


def _failure_signal(reason: str) -> tuple[float, str]:
    value = reason.lower()

    if any(term in value for term in ("timeout", "timed out", "gateway unavailable")):
        return 0.80, "Transient gateway/network failure is usually retryable."

    if any(term in value for term in ("upi", "upi timeout")):
        return 0.82, "UPI failure has a relatively strong retry opportunity."

    if any(term in value for term in ("decline", "declined", "bank decline")):
        return 0.55, "Bank/card decline may succeed after a later retry."

    if any(term in value for term in ("limit", "insufficient", "balance")):
        return 0.35, "Insufficient funds or limits reduce immediate recovery likelihood."

    if any(term in value for term in ("expired", "invalid", "blocked")):
        return 0.25, "Permanent or account-level failures reduce retry suitability."

    if reason:
        return 0.50, "Failure reason is available but has no strong transient/permanent signal."

    return 0.45, "No failure reason was supplied, reducing prediction certainty."


def _payment_method_signal(payment_method: str) -> tuple[float, str]:
    signals = {
        "UPI": (0.78, "UPI supports a strong immediate retry path."),
        "CARD": (0.64, "Card payments provide a viable retry path."),
        "NET_BANKING": (0.58, "Net banking can be recovered through customer re-attempt."),
        "BANK_TRANSFER": (0.48, "Bank transfer recovery generally benefits from customer contact."),
        "WALLET": (0.52, "Wallet failures may recover after the payment method becomes available."),
    }

    return signals.get(
        payment_method,
        (0.45, "Unknown payment method reduces model certainty."),
    )


def _amount_signal(amount: Decimal) -> tuple[float, str]:
    value = float(amount)

    if value <= 1000:
        return 0.78, "Low-value transaction has relatively low customer friction."

    if value <= 5000:
        return 0.70, "Mid-value transaction remains suitable for automated recovery."

    if value <= 10000:
        return 0.60, "Higher-value transaction is recoverable but requires more cautious intervention."

    return 0.40, "High-value transaction should receive stronger policy controls and may require review."


def _time_signal(occurred_at: datetime) -> tuple[float, str]:
    if occurred_at.tzinfo is None:
        occurred_at = occurred_at.replace(tzinfo=timezone.utc)

    hour = occurred_at.astimezone(timezone.utc).hour

    if 7 <= hour <= 22:
        return 0.72, "Transaction occurred during normal customer activity hours."

    return 0.48, "Transaction occurred during lower-activity hours."


def _customer_history(
    transaction: Transaction,
    db: Session,
) -> tuple[float, float, float, list[str]]:
    if not transaction.customer_email:
        return (
            0.50,
            0.50,
            0.50,
            ["No customer email is available for historical recovery analysis."],
        )

    base_query = select(
        func.count(Transaction.id),
    ).where(
        Transaction.merchant_id == transaction.merchant_id,
        Transaction.customer_email == transaction.customer_email,
        Transaction.id != transaction.id,
    )

    total = int(db.scalar(base_query) or 0)

    success_count = int(
        db.scalar(
            select(func.count(Transaction.id)).where(
                Transaction.merchant_id == transaction.merchant_id,
                Transaction.customer_email == transaction.customer_email,
                Transaction.id != transaction.id,
                func.upper(Transaction.status) == "SUCCESS",
            )
        )
        or 0
    )

    failed_count = int(
        db.scalar(
            select(func.count(Transaction.id)).where(
                Transaction.merchant_id == transaction.merchant_id,
                Transaction.customer_email == transaction.customer_email,
                Transaction.id != transaction.id,
                func.upper(Transaction.status) == "FAILED",
            )
        )
        or 0
    )

    if total == 0:
        return (
            0.52,
            0.50,
            0.35,
            ["No previous transactions found for this customer."],
        )

    success_rate = success_count / total
    failure_rate = failed_count / total

    history_signal = _clamp(
        0.35 + (success_rate * 0.65) - (failure_rate * 0.20),
        0.15,
        0.90,
    )

    confidence = _clamp(
        0.45 + min(total, 10) / 20,
        0.45,
        0.95,
    )

    evidence = [
        f"Customer history contains {total} previous transaction(s).",
        f"Historical success rate is {success_rate:.0%}.",
    ]

    if success_count > failed_count:
        evidence.append("Customer has historically completed more payments than failed payments.")
    elif failed_count > success_count:
        evidence.append("Customer has a history with more failed payments than successful payments.")

    return history_signal, success_rate, confidence, evidence


def _choose_strategy(
    payment_method: str,
    amount: Decimal,
    failure_reason: str,
    probability: float,
) -> str:
    reason = failure_reason.lower()

    if amount >= Decimal("10000"):
        return "MANUAL_REVIEW"

    if probability < 0.35:
        return "CUSTOMER_CONTACT"

    if payment_method in {"UPI", "CARD"}:
        if any(
            term in reason
            for term in ("timeout", "timed out", "gateway", "decline", "declined", "failed")
        ):
            return "PAYMENT_RETRY"

    if payment_method in {"NET_BANKING", "BANK_TRANSFER"}:
        return "CUSTOMER_CONTACT"

    if probability >= 0.60:
        return "PAYMENT_RETRY"

    return "CUSTOMER_CONTACT"


def score_transaction(
    transaction: Transaction,
    db: Session,
) -> RecoveryScore:
    """
    Calculate an explainable probability that a failed transaction
    can be recovered.

    This is the first production scoring layer for RecoverAI.
    It is intentionally dependency-light and deterministic so that
    it can later be calibrated against real recovery outcomes.
    """

    payment_method = _normalise_payment_method(
        transaction.payment_method,
    )

    failure_reason = (
        transaction.failure_reason or ""
    ).strip()

    failure_signal, failure_evidence = _failure_signal(
        failure_reason,
    )

    payment_signal, payment_evidence = _payment_method_signal(
        payment_method,
    )

    amount_signal, amount_evidence = _amount_signal(
        Decimal(transaction.amount),
    )

    time_signal, time_evidence = _time_signal(
        transaction.occurred_at,
    )

    history_signal, historical_success_rate, history_confidence, history_evidence = (
        _customer_history(
            transaction,
            db,
        )
    )

    # Explainable weighted feature model.
    #
    # The weights intentionally favour:
    # 1. failure recoverability,
    # 2. customer history,
    # 3. payment method,
    # 4. transaction amount,
    # 5. transaction timing.
    raw_probability = (
        failure_signal * 0.30
        + history_signal * 0.25
        + payment_signal * 0.20
        + amount_signal * 0.15
        + time_signal * 0.10
    )

    probability = _clamp(
        raw_probability,
        0.05,
        0.95,
    )

    confidence = _clamp(
        (
            0.45
            + (0.20 if failure_reason else 0.0)
            + (0.15 if transaction.payment_method else 0.0)
            + (history_confidence * 0.20)
        ),
        0.45,
        0.95,
    )

    recovery_score = round(probability * 100, 2)

    if recovery_score >= 70:
        risk_band = "HIGH_RECOVERABILITY"
    elif recovery_score >= 45:
        risk_band = "MEDIUM_RECOVERABILITY"
    else:
        risk_band = "LOW_RECOVERABILITY"

    recommended_strategy = _choose_strategy(
        payment_method=payment_method,
        amount=Decimal(transaction.amount),
        failure_reason=failure_reason,
        probability=probability,
    )

    evidence = [
        failure_evidence,
        payment_evidence,
        amount_evidence,
        time_evidence,
        *history_evidence,
    ]

    if historical_success_rate >= 0.70:
        evidence.append(
            "Strong customer payment history increases expected recovery."
        )

    if probability >= 0.70:
        evidence.append(
            "Model predicts a strong recovery opportunity."
        )
    elif probability >= 0.45:
        evidence.append(
            "Model predicts a moderate recovery opportunity."
        )
    else:
        evidence.append(
            "Model predicts a low recovery opportunity; aggressive automation is not recommended."
        )

    return RecoveryScore(
        probability=round(probability, 4),
        confidence=round(confidence, 4),
        score=recovery_score,
        risk_band=risk_band,
        recommended_strategy=recommended_strategy,
        features={
            "failure_signal": round(failure_signal, 4),
            "customer_history_signal": round(history_signal, 4),
            "payment_method_signal": round(payment_signal, 4),
            "amount_signal": round(amount_signal, 4),
            "time_signal": round(time_signal, 4),
            "historical_success_rate": round(historical_success_rate, 4),
        },
        evidence=evidence,
    )


def score_to_dict(result: RecoveryScore) -> dict[str, Any]:
    return {
        "probability": result.probability,
        "probability_percent": round(result.probability * 100, 2),
        "confidence": result.confidence,
        "confidence_percent": round(result.confidence * 100, 2),
        "score": result.score,
        "risk_band": result.risk_band,
        "recommended_strategy": result.recommended_strategy,
        "features": result.features,
        "evidence": result.evidence,
    }