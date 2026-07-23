# Five-person ownership plan

Names and usernames for Members 2–5 are intentionally left open. Assign the
role, not a random person, during kickoff; then replace the placeholders here
and in `CODEOWNERS`.

| Role | Owner | Primary scope | P0 issues |
|---|---|---|---|
| Lead and integration | Taha (`@Asttr0`) | architecture, contracts, security, CI/CD, integration, deployments, demo | #1, #2, #3, #6, #18, #20 |
| Merchant experience | `@TBD` | upload, draft review, dashboard, transactions, inventory alerts | #7, #8 |
| Supplier experience | `@TBD` | shared UI, supplier portal, offers, opportunity and collective-order UI | #9, #10 |
| Backend and Firebase | `@TBD` | Firebase project, Auth, Firestore/Storage, business APIs, seed/reset | #4, #5, #11, #12, #19 |
| Gemma and procurement | `@TBD` | providers, prompts, extraction, deterministic procurement tools | #13, #14, #15, #16, #17 |

Issues #15–#17 are shared with Backend and Firebase, but the Gemma/procurement
owner is accountable and requests review from the backend owner.

## Review partners

- Taha reviews infrastructure, security, contracts, and cross-module changes.
- Merchant Experience and Supplier Experience review each other.
- Backend and Firebase reviews data access in AI/procurement changes.
- Gemma and Procurement reviews AI-facing backend schemas.

## First-day parallel start

| Person | Start immediately | First integration point |
|---|---|---|
| Taha | #1 repository commands, then #2 CI | Merge all shells to deployed `main` |
| Merchant Experience | #7 using frozen fixture contracts | `/merchant` renders seeded dashboard |
| Supplier Experience | #9 plus shared components | `/supplier` renders seeded opportunity |
| Backend and Firebase | #4 emulator/project setup, then #5 | Verified auth and scoped seed read |
| Gemma and Procurement | #13 provider interface and fixture | Valid `ExtractionDraft` fixture |

## WIP and handoff rules

- One major `In Progress` issue per person.
- API changes start with an OpenAPI example update.
- A blocked owner tags the exact dependency issue and posts the expected schema,
  decision, or review needed.
- Merge a vertical slice at least twice daily; do not keep day-long integration
  branches.
- P0 is Done only in the shared deployment with seeded data.

## Decisions needed at kickoff

- Four names and GitHub usernames.
- Demo product category and exact synthetic documents.
- Presentation language.
- Shared Firebase, Vercel, Railway, and Gemini account owners.
- Morning check-in, integration check, and July 25 feature-freeze times.
- Main and backup presenters.

