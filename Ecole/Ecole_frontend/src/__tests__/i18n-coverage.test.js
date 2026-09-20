/**
 * Cohérence des locales et des clés utilisées.
 *
 * Deux régressions silencieuses que rien d'autre n'attrape :
 *  - une clé ajoutée en français mais oubliée en anglais ou en arabe ;
 *  - une clé `t('…')` mal orthographiée, qui s'affiche brute à l'écran.
 */

import { describe, it, expect } from 'vitest';
import fr from '@/shared/i18n/locales/fr.json';
import en from '@/shared/i18n/locales/en.json';
import ar from '@/shared/i18n/locales/ar.json';

function aplatir(obj, prefixe = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const cle = prefixe ? `${prefixe}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, aplatir(v, cle));
    else out[cle] = v;
  }
  return out;
}

const FR = aplatir(fr);
const params = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('parité des locales', () => {
  for (const [nom, locale] of [['en', en], ['ar', ar]]) {
    const L = aplatir(locale);

    it(`${nom} a exactement les clés du français`, () => {
      expect(Object.keys(FR).filter((k) => !(k in L))).toEqual([]);
      expect(Object.keys(L).filter((k) => !(k in FR))).toEqual([]);
    });

    it(`${nom} garde les mêmes paramètres {…} que le français`, () => {
      const divergentes = Object.keys(FR).filter((k) => k in L && params(FR[k]).join() !== params(L[k]).join());
      expect(divergentes).toEqual([]);
    });

    it(`${nom} n'a aucune valeur vide`, () => {
      expect(Object.keys(L).filter((k) => typeof L[k] === 'string' && L[k].trim() === '')).toEqual([]);
    });
  }
});

describe('clés utilisées dans le code', () => {
  const sources = import.meta.glob('/src/**/*.{js,jsx}', { query: '?raw', import: 'default', eager: true });
  // Le module i18n lui-même cite des clés d'exemple dans ses commentaires.
  const fichiers = Object.entries(sources)
    .filter(([chemin]) => !/\.test\.|__tests__|setupTests|\/shared\/i18n\//.test(chemin));

  it('lit bien du code (le glob ne doit pas être vide)', () => {
    expect(fichiers.length).toBeGreaterThan(100);
  });

  it("chaque t('clé') statique existe en français", () => {
    const manquantes = [];
    for (const [chemin, code] of fichiers) {
      for (const m of code.matchAll(/(?<![\w.$])t\(\s*['"]([\w.]+)['"]/g)) {
        if (!(m[1] in FR)) manquantes.push(`${chemin.replace('/src/', '')}: ${m[1]}`);
      }
    }
    expect(manquantes).toEqual([]);
  });

  it("chaque clé passée en donnée (key: 'pages.…') existe en français", () => {
    const manquantes = [];
    for (const [chemin, code] of fichiers) {
      for (const m of code.matchAll(/['"`]((?:pages|dashboards|header|common)\.[\w.]+)['"`]/g)) {
        if (!(m[1] in FR)) manquantes.push(`${chemin.replace('/src/', '')}: ${m[1]}`);
      }
    }
    expect(manquantes).toEqual([]);
  });

  it("chaque préfixe de clé dynamique t(`a.b.${x}`) désigne un espace de noms existant", () => {
    const prefixes = new Set(Object.keys(FR).flatMap((k) => {
      const parts = k.split('.');
      return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('.'));
    }));
    const manquants = [];
    for (const [chemin, code] of fichiers) {
      for (const m of code.matchAll(/(?<![\w.$])t\(\s*`([\w.]+)\.\$\{/g)) {
        if (!prefixes.has(m[1])) manquants.push(`${chemin.replace('/src/', '')}: ${m[1]}`);
      }
    }
    expect(manquants).toEqual([]);
  });
});
