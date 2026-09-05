from __future__ import annotations

import pandas as pd

from ml.features.recovery_features import build_features
from ml.models.recovery_model import RecoveryModel


def create_training_data() -> pd.DataFrame:
    rows = []

    for index in range(30):
        rows.append(
            {
                "amount": 3000 + index * 500,
                "payment_method": (
                    "UPI"
                    if index % 2 == 0
                    else "CARD"
                ),
                "failure_reason": (
                    "UPI timeout"
                    if index % 3 == 0
                    else "Bank decline"
                ),
                "customer_successful_transactions":
                    15 + index,
                "customer_failed_transactions":
                    1 + (index % 4),
                "transaction_attempts":
                    1 + (index % 3),
                "occurred_at":
                    "2026-09-04T12:00:00",
                "recovered":
                    1 if index % 2 == 0 else 0,
            }
        )

    return pd.DataFrame(rows)


def test_model_can_train() -> None:
    dataframe = create_training_data()

    X = build_features(
        dataframe
    )

    y = dataframe["recovered"]

    model = RecoveryModel()

    model.fit(
        X,
        y,
    )

    assert model.feature_names
    assert model.model is not None


def test_model_probability_is_between_zero_and_one() -> None:
    dataframe = create_training_data()

    X = build_features(
        dataframe
    )

    y = dataframe["recovered"]

    model = RecoveryModel()

    model.fit(
        X,
        y,
    )

    probabilities = (
        model.predict_probability(X)
    )

    assert len(probabilities) == len(X)

    assert all(
        0 <= probability <= 1
        for probability in probabilities
    )


def test_model_predictions_are_binary() -> None:
    dataframe = create_training_data()

    X = build_features(
        dataframe
    )

    y = dataframe["recovered"]

    model = RecoveryModel()

    model.fit(
        X,
        y,
    )

    predictions = model.predict(X)

    assert len(predictions) == len(X)

    assert set(predictions).issubset(
        {0, 1}
    )


def test_model_has_feature_importance() -> None:
    dataframe = create_training_data()

    X = build_features(
        dataframe
    )

    y = dataframe["recovered"]

    model = RecoveryModel()

    model.fit(
        X,
        y,
    )

    importance = (
        model.feature_importance()
    )

    assert importance

    assert set(
        importance.keys()
    ) == set(
        X.columns
    )


def test_model_evaluation_returns_metrics() -> None:
    dataframe = create_training_data()

    X = build_features(
        dataframe
    )

    y = dataframe["recovered"]

    model = RecoveryModel()

    model.fit(
        X,
        y,
    )

    metrics = model.evaluate(
        X,
        y,
    )

    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "roc_auc" in metrics