# sparkapp84 — Unified Production PR

Adds:
- `api/` (FastAPI on Cloud Run) with **/api/v1** endpoints for receipts, statements, reconciliation
- `web/` (Next.js 14) reviewer portal
- `.github/workflows/` CI deploy for API & Web
- `docker-compose.yml` for local dev (api, web, redis)
- `cloudbuild.yaml` pipeline
- `terraform/` infra skeleton

## Local
docker-compose up --build

## Deploy (GitHub Actions)
Set repo secrets:
- GCP_PROJECT_ID, GCP_REGION, GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_SERVICE_ACCOUNT
- SENDGRID_API_KEY or POSTMARK_TOKEN; EMAIL_PROVIDER; FROM_EMAIL, FROM_NAME
- SPARK_EIN, SPARK_ADDR, SPARK_VERIFY_BASE_URL; NEXT_PUBLIC_API_URL (for web)
