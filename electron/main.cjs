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
    // Initialize Auto-Updater IPC
    try {
      const { setupAutoUpdater } = require('./updater.cjs');
      setupAutoUpdater(mainWindow, app);
    } catch (e) {
      console.error('Failed to initialize auto-updater:', e);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// macOS dock and window lifecycle
app.whenReady().then(() => {
  const { session } = require('electron');

  // Explicitly permit local-fonts / font-access in Electron
  if (session && session.defaultSession) {
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'local-fonts' || permission === 'font-access') {
        callback(true);
        return;
      }
      callback(true);
    });

    if (typeof session.defaultSession.setPermissionCheckHandler === 'function') {
      session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
        if (permission === 'local-fonts' || permission === 'font-access') {
          return true;
        }
        return true;
      });
    }
  }

  // Register Native System Fonts IPC Scanner for macOS & Desktop
  ipcMain.handle('desktop-get-system-fonts', async () => {
    try {
      const fs = require('fs');
      const fontDirs =
        process.platform === 'darwin'
          ? [
              '/System/Library/Fonts',
              '/System/Library/Fonts/Supplemental',
              '/Library/Fonts',
              path.join(app.getPath('home'), 'Library/Fonts'),
            ]
          : process.platform === 'win32'
          ? [
              'C:\\Windows\\Fonts',
              path.join(app.getPath('home'), 'AppData\\Local\\Microsoft\\Windows\\Fonts'),
            ]
          : ['/usr/share/fonts', '/usr/local/share/fonts', path.join(app.getPath('home'), '.fonts')];

      const fontFamilies = new Set();
      for (const dir of fontDirs) {
        if (fs.existsSync(dir)) {
          try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              if (/\.(ttf|otf|ttc|dfont)$/i.test(file)) {
                const base = path.basename(file, path.extname(file));
                const clean = base
                  .replace(/[-_](Regular|Bold|Italic|Medium|Light|SemiBold|Thin|Black|Heavy|Display|Text|UI).*$/i, '')
                  .replace(/[-_]/g, ' ')
                  .trim();
                if (clean && clean.length > 1) {
                  fontFamilies.add(clean);
                }
              }
            }
          } catch {
            // Ignore directory read errors
          }
        }
      }
      return Array.from(fontFamilies).sort((a, b) => a.localeCompare(b));
    } catch (e) {
      console.error('Failed to get system fonts:', e);
      return [];
    }
  });

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

