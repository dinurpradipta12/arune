import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

/**
 * UpdateNotifier
 * --------------
 * Detects when a newer build has been deployed (e.g. after push → Cloudflare
 * Pages auto-deploy) and asks the user to refresh.
 *
 * How it works:
 * - The running bundle knows its own version via __APP_VERSION__.
 * - Every deploy emits /version.json with the new version id.
 * - We poll /version.json (no-cache) every 60s, when the tab regains focus,
 *   and when the network comes back online.
 * - If the remote version differs, a popup appears with a "Refresh" button.
 *
 * Disabled in dev mode (Vite HMR already handles live updates there).
 */

const POLL_INTERVAL_MS = 60_000;
const SNOOZE_MS = 10 * 60_000;

interface RemoteVersion {
  version: string;
  builtAt?: string;
}

const currentVersion =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

async function fetchRemoteVersion(): Promise<RemoteVersion | null> {
  try {
    const targetUrl =
      typeof window !== 'undefined' && window.location.origin.startsWith('http')
        ? `${window.location.origin}/version.json?t=${Date.now()}`
        : `https://arune.pages.dev/version.json?t=${Date.now()}`;

    const res = await fetch(targetUrl, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RemoteVersion;
    return data && typeof data.version === 'string' ? data : null;
  } catch {
    return null;
  }
}

export const UpdateNotifier: React.FC<{ darkMode?: boolean }> = ({
  darkMode = false,
}) => {
  const [remote, setRemote] = useState<RemoteVersion | null>(null);
  const [visible, setVisible] = useState(false);
  const [reloading, setReloading] = useState(false);
  const snoozedUntil = useRef(0);
  const detectedVersion = useRef<string | null>(null);

  const check = useCallback(async () => {
    if (import.meta.env.DEV) return;
    const data = await fetchRemoteVersion();
    if (!data || data.version === currentVersion) return;

    // A new build is live.
    if (detectedVersion.current !== data.version) {
      detectedVersion.current = data.version;
      snoozedUntil.current = 0; // a newer version overrides an earlier snooze
    }
    setRemote(data);
    if (Date.now() >= snoozedUntil.current) setVisible(true);
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    const initial = window.setTimeout(check, 5_000);
    const interval = window.setInterval(check, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    window.addEventListener('online', check);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      window.removeEventListener('online', check);
    };
  }, [check]);

  const handleRefresh = async () => {
    setReloading(true);
    try {
      // Clear any Cache Storage entries so the new bundle is fetched fresh.
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update().catch(() => undefined)));
      }
      if (typeof window !== 'undefined' && (window as any).aruneDesktop?.reloadLatest) {
        await (window as any).aruneDesktop.reloadLatest();
        return;
      }
    } catch {
      /* non-fatal */
    }
    window.location.reload();
  };

  const handleLater = () => {
    snoozedUntil.current = Date.now() + SNOOZE_MS;
    setVisible(false);
  };

  if (!visible || !remote) return null;

  const builtAtLabel = remote.builtAt
    ? new Date(remote.builtAt).toLocaleString()
    : null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-labelledby="update-notifier-title"
      className="fixed bottom-5 right-5 z-[10000] w-[340px] max-w-[calc(100vw-2.5rem)] animate-[updateSlideIn_0.35s_ease-out]"
    >
      <div
        className={`rounded-2xl border shadow-2xl overflow-hidden ${
          darkMode
            ? 'bg-[#0b1324] border-[#1e2b4a] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900" />
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="update-notifier-title"
                className="text-sm font-semibold leading-tight"
              >
                Pembaruan Tersedia
              </h2>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Versi terbaru Arune Carousel Studio sudah dirilis. Muat ulang
                halaman untuk menggunakan fitur & perbaikan terbaru.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLater}
              aria-label="Tutup notifikasi"
              className={`p-1 rounded-md cursor-pointer ${
                darkMode
                  ? 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            className={`text-[10.5px] font-mono rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 ${
              darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'
            }`}
          >
            <span className="truncate">
              {currentVersion.split('-')[0]} → {remote.version.split('-')[0]}
            </span>
            {builtAtLabel && <span className="shrink-0">{builtAtLabel}</span>}
          </div>

          <p
            className={`text-[10.5px] ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Simpan project Anda terlebih dahulu jika ada perubahan yang belum
            tersimpan.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLater}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                darkMode
                  ? 'border-[#1e2b4a] text-slate-300 hover:bg-white/5'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Nanti
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={reloading}
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-70"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`}
              />
              <span>{reloading ? 'Memuat ulang...' : 'Refresh Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
