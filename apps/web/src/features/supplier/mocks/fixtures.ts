export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface Opportunity {
  id: string;
  productName: string;
  totalQuantity: number;
  merchantCount: number;
  estimatedRevenue: number;
  deadline: string;
  status: "pending" | "ready";
}

export interface ActiveOffer {
  id: string;
  productName: string;
  offerPrice: number;
  moq: number;
  totalRaised: number;
  merchantCount: number;
  status: "active" | "accepted" | "expired";
  expiresAt: string;
}

export interface SupplierDashboardData {
  catalog: CatalogItem[];
  opportunities: Opportunity[];
  activeOffers: ActiveOffer[];
  summary: {
    totalCatalogItems: number;
    outOfStockItems: number;
    pendingOpportunities: number;
    activeOffersCount: number;
  };
}

export const mockCatalogItems: CatalogItem[] = [
  {
    id: "item-1",
    sku: "SKU-001",
    name: "Premium Flour 5kg",
    category: "Grains",
    price: 45.0,
    cost: 32.0,
    stock: 150,
    minStock: 50,
    unit: "bags",
  },
  {
    id: "item-2",
    sku: "SKU-002",
    name: "Olive Oil 1L",
    category: "Oils",
    price: 78.0,
    cost: 55.0,
    stock: 25,
    minStock: 40,
    unit: "bottles",
  },
  {
    id: "item-3",
    sku: "SKU-003",
    name: "Tomato Paste 800g",
    category: "Preserves",
    price: 22.5,
    cost: 15.0,
    stock: 80,
    minStock: 50,
    unit: "cans",
  },
  {
    id: "item-4",
    sku: "SKU-004",
    name: "Chicken Thighs 1kg",
    category: "Meat",
    price: 65.0,
    cost: 42.0,
    stock: 0,
    minStock: 20,
    unit: "packs",
  },
  {
    id: "item-5",
    sku: "SKU-005",
    name: "Fresh Eggs",
    category: "Dairy",
    price: 18.0,
    cost: 12.0,
    stock: 200,
    minStock: 100,
    unit: "crates",
  },
];

export const mockOpportunities: Opportunity[] = [
  {
    id: "opp-1",
    productName: "Premium Flour 5kg",
    totalQuantity: 120,
    merchantCount: 5,
    estimatedRevenue: 5400.0,
    deadline: "2026-08-05",
    status: "ready",
  },
  {
    id: "opp-2",
    productName: "Olive Oil 1L",
    totalQuantity: 85,
    merchantCount: 7,
    estimatedRevenue: 6630.0,
    deadline: "2026-08-03",
    status: "ready",
  },
  {
    id: "opp-3",
    productName: "Tomato Paste 800g",
    totalQuantity: 45,
    merchantCount: 3,
    estimatedRevenue: 1012.5,
    deadline: "2026-08-07",
    status: "pending",
  },
];

export const mockActiveOffers: ActiveOffer[] = [
  {
    id: "offer-1",
    productName: "Premium Flour 5kg",
    offerPrice: 42.0,
    moq: 100,
    totalRaised: 65,
    merchantCount: 3,
    status: "active",
    expiresAt: "2026-07-28",
  },
  {
    id: "offer-2",
    productName: "Olive Oil 1L",
    offerPrice: 72.0,
    moq: 50,
    totalRaised: 30,
    merchantCount: 2,
    status: "active",
    expiresAt: "2026-07-26",
  },
  {
    id: "offer-3",
    productName: "Chicken Thighs 1kg",
    offerPrice: 60.0,
    moq: 30,
    totalRaised: 30,
    merchantCount: 4,
    status: "accepted",
    expiresAt: "2026-07-24",
  },
];

export const mockDashboardData: SupplierDashboardData = {
  catalog: mockCatalogItems,
  opportunities: mockOpportunities,
  activeOffers: mockActiveOffers,
  summary: {
    totalCatalogItems: 5,
    outOfStockItems: 1,
    pendingOpportunities: 1,
    activeOffersCount: 3,
  },
};

export const mockCatalogLoading: CatalogItem[] = [];
export const mockOpportunitiesLoading: Opportunity[] = [];
export const mockActiveOffersLoading: ActiveOffer[] = [];
