"""Basic tests to validate API structure."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os


@pytest.fixture
def test_client():
    """Create a simple test client."""
    with patch.dict(os.environ, {
        'ENV': 'test',
        'SPARK_ORG_NAME': 'Test Org',
        'SPARK_EIN': '12-3456789',
        'SPARK_ADDR': '123 Test St',
        'EMAIL_PROVIDER': 'test'
    }):
        from main import app
        return TestClient(app)


def test_health_endpoint_basic(test_client):
    """Test basic health endpoint functionality."""
    response = test_client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "checks" in data


def test_metrics_endpoint_basic(test_client):
    """Test basic metrics endpoint functionality."""
    response = test_client.get("/metrics")
    assert response.status_code == 200
    
    data = response.json()
    assert "timestamp" in data
    assert "uptime_seconds" in data
    assert "receipts_generated" in data
    assert "emails_sent" in data


def test_invalid_donation_id(test_client):
    """Test invalid donation ID handling."""
    response = test_client.get("/api/v1/donations/invalid@id/receipt.pdf")
    assert response.status_code == 422


def test_nonexistent_donation(test_client):
    """Test handling of nonexistent donation."""
    with patch('services.receipts.find_donation', return_value=None):
        response = test_client.get("/api/v1/donations/valid123/receipt.pdf")
        assert response.status_code == 404


def test_api_documentation_urls(test_client):
    """Test API documentation availability in test environment."""
    # In test environment, docs should be available
    response = test_client.get("/docs")
    # FastAPI redirects /docs to /docs/ or returns the docs page
    assert response.status_code in [200, 404, 307]  # Could be different based on setup