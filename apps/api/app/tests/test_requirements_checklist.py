import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

auth_merchant = {"Authorization": "Bearer test_token_merchant_merchant-berrechid"}
auth_other_merchant = {"Authorization": "Bearer test_token_other_merchant-casablanca"}
auth_supplier = {"Authorization": "Bearer test_token_supplier_supplier-atlas"}


def test_file_payload_too_large_413():
    # 11MB file payload (exceeding 10MB limit)
    large_bytes = b"0" * (11 * 1024 * 1024)
    files = {"file": ("large_receipt.jpg", large_bytes, "image/jpeg")}

    res = client.post(
        "/api/v1/ingestions",
        files=files,
        data={"kind": "receipt"},
        headers=auth_merchant,
    )
    assert res.status_code == 413


def test_already_confirmed_draft_conflict_409():
    # Upload and confirm draft
    files = {"file": ("receipt.jpg", b"fake receipt content", "image/jpeg")}
    upload_res = client.post(
        "/api/v1/ingestions",
        files=files,
        data={"kind": "receipt"},
        headers=auth_merchant,
    ).json()

    ingestion_id = upload_res["id"]
    draft = upload_res["draft"]

    # First confirmation
    confirm_1 = client.post(
        f"/api/v1/ingestions/{ingestion_id}/confirm",
        json={"draft_version": draft["version"], "draft": draft},
        headers=auth_merchant,
    )
    assert confirm_1.status_code == 200

    # Second confirmation without idempotency key -> 409 Conflict
    confirm_2 = client.post(
        f"/api/v1/ingestions/{ingestion_id}/confirm",
        json={"draft_version": draft["version"], "draft": draft},
        headers=auth_merchant,
    )
    assert confirm_2.status_code == 409


def test_group_order_join_and_approve_flow():
    # 1. Propose group order
    prop_res = client.post(
        "/api/v1/group-orders/propose",
        json={
            "procurement_need_id": "need-oil-001",
            "product_id": "cooking-oil-1l",
            "quantity": 20.0,
            "supplier_organization_id": "supplier-atlas",
            "supplier_catalog_item_id": "cat-oil-bulk",
        },
        headers=auth_merchant,
    )
    assert prop_res.status_code == 200
    go_id = prop_res.json()["group_order"]["group_order_id"]

    # 2. Other merchant joins group order
    join_res = client.post(
        f"/api/v1/group-orders/{go_id}/join",
        headers=auth_other_merchant,
    )
    assert join_res.status_code == 200
    assert join_res.json()["member"]["status"] == "JOINED"

    # 3. Original merchant approves group order
    approve_res = client.post(
        f"/api/v1/group-orders/{go_id}/approve",
        headers=auth_merchant,
    )
    assert approve_res.status_code == 200
    app_data = approve_res.json()
    assert app_data["group_order"]["status"] == "APPROVED"
    assert app_data["member"]["status"] == "APPROVED"
    assert app_data["member"]["approved_by"] == "merchant"


def test_supplier_catalog_creation_and_listing():
    # 1. Create catalog item
    create_res = client.post(
        "/api/v1/supplier/catalogs",
        json={
            "product_id": "sugar-1kg",
            "supplier_sku": "ATL-SUGAR-1KG",
            "unit": "BAG",
            "unit_price_centimes": 850,
            "minimum_quantity": 10.0,
            "available_quantity": 500.0,
            "delivery_fee_centimes": 1000,
            "delivery_days": 1,
            "service_areas": ["Berrechid Center"],
        },
        headers=auth_supplier,
    )
    assert create_res.status_code == 200
    cat_item = create_res.json()
    assert cat_item["supplier_sku"] == "ATL-SUGAR-1KG"

    # 2. List catalogs for supplier
    list_res = client.get("/api/v1/supplier/catalogs", headers=auth_supplier)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert any(i["supplier_sku"] == "ATL-SUGAR-1KG" for i in items)


def test_centimes_financial_recalculation_on_confirm():
    files = {"file": ("receipt.jpg", b"fake receipt content", "image/jpeg")}
    upload_res = client.post(
        "/api/v1/ingestions",
        files=files,
        data={"kind": "receipt"},
        headers=auth_merchant,
    ).json()

    ingestion_id = upload_res["id"]
    draft = upload_res["draft"]

    # Modify line quantities and prices in centimes
    draft["lines"][0]["quantity"] = 30  # 30 units
    draft["lines"][0]["unit_price_centimes"] = 2000  # 20.00 MAD

    confirm_res = client.post(
        f"/api/v1/ingestions/{ingestion_id}/confirm",
        json={"draft_version": draft["version"], "draft": draft},
        headers=auth_merchant,
    )
    assert confirm_res.status_code == 200
    data = confirm_res.json()
    # 30 * 2000 + 10 * 850 = 60000 + 8500 = 68500 centimes (685 MAD)
    assert data["total_centimes"] == 68500
