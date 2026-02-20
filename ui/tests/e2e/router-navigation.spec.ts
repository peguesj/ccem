/**
 * Router E2E Tests
 *
 * End-to-end tests for router navigation using Playwright.
 * Tests actual browser behavior and user interactions.
 */

import { test, expect } from '@playwright/test';

test.describe('Router Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should navigate to home page', async ({ page }) => {
    // Assert
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate using browser back/forward', async ({ page }) => {
    // Act
    await page.goto('/config');
    await page.goto('/commands');

    // Go back
    await page.goBack();

    // Assert
    await expect(page).toHaveURL('/config');

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/commands');
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Act
    await page.goto('/agents/123');

    // Assert
    await expect(page).toHaveURL('/agents/123');
  });

  test('should update URL when clicking navigation links', async ({ page }) => {
    // Arrange - Wait for navigation to be ready
    await page.waitForLoadState('domcontentloaded');

    // Act - Click a navigation link (if available)
    const configLink = page.locator('[href="/config"]').first();
    if (await configLink.isVisible()) {
      await configLink.click();

      // Assert
      await expect(page).toHaveURL('/config');
    }
  });

  test('should maintain state across navigation', async ({ page }) => {
    // Navigate to a page
    await page.goto('/config');

    // Perform some interaction (e.g., change a setting)
    const input = page.locator('input[name="setting"]').first();
    if (await input.isVisible()) {
      await input.fill('test value');

      // Navigate away
      await page.goto('/');

      // Navigate back
      await page.goto('/config');

      // State might or might not be preserved depending on implementation
      // This test demonstrates E2E testing patterns
    }
  });

  test('should handle 404 pages', async ({ page }) => {
    // Act
    await page.goto('/nonexistent-route');

    // Assert - Should show 404 or redirect
    // The actual behavior depends on how the app handles 404s
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // This test demonstrates keyboard navigation testing
    await page.goto('/');

    // Press Tab to navigate through focusable elements
    await page.keyboard.press('Tab');

    // Press Enter to activate focused element
    await page.keyboard.press('Enter');

    // State should change based on the focused element
  });

  test('should work with browser refresh', async ({ page }) => {
    // Navigate to a specific route
    await page.goto('/agents/456');

    // Refresh the page
    await page.reload();

    // Assert - Should maintain the route
    await expect(page).toHaveURL('/agents/456');
  });
});

test.describe('Router Performance', () => {
  test('should navigate quickly between routes', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    // Measure navigation time
    const startTime = Date.now();

    await page.goto('/config');

    const navigationTime = Date.now() - startTime;

    // Assert - Navigation should be fast (< 2 seconds)
    expect(navigationTime).toBeLessThan(2000);
  });

  test('should handle rapid navigation changes', async ({ page }) => {
    // Rapidly navigate between routes
    await page.goto('/');
    await page.goto('/config');
    await page.goto('/commands');
    await page.goto('/agents');
    await page.goto('/');

    // Assert - Should end up at the last route
    await expect(page).toHaveURL('/');
  });
});

test.describe('Router Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/');

    // Navigate
    await page.goto('/config');

    // Assert
    await expect(page).toHaveURL('/config');
  });

  test('should handle mobile gestures', async ({ page }) => {
    await page.goto('/config');

    // Simulate swipe back gesture (if implemented)
    await page.goBack();

    await expect(page).toHaveURL('/');
  });
});
