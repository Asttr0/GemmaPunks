from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

merchant = {"Authorization": "Bearer test_token_demo-merchant_merchant-berrechid"}
supplier = {"Authorization": "Bearer test_token_demo-supplier_supplier-atlas"}


def test_control_tower_dashboard_exposes_moroccan_distribution_scenario():
    response = client.get("/api/v1/control-tower/dashboard", headers=merchant)

    assert response.status_code == 200
    payload = response.json()
    assert payload["company"]["legal_name"] == "Atlas Distribution Maroc SARL"
    assert payload["company"]["city"] == "Casablanca"
    assert payload["kpis"]["preventable_leakage_centimes"] == 1_885_000
    assert payload["kpis"]["critical_findings"] == 1
    assert payload["findings"][0]["finding_id"] == "finding-inv-8821"


def test_three_way_match_is_deterministic_and_explainable():
    response = client.get(
        "/api/v1/control-tower/audit-findings/finding-inv-8821",
        headers=merchant,
    )

    assert response.status_code == 200
    finding = response.json()
    assert finding["observed_amount_centimes"] == 9_250_000
    assert finding["expected_amount_centimes"] == 8_640_000
    assert finding["financial_impact_centimes"] == 610_000
    assert [item["reference"] for item in finding["evidence"][:3]] == [
        "PO-1042",
        "BL-4478",
        "INV-8821",
    ]


def test_control_audit_shows_ai_and_deterministic_tool_boundaries():
    response = client.post("/api/v1/control-tower/audit-runs", headers=merchant)

    assert response.status_code == 200
    run = response.json()
    assert run["provider"] == "gemma"
    assert run["documents_analyzed"] == 186
    assert run["tool_calls"][0]["deterministic"] is False
    assert all(call["deterministic"] for call in run["tool_calls"][1:])


def test_human_decision_prepares_dispute_without_executing_payment():
    response = client.post(
        "/api/v1/control-tower/audit-findings/finding-inv-8821/decide",
        json={
            "action": "PREPARE_DISPUTE",
            "note": "Finance reviewed PO-1042 and BL-4478.",
        },
        headers=merchant,
    )

    assert response.status_code == 200
    decision = response.json()
    assert decision["status"] == "APPROVED"
    assert decision["approved_amount_centimes"] == 8_640_000
    assert decision["dispute_reference"].startswith("DSP-")
    assert "no payment was executed automatically" in decision["message"]


def test_supplier_cannot_read_distribution_company_private_controls():
    response = client.get("/api/v1/control-tower/dashboard", headers=supplier)

    assert response.status_code == 403
