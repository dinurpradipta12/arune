import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { isDesktopApp } from '../../utils/platform';
import { studioLogo } from '../../assets/branding';
import { useStudioStore } from '../../store/useStudioStore';

interface DesktopUpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  changelog: string;
  releaseDate?: string;
  downloadUrl?: string;
}

interface DownloadProgress {
  percent: number;
  transferredMB: string;
  totalMB: string;
  speedMBs: string;
}

export const DesktopUpdateModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<DesktopUpdateInfo | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
  >('idle');
  const [progress, setProgress] = useState<DownloadProgress>({
    percent: 0,
    transferredMB: '0',
    totalMB: '0',
    speedMBs: '0',
  });
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [applyingLive, setApplyingLive] = useState(false);

  const checkForUpdates = async (isManual = false) => {
    if (!isDesktopApp() || typeof window === 'undefined') return;
    const desktop = (window as any).aruneDesktop;
    if (!desktop?.checkForUpdates) return;

    if (isManual) {
      setStatus('checking');
      setIsOpen(true);
    }

    try {
      const currentBuild =
        typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
      const res: DesktopUpdateInfo = await desktop.checkForUpdates(currentBuild);
      if (res && res.hasUpdate) {
        const dismissedKey = `arune_dismissed_update_${res.latestVersion}`;
        if (!isManual && sessionStorage.getItem(dismissedKey) === 'true') {
          return;
        }
        setUpdateInfo(res);
        setStatus('available');
        setIsOpen(true);
      } else if (isManual) {
        setUpdateInfo(res);
        setStatus('idle');
      }
    } catch (err: any) {
      if (isManual) {
        setStatus('error');
        setErrorMessage(err?.message || 'Gagal memeriksa pembaruan.');
      }
    }
  };

  const handleApplyLiveDeploy = async () => {
    setApplyingLive(true);
    try {
      const desktop = (window as any).aruneDesktop;
      if (desktop?.reloadLatest) {
        await desktop.reloadLatest();
      } else {
        window.location.reload();
      }
    } catch (e: any) {
      window.location.reload();
    }
  };

  const handleDismissModal = () => {
    if (updateInfo?.latestVersion) {
      try {
        sessionStorage.setItem(
          `arune_dismissed_update_${updateInfo.latestVersion}`,
          'true'
        );
      } catch {}
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isDesktopApp() || typeof window === 'undefined') return;
    const desktop = (window as any).aruneDesktop;
    if (!desktop) return;

    // Listen to background auto-check trigger from main process
    const unbindAutoCheck = desktop.onTriggerAutoCheck?.(() => {
      checkForUpdates(false);
    });

    // Listen to download progress
    const unbindProgress = desktop.onDownloadProgress?.(
      (data: DownloadProgress) => {
        setProgress(data);
        setStatus('downloading');
      }
    );

    // Listen to download complete
    const unbindComplete = desktop.onDownloadComplete?.(() => {
      setStatus('downloaded');
    });

    // Listen to download error
    const unbindError = desktop.onDownloadError?.((err: string) => {
      setStatus('error');
      setErrorMessage(err || 'Terjadi kesalahan saat mengunduh pembaruan.');
    });

    // Custom window event for manual check from Settings
    const handleManualTrigger = () => checkForUpdates(true);
    window.addEventListener('check-desktop-update-manual', handleManualTrigger);

    // Perform an initial check after 5s
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (unbindAutoCheck) unbindAutoCheck();
      if (unbindProgress) unbindProgress();
      if (unbindComplete) unbindComplete();
      if (unbindError) unbindError();
      window.removeEventListener(
        'check-desktop-update-manual',
        handleManualTrigger
      );
    };
  }, []);

  const handleStartDownload = async () => {
    if (!updateInfo?.downloadUrl) {
      setStatus('error');
      setErrorMessage('Tautan unduhan tidak tersedia untuk versi ini.');
      return;
    }

    const desktop = (window as any).aruneDesktop;
    if (!desktop?.startDownloadUpdate) return;

    setStatus('downloading');
    setProgress({
      percent: 0,
      transferredMB: '0',
      totalMB: '0',
      speedMBs: '0',
    });

    try {
      const res = await desktop.startDownloadUpdate(updateInfo.downloadUrl);
      if (!res.success) {
        setStatus('error');
        setErrorMessage(res.error || 'Gagal memulai unduhan.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleInstallAndRelaunch = async () => {
    const desktop = (window as any).aruneDesktop;
    if (!desktop?.installAndRelaunch) return;

    try {
      await desktop.installAndRelaunch();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Gagal memasang pembaruan.');
    }
  };

  const { workspaceDarkMode } = useStudioStore();
  const isDark = workspaceDarkMode;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-colors ${
          isDark
            ? 'bg-[#090f1e] text-slate-100 border-slate-800'
            : 'bg-white text-zinc-900 border-zinc-200 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark
              ? 'bg-[#0c1324] border-slate-800/90'
              : 'bg-zinc-50/80 border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={studioLogo}
              alt="Logo"
              className="w-8 h-8 object-contain rounded-lg shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-sm font-bold tracking-tight ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  Pembaruan Studio
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  v{updateInfo?.latestVersion || '1.0.0'}
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                Versi saat ini: v{updateInfo?.currentVersion || '1.0.0'}
              </p>
            </div>
          </div>

          {status !== 'downloading' && (
            <button
              type="button"
              onClick={handleDismissModal}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Status: Checking */}
          {status === 'checking' && (
            <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p
                className={`text-xs font-medium ${
                  isDark ? 'text-zinc-300' : 'text-zinc-600'
                }`}
              >
                Memeriksa rilis terbaru...
              </p>
            </div>
          )}

          {/* Status: No Update (Idle after manual check) */}
          {status === 'idle' && (
            <div className="py-5 flex flex-col items-center justify-center gap-2.5 text-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              <h4
                className={`text-sm font-semibold ${
                  isDark ? 'text-zinc-100' : 'text-zinc-900'
                }`}
              >
                Aplikasi Sudah Menggunakan Versi Terbaru
              </h4>
              <p
                className={`text-xs max-w-xs ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                Anda sudah berada di versi v
                {updateInfo?.currentVersion || '1.0.0'}. Tidak ada pembaruan
                yang diperlukan.
              </p>
            </div>
          )}

          {/* Status: Update Available */}
          {status === 'available' && (
            <div className="space-y-3.5">
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark
                    ? 'bg-blue-950/40 border-blue-800/50'
                    : 'bg-blue-50/80 border-blue-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-2 text-xs font-semibold ${
                      isDark ? 'text-blue-400' : 'text-blue-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Fitur & Perbaikan Baru Tersedia</span>
                  </div>
                  {updateInfo?.releaseDate && (
                    <span
                      className={`text-[10px] font-mono ${
                        isDark ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      {new Date(updateInfo.releaseDate).toLocaleDateString(
                        'id-ID',
                        {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs leading-relaxed font-medium ${
                    isDark ? 'text-zinc-200' : 'text-zinc-800'
                  }`}
                >
                  {updateInfo?.changelog ||
                    'Pembaruan performa, perbaikan logo resolusi tinggi, dan safe-area tombol kontrol Mac.'}
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border text-[11.5px] space-y-1 ${
                  isDark
                    ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              >
                <div
                  className={`font-semibold flex items-center gap-1.5 ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Instant Live Update (Tanpa Unduh Ulang 144MB)</span>
                </div>
                <p
                  className={`text-[11px] leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  Cukup klik tombol{' '}
                  <strong>Terapkan Pembaruan Sekarang</strong> untuk memuat hasil
                  deploy terbaru secara langsung ke dalam aplikasi desktop.
                </p>
              </div>
            </div>
          )}

          {/* Status: Downloading Progress */}
          {status === 'downloading' && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-semibold flex items-center gap-2 ${
                    isDark ? 'text-zinc-200' : 'text-zinc-800'
                  }`}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Sedang Mengunduh Paket Pembaruan...</span>
                </span>
                <span
                  className={`font-mono font-bold ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {progress.percent}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div
                className={`w-full h-2.5 rounded-full overflow-hidden relative ${
                  isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                }`}
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, progress.percent)}%` }}
                />
              </div>

              <div
                className={`flex items-center justify-between text-[11px] font-mono ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                <span>
                  {progress.transferredMB} MB / {progress.totalMB || '...'} MB
                </span>
                <span>{progress.speedMBs} MB/s</span>
              </div>
            </div>
          )}

          {/* Status: Downloaded - Ready to Install & Relaunch */}
          {status === 'downloaded' && (
            <div className="space-y-3 py-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4
                  className={`text-sm font-bold ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  Pembaruan Siap Dipasang!
                </h4>
                <p
                  className={`text-xs mt-1 max-w-xs mx-auto ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  Unduhan telah selesai. Klik tombol di bawah untuk memasang dan
                  membuka ulang aplikasi secara otomatis.
                </p>
              </div>
            </div>
          )}

          {/* Status: Error */}
          {status === 'error' && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                isDark
                  ? 'bg-red-950/30 border-red-900/40 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div>
                <div
                  className={`font-semibold ${
                    isDark ? 'text-red-200' : 'text-red-800'
                  }`}
                >
                  Gagal Memproses Pembaruan
                </div>
                <div className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                  {errorMessage}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t flex items-center justify-end gap-2.5 ${
            isDark
              ? 'bg-[#0c1324] border-slate-800/90'
              : 'bg-zinc-50/80 border-zinc-200'
          }`}
        >
          {status === 'available' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDismissModal}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                Nanti Saja
              </button>

              {updateInfo?.downloadUrl && (
                <button
                  type="button"
                  onClick={handleStartDownload}
                  title="Unduh Berkas Installer DMG Fisik (144MB)"
                  className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 shadow-xs'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh DMG</span>
                </button>
              )}

              <button
                type="button"
                disabled={applyingLive}
                onClick={handleApplyLiveDeploy}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/30 cursor-pointer transition-all disabled:opacity-50"
              >
                {applyingLive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Terapkan Pembaruan Sekarang</span>
              </button>
            </div>
          )}

          {status === 'downloaded' && (
            <button
              type="button"
              onClick={handleInstallAndRelaunch}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Pasang & Relaunch Aplikasi</span>
            </button>
          )}

          {status === 'idle' && (
            <button
              type="button"
              onClick={handleDismissModal}
              className={`px-4 py-2 rounded-xl font-semibold text-xs cursor-pointer transition-colors ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200'
              }`}
            >
              Tutup
            </button>
          )}

          {status === 'error' && (
            <>
              <button
                type="button"
                onClick={handleDismissModal}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => checkForUpdates(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
