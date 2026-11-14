/**
 * Tableaux de bord par rôle — TESTS D'INTERFACE À API SIMULÉE.
 *
 * Ce fichier charge la vraie application (composants, routeur, gardes) et
 * simule uniquement l'API (`/api/**`). Il prouve que chaque rôle atteint son
 * tableau de bord réel, que les gardes redirigent et que les erreurs
 * s'affichent. Il ne prouve PAS l'intégration avec Laravel ni les données :
 * les parcours réels (API et base de test) sont dans `e2e/parcours-reels*`
 * et dans les contrôles de `audit/`.
 *
 * Correction du 14/11/2026 : la version précédente remplaçait la page de
 * chaque tableau de bord par du HTML écrit dans le test (`<h1>… Dashboard</h1>`)
 * et ne vérifiait que « la page n'est pas vide » : elle passait sans jamais
 * charger l'application.
 */

import { test, expect } from '@playwright/test';

const ROLE_DASHBOARD = {
  directeur: '/directeur/dashboard',
  enseignant: '/enseignant/dashboard',
  eleve: '/eleve/dashboard',
  parent: '/parent/dashboard',
  comptable: '/comptable/dashboard',
  surveillant: '/surveillant/dashboard',
  censeur: '/censeur/dashboard',
  infirmier: '/infirmier/dashboard',
  bibliothecaire: '/bibliothecaire/dashboard',
  secretaire: '/secretaire/dashboard',
  recteur: '/universite/dashboard',
  doyen: '/universite/dashboard',
  professeur: '/universite/dashboard',
  etudiant: '/universite/dashboard',
  personnel: '/universite/dashboard',
  'super-admin': '/admin/dashboard',
  admin: '/admin/dashboard',
};

/** API simulée : session du rôle, et réponses vides (états vides réels) pour le reste. */
async function simulerApi(page, role) {
  const user = { id: 1, name: 'Test', prenom: 'Recette', email: `${role}@ecole.test`, role, ecole_id: 1 };
  let connecte = false;
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/auth/login')) {
      connecte = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user, redirect_to: ROLE_DASHBOARD[role] }) });
    }
    if (url.includes('/api/auth/me')) {
      return connecte
        ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) })
        : route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthenticated.' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });
  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204, body: '' }));
}

async function seConnecter(page, role) {
  await page.goto('/connexion');
  await page.locator('#login-email').fill(`${role}@ecole.test`);
  await page.locator('#login-password').fill('password');
  await page.getByRole('button', { name: /se connecter/i }).click();
}

test.describe('Tableau de bord réel de chaque rôle (API simulée)', () => {
  for (const [role, chemin] of Object.entries(ROLE_DASHBOARD)) {
    test(`${role} se connecte et atteint son vrai tableau de bord`, async ({ page }) => {
      await simulerApi(page, role);
      await seConnecter(page, role);

      await expect(page).toHaveURL(new RegExp(`${chemin.replace(/\//g, '\\/')}$`), { timeout: 15000 });
      // Le contenu vient des composants de l'application : zone principale et titre réels.
      const principal = page.locator('#main-content');
      await expect(principal).toBeVisible({ timeout: 15000 });
      await expect(principal.locator('h1').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Accès non autorisé')).toHaveCount(0);
      // La page d'erreur de l'application a, elle aussi, une zone principale
      // et un titre : sans ce contrôle, un tableau de bord qui plante passait.
      await expect(page.getByRole('heading', { name: 'Erreur serveur' })).toHaveCount(0);
    });
  }
});

test.describe('Routes protégées sans session', () => {
  const routes = ['/directeur/dashboard', '/enseignant/dashboard', '/eleve/dashboard', '/parent/dashboard',
    '/admin/dashboard', '/comptable/dashboard', '/universite/dashboard'];

  for (const route of routes) {
    test(`${route} renvoie vers la connexion`, async ({ page }) => {
      await page.route('**/api/auth/me', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthenticated."}' }));
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await expect(page).toHaveURL(/\/connexion/, { timeout: 15000 });
      await expect(page.locator('#login-email')).toBeVisible();
    });
  }
});

test.describe('Formulaire de connexion (API simulée)', () => {
  test('identifiants refusés : le message de l’API s’affiche et on reste sur la connexion', async ({ page }) => {
    await page.route('**/sanctum/csrf-cookie', (r) => r.fulfill({ status: 204, body: '' }));
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthenticated."}' }));
    await page.route('**/api/auth/login', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Identifiants invalides' }) }));
    await seConnecter(page, 'inconnu');
    await expect(page.getByText('Identifiants invalides')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/connexion/);
  });
});

test.describe('Persistance de session (API simulée)', () => {
  test('après rechargement, le directeur reste sur son tableau de bord', async ({ page }) => {
    await simulerApi(page, 'directeur');
    await seConnecter(page, 'directeur');
    await expect(page).toHaveURL(/\/directeur\/dashboard$/, { timeout: 15000 });
    await page.reload();
    await expect(page).toHaveURL(/\/directeur\/dashboard$/, { timeout: 15000 });
    await expect(page.locator('#main-content h1').first()).toBeVisible({ timeout: 15000 });
  });
});
