/**
 * École Desktop — Vérification automatisée (`npm run verify`)
 *
 * Rejoue sans intervention manuelle le contrôle « l'application s'installe,
 * démarre et affiche le frontend » :
 *
 *   1. contrôle syntaxique des scripts du processus principal ;
 *   2. binaire Electron réellement présent (l'installation npm peut réussir
 *      alors que le téléchargement du binaire a échoué) ;
 *   3. build du frontend web disponible ;
 *   4. lancement de `smoke.js` sous Electron, qui charge `main.js` et vérifie
 *      que React monte.
 *
 * Sans affichage (CI, conteneur), la commande se replie sur `xvfb-run`. Si ni
 * l'un ni l'autre n'est disponible, elle échoue en le disant, plutôt que de
 * conclure au succès.
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RACINE = __dirname;
const BUILD_DIR = path.join(RACINE, '..', 'Ecole_frontend', 'build');
const SCRIPTS = ['main.js', 'preload.js', 'smoke.js'];

let echecs = 0;

function ok(message) {
  console.log(`  ok      ${message}`);
}

function echec(message) {
  echecs += 1;
  console.error(`  ÉCHEC   ${message}`);
}

function titre(message) {
  console.log(`\n${message}`);
}

// ─── 1. Syntaxe ─────────────────────────────────────────────────────────────
titre('1. Syntaxe des scripts du processus principal');
for (const script of SCRIPTS) {
  const chemin = path.join(RACINE, script);
  if (!fs.existsSync(chemin)) {
    echec(`${script} — fichier absent`);
    continue;
  }
  const resultat = spawnSync(process.execPath, ['--check', chemin], { encoding: 'utf8' });
  if (resultat.status === 0) ok(script);
  else echec(`${script}\n${(resultat.stderr || '').trim()}`);
}

// ─── 2. Binaire Electron ────────────────────────────────────────────────────
titre('2. Binaire Electron');
let electronPath = null;
try {
  electronPath = require('electron');
  if (typeof electronPath !== 'string' || !fs.existsSync(electronPath)) {
    throw new Error(`chemin résolu inexploitable : ${electronPath}`);
  }
  const version = spawnSync(electronPath, ['--version'], {
    encoding: 'utf8',
    env: sansRunAsNode(process.env),
  });
  if (version.status !== 0) {
    throw new Error((version.stderr || version.error?.message || 'code de sortie non nul').trim());
  }
  ok(`${version.stdout.trim()} — ${electronPath}`);
} catch (erreur) {
  echec(
    `Electron indisponible — ${erreur.message}\n` +
      '          exécutez « npm install ». Si l\'installation se termine sans écrire\n' +
      '          node_modules/electron/path.txt, le téléchargement du binaire a\n' +
      '          échoué : supprimez node_modules/electron puis réinstallez.'
  );
}

// ─── 3. Build du frontend ───────────────────────────────────────────────────
titre('3. Build du frontend web');
const indexHtml = path.join(BUILD_DIR, 'index.html');
if (!fs.existsSync(indexHtml)) {
  echec(
    `${indexHtml} absent\n` +
      '          exécutez « npm run build » dans Ecole_frontend.'
  );
} else {
  const actifs = fs.existsSync(path.join(BUILD_DIR, 'assets'))
    ? fs.readdirSync(path.join(BUILD_DIR, 'assets')).length
    : 0;
  if (actifs === 0) echec(`${BUILD_DIR}/assets vide ou absent — build incomplet`);
  else ok(`${indexHtml} (+${actifs} actifs)`);
}

// ─── 4. Démarrage réel ──────────────────────────────────────────────────────
if (echecs > 0) {
  conclure();
}

titre('4. Démarrage de l\'application');

const lanceur = choisirLanceur();
if (!lanceur) {
  echec(
    'aucun affichage utilisable — ni DISPLAY/WAYLAND_DISPLAY, ni xvfb-run.\n' +
      '          installez xvfb (« apt-get install -y xvfb ») ou exportez DISPLAY.\n' +
      '          Le démarrage de l\'application n\'a PAS été vérifié.'
  );
  conclure();
}

console.log(`  info    ${lanceur.description}`);

const enfant = spawn(lanceur.commande, lanceur.arguments, {
  cwd: RACINE,
  env: sansRunAsNode(process.env),
  stdio: 'inherit',
});

enfant.on('error', (erreur) => {
  echec(`lancement impossible — ${erreur.message}`);
  conclure();
});

enfant.on('exit', (code, signal) => {
  if (code === 0) ok('la sonde de démarrage a réussi');
  else echec(`la sonde de démarrage a échoué (code=${code} signal=${signal})`);
  conclure();
});

// ─── Utilitaires ────────────────────────────────────────────────────────────

/**
 * `ELECTRON_RUN_AS_NODE` fait démarrer le binaire Electron en simple runtime
 * Node : aucune fenêtre n'est créée. Certains environnements de développement
 * l'exportent globalement, ce qui ferait échouer la sonde pour une raison sans
 * rapport avec l'application.
 */
function sansRunAsNode(source) {
  const env = { ...source };
  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}

function disponible(binaire) {
  return spawnSync('sh', ['-c', `command -v ${binaire}`], { encoding: 'utf8' }).status === 0;
}

function choisirLanceur() {
  const argumentsElectron = ['smoke.js'];

  if (process.env.DISPLAY || process.env.WAYLAND_DISPLAY) {
    return {
      commande: electronPath,
      arguments: argumentsElectron,
      description: `affichage détecté (DISPLAY=${process.env.DISPLAY || '-'} WAYLAND_DISPLAY=${process.env.WAYLAND_DISPLAY || '-'})`,
    };
  }

  if (disponible('xvfb-run')) {
    return {
      commande: 'xvfb-run',
      arguments: ['-a', '--server-args=-screen 0 1280x860x24', electronPath, ...argumentsElectron],
      description: 'aucun affichage — repli sur xvfb-run',
    };
  }

  return null;
}

function conclure() {
  if (echecs === 0) {
    console.log('\nRésultat : OK — installation, démarrage et affichage du frontend vérifiés.');
    process.exit(0);
  }
  console.error(`\nRésultat : ÉCHEC — ${echecs} contrôle(s) en défaut.`);
  process.exit(1);
}
