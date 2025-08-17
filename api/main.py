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
from routes.health import router as basic_health_router
from routes.metrics import router as metrics_router
from prometheus_fastapi_instrumentator import Instrumentator
import sentry_sdk
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

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
import redis
from collections import defaultdict

# Configure Redis client
try:
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    
    redis_client = redis.Redis(
        host=redis_host, 
        port=redis_port, 
        db=0,
        decode_responses=True
    )
    redis_client.ping()
    logger.info(f"Successfully connected to Redis at {redis_host}:{redis_port}")
except redis.exceptions.ConnectionError as e:
    logger.error(f"Could not connect to Redis: {e}")
    redis_client = None

# Rate limiting middleware
async def rate_limit_middleware(request: Request, call_next):
    if not redis_client:
        # Fallback to allow request if Redis is not available
        logger.warning("Redis not available, rate limiting is disabled.")
        return await call_next(request)

    client_ip = request.client.host
    rate_limit_key = f"rate_limit:{client_ip}"
    
    try:
        # Use a pipeline to ensure atomic operations
        pipeline = redis_client.pipeline()
        pipeline.incr(rate_limit_key, 1)
        pipeline.expire(rate_limit_key, 60)
        request_count, _ = pipeline.execute()

        if int(request_count) > 60:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
            
    except redis.exceptions.RedisError as e:
        logger.error(f"Redis error during rate limiting: {e}")
        # Fail open: If Redis fails, allow the request to pass
        return await call_next(request)

    response = await call_next(request)
    return response

app.middleware("http")(rate_limit_middleware)

# CORS middleware - Environment specific configuration
def get_cors_origins():
    """Get CORS origins based on environment"""
    env = os.getenv("ENV", "development")
    
    if env == "development":
        return [
            "http://localhost:3000", 
            "http://localhost:3001", 
            "http://localhost:3002", 
            "http://localhost:3003"
        ]
    elif env == "prod":
        # Production origins from environment variables
        prod_origins = os.getenv("CORS_ORIGINS", "")
        if prod_origins:
            return [origin.strip() for origin in prod_origins.split(",")]
        else:
            # Fallback to secure defaults
            return [
                "https://sparkcreatives.org",
                "https://www.sparkcreatives.org",
                "https://app.sparkcreatives.org"
            ]
    else:
        return []

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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
    if os.getenv("ENV") == "prod":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
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
app.include_router(basic_health_router)

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(receipts_router, tags=["receipts"])
api_v1.include_router(statements_router, tags=["statements"])
api_v1.include_router(reconciliation_router, tags=["reconciliation"])
api_v1.include_router(metrics_router, tags=["metrics"])
app.include_router(api_v1)

# Expose Prometheus metrics at /metrics (guarded by env)
if os.getenv("ENABLE_METRICS", "true").lower() == "true":
    Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

# Sentry initialization (if DSN provided)
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
ENV = os.getenv("ENV", "dev")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=ENV,
        traces_sample_rate=0.2,
        profiles_sample_rate=0.2,
        integrations=[StarletteIntegration(), LoggingIntegration(level=None, event_level=None)],
        release=os.getenv("SENTRY_RELEASE"),
    )
