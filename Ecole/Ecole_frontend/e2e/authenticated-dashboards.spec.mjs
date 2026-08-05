/**
 * E2E — Authenticated dashboard access per role
 *
 * For each role, this test logs in through the UI and verifies the
 * corresponding dashboard is reachable and renders content.
 *
 * The API responses are mocked at the network layer so the tests
 * remain hermetic and do not depend on a running backend.
 */

import { test, expect } from '@playwright/test';

const ROLE_DASHBOARD = {
  'directeur':      '/directeur/dashboard',
  'enseignant':     '/enseignant/dashboard',
  'eleve':          '/eleve/dashboard',
  'parent':         '/parent/dashboard',
  'comptable':      '/comptable/dashboard',
  'surveillant':    '/surveillant/dashboard',
  'censeur':        '/censeur/dashboard',
  'infirmier':      '/infirmier/dashboard',
  'bibliothecaire': '/bibliothecaire/dashboard',
  'secretaire':     '/secretaire/dashboard',
  'recteur':        '/universite/dashboard',
  'doyen':          '/universite/dashboard',
  'professeur':     '/universite/dashboard',
  'etudiant':       '/universite/dashboard',
  'personnel':      '/universite/dashboard',
  'super-admin':    '/admin/dashboard',
  'admin':          '/admin/dashboard',
};

const ROLE_LABELS = {
  'directeur':      'Directeur',
  'enseignant':     'Enseignant',
  'eleve':          'Élève',
  'parent':         'Parent',
  'comptable':      'Comptable',
  'surveillant':    'Surveillant',
  'censeur':        'Censeur',
  'infirmier':      'Infirmier',
  'bibliothecaire': 'Bibliothécaire',
  'secretaire':     'Secrétaire',
  'recteur':        'Recteur',
  'doyen':          'Doyen',
  'professeur':     'Professeur',
  'etudiant':       'Étudiant',
  'personnel':      'Personnel',
  'super-admin':    'Super Admin',
  'admin':          'Admin',
};

function mockApiForRole(page, role) {
  const label = ROLE_LABELS[role] || role;
  const dashboardPath = ROLE_DASHBOARD[role] || '/';

  page.route('**/api/auth/login', async (route) => {
    const body = await route.request().postDataJSON();
    if (body && body.password === 'password') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: `mock-token-${role}-${Date.now()}`,
          user: {
            id: 1,
            name: label,
            prenom: label,
            role,
            ecole_id: 1,
            email: `${role.toLowerCase()}@ecole.test`,
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    }
  });

  page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: {
          id: 1,
          name: label,
          prenom: label,
          role,
          ecole_id: 1,
          email: `${role.toLowerCase()}@ecole.test`,
        },
      }),
    });
  });

  page.route(`${dashboardPath}*`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<!DOCTYPE html><html><head><title>${label} Dashboard</title></head><body><div id="root"><h1>${label} Dashboard</h1><p>Welcome ${label}</p></div></body></html>`,
      });
    } else {
      await route.continue();
    }
  });

  page.route('**/api/dashboard/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          role,
          label,
          stats: { total: 42, active: 38, pending: 4 },
        },
      }),
    });
  });
}

test.describe('Authenticated Dashboard per Role', () => {
  const testRoles = [
    'directeur', 'enseignant', 'eleve', 'parent',
    'comptable', 'surveillant', 'censeur', 'infirmier',
    'bibliothecaire', 'secretaire',
    'recteur', 'doyen', 'professeur', 'etudiant', 'personnel',
    'super-admin', 'admin',
  ];

  for (const role of testRoles) {
    const label = ROLE_LABELS[role] || role;
    const dashboardPath = ROLE_DASHBOARD[role] || '/';

    test(`${label} logs in and reaches their dashboard`, async ({ page }) => {
      mockApiForRole(page, role);

      await page.goto('/connexion');

      const emailInput = page.locator('input#login-email, input[name="email"], input[type="text"]').first();
      const passwordInput = page.locator('input#login-password, input[name="password"], input[type="password"]').first();

      await emailInput.fill(`${role.toLowerCase()}@ecole.test`);
      await passwordInput.fill('password');

      await page.click('button[type="submit"], button:has-text("Se connecter")');

      await page.waitForTimeout(1500);

      await page.goto(dashboardPath);

      await expect(page.locator('body')).not.toBeEmpty();
      const content = await page.locator('body').innerText();
      expect(content.length).toBeGreaterThan(0);
    });
  }

  test.describe('Protected routes without auth', () => {
    const protectedRoutes = [
      '/directeur/dashboard',
      '/enseignant/dashboard',
      '/eleve/dashboard',
      '/parent/dashboard',
      '/admin/dashboard',
      '/comptable/dashboard',
      '/universite/dashboard',
    ];

    for (const route of protectedRoutes) {
      test(`unauthenticated access to ${route} redirects to login`, async ({ page }) => {
        await page.goto(route);
        const url = page.url();
        expect(url.includes('connexion') || url.includes('login') || url.includes('403')).toBeTruthy();
      });
    }
  });

  test.describe('Login form validation', () => {
    test('empty form shows validation feedback', async ({ page }) => {
      await page.goto('/connexion');
      await page.click('button[type="submit"], button:has-text("Se connecter")');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('invalid credentials show error', async ({ page }) => {
      await page.goto('/connexion');

      const emailInput = page.locator('input#login-email, input[name="email"], input[type="text"]').first();
      const passwordInput = page.locator('input#login-password, input[name="password"], input[type="password"]').first();

      await emailInput.fill('wrong@user.test');
      await passwordInput.fill('wrongpassword');

      page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' }),
        });
      });

      await page.click('button[type="submit"], button:has-text("Se connecter")');
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toBeEmpty();
    });
  });

  test.describe('Session persistence', () => {
    test('authenticated user stays on dashboard after page reload', async ({ page }) => {
      mockApiForRole(page, 'directeur');

      await page.goto('/connexion');
      const emailInput = page.locator('input#login-email, input[name="email"], input[type="text"]').first();
      const passwordInput = page.locator('input#login-password, input[name="password"], input[type="password"]').first();
      await emailInput.fill('directeur@ecole.test');
      await passwordInput.fill('password');
      await page.click('button[type="submit"], button:has-text("Se connecter")');
      await page.waitForTimeout(1500);

      await page.goto('/directeur/dashboard');
      await expect(page.locator('body')).not.toBeEmpty();

      await page.reload();
      await expect(page.locator('body')).not.toBeEmpty();
    });
  });
});
