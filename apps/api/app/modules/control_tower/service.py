from datetime import UTC, date, datetime
from functools import lru_cache

from app.modules.auth.schemas import UserContext
from app.modules.control_tower.schemas import (
    AuditEvidence,
    AuditFinding,
    AuditRunResponse,
    AuditRunToolCall,
    CalculationStep,
    CashForecastPoint,
    CompanyContext,
    ControlTowerDashboard,
    ControlTowerKPIs,
    FinancialRecord,
    FinancialRecordListResponse,
    FindingDecisionRequest,
    FindingDecisionResponse,
    PriorityAction,
    SupplierPortfolioResponse,
    SupplierScorecard,
)

COMPANY_NAME = "Atlas Distribution Maroc"
SUPPLIER_NAME = "Maghreb Oils & Foods"
INVOICE_AMOUNT_CENTIMES = 9_250_000
APPROVED_AMOUNT_CENTIMES = 8_640_000
LEAKAGE_CENTIMES = INVOICE_AMOUNT_CENTIMES - APPROVED_AMOUNT_CENTIMES


def _primary_finding(status: str = "READY_FOR_APPROVAL") -> AuditFinding:
    return AuditFinding(
        finding_id="finding-inv-8821",
        finding_type="THREE_WAY_MISMATCH",
        severity="CRITICAL",
        status=status,
        title="Invoice INV-8821 exceeds the approved payable amount",
        summary=(
            "The supplier billed 500 cartons at 185 MAD. The purchase order approved "
            "180 MAD per carton and the Casablanca warehouse received only 480 cartons."
        ),
        supplier_id="supplier-maghreb-oils",
        supplier_name=SUPPLIER_NAME,
        financial_impact_centimes=LEAKAGE_CENTIMES,
        confidence=0.98,
        expected_amount_centimes=APPROVED_AMOUNT_CENTIMES,
        observed_amount_centimes=INVOICE_AMOUNT_CENTIMES,
        recommended_action=(
            "Hold the disputed 6,100 MAD, approve 86,400 MAD, and send the evidence "
            "pack to the supplier for correction."
        ),
        owner="Nadia El Mansouri · Finance control",
        due_date=date(2026, 7, 28),
        evidence=[
            AuditEvidence(
                document_type="PURCHASE_ORDER",
                reference="PO-1042",
                label="500 cartons approved at 180 MAD",
                amount_centimes=9_000_000,
                quantity=500,
                unit_price_centimes=18_000,
                status="MATCHED",
            ),
            AuditEvidence(
                document_type="DELIVERY_NOTE",
                reference="BL-4478",
                label="480 cartons received at Casablanca warehouse",
                quantity=480,
                status="MISMATCH",
            ),
            AuditEvidence(
                document_type="SUPPLIER_INVOICE",
                reference="INV-8821",
                label="500 cartons invoiced at 185 MAD",
                amount_centimes=INVOICE_AMOUNT_CENTIMES,
                quantity=500,
                unit_price_centimes=18_500,
                status="MISMATCH",
            ),
            AuditEvidence(
                document_type="SUPPLIER_CONTRACT",
                reference="CTR-HUILE-2026",
                label="Contract ceiling: 180 MAD per carton",
                unit_price_centimes=18_000,
                status="SUPPORTING",
            ),
        ],
        calculation=[
            CalculationStep(
                label="Approved payable",
                expression="480 received × 180.00 MAD contracted price",
                result_centimes=APPROVED_AMOUNT_CENTIMES,
            ),
            CalculationStep(
                label="Supplier invoice",
                expression="500 invoiced × 185.00 MAD",
                result_centimes=INVOICE_AMOUNT_CENTIMES,
            ),
            CalculationStep(
                label="Potential leakage",
                expression="92,500.00 MAD − 86,400.00 MAD",
                result_centimes=LEAKAGE_CENTIMES,
            ),
        ],
    )


def _secondary_findings() -> list[AuditFinding]:
    return [
        AuditFinding(
            finding_id="finding-duplicate-774",
            finding_type="DUPLICATE_PAYMENT",
            severity="HIGH",
            status="OPEN",
            title="Possible duplicate payment for invoice INV-7740",
            summary=(
                "Two bank movements share the same supplier, amount and invoice reference "
                "within a four-hour window."
            ),
            supplier_id="supplier-souss-pack",
            supplier_name="Souss Packaging Industries",
            financial_impact_centimes=1_275_000,
            confidence=0.94,
            observed_amount_centimes=1_275_000,
            recommended_action="Verify the second bank movement before settlement closes.",
            owner="Youssef Amrani · Treasury",
            due_date=date(2026, 7, 27),
            evidence=[
                AuditEvidence(
                    document_type="BANK_PAYMENT",
                    reference="PAY-7740-A",
                    label="Payment at 09:14",
                    amount_centimes=1_275_000,
                    status="MISMATCH",
                ),
                AuditEvidence(
                    document_type="BANK_PAYMENT",
                    reference="PAY-7740-B",
                    label="Payment at 13:07",
                    amount_centimes=1_275_000,
                    status="MISMATCH",
                ),
            ],
        ),
        AuditFinding(
            finding_id="finding-concentration-01",
            finding_type="SUPPLIER_CONCENTRATION",
            severity="MEDIUM",
            status="OPEN",
            title="Edible-oil supply is concentrated with one partner",
            summary=(
                "Maghreb Oils & Foods represents 68% of category spend and has no approved "
                "backup supplier for the Casablanca warehouse."
            ),
            supplier_id="supplier-maghreb-oils",
            supplier_name=SUPPLIER_NAME,
            financial_impact_centimes=7_500_000,
            confidence=0.91,
            recommended_action=(
                "Qualify Nord Agro Distribution as a secondary source before the August peak."
            ),
            owner="Salma Berrada · Procurement",
            due_date=date(2026, 8, 5),
            evidence=[
                AuditEvidence(
                    document_type="SUPPLIER_CONTRACT",
                    reference="CTR-HUILE-2026",
                    label="68% category spend concentration",
                    status="SUPPORTING",
                )
            ],
        ),
    ]


class ControlTowerService:
    def __init__(self) -> None:
        self._approved_findings: set[str] = set()

    def findings(self) -> list[AuditFinding]:
        primary_status = (
            "APPROVED" if "finding-inv-8821" in self._approved_findings else "READY_FOR_APPROVAL"
        )
        return [_primary_finding(primary_status), *_secondary_findings()]

    def dashboard(self) -> ControlTowerDashboard:
        findings = self.findings()
        return ControlTowerDashboard(
            generated_at=datetime.now(UTC),
            company=CompanyContext(
                name=COMPANY_NAME,
                legal_name="Atlas Distribution Maroc SARL",
                sector="FMCG distribution · Food, hygiene and household",
                city="Casablanca",
                warehouse_count=3,
                active_supplier_count=42,
                reporting_period="July 2026 close",
            ),
            kpis=ControlTowerKPIs(
                monitored_spend_centimes=124_850_000,
                preventable_leakage_centimes=1_885_000,
                cash_at_risk_centimes=24_000_000,
                inventory_value_centimes=78_450_000,
                open_findings=sum(item.status not in {"RESOLVED", "APPROVED"} for item in findings),
                critical_findings=sum(
                    item.severity == "CRITICAL" and item.status != "APPROVED" for item in findings
                ),
            ),
            cash_forecast=[
                CashForecastPoint(
                    label="Today",
                    date=date(2026, 7, 26),
                    inflows_centimes=8_400_000,
                    outflows_centimes=6_900_000,
                    projected_balance_centimes=31_500_000,
                ),
                CashForecastPoint(
                    label="2 Aug",
                    date=date(2026, 8, 2),
                    inflows_centimes=11_800_000,
                    outflows_centimes=18_200_000,
                    projected_balance_centimes=25_100_000,
                ),
                CashForecastPoint(
                    label="9 Aug",
                    date=date(2026, 8, 9),
                    inflows_centimes=7_600_000,
                    outflows_centimes=15_400_000,
                    projected_balance_centimes=17_300_000,
                ),
                CashForecastPoint(
                    label="16 Aug",
                    date=date(2026, 8, 16),
                    inflows_centimes=6_900_000,
                    outflows_centimes=12_400_000,
                    projected_balance_centimes=11_800_000,
                ),
                CashForecastPoint(
                    label="23 Aug",
                    date=date(2026, 8, 23),
                    inflows_centimes=15_600_000,
                    outflows_centimes=9_100_000,
                    projected_balance_centimes=18_300_000,
                ),
            ],
            priority_actions=[
                PriorityAction(
                    action_id="action-dispute-inv-8821",
                    title="Hold and correct invoice INV-8821",
                    description="Prevent a 6,100 MAD overpayment before the 28 July settlement.",
                    impact_centimes=LEAKAGE_CENTIMES,
                    urgency="NOW",
                    target_path="/control-tower/audit/finding-inv-8821",
                ),
                PriorityAction(
                    action_id="action-cash-gap",
                    title="Protect the August cash buffer",
                    description=(
                        "Sequence three supplier payments within their contractual terms."
                    ),
                    impact_centimes=24_000_000,
                    urgency="THIS_WEEK",
                    target_path="/control-tower/cash-flow",
                ),
                PriorityAction(
                    action_id="action-supplier-risk",
                    title="Qualify an edible-oil backup supplier",
                    description="Reduce 68% category concentration before the seasonal peak.",
                    impact_centimes=7_500_000,
                    urgency="MONITOR",
                    target_path="/control-tower/suppliers",
                ),
            ],
            findings=findings,
        )

    def finding(self, finding_id: str) -> AuditFinding:
        finding = next((item for item in self.findings() if item.finding_id == finding_id), None)
        if finding is None:
            raise LookupError("Audit finding not found")
        return finding

    def supplier_portfolio(self) -> SupplierPortfolioResponse:
        return SupplierPortfolioResponse(
            total_spend_centimes=124_850_000,
            concentration_risk_percent=68,
            savings_opportunity_centimes=3_840_000,
            scorecards=[
                SupplierScorecard(
                    supplier_id="supplier-maghreb-oils",
                    name=SUPPLIER_NAME,
                    city="Casablanca",
                    category="Edible oils & grocery",
                    annual_spend_centimes=84_898_000,
                    spend_share_percent=68,
                    delivery_reliability_percent=91,
                    contract_compliance_percent=82,
                    disputed_invoice_rate_percent=6.8,
                    average_payment_terms_days=45,
                    risk="HIGH",
                    trend="DECLINING",
                    recommendation="Renegotiate price controls and qualify a backup supplier.",
                ),
                SupplierScorecard(
                    supplier_id="supplier-souss-pack",
                    name="Souss Packaging Industries",
                    city="Agadir",
                    category="Packaging",
                    annual_spend_centimes=21_224_500,
                    spend_share_percent=17,
                    delivery_reliability_percent=96,
                    contract_compliance_percent=94,
                    disputed_invoice_rate_percent=1.4,
                    average_payment_terms_days=60,
                    risk="MEDIUM",
                    trend="STABLE",
                    recommendation="Keep current terms; investigate the duplicate payment.",
                ),
                SupplierScorecard(
                    supplier_id="supplier-nord-agro",
                    name="Nord Agro Distribution",
                    city="Tangier",
                    category="Grocery & beverages",
                    annual_spend_centimes=11_236_500,
                    spend_share_percent=9,
                    delivery_reliability_percent=98,
                    contract_compliance_percent=97,
                    disputed_invoice_rate_percent=0.7,
                    average_payment_terms_days=45,
                    risk="LOW",
                    trend="IMPROVING",
                    recommendation="Evaluate as the secondary edible-oil source.",
                ),
                SupplierScorecard(
                    supplier_id="supplier-casa-clean",
                    name="Casa Clean Products",
                    city="Mohammedia",
                    category="Hygiene & household",
                    annual_spend_centimes=7_491_000,
                    spend_share_percent=6,
                    delivery_reliability_percent=93,
                    contract_compliance_percent=96,
                    disputed_invoice_rate_percent=1.1,
                    average_payment_terms_days=30,
                    risk="LOW",
                    trend="STABLE",
                    recommendation="Consolidate low-volume orders to reduce delivery cost.",
                ),
            ],
        )

    def records(self) -> FinancialRecordListResponse:
        return FinancialRecordListResponse(
            items=[
                FinancialRecord(
                    record_id="record-po-1042",
                    record_type="PURCHASE_ORDER",
                    reference="PO-1042",
                    counterparty=SUPPLIER_NAME,
                    issued_on=date(2026, 7, 18),
                    amount_centimes=9_000_000,
                    status="MATCHED",
                    linked_records=["BL-4478", "INV-8821"],
                ),
                FinancialRecord(
                    record_id="record-bl-4478",
                    record_type="DELIVERY_NOTE",
                    reference="BL-4478",
                    counterparty=SUPPLIER_NAME,
                    issued_on=date(2026, 7, 22),
                    amount_centimes=APPROVED_AMOUNT_CENTIMES,
                    status="EXCEPTION",
                    linked_records=["PO-1042", "INV-8821"],
                ),
                FinancialRecord(
                    record_id="record-inv-8821",
                    record_type="SUPPLIER_INVOICE",
                    reference="INV-8821",
                    counterparty=SUPPLIER_NAME,
                    issued_on=date(2026, 7, 23),
                    due_on=date(2026, 7, 28),
                    amount_centimes=INVOICE_AMOUNT_CENTIMES,
                    status="EXCEPTION",
                    linked_records=["PO-1042", "BL-4478"],
                ),
                FinancialRecord(
                    record_id="record-pay-7740-a",
                    record_type="BANK_PAYMENT",
                    reference="PAY-7740-A",
                    counterparty="Souss Packaging Industries",
                    issued_on=date(2026, 7, 25),
                    amount_centimes=1_275_000,
                    status="PAID",
                    linked_records=["INV-7740"],
                ),
                FinancialRecord(
                    record_id="record-pay-7740-b",
                    record_type="BANK_PAYMENT",
                    reference="PAY-7740-B",
                    counterparty="Souss Packaging Industries",
                    issued_on=date(2026, 7, 25),
                    amount_centimes=1_275_000,
                    status="EXCEPTION",
                    linked_records=["INV-7740"],
                ),
                FinancialRecord(
                    record_id="record-rec-marjane",
                    record_type="CUSTOMER_RECEIVABLE",
                    reference="AR-MARJ-0726",
                    counterparty="Marjane Market",
                    issued_on=date(2026, 7, 24),
                    due_on=date(2026, 8, 20),
                    amount_centimes=15_600_000,
                    status="EXPECTED",
                    linked_records=[],
                ),
            ]
        )

    def run_audit(self) -> AuditRunResponse:
        return AuditRunResponse(
            run_id="run-control-20260726",
            status="SUCCEEDED",
            provider="gemma",
            model="gemma-4-26b-a4b-it",
            documents_analyzed=186,
            findings_created=3,
            total_impact_centimes=1_885_000,
            tool_calls=[
                AuditRunToolCall(
                    sequence=1,
                    name="classify_financial_evidence",
                    label="Gemma classified and normalized 186 financial records",
                    duration_ms=4_820,
                    output=(
                        "Purchase orders, invoices, deliveries, contracts and bank "
                        "movements linked."
                    ),
                    deterministic=False,
                ),
                AuditRunToolCall(
                    sequence=2,
                    name="three_way_match",
                    label="Matched purchase orders, receipts and supplier invoices",
                    duration_ms=184,
                    output="INV-8821 differs from the approved payable by 6,100 MAD.",
                    deterministic=True,
                ),
                AuditRunToolCall(
                    sequence=3,
                    name="detect_duplicate_payments",
                    label="Checked bank movements for duplicate settlements",
                    duration_ms=97,
                    output="PAY-7740-B flagged as a 12,750 MAD probable duplicate.",
                    deterministic=True,
                ),
                AuditRunToolCall(
                    sequence=4,
                    name="forecast_working_capital",
                    label="Projected cash position over the next 30 days",
                    duration_ms=132,
                    output="Lowest projected cash balance is 118,000 MAD on 16 August.",
                    deterministic=True,
                ),
                AuditRunToolCall(
                    sequence=5,
                    name="rank_supplier_risk",
                    label="Evaluated supplier concentration and contract compliance",
                    duration_ms=106,
                    output=(
                        "Edible-oil category concentration is 68%; backup qualification "
                        "recommended."
                    ),
                    deterministic=True,
                ),
            ],
        )

    def decide(
        self,
        finding_id: str,
        request: FindingDecisionRequest,
        user: UserContext,
    ) -> FindingDecisionResponse:
        finding = self.finding(finding_id)
        now = datetime.now(UTC)
        if request.action == "DISMISS":
            return FindingDecisionResponse(
                finding_id=finding_id,
                status="RESOLVED",
                action=request.action,
                message="The finding was dismissed and retained in the audit history.",
                approved_by=user.display_name or user.email or user.user_id,
                approved_at=now,
            )

        self._approved_findings.add(finding_id)
        dispute_reference = (
            f"DSP-{now.strftime('%Y%m%d')}-8821" if request.action == "PREPARE_DISPUTE" else None
        )
        return FindingDecisionResponse(
            finding_id=finding_id,
            status="APPROVED",
            action=request.action,
            approved_amount_centimes=finding.expected_amount_centimes,
            dispute_reference=dispute_reference,
            message=(
                "Human approval recorded. The corrected payable and evidence pack are ready "
                "for the finance team; no payment was executed automatically."
            ),
            approved_by=user.display_name or user.email or user.user_id,
            approved_at=now,
        )


@lru_cache
def get_control_tower_service() -> ControlTowerService:
    return ControlTowerService()
