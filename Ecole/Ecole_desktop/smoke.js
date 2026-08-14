/**
 * École Desktop — Sonde de démarrage
 *
 * Exécutée par Electron (`npm run smoke`, ou via `npm run verify` qui prépare
 * l'affichage). Elle charge le *vrai* processus principal (`main.js`), puis
 * vérifie trois choses que « l'application démarre » ne prouve pas à elle
 * seule :
 *
 *   1. une BrowserWindow est bien créée ;
 *   2. le document principal se charge sans `did-fail-load` ;
 *   3. React a réellement monté — `#root` contient des éléments. Sans ce
 *      dernier point, une fenêtre blanche dont seul le HTML a été servi
 *      passerait pour un succès.
 *
 * Sort avec 0 si tout est vérifié, 1 sinon.
 */

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

require('./main.js');

const DELAI_GLOBAL_MS = Number(process.env.ECOLE_SMOKE_TIMEOUT || 60000);
const DELAI_MONTAGE_MS = Number(process.env.ECOLE_SMOKE_MOUNT_TIMEOUT || 20000);
const CAPTURE = process.env.ECOLE_SMOKE_SCREENSHOT || null;

const erreursRendu = [];
let termine = false;

function sortir(code, message) {
  if (termine) return;
  termine = true;
  console.log(message);
  // `app.exit` court-circuite le `close` de main.js, qui masque la fenêtre au
  // lieu de la fermer.
  app.exit(code);
}

const echeance = setTimeout(() => {
  sortir(1, `[verify] ÉCHEC — délai global de ${DELAI_GLOBAL_MS} ms dépassé`);
}, DELAI_GLOBAL_MS);
echeance.unref?.();

function attendreChargement(webContents) {
  return new Promise((resolve) => {
    if (!webContents.isLoadingMainFrame()) {
      resolve({ ok: true });
      return;
    }
    webContents.once('did-finish-load', () => resolve({ ok: true }));
    webContents.once('did-fail-load', (_e, code, description, url, estPrincipal) => {
      if (estPrincipal) resolve({ ok: false, detail: `${url} → ${code} ${description}` });
    });
  });
}

async function attendreMontage(webContents) {
  const limite = Date.now() + DELAI_MONTAGE_MS;
  let dernier = -1;

  while (Date.now() < limite) {
    try {
      dernier = await webContents.executeJavaScript(
        "(() => { const r = document.getElementById('root'); return r ? r.childElementCount : -1; })()",
        true
      );
    } catch (erreur) {
      dernier = `erreur: ${erreur.message}`;
    }
    if (typeof dernier === 'number' && dernier > 0) return dernier;
    await new Promise((r) => setTimeout(r, 250));
  }

  return dernier;
}

app.whenReady().then(async () => {
  // main.js enregistre son propre `whenReady` avant celui-ci (il est requis
  // plus haut) : la fenêtre existe donc déjà lorsqu'on arrive ici.
  const [fenetre] = BrowserWindow.getAllWindows();

  if (!fenetre) {
    sortir(1, '[verify] ÉCHEC — aucune BrowserWindow créée par main.js');
    return;
  }

  const [largeur, hauteur] = fenetre.getSize();
  console.log(`[verify] fenêtre créée — titre="${fenetre.getTitle()}" taille=${largeur}x${hauteur}`);

  const webContents = fenetre.webContents;

  webContents.on('console-message', (_e, niveau, message, ligne, source) => {
    if (niveau >= 2) {
      const trace = `${message} (${source}:${ligne})`;
      erreursRendu.push(trace);
      console.error(`[rendu] ${trace}`);
    }
  });

  const chargement = await attendreChargement(webContents);
  if (!chargement.ok) {
    sortir(1, `[verify] ÉCHEC — chargement du document impossible : ${chargement.detail}`);
    return;
  }

  const url = webContents.getURL();
  console.log(`[verify] document chargé — ${url}`);

  const enfants = await attendreMontage(webContents);

  if (CAPTURE) {
    // Le premier rendu est souvent le repli `Suspense` : on laisse le temps
    // à la route paresseuse d'arriver avant la capture.
    const repos = Number(process.env.ECOLE_SMOKE_SETTLE || 0);
    if (repos > 0) await new Promise((r) => setTimeout(r, repos));

    try {
      const image = await webContents.capturePage();
      fs.mkdirSync(path.dirname(CAPTURE), { recursive: true });
      fs.writeFileSync(CAPTURE, image.toPNG());
      console.log(`[verify] capture écrite — ${CAPTURE}`);
    } catch (erreur) {
      console.warn(`[verify] capture impossible — ${erreur.message}`);
    }
  }

  if (typeof enfants !== 'number' || enfants <= 0) {
    sortir(
      1,
      `[verify] ÉCHEC — le document est chargé mais #root est vide (${enfants}) : ` +
        `la fenêtre serait blanche.${erreursRendu.length ? ` ${erreursRendu.length} erreur(s) de rendu ci-dessus.` : ''}`
    );
    return;
  }

  console.log(`[verify] React monté — #root contient ${enfants} élément(s)`);
  sortir(0, `[verify] OK — l'application démarre et affiche le frontend (${url})`);
});

app.on('window-all-closed', () => {
  sortir(1, '[verify] ÉCHEC — toutes les fenêtres se sont fermées avant la vérification');
});

process.on('uncaughtException', (erreur) => {
  sortir(1, `[verify] ÉCHEC — exception non interceptée dans le processus principal : ${erreur.stack}`);
});

process.on('unhandledRejection', (raison) => {
  sortir(1, `[verify] ÉCHEC — rejet non intercepté dans le processus principal : ${raison}`);
});
