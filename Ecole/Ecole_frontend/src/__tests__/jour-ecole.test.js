/*
 * Date du jour à l'heure de l'école (audit du 14/11, N-06).
 *
 * Onze écrans prenaient `new Date().toISOString().slice(0, 10)` : la date
 * UTC. Au Bénin (UTC+1), de minuit à 1 h, l'appel, les soins, le courrier ou
 * la saisie de notes proposaient la veille.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { aujourdhui, dansJours } from '@/shared/lib/jour';

describe('aujourdhui()', () => {
  afterEach(() => vi.useRealTimers());

  it('donne le 15/11 à 00 h 30 à Porto-Novo (23 h 30 UTC la veille)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T23:30:00Z'));
    expect(aujourdhui()).toBe('2026-11-15');
  });

  it('donne le 14/11 à 23 h 30 à Porto-Novo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T22:30:00Z'));
    expect(aujourdhui()).toBe('2026-11-14');
  });

  it('compte les jours à partir de la date locale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T23:30:00Z'));
    expect(dansJours(14)).toBe('2026-11-29');
    expect(dansJours(17)).toBe('2026-12-02');
  });
});

describe('aucun écran ne calcule la date du jour en UTC', () => {
  const fichiers = [];
  const parcourir = (dossier) => {
    for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
      const chemin = path.join(dossier, entree.name);
      if (entree.isDirectory()) { if (entree.name !== '__tests__') parcourir(chemin); }
      else if (/\.(jsx?|tsx?)$/.test(entree.name)) fichiers.push(chemin);
    }
  };
  parcourir(path.resolve(__dirname, '..'));

  it('n’utilise pas toISOString() pour une date du jour', () => {
    const fautifs = fichiers.filter((f) => /toISOString\(\)\.(slice\(0, ?10\)|split\('T'\)\[0\]|substring\(0, ?10\))/.test(fs.readFileSync(f, 'utf8')));
    expect(fautifs.map((f) => path.relative(path.resolve(__dirname, '..'), f))).toEqual([]);
  });
});
