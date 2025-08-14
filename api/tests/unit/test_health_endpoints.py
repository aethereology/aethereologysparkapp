"""Unit tests for health and metrics endpoints."""
import pytest
from unittest.mock import patch, MagicMock
import os
from datetime import datetime


@pytest.mark.unit
def test_health_endpoint_healthy(client, test_env):
    """Test health endpoint returns healthy status when all checks pass."""
    with patch('os.path.exists') as mock_exists, \
         patch.dict(os.environ, {
             'SPARK_ORG_NAME': 'Test Org',
             'EMAIL_PROVIDER': 'sendgrid'
         }):
        
        mock_exists.return_value = True
        
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert "checks" in data
        
        checks = data["checks"]
        assert "timestamp" in checks
        assert checks["env"] == "test"
        assert checks["email_provider"] == "sendgrid"
        assert checks["logo_exists"] is True
        assert checks["required_env_vars"]["SPARK_ORG_NAME"] is True


@pytest.mark.unit
def test_health_endpoint_degraded(client, test_env):
    """Test health endpoint returns degraded status when checks fail."""
    with patch('os.path.exists') as mock_exists, \
         patch.dict(os.environ, {'EMAIL_PROVIDER': 'not-set'}, clear=False):
        
        mock_exists.return_value = False
        
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "degraded"
        assert data["checks"]["logo_exists"] is False
        assert data["checks"]["email_provider"] == "not-set"


@pytest.mark.unit
def test_health_endpoint_exception(client, test_env):
    """Test health endpoint handles exceptions properly."""
    with patch('os.path.exists', side_effect=Exception("File system error")):
        
        response = client.get("/health")
        
        assert response.status_code == 503
        assert "Service unhealthy" in response.json()["detail"]


@pytest.mark.unit
def test_metrics_endpoint(client, test_env):
    """Test metrics endpoint returns correct data."""
    response = client.get("/metrics")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "timestamp" in data
    assert "uptime_seconds" in data
    assert "uptime_human" in data
    assert "receipts_generated" in data
    assert "emails_sent" in data
    
    # Validate timestamp format
    datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00'))
    
    # Validate uptime format
    assert isinstance(data["uptime_seconds"], int)
    assert "h" in data["uptime_human"]
    assert "m" in data["uptime_human"]
    assert "s" in data["uptime_human"]


@pytest.mark.unit 
def test_metrics_counters_start_at_zero(client, test_env):
    """Test that metrics counters start at zero."""
    response = client.get("/metrics")
    data = response.json()
    
    assert data["receipts_generated"] == 0
    assert data["emails_sent"] == 0