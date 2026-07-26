import { Timestamp } from "firebase/firestore";

export interface CatalogItem {
  catalog_item_id: string;
  organization_id: string;
  product_id: string;
  supplier_sku: string;
  unit: string;
  unit_price_centimes: number;
  minimum_quantity: number;
  available_quantity: number;
  delivery_fee_centimes: number;
  delivery_days: number;
  service_areas: string[];
  status: "ACTIVE" | "INACTIVE";
}

export interface Opportunity {
  opportunity_id: string;
  product_id: string;
  unit: string;
  total_quantity: number;
  merchant_count: number;
  status: "ACTIVE" | "QUOTED" | "CLOSED" | "ARCHIVED";
  needed_by: Timestamp;
  source_group_order_id: string;
  coarse_area?: string;
}

export interface ActiveOffer {
  offer_id: string;
  organization_id: string;
  product_id: string;
  supplier_organization_id: string;
  catalog_item_id: string;
  unit: string;
  unit_price_centimes: number;
  minimum_quantity: number;
  delivery_fee_centimes: number;
  landed_cost_centimes: number;
  status: "AVAILABLE_NOW" | "GROUP_ONLY" | "REJECTED";
}
