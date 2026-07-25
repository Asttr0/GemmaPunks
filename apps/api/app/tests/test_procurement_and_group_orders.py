import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
auth_merchant = {"Authorization": "Bearer test_token_merchant_merchant-berrechid"}
auth_supplier = {"Authorization": "Bearer test_token_supplier_supplier-atlas"}


def test_procurement_need_generation_and_listing():
    # Generate need
    res = client.post(
        "/api/v1/procurement-needs/generate",
        json={"product_id": "cooking-oil-1l", "unit": "BOTTLE", "target_stock": 34.0},
        headers=auth_merchant,
    )
    assert res.status_code == 200
    need = res.json()
    assert need["product_id"] == "cooking-oil-1l"
    assert need["quantity_needed"] == 20.0
    assert need["days_remaining"] == 4

    # List needs
    list_res = client.get("/api/v1/procurement-needs", headers=auth_merchant)
    assert list_res.status_code == 200
    needs = list_res.json()
    assert len(needs) >= 1


def test_supplier_search_and_offer_comparison():
    # Search suppliers
    search_res = client.get("/api/v1/suppliers/search?product_id=cooking-oil-1l", headers=auth_merchant)
    assert search_res.status_code == 200
    items = search_res.json()["items"]
    assert len(items) >= 2

    # Compare offers for 20 units
    compare_res = client.post(
        "/api/v1/offers/compare",
        json={"procurement_need_id": "need-oil-001", "quantity": 20.0},
        headers=auth_merchant,
    )
    assert compare_res.status_code == 200
    data = compare_res.json()
    assert len(data["available_now"]) >= 1
    assert data["available_now"][0]["unit_price_centimes"] == 2200
    assert data["group_opportunity"] is not None
    assert data["group_opportunity"]["unit_price_centimes"] == 1850


def test_group_order_proposal_and_savings_calculation():
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
    go_data = prop_res.json()
    assert go_data["group_order"]["total_quantity"] == 55.0  # 20 + 35
    assert go_data["original_unit_price_centimes"] == 2200
    assert go_data["collective_unit_price_centimes"] == 1850
    assert go_data["total_savings_centimes"] == 10000  # 100 MAD


def test_supplier_dashboard_and_opportunity_submission():
    # Supplier Dashboard
    dash_res = client.get("/api/v1/supplier/dashboard", headers=auth_supplier)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["kpis"]["active_catalog_items"] >= 1

    # Opportunities
    opp_res = client.get("/api/v1/supplier/opportunities", headers=auth_supplier)
    assert opp_res.status_code == 200
    opps = opp_res.json()["items"]
    assert len(opps) >= 1

    # Create supplier offer
    offer_res = client.post(
        "/api/v1/supplier/offers",
        json={
            "opportunity_id": opps[0]["opportunity_id"],
            "catalog_item_id": "cat-oil-bulk",
            "unit_price_centimes": 1850,
            "minimum_quantity": 50.0,
        },
        headers=auth_supplier,
    )
    assert offer_res.status_code == 200
    offer = offer_res.json()
    assert offer["status"] == "AVAILABLE_NOW"


def test_agent_run_audit_timeline():
    run_res = client.get("/api/v1/agent-runs/run-001", headers=auth_merchant)
    assert run_res.status_code == 200
    run = run_res.json()
    assert run["agent_run_id"] == "run-001"
    assert run["provider"] == "fixture"
    assert len(run["tool_calls"]) >= 2
