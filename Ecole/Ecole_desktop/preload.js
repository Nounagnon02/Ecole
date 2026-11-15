/**
 * École Desktop — Preload Script
 *
 * Exposes limited APIs to the renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Adresse de l'API passée par main.js (ECOLE_API_URL) ; null si absente.
const argApi = process.argv.find((a) => a.startsWith('--ecole-api-url='));
const apiUrl = argApi ? argApi.slice('--ecole-api-url='.length) : null;

contextBridge.exposeInMainWorld('electronAPI', {
  // Native notifications
  showNotification: (title, body) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  // Platform info
  platform: process.platform,
  isElectron: true,
  apiUrl,
});
