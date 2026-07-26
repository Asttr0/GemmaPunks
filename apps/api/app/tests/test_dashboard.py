from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_transactions_and_inventory():
    auth_header = {"Authorization": "Bearer test_token_usr01_org_berrechid_grocery"}

    # 1. Fetch transactions
    txn_res = client.get("/api/v1/transactions", headers=auth_header)
    assert txn_res.status_code == 200
    txns = txn_res.json()["items"]
    assert isinstance(txns, list)

    # 2. Fetch inventory
    inv_res = client.get("/api/v1/inventory", headers=auth_header)
    assert inv_res.status_code == 200
    inv_items = inv_res.json()["items"]
    assert isinstance(inv_items, list)
    assert len(inv_items) >= 2


def test_merchant_dashboard():
    auth_header = {"Authorization": "Bearer test_token_usr01_org_berrechid_grocery"}

    res = client.get("/api/v1/merchant/dashboard", headers=auth_header)
    assert res.status_code == 200
    data = res.json()

    assert "kpis" in data
    assert data["kpis"]["sales_centimes"] >= 0
    assert data["kpis"]["expenses_centimes"] >= 0
    assert "inventory" in data
    assert data["inventory"]["product_count"] >= 1
    assert "alerts" in data
    assert "next_action" in data
    assert data["next_action"]["code"] == "review_procurement_need"
