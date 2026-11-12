/**
 * E2E — Accessibilité (axe-core), lot 8.6 du plan de correction.
 *
 * La CI échoue dès qu'une page publique présente une violation « critique »
 * ou « grave » (impact `critical` ou `serious`) : bouton sans nom, champ sans
 * étiquette, contraste insuffisant… Les pages connectées ne sont pas couvertes
 * ici : le job e2e de la CI tourne sans API. Elles ont été mesurées à part
 * (audit/preuves-lot8, 168 vues).
 *
 * Chaque page est contrôlée sur ordinateur et à 360 px (téléphone d'entrée
 * de gamme), où les débordements et contrastes changent.
 */

// @ts-check
import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');

const PAGES = [
  { nom: 'connexion', url: '/connexion', pret: '#login-email' },
  { nom: 'mot de passe oublié (e-mail)', url: '/forgot-password', pret: 'form' },
  { nom: 'mot de passe oublié (SMS)', url: '/mot-de-passe-oublie/sms', pret: 'form' },
  { nom: 'lien de réinitialisation invalide', url: '/reset-password', pret: 'h1, h2' },
  { nom: 'page introuvable', url: '/404', pret: 'h1' },
];

const TAILLES = [
  { nom: 'ordinateur', viewport: { width: 1280, height: 800 } },
  { nom: 'téléphone 360 px', viewport: { width: 360, height: 740 } },
];

for (const taille of TAILLES) {
  test.describe(`Accessibilité — ${taille.nom}`, () => {
    test.use({ viewport: taille.viewport });

    for (const p of PAGES) {
      test(`${p.nom} : aucune violation critique ou grave`, async ({ page }) => {
        await page.goto(p.url);
        await page.locator(p.pret).first().waitFor({ state: 'visible' });
        // Les fondus d'apparition (framer-motion) font mesurer un contraste
        // de texte à demi transparent : on attend qu'ils soient finis.
        await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
        await page.waitForTimeout(300);
        await page.addScriptTag({ path: AXE });

        const violations = await page.evaluate(async () => {
          // @ts-ignore — axe est injecté ci-dessus
          const res = await window.axe.run(document, { resultTypes: ['violations'] });
          return res.violations
            .filter((v) => v.impact === 'critical' || v.impact === 'serious')
            .map((v) => ({
              regle: v.id,
              impact: v.impact,
              aide: v.help,
              elements: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
            }));
        });

        expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
      });
    }
  });
}
