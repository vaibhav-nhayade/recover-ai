from datetime import datetime, timezone
from uuid import uuid4


def register_and_login(client, prefix="recovery"):
    email = f"{prefix}-{uuid4().hex[:8]}@example.com"
    password = "StrongPassword123!"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "business_name": "Recovery Test Business",
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


def create_transaction(client, token, status="FAILED"):
    payload = {
        "transaction_reference": f"TXN-{uuid4().hex[:10]}",
        "customer_name": "Recovery Customer",
        "customer_email": "customer@example.com",
        "amount": "2499.50",
        "currency": "INR",
        "payment_method": "CARD",
        "status": status,
        "failure_reason": "Card declined",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    }

    response = client.post(
        "/api/v1/transactions",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 201

    return response.json()


def test_create_recovery_case(client):
    token = register_and_login(client)
    transaction = create_transaction(client, token)

    response = client.post(
        "/api/v1/recovery-cases",
        json={
            "transaction_id": transaction["id"],
            "reason": "PAYMENT_FAILURE",
            "priority": "medium",
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 201

    case = response.json()

    assert case["transaction_id"] == transaction["id"]
    assert case["merchant_id"] == transaction["merchant_id"]
    assert case["amount_at_risk"] == "2499.50"
    assert case["reason"] == "PAYMENT_FAILURE"
    assert case["priority"] == "MEDIUM"
    assert case["status"] == "OPEN"


def test_auto_create_recovery_case(client):
    token = register_and_login(client)
    transaction = create_transaction(client, token)

    response = client.post(
        f"/api/v1/recovery-cases/{transaction['id']}/auto-create",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 201

    case = response.json()

    assert case["transaction_id"] == transaction["id"]
    assert case["merchant_id"] == transaction["merchant_id"]
    assert case["status"] == "OPEN"
    assert case["priority"] == "MEDIUM"
    assert case["amount_at_risk"] == "2499.50"


def test_list_recovery_cases(client):
    token = register_and_login(client)

    first_transaction = create_transaction(client, token)
    second_transaction = create_transaction(client, token)

    for transaction in [first_transaction, second_transaction]:
        response = client.post(
            "/api/v1/recovery-cases",
            json={
                "transaction_id": transaction["id"],
                "reason": "PAYMENT_FAILURE",
                "priority": "medium",
            },
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 201

    response = client.get(
        "/api/v1/recovery-cases",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    cases = response.json()

    assert len(cases) == 2


def test_get_recovery_case(client):
    token = register_and_login(client)
    transaction = create_transaction(client, token)

    create_response = client.post(
        "/api/v1/recovery-cases",
        json={
            "transaction_id": transaction["id"],
            "reason": "PAYMENT_FAILURE",
            "priority": "high",
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert create_response.status_code == 201

    case_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/recovery-cases/{case_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert response.json()["id"] == case_id


def test_update_recovery_case_status(client):
    token = register_and_login(client)
    transaction = create_transaction(client, token)

    create_response = client.post(
        "/api/v1/recovery-cases",
        json={
            "transaction_id": transaction["id"],
            "reason": "PAYMENT_FAILURE",
            "priority": "medium",
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert create_response.status_code == 201

    case_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/recovery-cases/{case_id}/status",
        json={
            "status": "in_progress",
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


def test_duplicate_recovery_case_is_rejected(client):
    token = register_and_login(client)
    transaction = create_transaction(client, token)

    payload = {
        "transaction_id": transaction["id"],
        "reason": "PAYMENT_FAILURE",
        "priority": "medium",
    }

    first_response = client.post(
        "/api/v1/recovery-cases",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/recovery-cases",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert second_response.status_code == 409
    assert second_response.json()["detail"] == (
        "A recovery case already exists for this transaction."
    )


def test_auto_create_rejects_ineligible_transaction(client):
    token = register_and_login(client)

    transaction = create_transaction(
        client,
        token,
        status="COMPLETED",
    )

    response = client.post(
        f"/api/v1/recovery-cases/{transaction['id']}/auto-create",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Transaction is not eligible for recovery."
    )


def test_recovery_case_requires_authentication(client):
    token = register_and_login(client)
    transaction = create_transaction(client, token)

    response = client.post(
        "/api/v1/recovery-cases",
        json={
            "transaction_id": transaction["id"],
            "reason": "PAYMENT_FAILURE",
            "priority": "medium",
        },
    )

    assert response.status_code == 401


def test_merchant_cannot_create_case_for_another_merchants_transaction(
    client,
):
    first_token = register_and_login(client, "merchant-one")
    second_token = register_and_login(client, "merchant-two")

    transaction = create_transaction(
        client,
        first_token,
    )

    response = client.post(
        "/api/v1/recovery-cases",
        json={
            "transaction_id": transaction["id"],
            "reason": "PAYMENT_FAILURE",
            "priority": "medium",
        },
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Transaction not found."


def test_merchant_cannot_view_another_merchants_case(client):
    first_token = register_and_login(client, "merchant-three")
    second_token = register_and_login(client, "merchant-four")

    transaction = create_transaction(
        client,
        first_token,
    )

    create_response = client.post(
        "/api/v1/recovery-cases",
        json={
            "transaction_id": transaction["id"],
            "reason": "PAYMENT_FAILURE",
            "priority": "medium",
        },
        headers={
            "Authorization": f"Bearer {first_token}",
        },
    )

    assert create_response.status_code == 201

    case_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/recovery-cases/{case_id}",
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Recovery case not found."