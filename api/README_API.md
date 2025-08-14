# API (Cloud Run — FastAPI)

Endpoints (under /api/v1):
- GET  /donations/{id}/receipt.pdf
- POST /donations/{id}/receipt
- GET  /donors/{id}/statement/{year}
- POST /tasks/year-end-statements?year=YYYY
- POST /reconciliation/run
- GET  /reconciliation/latest
Root:
- GET /health, GET /metrics
