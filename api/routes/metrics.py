from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Donation

router = APIRouter()

@router.get("/metrics/reviewer")
def get_reviewer_metrics(db: Session = Depends(get_db)):
    # shippedYTD: Assuming one donation = one shipment for now
    shipped_ytd = db.query(Donation).count()

    # onTimePct: Static for now
    on_time_pct = 93

    # beneficiaries: Static for now
    beneficiaries = 412

    # fundsByDesignation: Queried from the database
    funds_by_designation = (
        db.query(Donation.designation, func.sum(Donation.amount))
        .group_by(Donation.designation)
        .all()
    )

    funds_by_designation_list = [
        {"name": name, "value": value} for name, value in funds_by_designation
    ]

    # impactStories: Static for now
    impact_stories = [
        {"title": "Maria's School Kit", "blurb": "Back to school with everything she needed.", "photo": ""},
        {"title": "Lopez Sari-Sari", "blurb": "Launched a micro-business with donated goods.", "photo": ""},
    ]

    return {
        "shippedYTD": shipped_ytd,
        "onTimePct": on_time_pct,
        "beneficiaries": beneficiaries,
        "fundsByDesignation": funds_by_designation_list,
        "impactStories": impact_stories,
    }

@router.get("/data-room")
def get_data_room_index():
    # TODO: Replace with actual data from a storage bucket or database
    return [
        {"folder": "governance", "items": ["IRS Letter.pdf", "FDACS Registration.pdf"]},
        {"folder": "policies", "items": ["Donor Privacy Policy.pdf", "Conflict of Interest Policy.pdf"]},
        {"folder": "financials", "items": ["Budget Summary FY2025.pdf"]},
    ]
