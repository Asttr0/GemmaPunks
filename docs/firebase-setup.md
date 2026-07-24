# Firebase setup

MIZAN Souq uses Firebase Authentication and Cloud Firestore. FastAPI uses the
Firebase Admin SDK as the only authoritative business writer.

## Local setup

The repository already contains `firebase.json`, `.firebaserc`, Firestore
indexes, and security-rule files. Do not run `firebase init` again.

1. Install Node.js 20+ and Java 21+.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Run `npm run firebase:emulators` or `make firebase`.
5. Keep `APP_ENV=development`; synthetic demo headers work only in this mode.

Local development uses the safe fictional project ID `demo-gemmapunks`.
Emulator data never reaches a real Firebase project.

| Service | Local address |
|---|---|
| Emulator UI | <http://127.0.0.1:4000> |
| Authentication | `127.0.0.1:9099` |
| Firestore | `127.0.0.1:8082` |

Firestore uses port `8082` because port `8080` is already used by another local
project on the team lead's machine.

The root `.env.example` contains non-secret emulator defaults. Vite reads that
root file through `apps/web/vite.config.ts`.

## Hosted setup

The shared project is `gemmapunks`. Its web app is `MIZAN Souq Web`.

1. Use the repository's pinned Firebase CLI.
2. Email/password Authentication is enabled.
3. The standard `(default)` Firestore database is in `europe-southwest1`
   (Madrid), with delete protection enabled and paid recovery disabled.
4. Test locally, then deploy Authentication configuration, `firestore.rules`,
   and Firestore indexes.
5. Set all `VITE_FIREBASE_*` values in Vercel.
6. Give FastAPI Application Default Credentials. On non-Google hosting, mount a
   service-account file as a secret and set `GOOGLE_APPLICATION_CREDENTIALS` to
   its path. Never store the JSON credential in this repository.
7. Set custom claims `organization_id` and `role` on seeded demo users.
8. Set `APP_ENV=production`; FastAPI then rejects requests without a valid
   Firebase ID token.

Never commit a service-account JSON file. The browser Firebase configuration is
not an Admin credential; authorization still belongs in Firestore rules and
FastAPI.

## Evidence files on the free plan

Cloud Storage for Firebase requires the Blaze billing plan. It is intentionally
disabled. The deployed FastAPI service accepts a file, validates its type and
size, passes it to extraction, and discards the temporary file afterward.
Firestore stores document metadata and the extraction draft, not the original
binary. Known demo evidence also remains in `packages/demo-data`.

## Data shape and isolation

Private business data lives below `organizations/{organization_id}`. Every
record also contains `organization_id` for audit and server validation. Only
aggregated, privacy-filtered demand is copied to `supplier_opportunities`.

The web client sends evidence to FastAPI and may read scoped Firestore records.
Only FastAPI writes confirmed financial, inventory, procurement, approval,
agent-run, and tool-call records.
