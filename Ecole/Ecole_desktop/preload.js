/**
 * École Desktop — Preload Script
 *
 * Exposes limited APIs to the renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Native notifications
  showNotification: (title, body) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  // Platform info
  platform: process.platform,
  isElectron: true,
});
