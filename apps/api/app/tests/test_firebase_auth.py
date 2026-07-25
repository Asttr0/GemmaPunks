import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
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

    response = client.get(
        "/api/v1/transactions",
        headers={"Authorization": "Bearer valid_firebase_token_string"},
    )

    assert response.status_code == 200
    mock_verify.assert_called_once_with("valid_firebase_token_string")
