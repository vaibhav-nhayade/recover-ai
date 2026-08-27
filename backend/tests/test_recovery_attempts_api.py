from datetime import datetime, timezone
from uuid import uuid4


def register_and_login(client, prefix="attempt"):
    email = f"{prefix}-{uuid4().hex[:8]}@example.com"
    password = "StrongPassword123!"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "business_name": "Recovery Attempt Test Business",
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
            "customer_name": "Attempt Customer",
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


def test_process_recovery_case_creates_completed_attempt(client):
    token = register_and_login(client)

    transaction = create_failed_transaction(
        client,
        token,
    )

    recovery_case = create_recovery_case(
        client,
        token,
        transaction["id"],
    )

    response = client.post(
        f"/api/v1/recovery-cases/{recovery_case['id']}/process",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 201

    attempt = response.json()

    assert attempt["recovery_case_id"] == recovery_case["id"]
    assert attempt["status"] == "COMPLETED"
    assert attempt["channel"] == "PAYMENT"
    assert attempt["action"] == "PAYMENT_RETRY"
    assert attempt["message"]
    assert attempt["provider_reference"].startswith("MOCK-")
    assert attempt["attempted_at"] is not None


def test_process_recovery_case_updates_case_to_recovered(client):
    token = register_and_login(client)

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
        f"/api/v1/recovery-cases/{recovery_case['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "RECOVERED"
    assert response.json()["recovery_strategy"] == "PAYMENT_RETRY"


def test_process_recovered_case_is_rejected(client):
    token = register_and_login(client)

    transaction = create_failed_transaction(
        client,
        token,
    )

    recovery_case = create_recovery_case(
        client,
        token,
        transaction["id"],
    )

    first_response = client.post(
        f"/api/v1/recovery-cases/{recovery_case['id']}/process",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        f"/api/v1/recovery-cases/{recovery_case['id']}/process",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert second_response.status_code == 409
    assert "RECOVERED" in second_response.json()["detail"]


def test_process_case_requires_authentication(client):
    token = register_and_login(client)

    transaction = create_failed_transaction(
        client,
        token,
    )

    recovery_case = create_recovery_case(
        client,
        token,
        transaction["id"],
    )

    response = client.post(
        f"/api/v1/recovery-cases/{recovery_case['id']}/process",
    )

    assert response.status_code == 401


def test_merchant_cannot_process_another_merchants_case(client):
    first_token = register_and_login(
        client,
        "attempt-owner",
    )

    second_token = register_and_login(
        client,
        "attempt-other",
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

    response = client.post(
        f"/api/v1/recovery-cases/{recovery_case['id']}/process",
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Recovery case not found."
    )


def test_get_recovery_attempts_for_case(client):
    token = register_and_login(client)

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
        f"/api/v1/recovery-attempts/case/{recovery_case['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    attempts = response.json()

    assert len(attempts) == 1
    assert attempts[0]["recovery_case_id"] == recovery_case["id"]
    assert attempts[0]["status"] == "COMPLETED"


def test_get_recovery_attempt_requires_case_ownership(client):
    first_token = register_and_login(
        client,
        "attempt-owner-two",
    )

    second_token = register_and_login(
        client,
        "attempt-other-two",
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

    response = client.get(
        f"/api/v1/recovery-attempts/case/{recovery_case['id']}",
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert response.status_code == 404