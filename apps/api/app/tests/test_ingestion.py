from fastapi.testclient import TestClient

from app.core.store import db_store
from app.main import app

client = TestClient(app)
auth_org_one = {"Authorization": "Bearer test_token_usr01_org01"}
auth_org_two = {"Authorization": "Bearer test_token_usr02_org02"}


def upload_receipt(headers: dict[str, str] | None = None) -> dict:
    response = client.post(
        "/api/v1/ingestions",
        files={"file": ("receipt.jpg", b"fake receipt image content", "image/jpeg")},
        data={"kind": "receipt"},
        headers=headers or auth_org_one,
    )
    assert response.status_code == 200
    return response.json()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_evidence_success():
    res_data = upload_receipt()
    assert res_data["status"] == "NEEDS_REVIEW"
    assert res_data["document"]["kind"] == "receipt"
    assert res_data["draft"]["currency"] == "MAD"
    assert len(res_data["draft"]["lines"]) > 0
    assert res_data["draft"]["lines"][0]["line_total_centimes"] == 44000
    assert res_data["draft"]["total_centimes"] == 52500

    ingestion_id = res_data["id"]
    document_id = res_data["document"]["id"]
    draft_id = res_data["draft"]["id"]
    assert db_store.documents[document_id].evidence_retained is False
    assert db_store.documents[document_id].storage_provider == "NONE"
    assert db_store.ingestion_jobs[ingestion_id].draft_id == draft_id
    assert draft_id in db_store.extraction_drafts
    document_fields = db_store.documents[document_id].model_dump()
    assert not {
        "file_bytes",
        "base64",
        "raw_audio",
        "raw_image",
        "storage_path",
    }.intersection(document_fields)


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
    upload_res = upload_receipt()
    ingestion_id = upload_res["id"]

    read_res = client.get(
        f"/api/v1/ingestions/{ingestion_id}",
        headers=auth_org_two,
    )
    assert read_res.status_code == 404

    own_read = client.get(
        f"/api/v1/ingestions/{ingestion_id}",
        headers=auth_org_one,
    )
    assert own_read.status_code == 200
    assert own_read.json() == upload_res


def test_upload_rejects_empty_or_mismatched_evidence():
    empty = client.post(
        "/api/v1/ingestions",
        files={"file": ("receipt.jpg", b"", "image/jpeg")},
        data={"kind": "receipt"},
        headers=auth_org_one,
    )
    assert empty.status_code == 422

    mismatched = client.post(
        "/api/v1/ingestions",
        files={"file": ("voice.mp3", b"audio", "audio/mpeg")},
        data={"kind": "receipt"},
        headers=auth_org_one,
    )
    assert mismatched.status_code == 415

    unsafe_svg = client.post(
        "/api/v1/ingestions",
        files={"file": ("receipt.svg", b"<svg></svg>", "image/svg+xml")},
        data={"kind": "receipt"},
        headers=auth_org_one,
    )
    assert unsafe_svg.status_code == 415


def test_confirm_draft_and_idempotency():
    upload_res = upload_receipt()
    ingestion_id = upload_res["id"]
    draft = upload_res["draft"]

    confirm_payload = {
        "draft_version": draft["version"],
        "clarification_answers": [{"field_path": "lines[1].quantity", "answer": "10"}],
        "draft": draft,
    }

    idempotency_key = f"confirm-{ingestion_id}"
    transactions_before = len(db_store.transactions.get("org01", {}))
    movements_before = len(db_store.inventory_movements.get("org01", []))
    approvals_before = len(db_store.approvals.get("org01", []))
    stock_before = db_store.inventory_items.get("org01", {}).get("cooking_oil_1l")
    oil_quantity_before = stock_before.quantity_on_hand if stock_before else 0

    confirm_res = client.post(
        f"/api/v1/ingestions/{ingestion_id}/confirm",
        json=confirm_payload,
        headers={
            **auth_org_one,
            "Idempotency-Key": idempotency_key,
        },
    )

    assert confirm_res.status_code == 200
    confirm_data = confirm_res.json()
    assert confirm_data["status"] == "CONFIRMED"
    assert confirm_data["total_centimes"] == 52500
    assert confirm_data["transaction_id"].startswith("txn-")

    repeat_res = client.post(
        f"/api/v1/ingestions/{ingestion_id}/confirm",
        json=confirm_payload,
        headers={
            **auth_org_one,
            "Idempotency-Key": idempotency_key,
        },
    )
    assert repeat_res.status_code == 200
    assert repeat_res.json() == confirm_data
    assert len(db_store.transactions["org01"]) == transactions_before + 1
    assert len(db_store.inventory_movements["org01"]) == movements_before + 2
    assert len(db_store.approvals["org01"]) == approvals_before + 1
    assert (
        db_store.inventory_items["org01"]["cooking_oil_1l"].quantity_on_hand
        == oil_quantity_before + 20
    )


def test_confirmation_requires_idempotency_key():
    upload_res = upload_receipt()
    response = client.post(
        f"/api/v1/ingestions/{upload_res['id']}/confirm",
        json={
            "draft_version": upload_res["draft"]["version"],
            "draft": upload_res["draft"],
        },
        headers=auth_org_one,
    )
    assert response.status_code == 422


def test_idempotency_key_rejects_different_payload():
    upload_res = upload_receipt()
    draft = upload_res["draft"]
    idempotency_key = f"confirm-{upload_res['id']}"
    original_payload = {
        "draft_version": draft["version"],
        "draft": draft,
    }
    first = client.post(
        f"/api/v1/ingestions/{upload_res['id']}/confirm",
        json=original_payload,
        headers={**auth_org_one, "Idempotency-Key": idempotency_key},
    )
    assert first.status_code == 200

    changed_draft = {**draft, "lines": [dict(line) for line in draft["lines"]]}
    changed_draft["lines"][0]["quantity"] = 21
    changed = client.post(
        f"/api/v1/ingestions/{upload_res['id']}/confirm",
        json={
            "draft_version": draft["version"],
            "draft": changed_draft,
        },
        headers={**auth_org_one, "Idempotency-Key": idempotency_key},
    )
    assert changed.status_code == 409
    assert "different confirmation data" in changed.json()["detail"]


def test_cross_organization_confirmation_is_hidden():
    upload_res = upload_receipt()
    response = client.post(
        f"/api/v1/ingestions/{upload_res['id']}/confirm",
        json={
            "draft_version": upload_res["draft"]["version"],
            "draft": upload_res["draft"],
        },
        headers={**auth_org_two, "Idempotency-Key": "confirm-cross-org-001"},
    )
    assert response.status_code == 404


def test_failed_confirmation_does_not_partially_write():
    upload_res = upload_receipt()
    draft = upload_res["draft"]
    draft["transaction_kind"] = "sale"
    draft["lines"][0]["quantity"] = 1_000_000
    transaction_count = len(db_store.transactions.get("org01", {}))
    movement_count = len(db_store.inventory_movements.get("org01", []))
    approval_count = len(db_store.approvals.get("org01", []))

    response = client.post(
        f"/api/v1/ingestions/{upload_res['id']}/confirm",
        json={"draft_version": draft["version"], "draft": draft},
        headers={
            **auth_org_one,
            "Idempotency-Key": f"confirm-insufficient-{upload_res['id']}",
        },
    )

    assert response.status_code == 409
    assert "Insufficient stock" in response.json()["detail"]
    assert len(db_store.transactions.get("org01", {})) == transaction_count
    assert len(db_store.inventory_movements.get("org01", [])) == movement_count
    assert len(db_store.approvals.get("org01", [])) == approval_count
    current = client.get(
        f"/api/v1/ingestions/{upload_res['id']}",
        headers=auth_org_one,
    )
    assert current.json()["status"] == "NEEDS_REVIEW"


def test_confirm_draft_version_mismatch_409():
    upload_res = upload_receipt()

    confirm_res = client.post(
        f"/api/v1/ingestions/{upload_res['id']}/confirm",
        json={"draft_version": 999, "draft": upload_res["draft"]},
        headers={
            **auth_org_one,
            "Idempotency-Key": f"confirm-version-{upload_res['id']}",
        },
    )
    assert confirm_res.status_code == 409
