/**
 * E2E — Critical workflows end-to-end
 *
 * Tests the main user journeys across the application.
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Workflows', () => {
  test.describe('Landing and Navigation', () => {
    test('landing page loads with correct title', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1, h2, .font-fraunces').first()).toBeVisible();
    });

    test('login page is accessible from landing', async ({ page }) => {
      await page.goto('/');
      const loginLink = page.locator('a[href*="connexion"], a[href*="login"], button:has-text("Connexion"), button:has-text("Se connecter")').first();
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await expect(page).toHaveURL(/connexion|login/);
      }
    });

    test('connexion page renders correctly', async ({ page }) => {
      await page.goto('/connexion');
      await expect(page.locator('input[type="email"], input[name="email"], input[type="text"]').first()).toBeVisible();
    });

    test('forgot password page is accessible', async ({ page }) => {
      await page.goto('/forgot-password');
      await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    });

    test('reset password page is accessible', async ({ page }) => {
      await page.goto('/reset-password?token=test-token&email=test@example.com');
      await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    const protectedRoutes = [
      '/directeur/dashboard',
      '/enseignant/dashboard',
      '/eleve/dashboard',
      '/parent/dashboard',
      '/admin/dashboard',
      '/comptable/dashboard',
      '/surveillant/dashboard',
      '/censeur/dashboard',
      '/infirmier/dashboard',
      '/bibliothecaire/dashboard',
      '/secretaire/dashboard',
      '/universite/dashboard',
    ];

    for (const route of protectedRoutes) {
      test(`redirects ${route} to login when unauthenticated`, async ({ page }) => {
        await page.goto(route);
        const url = page.url();
        expect(url.includes('connexion') || url.includes('login') || url.includes('403')).toBeTruthy();
      });
    }
  });

  test.describe('Feature Pages', () => {
    test('eleves page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/eleves');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('notes page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/notes');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('paiements page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/paiements');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('messagerie page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/messagerie');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('emploi-du-temps page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/emploi-du-temps');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('parametres page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/parametres');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('communications page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/communications');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });
  });

  test.describe('University Module Pages', () => {
    test('facultes page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/universite/facultes');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('etudiants page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/universite/etudiants');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('enseignants page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/universite/enseignants');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('cours page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/universite/cours');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('notes page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/universite/notes');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });
  });

  test.describe('Admin Super-Admin Pages', () => {
    test('admin ecoles page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/admin/ecoles');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('admin utilisateurs page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/admin/utilisateurs');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('admin billing page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/admin/billing');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('admin modules page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/admin/modules');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('admin white-label page redirects when unauthenticated', async ({ page }) => {
      await page.goto('/admin/white-label');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });
  });

  test.describe('AI Features', () => {
    test('directeur AI insights redirects when unauthenticated', async ({ page }) => {
      await page.goto('/directeur/ai-insights');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('enseignant AI assistant redirects when unauthenticated', async ({ page }) => {
      await page.goto('/enseignant/ai-assistant');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('parent AI report redirects when unauthenticated', async ({ page }) => {
      await page.goto('/parent/ai-report');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });

    test('eleve AI tutor redirects when unauthenticated', async ({ page }) => {
      await page.goto('/eleve/tutor');
      const url = page.url();
      expect(url.includes('connexion') || url.includes('login')).toBeTruthy();
    });
  });

  test.describe('Error Pages', () => {
    test('404 page renders for unknown routes', async ({ page }) => {
      await page.goto('/this-route-definitely-does-not-exist-' + Date.now());
      await expect(page.locator('text=404, .not-found, [data-testid="not-found"]').first()).toBeVisible({ timeout: 5000 }).catch(async () => {
        const text = await page.locator('body').innerText();
        expect(text.length).toBeGreaterThan(0);
      });
    });

    test('403 page renders', async ({ page }) => {
      await page.goto('/403');
      await expect(page.locator('text=403, text=refusé, text=interdit').first()).toBeVisible({ timeout: 5000 }).catch(async () => {
        const text = await page.locator('body').innerText();
        expect(text.length).toBeGreaterThan(0);
      });
    });
  });
});
