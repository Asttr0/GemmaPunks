export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type FindingStatus =
  "OPEN" | "READY_FOR_APPROVAL" | "APPROVED" | "RESOLVED";

export interface AuditEvidence {
  document_type:
    | "PURCHASE_ORDER"
    | "DELIVERY_NOTE"
    | "SUPPLIER_INVOICE"
    | "BANK_PAYMENT"
    | "SUPPLIER_CONTRACT";
  reference: string;
  label: string;
  amount_centimes?: number | null;
  quantity?: number | null;
  unit_price_centimes?: number | null;
  status: "MATCHED" | "MISMATCH" | "SUPPORTING";
}

export interface CalculationStep {
  label: string;
  expression: string;
  result_centimes: number;
}

export interface AuditFinding {
  finding_id: string;
  finding_type:
    | "THREE_WAY_MISMATCH"
    | "DUPLICATE_PAYMENT"
    | "PRICE_DRIFT"
    | "MISSING_CREDIT_NOTE"
    | "SUPPLIER_CONCENTRATION";
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  summary: string;
  supplier_id: string;
  supplier_name: string;
  financial_impact_centimes: number;
  confidence: number;
  expected_amount_centimes?: number | null;
  observed_amount_centimes?: number | null;
  recommended_action: string;
  owner: string;
  due_date: string;
  evidence: AuditEvidence[];
  calculation: CalculationStep[];
}

export interface ControlTowerDashboard {
  generated_at: string;
  company: {
    name: string;
    legal_name: string;
    sector: string;
    city: string;
    warehouse_count: number;
    active_supplier_count: number;
    reporting_period: string;
  };
  kpis: {
    monitored_spend_centimes: number;
    preventable_leakage_centimes: number;
    cash_at_risk_centimes: number;
    inventory_value_centimes: number;
    open_findings: number;
    critical_findings: number;
  };
  cash_forecast: Array<{
    label: string;
    date: string;
    inflows_centimes: number;
    outflows_centimes: number;
    projected_balance_centimes: number;
  }>;
  priority_actions: Array<{
    action_id: string;
    title: string;
    description: string;
    impact_centimes: number;
    urgency: "NOW" | "THIS_WEEK" | "MONITOR";
    target_path: string;
  }>;
  findings: AuditFinding[];
}

export interface SupplierPortfolio {
  total_spend_centimes: number;
  concentration_risk_percent: number;
  savings_opportunity_centimes: number;
  scorecards: Array<{
    supplier_id: string;
    name: string;
    city: string;
    category: string;
    annual_spend_centimes: number;
    spend_share_percent: number;
    delivery_reliability_percent: number;
    contract_compliance_percent: number;
    disputed_invoice_rate_percent: number;
    average_payment_terms_days: number;
    risk: "LOW" | "MEDIUM" | "HIGH";
    trend: "IMPROVING" | "STABLE" | "DECLINING";
    recommendation: string;
  }>;
}

export interface FinancialRecordList {
  items: Array<{
    record_id: string;
    record_type:
      | "PURCHASE_ORDER"
      | "DELIVERY_NOTE"
      | "SUPPLIER_INVOICE"
      | "BANK_PAYMENT"
      | "CUSTOMER_RECEIVABLE";
    reference: string;
    counterparty: string;
    issued_on: string;
    due_on?: string | null;
    amount_centimes: number;
    status: "MATCHED" | "EXCEPTION" | "PENDING" | "PAID" | "EXPECTED";
    linked_records: string[];
  }>;
}

export interface AuditRunResponse {
  run_id: string;
  status: "SUCCEEDED";
  provider: string;
  model: string;
  documents_analyzed: number;
  findings_created: number;
  total_impact_centimes: number;
  tool_calls: Array<{
    sequence: number;
    name: string;
    label: string;
    status: "SUCCEEDED";
    duration_ms: number;
    output: string;
    deterministic: boolean;
  }>;
}

export interface FindingDecisionResponse {
  finding_id: string;
  status: "APPROVED" | "RESOLVED";
  action: string;
  approved_amount_centimes?: number | null;
  dispute_reference?: string | null;
  message: string;
  approved_by: string;
  approved_at: string;
}
