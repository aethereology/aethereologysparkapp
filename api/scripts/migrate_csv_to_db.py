import csv
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# It's better to use absolute imports when dealing with scripts
# in a subfolder. We need to add the project root to the python path.
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import Base, Donor, Donation
from database import DATABASE_URL

def migrate():
    print("Starting database migration...")
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Migrate Donors
        with open('data/donors.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Check if donor already exists
                exists = db.query(Donor).filter_by(donor_id=row['donor_id']).first()
                if exists:
                    print(f"Donor {row['donor_id']} already exists, skipping.")
                    continue

                donor = Donor(
                    donor_id=row['donor_id'],
                    primary_contact_name=row['primary_contact_name'],
                    email=row['email'],
                    phone=row.get('phone'),
                    street_address=row.get('street_address'),
                    city=row.get('city'),
                    state=row.get('state'),
                    zip_code=row.get('zip_code'),
                    country=row.get('country'),
                    donor_type=row.get('donor_type'),
                    first_donation_date=datetime.strptime(row['first_donation_date'], '%Y-%m-%d').date() if row.get('first_donation_date') else None
                )
                db.add(donor)
        db.commit()
        print("Donors migrated successfully.")

        # Migrate Donations
        with open('data/donations.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Check if donation already exists
                exists = db.query(Donation).filter_by(donation_id=row['donation_id']).first()
                if exists:
                    print(f"Donation {row['donation_id']} already exists, skipping.")
                    continue

                donation = Donation(
                    donation_id=row['donation_id'],
                    donor_id=row['donor_id'],
                    receipt_id=row['receipt_id'],
                    received_at=datetime.fromisoformat(row['received_at'].replace('Z', '+00:00')) if row.get('received_at') else None,
                    amount=float(row['amount']),
                    designation=row['designation'],
                    restricted=row['restricted'].lower() == 'yes',
                    method=row.get('method'),
                    source=row.get('source'),
                    soft_credit_to=row.get('soft_credit_to'),
                    designation_breakdown=row.get('designation_breakdown')
                )
                db.add(donation)
        db.commit()
        print("Donations migrated successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    load_dotenv()
    migrate()
