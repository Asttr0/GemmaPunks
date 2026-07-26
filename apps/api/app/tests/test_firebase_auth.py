from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.models import Membership
from app.core.store import db_store
from app.main import app

client = TestClient(app)


def test_missing_auth_header_development():
    response = client.get("/api/v1/transactions")
    assert response.status_code == 200


def test_invalid_bearer_token():
    response = client.get(
        "/api/v1/transactions",
        headers={"Authorization": "Bearer invalid"},
    )
    assert response.status_code == 401


def test_synthetic_test_token():
    response = client.get(
        "/api/v1/transactions",
        headers={"Authorization": "Bearer test_token_usr01_merchant-berrechid"},
    )
    assert response.status_code == 200


@patch("app.modules.auth.dependencies.verify_firebase_id_token")
def test_valid_firebase_id_token(mock_verify):
    mock_verify.return_value = {
        "uid": "fb_user_123",
        "email": "fb_merchant@example.com",
        "organization_id": "merchant-berrechid",
        "role": "OWNER",
    }
    db_store.memberships["merchant-berrechid"].append(
        Membership(
            organization_id="merchant-berrechid",
            user_id="fb_user_123",
            role="OWNER",
        )
    )

    response = client.get(
        "/api/v1/transactions",
        headers={"Authorization": "Bearer valid_firebase_token_string"},
    )

    assert response.status_code == 200
    mock_verify.assert_called_once_with("valid_firebase_token_string")


def test_auth_me_endpoint():
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer test_token_usr01_merchant-berrechid"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert data["user"]["organization_id"] == "merchant-berrechid"


def test_auth_signup_endpoint():
    request = {
        "email": "newuser@example.com",
        "display_name": "New Merchant Owner",
        "organization_name": "New Berrechid Store",
        "organization_type": "MERCHANT",
    }
    headers = {"Authorization": "Bearer test_token_newusr_neworg"}

    response = client.post("/api/v1/auth/signup", json=request, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["organization"]["name"] == "New Berrechid Store"
    assert data["profile"]["display_name"] == "New Merchant Owner"
    organization_id = data["organization"]["organization_id"]
    memberships = db_store.memberships[organization_id]
    assert len(memberships) == 1
    assert memberships[0].user_id == "newusr"

    retry = client.post("/api/v1/auth/signup", json=request, headers=headers)
    assert retry.status_code == 200
    assert retry.json()["organization"]["organization_id"] == organization_id
    assert len(db_store.memberships[organization_id]) == 1


@patch("app.modules.auth.dependencies.verify_firebase_id_token")
def test_signup_rejects_email_that_does_not_match_token(mock_verify):
    mock_verify.return_value = {
        "uid": "fb_new_user",
        "email": "verified@example.com",
    }
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "different@example.com",
            "display_name": "Verified User",
            "organization_name": "Verified Store",
            "organization_type": "MERCHANT",
        },
        headers={"Authorization": "Bearer valid_new_user_token"},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Email must match the authenticated Firebase account"
    assert db_store.get_profile("fb_new_user") is None


@patch("app.modules.auth.dependencies.verify_firebase_id_token")
def test_business_endpoint_rejects_unregistered_firebase_user(mock_verify):
    mock_verify.return_value = {
        "uid": "fb_unregistered_user",
        "email": "unregistered@example.com",
    }

    response = client.get(
        "/api/v1/transactions",
        headers={"Authorization": "Bearer valid_unregistered_token"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Account setup required"


@patch("app.modules.auth.dependencies.verify_firebase_id_token")
def test_existing_profile_resolves_access_without_fresh_claims(mock_verify):
    mock_verify.return_value = {
        "uid": "demo-merchant",
        "email": "merchant.demo@example.com",
    }

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer valid_existing_user_token"},
    )

    assert response.status_code == 200
    assert response.json()["user"]["organization_id"] == "merchant-berrechid"


@patch("app.modules.auth.dependencies.get_settings")
def test_production_rejects_test_headers(mock_settings):
    mock_settings.return_value = Settings(app_env="production")

    response = client.get(
        "/api/v1/transactions",
        headers={
            "X-Test-User-Id": "attacker",
            "X-Test-Org-Id": "merchant-berrechid",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication token required"


@patch("app.modules.auth.dependencies.get_settings")
def test_production_rejects_synthetic_tokens(mock_settings):
    mock_settings.return_value = Settings(app_env="production")

    response = client.get(
        "/api/v1/transactions",
        headers={"Authorization": "Bearer test_token_attacker_merchant-berrechid"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired authentication token"
