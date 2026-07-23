# ADR 0002: Use Firebase instead of Supabase

Status: accepted — July 23, 2026

## Decision

Use Firebase Authentication, Cloud Firestore, and Cloud Storage. Remove
PostgreSQL, SQLAlchemy, Alembic, and Supabase from the hackathon architecture.

## Security model

The web sends a Firebase ID token to FastAPI. FastAPI verifies the token with
the Admin SDK and derives user identity, role, and organization from verified
claims. Production never trusts organization headers supplied by the client.

Firestore and Storage rules deny by default. Organization-scoped client reads
and evidence uploads are allowed; confirmed business writes are server-only.

## Local development

Use the Firebase Local Emulator Suite so development and CI do not depend on a
shared production project.

