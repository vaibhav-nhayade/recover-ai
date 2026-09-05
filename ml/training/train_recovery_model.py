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

PROCESSED_DATA_PATH = (
    ROOT_DIR
    / "data"
    / "processed"
    / "recovery_features.csv"
)

MODEL_PATH = (
    ROOT_DIR
    / "models"
    / "recovery_model.joblib"
)

METRICS_PATH = (
    ROOT_DIR
    / "models"
    / "training_metrics.json"
)


def load_training_data() -> pd.DataFrame:
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Training dataset not found: {RAW_DATA_PATH}"
        )

    dataframe = pd.read_csv(
        RAW_DATA_PATH
    )

    required_columns = {
        "amount",
        "payment_method",
        "failure_reason",
        "recovered",
    }

    missing = (
        required_columns
        - set(dataframe.columns)
    )

    if missing:
        raise ValueError(
            "Training dataset is missing required columns: "
            + ", ".join(sorted(missing))
        )

    return dataframe


def train() -> dict[str, object]:
    dataframe = load_training_data()

    X = build_features(
        dataframe
    )

    y = pd.to_numeric(
        dataframe["recovered"],
        errors="coerce",
    ).fillna(0).astype(int)

    if y.nunique() < 2:
        raise ValueError(
            "Training data must contain both recovered and "
            "non-recovered examples."
        )

    (
        X_train,
        X_test,
        y_train,
        y_test,
    ) = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RecoveryModel()

    model.fit(
        X_train,
        y_train,
    )

    metrics = model.evaluate(
        X_test,
        y_test,
    )

    feature_importance = (
        model.feature_importance()
    )

    PROCESSED_DATA_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    processed = X.copy()
    processed["recovered"] = y

    processed.to_csv(
        PROCESSED_DATA_PATH,
        index=False,
    )

    model.save(
        MODEL_PATH
    )

    training_result = {
        "dataset_rows": int(len(dataframe)),
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "positive_recovery_rate": float(y.mean()),
        "metrics": metrics,
        "feature_importance": feature_importance,
    }

    METRICS_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with METRICS_PATH.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            training_result,
            file,
            indent=2,
        )

    return training_result


if __name__ == "__main__":
    result = train()

    print(
        json.dumps(
            result,
            indent=2,
        )
    )