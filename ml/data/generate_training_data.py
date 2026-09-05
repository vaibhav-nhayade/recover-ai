from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]

OUTPUT_PATH = (
    ROOT_DIR
    / "raw"
    / "recovery_training_data.csv"
)


def generate_dataset(
    rows: int = 5000,
) -> pd.DataFrame:
    rng = np.random.default_rng(42)

    payment_methods = rng.choice(
        [
            "UPI",
            "CARD",
            "NETBANKING",
            "WALLET",
        ],
        size=rows,
        p=[
            0.45,
            0.35,
            0.15,
            0.05,
        ],
    )

    failure_reasons = rng.choice(
        [
            "UPI timeout",
            "Gateway timeout",
            "Bank decline",
            "Insufficient funds",
            "Wallet unavailable",
        ],
        size=rows,
        p=[
            0.25,
            0.20,
            0.25,
            0.20,
            0.10,
        ],
    )

    amounts = np.exp(
        rng.normal(
            np.log(8000),
            1.0,
            rows,
        )
    ).clip(
        200,
        100000,
    )

    successful_transactions = rng.poisson(
        12,
        rows,
    )

    failed_transactions = rng.poisson(
        2.5,
        rows,
    )

    transaction_attempts = rng.integers(
        1,
        4,
        rows,
    )

    occurred_at = pd.date_range(
        "2026-01-01",
        periods=rows,
        freq="17min",
    )

    customer_history = (
        successful_transactions
        / (
            successful_transactions
            + failed_transactions
            + 1
        )
    )

    timeout_bonus = np.where(
        np.isin(
            failure_reasons,
            [
                "UPI timeout",
                "Gateway timeout",
            ],
        ),
        0.20,
        0.0,
    )

    decline_penalty = np.where(
        failure_reasons == "Bank decline",
        -0.08,
        0.0,
    )

    insufficient_penalty = np.where(
        failure_reasons == "Insufficient funds",
        -0.15,
        0.0,
    )

    wallet_penalty = np.where(
        failure_reasons == "Wallet unavailable",
        -0.05,
        0.0,
    )

    amount_adjustment = np.where(
        amounts > 50000,
        -0.10,
        np.where(
            amounts > 20000,
            -0.04,
            0.03,
        ),
    )

    attempts_adjustment = np.where(
        transaction_attempts == 1,
        0.06,
        np.where(
            transaction_attempts == 2,
            0.02,
            -0.05,
        ),
    )

    payment_adjustment = np.where(
        payment_methods == "UPI",
        0.08,
        np.where(
            payment_methods == "CARD",
            0.05,
            np.where(
                payment_methods == "NETBANKING",
                -0.02,
                -0.03,
            ),
        ),
    )

    probability = (
        0.25
        + 0.35 * customer_history
        + timeout_bonus
        + decline_penalty
        + insufficient_penalty
        + wallet_penalty
        + amount_adjustment
        + attempts_adjustment
        + payment_adjustment
    )

    probability = np.clip(
        probability,
        0.03,
        0.97,
    )

    recovered = (
        rng.random(rows)
        < probability
    ).astype(int)

    return pd.DataFrame(
        {
            "transaction_reference": [
                f"TRAIN_{index:06d}"
                for index in range(rows)
            ],
            "amount": amounts.round(2),
            "payment_method": payment_methods,
            "failure_reason": failure_reasons,
            "customer_successful_transactions":
                successful_transactions,
            "customer_failed_transactions":
                failed_transactions,
            "transaction_attempts":
                transaction_attempts,
            "occurred_at":
                occurred_at.astype(str),
            "recovered":
                recovered,
        }
    )


if __name__ == "__main__":
    dataset = generate_dataset()

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    dataset.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print(
        f"Generated {len(dataset)} training rows."
    )

    print(
        f"Saved to: {OUTPUT_PATH}"
    )

    print(
        f"Recovery rate: "
        f"{dataset['recovered'].mean() * 100:.2f}%"
    )