/**
 * E2E — parcours authentifiés qui écrivent (audit P2.4)
 *
 * La suite e2e existante couvrait deux choses : la redirection d'un visiteur
 * non authentifié, et l'accès aux tableaux de bord par rôle. Aucun test ne
 * faisait écrire l'application. Un formulaire pouvait donc cesser d'émettre sa
 * requête, ou l'émettre avec la mauvaise charge utile, sans qu'aucun test ne
 * bronche.
 *
 * Ces cas conduisent l'interface réelle et vérifient la requête sortante :
 * méthode, URL et corps. L'API est simulée au niveau réseau, donc les tests
 * restent hermétiques — ils valident ce que le front envoie, pas ce que le
 * back en fait, que couvrent les tests Pest.
 */

import { test, expect } from '@playwright/test';

/**
 * Authentifier un rôle et neutraliser les appels communs.
 *
 * Playwright résout les routes de la plus récemment enregistrée à la plus
 * ancienne : le filet générique doit donc être posé EN PREMIER, sinon il
 * intercepte aussi la connexion et les tests échouent sans raison lisible.
 */
async function signIn(page, role, { ecoles = [], notes = [] } = {}) {
  // Filet générique, posé en premier pour être le dernier consulté.
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );

  await page.route('**/sanctum/csrf-cookie', (route) =>
    route.fulfill({ status: 204, body: '' }),
  );

  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 1, name: role, prenom: role, role, ecole_id: 1, email: `${role}@ecole.test` },
      }),
    }),
  );

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: { id: 1, name: role, prenom: role, role, ecole_id: 1, email: `${role}@ecole.test` },
      }),
    }),
  );

  await page.route('**/api/notes/eleve*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: notes }),
    }),
  );

  await page.route('**/api/ecoles', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: ecoles }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto('/connexion');
  await page.locator('input#login-email, input[name="email"], input[type="text"]').first().fill(`${role}@ecole.test`);
  await page.locator('input#login-password, input[name="password"], input[type="password"]').first().fill('password');
  await page.click('button[type="submit"], button:has-text("Se connecter")');

  // Sortir de /connexion prouve que la session est établie. Sans cette
  // attente, chaque test échouerait plus loin sur un symptôme trompeur.
  await expect(page).not.toHaveURL(/connexion/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Écritures authentifiées', () => {
  test('creating a school sends the form as a POST /ecoles', async ({ page }) => {
    await signIn(page, 'super-admin');

    /** @type {{method: string, url: string, body: any}[]} */
    const writes = [];
    await page.route('**/api/ecoles', async (route) => {
      const request = route.request();
      if (request.method() !== 'POST') {
        await route.fallback();
        return;
      }
      writes.push({ method: request.method(), url: request.url(), body: request.postDataJSON() });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 7 } }),
      });
    });

    await page.goto('/admin/ecoles');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /ajouter une école/i }).click();

    // Portée limitée à la modale ouverte : `EcoleForm` sert aussi à la modale
    // de provisionnement, donc les mêmes libellés existent deux fois dans le
    // DOM. Les placeholders sont plus stables que les libellés, qui portent un
    // astérisque quand le champ est requis.
    const modale = page.getByRole('dialog');
    await expect(modale).toBeVisible();

    await modale.getByPlaceholder('Ex: Complexe Scolaire Lumière').fill('Complexe Scolaire Test');
    await modale.getByPlaceholder('contact@ecole.bj').fill('contact@cst.test');
    await modale.getByPlaceholder('+229 01 02 03 04').fill('0197000000');
    await modale.getByPlaceholder('Cotonou, Bénin').fill('Rue 12');
    await modale.getByPlaceholder('Cotonou', { exact: true }).fill('Cotonou');

    await modale.getByRole('button', { name: /créer l'école/i }).click();

    await expect.poll(() => writes.length, { timeout: 10_000 }).toBe(1);

    expect(writes[0].method).toBe('POST');
    expect(writes[0].body).toMatchObject({
      nom: 'Complexe Scolaire Test',
      email: 'contact@cst.test',
      telephone: '0197000000',
      adresse: 'Rue 12',
      ville: 'Cotonou',
    });
  });

  test('a rejected creation surfaces the server field errors', async ({ page }) => {
    await signIn(page, 'super-admin');

    await page.route('**/api/ecoles', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Données invalides',
          errors: { email: ['Cet email est déjà utilisé.'] },
        }),
      });
    });

    await page.goto('/admin/ecoles');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /ajouter une école/i }).click();

    const modale = page.getByRole('dialog');
    await expect(modale).toBeVisible();
    await modale.getByPlaceholder('Ex: Complexe Scolaire Lumière').fill('Doublon');
    await modale.getByPlaceholder('contact@ecole.bj').fill('deja@pris.test');
    await modale.getByRole('button', { name: /créer l'école/i }).click();

    // L'erreur du serveur doit atteindre l'utilisateur : sans cela, un échec
    // d'écriture est indiscernable d'un succès.
    await expect(page.getByText(/déjà utilisé/i)).toBeVisible({ timeout: 10_000 });
  });

  test('locking a mark sends POST /notes/{id}/lock', async ({ page }) => {
    await signIn(page, 'directeur', {
      notes: [
        {
          id: 42,
          note: 15,
          note_sur: 20,
          periode: 'Trimestre 1',
          locked: false,
          matiere: { id: 3, nom: 'Mathématiques' },
          eleve: { id: 9, user: { name: 'Dossou', prenom: 'Awa' } },
        },
      ],
    });

    /** @type {string[]} */
    const locks = [];
    await page.route('**/api/notes/42/lock', async (route) => {
      locks.push(route.request().method());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    await page.getByTitle('Verrouiller').first().click();

    await expect.poll(() => locks.length, { timeout: 10_000 }).toBe(1);
    expect(locks[0]).toBe('POST');
  });
});
