import logging
import re
from fastapi import APIRouter, HTTPException, Response, Path, Depends
from sqlalchemy.orm import Session
from services.receipts import find_donation, find_donor, generate_receipt_pdf, line_items_from_row
from services.emailer import send_email
from database import get_db
from models import Donor

logger = logging.getLogger(__name__)

# Input validation patterns
DONATION_ID_PATTERN = re.compile(r'^[A-Za-z0-9_-]{1,50}$_)

def validate_donation_id(donation_id: str) -> str:
    """Validate donation ID format to prevent injection attacks.""" 
    if not DONATION_ID_PATTERN.match(donation_id):
        raise HTTPException(400, "Invalid donation ID format")
    return donation_id

router = APIRouter()

def _pdf_response(pdf: bytes, filename: str):
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{filename}"'})

@router.get("/donations/{donation_id}/receipt.pdf")
def get_receipt(
    donation_id: str = Path(..., description="Unique donation identifier", regex=r'^[A-Za-z0-9_-]{1,50}$_),
    db: Session = Depends(get_db)
):
    """Generate and return a PDF receipt for a donation.""" 
    try:
        dn = find_donation(db, donation_id)
        if not dn:
            logger.warning(f"Donation not found: {donation_id}")
            raise HTTPException(404, "Donation not found")
        
        donor = find_donor(db, dn.donor_id) or Donor(primary_contact_name="Donor", email="")
        rid = dn.receipt_id or f"RCPT-{donation_id}"
        
        try:
            amount = float(dn.amount or 0)
            if amount <= 0:
                logger.warning(f"Invalid donation amount: {amount} for donation {donation_id}")
        except (ValueError, TypeError) as e:
            logger.error(f"Error converting donation amount for {donation_id}: {str(e)}")
            amount = 0.0
        
        pdf = generate_receipt_pdf(
            receipt_id=rid,
            donor_name=donor.primary_contact_name,
            donation_amount=amount,
            donation_date=dn.received_at.strftime("%Y-%m-%d") if dn.received_at else "",
            designation=dn.designation or "General Fund",
            restricted=dn.restricted,
            payment_method=(dn.method or "square").title(),
            soft_credit_to=dn.soft_credit_to,
            line_items=line_items_from_row(dn)
        )
        
        logger.info(f"Generated receipt PDF for donation {donation_id}")
        return _pdf_response(pdf, f"{rid}.pdf")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating receipt for donation {donation_id}: {str(e)}")
        raise HTTPException(500, "Error generating receipt")

@router.post("/donations/{donation_id}/receipt")
def send_receipt(
    donation_id: str = Path(..., description="Unique donation identifier", regex=r'^[A-Za-z0-9_-]{1,50}$_),
    db: Session = Depends(get_db)
):
    """Send a receipt via email for a donation.""" 
    try:
        dn = find_donation(db, donation_id)
        if not dn:
            logger.warning(f"Donation not found for email send: {donation_id}")
            raise HTTPException(404, "Donation not found")
        
        donor = find_donor(db, dn.donor_id) or Donor(primary_contact_name="Donor", email="")
        donor_email = donor.email.strip() if donor.email else ""
        if not donor_email:
            logger.warning(f"No email address for donation {donation_id}")
            raise HTTPException(400, "No donor email on file")

        rid = dn.receipt_id or f"RCPT-{donation_id}"
        
        try:
            amount = float(dn.amount or 0)
        except (ValueError, TypeError) as e:
            logger.error(f"Error converting donation amount for email {donation_id}: {str(e)}")
            amount = 0.0
        
        pdf = generate_receipt_pdf(
            receipt_id=rid,
            donor_name=donor.primary_contact_name,
            donation_amount=amount,
            donation_date=dn.received_at.strftime("%Y-%m-%d") if dn.received_at else "",
            designation=dn.designation or "General Fund",
            restricted=dn.restricted,
            payment_method=(dn.method or "square").title(),
            soft_credit_to=dn.soft_credit_to,
            line_items=line_items_from_row(dn)
        )
        
        email_html = f""" 
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Thank you for your generous donation!</h2>
            <p>Dear {donor.primary_contact_name},</p>
            <p>Thank you for your gift of ${amount:.2f} to {dn.designation or "General Fund"}.</p>
            <p>Your donation receipt is attached to this email for your tax records.</p>
            <p>With gratitude,<br>The SparkCreatives Team</p>
        </body>
        </html>
        """ 
        
        ok = send_email(donor_email, "Your donation receipt", email_html, pdf, f"{rid}.pdf")
        
        if ok:
            logger.info(f"Receipt email sent successfully for donation {donation_id} to {donor_email}")
        else:
            logger.error(f"Failed to send receipt email for donation {donation_id} to {donor_email}")
        
        return {"sent": bool(ok), "recipient": donor_email}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending receipt email for donation {donation_id}: {str(e)}")
        raise HTTPException(500, "Error sending receipt email")
