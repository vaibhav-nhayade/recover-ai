from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

from features.recovery_features import build_features
from models.recovery_model import RecoveryModel


ROOT_DIR = Path(__file__).resolve().parents[2]

RAW_DATA_PATH = (
    ROOT_DIR
    / "data"
    / "raw"
    / "recovery_training_data.csv"
)

MODEL_PATH = (
    ROOT_DIR
    / "models"
    / "recovery_model.joblib"
)


def evaluate_model() -> dict[str, object]:
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {RAW_DATA_PATH}"
        )

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found: {MODEL_PATH}"
        )

    dataframe = pd.read_csv(
        RAW_DATA_PATH
    )

    X = build_features(
        dataframe
    )

    y = pd.to_numeric(
        dataframe["recovered"],
        errors="coerce",
    ).fillna(0).astype(int)

    (
        _,
        X_test,
        _,
        y_test,
    ) = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RecoveryModel.load(
        MODEL_PATH
    )

    metrics = model.evaluate(
        X_test,
        y_test,
    )

    return {
        "test_rows": len(X_test),
        "metrics": metrics,
        "feature_importance": model.feature_importance(),
    }


if __name__ == "__main__":
    result = evaluate_model()

    print(
        json.dumps(
            result,
            indent=2,
        )
    )