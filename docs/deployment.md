# Deployment

## Web on Vercel

- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` and all `VITE_FIREBASE_*` variables.

## API on Railway

- Configuration: `infra/railway.json`
- Health check: `/health`
- Set `APP_ENV=production`, `APP_CORS_ORIGINS`, `FIREBASE_PROJECT_ID`,
  `AI_PROVIDER`, and `GEMINI_API_KEY`.
- Mount the Firebase service account as a secret file and point
  `GOOGLE_APPLICATION_CREDENTIALS` to it. Prefer workload identity/Application
  Default Credentials if the chosen host supports it.

## Firebase

```bash
npx firebase deploy --only auth,firestore:rules,firestore:indexes
```

Deploy rules before inviting testers. Production data must remain synthetic for
the hackathon. Cloud Storage is intentionally disabled while the project stays
on the no-cost Spark plan.
