import os

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

MERCHANT = {"Authorization": "Bearer test_token_demo-merchant_merchant-berrechid"}
SUPPLIER = {"Authorization": "Bearer test_token_demo-supplier_supplier-atlas"}
OTHER_SUPPLIER = {"Authorization": "Bearer test_token_other-supplier_supplier-chaouia"}


async def test_seeded_firestore_complete_backend_path_is_isolated_and_consistent():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        dashboard = await client.get("/api/v1/merchant/dashboard", headers=MERCHANT)
        assert dashboard.status_code == 200
        assert dashboard.json()["kpis"] == {
            "sales_centimes": 11200,
            "expenses_centimes": 0,
            "estimated_profit_centimes": 11200,
            "available_cash_centimes": 611200,
        }

        inventory = await client.get("/api/v1/inventory", headers=MERCHANT)
        assert inventory.status_code == 200
        oil = next(
            item for item in inventory.json()["items"] if item["product_id"] == "cooking-oil-1l"
        )
        assert oil["quantity_on_hand"] == 14

        generated = await client.post(
            "/api/v1/procurement-needs/generate",
            headers=MERCHANT,
            json={
                "product_id": "cooking-oil-1l",
                "unit": "BOTTLE",
                "target_stock": 34,
            },
        )
        assert generated.status_code == 200
        need = generated.json()
        assert need["quantity_needed"] == 20
        assert need["days_remaining"] == 4
        assert need["forecast_status"] == "FORECAST"

        comparison = await client.post(
            "/api/v1/offers/compare",
            headers=MERCHANT,
            json={"procurement_need_id": "need-oil-001", "quantity": 20},
        )
        assert comparison.status_code == 200
        offers = comparison.json()
        assert offers["available_now"][0]["unit_price_centimes"] == 2200
        assert offers["group_opportunity"]["unit_price_centimes"] == 1850
        assert (
            len(
                {
                    offer["supplier_organization_id"]
                    for offer in [
                        *offers["available_now"],
                        offers["group_opportunity"],
                    ]
                }
            )
            >= 2
        )

        proposal = await client.post(
            "/api/v1/group-orders/propose",
            headers=MERCHANT,
            json={
                "procurement_need_id": "need-oil-001",
                "product_id": "cooking-oil-1l",
                "quantity": 20,
                "supplier_organization_id": "supplier-atlas",
                "supplier_catalog_item_id": "catalog-oil-atlas",
            },
        )
        assert proposal.status_code == 200
        group = proposal.json()
        assert group["group_order"]["total_quantity"] == 55
        assert group["group_order"]["participant_count"] == 3
        assert "participant_organization_ids" not in group["group_order"]
        assert group["member"]["product_saving_centimes"] == 7000
        assert group["member"]["delivery_saving_centimes"] == 3000
        assert group["member"]["total_saving_centimes"] == 10000

        opportunity = await client.get(
            "/api/v1/supplier/opportunities",
            headers=SUPPLIER,
        )
        assert opportunity.status_code == 200
        group_id = group["group_order"]["group_order_id"]
        assert any(
            item["source_group_order_id"] == group_id for item in opportunity.json()["items"]
        )

        isolated = await client.get(
            "/api/v1/supplier/opportunities",
            headers=OTHER_SUPPLIER,
        )
        assert isolated.status_code == 200
        assert all(
            item["supplier_organization_id"] == "supplier-chaouia"
            for item in isolated.json()["items"]
        )

        approval = await client.post(
            f"/api/v1/group-orders/{group_id}/approve",
            headers={**MERCHANT, "Idempotency-Key": "approve-demo-merchant-001"},
        )
        assert approval.status_code == 200
        assert approval.json()["member"]["status"] == "APPROVED"
        assert approval.json()["group_order"]["status"] == "OPEN"

        upload = await client.post(
            "/api/v1/ingestions",
            headers=MERCHANT,
            files={"file": ("receipt.jpg", b"synthetic receipt", "image/jpeg")},
            data={"kind": "receipt"},
        )
        assert upload.status_code == 200
        ingestion = upload.json()
        confirmation_payload = {
            "draft_version": ingestion["draft"]["version"],
            "draft": ingestion["draft"],
            "clarification_answers": [{"field_path": "lines[1].quantity", "answer": "10"}],
        }
        confirmation = await client.post(
            f"/api/v1/ingestions/{ingestion['id']}/confirm",
            headers={**MERCHANT, "Idempotency-Key": "confirm-dashboard-demo-001"},
            json=confirmation_payload,
        )
        assert confirmation.status_code == 200
        repeated = await client.post(
            f"/api/v1/ingestions/{ingestion['id']}/confirm",
            headers={**MERCHANT, "Idempotency-Key": "confirm-dashboard-demo-001"},
            json=confirmation_payload,
        )
        assert repeated.json() == confirmation.json()

        updated_inventory = await client.get("/api/v1/inventory", headers=MERCHANT)
        updated_oil = next(
            item
            for item in updated_inventory.json()["items"]
            if item["product_id"] == "cooking-oil-1l"
        )
        assert updated_oil["quantity_on_hand"] == 34

        updated_dashboard = await client.get(
            "/api/v1/merchant/dashboard",
            headers=MERCHANT,
        )
        assert updated_dashboard.json()["kpis"]["expenses_centimes"] == 52500
        assert updated_dashboard.json()["kpis"]["available_cash_centimes"] == 558700

        firestore = get_firestore_client()
        organization_ref = firestore.collection("organizations").document("merchant-berrechid")
        matching_transactions = [
            snapshot
            for snapshot in organization_ref.collection("transactions").stream()
            if snapshot.to_dict().get("source_draft_id") == ingestion["draft"]["id"]
        ]
        assert len(matching_transactions) == 1
