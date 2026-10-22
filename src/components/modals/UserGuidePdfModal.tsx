import React from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Download, ExternalLink, Sparkles, X } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';

interface UserGuidePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuidePdfModal: React.FC<UserGuidePdfModalProps> = ({ isOpen, onClose }) => {
  const { workspaceDarkMode } = useStudioStore();

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const pdfUrl = '/Arune_Studio_Panduan_Pengguna.pdf';

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-[95vw] xl:max-w-7xl h-[94vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          workspaceDarkMode
            ? 'bg-[#0A1A2F] border-zinc-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${
            workspaceDarkMode
              ? 'bg-zinc-950/70 border-zinc-800/80'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold truncate">
                  Panduan Penggunaan Arune Carousel Studio
                </h3>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                  Ebook PDF Landscape • 18 Halaman
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Panduan komprehensif fitur, format kanvas, editor 3 kolom, folder, tim &amp; export
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              download="Arune_Studio_Panduan_Pengguna.pdf"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
              title="Unduh file PDF ke komputer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </a>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                workspaceDarkMode
                  ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title="Buka di Tab Baru Layar Penuh"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                workspaceDarkMode
                  ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Frame */}
        <div className="flex-1 bg-zinc-950/40 relative overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            title="Arune Carousel Studio User Guide"
            className="w-full h-full border-0"
          />
        </div>

        {/* Bottom Banner */}
        <div
          className={`px-6 py-2.5 border-t text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 ${
            workspaceDarkMode
              ? 'bg-zinc-950/90 border-zinc-800 text-zinc-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Dokumentasi Resmi 2026 • Versi 1.0.2 • By Dinur Pradipta</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Gunakan tombol zoom &amp; print bawaan browser di bilah atas PDF</span>
            <a
              href={pdfUrl}
              download="Arune_Studio_Panduan_Pengguna.pdf"
              className="sm:hidden text-blue-500 font-semibold underline"
            >
              Unduh PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
