/**
 * École Desktop — Main Process
 *
 * Wraps the web app in a native window with system tray,
 * auto-updater, and native notifications.
 */

const { app, BrowserWindow, Tray, Menu, Notification, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// ─── Configuration ──────────────────────────────────────────────────────────
const DEV_MODE = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:3000';
const BUILD_DIR = path.join(__dirname, '..', 'Ecole_frontend', 'build');
const ICON_PATH = path.join(__dirname, 'icon.png');

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
    icon: ICON_PATH,
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
    const notif = new Notification({ title, body, icon: ICON_PATH });
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
