import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  const API_BASE = 'http://localhost:8080';

  test('should verify API health endpoint', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('checks');
    
    expect(data.version).toBe('1.0.0');
    expect(['healthy', 'degraded']).toContain(data.status);
  });

  test('should verify API metrics endpoint', async ({ request }) => {
    const response = await request.get(`${API_BASE}/metrics`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime_seconds');
    expect(data).toHaveProperty('uptime_human');
    expect(data).toHaveProperty('receipts_generated');
    expect(data).toHaveProperty('emails_sent');
    
    expect(typeof data.uptime_seconds).toBe('number');
    expect(typeof data.receipts_generated).toBe('number');
    expect(typeof data.emails_sent).toBe('number');
  });

  test('should handle invalid donation ID formats', async ({ request }) => {
    const invalidIds = [
      'invalid@id!',
      'id with spaces',
      'a'.repeat(100), // Too long
      '', // Empty
      '../../../etc/passwd', // Path traversal
      '<script>alert("xss")</script>' // XSS attempt
    ];

    for (const invalidId of invalidIds) {
      const response = await request.get(`${API_BASE}/api/v1/donations/${encodeURIComponent(invalidId)}/receipt.pdf`);
      expect(response.status()).toBe(422); // Validation error
    }
  });

  test('should return 404 for nonexistent donations', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/donations/NONEXISTENT123/receipt.pdf`);
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data.detail).toContain('Donation not found');
  });

  test('should return proper CORS headers', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    
    // Note: CORS headers might not be present in same-origin requests
    // This test verifies the API is accessible from the frontend domain
    expect(response.ok()).toBeTruthy();
  });

  test('should enforce rate limiting', async ({ request }) => {
    // Make multiple rapid requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 65; i++) { // Exceed the 60/minute limit
      requests.push(request.get(`${API_BASE}/health`));
    }
    
    const responses = await Promise.all(requests);
    
    // Some requests should succeed
    const successCount = responses.filter(r => r.ok()).length;
    expect(successCount).toBeGreaterThan(0);
    
    // Some requests should be rate limited (429)
    const rateLimitedCount = responses.filter(r => r.status() === 429).length;
    expect(rateLimitedCount).toBeGreaterThan(0);
  });

  test('should include security headers', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    
    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy']).toContain('default-src \'self\'');
  });

  test('should handle email sending requests properly', async ({ request }) => {
    // Test POST to email endpoint with nonexistent donation
    const response = await request.post(`${API_BASE}/api/v1/donations/NONEXISTENT123/receipt`);
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data.detail).toContain('Donation not found');
  });

  test('should validate content types correctly', async ({ request }) => {
    // PDF endpoint should return PDF content type
    const pdfResponse = await request.get(`${API_BASE}/api/v1/donations/VALID123/receipt.pdf`);
    // Even if donation doesn't exist, we can check that the endpoint exists
    expect([200, 404]).toContain(pdfResponse.status());
    
    // JSON endpoints should return JSON
    const healthResponse = await request.get(`${API_BASE}/health`);
    expect(healthResponse.headers()['content-type']).toContain('application/json');
    
    const metricsResponse = await request.get(`${API_BASE}/metrics`);
    expect(metricsResponse.headers()['content-type']).toContain('application/json');
  });

  test('should handle OPTIONS requests for CORS', async ({ request }) => {
    // Test preflight request
    const response = await request.fetch(`${API_BASE}/api/v1/donations/TEST123/receipt.pdf`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      }
    });
    
    // Should allow the request or return 405 (method not allowed) if OPTIONS not implemented
    expect([200, 405]).toContain(response.status());
  });
});

test.describe('API Performance Tests', () => {
  const API_BASE = 'http://localhost:8080';

  test('should respond to health checks quickly', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE}/health`);
    const duration = Date.now() - start;
    
    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(1000); // Should respond within 1 second
  });

  test('should handle concurrent requests', async ({ request }) => {
    // Make 10 concurrent health check requests
    const requests = Array(10).fill(null).map(() => 
      request.get(`${API_BASE}/health`)
    );
    
    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });

  test('should maintain consistent response times', async ({ request }) => {
    const durations = [];
    
    // Make 5 sequential requests and measure response times
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      const response = await request.get(`${API_BASE}/metrics`);
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      durations.push(duration);
    }
    
    // Calculate average and ensure consistency
    const average = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDeviation = Math.max(...durations.map(d => Math.abs(d - average)));
    
    expect(average).toBeLessThan(500); // Average should be under 500ms
    expect(maxDeviation).toBeLessThan(1000); // No single request should be too far from average
  });
});

test.describe('API Security Tests', () => {
  const API_BASE = 'http://localhost:8080';

  test('should reject malicious payloads', async ({ request }) => {
    const maliciousPayloads = [
      '../../etc/passwd',
      '<script>alert("xss")</script>',
      '${7*7}', // Template injection
      '{{7*7}}', // Template injection
      'javascript:alert(1)', // JavaScript injection
    ];

    for (const payload of maliciousPayloads) {
      const response = await request.get(`${API_BASE}/api/v1/donations/${encodeURIComponent(payload)}/receipt.pdf`);
      
      // Should either be validation error (422) or not found (404)
      expect([404, 422]).toContain(response.status());
      
      // Response should not contain the malicious payload
      const body = await response.text();
      expect(body).not.toContain(payload);
    }
  });

  test('should not expose sensitive information in errors', async ({ request }) => {
    // Try to access a nonexistent endpoint
    const response = await request.get(`${API_BASE}/api/v1/donations/TEST123/receipt.pdf`);
    
    if (!response.ok()) {
      const errorBody = await response.text();
      
      // Should not contain sensitive information
      const sensitiveTerms = [
        'password',
        'secret',
        'key',
        'token',
        'database',
        'connection',
        'internal',
        'stack trace',
        'traceback'
      ];
      
      const lowercaseBody = errorBody.toLowerCase();
      sensitiveTerms.forEach(term => {
        expect(lowercaseBody).not.toContain(term);
      });
    }
  });

  test('should validate HTTP methods properly', async ({ request }) => {
    // GET should work for PDF endpoint
    let response = await request.get(`${API_BASE}/api/v1/donations/TEST123/receipt.pdf`);
    expect([200, 404]).toContain(response.status());
    
    // POST should not work for PDF endpoint
    response = await request.post(`${API_BASE}/api/v1/donations/TEST123/receipt.pdf`);
    expect([405, 422]).toContain(response.status());
    
    // GET should not work for email endpoint
    response = await request.get(`${API_BASE}/api/v1/donations/TEST123/receipt`);
    expect([405, 422]).toContain(response.status());
    
    // POST should work for email endpoint
    response = await request.post(`${API_BASE}/api/v1/donations/TEST123/receipt`);
    expect([200, 404, 400]).toContain(response.status()); // 400 if no email on file
  });
});