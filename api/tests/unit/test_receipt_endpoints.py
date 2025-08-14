"""Unit tests for receipt endpoints."""
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException


@pytest.mark.unit
def test_get_receipt_success(client, test_env, mock_donation_data, mock_donor_data, mock_pdf_data, mock_external_services):
    """Test successful PDF receipt generation."""
    # Configure mocks
    mock_external_services['find_donation'].return_value = mock_donation_data
    mock_external_services['find_donor'].return_value = mock_donor_data
    mock_external_services['generate_receipt_pdf'].return_value = mock_pdf_data
    
    response = client.get("/api/v1/donations/test_donation_123/receipt.pdf")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "inline; filename=" in response.headers["content-disposition"]
    assert response.content == mock_pdf_data


@pytest.mark.unit
def test_get_receipt_donation_not_found(client, test_env, mock_external_services):
    """Test receipt generation when donation is not found."""
    mock_external_services['find_donation'].return_value = None
    
    response = client.get("/api/v1/donations/nonexistent/receipt.pdf")
    
    assert response.status_code == 404
    assert "Donation not found" in response.json()["detail"]


@pytest.mark.unit
def test_get_receipt_invalid_donation_id(client, test_env):
    """Test receipt generation with invalid donation ID format."""
    response = client.get("/api/v1/donations/invalid@id!/receipt.pdf")
    
    assert response.status_code == 422  # Validation error


@pytest.mark.unit
def test_get_receipt_pdf_generation_error(client, test_env, mock_donation_data, mock_donor_data, mock_external_services):
    """Test receipt generation when PDF generation fails."""
    mock_external_services['find_donation'].return_value = mock_donation_data
    mock_external_services['find_donor'].return_value = mock_donor_data
    mock_external_services['generate_receipt_pdf'].side_effect = Exception("PDF generation failed")
    
    response = client.get("/api/v1/donations/test_donation_123/receipt.pdf")
    
    assert response.status_code == 500
    assert "Error generating receipt" in response.json()["detail"]


@pytest.mark.unit
def test_get_receipt_with_missing_donor(client, test_env, mock_donation_data, mock_pdf_data, mock_external_services):
    """Test receipt generation when donor is not found."""
    mock_external_services['find_donation'].return_value = mock_donation_data
    mock_external_services['find_donor'].return_value = None  # No donor found
    mock_external_services['generate_receipt_pdf'].return_value = mock_pdf_data
    
    response = client.get("/api/v1/donations/test_donation_123/receipt.pdf")
    
    assert response.status_code == 200
    # Should use default donor name "Donor"
    mock_external_services['generate_receipt_pdf'].assert_called_once()
    args = mock_external_services['generate_receipt_pdf'].call_args[1]
    assert args['donor_name'] == "Donor"


@pytest.mark.unit
def test_send_receipt_success(client, test_env, mock_donation_data, mock_donor_data, mock_pdf_data, mock_external_services):
    """Test successful email receipt sending."""
    mock_external_services['find_donation'].return_value = mock_donation_data
    mock_external_services['find_donor'].return_value = mock_donor_data
    mock_external_services['generate_receipt_pdf'].return_value = mock_pdf_data
    mock_external_services['send_email'].return_value = True
    
    response = client.post("/api/v1/donations/test_donation_123/receipt")
    
    assert response.status_code == 200
    data = response.json()
    assert data["sent"] is True
    assert data["recipient"] == "john.doe@example.com"


@pytest.mark.unit
def test_send_receipt_no_email(client, test_env, mock_donation_data, mock_external_services):
    """Test email receipt sending when no email address is available."""
    mock_donation_data_no_email = mock_donation_data.copy()
    mock_donor_no_email = {"primary_contact_name": "John Doe", "email": ""}
    
    mock_external_services['find_donation'].return_value = mock_donation_data_no_email
    mock_external_services['find_donor'].return_value = mock_donor_no_email
    
    response = client.post("/api/v1/donations/test_donation_123/receipt")
    
    assert response.status_code == 400
    assert "No donor email on file" in response.json()["detail"]


@pytest.mark.unit
def test_send_receipt_email_failure(client, test_env, mock_donation_data, mock_donor_data, mock_pdf_data, mock_external_services):
    """Test email receipt sending when email service fails."""
    mock_external_services['find_donation'].return_value = mock_donation_data
    mock_external_services['find_donor'].return_value = mock_donor_data
    mock_external_services['generate_receipt_pdf'].return_value = mock_pdf_data
    mock_external_services['send_email'].return_value = False  # Email failed
    
    response = client.post("/api/v1/donations/test_donation_123/receipt")
    
    assert response.status_code == 200
    data = response.json()
    assert data["sent"] is False
    assert data["recipient"] == "john.doe@example.com"


@pytest.mark.unit
def test_send_receipt_donation_not_found(client, test_env, mock_external_services):
    """Test email receipt sending when donation is not found."""
    mock_external_services['find_donation'].return_value = None
    
    response = client.post("/api/v1/donations/nonexistent/receipt")
    
    assert response.status_code == 404
    assert "Donation not found" in response.json()["detail"]


@pytest.mark.unit
def test_amount_validation_invalid_amount(client, test_env, mock_donor_data, mock_pdf_data, mock_external_services):
    """Test handling of invalid donation amounts."""
    invalid_donation = {
        "donation_id": "test_donation_123",
        "donor_id": "donor_456",
        "amount": "invalid",  # Invalid amount
        "received_at": "2024-01-15T10:30:00",
        "designation": "General Fund"
    }
    
    mock_external_services['find_donation'].return_value = invalid_donation
    mock_external_services['find_donor'].return_value = mock_donor_data
    mock_external_services['generate_receipt_pdf'].return_value = mock_pdf_data
    
    response = client.get("/api/v1/donations/test_donation_123/receipt.pdf")
    
    assert response.status_code == 200
    # Should use 0.0 as default amount when conversion fails
    mock_external_services['generate_receipt_pdf'].assert_called_once()
    args = mock_external_services['generate_receipt_pdf'].call_args[1]
    assert args['donation_amount'] == 0.0


@pytest.mark.unit
def test_donation_id_validation():
    """Test donation ID validation function."""
    from routes.receipts import validate_donation_id
    
    # Valid IDs
    assert validate_donation_id("ABC123") == "ABC123"
    assert validate_donation_id("test-donation_123") == "test-donation_123"
    
    # Invalid IDs should raise HTTPException
    with pytest.raises(HTTPException) as exc:
        validate_donation_id("invalid@id!")
    assert exc.value.status_code == 400