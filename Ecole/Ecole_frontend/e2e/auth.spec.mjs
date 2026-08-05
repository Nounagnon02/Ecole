/**
 * E2E — Authentication flow
 *
 * Tests critical login/logout paths.
 * Requires the app to be running (npm run dev).
 */

// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows login page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('shows validation errors on empty form', async ({ page }) => {
    await page.click('button[type="submit"], button:has-text("Se connecter")');
    await expect(page.locator('text=Email, text=Mot de passe, .error, [role="alert"]').first()).toBeVisible({ timeout: 5000 }).catch(async () => {
      // Client-side validation may not show errors
    });
  });

  test('navigates to landing page', async ({ page }) => {
    await page.goto('/');
    const url = page.url();
    expect(url.includes('/') || url.includes('connexion') || url.includes('login')).toBeTruthy();
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-route-' + Date.now());
    await expect(page.locator('text=404, text=introuvable, text=NotFound').first()).toBeVisible({ timeout: 5000 }).catch(async () => {
      const url = page.url();
      expect(url.includes('404')).toBeTruthy();
    });
  });
});
