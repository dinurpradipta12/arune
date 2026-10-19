// Electron Main Process for Arune Editorial Studio (Standalone Desktop App)
const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Arune Editorial Studio',
    icon: path.join(__dirname, '../build/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 14 } : undefined,
    backgroundColor: '#09090b', // zinc-950
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:')) {
      shell.openExternal(targetUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else if (isDev && !process.env.SERVE_DIST) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      // If dev server not running, fall back to dist/index.html
      const distPath = path.join(__dirname, '../dist/index.html');
      mainWindow.loadFile(distPath);
    });
  } else {
    const distPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(distPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// macOS dock and window lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
