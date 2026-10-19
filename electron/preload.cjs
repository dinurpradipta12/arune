// Preload script for Arune Editorial Studio Desktop App
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aruneDesktop', {
  platform: process.platform,
  isDesktop: true,
  version: '1.0.0',
});
