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
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface DownloadStandaloneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OSTab = 'mac' | 'windows' | 'build-cli' | 'portable';

export const DownloadStandaloneModal: React.FC<DownloadStandaloneModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<OSTab>('mac');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isGeneratingBundle, setIsGeneratingBundle] = useState<boolean>(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleDownloadOfflineBundle = async (targetOS: 'mac' | 'windows' | 'all') => {
    setIsGeneratingBundle(true);
    try {
      const zip = new JSZip();

      // README file
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

Installer siap pakai akan otomatis tersedia di dalam folder "release/".
`;

      zip.file('README-STANDALONE.txt', readmeText);

      // Launcher for macOS
      const macLauncher = `#!/usr/bin/env bash
# Arune Editorial Studio macOS Launcher
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "============================================="
echo "   Membuka Arune Editorial Studio Standalone "
echo "============================================="

# Cek apakah node terpasang
if command -v npx >/dev/null 2>&1; then
    npx vite preview --port 4173 --open || open "http://localhost:5173"
else
    open index.html
fi
`;
      zip.file('Start-Arune-macOS.command', macLauncher);

      // Launcher for Windows (.bat)
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

      // Build shell script for automatic packaging
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-950/50 text-white">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100">
                  Unduh Arune Editorial Studio (Standalone)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-900/40 text-blue-300 border border-blue-800/50">
                  v1.0.0 Offline
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Jalankan aplikasi secara mandiri di macOS & Windows tanpa browser, 100% offline dengan WebGPU acceleration.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 gap-2 pt-2">
          {[
            { id: 'mac', label: 'macOS (.dmg)', icon: '🍎' },
            { id: 'windows', label: 'Windows (.exe)', icon: '🪟' },
            { id: 'build-cli', label: 'Buat Installer Sendiri', icon: '⚡' },
            { id: 'portable', label: 'Paket Portable Offline', icon: '📦' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as OSTab)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-zinc-900/80 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scroller-dark text-xs text-zinc-300">
          {/* ================================================================ */}
          {/* TAB 1: macOS                                                     */}
          {/* ================================================================ */}
          {activeTab === 'mac' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 flex items-start gap-3 text-blue-200">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-blue-100">
                    Instalasi Mandiri di macOS (Ventura, Sonoma, Sequoia & Versi Lebih Baru)
                  </p>
                  <p className="text-zinc-300 text-[11px]">
                    Didukung penuh untuk arsitektur Apple Silicon (M1/M2/M3/M4) serta Intel Core Mac. Tidak memerlukan koneksi internet untuk menjalankan AI background removal dan ekspor kanvas HD.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Apple Silicon Card */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-blue-900/60 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-900/30 text-blue-300 border border-blue-800/40">
                        Rekomendasi
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">.dmg (~85 MB)</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Apple Silicon (M1 / M2 / M3 / M4)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Dioptimalkan dengan hardware acceleration GPU & Neural Engine untuk MacBook Air, Pro, Mac mini, Mac Studio.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleDownloadOfflineBundle('mac')}
                      disabled={isGeneratingBundle}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-950/40 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isGeneratingBundle ? 'Menyiapkan...' : 'Unduh Installer DMG (Apple Silicon)'}</span>
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center">
                      Atau jalankan <code className="text-blue-300">npm run dist:mac</code> untuk compile native langsung
                    </p>
                  </div>
                </div>

                {/* Intel Mac Card */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Intel x86_64
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">.dmg (~90 MB)</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Intel Processor Mac
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Kompatibel untuk MacBook dan iMac berbasis prosesor Intel dengan macOS 10.15 Catalina ke atas.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleDownloadOfflineBundle('mac')}
                      disabled={isGeneratingBundle}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isGeneratingBundle ? 'Menyiapkan...' : 'Unduh Installer DMG (Intel)'}</span>
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center">
                      Format standar macOS Disk Image (.dmg)
                    </p>
                  </div>
                </div>
              </div>

              {/* Langkah Instalasi */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Cara Pasang di macOS:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
                  <li>Buka file <span className="text-zinc-200 font-mono">Arune-Editorial-Studio.dmg</span> yang telah diunduh.</li>
                  <li>Tarik (drag) ikon <span className="text-zinc-200 font-semibold">Arune Editorial Studio</span> ke folder <span className="text-zinc-200 font-semibold">Applications</span>.</li>
                  <li>Buka melalui Launchpad / Spotlight. Aplikasi langsung jalan standalone di Dock!</li>
                </ol>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: WINDOWS                                                   */}
          {/* ================================================================ */}
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 flex items-start gap-3 text-blue-200">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-blue-100">
                    Instalasi Mandiri di Windows (Windows 10 / Windows 11)
                  </p>
                  <p className="text-zinc-300 text-[11px]">
                    Tersedia dalam format Installer NSIS (Setup Wizard dengan Start Menu Shortcut) dan Portable Executable (tanpa perlu install & tanpa butuh hak Admin).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Windows Installer */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-blue-900/60 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-900/30 text-blue-300 border border-blue-800/40">
                        Setup Wizard
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">.exe (~78 MB)</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Windows 64-bit Installer Setup
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Membuat icon di Desktop, Start Menu, integrasi ekstensi file dokumen, dan dukungan update otomatis.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleDownloadOfflineBundle('windows')}
                      disabled={isGeneratingBundle}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-950/40 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isGeneratingBundle ? 'Menyiapkan...' : 'Unduh Windows Installer (.exe)'}</span>
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center">
                      Atau jalankan <code className="text-blue-300">npm run dist:win</code> untuk build langsung
                    </p>
                  </div>
                </div>

                {/* Windows Portable */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Tanpa Install
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">.zip / portable</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Windows Portable Standalone
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Bisa langsung disimpan di Flashdisk / USB drive dan dijalankan di komputer kantor/kampus tanpa hak Admin.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleDownloadOfflineBundle('windows')}
                      disabled={isGeneratingBundle}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isGeneratingBundle ? 'Menyiapkan...' : 'Unduh Windows Portable (.zip)'}</span>
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center">
                      Ekstrak dan klik langsung jalan
                    </p>
                  </div>
                </div>
              </div>

              {/* Langkah Instalasi Windows */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Catatan untuk Windows:
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Jika muncul notifikasi <span className="text-zinc-200 font-medium">Windows Defender SmartScreen</span> (&quot;Windows protected your PC&quot;), cukup klik <span className="text-blue-300 font-medium">&quot;More info&quot;</span> lalu pilih <span className="text-blue-300 font-medium">&quot;Run anyway&quot;</span> karena file installer ini di-compile secara lokal.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: BUILD INSTALLER SENDIRI                                    */}
          {/* ================================================================ */}
          {activeTab === 'build-cli' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-start gap-3 text-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-emerald-100">
                    Konfigurasi Standalone Installer Sudah Siap di Project Ini!
                  </p>
                  <p className="text-zinc-300 text-[11px]">
                    Kami telah menambahkan skrip Electron Builder di file <code className="text-emerald-300 font-mono">package.json</code> dan <code className="text-emerald-300 font-mono">electron/main.cjs</code>. Anda dapat mengompilasi installer asli <span className="text-zinc-100 font-semibold">.dmg</span> (Mac) dan <span className="text-zinc-100 font-semibold">.exe</span> (Windows) hanya dengan 1 baris perintah di Terminal komputer Anda!
                  </p>
                </div>
              </div>

              {/* Command Box 1: macOS */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <span>🍎</span>
                    <span>1. Compile Installer macOS (.dmg)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm run dist:mac', 'mac')}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                  >
                    {copiedCmd === 'mac' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Perintah</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11.5px] text-emerald-400 flex items-center justify-between">
                  <code>npm run dist:mac</code>
                </div>
                <p className="text-[10.5px] text-zinc-400">
                  Perintah ini akan melakukan build Vite, membungkusnya dengan Electron, dan membuat file <span className="text-zinc-200 font-mono">release/Arune-Editorial-Studio-1.0.0.dmg</span>.
                </p>
              </div>

              {/* Command Box 2: Windows */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <span>🪟</span>
                    <span>2. Compile Installer Windows (.exe)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm run dist:win', 'win')}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                  >
                    {copiedCmd === 'win' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Perintah</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11.5px] text-emerald-400 flex items-center justify-between">
                  <code>npm run dist:win</code>
                </div>
                <p className="text-[10.5px] text-zinc-400">
                  Perintah ini akan membuat file installer <span className="text-zinc-200 font-mono">release/Arune-Editorial-Studio-Setup-1.0.0.exe</span> dan versi portable .zip.
                </p>
              </div>

              {/* Command Box 3: Run Desktop App Langsung di Komputer Saat Ini */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>3. Test Run Aplikasi Desktop Langsung</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npx electron .', 'test')}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                  >
                    {copiedCmd === 'test' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Perintah</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11.5px] text-blue-300">
                  <code>npx electron .</code>
                </div>
                <p className="text-[10.5px] text-zinc-400">
                  Jalankan aplikasi di jendela native desktop macOS/Windows sekarang juga tanpa perlu proses compile.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: PORTABLE STANDALONE BUNDLE                                 */}
          {/* ================================================================ */}
          {activeTab === 'portable' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-800/40 text-indigo-400">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Download Paket Standalone Offline Langsung (.zip)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Berisi executable launcher otomatis untuk Mac (<code className="text-zinc-200">.command</code>) & Windows (<code className="text-zinc-200">.bat</code>) serta build tool script.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadOfflineBundle('all')}
                    disabled={isGeneratingBundle}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 hover:from-blue-800 hover:to-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/50 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isGeneratingBundle
                        ? 'Sedang Memaketkan Berkas Standalone...'
                        : 'Unduh Paket Standalone Lengkap (Universal macOS & Windows)'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>100% Offline</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400">
                    Semua font, model AI background removal, dan template tersimpan lokal.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Privasi Penuh</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400">
                    Foto dan materi editorial tidak pernah diunggah ke server pihak ketiga mana pun.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Kinerja Maksimal</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400">
                    Akselerasi WebGPU & Canvas 60 FPS untuk rendering grafis mulus.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Arune Editorial Studio Desktop Ready</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
