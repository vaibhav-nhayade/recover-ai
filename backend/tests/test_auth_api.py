from uuid import uuid4


def test_register_login_and_get_current_merchant(client):
    email = f"merchant-{uuid4().hex[:8]}@example.com"

    register_payload = {
        "business_name": "Integration Test Business",
        "legal_name": "Integration Test Business Pvt Ltd",
        "email": email,
        "phone": "+919999999999",
        "password": "StrongPassword123!",
        "industry": "Technology",
        "country": "IN",
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    }

    register_response = client.post(
        "/api/v1/auth/register",
        json=register_payload,
    )

    assert register_response.status_code == 201

    merchant = register_response.json()

    assert merchant["email"] == email
    assert merchant["business_name"] == "Integration Test Business"
    assert merchant["status"] == "ACTIVE"

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "StrongPassword123!",
        },
    )

    assert login_response.status_code == 200

    token_data = login_response.json()

    assert token_data["token_type"] == "bearer"
    assert token_data["access_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": (
                f"Bearer {token_data['access_token']}"
            )
        },
    )

    assert me_response.status_code == 200

    current_merchant = me_response.json()

    assert current_merchant["id"] == merchant["id"]
    assert current_merchant["email"] == email


def test_login_rejects_invalid_password(client):
    email = f"invalid-{uuid4().hex[:8]}@example.com"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "business_name": "Invalid Login Test",
            "email": email,
            "password": "StrongPassword123!",
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "WrongPassword123!",
        },
    )

    assert login_response.status_code == 401
    assert login_response.json()["detail"] == (
        "Invalid email or password."
    )