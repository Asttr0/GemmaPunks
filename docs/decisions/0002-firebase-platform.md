# ADR 0002: Use Firebase instead of Supabase

Status: accepted — July 23, 2026

## Decision

Use Firebase Authentication and Cloud Firestore. Remove PostgreSQL, SQLAlchemy,
Alembic, and Supabase from the hackathon architecture.

Cloud Storage for Firebase requires the Blaze billing plan as of February 2026.
The hackathon stays on the no-cost Spark plan: FastAPI validates an uploaded
receipt or audio file, passes it to the extraction flow, and discards the
temporary file after processing. Firestore stores only document metadata,
status, and validated drafts. Persistent cloud evidence storage is deferred
until the team explicitly approves billing.

## Security model

The web sends a Firebase ID token to FastAPI. FastAPI verifies the token with
the Admin SDK and derives user identity, role, and organization from verified
claims. Production never trusts organization headers supplied by the client.

Firestore rules deny by default. Organization-scoped client reads are allowed;
confirmed business writes are server-only.

## Local development

Use the Firebase Authentication and Firestore emulators so development and CI
do not depend on a shared production project.
