import React, { useState, useEffect } from 'react';
import { Type, Sparkles, Check, X, ShieldCheck, Loader2 } from 'lucide-react';
import { scanComputerFonts } from '../../services/fontManager';
import { useStudioStore } from '../../store/useStudioStore';

const STORAGE_KEY = 'arune_local_fonts_prompted_v1';

export const LocalFontAccessModal: React.FC = () => {
  const { addBatchLocalFonts } = useStudioStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    try {
      const alreadyPrompted = localStorage.getItem(STORAGE_KEY);
      if (!alreadyPrompted) {
        // Show after a brief delay so window renders smoothly
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAllowAndScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await scanComputerFonts();
      if (res.families.length > 0) {
        addBatchLocalFonts(res.families);
        setScanResult(`Berhasil mendeteksi ${res.families.length} font dari komputer Anda!`);
      } else {
        setScanResult('Pemindaian selesai. Font sistem siap digunakan.');
      }
      localStorage.setItem(STORAGE_KEY, 'true');
      setTimeout(() => {
        setIsOpen(false);
      }, 1600);
    } catch (e) {
      console.error('Error scanning local fonts:', e);
      setScanResult('Selesai.');
      localStorage.setItem(STORAGE_KEY, 'true');
      setTimeout(() => {
        setIsOpen(false);
      }, 1200);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs mac-no-drag animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/90 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Type className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Tipografi Lokal Komputer</span>
              </div>
              <h3 className="text-base font-bold text-zinc-100 leading-tight">
                Izinkan Akses Font Lokal?
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description & Features */}
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            Arune Studio dapat mendeteksi seluruh koleksi font yang terpasang di Mac / Komputer Anda (koleksi Font Book, Google Fonts offline, dan font branding) agar langsung bisa Anda gunakan saat mendesain carousel.
          </p>

          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-[11px]">
            <div className="flex items-start gap-2 text-zinc-200">
              <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>Ratusan font lokal langsung muncul di dropdown font editor.</span>
            </div>
            <div className="flex items-start gap-2 text-zinc-200">
              <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>Tidak perlu repot mengunggah ulang file font satu per satu.</span>
            </div>
            <div className="flex items-start gap-2 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>100% Privat & Lokal (tidak ada font yang dikirim ke server luar).</span>
            </div>
          </div>
        </div>

        {/* Scan Status Toast / Feedback */}
        {scanResult && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{scanResult}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-medium cursor-pointer transition-colors"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={handleAllowAndScan}
            disabled={isScanning}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-900/40 cursor-pointer transition-all"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memindai Font...</span>
              </>
            ) : (
              <>
                <Type className="w-3.5 h-3.5" />
                <span>Izinkan & Muat Font</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
