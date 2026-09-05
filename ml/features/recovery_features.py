from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    "amount",
    "payment_method_encoded",
    "failure_reason_encoded",
    "customer_success_rate",
    "customer_failure_rate",
    "customer_failed_attempts",
    "transaction_attempts",
    "hour_of_day",
    "day_of_week",
    "is_timeout",
    "is_decline",
    "is_insufficient_funds",
    "is_upi",
    "is_card",
    "is_netbanking",
    "is_wallet",
    "amount_log",
]


PAYMENT_METHOD_MAP = {
    "UPI": 1,
    "CARD": 2,
    "NETBANKING": 3,
    "WALLET": 4,
}


FAILURE_REASON_MAP = {
    "timeout": 1,
    "upi timeout": 1,
    "gateway timeout": 1,
    "bank timeout": 1,
    "decline": 2,
    "bank decline": 2,
    "insufficient funds": 3,
    "wallet unavailable": 4,
    "permanent failure": 5,
}


def normalize_text(value: Any) -> str:
    if value is None:
        return ""

    if pd.isna(value):
        return ""

    return str(value).strip().lower()


def encode_payment_method(value: Any) -> int:
    normalized = str(value).strip().upper()

    return PAYMENT_METHOD_MAP.get(normalized, 0)


def encode_failure_reason(value: Any) -> int:
    normalized = normalize_text(value)

    for reason, encoded in FAILURE_REASON_MAP.items():
        if reason in normalized:
            return encoded

    return 0


def safe_numeric_series(
    dataframe: pd.DataFrame,
    column: str,
) -> pd.Series:
    if column not in dataframe.columns:
        return pd.Series(
            np.zeros(len(dataframe)),
            index=dataframe.index,
            dtype=float,
        )

    return pd.to_numeric(
        dataframe[column],
        errors="coerce",
    ).fillna(0.0)


def build_features(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:
    """
    Convert raw recovery transaction data into ML-ready features.

    The feature pipeline intentionally uses only information that
    can reasonably exist before the recovery intervention is executed.
    """

    df = dataframe.copy()

    amount = safe_numeric_series(df, "amount")

    payment_method = (
        df["payment_method"]
        if "payment_method" in df.columns
        else pd.Series("", index=df.index)
    )

    failure_reason = (
        df["failure_reason"]
        if "failure_reason" in df.columns
        else pd.Series("", index=df.index)
    )

    customer_successful_transactions = safe_numeric_series(
        df,
        "customer_successful_transactions",
    )

    customer_failed_transactions = safe_numeric_series(
        df,
        "customer_failed_transactions",
    )

    transaction_attempts = safe_numeric_series(
        df,
        "transaction_attempts",
    )

    total_customer_transactions = (
        customer_successful_transactions
        + customer_failed_transactions
    )

    customer_success_rate = (
        customer_successful_transactions
        / total_customer_transactions.replace(0, 1)
    )

    customer_failure_rate = (
        customer_failed_transactions
        / total_customer_transactions.replace(0, 1)
    )

    if "occurred_at" in df.columns:
        occurred_at = pd.to_datetime(
            df["occurred_at"],
            errors="coerce",
        )

        hour_of_day = (
            occurred_at.dt.hour
            .fillna(12)
            .astype(float)
        )

        day_of_week = (
            occurred_at.dt.dayofweek
            .fillna(0)
            .astype(float)
        )
    else:
        hour_of_day = pd.Series(
            np.full(len(df), 12.0),
            index=df.index,
        )

        day_of_week = pd.Series(
            np.zeros(len(df)),
            index=df.index,
        )

    normalized_failure_reason = (
        failure_reason
        .astype(str)
        .str.lower()
    )

    normalized_payment_method = (
        payment_method
        .astype(str)
        .str.upper()
    )

    features = pd.DataFrame(index=df.index)

    features["amount"] = amount
    features["payment_method_encoded"] = (
        payment_method.map(encode_payment_method)
    )
    features["failure_reason_encoded"] = (
        failure_reason.map(encode_failure_reason)
    )

    features["customer_success_rate"] = (
        customer_success_rate
    )

    features["customer_failure_rate"] = (
        customer_failure_rate
    )

    features["customer_failed_attempts"] = (
        customer_failed_transactions
    )

    features["transaction_attempts"] = (
        transaction_attempts
    )

    features["hour_of_day"] = hour_of_day
    features["day_of_week"] = day_of_week

    features["is_timeout"] = (
        normalized_failure_reason.str.contains(
            "timeout",
            na=False,
        )
        .astype(int)
    )

    features["is_decline"] = (
        normalized_failure_reason.str.contains(
            "decline",
            na=False,
        )
        .astype(int)
    )

    features["is_insufficient_funds"] = (
        normalized_failure_reason.str.contains(
            "insufficient",
            na=False,
        )
        .astype(int)
    )

    features["is_upi"] = (
        normalized_payment_method == "UPI"
    ).astype(int)

    features["is_card"] = (
        normalized_payment_method == "CARD"
    ).astype(int)

    features["is_netbanking"] = (
        normalized_payment_method == "NETBANKING"
    ).astype(int)

    features["is_wallet"] = (
        normalized_payment_method == "WALLET"
    ).astype(int)

    features["amount_log"] = np.log1p(
        amount.clip(lower=0)
    )

    features = features[
        FEATURE_COLUMNS
    ]

    return features.astype(float)