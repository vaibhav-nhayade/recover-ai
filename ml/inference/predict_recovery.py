from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from features.recovery_features import build_features
from models.recovery_model import RecoveryModel


ROOT_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    ROOT_DIR
    / "models"
    / "recovery_model.joblib"
)


class RecoveryPredictor:
    """
    Production-facing inference wrapper.

    The predictor returns an explainable probability that
    a failed transaction can be recovered.
    """

    def __init__(
        self,
        model_path: str | Path = MODEL_PATH,
    ) -> None:
        self.model = RecoveryModel.load(
            model_path
        )

    def predict(
        self,
        transaction: dict[str, Any],
    ) -> dict[str, Any]:
        dataframe = pd.DataFrame(
            [transaction]
        )

        features = build_features(
            dataframe
        )

        probability = self.model.predict_probability(
            features
        )[0]

        if probability >= 0.70:
            risk_band = "HIGH_RECOVERABILITY"
        elif probability >= 0.45:
            risk_band = "MEDIUM_RECOVERABILITY"
        else:
            risk_band = "LOW_RECOVERABILITY"

        return {
            "recovery_probability": round(
                probability,
                4,
            ),
            "recovery_probability_percent": round(
                probability * 100,
                2,
            ),
            "risk_band": risk_band,
            "model": "RandomForestRecoveryModel",
            "model_version": "1.0",
            "features": {
                name: float(features.iloc[0][name])
                for name in features.columns
            },
        }


if __name__ == "__main__":
    predictor = RecoveryPredictor()

    example_transaction = {
        "amount": 24999,
        "payment_method": "UPI",
        "failure_reason": "UPI timeout",
        "customer_successful_transactions": 18,
        "customer_failed_transactions": 3,
        "transaction_attempts": 3,
        "occurred_at": "2026-09-04T18:30:00",
    }

    print(
        predictor.predict(
            example_transaction
        )
    )