import os
import base64
import json
import requests
import logging
from typing import Optional

PROVIDER = os.getenv("EMAIL_PROVIDER", "sendgrid")
logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html: str, attachment: Optional[bytes] = None, filename: str = "attachment.pdf") -> bool:
    """Send email via SendGrid or Postmark.
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        html: HTML email content
        attachment: Optional PDF attachment as bytes
        filename: Attachment filename
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if PROVIDER == "sendgrid":
        key = os.getenv("SENDGRID_API_KEY")
        if not key:
            logger.warning("SendGrid API key missing, skipping email send")
            return False
        payload = {
            "personalizations":[{"to":[{"email": to_email}]}],
            "from":{"email": os.getenv("FROM_EMAIL","noreply@sparkcreatives.org"), "name": os.getenv("FROM_NAME","SparkCreatives")},
            "subject": subject,
            "content":[{"type":"text/html","value": html}],
        }
        if attachment:
            payload["attachments"] = [{
                "content": base64.b64encode(attachment).decode("utf-8"),
                "filename": filename,
                "type":"application/pdf"
            }]
        try:
            r = requests.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                data=json.dumps(payload),
                timeout=30
            )
            if r.status_code in (200, 202):
                logger.info(f"Email sent successfully via SendGrid to {to_email}")
                return True
            else:
                logger.error(f"SendGrid API error: {r.status_code} - {r.text}")
                return False
        except requests.RequestException as e:
            logger.error(f"SendGrid request failed: {str(e)}")
            return False
    else:
        token = os.getenv("POSTMARK_TOKEN")
        if not token:
            logger.warning("Postmark token missing, skipping email send")
            return False
        payload = {
            "From": os.getenv("FROM_EMAIL","noreply@sparkcreatives.org"),
            "To": to_email,
            "Subject": subject,
            "HtmlBody": html,
        }
        if attachment:
            payload["Attachments"] = [{
                "Name": filename,
                "Content": base64.b64encode(attachment).decode("utf-8"),
                "ContentType":"application/pdf"
            }]
        try:
            r = requests.post(
                "https://api.postmarkapp.com/email",
                headers={"X-Postmark-Server-Token": token, "Content-Type": "application/json"},
                data=json.dumps(payload),
                timeout=30
            )
            if r.status_code in (200, 201):
                logger.info(f"Email sent successfully via Postmark to {to_email}")
                return True
            else:
                logger.error(f"Postmark API error: {r.status_code} - {r.text}")
                return False
        except requests.RequestException as e:
            logger.error(f"Postmark request failed: {str(e)}")
            return False
