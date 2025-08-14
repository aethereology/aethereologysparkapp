"""Test configuration and fixtures."""
import os
import pytest
import asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from unittest.mock import Mock, patch
import logging

# Disable logging during tests
logging.disable(logging.CRITICAL)

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def test_env():
    """Set up test environment variables."""
    with patch.dict(os.environ, {
        'ENV': 'test',
        'SPARK_ORG_NAME': 'Test Organization',
        'SPARK_EIN': '12-3456789',
        'SPARK_ADDR': '123 Test St, Test City, ST 12345',
        'EMAIL_PROVIDER': 'test',
        'SENDGRID_API_KEY': 'test_key',
        'POSTMARK_API_TOKEN': 'test_token'
    }):
        yield

@pytest.fixture
def app(test_env):
    """Create test app instance."""
    from main import app
    return app

@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)

@pytest.fixture
async def async_client(app):
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_donation_data():
    """Mock donation data for testing."""
    return {
        "donation_id": "test_donation_123",
        "donor_id": "donor_456",
        "amount": "100.00",
        "received_at": "2024-01-15T10:30:00",
        "designation": "General Fund",
        "restricted": "no",
        "method": "square",
        "receipt_id": "RCPT-123",
        "soft_credit_to": None
    }

@pytest.fixture
def mock_donor_data():
    """Mock donor data for testing."""
    return {
        "donor_id": "donor_456",
        "primary_contact_name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "555-123-4567"
    }

@pytest.fixture
def mock_pdf_data():
    """Mock PDF data for testing."""
    return b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF"

@pytest.fixture(autouse=True)
def mock_external_services():
    """Mock external services for all tests."""
    with patch('services.emailer.send_email') as mock_send, \
         patch('services.receipts.find_donation') as mock_find_donation, \
         patch('services.receipts.find_donor') as mock_find_donor, \
         patch('services.receipts.generate_receipt_pdf') as mock_pdf:
        
        # Configure mocks
        mock_send.return_value = True
        mock_find_donation.return_value = None
        mock_find_donor.return_value = None
        mock_pdf.return_value = b"%PDF-1.4\ntest"
        
        yield {
            'send_email': mock_send,
            'find_donation': mock_find_donation,
            'find_donor': mock_find_donor,
            'generate_receipt_pdf': mock_pdf
        }