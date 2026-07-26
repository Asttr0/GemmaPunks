import os
import uuid

import httpx
import pytest

from app.core.firebase import get_firestore_client
from app.main import app

pytestmark = [
    pytest.mark.asyncio,
    pytest.mark.skipif(
        not os.getenv("FIRESTORE_EMULATOR_HOST"),
        reason="Firestore emulator is required",
    ),
]


async def test_firestore_ingestion_confirmation_is_atomic_and_idempotent():
    transport = httpx.ASGITransport(app=app)
    client = httpx.AsyncClient(transport=transport, base_url="http://test")
    firestore = get_firestore_client()
    organization_id = f"merchant-ingestion-{uuid.uuid4().hex[:8]}"
    auth = {
        "Authorization": f"Bearer test_token_ingestion-user_{organization_id}",
    }
    firestore.collection("organizations").document(organization_id).set(
        {
            "name": "Atomic Ingestion Test Merchant",
            "type": "MERCHANT",
            "status": "ACTIVE",
            "city": "Berrechid",
            "coarse_area": "Berrechid Centre",
            "currency": "MAD",
            "opening_cash_centimes": 0,
        }
    )

    upload = await client.post(
        "/api/v1/ingestions",
        files={"file": ("receipt.jpg", b"synthetic receipt", "image/jpeg")},
        data={"kind": "receipt"},
        headers=auth,
    )
    assert upload.status_code == 200
    ingestion = upload.json()
    organization_ref = firestore.collection("organizations").document(organization_id)

    document_snapshot = (
        organization_ref.collection("documents").document(ingestion["document"]["id"]).get()
    )
    job_snapshot = organization_ref.collection("ingestion_jobs").document(ingestion["id"]).get()
    draft_snapshot = (
        organization_ref.collection("extraction_drafts").document(ingestion["draft"]["id"]).get()
    )
    assert document_snapshot.exists
    assert job_snapshot.to_dict()["status"] == "NEEDS_REVIEW"
    assert draft_snapshot.to_dict()["status"] == "NEEDS_REVIEW"
    assert document_snapshot.to_dict()["evidence_retained"] is False
    assert "file_bytes" not in document_snapshot.to_dict()

    cross_organization = await client.get(
        f"/api/v1/ingestions/{ingestion['id']}",
        headers={"Authorization": ("Bearer test_token_other-user_merchant-other-organization")},
    )
    assert cross_organization.status_code == 404

    payload = {
        "draft_version": ingestion["draft"]["version"],
        "clarification_answers": [{"field_path": "lines[1].quantity", "answer": "10"}],
        "draft": ingestion["draft"],
    }
    idempotency_key = f"confirm-{ingestion['id']}"
    confirmation = await client.post(
        f"/api/v1/ingestions/{ingestion['id']}/confirm",
        json=payload,
        headers={**auth, "Idempotency-Key": idempotency_key},
    )
    assert confirmation.status_code == 200
    result = confirmation.json()

    transaction_snapshot = (
        organization_ref.collection("transactions").document(result["transaction_id"]).get()
    )
    assert transaction_snapshot.exists
    assert transaction_snapshot.to_dict()["status"] == "CONFIRMED"
    assert (
        organization_ref.collection("ingestion_jobs")
        .document(ingestion["id"])
        .get()
        .to_dict()["status"]
        == "CONFIRMED"
    )
    assert (
        organization_ref.collection("extraction_drafts")
        .document(ingestion["draft"]["id"])
        .get()
        .to_dict()["status"]
        == "CONFIRMED"
    )
    assert len(list(organization_ref.collection("inventory_movements").stream())) == 2
    assert len(list(organization_ref.collection("approvals").stream())) == 1

    repeated = await client.post(
        f"/api/v1/ingestions/{ingestion['id']}/confirm",
        json=payload,
        headers={**auth, "Idempotency-Key": idempotency_key},
    )
    assert repeated.status_code == 200
    assert repeated.json() == result
    assert len(list(organization_ref.collection("transactions").stream())) == 1
    assert len(list(organization_ref.collection("inventory_movements").stream())) == 2
    assert len(list(organization_ref.collection("approvals").stream())) == 1

    changed_payload = {
        **payload,
        "draft": {
            **payload["draft"],
            "lines": [dict(line) for line in payload["draft"]["lines"]],
        },
    }
    changed_payload["draft"]["lines"][0]["quantity"] = 21
    conflict = await client.post(
        f"/api/v1/ingestions/{ingestion['id']}/confirm",
        json=changed_payload,
        headers={**auth, "Idempotency-Key": idempotency_key},
    )
    assert conflict.status_code == 409
    assert len(list(organization_ref.collection("transactions").stream())) == 1
    await client.aclose()
