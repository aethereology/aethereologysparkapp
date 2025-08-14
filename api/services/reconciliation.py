import os, json
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List
from sqlalchemy.orm import Session
from models import Donation

def dec(v) -> Decimal:
    # Check if v is already a Decimal
    if isinstance(v, Decimal):
        return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    # If v is a float, convert it to a string first to avoid precision issues
    if isinstance(v, float):
        v = str(v)
    return Decimal(v or "0").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def run_reconciliation(db: Session, data_dir: str) -> Dict:
    donations = db.query(Donation).all()

    # For now, we'll ignore internal_donations.csv and just use the donations from the database
    internal = []

    def rollup(rows: List[Donation]):
        by_des, total = defaultdict(Decimal), Decimal("0.00")
        for r in rows:
            des = r.designation or "General Fund"
            amt = dec(r.amount)
            by_des[des] += amt
            total += amt
        return {"total": f"{total:.2f}", "by_designation": {k: f"{v:.2f}" for k,v in sorted(by_des.items())}}

    res = {"square": rollup(donations), "internal": rollup(internal)}
    try:
        res["variance_total"] = f'{Decimal(res["square"]["total"]) - Decimal(res["internal"]["total"]):.2f}'
    except Exception:
        res["variance_total"] = None
    
    out_path = os.path.join(data_dir, "reconciliation_report.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2)
    return res

def latest_report(data_dir: str):
    try:
        with open(os.path.join(data_dir, "reconciliation_report.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"status":"no report"}
