/**
 * Premier chargement : la page de connexion, rien d'autre.
 *
 * En 3G lente (400 kb/s), le formulaire de connexion n'était utilisable
 * qu'après 8,6 s : le script d'entrée (287 Ko compressés) embarquait les
 * trois langues, framer-motion, la coque des pages connectées, les tableaux.
 * Ces tests gardent ces poids hors du premier chargement.
 *
 * La partie « bundle » lit le build réel (`npm run build`) ; elle est ignorée
 * sans build, comme `production-bundle.test.js`.
 */
import { describe, it, expect, vi } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { resolve } from 'path';

const buildDir = resolve(__dirname, '../../build');
const indexHtmlPath = resolve(buildDir, 'index.html');

describe('langues chargées à la demande', () => {
  it('ne connaît que le français au départ, puis charge l’anglais quand on le demande', async () => {
    vi.resetModules();
    const { translate, chargerLocale } = await import('@/shared/i18n');

    // Pas encore chargé : repli sur le français, jamais la clé brute.
    expect(translate('common.save', 'en')).toBe('Enregistrer');

    await chargerLocale('en');
    expect(translate('common.save', 'en')).toBe('Save');
  });

  it('ignore une langue inconnue sans erreur', async () => {
    vi.resetModules();
    const { chargerLocale, translate } = await import('@/shared/i18n');

    await expect(chargerLocale('xx')).resolves.toBeUndefined();
    expect(translate('common.save', 'xx')).toBe('Enregistrer');
  });
});

describe.skipIf(!existsSync(indexHtmlPath))('script d’entrée construit', () => {
  const html = existsSync(indexHtmlPath) ? readFileSync(indexHtmlPath, 'utf-8') : '';
  const entree = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
  const code = entree ? readFileSync(resolve(buildDir, '.' + entree), 'utf-8') : '';

  it('n’embarque ni l’anglais ni l’arabe', () => {
    expect(code).toContain('Enregistrer');
    expect(code).not.toContain('Forgot password');
    expect(code).not.toContain('هل تحتاج إلى مساعدة');
  });

  it('n’embarque pas framer-motion', () => {
    expect(code).not.toMatch(/AnimatePresence|framer-motion/);
  });

  it('pèse moins de 190 Ko compressés, préchargements compris (287 Ko avant le lot 9)', () => {
    // Tout ce que index.html fait charger d'emblée : le script d'entrée et
    // les morceaux qu'il précharge (React, icônes).
    const fichiers = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
    expect(fichiers.length).toBeGreaterThan(0);
    const total = fichiers.reduce((somme, f) => somme + gzipSync(readFileSync(resolve(buildDir, '.' + f))).length, 0);
    expect(total / 1024).toBeLessThan(190);
  });
});
