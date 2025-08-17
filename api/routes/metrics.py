from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Donation, DataRoomDocument
from collections import defaultdict

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
def get_data_room_index(db: Session = Depends(get_db)):
    """
    Retrieves a structured list of data room documents from the database.
    """
    documents = db.query(DataRoomDocument).order_by(DataRoomDocument.folder, DataRoomDocument.file_name).all()
    
    # Group documents by folder
    folder_map = defaultdict(list)
    for doc in documents:
        folder_map[doc.folder].append(doc.file_name)
        
    # Format the output to match the expected structure
    data_room_index = [
        {"folder": folder_name, "items": files}
        for folder_name, files in folder_map.items()
    ]
    
    return data_room_index
