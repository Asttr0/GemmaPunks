# GemmaPunks

GemmaPunks is the hackathon repository for **MIZAN Souq**: a Darija-first
business-management and intelligent-procurement platform for Moroccan
microbusinesses.

The planned demo proves one loop:

> Evidence → reviewed draft → inventory insight → supplier comparison →
> collective order → human approval

## Start locally

Requirements: Node.js 20+, npm 10+, and Python 3.12+.

```bash
cp .env.example .env
make install
```

Then run these in separate terminals:

```bash
make api
make web
```

- Web: <http://localhost:5173>
- API: <http://localhost:8000>
- OpenAPI: <http://localhost:8000/docs>

This initial repository intentionally contains only a bootable web/API skeleton,
infrastructure configuration, documentation, and GitHub workflow. Product
features and business logic are not implemented yet.

## Quality checks

```bash
make lint
make test
npm run build
```

## Architecture

This is a modular monolith:

- `apps/web`: React + TypeScript + Vite
- `apps/api`: FastAPI + Pydantic
- Firebase Authentication, Cloud Firestore, and Cloud Storage
- `packages/contracts`: location reserved for the frozen OpenAPI contract
- `packages/demo-data`: directories reserved for synthetic demo data
- `docs`: decisions, architecture, team plan, and demo runbook
- `infra`: local and deployment configuration

AI output is always untrusted draft data. Deterministic Python owns calculations;
humans confirm financial records and approve commercial actions.

## Firebase

Local development is emulator-first:

```bash
npx firebase-tools emulators:start
```

The browser signs in through Firebase Authentication and sends its Firebase ID
token to FastAPI over HTTPS. FastAPI verifies it with the Firebase Admin SDK,
then enforces organization membership for every business query. Never commit
service-account JSON files.

## Team workflow

Start from a GitHub issue, create a short-lived branch such as
`feat/12-merchant-dashboard`, open a draft PR early, obtain one review, and
squash-merge after CI and Demo QA pass. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Hackathon

Build with Gemma — July 26, 2026  
Track: Autonomous Agents  
Theme: Financial Services
