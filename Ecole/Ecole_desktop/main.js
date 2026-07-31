/**
 * École Desktop — Main Process
 *
 * Wraps the web app in a native window with system tray,
 * auto-updater, and native notifications.
 */

const { app, BrowserWindow, Tray, Menu, Notification, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// ─── Configuration ──────────────────────────────────────────────────────────
const DEV_MODE = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:3000';
const BUILD_DIR = path.join(__dirname, '..', 'Ecole_frontend', 'build');
const ICON_PATH = path.join(__dirname, 'icon.png');
// `nativeImage.createFromPath` ne lève pas sur fichier absent : elle renvoie
// une image vide, et c'est `new Tray(...)` qui plante ensuite. On teste donc
// la présence du fichier plutôt que de se fier à l'appel.
const HAS_ICON = fs.existsSync(ICON_PATH);

let mainWindow = null;
let tray = null;

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

  // Load the app
  if (DEV_MODE) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(BUILD_DIR, 'index.html'));
  }

  // ─── Gardes de navigation ─────────────────────────────────────────────
  //
  // Sans ces deux garde-fous, un lien (ou une injection dans le contenu
  // affiché) pouvait faire naviguer la fenêtre applicative vers un site
  // arbitraire, ou ouvrir une fenêtre Electron non sandboxée (audit S23).
  const ORIGINES_AUTORISEES = new Set(
    [DEV_MODE ? DEV_URL : null, process.env.ECOLE_API_URL]
      .filter(Boolean)
      .map((u) => new URL(u).origin)
  );

  // Les liens externes partent dans le navigateur système, jamais dans l'app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:$/.test(new URL(url).protocol)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // La navigation interne reste cantonnée aux origines connues.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const cible = new URL(url);

    if (cible.protocol === 'file:' || ORIGINES_AUTORISEES.has(cible.origin)) {
      return;
    }

    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ─── System Tray ────────────────────────────────────────────────────────────
function createTray() {
  if (!HAS_ICON) {
    // Sans icône, `new Tray()` lève et emporte le démarrage de l'application.
    // On se passe de l'icône de zone de notification plutôt que de crasher.
    console.warn(`[tray] icône absente (${ICON_PATH}) — zone de notification désactivée`);
    return;
  }

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
