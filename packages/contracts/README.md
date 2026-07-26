# API contracts

The FastAPI application is the source of truth for MIZAN Souq's HTTP contract.
The committed artifacts are:

- `openapi.json`: validated OpenAPI generated from FastAPI and Pydantic.
- `generated-types/api.ts`: TypeScript types generated from that OpenAPI file.

Regenerate both files after changing a request model, response model, or route:

```bash
npm run contracts:generate
```

CI runs `npm run contracts:check` and fails when generated files are stale.
Frontend code should import these types instead of guessing response shapes.
