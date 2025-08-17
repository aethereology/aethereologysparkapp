import { test, expect } from '@playwright/test';

test.describe('Donation Receipt Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the receipt viewer page
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display the receipt viewer interface', async ({ page }) => {
    // Check that main elements are present
    await expect(page.locator('h1')).toContainText('Donation Receipt Viewer');
    await expect(page.locator('input[placeholder*="donation ID"]')).toBeVisible();
    await expect(page.locator('button', { hasText: 'View Receipt' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Send Receipt' })).toBeVisible();
  });

  test('should validate donation ID input', async ({ page }) => {
    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    // Test empty input
    await viewButton.click();
    await expect(page.locator('text=/invalid.*donation.*id/i')).toBeVisible();
    
    // Test invalid characters
    await input.fill('invalid@id!');
    await viewButton.click();
    await expect(page.locator('text=/invalid.*donation.*id/i')).toBeVisible();
  });

  test('should handle successful PDF receipt download', async ({ page }) => {
    // Mock the API response for PDF download
    await page.route('**/api/v1/donations/*/receipt.pdf', async (route) => {
      // Create a mock PDF response
      const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF');
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="RCPT-TEST123.pdf"'
        },
        body: pdfBuffer,
      });
    });

    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    // Fill valid donation ID and click
    await input.fill('TEST123');
    
    // Setup download handling
    const downloadPromise = page.waitForEvent('download');
    await viewButton.click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should handle PDF download errors', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/v1/donations/*/receipt.pdf', async (route) => {
      await route.fulfill({
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detail: 'Donation not found' }),
      });
    });

    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    await input.fill('NOTFOUND123');
    await viewButton.click();
    
    // Should show error message
    await expect(page.locator('text=/error.*donation not found/i')).toBeVisible();
  });

  test('should handle successful email sending', async ({ page }) => {
    // Mock the API response for email sending
    await page.route('**/api/v1/donations/*/receipt', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sent: true,
            recipient: 'test@example.com'
          }),
        });
      }
    });

    const input = page.locator('input[placeholder*="donation ID"]');
    const sendButton = page.locator('button', { hasText: 'Send Receipt' });
    
    await input.fill('EMAIL123');
    await sendButton.click();
    
    // Should show success message
    await expect(page.locator('text=/receipt sent successfully/i')).toBeVisible();
    await expect(page.locator('text=/test@example.com/i')).toBeVisible();
  });

  test('should handle email sending errors', async ({ page }) => {
    // Mock API error for email sending
    await page.route('**/api/v1/donations/*/receipt', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detail: 'No donor email on file' }),
        });
      }
    });

    const input = page.locator('input[placeholder*="donation ID"]');
    const sendButton = page.locator('button', { hasText: 'Send Receipt' });
    
    await input.fill('NOEMAIL123');
    await sendButton.click();
    
    // Should show error message
    await expect(page.locator('text=/error.*no donor email/i')).toBeVisible();
  });

  test('should show loading states during requests', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/donations/*/receipt.pdf', async (route) => {
      // Delay response to test loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
        body: Buffer.from('%PDF test'),
      });
    });

    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    await input.fill('LOADING123');
    await viewButton.click();
    
    // Should show loading state
    await expect(page.locator('text=/loading/i')).toBeVisible();
    await expect(viewButton).toBeDisabled();
    
    // Wait for loading to complete
    await expect(page.locator('text=/loading/i')).toBeHidden();
    await expect(viewButton).toBeEnabled();
  });

  test('should clear errors when input changes', async ({ page }) => {
    // Mock API error first
    await page.route('**/api/v1/donations/*/receipt.pdf', async (route) => {
      await route.fulfill({
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detail: 'Not found' }),
      });
    });

    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    // Trigger error
    await input.fill('ERROR123');
    await viewButton.click();
    await expect(page.locator('text=/error.*not found/i')).toBeVisible();
    
    // Change input - error should clear
    await input.clear();
    await input.fill('NEW123');
    
    // Error message should be gone
    await expect(page.locator('text=/error.*not found/i')).toBeHidden();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Elements should still be visible and functional
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[placeholder*="donation ID"]')).toBeVisible();
    await expect(page.locator('button', { hasText: 'View Receipt' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Send Receipt' })).toBeVisible();
    
    // Buttons should be properly sized for touch
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    const buttonBox = await viewButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(44); // iOS recommendation
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    const sendButton = page.locator('button', { hasText: 'Send Receipt' });
    
    // Tab navigation
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(viewButton).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(sendButton).toBeFocused();
    
    // Enter key should work on buttons
    await input.fill('KEYBOARD123');
    await viewButton.focus();
    
    // Mock response for enter key test
    await page.route('**/api/v1/donations/KEYBOARD123/receipt.pdf', async (route) => {
      await route.fulfill({
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detail: 'Test error' }),
      });
    });
    
    await page.keyboard.press('Enter');
    await expect(page.locator('text=/error/i')).toBeVisible();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/v1/donations/*/receipt.pdf', route => route.abort('failed'));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    await input.fill('NETWORK123');
    await viewButton.click();
    
    // Should show network error
    await expect(page.locator('text=/network.*error/i')).toBeVisible();
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock malformed JSON response
    await page.route('**/api/v1/donations/*/receipt.pdf', async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    await input.fill('MALFORMED123');
    await viewButton.click();
    
    // Should show generic error message
    await expect(page.locator('text=/error/i')).toBeVisible();
  });

  test('should handle very long donation IDs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    // Test with very long ID (over 50 characters)
    const longId = 'A'.repeat(100);
    await input.fill(longId);
    await viewButton.click();
    
    // Should show validation error
    await expect(page.locator('text=/invalid.*donation.*id/i')).toBeVisible();
  });

  test('should prevent XSS attacks in error messages', async ({ page }) => {
    // Mock API response with potential XSS
    await page.route('**/api/v1/donations/*/receipt.pdf', async (route) => {
      await route.fulfill({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          detail: '<script>alert("XSS")</script>' 
        }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('input[placeholder*="donation ID"]');
    const viewButton = page.locator('button', { hasText: 'View Receipt' });
    
    await input.fill('XSS123');
    await viewButton.click();
    
    // Error message should be safely escaped
    await expect(page.locator('text=/<script>/i')).toBeHidden();
    // But error should still be shown
    await expect(page.locator('text=/error/i')).toBeVisible();
  });
});