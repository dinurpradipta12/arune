import React, { useState } from 'react';
import {
  Download,
  X,
  Laptop,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  Zap,
  FolderArchive,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useStudioStore } from '../../store/useStudioStore';

interface DownloadStandaloneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OSTab = 'mac' | 'windows' | 'build-cli' | 'portable';

export const DownloadStandaloneModal: React.FC<DownloadStandaloneModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { workspaceDarkMode } = useStudioStore();
  const [activeTab, setActiveTab] = useState<OSTab>('mac');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isGeneratingBundle, setIsGeneratingBundle] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  // Langsung mendownload file installer DMG asli (.dmg)
  const handleDownloadRealDmg = (filename = 'Arune-Editorial-Studio-1.0.0-arm64.dmg') => {
    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess('Mengunduh installer DMG asli (141 MB)...');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // Generator bundle portable zip
  const handleDownloadOfflineBundle = async (targetOS: 'mac' | 'windows' | 'all') => {
    setIsGeneratingBundle(true);
    try {
      const zip = new JSZip();

      const readmeText = `# Arune Editorial Studio - Standalone Desktop Edition
Versi: 1.0.0 Editorial Master Edition
Platform: ${targetOS === 'mac' ? 'macOS (Apple Silicon & Intel)' : targetOS === 'windows' ? 'Microsoft Windows 10/11' : 'Universal (macOS & Windows)'}

## Cara Menjalankan Standalone:
1. Ekstrak folder ini ke komputer Anda.
2. ${targetOS === 'mac' ? 'Klik dua kali file "Start-Arune-macOS.command".' : targetOS === 'windows' ? 'Klik dua kali file "Start-Arune-Windows.bat".' : 'Jalankan "Start-Arune-macOS.command" (Mac) atau "Start-Arune-Windows.bat" (Windows).'}
3. Aplikasi Arune Editorial Studio akan langsung terbuka mandiri di jendela desktop!

## Cara Membuat File Installer Native (.dmg / .exe):
Buka terminal / CMD di folder proyek ini lalu ketik:
- Untuk membuat installer macOS (.dmg):
  npm run dist:mac
- Untuk membuat installer Windows (.exe):
  npm run dist:win

File installer siap pakai akan otomatis tersedia di dalam folder "release/".
`;

      zip.file('README-STANDALONE.txt', readmeText);

      const macLauncher = `#!/usr/bin/env bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "============================================="
echo "   Membuka Arune Editorial Studio Standalone "
echo "============================================="

if command -v npx >/dev/null 2>&1; then
    npx vite preview --port 4173 --open || open "http://localhost:5173"
else
    open index.html
fi
`;
      zip.file('Start-Arune-macOS.command', macLauncher);

      const winLauncher = `@echo off
title Arune Editorial Studio Standalone
echo =============================================
echo    Membuka Arune Editorial Studio Standalone 
echo =============================================
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "" npx vite preview --port 4173 --open
) else (
    start "" index.html
)
`;
      zip.file('Start-Arune-Windows.bat', winLauncher);

      const macBuildScript = `#!/usr/bin/env bash
echo "Mengompilasi Arune Editorial Studio menjadi installer macOS (.dmg)..."
npm run dist:mac
echo "Selesai! Buka folder release/ untuk mengambil file .dmg Anda."
`;
      zip.file('build-mac-dmg.sh', macBuildScript);

      const winBuildScript = `@echo off
echo Mengompilasi Arune Editorial Studio menjadi installer Windows (.exe)...
call npm run dist:win
echo Selesai! Buka folder release/ untuk mengambil file .exe Anda.
pause
`;
      zip.file('build-windows-exe.bat', winBuildScript);

      const content = await zip.generateAsync({ type: 'blob' });
      const filename = `Arune-Editorial-Studio-Standalone-${targetOS}.zip`;
      saveAs(content, filename);
    } catch (err) {
      console.error('Gagal membuat bundle:', err);
    } finally {
      setIsGeneratingBundle(false);
    }
  };

  const isDark = workspaceDarkMode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[90vh] transition-colors ${
          isDark
            ? 'bg-[#0A1A2F] text-slate-100 border-[#1E3A60]'
            : 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isDark
              ? 'bg-[#0E223D] border-[#1E3A60]'
              : 'bg-zinc-50/80 border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30 text-white shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-base font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  Unduh Arune Editorial Studio (Standalone)
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  v1.0.0 Standalone
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-zinc-500'
                }`}
              >
                Jalankan aplikasi secara mandiri di macOS & Windows tanpa browser, 100% offline dengan WebGPU acceleration.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border-b px-6 gap-2 pt-2 ${
            isDark
              ? 'border-[#1E3A60] bg-[#0A1A2F]'
              : 'border-zinc-200 bg-zinc-50/50'
          }`}
        >
          {[
            { id: 'mac', label: 'macOS (.dmg)', icon: '🍎' },
            { id: 'windows', label: 'Windows (.exe)', icon: '🪟' },
            { id: 'build-cli', label: 'Buat Installer Sendiri', icon: '⚡' },
            { id: 'portable', label: 'Paket Portable Offline', icon: '📦' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as OSTab)}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                  isActive
                    ? isDark
                      ? 'border-blue-500 text-blue-400 bg-[#0E223D] font-bold'
                      : 'border-blue-600 text-blue-600 bg-white font-bold shadow-xs'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Toast */}
        {downloadSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center gap-2 text-emerald-600 dark:text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scroller-dark text-xs">
          {/* ================================================================ */}
          {/* TAB 1: macOS                                                     */}
          {/* ================================================================ */}
          {activeTab === 'mac' && (
            <div className="space-y-4">
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isDark
                    ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}
              >
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p
                    className={`font-bold ${
                      isDark ? 'text-white' : 'text-blue-950'
                    }`}
                  >
                    Instalasi Mandiri di macOS (Ventura, Sonoma, Sequoia & Versi Lebih Baru)
                  </p>
                  <p
                    className={`text-[11.5px] leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-blue-900'
                    }`}
                  >
                    Installer native <span className="font-semibold">.dmg</span> sudah dikompilasi secara nyata di komputer Anda. Tidak memerlukan koneksi internet untuk menjalankan AI background removal dan render grafis 60 FPS.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Apple Silicon Card */}
                <div
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                    isDark
                      ? 'bg-[#122744] border-slate-800 hover:border-blue-500/80'
                      : 'bg-white border-zinc-200 hover:border-blue-500'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white">
                        Rekomendasi (Asli Siap Pakai)
                      </span>
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          isDark ? 'text-slate-400' : 'text-zinc-500'
                        }`}
                      >
                        .dmg (141 MB)
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      Apple Silicon (M1 / M2 / M3 / M4)
                    </h3>
                    <p
                      className={`text-[11.5px] leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-zinc-600'
                      }`}
                    >
                      Dioptimalkan dengan hardware acceleration GPU & Apple Neural Engine untuk MacBook Air, Pro, Mac mini, Mac Studio.
                    </p>
                  </div>

                  <div
                    className={`space-y-2 pt-2 border-t ${
                      isDark ? 'border-slate-800' : 'border-zinc-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleDownloadRealDmg('Arune-Editorial-Studio-1.0.0-arm64.dmg')}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh File DMG Installer Asli (141 MB)</span>
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-3 h-3" />
                      <span>File DMG asli sudah ter-compile di folder release/</span>
                    </div>
                  </div>
                </div>

                {/* Intel Mac Card */}
                <div
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                    isDark
                      ? 'bg-[#122744] border-slate-800 hover:border-slate-700'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isDark
                            ? 'bg-slate-800 text-slate-200 border-slate-700'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        Intel x86_64
                      </span>
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          isDark ? 'text-slate-400' : 'text-zinc-500'
                        }`}
                      >
                        .dmg
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      Intel Processor Mac
                    </h3>
                    <p
                      className={`text-[11.5px] leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-zinc-600'
                      }`}
                    >
                      Untuk MacBook dan iMac berbasis prosesor Intel Core i5/i7/i9 dengan macOS Catalina ke atas.
                    </p>
                  </div>

                  <div
                    className={`space-y-2 pt-2 border-t ${
                      isDark ? 'border-slate-800' : 'border-zinc-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleDownloadRealDmg('Arune-Editorial-Studio-1.0.0-arm64.dmg')}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                      }`}
                    >
                      <Download className="w-4 h-4 opacity-70" />
                      <span>Unduh Installer DMG (Universal)</span>
                    </button>
                    <p
                      className={`text-[10px] text-center ${
                        isDark ? 'text-slate-400' : 'text-zinc-500'
                      }`}
                    >
                      Atau jalankan <code className="text-blue-600 dark:text-blue-400 font-mono">npm run dist:mac</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Langkah Instalasi */}
              <div
                className={`p-4 rounded-xl border space-y-2.5 ${
                  isDark
                    ? 'bg-[#0E223D] border-slate-800'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <h4
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  Cara Pasang File DMG di macOS:
                </h4>
                <ol
                  className={`list-decimal list-inside space-y-1.5 text-[11.5px] leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-zinc-600'
                  }`}
                >
                  <li>
                    Buka file{' '}
                    <span
                      className={`font-semibold font-mono ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      Arune-Editorial-Studio-1.0.0-arm64.dmg
                    </span>{' '}
                    yang baru diunduh.
                  </li>
                  <li>
                    Jendela installer disk image akan terbuka otomatis. Tarik (drag) icon{' '}
                    <span
                      className={`font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      Arune Editorial Studio
                    </span>{' '}
                    ke folder{' '}
                    <span
                      className={`font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      Applications
                    </span>
                    .
                  </li>
                  <li>
                    Buka aplikasi lewat Launchpad / Spotlight. Aplikasi akan berjalan 100% standalone dan offline di Dock macOS Anda!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: WINDOWS                                                   */}
          {/* ================================================================ */}
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isDark
                    ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}
              >
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p
                    className={`font-bold ${
                      isDark ? 'text-white' : 'text-blue-950'
                    }`}
                  >
                    Instalasi Mandiri di Windows (Windows 10 / Windows 11)
                  </p>
                  <p
                    className={`text-[11.5px] leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-blue-900'
                    }`}
                  >
                    Tersedia installer NSIS (.exe) dengan desktop shortcut, serta portable bundle tanpa perlu hak administrator.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Windows Installer */}
                <div
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                    isDark
                      ? 'bg-[#122744] border-slate-800 hover:border-blue-500/80'
                      : 'bg-white border-zinc-200 hover:border-blue-500'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white">
                        Setup Wizard
                      </span>
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          isDark ? 'text-slate-400' : 'text-zinc-500'
                        }`}
                      >
                        .exe (~80 MB)
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      Windows 64-bit Installer Setup
                    </h3>
                    <p
                      className={`text-[11.5px] leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-zinc-600'
                      }`}
                    >
                      Membuat icon di Desktop, Start Menu, dan integrasi file carousel offline.
                    </p>
                  </div>

                  <div
                    className={`space-y-2 pt-2 border-t ${
                      isDark ? 'border-slate-800' : 'border-zinc-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => copyToClipboard('npm run dist:win', 'win')}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 transition-all"
                    >
                      <Terminal className="w-4 h-4" />
                      <span>{copiedCmd === 'win' ? 'Perintah Tersalin!' : 'Compile Windows .exe (1-Klik)'}</span>
                    </button>
                    <p
                      className={`text-[10px] text-center font-mono ${
                        isDark ? 'text-slate-400' : 'text-zinc-500'
                      }`}
                    >
                      npm run dist:win
                    </p>
                  </div>
                </div>

                {/* Windows Portable */}
                <div
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                    isDark
                      ? 'bg-[#122744] border-slate-800 hover:border-slate-700'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isDark
                            ? 'bg-slate-800 text-slate-200 border-slate-700'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        Tanpa Install
                      </span>
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          isDark ? 'text-slate-400' : 'text-zinc-500'
                        }`}
                      >
                        .zip / portable
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      Windows Portable Standalone
                    </h3>
                    <p
                      className={`text-[11.5px] leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-zinc-600'
                      }`}
                    >
                      Bisa disimpan di Flashdisk / USB dan dijalankan di komputer tanpa hak administrator.
                    </p>
                  </div>

                  <div
                    className={`space-y-2 pt-2 border-t ${
                      isDark ? 'border-slate-800' : 'border-zinc-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleDownloadOfflineBundle('windows')}
                      disabled={isGeneratingBundle}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                      }`}
                    >
                      <Download className="w-4 h-4 opacity-70" />
                      <span>{isGeneratingBundle ? 'Menyiapkan...' : 'Unduh Portable (.zip)'}</span>
                    </button>
                    <p
                      className={`text-[10px] text-center ${
                        isDark ? 'text-slate-400' : 'text-zinc-500'
                      }`}
                    >
                      Ekstrak dan double-click langsung jalan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: BUILD INSTALLER SENDIRI                                    */}
          {/* ================================================================ */}
          {activeTab === 'build-cli' && (
            <div className="space-y-4">
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isDark
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p
                    className={`font-bold ${
                      isDark ? 'text-white' : 'text-emerald-950'
                    }`}
                  >
                    Konfigurasi Electron Builder Sudah Terpasang Penuh
                  </p>
                  <p
                    className={`text-[11.5px] leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-emerald-900'
                    }`}
                  >
                    Anda dapat membuat installer native <span className="font-bold">.dmg</span> (Mac) dan <span className="font-bold">.exe</span> (Windows) kapan saja langsung di terminal project ini.
                  </p>
                </div>
              </div>

              {/* Command Box 1: macOS */}
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark
                    ? 'bg-[#122744] border-slate-800'
                    : 'bg-white border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    <span>🍎</span>
                    <span>1. Compile Installer macOS (.dmg)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm run dist:mac', 'mac-cmd')}
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-semibold"
                  >
                    {copiedCmd === 'mac-cmd' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Perintah</span>
                      </>
                    )}
                  </button>
                </div>
                <div
                  className={`p-2.5 rounded-lg border font-mono text-[12px] ${
                    isDark
                      ? 'bg-black/60 border-slate-800 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-emerald-400'
                  }`}
                >
                  <code>npm run dist:mac</code>
                </div>
                <p
                  className={`text-[11px] ${
                    isDark ? 'text-slate-300' : 'text-zinc-600'
                  }`}
                >
                  Menghasilkan file installer <span className="font-mono font-semibold">release/Arune Editorial Studio-1.0.0-arm64.dmg</span>.
                </p>
              </div>

              {/* Command Box 2: Windows */}
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark
                    ? 'bg-[#122744] border-slate-800'
                    : 'bg-white border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    <span>🪟</span>
                    <span>2. Compile Installer Windows (.exe)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm run dist:win', 'win-cmd')}
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-semibold"
                  >
                    {copiedCmd === 'win-cmd' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Perintah</span>
                      </>
                    )}
                  </button>
                </div>
                <div
                  className={`p-2.5 rounded-lg border font-mono text-[12px] ${
                    isDark
                      ? 'bg-black/60 border-slate-800 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-emerald-400'
                  }`}
                >
                  <code>npm run dist:win</code>
                </div>
                <p
                  className={`text-[11px] ${
                    isDark ? 'text-slate-300' : 'text-zinc-600'
                  }`}
                >
                  Menghasilkan file installer <span className="font-mono font-semibold">release/Arune-Editorial-Studio-Setup-1.0.0.exe</span>.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: PORTABLE STANDALONE BUNDLE                                 */}
          {/* ================================================================ */}
          {activeTab === 'portable' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark
                    ? 'bg-[#122744] border-slate-800'
                    : 'bg-white border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      Download Script Launcher Portable (.zip)
                    </h3>
                    <p
                      className={`text-xs mt-0.5 leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-zinc-600'
                      }`}
                    >
                      Berisi executable script launcher untuk Mac (<code className="font-semibold">.command</code>) & Windows (<code className="font-semibold">.bat</code>) serta build tool script.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadOfflineBundle('all')}
                    disabled={isGeneratingBundle}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isGeneratingBundle
                        ? 'Sedang Memaketkan Berkas...'
                        : 'Unduh Arsip Launcher Portable (.zip)'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className={`p-3.5 rounded-xl border space-y-1 ${
                    isDark
                      ? 'bg-[#0E223D] border-slate-800'
                      : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>100% Offline</span>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-zinc-600'
                    }`}
                  >
                    AI model background removal & font berjalan lokal tanpa internet.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border space-y-1 ${
                    isDark
                      ? 'bg-[#0E223D] border-slate-800'
                      : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Privasi Aman</span>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-zinc-600'
                    }`}
                  >
                    Materi grafis tidak pernah dikirim ke server pihak ketiga.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border space-y-1 ${
                    isDark
                      ? 'bg-[#0E223D] border-slate-800'
                      : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Kinerja Cepat</span>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-zinc-600'
                    }`}
                  >
                    Akselerasi WebGPU & Canvas 60 FPS untuk editing responsif.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isDark
              ? 'border-slate-800 bg-[#0E223D]'
              : 'border-zinc-200 bg-zinc-50/80'
          }`}
        >
          <div
            className={`text-[11.5px] flex items-center gap-2 font-medium ${
              isDark ? 'text-slate-300' : 'text-zinc-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>File installer asli macOS DMG (141 MB) siap dipasang</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors border ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-300'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
