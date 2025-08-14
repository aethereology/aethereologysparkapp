from sqlalchemy.orm import Session
from models import Donor, Donation
from services.receipts import generate_receipt_pdf, find_donor
from services.emailer import send_email
from services.receipts import _designation_breakdown as designation_breakdown
from typing import List

def get_donor_statement(db: Session, donor_id: str, year: int):
    donor = find_donor(db, donor_id)
    if not donor:
        return None, None

    donations = db.query(Donation).filter(
        Donation.donor_id == donor_id,
        Donation.received_at.cast(str).like(f'{year}%')
    ).all()

    if not donations:
        return donor, None

    total = sum(d.amount for d in donations)
    rid = f"YEAR-{year}-{donor_id}"

    pdf = generate_receipt_pdf(
        receipt_id=rid,
        donor_name=donor.primary_contact_name or "Donor",
        donation_amount=total,
        donation_date=f"{year}-12-31",
        designation=f"Annual Statement {year}",
        restricted=False,
        payment_method="Multiple",
        soft_credit_to=None,
        line_items=designation_breakdown_from_donations(donations)
    )
    return donor, pdf

def batch_generate_statements(db: Session, year: int):
    donors = db.query(Donor).all()
    count = 0
    for d in donors:
        donations = db.query(Donation).filter(
            Donation.donor_id == d.donor_id,
            Donation.received_at.cast(str).like(f'{year}%')
        ).all()

        if not donations:
            continue

        total = sum(don.amount for don in donations)
        rid = f"YEAR-{year}-{d.donor_id}"
        pdf = generate_receipt_pdf(
            receipt_id=rid, 
            donor_name=d.primary_contact_name or "Donor",
            donation_amount=total, 
            donation_date=f"{year}-12-31",
            designation=f"Annual Statement {year}", 
            restricted=False, 
            payment_method="Multiple",
            soft_credit_to=None, 
            line_items=designation_breakdown_from_donations(donations)
        )
        if d.email:
            send_email(d.email, f"Your {year} annual giving statement", "<p>Attached is your annual statement.</p>", pdf, f"{rid}.pdf")
        count += 1
    return {"generated": count}

def designation_breakdown_from_donations(donations: List[Donation]):
    from collections import defaultdict
    totals = defaultdict(float)
    for r in donations:
        des = r.designation or "General Fund"
        amt = float(r.amount or 0)
        totals[des] += amt
    return [{"designation": k, "amount": v} for k,v in sorted(totals.items())]
