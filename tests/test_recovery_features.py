from __future__ import annotations

import pandas as pd

from ml.features.recovery_features import (
    FEATURE_COLUMNS,
    build_features,
)


def create_transaction_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "amount": 24999,
                "payment_method": "UPI",
                "failure_reason": "UPI timeout",
                "customer_successful_transactions": 18,
                "customer_failed_transactions": 3,
                "transaction_attempts": 3,
                "occurred_at": "2026-09-04T18:30:00",
            }
        ]
    )


def test_feature_columns_are_complete() -> None:
    dataframe = create_transaction_dataframe()

    features = build_features(
        dataframe
    )

    assert list(features.columns) == (
        FEATURE_COLUMNS
    )


def test_feature_output_is_numeric() -> None:
    dataframe = create_transaction_dataframe()

    features = build_features(
        dataframe
    )

    assert all(
        pd.api.types.is_numeric_dtype(
            features[column]
        )
        for column in features.columns
    )


def test_upi_signal_is_detected() -> None:
    dataframe = create_transaction_dataframe()

    features = build_features(
        dataframe
    )

    assert (
        features.iloc[0]["is_upi"]
        == 1
    )


def test_timeout_signal_is_detected() -> None:
    dataframe = create_transaction_dataframe()

    features = build_features(
        dataframe
    )

    assert (
        features.iloc[0]["is_timeout"]
        == 1
    )


def test_amount_log_is_positive() -> None:
    dataframe = create_transaction_dataframe()

    features = build_features(
        dataframe
    )

    assert (
        features.iloc[0]["amount_log"]
        > 0
    )


def test_customer_success_rate_is_valid() -> None:
    dataframe = create_transaction_dataframe()

    features = build_features(
        dataframe
    )

    success_rate = (
        features.iloc[0]["customer_success_rate"]
    )

    assert 0 <= success_rate <= 1