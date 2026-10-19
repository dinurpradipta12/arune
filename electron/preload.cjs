// Preload script for Arune Editorial Studio Desktop App
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aruneDesktop', {
  platform: process.platform,
  isDesktop: true,
  version: '1.0.0',

  // Auto-Updater API
  checkForUpdates: () => ipcRenderer.invoke('desktop-check-update'),
  startDownloadUpdate: (downloadUrl) => ipcRenderer.invoke('desktop-start-download', downloadUrl),
  installAndRelaunch: () => ipcRenderer.invoke('desktop-install-relaunch'),

  // System Fonts API
  getSystemFonts: () => ipcRenderer.invoke('desktop-get-system-fonts'),

  onDownloadProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('desktop-download-progress', listener);
    return () => ipcRenderer.removeListener('desktop-download-progress', listener);
  },

  onDownloadComplete: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('desktop-download-complete', listener);
    return () => ipcRenderer.removeListener('desktop-download-complete', listener);
  },

  onDownloadError: (callback) => {
    const listener = (_event, error) => callback(error);
    ipcRenderer.on('desktop-download-error', listener);
    return () => ipcRenderer.removeListener('desktop-download-error', listener);
  },

  onTriggerAutoCheck: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('desktop-trigger-auto-check', listener);
    return () => ipcRenderer.removeListener('desktop-trigger-auto-check', listener);
  },
});
