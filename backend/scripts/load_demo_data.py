from __future__ import annotations

import csv
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.merchant import Merchant
from app.models.transaction import Transaction
from app.models.recovery_case import RecoveryCase


PROJECT_ROOT = Path(__file__).resolve().parents[2]

TRANSACTIONS_FILE = (
    PROJECT_ROOT / "data" / "demo_transactions.csv"
)

SCENARIOS_FILE = (
    PROJECT_ROOT / "data" / "demo_recovery_scenarios.csv"
)

DEMO_MERCHANT_EMAIL = "demo@gmail.com"


def parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value.strip())


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(
            f"Required demo data file not found: {path}"
        )

    with path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        return list(csv.DictReader(file))


def get_demo_merchant(db):
    merchant = db.scalar(
        select(Merchant).where(
            Merchant.email == DEMO_MERCHANT_EMAIL
        )
    )

    if merchant is None:
        raise RuntimeError(
            "Demo merchant was not found.\n"
            f"Expected merchant email: {DEMO_MERCHANT_EMAIL}\n"
            "Register/login with this merchant first."
        )

    return merchant


def load_transactions(
    db,
    merchant: Merchant,
    rows: list[dict[str, str]],
) -> dict[str, Transaction]:
    transactions_by_reference: dict[str, Transaction] = {}

    for row in rows:
        reference = row["transaction_reference"].strip()

        transaction = db.scalar(
            select(Transaction).where(
                Transaction.transaction_reference
                == reference
            )
        )

        if transaction is None:
            transaction = Transaction(
                merchant_id=merchant.id,
                transaction_reference=reference,
            )
            db.add(transaction)

        transaction.merchant_id = merchant.id
        transaction.customer_name = (
            row["customer_name"].strip()
        )
        transaction.customer_email = (
            row["customer_email"].strip()
        )
        transaction.amount = Decimal(
            row["amount"].strip()
        )
        transaction.currency = row["currency"].strip()
        transaction.payment_method = (
            row["payment_method"].strip()
        )
        transaction.status = row["status"].strip()
        transaction.failure_reason = (
            row["failure_reason"].strip()
            if row["failure_reason"].strip()
            else None
        )
        transaction.occurred_at = parse_datetime(
            row["occurred_at"]
        )

        transactions_by_reference[reference] = transaction

    db.flush()

    return transactions_by_reference


def load_recovery_cases(
    db,
    merchant: Merchant,
    rows: list[dict[str, str]],
    transactions_by_reference: dict[str, Transaction],
) -> int:
    loaded = 0

    for row in rows:
        reference = row[
            "transaction_reference"
        ].strip()

        transaction = transactions_by_reference.get(
            reference
        )

        if transaction is None:
            raise RuntimeError(
                "Recovery scenario references a transaction "
                f"that does not exist: {reference}"
            )

        case = db.scalar(
            select(RecoveryCase).where(
                RecoveryCase.transaction_id
                == transaction.id
            )
        )

        if case is None:
            case = RecoveryCase(
                merchant_id=merchant.id,
                transaction_id=transaction.id,
            )
            db.add(case)

        escalation_required = (
            row["escalation_required"]
            .strip()
            .lower()
            == "true"
        )

        scenario_notes = (
            "RECOVERAI DEMO SCENARIO\n"
            "-----------------------\n"
            f"case_id: {row['case_id'].strip()}\n"
            f"recovery_type: "
            f"{row['recovery_type'].strip()}\n"
            f"recovery_probability: "
            f"{row['recovery_probability'].strip()}\n"
            f"recommended_strategy: "
            f"{row['recommended_strategy'].strip()}\n"
            f"expected_recovery: "
            f"{row['expected_recovery'].strip()}\n"
            f"escalation_required: "
            f"{escalation_required}\n"
            f"scenario: {row['scenario'].strip()}"
        )

        case.merchant_id = merchant.id
        case.transaction_id = transaction.id
        case.amount_at_risk = Decimal(
            row["amount_at_risk"].strip()
        )
        case.reason = row[
            "recovery_type"
        ].strip()
        case.priority = row[
            "priority"
        ].strip()
        case.recovery_strategy = row[
            "recommended_strategy"
        ].strip()

        # Every imported scenario starts OPEN.
        # The agent decides whether to execute or escalate.
        case.status = "OPEN"
        case.notes = scenario_notes

        loaded += 1

    db.flush()

    return loaded


def main() -> None:
    print()
    print("=" * 60)
    print("RecoverAI — Demo Dataset Loader")
    print("=" * 60)
    print()
    print(f"Transactions CSV : {TRANSACTIONS_FILE}")
    print(f"Scenarios CSV    : {SCENARIOS_FILE}")
    print()

    transaction_rows = load_csv(
        TRANSACTIONS_FILE
    )

    scenario_rows = load_csv(
        SCENARIOS_FILE
    )

    print(
        f"Transactions found : {len(transaction_rows)}"
    )
    print(
        f"Scenarios found    : {len(scenario_rows)}"
    )
    print()

    db = SessionLocal()

    try:
        merchant = get_demo_merchant(db)

        print(
            f"Merchant           : {merchant.business_name}"
        )
        print(
            f"Merchant email     : {merchant.email}"
        )
        print(
            f"Merchant ID        : {merchant.id}"
        )
        print()

        transactions = load_transactions(
            db=db,
            merchant=merchant,
            rows=transaction_rows,
        )

        cases_loaded = load_recovery_cases(
            db=db,
            merchant=merchant,
            rows=scenario_rows,
            transactions_by_reference=transactions,
        )

        db.commit()

        print("DATASET LOADED SUCCESSFULLY")
        print("-" * 60)
        print(
            f"Transactions loaded : {len(transactions)}"
        )
        print(
            f"Recovery cases      : {cases_loaded}"
        )

        failed_amount = sum(
            (
                Decimal(row["amount"].strip())
                for row in transaction_rows
                if row["status"].strip() == "FAILED"
            ),
            Decimal("0"),
        )

        scenario_amount = sum(
            (
                Decimal(
                    row["amount_at_risk"].strip()
                )
                for row in scenario_rows
            ),
            Decimal("0"),
        )

        expected_recovery = sum(
            (
                Decimal(
                    row["expected_recovery"].strip()
                )
                for row in scenario_rows
            ),
            Decimal("0"),
        )

        escalation_count = sum(
            (
                row["escalation_required"]
                .strip()
                .lower()
                == "true"
                for row in scenario_rows
            )
        )

        print(
            f"Failed transaction value: "
            f"₹{failed_amount:,.2f}"
        )
        print(
            f"Scenario revenue at risk: "
            f"₹{scenario_amount:,.2f}"
        )
        print(
            f"Expected recovery: "
            f"₹{expected_recovery:,.2f}"
        )
        print(
            f"Predefined escalations: "
            f"{escalation_count}"
        )
        print()
        print(
            "Recovered revenue remains ₹0 until "
            "the RecoverAI agent executes and verifies "
            "an actual recovery outcome."
        )
        print()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()