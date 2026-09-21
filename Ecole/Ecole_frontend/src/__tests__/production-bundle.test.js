/**
 * Un `manualChunks` précédent (voir le commentaire dans vite.config.js) a
 * cassé la production avec une page blanche :
 *
 *   Uncaught ReferenceError: Cannot access 'j' before initialization
 *
 * — deux chunks mutuellement dépendants, initialisés dans le mauvais ordre.
 * `npm run build` seul ne l'aurait pas attrapé : Rollup construit sans
 * erreur, le bug n'apparaît qu'à l'évaluation réelle des modules dans le
 * navigateur. Ce test charge le chunk d'entrée réellement construit (pas le
 * code source) sous jsdom, l'environnement de test déjà configuré par ce
 * projet : une erreur d'ordre d'initialisation entre chunks s'y manifeste de
 * la même façon que dans un vrai navigateur, à l'évaluation du module.
 *
 * Nécessite un build existant (`npm run build`) -- ignoré en l'absence de
 * `build/`, pour ne pas faire échouer un lancement de tests qui n'a pas
 * construit l'application (le poste de développement courant, par exemple).
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const buildDir = resolve(__dirname, '../../build');
const indexHtmlPath = resolve(buildDir, 'index.html');

const buildExists = existsSync(indexHtmlPath);

describe.skipIf(!buildExists)('bundle de production — ordre d\'initialisation des chunks', () => {
  it('le chunk d\'entrée s\'évalue sans ReferenceError', async () => {
    const html = readFileSync(indexHtmlPath, 'utf-8');
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    expect(match, 'index.html doit référencer un chunk d\'entrée /assets/index-*.js').not.toBeNull();

    const entryPath = resolve(buildDir, '.' + match[1]);

    // Le point d'entrée réel monte React sur `#root` dès son évaluation
    // (`index.jsx`) -- sans cet élément, `ReactDOM.createRoot` échoue avant
    // même d'atteindre le code qu'on veut vérifier ici.
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    // Une ReferenceError levée ici -- qu'elle vienne de ce chunk ou d'un de
    // ceux qu'il importe -- se propage par le rejet de cette promesse.
    await expect(import(/* @vite-ignore */ entryPath)).resolves.toBeDefined();
  });
});
