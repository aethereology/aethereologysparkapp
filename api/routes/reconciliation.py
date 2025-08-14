from fastapi import APIRouter, Depends
import os
from sqlalchemy.orm import Session
from services.reconciliation import run_reconciliation, latest_report
from database import get_db

router = APIRouter()

@router.post("/reconciliation/run")
def run_recon(db: Session = Depends(get_db)):
    data_dir = os.getenv("DATA_DIR", "/app/data")
    return run_reconciliation(db, data_dir)

@router.get("/reconciliation/latest")
def latest():
    data_dir = os.getenv("DATA_DIR", "/app/data")
    return latest_report(data_dir)
