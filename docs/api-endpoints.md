# MIZAN Souq API Documentation

This document describes all REST API endpoints for MIZAN Souq, including request formats, headers, request bodies, and response JSON examples.

---

## 1. Global API Rules

- **Base URL**: `http://localhost:8000`
- **Authentication**: All endpoints require a Firebase ID Token passed in the HTTP Authorization header:
  ```http
  Authorization: Bearer <firebase_id_token>
  ```
- **Money Rule**: All monetary values are integer centimes (`INTEGER_CENTIMES`). Never pass floating-point MAD values.
  - `18.50 MAD` = `1850 centimes`
  - `22.00 MAD` = `2200 centimes`
- **Idempotency Rule**: Consequential write operations (such as draft confirmation) accept an `Idempotency-Key` header:
  ```http
  Idempotency-Key: <unique_uuid_or_key>
  ```
- **Multi-Tenant Isolation**: Data is automatically scoped by `organization_id` extracted from verified token claims. Client request bodies must not attempt to override `organization_id`.

---

## 2. Authentication Endpoints

### 2.1 Get Current User Context
Returns the currently authenticated user identity, profile, and organization details.

- **Method & Path**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "user_id": "demo-merchant",
      "organization_id": "merchant-berrechid",
      "role": "owner",
      "email": "merchant.demo@example.com",
      "display_name": "Demo Merchant"
    },
    "profile": {
      "user_id": "demo-merchant",
      "display_name": "Demo Merchant",
      "email": "merchant.demo@example.com",
      "primary_organization_id": "merchant-berrechid",
      "locale": "en-MA"
    },
    "organization": {
      "organization_id": "merchant-berrechid",
      "name": "Grocery Store Berrechid",
      "type": "MERCHANT",
      "status": "ACTIVE",
      "city": "Berrechid",
      "coarse_area": "Berrechid Center"
    }
  }
  ```

### 2.2 Login User
Authenticates user and returns profile and active organization context.

- **Method & Path**: `POST /api/v1/auth/login`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "id_token": "<firebase_id_token>"
  }
  ```
- **Response `200 OK`**: Same structure as `GET /api/v1/auth/me`.

### 2.3 Sign Up / Register Business Organization
Creates a new user profile and merchant or supplier organization.

Firebase Authentication creates the identity first. This endpoint then verifies
that user's ID token and uses the Firebase Admin SDK to create the profile,
organization, membership, and organization claims. The browser never writes
those records directly.

- **Method & Path**: `POST /api/v1/auth/signup`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "email": "hassan@mizansouq.ma",
    "display_name": "Hassan Slimani",
    "organization_name": "Berrechid Supermarche",
    "organization_type": "MERCHANT"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "user_id": "demo-merchant",
      "organization_id": "merchant-berrechid-supermarche",
      "role": "owner",
      "email": "hassan@mizansouq.ma",
      "display_name": "Hassan Slimani"
    },
    "profile": {
      "user_id": "demo-merchant",
      "display_name": "Hassan Slimani",
      "email": "hassan@mizansouq.ma",
      "primary_organization_id": "merchant-berrechid-supermarche",
      "locale": "en-MA"
    },
    "organization": {
      "organization_id": "merchant-berrechid-supermarche",
      "name": "Berrechid Supermarche",
      "type": "MERCHANT",
      "status": "ACTIVE",
      "city": "Berrechid",
      "coarse_area": "Berrechid Center"
    }
  }
  ```

After a successful signup, the client refreshes its Firebase ID token so the
new `organization_id` and `role` claims are included in later API requests.

---

## 3. Evidence Ingestion Endpoints

### 3.1 Upload Evidence (Receipt / Audio)
Uploads a receipt image, voice note, photo, or invoice file and triggers Gemma evidence extraction to produce a reviewable draft.

- **Method & Path**: `POST /api/v1/ingestions`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Form Parameters**:
  - `file`: `<binary_file_data>`
  - `kind`: `receipt` | `audio` | `ledger` | `screenshot`
- **Response `200 OK`**:
  ```json
  {
    "id": "ing_8f2a1b",
    "organization_id": "merchant-berrechid",
    "status": "NEEDS_REVIEW",
    "document": {
      "id": "doc_a9310f",
      "kind": "receipt",
      "original_name": "receipt.jpg",
      "content_type": "image/jpeg",
      "size_bytes": 245821
    },
    "draft": {
      "id": "draft_9c12a4",
      "version": 1,
      "transaction_kind": "purchase",
      "currency": "MAD",
      "lines": [
        {
          "line_id": "line_001",
          "product_id": "cooking-oil-1l",
          "product_name": "Cooking oil 1L",
          "unit": "bottle",
          "quantity": 20,
          "unit_price_centimes": 2200,
          "line_total_centimes": 44000,
          "confidence": 0.99,
          "uncertain_fields": []
        },
        {
          "line_id": "line_002",
          "product_id": "sugar-1kg",
          "product_name": "Sugar 1kg",
          "unit": "bag",
          "quantity": 10,
          "unit_price_centimes": 850,
          "line_total_centimes": 8500,
          "confidence": 0.64,
          "uncertain_fields": ["quantity"]
        }
      ],
      "total_centimes": 52500,
      "clarification_question": "Was the sugar quantity 10 bags?"
    }
  }
  ```

### 3.2 Read Ingestion Status & Draft
Fetches an ingestion job and extraction draft by ID.

- **Method & Path**: `GET /api/v1/ingestions/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: Same structure as `POST /api/v1/ingestions`.
- **Response `404 Not Found`**: Returned if ingestion ID does not exist or belongs to another business.

### 3.3 Confirm Draft & Create Official Record
Confirms the corrected draft, recalculating line totals and overall total in centimes, creating an official transaction, and adjusting inventory stock levels.

- **Method & Path**: `POST /api/v1/ingestions/{id}/confirm`
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <unique_key>` (optional, recommended)
- **Request Body**:
  ```json
  {
    "draft_version": 1,
    "clarification_answers": [
      {
        "field_path": "lines[1].quantity",
        "answer": "10"
      }
    ],
    "draft": {
      "transaction_kind": "purchase",
      "lines": [
        {
          "line_id": "line_001",
          "product_id": "cooking-oil-1l",
          "product_name": "Cooking oil 1L",
          "unit": "bottle",
          "quantity": 20,
          "unit_price_centimes": 2200,
          "line_total_centimes": 44000
        },
        {
          "line_id": "line_002",
          "product_id": "sugar-1kg",
          "product_name": "Sugar 1kg",
          "unit": "bag",
          "quantity": 10,
          "unit_price_centimes": 850,
          "line_total_centimes": 8500
        }
      ],
      "total_centimes": 52500
    }
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "ingestion_id": "ing_8f2a1b",
    "draft_id": "draft_9c12a4",
    "transaction_id": "txn_3a19e8",
    "inventory_movement_ids": ["mov_110a2", "mov_110a3"],
    "status": "CONFIRMED",
    "total_centimes": 52500
  }
  ```

---

## 4. Merchant Dashboard, Transactions & Inventory

### 4.1 Merchant Dashboard
Returns merchant KPIs (`sales_centimes`, `expenses_centimes`, `estimated_profit_centimes`, `available_cash_centimes`), inventory metrics, stockout alerts, and recommended next action.

- **Method & Path**: `GET /api/v1/merchant/dashboard`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "kpis": {
      "sales_centimes": 1250000,
      "expenses_centimes": 830000,
      "estimated_profit_centimes": 420000,
      "available_cash_centimes": 610000
    },
    "inventory": {
      "product_count": 2,
      "low_stock_count": 1
    },
    "alerts": [
      {
        "code": "stockout_soon",
        "message": "Cooking oil 1L may run out soon. Current stock: 14 units."
      }
    ],
    "next_action": {
      "code": "review_procurement_need",
      "label": "Review a safe reorder of 20 units",
      "target_id": "need-oil-001"
    }
  }
  ```

### 4.2 List Confirmed Transactions
Returns all official sales, purchases, and expenses for the organization.

- **Method & Path**: `GET /api/v1/transactions`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "items": [
      {
        "id": "txn_seed_001",
        "organization_id": "merchant-berrechid",
        "kind": "sale",
        "currency": "MAD",
        "total_centimes": 1250000,
        "lines": [
          {
            "line_id": "line_seed_001",
            "product_id": "cooking-oil-1l",
            "product_name": "Cooking oil 1L",
            "quantity": 50,
            "unit_price_centimes": 2500,
            "line_total_centimes": 1250000
          }
        ],
        "occurred_at": "2026-07-25T12:00:00Z"
      }
    ],
    "next_cursor": null
  }
  ```

### 4.3 List Inventory & Stockout Predictions
Returns stock on hand, low-stock flags, and predicted stockout dates.

- **Method & Path**: `GET /api/v1/inventory`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "items": [
      {
        "product_id": "cooking-oil-1l",
        "name": "Cooking oil 1L",
        "quantity_on_hand": 14,
        "low_stock": true,
        "predicted_stockout_at": "2026-07-29T15:00:00Z"
      },
      {
        "product_id": "sugar-1kg",
        "name": "Sugar 1kg",
        "quantity_on_hand": 35,
        "low_stock": false,
        "predicted_stockout_at": null
      }
    ]
  }
  ```

---

## 5. Procurement Engine Endpoints

### 5.1 Generate Procurement Need
Calculates average sales rate, predicts stockout date, and generates a procurement restocking need.

- **Method & Path**: `POST /api/v1/procurement-needs/generate`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "product_id": "cooking-oil-1l",
    "unit": "BOTTLE",
    "target_stock": 34.0
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "need_id": "need-e1a49f",
    "organization_id": "merchant-berrechid",
    "product_id": "cooking-oil-1l",
    "unit": "BOTTLE",
    "quantity_needed": 20.0,
    "stock_on_hand": 14.0,
    "average_daily_sales": 3.5,
    "days_remaining": 4,
    "target_stock_quantity": 34.0,
    "status": "OPEN",
    "coarse_area": "Berrechid Center",
    "stockout_at": "2026-07-29T15:00:00Z",
    "needed_by": "2026-07-29T15:00:00Z"
  }
  ```

### 5.2 List Procurement Needs
- **Method & Path**: `GET /api/v1/procurement-needs`
- **Headers**: `Authorization: Bearer <token>`

### 5.3 Search Supplier Catalogs
Searches active supplier catalog items matching product criteria.

- **Method & Path**: `GET /api/v1/suppliers/search?product_id=cooking-oil-1l`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "items": [
      {
        "catalog_item_id": "cat-oil-retail",
        "organization_id": "supplier-atlas",
        "product_id": "cooking-oil-1l",
        "supplier_sku": "ATL-OIL-1L-RET",
        "unit": "BOTTLE",
        "unit_price_centimes": 2200,
        "minimum_quantity": 10.0,
        "available_quantity": 500.0,
        "delivery_fee_centimes": 3000,
        "delivery_days": 1,
        "status": "ACTIVE"
      },
      {
        "catalog_item_id": "cat-oil-bulk",
        "organization_id": "supplier-atlas",
        "product_id": "cooking-oil-1l",
        "supplier_sku": "ATL-OIL-1L-BLK",
        "unit": "BOTTLE",
        "unit_price_centimes": 1850,
        "minimum_quantity": 50.0,
        "available_quantity": 2000.0,
        "delivery_fee_centimes": 0,
        "delivery_days": 1,
        "status": "ACTIVE"
      }
    ]
  }
  ```

### 5.4 Compare Supplier Offers
Evaluates catalog items against a procurement need, computes landed cost (`unit_price * qty + delivery`), evaluates MOQs, and ranks eligible alone vs group-only offers.

- **Method & Path**: `POST /api/v1/offers/compare`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "procurement_need_id": "need-oil-001",
    "quantity": 20.0
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "available_now": [
      {
        "offer_id": "off-a19e2",
        "organization_id": "merchant-berrechid",
        "procurement_need_id": "need-oil-001",
        "supplier_organization_id": "supplier-atlas",
        "catalog_item_id": "cat-oil-retail",
        "product_id": "cooking-oil-1l",
        "requested_quantity": 20.0,
        "unit_price_centimes": 2200,
        "minimum_quantity": 10.0,
        "delivery_fee_centimes": 3000,
        "landed_cost_centimes": 47000,
        "eligible_alone": true,
        "affordable": true,
        "status": "AVAILABLE_NOW"
      }
    ],
    "group_opportunity": {
      "offer_id": "off-b20f3",
      "organization_id": "merchant-berrechid",
      "procurement_need_id": "need-oil-001",
      "supplier_organization_id": "supplier-atlas",
      "catalog_item_id": "cat-oil-bulk",
      "product_id": "cooking-oil-1l",
      "requested_quantity": 20.0,
      "unit_price_centimes": 1850,
      "minimum_quantity": 50.0,
      "delivery_fee_centimes": 0,
      "landed_cost_centimes": 37000,
      "eligible_alone": false,
      "affordable": true,
      "status": "GROUP_ONLY",
      "rejection_reasons": [
        "Minimum order quantity 50.0 not met by single merchant demand 20.0"
      ]
    },
    "rejected": []
  }
  ```

---

## 6. Group Orders & Collective Purchasing

### 6.1 Propose Group Order
Combines compatible merchant demand (e.g. 20 units merchant + 35 units partner shops = 55 total units) to hit supplier MOQ and unlock wholesale prices.

- **Method & Path**: `POST /api/v1/group-orders/propose`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "procurement_need_id": "need-oil-001",
    "product_id": "cooking-oil-1l",
    "quantity": 20.0,
    "supplier_organization_id": "supplier-atlas",
    "supplier_catalog_item_id": "cat-oil-bulk"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "group_order": {
      "group_order_id": "go-c39f1",
      "product_id": "cooking-oil-1l",
      "unit": "BOTTLE",
      "supplier_organization_id": "supplier-atlas",
      "supplier_catalog_item_id": "cat-oil-bulk",
      "status": "PROPOSED",
      "total_quantity": 55.0,
      "minimum_quantity": 50.0,
      "unit_price_centimes": 1850,
      "delivery_total_centimes": 0,
      "participant_organization_ids": [
        "merchant-berrechid",
        "merchant-chawia-grocery",
        "merchant-berrechid-snack"
      ],
      "coarse_area": "Berrechid Center"
    },
    "member": {
      "organization_id": "merchant-berrechid",
      "procurement_need_id": "need-oil-001",
      "quantity": 20.0,
      "status": "JOINED",
      "original_unit_price_centimes": 2200,
      "collective_unit_price_centimes": 1850,
      "original_delivery_centimes": 3000,
      "collective_delivery_share_centimes": 0,
      "product_saving_centimes": 7000,
      "delivery_saving_centimes": 3000,
      "total_saving_centimes": 10000
    },
    "total_savings_centimes": 10000,
    "collective_unit_price_centimes": 1850,
    "original_unit_price_centimes": 2200
  }
  ```

### 6.2 Join Group Order
- **Method & Path**: `POST /api/v1/group-orders/{id}/join`
- **Headers**: `Authorization: Bearer <token>`

### 6.3 Approve Group Order
- **Method & Path**: `POST /api/v1/group-orders/{id}/approve`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: Updates member status to `APPROVED` and records approval user ID and timestamp.

---

## 7. Supplier Portal & Catalogs

### 7.1 Supplier Dashboard
- **Method & Path**: `GET /api/v1/supplier/dashboard`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "kpis": {
      "active_catalog_items": 2,
      "active_demand_opportunities": 1,
      "total_potential_volume": 55.0,
      "estimated_revenue_centimes": 101750
    },
    "opportunities": [
      {
        "opportunity_id": "opp-oil-001",
        "product_id": "cooking-oil-1l",
        "unit": "BOTTLE",
        "total_quantity": 55.0,
        "coarse_area": "Berrechid Center",
        "merchant_count": 3,
        "status": "ACTIVE"
      }
    ]
  }
  ```

### 7.2 List Aggregated Demand Opportunities
- **Method & Path**: `GET /api/v1/supplier/opportunities`
- **Headers**: `Authorization: Bearer <token>`

### 7.3 Submit Supplier Offer / Quote
- **Method & Path**: `POST /api/v1/supplier/offers`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "opportunity_id": "opp-oil-001",
    "catalog_item_id": "cat-oil-bulk",
    "unit_price_centimes": 1850,
    "minimum_quantity": 50.0
  }
  ```

### 7.4 Create Supplier Catalog Item
- **Method & Path**: `POST /api/v1/supplier/catalogs`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "product_id": "sugar-1kg",
    "supplier_sku": "ATL-SUGAR-1KG",
    "unit": "BAG",
    "unit_price_centimes": 850,
    "minimum_quantity": 10.0,
    "available_quantity": 500.0,
    "delivery_fee_centimes": 1000,
    "delivery_days": 1,
    "service_areas": ["Berrechid Center"]
  }
  ```

---

## 8. Agent Audit Timeline

### 8.1 Get Agent Run Audit
- **Method & Path**: `GET /api/v1/agent-runs/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "agent_run_id": "run-001",
    "organization_id": "merchant-berrechid",
    "provider": "fixture",
    "model": null,
    "status": "SUCCEEDED",
    "fallback_used": false,
    "duration_ms": 180,
    "tool_calls": [
      {
        "tool_call_id": "tc-001",
        "organization_id": "merchant-berrechid",
        "sequence": 1,
        "name": "inspect_evidence",
        "status": "SUCCEEDED",
        "duration_ms": 45,
        "input_summary": "Processed receipt image",
        "output_summary": "Validated 2 line items"
      },
      {
        "tool_call_id": "tc-002",
        "organization_id": "merchant-berrechid",
        "sequence": 2,
        "name": "forecast_stockout",
        "status": "SUCCEEDED",
        "duration_ms": 60,
        "input_summary": "Calculated cooking oil sales rate",
        "output_summary": "4 days remaining; 20 units recommended"
      }
    ]
  }
  ```
