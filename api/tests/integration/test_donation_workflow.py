"""Integration tests for complete donation workflow."""
import pytest
from unittest.mock import patch, MagicMock
import asyncio
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.asyncio
async def test_complete_donation_workflow(async_client, test_env, mock_external_services):
    """Test complete donation workflow: PDF generation → Email sending."""
    # Mock complete donation and donor data
    donation_data = {
        "donation_id": "DON-2024-001",
        "donor_id": "DONOR-001",
        "amount": "150.00",
        "received_at": "2024-01-15T14:30:00",
        "designation": "Education Fund",
        "restricted": "yes",
        "method": "stripe",
        "receipt_id": "RCPT-2024-001"
    }
    
    donor_data = {
        "donor_id": "DONOR-001",
        "primary_contact_name": "Jane Smith",
        "email": "jane.smith@example.com",
        "phone": "555-987-6543"
    }
    
    pdf_data = b"%PDF-1.4\n<<test receipt content>>\n%%EOF"
    
    # Configure mocks for both steps
    mock_external_services['find_donation'].return_value = donation_data
    mock_external_services['find_donor'].return_value = donor_data
    mock_external_services['generate_receipt_pdf'].return_value = pdf_data
    mock_external_services['send_email'].return_value = True
    
    # Step 1: Generate PDF receipt
    pdf_response = await async_client.get("/api/v1/donations/DON-2024-001/receipt.pdf")
    
    assert pdf_response.status_code == 200
    assert pdf_response.headers["content-type"] == "application/pdf"
    assert pdf_response.content == pdf_data
    
    # Verify PDF generation was called with correct parameters
    mock_external_services['generate_receipt_pdf'].assert_called_with(
        receipt_id="RCPT-2024-001",
        donor_name="Jane Smith",
        donation_amount=150.0,
        donation_date="2024-01-15",
        designation="Education Fund",
        restricted=True,
        payment_method="Stripe",
        soft_credit_to=None,
        line_items=mock_external_services['generate_receipt_pdf'].call_args[1]['line_items']
    )
    
    # Step 2: Send email receipt  
    email_response = await async_client.post("/api/v1/donations/DON-2024-001/receipt")
    
    assert email_response.status_code == 200
    email_data = email_response.json()
    assert email_data["sent"] is True
    assert email_data["recipient"] == "jane.smith@example.com"
    
    # Verify email was sent with correct parameters
    mock_external_services['send_email'].assert_called_once()
    email_args = mock_external_services['send_email'].call_args[0]
    assert email_args[0] == "jane.smith@example.com"  # recipient
    assert email_args[1] == "Your donation receipt"   # subject
    assert "Jane Smith" in email_args[2]              # HTML content contains donor name
    assert "$150.00" in email_args[2]                 # HTML content contains amount
    assert "Education Fund" in email_args[2]          # HTML content contains designation
    assert email_args[3] == pdf_data                  # PDF attachment
    assert email_args[4] == "RCPT-2024-001.pdf"       # Filename


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_with_missing_data(async_client, test_env, mock_external_services):
    """Test workflow handles missing data gracefully."""
    # Donation with minimal data
    minimal_donation = {
        "donation_id": "DON-MIN-001", 
        "donor_id": "",  # No donor ID
        "amount": "",    # No amount
        "received_at": "",
        "designation": "",
        "method": ""
    }
    
    pdf_data = b"%PDF-1.4\nminimal receipt\n%%EOF"
    
    mock_external_services['find_donation'].return_value = minimal_donation
    mock_external_services['find_donor'].return_value = None  # No donor found
    mock_external_services['generate_receipt_pdf'].return_value = pdf_data
    
    # Should still generate PDF with defaults
    response = await async_client.get("/api/v1/donations/DON-MIN-001/receipt.pdf")
    
    assert response.status_code == 200
    
    # Verify defaults were used
    pdf_call = mock_external_services['generate_receipt_pdf'].call_args[1]
    assert pdf_call['donor_name'] == "Donor"           # Default name
    assert pdf_call['donation_amount'] == 0.0         # Default amount
    assert pdf_call['designation'] == "General Fund"  # Default designation
    assert pdf_call['payment_method'] == ""           # Empty method becomes title-cased


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_error_handling(async_client, test_env, mock_external_services):
    """Test workflow error handling and recovery."""
    donation_data = {
        "donation_id": "DON-ERROR-001",
        "donor_id": "DONOR-001",
        "amount": "100.00"
    }
    
    donor_data = {
        "primary_contact_name": "Error Test",
        "email": "test@example.com"
    }
    
    mock_external_services['find_donation'].return_value = donation_data
    mock_external_services['find_donor'].return_value = donor_data
    
    # Test PDF generation failure
    mock_external_services['generate_receipt_pdf'].side_effect = Exception("PDF service down")
    
    response = await async_client.get("/api/v1/donations/DON-ERROR-001/receipt.pdf")
    assert response.status_code == 500
    assert "Error generating receipt" in response.json()["detail"]
    
    # Reset PDF generation, test email failure
    mock_external_services['generate_receipt_pdf'].side_effect = None
    mock_external_services['generate_receipt_pdf'].return_value = b"test pdf"
    mock_external_services['send_email'].return_value = False  # Email fails
    
    email_response = await async_client.post("/api/v1/donations/DON-ERROR-001/receipt")
    assert email_response.status_code == 200
    email_data = email_response.json()
    assert email_data["sent"] is False  # Should indicate failure
    assert email_data["recipient"] == "test@example.com"


@pytest.mark.integration
@pytest.mark.asyncio  
async def test_concurrent_requests(async_client, test_env, mock_external_services):
    """Test handling of concurrent requests to same donation."""
    donation_data = {
        "donation_id": "DON-CONCURRENT-001",
        "donor_id": "DONOR-001", 
        "amount": "75.50",
        "received_at": "2024-01-15T10:00:00"
    }
    
    donor_data = {
        "primary_contact_name": "Concurrent Test",
        "email": "concurrent@example.com"
    }
    
    mock_external_services['find_donation'].return_value = donation_data
    mock_external_services['find_donor'].return_value = donor_data
    mock_external_services['generate_receipt_pdf'].return_value = b"concurrent pdf"
    mock_external_services['send_email'].return_value = True
    
    # Make 3 concurrent requests for PDF
    pdf_tasks = [
        async_client.get("/api/v1/donations/DON-CONCURRENT-001/receipt.pdf") 
        for _ in range(3)
    ]
    
    pdf_responses = await asyncio.gather(*pdf_tasks)
    
    # All should succeed
    for response in pdf_responses:
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
    
    # Make 3 concurrent requests for email
    email_tasks = [
        async_client.post("/api/v1/donations/DON-CONCURRENT-001/receipt")
        for _ in range(3) 
    ]
    
    email_responses = await asyncio.gather(*email_tasks)
    
    # All should succeed
    for response in email_responses:
        assert response.status_code == 200
        data = response.json()
        assert data["sent"] is True
        assert data["recipient"] == "concurrent@example.com"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_health_check_integration(async_client, test_env):
    """Test health check integration with environment."""
    with patch('os.path.exists') as mock_exists, \
         patch.dict('os.environ', {
             'SPARK_ORG_NAME': 'Integration Test Org',
             'SPARK_EIN': '12-3456789', 
             'EMAIL_PROVIDER': 'sendgrid'
         }):
        
        mock_exists.return_value = True
        
        response = await async_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["checks"]["env"] == "test"
        assert data["checks"]["email_provider"] == "sendgrid"
        assert data["checks"]["required_env_vars"]["SPARK_ORG_NAME"] is True
        
        # Test metrics endpoint
        metrics_response = await async_client.get("/metrics")
        assert metrics_response.status_code == 200
        
        metrics_data = metrics_response.json()
        assert isinstance(metrics_data["uptime_seconds"], int)
        assert "receipts_generated" in metrics_data
        assert "emails_sent" in metrics_data