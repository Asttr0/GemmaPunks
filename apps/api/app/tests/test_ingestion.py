import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.store import db_store

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_evidence_success():
    files = {"file": ("receipt.jpg", b"fake receipt image content", "image/jpeg")}
    data = {"kind": "receipt"}

    response = client.post(
        "/api/v1/ingestions",
        files=files,
        data=data,
        headers={"Authorization": "Bearer test_token_usr01_org01"},
    )

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "NEEDS_REVIEW"
    assert res_data["document"]["kind"] == "receipt"
    assert res_data["draft"]["currency"] == "MAD"
    assert len(res_data["draft"]["lines"]) > 0
    assert res_data["draft"]["lines"][0]["line_total_centimes"] == 44000


def test_upload_unsupported_kind():
    files = {"file": ("document.txt", b"txt content", "text/plain")}
    data = {"kind": "unsupported_kind"}

    response = client.post(
        "/api/v1/ingestions",
        files=files,
        data=data,
        headers={"Authorization": "Bearer test_token_usr01_org01"},
    )

    assert response.status_code == 415


def test_read_ingestion_wrong_organization_404():
    # Upload for org01
    files = {"file": ("receipt.jpg", b"fake receipt", "image/jpeg")}
    upload_res = client.post(
        "/api/v1/ingestions",
        files=files,
        data={"kind": "receipt"},
        headers={"Authorization": "Bearer test_token_usr01_org01"},
    ).json()
    ingestion_id = upload_res["id"]

    # Try reading as org02
    read_res = client.get(
        f"/api/v1/ingestions/{ingestion_id}",
        headers={"Authorization": "Bearer test_token_usr02_org02"},
    )
    assert read_res.status_code == 404


def test_confirm_draft_and_idempotency():
    # 1. Upload evidence
    files = {"file": ("receipt.png", b"fake image", "image/png")}
    upload_res = client.post(
        "/api/v1/ingestions",
        files=files,
        data={"kind": "receipt"},
        headers={"Authorization": "Bearer test_token_usr01_org01"},
    ).json()
    ingestion_id = upload_res["id"]
    draft = upload_res["draft"]

    # 2. Confirm draft
    confirm_payload = {
        "draft_version": draft["version"],
        "clarification_answers": [
            {"field_path": "lines[1].quantity", "answer": "10"}
        ],
        "draft": draft,
    }

    idempotency_key = "idemp_test_key_123"
    confirm_res = client.post(
        f"/api/v1/ingestions/{ingestion_id}/confirm",
        json=confirm_payload,
        headers={
            "Authorization": "Bearer test_token_usr01_org01",
            "Idempotency-Key": idempotency_key,
        },
    )

    assert confirm_res.status_code == 200
    confirm_data = confirm_res.json()
    assert confirm_data["status"] == "CONFIRMED"
    assert confirm_data["total_centimes"] == 52500
    assert confirm_data["transaction_id"].startswith("txn_")

    # 3. Repeat confirmation with same idempotency key
    repeat_res = client.post(
        f"/api/v1/ingestions/{ingestion_id}/confirm",
        json=confirm_payload,
        headers={
            "Authorization": "Bearer test_token_usr01_org01",
            "Idempotency-Key": idempotency_key,
        },
    )
    assert repeat_res.status_code == 200
    assert repeat_res.json() == confirm_data


def test_confirm_draft_version_mismatch_409():
    files = {"file": ("receipt.jpg", b"fake image", "image/jpeg")}
    upload_res = client.post(
        "/api/v1/ingestions",
        files=files,
        data={"kind": "receipt"},
        headers={"Authorization": "Bearer test_token_usr01_org01"},
    ).json()

    # Wrong draft version 999
    confirm_res = client.post(
        f"/api/v1/ingestions/{upload_res['id']}/confirm",
        json={"draft_version": 999, "draft": upload_res["draft"]},
        headers={"Authorization": "Bearer test_token_usr01_org01"},
    )
    assert confirm_res.status_code == 409
