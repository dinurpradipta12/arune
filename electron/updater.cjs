// Desktop Auto-Updater for Arune Editorial Studio
const { ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

let downloadedInstallerPath = null;
let downloadStream = null;

/**
 * Follows HTTP/HTTPS redirects and pipes to a destination file.
 */
function downloadFileWithProgress(targetUrl, destinationPath, onProgress, onComplete, onError, redirectCount = 0) {
  if (redirectCount > 6) {
    return onError(new Error('Terlalu banyak pengalihan (Too many redirects)'));
  }

  const client = targetUrl.startsWith('https') ? https : http;
  
  const req = client.get(targetUrl, {
    headers: {
      'User-Agent': 'Arune-Editorial-Studio-Desktop-Updater'
    }
  }, (res) => {
    // Handle HTTP Redirects (301, 302, 303, 307, 308)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      const redirectUrl = new URL(res.headers.location, targetUrl).href;
      return downloadFileWithProgress(redirectUrl, destinationPath, onProgress, onComplete, onError, redirectCount + 1);
    }

    if (res.statusCode !== 200) {
      return onError(new Error(`Gagal mengunduh berkas. Kode HTTP: ${res.statusCode}`));
    }

    const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
    let transferredBytes = 0;
    let lastTime = Date.now();
    let bytesSinceLast = 0;
    let currentSpeed = 0;

    const fileStream = fs.createWriteStream(destinationPath);
    downloadStream = res;

    res.on('data', (chunk) => {
      transferredBytes += chunk.length;
      bytesSinceLast += chunk.length;

      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000;
      if (timeDiff >= 0.5) {
        currentSpeed = bytesSinceLast / timeDiff; // bytes/sec
        bytesSinceLast = 0;
        lastTime = now;

        const percent = totalBytes > 0 ? Math.min(100, (transferredBytes / totalBytes) * 100) : 0;
        const transferredMB = (transferredBytes / (1024 * 1024)).toFixed(1);
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
        const speedMBs = (currentSpeed / (1024 * 1024)).toFixed(1);

        onProgress({
          percent: Math.round(percent),
          transferredMB,
          totalMB,
          speedMBs
        });
      }
    });

    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close(() => {
        downloadStream = null;
        onComplete(destinationPath);
      });
    });

    fileStream.on('error', (err) => {
      fs.unlink(destinationPath, () => {});
      downloadStream = null;
      onError(err);
    });
  });

  req.on('error', (err) => {
    downloadStream = null;
    onError(err);
  });
}

/**
 * Compares two semantic version strings (e.g. "1.0.1" vs "1.0.0").
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
function compareSemver(v1, v2) {
  const clean = (v) => v.replace(/^v/, '').split('.').map(Number);
  const p1 = clean(v1);
  const p2 = clean(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Helper to fetch and parse JSON over HTTP/HTTPS with timeout
 */
function fetchJsonWithTimeout(targetUrl, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'Arune-Editorial-Studio-Desktop-Updater',
          'Cache-Control': 'no-cache',
          Accept: 'application/json',
        },
      },
      (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Server merespons kode HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (c) => {
          data += c;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Koneksi waktu habis (Timeout)'));
    });
  });
}

/**
 * Configures Auto-Updater IPC listeners and background checking.
 */
function setupAutoUpdater(mainWindow, app) {
  const currentAppVersion = app.getVersion();

  // 1. Check for Desktop Updates (Directly from Live Deploy & GitHub Commits)
  ipcMain.handle('desktop-check-update', async (_event, clientVersion) => {
    try {
      const liveDeployUrl = 'https://arune.pages.dev/version.json';
      const githubCommitUrl = 'https://api.github.com/repos/dinurpradipta12/arune/commits/main';
      const releaseManifestUrl =
        'https://raw.githubusercontent.com/dinurpradipta12/arune/main/public/desktop-release.json';

      // 1. Fetch live deploy version from Cloudflare Pages
      let liveDeploy = null;
      try {
        liveDeploy = await fetchJsonWithTimeout(`${liveDeployUrl}?t=${Date.now()}`, 4000);
      } catch (e) {
        console.warn('[Updater] Failed to fetch live deploy version:', e.message);
      }

      // 2. Fetch latest commit from GitHub repository
      let latestCommit = null;
      try {
        latestCommit = await fetchJsonWithTimeout(githubCommitUrl, 4000);
      } catch (e) {
        console.warn('[Updater] Failed to fetch github commit:', e.message);
      }

      // 3. Fetch desktop release manifest as fallback
      let manifest = null;
      try {
        manifest = await fetchJsonWithTimeout(`${releaseManifestUrl}?t=${Date.now()}`, 3500);
      } catch (e) {}

      // Current running client version
      const activeRunningVersion = clientVersion || currentAppVersion || '1.0.0';

      // Determine latest version identifier
      const latestSha = latestCommit?.sha ? latestCommit.sha.substring(0, 7) : '';
      const deployVersion = liveDeploy?.version || latestSha || manifest?.version || '1.0.0';

      // Check if the running client already has this commit or deploy version
      const cleanRunning = String(activeRunningVersion).trim().toLowerCase();
      const isAlreadyOnLatestCommit = Boolean(
        latestSha && cleanRunning.includes(latestSha.toLowerCase())
      );
      const isAlreadyOnLatestDeploy = Boolean(
        liveDeploy?.version &&
          cleanRunning === String(liveDeploy.version).trim().toLowerCase()
      );

      let hasUpdate = false;

      // If client is already running the latest commit or deploy build, NO update is needed
      if (isAlreadyOnLatestCommit || isAlreadyOnLatestDeploy) {
        hasUpdate = false;
      } else if (latestSha && !cleanRunning.includes(latestSha.toLowerCase())) {
        hasUpdate = true;
      } else if (
        liveDeploy?.version &&
        cleanRunning !== String(liveDeploy.version).toLowerCase()
      ) {
        hasUpdate = true;
      } else if (
        manifest?.version &&
        compareSemver(manifest.version, currentAppVersion) > 0
      ) {
        hasUpdate = true;
      }

      const changelog =
        latestCommit?.commit?.message ||
        manifest?.changelog ||
        'Pembaruan fitur editorial, perbaikan hover icon toolbar, elemen shape baru, dan sinkronisasi live deploy.';

      const releaseDate =
        latestCommit?.commit?.committer?.date ||
        liveDeploy?.builtAt ||
        manifest?.releaseDate ||
        new Date().toISOString();

      const isMac = process.platform === 'darwin';
      const downloadUrl = isMac
        ? (manifest?.mac?.url || 'https://github.com/dinurpradipta12/arune/releases')
        : (manifest?.win?.url || '');

      // Extract clean semver version (e.g. "1.0.1") to display to users
      const semverVersion = manifest?.version || currentAppVersion || '1.0.1';

      return {
        hasUpdate,
        currentVersion: semverVersion,
        latestVersion: semverVersion,
        buildId: activeRunningVersion,
        latestBuildId: latestSha || deployVersion,
        changelog,
        releaseDate,
        downloadUrl,
        isLiveDeploy: true,
      };
    } catch (err) {
      return {
        hasUpdate: false,
        currentVersion: currentAppVersion || '1.0.1',
        latestVersion: currentAppVersion || '1.0.1',
        error: err.message,
      };
    }
  });

  // 1b. Reload to latest live deploy without reinstalling DMG
  ipcMain.handle('desktop-reload-latest', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        await mainWindow.webContents.session.clearCache();
        mainWindow.loadURL('https://arune.pages.dev');
        return { success: true };
      } catch (err) {
        mainWindow.webContents.reloadIgnoringCache();
        return { success: true };
      }
    }
    return { success: false, error: 'Window tidak tersedia.' };
  });

  // 2. Start Download Update
  ipcMain.handle('desktop-start-download', async (_event, customUrl) => {
    try {
      const isMac = process.platform === 'darwin';
      const extension = isMac ? '.dmg' : '.exe';
      const destinationPath = path.join(app.getPath('temp'), `Arune-Editorial-Studio-Update${extension}`);

      // Delete existing temporary installer if present
      if (fs.existsSync(destinationPath)) {
        try { fs.unlinkSync(destinationPath); } catch {}
      }

      downloadFileWithProgress(
        customUrl,
        destinationPath,
        (progress) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('desktop-download-progress', progress);
          }
        },
        (savedPath) => {
          downloadedInstallerPath = savedPath;
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('desktop-download-complete', {
              path: savedPath
            });
          }
        },
        (error) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('desktop-download-error', error.message);
          }
        }
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 3. Install and Relaunch
  ipcMain.handle('desktop-install-relaunch', async () => {
    if (!downloadedInstallerPath || !fs.existsSync(downloadedInstallerPath)) {
      return { success: false, error: 'Berkas installer tidak ditemukan atau belum selesai diunduh.' };
    }

    const isMac = process.platform === 'darwin';

    if (isMac) {
      // macOS: Attach DMG silently, replace /Applications/Arune Editorial Studio.app, and relaunch
      const dmgPath = downloadedInstallerPath;
      const helperScript = `
        sleep 1.2
        MOUNT_DIR=$(hdiutil attach "${dmgPath}" -nobrowse -readonly 2>/dev/null | grep -o '/Volumes/.*' | head -n 1)
        if [ -n "$MOUNT_DIR" ] && [ -d "$MOUNT_DIR/Arune Editorial Studio.app" ]; then
          rm -rf "/Applications/Arune Editorial Studio.app" 2>/dev/null || true
          cp -R "$MOUNT_DIR/Arune Editorial Studio.app" "/Applications/" 2>/dev/null || true
          hdiutil detach "$MOUNT_DIR" -force 2>/dev/null || true
          open "/Applications/Arune Editorial Studio.app"
        else
          open "${dmgPath}"
        fi
      `;

      const child = spawn('bash', ['-c', helperScript], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      // Quit current running app to allow replacement
      setTimeout(() => {
        app.quit();
      }, 300);

      return { success: true };
    } else {
      // Windows: launch installer executable and quit
      const child = spawn(downloadedInstallerPath, [], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      setTimeout(() => {
        app.quit();
      }, 300);

      return { success: true };
    }
  });

  // 4. Automatic background check 7 seconds after window opens
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('desktop-trigger-auto-check');
    }
  }, 7000);
}

module.exports = {
  setupAutoUpdater
};
