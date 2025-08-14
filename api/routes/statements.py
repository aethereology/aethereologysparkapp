from fastapi import APIRouter, HTTPException, Response, Query, Depends
from sqlalchemy.orm import Session
from services.statements import get_donor_statement, batch_generate_statements
from database import get_db

router = APIRouter()

def _pdf_response(pdf: bytes, filename: str):
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{filename}"'})

@router.get("/donors/{donor_id}/statement/{year}")
def get_statement(donor_id: str, year: int, db: Session = Depends(get_db)):
    donor, pdf = get_donor_statement(db, donor_id, year)
    if not donor:
        raise HTTPException(404, "Donor not found")
    if not pdf:
        raise HTTPException(404, f"No donations found for donor {donor_id} in year {year}")

    rid = f"YEAR-{year}-{donor_id}"
    return _pdf_response(pdf, f"{rid}.pdf")

@router.post("/tasks/year-end-statements")
def batch_statements_route(year: int = Query(..., description="Year for statements"), db: Session = Depends(get_db)):
    return batch_generate_statements(db, year)
