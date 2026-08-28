from datetime import datetime, timezone
from uuid import uuid4


def register_and_login(client, prefix="dashboard"):
    email = f"{prefix}-{uuid4().hex[:8]}@example.com"
    password = "StrongPassword123!"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "business_name": "Dashboard Test Business",
            "email": email,
            "password": password,
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200

    return login_response.json()["access_token"]


def create_failed_transaction(client, token):
    response = client.post(
        "/api/v1/transactions",
        json={
            "transaction_reference": f"TXN-{uuid4().hex[:10]}",
            "customer_name": "Dashboard Customer",
            "customer_email": "customer@example.com",
            "amount": "2499.50",
            "currency": "INR",
            "payment_method": "CARD",
            "status": "FAILED",
            "failure_reason": "Card declined",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 201

    return response.json()


def create_recovery_case(client, token, transaction_id):
    response = client.post(
        "/api/v1/recovery-cases",
        json={
            "transaction_id": transaction_id,
            "reason": "PAYMENT_FAILURE",
            "priority": "medium",
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 201

    return response.json()


def test_dashboard_summary_requires_authentication(client):
    response = client.get(
        "/api/v1/dashboard/summary",
    )

    assert response.status_code == 401


def test_dashboard_recent_attempts_requires_authentication(client):
    response = client.get(
        "/api/v1/dashboard/recent-attempts",
    )

    assert response.status_code == 401


def test_dashboard_summary_returns_zero_values_for_new_merchant(client):
    token = register_and_login(
        client,
        "dashboard-empty",
    )

    response = client.get(
        "/api/v1/dashboard/summary",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_transactions"] == 0
    assert data["failed_transactions"] == 0
    assert data["total_transaction_amount"] == "0.00"
    assert data["total_amount_at_risk"] == "0.00"
    assert data["total_recovery_cases"] == 0
    assert data["open_recovery_cases"] == 0
    assert data["recovered_recovery_cases"] == 0
    assert data["total_recovery_attempts"] == 0
    assert data["completed_recovery_attempts"] == 0
    assert data["recovery_rate"] == "0.00"


def test_dashboard_summary_calculates_recovery_metrics(client):
    token = register_and_login(
        client,
        "dashboard-metrics",
    )

    transaction = create_failed_transaction(
        client,
        token,
    )

    recovery_case = create_recovery_case(
        client,
        token,
        transaction["id"],
    )

    process_response = client.post(
        f"/api/v1/recovery-cases/{recovery_case['id']}/process",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert process_response.status_code == 201

    response = client.get(
        "/api/v1/dashboard/summary",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_transactions"] == 1
    assert data["failed_transactions"] == 1
    assert data["total_transaction_amount"] == "2499.50"
    assert data["total_amount_at_risk"] == "2499.50"
    assert data["total_recovery_cases"] == 1
    assert data["open_recovery_cases"] == 0
    assert data["recovered_recovery_cases"] == 1
    assert data["total_recovery_attempts"] == 1
    assert data["completed_recovery_attempts"] == 1
    assert data["recovery_rate"] == "100.00"


def test_dashboard_recent_attempts_returns_processed_attempt(
    client,
):
    token = register_and_login(
        client,
        "dashboard-recent",
    )

    transaction = create_failed_transaction(
        client,
        token,
    )

    recovery_case = create_recovery_case(
        client,
        token,
        transaction["id"],
    )

    process_response = client.post(
        f"/api/v1/recovery-cases/{recovery_case['id']}/process",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert process_response.status_code == 201

    response = client.get(
        "/api/v1/dashboard/recent-attempts",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    attempts = response.json()

    assert len(attempts) == 1
    assert attempts[0]["recovery_case_id"] == recovery_case["id"]
    assert attempts[0]["channel"] == "PAYMENT"
    assert attempts[0]["action"] == "PAYMENT_RETRY"
    assert attempts[0]["status"] == "COMPLETED"
    assert attempts[0]["attempted_at"] is not None


def test_dashboard_data_is_isolated_between_merchants(client):
    first_token = register_and_login(
        client,
        "dashboard-owner",
    )

    second_token = register_and_login(
        client,
        "dashboard-other",
    )

    transaction = create_failed_transaction(
        client,
        first_token,
    )

    recovery_case = create_recovery_case(
        client,
        first_token,
        transaction["id"],
    )

    process_response = client.post(
        f"/api/v1/recovery-cases/{recovery_case['id']}/process",
        headers={
            "Authorization": f"Bearer {first_token}",
        },
    )

    assert process_response.status_code == 201

    first_summary = client.get(
        "/api/v1/dashboard/summary",
        headers={
            "Authorization": f"Bearer {first_token}",
        },
    )

    assert first_summary.status_code == 200
    assert first_summary.json()["total_transactions"] == 1
    assert first_summary.json()["total_recovery_cases"] == 1
    assert first_summary.json()["total_recovery_attempts"] == 1

    second_summary = client.get(
        "/api/v1/dashboard/summary",
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert second_summary.status_code == 200
    assert second_summary.json()["total_transactions"] == 0
    assert second_summary.json()["total_recovery_cases"] == 0
    assert second_summary.json()["total_recovery_attempts"] == 0

    second_recent_attempts = client.get(
        "/api/v1/dashboard/recent-attempts",
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert second_recent_attempts.status_code == 200
    assert second_recent_attempts.json() == []