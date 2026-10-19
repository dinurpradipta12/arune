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

  const checkForUpdates = async (isManual = false) => {
    if (!isDesktopApp() || typeof window === 'undefined') return;
    const desktop = (window as any).aruneDesktop;
    if (!desktop?.checkForUpdates) return;

    if (isManual) {
      setStatus('checking');
      setIsOpen(true);
    }

    try {
      const res: DesktopUpdateInfo = await desktop.checkForUpdates();
      if (res && res.hasUpdate) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <img
              src={studioLogo}
              alt="Logo"
              className="w-8 h-8 object-contain rounded-lg shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  Pembaruan Studio
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-900/50 font-semibold">
                  v{updateInfo?.latestVersion || '1.0.0'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Versi saat ini: v{updateInfo?.currentVersion || '1.0.0'}
              </p>
            </div>
          </div>

          {status !== 'downloading' && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
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
              <p className="text-xs text-zinc-300 font-medium">
                Memeriksa rilis terbaru...
              </p>
            </div>
          )}

          {/* Status: No Update (Idle after manual check) */}
          {status === 'idle' && (
            <div className="py-5 flex flex-col items-center justify-center gap-2.5 text-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              <h4 className="text-sm font-semibold text-zinc-100">
                Aplikasi Sudah Menggunakan Versi Terbaru
              </h4>
              <p className="text-xs text-zinc-400 max-w-xs">
                Anda sudah berada di versi v{updateInfo?.currentVersion || '1.0.0'}. Tidak ada pembaruan yang diperlukan.
              </p>
            </div>
          )}

          {/* Status: Update Available */}
          {status === 'available' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fitur & Perbaikan Baru Tersedia</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {updateInfo?.changelog ||
                    'Pembaruan performa, perbaikan logo resolusi tinggi, dan safe-area tombol kontrol Mac.'}
                </p>
              </div>

              <p className="text-[11px] text-zinc-400">
                Pembaruan akan diunduh secara langsung di dalam aplikasi tanpa perlu membuka browser.
              </p>
            </div>
          )}

          {/* Status: Downloading Progress */}
          {status === 'downloading' && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Sedang Mengunduh Paket Pembaruan...</span>
                </span>
                <span className="font-mono font-bold text-blue-400">
                  {progress.percent}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, progress.percent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
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
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">
                  Pembaruan Siap Dipasang!
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  Unduhan telah selesai. Klik tombol di bawah untuk memasang dan membuka ulang aplikasi secara otomatis.
                </p>
              </div>
            </div>
          )}

          {/* Status: Error */}
          {status === 'error' && (
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <div className="font-semibold text-red-200">Gagal Memproses Pembaruan</div>
                <div className="mt-0.5 text-[11px] leading-relaxed opacity-90">{errorMessage}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end gap-2.5">
          {status === 'available' && (
            <>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-900/40 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Pembaruan Sekarang</span>
              </button>
            </>
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
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs cursor-pointer transition-colors"
            >
              Tutup
            </button>
          )}

          {status === 'error' && (
            <>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
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
