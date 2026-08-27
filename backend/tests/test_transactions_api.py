from datetime import datetime, timezone
from uuid import uuid4


def register_and_login(client):
    email = f"transaction-{uuid4().hex[:8]}@example.com"
    password = "StrongPassword123!"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "business_name": "Transaction Test Business",
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


def create_transaction_payload(reference=None):
    return {
        "transaction_reference": reference
        or f"TXN-{uuid4().hex[:10]}",
        "customer_name": "Test Customer",
        "customer_email": "customer@example.com",
        "amount": "2499.50",
        "currency": "inr",
        "payment_method": "CARD",
        "status": "failed",
        "failure_reason": "Card declined",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    }


def test_create_transaction(client):
    token = register_and_login(client)

    response = client.post(
        "/api/v1/transactions",
        json=create_transaction_payload(),
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 201

    transaction = response.json()

    assert transaction["transaction_reference"]
    assert transaction["customer_name"] == "Test Customer"
    assert transaction["customer_email"] == "customer@example.com"
    assert transaction["amount"] == "2499.50"
    assert transaction["currency"] == "INR"
    assert transaction["payment_method"] == "CARD"
    assert transaction["status"] == "FAILED"
    assert transaction["failure_reason"] == "Card declined"


def test_get_transaction(client):
    token = register_and_login(client)

    create_response = client.post(
        "/api/v1/transactions",
        json=create_transaction_payload(),
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert create_response.status_code == 201

    transaction_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/transactions/{transaction_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert response.json()["id"] == transaction_id


def test_list_transactions(client):
    token = register_and_login(client)

    first_response = client.post(
        "/api/v1/transactions",
        json=create_transaction_payload(),
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    second_response = client.post(
        "/api/v1/transactions",
        json=create_transaction_payload(),
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get(
        "/api/v1/transactions",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    transactions = response.json()

    assert len(transactions) == 2


def test_duplicate_transaction_reference_is_rejected(client):
    token = register_and_login(client)
    reference = f"DUP-{uuid4().hex[:10]}"

    first_response = client.post(
        "/api/v1/transactions",
        json=create_transaction_payload(reference),
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/transactions",
        json=create_transaction_payload(reference),
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert second_response.status_code == 409
    assert second_response.json()["detail"] == (
        "A transaction with this reference already exists."
    )


def test_transaction_endpoint_requires_authentication(client):
    response = client.post(
        "/api/v1/transactions",
        json=create_transaction_payload(),
    )

    assert response.status_code == 401


def test_merchant_cannot_access_another_merchants_transaction(client):
    first_token = register_and_login(client)
    second_token = register_and_login(client)

    create_response = client.post(
        "/api/v1/transactions",
        json=create_transaction_payload(),
        headers={
            "Authorization": f"Bearer {first_token}",
        },
    )

    assert create_response.status_code == 201

    transaction_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/transactions/{transaction_id}",
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Transaction not found."