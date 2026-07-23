# P0 API contract

This is the proposed P0 endpoint inventory. Issue #6 freezes schemas, examples,
OpenAPI output, and generated TypeScript types before frontend/backend feature
work begins. No product endpoints are implemented in the initial scaffold.

```text
POST   /api/v1/ingestions
GET    /api/v1/ingestions/{id}
POST   /api/v1/ingestions/{id}/confirm

GET    /api/v1/merchant/dashboard
GET    /api/v1/transactions
GET    /api/v1/inventory

POST   /api/v1/procurement-needs/generate
GET    /api/v1/procurement-needs
GET    /api/v1/suppliers/search
POST   /api/v1/offers/compare

POST   /api/v1/group-orders/propose
POST   /api/v1/group-orders/{id}/join
POST   /api/v1/group-orders/{id}/approve

GET    /api/v1/supplier/dashboard
GET    /api/v1/supplier/opportunities
POST   /api/v1/supplier/offers

GET    /api/v1/agent-runs/{id}
```

All business endpoints will require a verified Firebase ID token in production.
