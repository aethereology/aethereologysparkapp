from fastapi import APIRouter, HTTPException
import os
import time
import logging
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health():
    """Comprehensive health check endpoint."""
    logger = logging.getLogger(__name__)
    
    try:
        checks = {
            "timestamp": datetime.utcnow().isoformat(),
            "env": os.getenv("ENV", "local"),
            "email_provider": os.getenv("EMAIL_PROVIDER", "not-set"),
            "logo_exists": os.path.exists(os.getenv("SPARK_LOGO_PATH", "/app/assets/logo.png")),
            "required_env_vars": {
                "SPARK_ORG_NAME": bool(os.getenv("SPARK_ORG_NAME")),
                "SPARK_EIN": bool(os.getenv("SPARK_EIN")),
                "SPARK_ADDR": bool(os.getenv("SPARK_ADDR")),
            }
        }
        
        # Check if all critical environment variables are set
        all_healthy = all([
            checks["logo_exists"],
            checks["required_env_vars"]["SPARK_ORG_NAME"],
            checks["email_provider"] != "not-set"
        ])
        
        status = "healthy" if all_healthy else "degraded"
        
        logger.info(f"Health check performed: {status}")
        
        return {
            "status": status,
            "version": "1.0.0",
            "checks": checks
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

START = time.time()
COUNTERS = {"receipts_generated": 0, "emails_sent": 0}

@router.get("/metrics")
def metrics():
    """Application metrics endpoint."""
    uptime = time.time() - START
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": int(uptime),
        "uptime_human": f"{int(uptime // 3600)}h {int((uptime % 3600) // 60)}m {int(uptime % 60)}s",
        **COUNTERS
    }
