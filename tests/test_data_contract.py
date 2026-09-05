from __future__ import annotations

import csv
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = (
    ROOT_DIR
    / "data"
    / "demo_transactions.csv"
)


REQUIRED_COLUMNS = {
    "transaction_reference",
    "customer_id",
    "customer_name",
    "customer_email",
    "amount",
    "currency",
    "payment_method",
    "status",
    "failure_reason",
    "transaction_attempts",
    "customer_successful_transactions",
    "customer_failed_transactions",
    "occurred_at",
}


VALID_PAYMENT_METHODS = {
    "UPI",
    "CARD",
    "NETBANKING",
    "WALLET",
}


VALID_STATUSES = {
    "SUCCESS",
    "FAILED",
    "PENDING",
}


def load_transactions() -> list[dict[str, str]]:
    with DATA_PATH.open(
        "r",
        encoding="utf-8",
    ) as file:
        return list(
            csv.DictReader(file)
        )


def test_demo_transaction_dataset_exists() -> None:
    assert DATA_PATH.exists()


def test_demo_transaction_schema() -> None:
    rows = load_transactions()

    assert rows

    assert REQUIRED_COLUMNS.issubset(
        rows[0].keys()
    )


def test_demo_transactions_have_valid_payment_methods() -> None:
    rows = load_transactions()

    for row in rows:
        assert (
            row["payment_method"]
            in VALID_PAYMENT_METHODS
        )


def test_demo_transactions_have_valid_statuses() -> None:
    rows = load_transactions()

    for row in rows:
        assert (
            row["status"]
            in VALID_STATUSES
        )


def test_demo_transaction_amounts_are_positive() -> None:
    rows = load_transactions()

    for row in rows:
        assert float(row["amount"]) > 0


def test_failed_transactions_have_failure_reason() -> None:
    rows = load_transactions()

    for row in rows:
        if row["status"] == "FAILED":
            assert row["failure_reason"].strip()