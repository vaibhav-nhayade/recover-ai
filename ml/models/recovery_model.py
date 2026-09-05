from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


class RecoveryModel:
    """
    ML model for predicting whether a failed transaction
    is likely to be recovered after intervention.

    Target:
        1 -> recovered
        0 -> not recovered
    """

    def __init__(
        self,
        n_estimators: int = 250,
        max_depth: int = 10,
        random_state: int = 42,
    ) -> None:
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
            class_weight="balanced",
            min_samples_leaf=2,
            n_jobs=-1,
        )

        self.feature_names: list[str] = []

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.Series,
    ) -> "RecoveryModel":
        self.feature_names = list(X.columns)

        self.model.fit(
            X,
            y,
        )

        return self

    def predict_probability(
        self,
        X: pd.DataFrame,
    ) -> list[float]:
        probabilities = self.model.predict_proba(X)

        return probabilities[:, 1].tolist()

    def predict(
        self,
        X: pd.DataFrame,
        threshold: float = 0.5,
    ) -> list[int]:
        probabilities = self.predict_probability(X)

        return [
            int(probability >= threshold)
            for probability in probabilities
        ]

    def feature_importance(
        self,
    ) -> dict[str, float]:
        if not self.feature_names:
            return {}

        return {
            name: float(importance)
            for name, importance in zip(
                self.feature_names,
                self.model.feature_importances_,
            )
        }

    def evaluate(
        self,
        X: pd.DataFrame,
        y: pd.Series,
    ) -> dict[str, float]:
        probabilities = self.predict_probability(X)

        predictions = [
            int(probability >= 0.5)
            for probability in probabilities
        ]

        metrics: dict[str, float] = {
            "accuracy": float(
                accuracy_score(
                    y,
                    predictions,
                )
            ),
            "precision": float(
                precision_score(
                    y,
                    predictions,
                    zero_division=0,
                )
            ),
            "recall": float(
                recall_score(
                    y,
                    predictions,
                    zero_division=0,
                )
            ),
        }

        try:
            metrics["roc_auc"] = float(
                roc_auc_score(
                    y,
                    probabilities,
                )
            )
        except ValueError:
            metrics["roc_auc"] = 0.0

        return metrics

    def save(
        self,
        path: str | Path,
    ) -> None:
        destination = Path(path)

        destination.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        joblib.dump(
            self,
            destination,
        )

    @staticmethod
    def load(
        path: str | Path,
    ) -> "RecoveryModel":
        model = joblib.load(path)

        if not isinstance(
            model,
            RecoveryModel,
        ):
            raise TypeError(
                "The loaded artifact is not a RecoveryModel."
            )

        return model