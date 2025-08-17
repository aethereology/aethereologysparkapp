
from sqlalchemy import create_engine, Column, String, Float, DateTime, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Donor(Base):
    __tablename__ = 'donors'

    donor_id = Column(String, primary_key=True)
    primary_contact_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    street_address = Column(String)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    country = Column(String)
    donor_type = Column(String)
    first_donation_date = Column(Date)

    donations = relationship("Donation", back_populates="donor")

class Donation(Base):
    __tablename__ = 'donations'

    donation_id = Column(String, primary_key=True)
    donor_id = Column(String, ForeignKey('donors.donor_id'), nullable=False)
    receipt_id = Column(String, nullable=False)
    received_at = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    designation = Column(String, nullable=False)
    restricted = Column(Boolean, default=False)
    method = Column(String)
    source = Column(String)
    soft_credit_to = Column(String)
    designation_breakdown = Column(String)

    donor = relationship("Donor", back_populates="donations")

class DataRoomDocument(Base):
    __tablename__ = 'data_room_documents'

    id = Column(String, primary_key=True)
    folder = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    # In a real scenario, this would be a URL to a cloud storage bucket
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, server_default='now()')
