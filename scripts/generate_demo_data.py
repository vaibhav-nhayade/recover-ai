from __future__ import annotations

import csv
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"

TRANSACTIONS_PATH = DATA_DIR / "demo_transactions.csv"
SCENARIOS_PATH = DATA_DIR / "demo_recovery_scenarios.csv"


TRANSACTIONS = [
    {
        "transaction_reference": "PAY_83921",
        "customer_id": "CUS_1042",
        "customer_name": "Rahul Sharma",
        "customer_email": "rahul.sharma@example.com",
        "amount": "24999",
        "currency": "INR",
        "payment_method": "UPI",
        "status": "FAILED",
        "failure_reason": "UPI timeout",
        "transaction_attempts": "3",
        "customer_successful_transactions": "18",
        "customer_failed_transactions": "3",
        "occurred_at": "2026-09-04T18:30:00",
    },
    {
        "transaction_reference": "PAY_83918",
        "customer_id": "CUS_1088",
        "customer_name": "Priya Mehta",
        "customer_email": "priya.mehta@example.com",
        "amount": "18900",
        "currency": "INR",
        "payment_method": "CARD",
        "status": "FAILED",
        "failure_reason": "Bank decline",
        "transaction_attempts": "2",
        "customer_successful_transactions": "14",
        "customer_failed_transactions": "2",
        "occurred_at": "2026-09-04T16:42:00",
    },
    {
        "transaction_reference": "PAY_83914",
        "customer_id": "CUS_1102",
        "customer_name": "Arjun Patil",
        "customer_email": "arjun.patil@example.com",
        "amount": "6200",
        "currency": "INR",
        "payment_method": "NETBANKING",
        "status": "FAILED",
        "failure_reason": "Gateway timeout",
        "transaction_attempts": "1",
        "customer_successful_transactions": "9",
        "customer_failed_transactions": "1",
        "occurred_at": "2026-09-04T15:20:00",
    },
    {
        "transaction_reference": "PAY_83897",
        "customer_id": "CUS_1154",
        "customer_name": "Neha Joshi",
        "customer_email": "neha.joshi@example.com",
        "amount": "4800",
        "currency": "INR",
        "payment_method": "WALLET",
        "status": "FAILED",
        "failure_reason": "Wallet unavailable",
        "transaction_attempts": "2",
        "customer_successful_transactions": "7",
        "customer_failed_transactions": "3",
        "occurred_at": "2026-09-04T14:10:00",
    },
    {
        "transaction_reference": "PAY_83891",
        "customer_id": "CUS_1201",
        "customer_name": "Rohan Kulkarni",
        "customer_email": "rohan.kulkarni@example.com",
        "amount": "12500",
        "currency": "INR",
        "payment_method": "UPI",
        "status": "FAILED",
        "failure_reason": "UPI timeout",
        "transaction_attempts": "1",
        "customer_successful_transactions": "22",
        "customer_failed_transactions": "1",
        "occurred_at": "2026-09-04T13:45:00",
    },
    {
        "transaction_reference": "PAY_83884",
        "customer_id": "CUS_1218",
        "customer_name": "Ananya Shah",
        "customer_email": "ananya.shah@example.com",
        "amount": "8500",
        "currency": "INR",
        "payment_method": "CARD",
        "status": "FAILED",
        "failure_reason": "Insufficient funds",
        "transaction_attempts": "2",
        "customer_successful_transactions": "11",
        "customer_failed_transactions": "4",
        "occurred_at": "2026-09-04T12:35:00",
    },
    {
        "transaction_reference": "PAY_83876",
        "customer_id": "CUS_1244",
        "customer_name": "Vikram Deshmukh",
        "customer_email": "vikram.deshmukh@example.com",
        "amount": "31500",
        "currency": "INR",
        "payment_method": "UPI",
        "status": "SUCCESS",
        "failure_reason": "",
        "transaction_attempts": "1",
        "customer_successful_transactions": "31",
        "customer_failed_transactions": "2",
        "occurred_at": "2026-09-04T11:20:00",
    },
    {
        "transaction_reference": "PAY_83865",
        "customer_id": "CUS_1267",
        "customer_name": "Sneha Rao",
        "customer_email": "sneha.rao@example.com",
        "amount": "18500",
        "currency": "INR",
        "payment_method": "CARD",
        "status": "SUCCESS",
        "failure_reason": "",
        "transaction_attempts": "1",
        "customer_successful_transactions": "16",
        "customer_failed_transactions": "1",
        "occurred_at": "2026-09-04T10:55:00",
    },
    {
        "transaction_reference": "PAY_83852",
        "customer_id": "CUS_1291",
        "customer_name": "Amit Verma",
        "customer_email": "amit.verma@example.com",
        "amount": "4200",
        "currency": "INR",
        "payment_method": "UPI",
        "status": "FAILED",
        "failure_reason": "Gateway timeout",
        "transaction_attempts": "2",
        "customer_successful_transactions": "6",
        "customer_failed_transactions": "2",
        "occurred_at": "2026-09-04T10:20:00",
    },
    {
        "transaction_reference": "PAY_83841",
        "customer_id": "CUS_1310",
        "customer_name": "Kavya Nair",
        "customer_email": "kavya.nair@example.com",
        "amount": "72000",
        "currency": "INR",
        "payment_method": "CARD",
        "status": "FAILED",
        "failure_reason": "Bank decline",
        "transaction_attempts": "3",
        "customer_successful_transactions": "28",
        "customer_failed_transactions": "2",
        "occurred_at": "2026-09-04T09:45:00",
    },
]


SCENARIOS = [
    {
        "case_id": "CASE_001",
        "transaction_reference": "PAY_83921",
        "recovery_type": "PAYMENT_FAILURE",
        "priority": "HIGH",
        "amount_at_risk": "24999",
        "recovery_probability": "0.84",
        "recommended_strategy": "PAYMENT_RETRY",
        "expected_recovery": "20999.16",
        "escalation_required": "false",
        "scenario": "High-value UPI timeout with strong customer history",
    },
    {
        "case_id": "CASE_002",
        "transaction_reference": "PAY_83918",
        "recovery_type": "PAYMENT_FAILURE",
        "priority": "HIGH",
        "amount_at_risk": "18900",
        "recovery_probability": "0.61",
        "recommended_strategy": "PAYMENT_RETRY",
        "expected_recovery": "11529.00",
        "escalation_required": "false",
        "scenario": "Card bank decline with repeat customer",
    },
    {
        "case_id": "CASE_003",
        "transaction_reference": "PAY_83914",
        "recovery_type": "PAYMENT_FAILURE",
        "priority": "MEDIUM",
        "amount_at_risk": "6200",
        "recovery_probability": "0.67",
        "recommended_strategy": "CUSTOMER_CONTACT",
        "expected_recovery": "4154.00",
        "escalation_required": "false",
        "scenario": "Gateway timeout requiring customer retry",
    },
    {
        "case_id": "CASE_004",
        "transaction_reference": "PAY_83897",
        "recovery_type": "PAYMENT_FAILURE",
        "priority": "LOW",
        "amount_at_risk": "4800",
        "recovery_probability": "0.32",
        "recommended_strategy": "CUSTOMER_CONTACT",
        "expected_recovery": "1536.00",
        "escalation_required": "false",
        "scenario": "Wallet unavailable with lower recovery confidence",
    },
    {
        "case_id": "CASE_005",
        "transaction_reference": "PAY_83891",
        "recovery_type": "PAYMENT_FAILURE",
        "priority": "HIGH",
        "amount_at_risk": "12500",
        "recovery_probability": "0.78",
        "recommended_strategy": "PAYMENT_RETRY",
        "expected_recovery": "9750.00",
        "escalation_required": "false",
        "scenario": "UPI timeout with strong historical success",
    },
    {
        "case_id": "CASE_006",
        "transaction_reference": "PAY_83884",
        "recovery_type": "PAYMENT_FAILURE",
        "priority": "MEDIUM",
        "amount_at_risk": "8500",
        "recovery_probability": "0.38",
        "recommended_strategy": "CUSTOMER_CONTACT",
        "expected_recovery": "3230.00",
        "escalation_required": "false",
        "scenario": "Insufficient funds requiring customer action",
    },
    {
        "case_id": "CASE_007",
        "transaction_reference": "PAY_83841",
        "recovery_type": "PAYMENT_FAILURE",
        "priority": "HIGH",
        "amount_at_risk": "72000",
        "recovery_probability": "0.46",
        "recommended_strategy": "MANUAL_REVIEW",
        "expected_recovery": "33120.00",
        "escalation_required": "true",
        "scenario": "High-value transaction requiring human review",
    },
]


def write_csv(
    path: Path,
    rows: list[dict[str, str]],
) -> None:
    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not rows:
        return

    with path.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=list(rows[0].keys()),
        )

        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    write_csv(
        TRANSACTIONS_PATH,
        TRANSACTIONS,
    )

    write_csv(
        SCENARIOS_PATH,
        SCENARIOS,
    )

    print(
        f"Generated {len(TRANSACTIONS)} demo transactions."
    )

    print(
        f"Generated {len(SCENARIOS)} recovery scenarios."
    )

    print(
        f"Transaction data: {TRANSACTIONS_PATH}"
    )

    print(
        f"Recovery scenarios: {SCENARIOS_PATH}"
    )


if __name__ == "__main__":
    main()