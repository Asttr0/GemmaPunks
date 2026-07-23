# Architecture

## Decision

GemmaPunks is a modular monolith: one React web app, one FastAPI backend, and one
Firebase project.

```mermaid
flowchart TB
    subgraph Web["React + TypeScript"]
      Merchant["Merchant portal"]
      Supplier["Supplier portal"]
      Review["Draft review and approval"]
      FirebaseClient["Firebase client SDK"]
    end

    subgraph API["FastAPI modular backend"]
      Business["Business APIs"]
      Agent["Gemma provider and tool loop"]
      Rules["Deterministic financial and procurement tools"]
    end

    subgraph Firebase["Firebase"]
      Auth["Authentication"]
      Firestore["Cloud Firestore"]
      Storage["Cloud Storage"]
    end

    Merchant --> Business
    Supplier --> Business
    Review --> Business
    FirebaseClient --> Auth
    FirebaseClient --> Storage
    Business --> Auth
    Business --> Firestore
    Business --> Storage
    Business --> Agent
    Agent --> Rules
    Rules --> Firestore
```

## Authority boundaries

- React presents state, gathers evidence, and asks for confirmation.
- Firebase Authentication creates the client ID token.
- FastAPI verifies the token and owns authoritative business operations.
- Gemma structures evidence, identifies uncertainty, chooses approved tools, and
  explains recommendations.
- Deterministic Python calculates totals, margins, affordability, stockout
  forecasts, rankings, and savings.
- Firestore stores confirmed records, drafts, approvals, and audit history.
- Cloud Storage stores evidence below organization-scoped paths.
- Humans confirm financial records and approve group-order participation.

## Firestore topology

```text
profiles/{user_id}
organizations/{organization_id}
  memberships/{user_id}
  products/{product_id}
  transactions/{transaction_id}
  inventory_movements/{movement_id}
  documents/{document_id}
  ingestion_jobs/{job_id}
  extraction_drafts/{draft_id}
  supplier_catalog_items/{item_id}
  procurement_needs/{need_id}
  offers/{offer_id}
  group_orders/{group_order_id}
  approvals/{approval_id}
  agent_runs/{run_id}
    tool_calls/{tool_call_id}
supplier_opportunities/{opportunity_id}
```

Business documents carry `organization_id` even when nested. The backend checks
membership and organization equality before reads and writes. Supplier
opportunities contain aggregated demand only.

## Failure mode

`FixtureProvider` implements the same interface as `GemmaApiProvider`. The demo
can switch to deterministic fixture output with `AI_PROVIDER=fixture`; financial
and procurement calculations never change provider.

