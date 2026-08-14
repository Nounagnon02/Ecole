/**
 * École Desktop — Main Process
 *
 * Wraps the web app in a native window with system tray,
 * auto-updater, and native notifications.
 */

const { app, BrowserWindow, Tray, Menu, Notification, nativeImage, ipcMain, shell, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// ─── Configuration ──────────────────────────────────────────────────────────
const DEV_MODE = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:3000';

// En développement le contenu vient du serveur Vite ; en production il est
// servi depuis le build du frontend web par le protocole `ecole://` déclaré
// plus bas. `__dirname/..` désigne le dossier parent du processus principal :
// `Ecole/` en dépôt, `resources/` dans un paquet electron-builder (où
// `extraResources` recopie le build au même emplacement relatif).
const BUILD_DIR = path.join(__dirname, '..', 'Ecole_frontend', 'build');
const SCHEME_APP = 'ecole';
const APP_URL = `${SCHEME_APP}://app/`;

const ICON_PATH = path.join(__dirname, 'icon.png');
// `nativeImage.createFromPath` ne lève pas sur fichier absent : elle renvoie
// une image vide, et c'est `new Tray(...)` qui plante ensuite. On teste donc
// la présence du fichier plutôt que de se fier à l'appel.
const HAS_ICON = fs.existsSync(ICON_PATH);

let mainWindow = null;
let tray = null;

// ─── Protocole applicatif ───────────────────────────────────────────────────
//
// Le build Vite référence ses actifs en chemins absolus (`/assets/…`) et le
// routeur est un `createBrowserRouter`. Chargé par `loadFile()`, donc sous
// `file://`, `/assets/index-*.js` se résout en `file:///assets/index-*.js` :
// tous les scripts renvoient 404 et la fenêtre reste blanche. On sert donc le
// build sous une vraie origine, ce qui rétablit à la fois les chemins absolus,
// l'History API du routeur, `localStorage` et le contexte sécurisé.
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME_APP,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

const TYPES_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
};

async function estFichier(chemin) {
  try {
    return (await fs.promises.stat(chemin)).isFile();
  } catch {
    return false;
  }
}

function enregistrerProtocoleApp() {
  protocol.handle(SCHEME_APP, async (requete) => {
    let demande;
    try {
      demande = decodeURIComponent(new URL(requete.url).pathname);
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    const cible = path.normalize(path.join(BUILD_DIR, demande));

    // Sans cette borne, `ecole://app/../../../etc/passwd` sortirait du build.
    if (cible !== BUILD_DIR && !cible.startsWith(BUILD_DIR + path.sep)) {
      return new Response('Forbidden', { status: 403 });
    }

    let fichier = cible;
    if (!(await estFichier(fichier))) {
      // Une route du SPA (`/dashboard`) n'a pas d'extension : on renvoie la
      // coquille. Un actif manquant, lui, doit rester un 404 — sinon le
      // navigateur reçoit du HTML là où il attend du JavaScript.
      if (path.extname(demande)) {
        return new Response('Not Found', { status: 404 });
      }
      fichier = path.join(BUILD_DIR, 'index.html');
      if (!(await estFichier(fichier))) {
        return new Response('Not Found', { status: 404 });
      }
    }

    try {
      const contenu = await fs.promises.readFile(fichier);
      return new Response(contenu, {
        headers: { 'Content-Type': TYPES_MIME[path.extname(fichier).toLowerCase()] || 'application/octet-stream' },
      });
    } catch (erreur) {
      console.error(`[protocole] lecture impossible : ${fichier} — ${erreur.message}`);
      return new Response('Internal Server Error', { status: 500 });
    }
  });
}

// ─── Origines autorisées ────────────────────────────────────────────────────
//
// `ECOLE_API_URL` est facultative. Elle n'est plus la seule source d'origines :
// l'origine interne (Vite en développement, `ecole://app` en production) est
// toujours présente, sinon l'ensemble se retrouvait vide en production et
// `will-navigate` renvoyait toute navigation applicative vers le navigateur
// système. Une valeur mal formée n'est plus fatale non plus : `new URL()`
// levait au milieu de `createWindow()`, l'application démarrait alors sans
// jamais afficher de fenêtre.
function origineDe(valeur, etiquette) {
  if (!valeur) return null;
  try {
    return new URL(valeur).origin;
  } catch {
    console.warn(`[navigation] ${etiquette} ignorée : « ${valeur} » n'est pas une URL absolue`);
    return null;
  }
}

function originesAutorisees() {
  const origines = new Set([new URL(DEV_MODE ? DEV_URL : APP_URL).origin]);
  const api = origineDe(process.env.ECOLE_API_URL, 'ECOLE_API_URL');
  if (api) origines.add(api);
  return origines;
}

// ─── Window ─────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'École — Gestion Scolaire',
    ...(HAS_ICON ? { icon: ICON_PATH } : {}),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const CIBLE = DEV_MODE ? DEV_URL : APP_URL;

  // ─── Journal de chargement ────────────────────────────────────────────
  //
  // Un échec de chargement laissait une fenêtre blanche muette : ni le
  // développeur ni la vérification automatisée (`npm run verify`) ne pouvaient
  // distinguer « chargé » de « chargé mais vide ».
  mainWindow.webContents.on('did-finish-load', () => {
    console.log(`[chargement] terminé — ${mainWindow.webContents.getURL()}`);
  });

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url, estPrincipal) => {
    if (!estPrincipal) return;
    console.error(`[chargement] échec — ${url} (${code} ${description})`);
  });

  // ─── Gardes de navigation ─────────────────────────────────────────────
  //
  // Sans ces deux garde-fous, un lien (ou une injection dans le contenu
  // affiché) pouvait faire naviguer la fenêtre applicative vers un site
  // arbitraire, ou ouvrir une fenêtre Electron non sandboxée (audit S23).
  const ORIGINES_AUTORISEES = originesAutorisees();

  // Les liens externes partent dans le navigateur système, jamais dans l'app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // `new URL()` levait ici sur une cible non absolue (`window.open('foo')`),
    // et l'exception remontait dans le moteur de rendu.
    let protocole = null;
    try {
      protocole = new URL(url).protocol;
    } catch {
      console.warn(`[navigation] ouverture refusée, URL illisible : ${url}`);
    }

    if (protocole === 'http:' || protocole === 'https:') {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // La navigation interne reste cantonnée aux origines connues.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    let cible = null;
    try {
      cible = new URL(url);
    } catch {
      event.preventDefault();
      return;
    }

    if (ORIGINES_AUTORISEES.has(cible.origin)) {
      return;
    }

    event.preventDefault();
    if (cible.protocol === 'http:' || cible.protocol === 'https:') {
      shell.openExternal(url);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    // Sans zone de notification, empêcher la fermeture rendait la fenêtre
    // impossible à quitter : plus aucun point de sortie n'existait.
    if (!app.isQuitting && tray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.loadURL(CIBLE);
}

// ─── System Tray ────────────────────────────────────────────────────────────
function createTray() {
  if (!HAS_ICON) {
    // Sans icône, `new Tray()` lève et emporte le démarrage de l'application.
    // On se passe de l'icône de zone de notification plutôt que de crasher.
    console.warn(`[tray] icône absente (${ICON_PATH}) — zone de notification désactivée`);
    return;
  }

  // Un fichier présent mais illisible, ou un environnement sans zone de
  // notification, fait encore lever `new Tray()`. L'échec ne doit pas
  // emporter le démarrage de la fenêtre principale.
  try {
    const icon = nativeImage.createFromPath(ICON_PATH);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('École — Gestion Scolaire');

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Ouvrir', click: () => mainWindow?.show() },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow?.show());
  } catch (erreur) {
    tray = null;
    console.warn(`[tray] zone de notification indisponible — ${erreur.message}`);
  }
}

// ─── Native Notifications ───────────────────────────────────────────────────
ipcMain.handle('show-notification', (_, { title, body }) => {
  if (Notification.isSupported()) {
    const notif = new Notification({ title, body, ...(HAS_ICON ? { icon: ICON_PATH } : {}) });
    notif.on('click', () => mainWindow?.show());
    notif.show();
  }
});

// ─── App Lifecycle ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (!DEV_MODE) {
    if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
      // Diagnostic explicite : sans le build du frontend, la fenêtre
      // s'ouvrirait sur un 404 sans indiquer quoi faire.
      console.error(
        `[démarrage] build du frontend introuvable : ${BUILD_DIR}\n` +
          "            lancez « npm run build » dans Ecole_frontend."
      );
    }
    enregistrerProtocoleApp();
  }

  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
