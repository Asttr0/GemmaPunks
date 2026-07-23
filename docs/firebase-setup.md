# Firebase setup

MIZAN Souq uses Firebase Authentication, Cloud Firestore, and Cloud Storage.
FastAPI uses the Firebase Admin SDK as the only authoritative business writer.

## Local setup

1. Copy `.env.example` to `.env`.
2. Run `npx firebase-tools emulators:start`.
3. Keep `APP_ENV=development`; synthetic demo headers work only in this mode.

## Hosted setup

1. Create a Firebase project and web app.
2. Enable the authentication providers used by the demo.
3. Create Firestore and Storage in the selected project.
4. Deploy `firestore.rules`, `storage.rules`, and Firestore indexes.
5. Set all `VITE_FIREBASE_*` values in Vercel.
6. Give FastAPI Application Default Credentials. On non-Google hosting, mount a
   service-account file as a secret and set `GOOGLE_APPLICATION_CREDENTIALS` to
   its path. Never store the JSON credential in this repository.
7. Set custom claims `organization_id` and `role` on seeded demo users.
8. Set `APP_ENV=production`; FastAPI then rejects requests without a valid
   Firebase ID token.

## Data shape and isolation

Private business data lives below `organizations/{organization_id}`. Every
record also contains `organization_id` for audit and server validation. Only
aggregated, privacy-filtered demand is copied to `supplier_opportunities`.

The web client may upload evidence to its organization path subject to Storage
Rules. It may read scoped records. Only FastAPI writes confirmed financial,
inventory, procurement, approval, agent-run, and tool-call records.

