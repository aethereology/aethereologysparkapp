import logging
import os
from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
import time
from collections import defaultdict
from routes.receipts import router as receipts_router
from routes.statements import router as statements_router
from routes.reconciliation import router as reconciliation_router
from routes.health_metrics import router as health_router
from routes.metrics import router as metrics_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Set third-party loggers to WARNING level
logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
logging.getLogger('httpx').setLevel(logging.WARNING)

app = FastAPI(
    title="SparkCreatives Cloud Run API",
    description="Donation management and transparency API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENV", "development") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENV", "development") == "development" else None,
)

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)

# Rate limiting middleware
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    current_time = time.time()
    
    # Clean old entries (older than 1 minute)
    rate_limit_storage[client_ip] = [
        timestamp for timestamp in rate_limit_storage[client_ip]
        if current_time - timestamp < 60
    ]
    
    # Check if rate limit exceeded (60 requests per minute)
    if len(rate_limit_storage[client_ip]) >= 60:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Add current request
    rate_limit_storage[client_ip].append(current_time)
    
    response = await call_next(request)
    return response

app.middleware("http")(rate_limit_middleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    return response

# Add startup event
@app.on_event("startup")
async def startup_event():
    logger.info("SparkCreatives API starting up")
    logger.info(f"Environment: {os.getenv('ENV', 'development')}")
    logger.info(f"Email provider: {os.getenv('EMAIL_PROVIDER', 'sendgrid')}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("SparkCreatives API shutting down")

app.include_router(health_router, tags=["health"])

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(receipts_router, tags=["receipts"])
api_v1.include_router(statements_router, tags=["statements"])
api_v1.include_router(reconciliation_router, tags=["reconciliation"])
api_v1.include_router(metrics_router, tags=["metrics"])
app.include_router(api_v1)
