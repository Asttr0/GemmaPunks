import type {
  AgentRunRecord,
  DashboardResponse,
  GroupOrderResponse,
  IngestionResponse,
  InventoryResponse,
  Offer,
  OfferCompareResponse,
  ProcurementNeed,
  ProductOptionListResponse,
  SupplierCatalogResponse,
  SupplierDashboardResponse,
  SupplierOpportunity,
  TransactionListResponse,
} from "./api";

export const demoMerchantDashboard: DashboardResponse = {
  generated_at: "2026-07-26T09:00:00Z",
  kpis: {
    sales_centimes: 1_250_000,
    expenses_centimes: 830_000,
    estimated_profit_centimes: 420_000,
    available_cash_centimes: 610_000,
  },
  inventory: {
    product_count: 18,
    low_stock_count: 1,
  },
  alerts: [
    {
      code: "stockout_soon",
      message:
        "Cooking oil 1L may run out in 4 days. Current stock: 14 bottles.",
    },
  ],
  next_action: {
    code: "review_procurement_need",
    label: "Review a safe reorder of 20 bottles",
    target_id: "need-oil-001",
  },
};

export const demoSalesTrend = [
  { day: "20 Jul", sales: 8_900, profit: 2_450 },
  { day: "21 Jul", sales: 9_800, profit: 2_820 },
  { day: "22 Jul", sales: 10_400, profit: 3_100 },
  { day: "23 Jul", sales: 9_600, profit: 2_760 },
  { day: "24 Jul", sales: 11_300, profit: 3_680 },
  { day: "25 Jul", sales: 11_900, profit: 3_950 },
  { day: "26 Jul", sales: 12_500, profit: 4_200 },
];

export const demoTransactions: TransactionListResponse = {
  items: [
    {
      id: "txn-sale-001",
      organization_id: "merchant-berrechid",
      kind: "sale",
      currency: "MAD",
      total_centimes: 1_250_000,
      occurred_at: "2026-07-26T17:30:00Z",
      lines: [
        {
          line_id: "line-sale-oil",
          product_id: "cooking-oil-1l",
          product_name: "Cooking oil 1L",
          quantity: 500,
          unit_price_centimes: 2_500,
          line_total_centimes: 125_000,
        },
      ],
    },
    {
      id: "txn-purchase-001",
      organization_id: "merchant-berrechid",
      kind: "purchase",
      currency: "MAD",
      total_centimes: 52_500,
      occurred_at: "2026-07-26T08:20:00Z",
      ingestion_id: "ing-demo-001",
      draft_id: "draft-demo-001",
      lines: [
        {
          line_id: "line-oil",
          product_id: "cooking-oil-1l",
          product_name: "Cooking oil 1L",
          quantity: 20,
          unit_price_centimes: 2_200,
          line_total_centimes: 44_000,
        },
        {
          line_id: "line-sugar",
          product_id: "sugar-1kg",
          product_name: "Sugar 1kg",
          quantity: 10,
          unit_price_centimes: 850,
          line_total_centimes: 8_500,
        },
      ],
    },
    {
      id: "txn-expense-001",
      organization_id: "merchant-berrechid",
      kind: "expense",
      currency: "MAD",
      total_centimes: 3_000,
      occurred_at: "2026-07-25T15:10:00Z",
      lines: [],
    },
  ],
  next_cursor: null,
};

export const demoInventory: InventoryResponse = {
  items: [
    {
      product_id: "cooking-oil-1l",
      name: "Cooking oil 1L",
      unit: "BOTTLE",
      quantity_on_hand: 14,
      low_stock_threshold: 18,
      status: "LOW_STOCK",
      low_stock: true,
      predicted_stockout_at: "2026-07-30T15:00:00Z",
    },
    {
      product_id: "sugar-1kg",
      name: "Sugar 1kg",
      unit: "BAG",
      quantity_on_hand: 35,
      low_stock_threshold: 12,
      status: "HEALTHY",
      low_stock: false,
      predicted_stockout_at: "2026-08-08T15:00:00Z",
    },
    {
      product_id: "flour-1kg",
      name: "Flour 1kg",
      unit: "BAG",
      quantity_on_hand: 42,
      low_stock_threshold: 16,
      status: "HEALTHY",
      low_stock: false,
      predicted_stockout_at: "2026-08-12T15:00:00Z",
    },
    {
      product_id: "milk-1l",
      name: "Milk 1L",
      unit: "CARTON",
      quantity_on_hand: 28,
      low_stock_threshold: 10,
      status: "HEALTHY",
      low_stock: false,
      predicted_stockout_at: "2026-08-03T15:00:00Z",
    },
  ],
};

export const demoProductOptions: ProductOptionListResponse = {
  items: [
    {
      product_id: "cooking-oil-1l",
      name: "Cooking oil 1L",
      base_unit: "BOTTLE",
      units: [
        {
          unit: "BOTTLE",
          label: "Bottle",
          conversion_to_base: 1,
        },
        {
          unit: "CARTON",
          label: "Carton (12 bottles)",
          conversion_to_base: 12,
        },
      ],
    },
    {
      product_id: "sugar-1kg",
      name: "Sugar 1kg",
      base_unit: "BAG",
      units: [
        {
          unit: "BAG",
          label: "Bag (1 kg)",
          conversion_to_base: 1,
        },
      ],
    },
  ],
};

export const demoIngestion: IngestionResponse = {
  id: "ing-demo-001",
  organization_id: "merchant-berrechid",
  status: "NEEDS_REVIEW",
  document: {
    id: "doc-demo-001",
    kind: "receipt",
    original_name: "invoice-inv-8821.png",
    content_type: "image/png",
    size_bytes: 184_620,
  },
  draft: {
    id: "draft-demo-001",
    version: 1,
    transaction_kind: "purchase",
    currency: "MAD",
    total_centimes: 9_250_000,
    clarification_question: null,
    lines: [
      {
        line_id: "line-inv-8821",
        product_id: "cooking-oil-1l",
        product_name: "Cooking oil 1L",
        original_product_name: "Huile de table 1L — cartons de 12",
        unit: "CARTON",
        base_unit: "BOTTLE",
        unit_multiplier: 12,
        quantity: 500,
        unit_price_centimes: 18_500,
        line_total_centimes: 9_250_000,
        confidence: 0.99,
        uncertain_fields: [],
      },
    ],
  },
};

export const demoProcurementNeed: ProcurementNeed = {
  need_id: "need-oil-001",
  organization_id: "merchant-berrechid",
  product_id: "cooking-oil-1l",
  unit: "BOTTLE",
  quantity_needed: 20,
  stock_on_hand: 14,
  average_daily_sales: 3.5,
  days_remaining: 4,
  target_stock_quantity: 34,
  status: "OPEN",
  coarse_area: "Berrechid Center",
  stockout_at: "2026-07-30T15:00:00Z",
  needed_by: "2026-07-29T15:00:00Z",
  forecast_status: "FORECAST",
  sales_history_days: 7,
  explanation:
    "At the current sales rate of 3.5 bottles per day, the remaining 14 bottles will last about 4 days.",
  uncertainty_note:
    "Forecast uses seven days of confirmed sales and excludes unconfirmed drafts.",
};

const offer = (overrides: Partial<Offer>): Offer => ({
  offer_id: "offer-atlas-retail",
  organization_id: "merchant-berrechid",
  procurement_need_id: "need-oil-001",
  supplier_organization_id: "supplier-atlas",
  catalog_item_id: "cat-oil-retail",
  product_id: "cooking-oil-1l",
  requested_quantity: 20,
  unit: "BOTTLE",
  unit_price_centimes: 2_200,
  minimum_quantity: 10,
  delivery_fee_centimes: 3_000,
  delivery_days: 1,
  product_cost_centimes: 44_000,
  landed_cost_centimes: 47_000,
  landed_unit_cost_centimes: 2_350,
  expected_unit_margin_centimes: 650,
  eligible_alone: true,
  affordable: true,
  status: "AVAILABLE_NOW",
  explanation:
    "Available immediately and within your cash limit, but delivery raises the landed cost.",
  rejection_reasons: [],
  ...overrides,
});

export const demoOfferComparison: OfferCompareResponse = {
  available_now: [
    offer({}),
    offer({
      offer_id: "offer-chaouia",
      supplier_organization_id: "supplier-chaouia",
      catalog_item_id: "cat-oil-chaouia",
      unit_price_centimes: 2_050,
      minimum_quantity: 20,
      delivery_fee_centimes: 2_000,
      delivery_days: 2,
      product_cost_centimes: 41_000,
      landed_cost_centimes: 43_000,
      landed_unit_cost_centimes: 2_150,
      expected_unit_margin_centimes: 850,
      explanation:
        "Best eligible individual offer, with a two-day delivery window.",
    }),
  ],
  group_opportunity: offer({
    offer_id: "offer-atlas-bulk",
    catalog_item_id: "cat-oil-bulk",
    unit_price_centimes: 1_850,
    minimum_quantity: 50,
    delivery_fee_centimes: 0,
    product_cost_centimes: 37_000,
    landed_cost_centimes: 37_000,
    landed_unit_cost_centimes: 1_850,
    expected_unit_margin_centimes: 1_150,
    eligible_alone: false,
    status: "GROUP_ONLY",
    explanation:
      "Lowest landed cost, unlocked when nearby merchants combine at least 50 bottles.",
    rejection_reasons: ["MINIMUM_QUANTITY_NOT_MET"],
  }),
  rejected: [],
};

export const demoGroupOrder: GroupOrderResponse = {
  group_order: {
    group_order_id: "group-oil-001",
    product_id: "cooking-oil-1l",
    unit: "BOTTLE",
    supplier_organization_id: "supplier-atlas",
    supplier_catalog_item_id: "cat-oil-bulk",
    status: "OPEN",
    total_quantity: 55,
    minimum_quantity: 50,
    unit_price_centimes: 1_850,
    delivery_total_centimes: 0,
    participant_count: 3,
    coarse_area: "Berrechid Center",
    join_deadline: "2026-07-27T18:00:00Z",
    needed_by: "2026-07-29T15:00:00Z",
  },
  member: {
    organization_id: "merchant-berrechid",
    procurement_need_id: "need-oil-001",
    quantity: 20,
    status: "PENDING",
    original_unit_price_centimes: 2_200,
    collective_unit_price_centimes: 1_850,
    original_delivery_centimes: 3_000,
    collective_delivery_share_centimes: 0,
    product_saving_centimes: 7_000,
    delivery_saving_centimes: 3_000,
    total_saving_centimes: 10_000,
  },
  total_savings_centimes: 10_000,
  collective_unit_price_centimes: 1_850,
  original_unit_price_centimes: 2_200,
};

export const demoAgentRun: AgentRunRecord = {
  agent_run_id: "run-demo-001",
  organization_id: "merchant-berrechid",
  document_id: "doc-demo-001",
  ingestion_job_id: "ing-demo-001",
  provider: "fixture",
  model: "gemma-4",
  status: "SUCCEEDED",
  fallback_used: false,
  duration_ms: 1_236,
  created_at: "2026-07-26T09:05:00Z",
  completed_at: "2026-07-26T09:05:02Z",
  tool_calls: [
    {
      tool_call_id: "tool-evidence",
      organization_id: "merchant-berrechid",
      sequence: 1,
      name: "read_document",
      status: "SUCCEEDED",
      duration_ms: 416,
      fallback_used: false,
      input_summary: "Invoice INV-8821",
      output_summary: "1 invoice line · 92,500 MAD",
    },
    {
      tool_call_id: "tool-draft",
      organization_id: "merchant-berrechid",
      sequence: 2,
      name: "create_draft",
      status: "SUCCEEDED",
      duration_ms: 540,
      fallback_used: false,
      input_summary: "Extracted invoice fields",
      output_summary: "Cooking oil matched",
    },
    {
      tool_call_id: "tool-forecast",
      organization_id: "merchant-berrechid",
      sequence: 3,
      name: "match_units",
      status: "SUCCEEDED",
      duration_ms: 280,
      fallback_used: false,
      input_summary: "500 cartons · 12 bottles each",
      output_summary: "6,000 bottles",
    },
  ],
};

export const demoSupplierOpportunities: SupplierOpportunity[] = [
  {
    opportunity_id: "opportunity-oil-001",
    supplier_organization_id: "supplier-atlas",
    product_id: "cooking-oil-1l",
    unit: "BOTTLE",
    total_quantity: 55,
    coarse_area: "Berrechid Center",
    merchant_count: 3,
    status: "ACTIVE",
    needed_by: "2026-07-29T15:00:00Z",
    source_group_order_id: "group-oil-001",
  },
  {
    opportunity_id: "opportunity-sugar-001",
    supplier_organization_id: "supplier-atlas",
    product_id: "sugar-1kg",
    unit: "BAG",
    total_quantity: 80,
    coarse_area: "Berrechid East",
    merchant_count: 5,
    status: "ACTIVE",
    needed_by: "2026-08-02T15:00:00Z",
  },
];

export const demoSupplierDashboard: SupplierDashboardResponse = {
  kpis: {
    active_catalog_items: 5,
    active_demand_opportunities: 2,
    total_potential_volume: 135,
    estimated_revenue_centimes: 247_750,
  },
  opportunities: demoSupplierOpportunities,
};

export const demoSupplierCatalog: SupplierCatalogResponse = {
  items: [
    {
      catalog_item_id: "cat-oil-retail",
      organization_id: "supplier-atlas",
      product_id: "cooking-oil-1l",
      supplier_sku: "ATL-OIL-1L-RET",
      unit: "BOTTLE",
      unit_price_centimes: 2_200,
      minimum_quantity: 10,
      available_quantity: 500,
      delivery_fee_centimes: 3_000,
      delivery_days: 1,
      service_areas: ["Berrechid Center", "Berrechid East"],
      status: "ACTIVE",
    },
    {
      catalog_item_id: "cat-oil-bulk",
      organization_id: "supplier-atlas",
      product_id: "cooking-oil-1l",
      supplier_sku: "ATL-OIL-1L-BLK",
      unit: "BOTTLE",
      unit_price_centimes: 1_850,
      minimum_quantity: 50,
      available_quantity: 2_000,
      delivery_fee_centimes: 0,
      delivery_days: 1,
      service_areas: ["Berrechid Center"],
      status: "ACTIVE",
    },
    {
      catalog_item_id: "cat-sugar",
      organization_id: "supplier-atlas",
      product_id: "sugar-1kg",
      supplier_sku: "ATL-SUGAR-1KG",
      unit: "BAG",
      unit_price_centimes: 850,
      minimum_quantity: 10,
      available_quantity: 900,
      delivery_fee_centimes: 1_000,
      delivery_days: 1,
      service_areas: ["Berrechid Center", "Berrechid East"],
      status: "ACTIVE",
    },
  ],
};
