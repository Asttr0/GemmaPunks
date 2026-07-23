# Contributing

## Branches

- `feat/<issue>-<summary>`
- `fix/<issue>-<summary>`
- `chore/<issue>-<summary>`

Do not push directly to `main`. Keep branches small and link every branch and PR
to one issue.

## Pull requests

1. Open a draft PR early.
2. Keep the PR focused on its issue acceptance criteria.
3. Run `make lint`, `make test`, and `npm run build`.
4. Add a screenshot or exact test instructions.
5. Request the review partner listed in `docs/team-plan.md`.
6. Resolve conversations and squash-merge.

## Safety invariants

- Never commit secrets or real merchant documents.
- Scope business-owned data by `organization_id`.
- Validate model output before persistence.
- Model output creates drafts, never confirmed financial records.
- Orders require explicit human approval.

