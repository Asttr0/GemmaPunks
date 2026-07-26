import type { components } from "../../../../packages/contracts/generated-types/api";
import type {
  AuditFinding,
  AuditRunResponse,
  ControlTowerDashboard,
  FinancialRecordList,
  FindingDecisionResponse,
  SupplierPortfolio,
} from "../features/control-tower/types";

export type AuthResponse = components["schemas"]["AuthResponse"];
export type SignUpRequest = components["schemas"]["SignUpRequest"];
export type AgentRunRecord = components["schemas"]["AgentRunRecord"];
export type ConfirmationResponse =
  components["schemas"]["ConfirmationResponse"];
export type ConfirmDraftRequest = components["schemas"]["ConfirmDraftRequest"];
export type CreateCatalogItemRequest =
  components["schemas"]["CreateCatalogItemRequest"];
export type CreateSupplierOfferRequest =
  components["schemas"]["CreateSupplierOfferRequest"];
export type DashboardResponse = components["schemas"]["DashboardResponse"];
export type GenerateProcurementNeedRequest =
  components["schemas"]["GenerateProcurementNeedRequest"];
export type GroupOrderListResponse =
  components["schemas"]["GroupOrderListResponse"];
export type GroupOrderResponse = components["schemas"]["GroupOrderResponse"];
export type IngestionResponse = components["schemas"]["IngestionResponse"];
export type InventoryResponse = components["schemas"]["InventoryResponse"];
export type ProductOptionListResponse =
  components["schemas"]["ProductOptionListResponse"];
export type Offer = components["schemas"]["Offer"];
export type OfferCompareRequest = components["schemas"]["OfferCompareRequest"];
export type OfferCompareResponse =
  components["schemas"]["OfferCompareResponse"];
export type ProcurementNeed = components["schemas"]["ProcurementNeed"];
export type ProposeGroupOrderRequest =
  components["schemas"]["ProposeGroupOrderRequest"];
export type SupplierCatalogItem = components["schemas"]["SupplierCatalogItem"];
export type SupplierCatalogResponse =
  components["schemas"]["SupplierCatalogResponse"];
export type SupplierDashboardResponse =
  components["schemas"]["SupplierDashboardResponse"];
export type SupplierOpportunity = components["schemas"]["SupplierOpportunity"];
export type SupplierOpportunityListResponse =
  components["schemas"]["SupplierOpportunityListResponse"];
export type SupplierSearchResponse =
  components["schemas"]["SupplierSearchResponse"];
export type TransactionListResponse =
  components["schemas"]["TransactionListResponse"];

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>;
    };

    if (typeof payload.detail === "string") {
      return payload.detail;
    }

    const validationMessage = payload.detail?.find((item) => item.msg)?.msg;
    if (validationMessage) {
      return validationMessage;
    }
  } catch {
    // The API may return an empty or non-JSON response.
  }

  return `Request failed with status ${response.status}`;
};

export const apiRequest = async <T>(
  path: string,
  idToken: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${idToken}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiRequestError(
      await readErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as T;
};

export const registerBusiness = (
  request: SignUpRequest,
  idToken: string,
): Promise<AuthResponse> =>
  apiRequest<AuthResponse>("/api/v1/auth/signup", idToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

export const getAuthSession = (idToken: string): Promise<AuthResponse> =>
  apiRequest<AuthResponse>("/api/v1/auth/me", idToken);

export const getMerchantDashboard = (
  idToken: string,
): Promise<DashboardResponse> =>
  apiRequest<DashboardResponse>("/api/v1/merchant/dashboard", idToken);

export const getTransactions = (
  idToken: string,
): Promise<TransactionListResponse> =>
  apiRequest<TransactionListResponse>("/api/v1/transactions", idToken);

export const getInventory = (idToken: string): Promise<InventoryResponse> =>
  apiRequest<InventoryResponse>("/api/v1/inventory", idToken);

export const getProductOptions = (
  idToken: string,
): Promise<ProductOptionListResponse> =>
  apiRequest<ProductOptionListResponse>(
    "/api/v1/inventory/product-options",
    idToken,
  );

export const uploadEvidence = (
  file: File,
  kind: "receipt" | "audio" | "ledger" | "screenshot",
  idToken: string,
): Promise<IngestionResponse> => {
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);

  return apiRequest<IngestionResponse>("/api/v1/ingestions", idToken, {
    method: "POST",
    body,
  });
};

export const getIngestion = (
  ingestionId: string,
  idToken: string,
): Promise<IngestionResponse> =>
  apiRequest<IngestionResponse>(
    `/api/v1/ingestions/${encodeURIComponent(ingestionId)}`,
    idToken,
  );

export const confirmIngestion = (
  ingestionId: string,
  request: ConfirmDraftRequest,
  idToken: string,
  idempotencyKey: string,
): Promise<ConfirmationResponse> =>
  apiRequest<ConfirmationResponse>(
    `/api/v1/ingestions/${encodeURIComponent(ingestionId)}/confirm`,
    idToken,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(request),
    },
  );

export const getProcurementNeeds = (
  idToken: string,
): Promise<ProcurementNeed[]> =>
  apiRequest<ProcurementNeed[]>("/api/v1/procurement-needs", idToken);

export const generateProcurementNeed = (
  request: GenerateProcurementNeedRequest,
  idToken: string,
): Promise<ProcurementNeed> =>
  apiRequest<ProcurementNeed>("/api/v1/procurement-needs/generate", idToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

export const searchSuppliers = (
  productId: string,
  idToken: string,
): Promise<SupplierSearchResponse> =>
  apiRequest<SupplierSearchResponse>(
    `/api/v1/suppliers/search?product_id=${encodeURIComponent(productId)}`,
    idToken,
  );

export const compareOffers = (
  request: OfferCompareRequest,
  idToken: string,
): Promise<OfferCompareResponse> =>
  apiRequest<OfferCompareResponse>("/api/v1/offers/compare", idToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

export const getGroupOrders = (
  idToken: string,
): Promise<GroupOrderListResponse> =>
  apiRequest<GroupOrderListResponse>("/api/v1/group-orders", idToken);

export const proposeGroupOrder = (
  request: ProposeGroupOrderRequest,
  idToken: string,
): Promise<GroupOrderResponse> =>
  apiRequest<GroupOrderResponse>("/api/v1/group-orders/propose", idToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

export const joinGroupOrder = (
  groupOrderId: string,
  idToken: string,
): Promise<GroupOrderResponse> =>
  apiRequest<GroupOrderResponse>(
    `/api/v1/group-orders/${encodeURIComponent(groupOrderId)}/join`,
    idToken,
    { method: "POST" },
  );

export const approveGroupOrder = (
  groupOrderId: string,
  idToken: string,
  idempotencyKey: string,
): Promise<GroupOrderResponse> =>
  apiRequest<GroupOrderResponse>(
    `/api/v1/group-orders/${encodeURIComponent(groupOrderId)}/approve`,
    idToken,
    {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );

export const getSupplierDashboard = (
  idToken: string,
): Promise<SupplierDashboardResponse> =>
  apiRequest<SupplierDashboardResponse>("/api/v1/supplier/dashboard", idToken);

export const getSupplierOpportunities = (
  idToken: string,
): Promise<SupplierOpportunityListResponse> =>
  apiRequest<SupplierOpportunityListResponse>(
    "/api/v1/supplier/opportunities",
    idToken,
  );

export const getSupplierCatalog = (
  idToken: string,
): Promise<SupplierCatalogResponse> =>
  apiRequest<SupplierCatalogResponse>("/api/v1/supplier/catalogs", idToken);

export const createSupplierCatalogItem = (
  request: CreateCatalogItemRequest,
  idToken: string,
): Promise<SupplierCatalogItem> =>
  apiRequest<SupplierCatalogItem>("/api/v1/supplier/catalogs", idToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

export const createSupplierOffer = (
  request: CreateSupplierOfferRequest,
  idToken: string,
): Promise<Offer> =>
  apiRequest<Offer>("/api/v1/supplier/offers", idToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

export const getAgentRun = (
  agentRunId: string,
  idToken: string,
): Promise<AgentRunRecord> =>
  apiRequest<AgentRunRecord>(
    `/api/v1/agent-runs/${encodeURIComponent(agentRunId)}`,
    idToken,
  );

export const getControlTowerDashboard = (
  idToken: string,
): Promise<ControlTowerDashboard> =>
  apiRequest<ControlTowerDashboard>("/api/v1/control-tower/dashboard", idToken);

export const getAuditFindings = (idToken: string): Promise<AuditFinding[]> =>
  apiRequest<AuditFinding[]>("/api/v1/control-tower/audit-findings", idToken);

export const getAuditFinding = (
  findingId: string,
  idToken: string,
): Promise<AuditFinding> =>
  apiRequest<AuditFinding>(
    `/api/v1/control-tower/audit-findings/${encodeURIComponent(findingId)}`,
    idToken,
  );

export const decideAuditFinding = (
  findingId: string,
  action: "PREPARE_DISPUTE" | "APPROVE_CORRECTED_AMOUNT" | "DISMISS",
  idToken: string,
  note?: string,
): Promise<FindingDecisionResponse> =>
  apiRequest<FindingDecisionResponse>(
    `/api/v1/control-tower/audit-findings/${encodeURIComponent(findingId)}/decide`,
    idToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    },
  );

export const getSupplierPortfolio = (
  idToken: string,
): Promise<SupplierPortfolio> =>
  apiRequest<SupplierPortfolio>("/api/v1/control-tower/suppliers", idToken);

export const getFinancialRecords = (
  idToken: string,
): Promise<FinancialRecordList> =>
  apiRequest<FinancialRecordList>("/api/v1/control-tower/records", idToken);

export const runControlAudit = (idToken: string): Promise<AuditRunResponse> =>
  apiRequest<AuditRunResponse>("/api/v1/control-tower/audit-runs", idToken, {
    method: "POST",
  });
