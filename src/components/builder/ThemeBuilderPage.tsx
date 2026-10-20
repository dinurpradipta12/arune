import React, { useEffect, useRef, useState } from 'react';
import {
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Copy,
  FolderOpen,
  Grid,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  Loader2,
  Lock,
  Minus,
  Moon,
  Palette,
  Plus,
  PlusCircle,
  Redo2,
  Sparkles,
  Sun,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import {
  ASPECT_RATIOS,
  FONT_FAMILIES,
  LAYOUT_PRESETS,
  THEME_PALETTES,
} from '../../constants/themesAndPresets';
import {
  fetchCloudStudioData,
  publishMasterTemplateToCloud,
  verifyAdministratorCredentials,
} from '../../services/supabaseTemplates';
import { useStudioStore } from '../../store/useStudioStore';
import type {
  AspectRatioKey,
  FontFamilyName,
} from '../../types/studio';
import { SlideStage } from '../canvas/SlideStage';
import { RightInspector } from '../layout/RightInspector';
import { LayoutVisualThumbnail } from '../layout/LeftSidebar';
import { studioLogo } from '../../assets/branding';
import { isElectronMac } from '../../utils/platform';

interface DeveloperAccessGuardProps {
  onBack: () => void;
  onAuthenticated: () => void;
}

const DeveloperAccessGuard: React.FC<DeveloperAccessGuardProps> = ({
  onBack,
  onAuthenticated,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenLogin = () => {
    setUsername('');
    setPassword('');
    setError(null);
    setShowLoginModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await verifyAdministratorCredentials(username, password);
      if (res.ok) {
        onAuthenticated();
      } else {
        setError('Username atau Password Administrator salah.');
      }
    } catch {
      setError('Gagal memverifikasi login developer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#070A12] text-zinc-100 p-6 select-none relative">
      <div className="max-w-md w-full p-6 sm:p-7 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4 shadow-2xl relative overflow-hidden">
        {/* TITIK RAHASIA DI SUDUT ATAS BOX SEBAGAI TOMBOL TERSEMBUNYI */}
        <button
          type="button"
          onClick={handleOpenLogin}
          aria-label="Developer Secret Corner Dot"
          title="•"
          className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-zinc-700/40 hover:bg-blue-900 transition-all cursor-pointer hover:scale-125"
        />

        <div className="w-12 h-12 rounded-xl bg-blue-900/20 text-blue-400 mx-auto flex items-center justify-center">
          <Palette className="w-6 h-6" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-zinc-100">
          Akses Khusus Developer / Admin
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Halaman Theme & Master Template Builder ini hanya dapat diakses oleh Administrator developer untuk menjaga konsistensi template cloud studio.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Template</span>
        </button>
      </div>

      {/* TITIK RAHASIA DI BAWAH BOX SEBAGAI TOMBOL TERSEMBUNYI */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleOpenLogin}
          aria-label="Developer Secret Bottom Dot"
          title="•"
          className="w-2.5 h-2.5 rounded-full bg-zinc-600/35 hover:bg-blue-900 hover:scale-125 transition-all cursor-pointer"
        />
      </div>

      {/* MODAL OVERLAY LOGIN DEVELOPER (MUNCUL SAAT TITIK DIKLIK) */}
      {showLoginModal && (
        <div
          onClick={() => setShowLoginModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-900/20 border border-blue-900/30 flex items-center justify-center text-blue-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">
                    Administrator Developer Login
                  </h4>
                  <p className="text-[10.5px] text-zinc-400">
                    Masuk untuk membuka Theme & Template Builder
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Username Administrator
                </label>
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username admin"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-900 rounded-lg px-3 py-2 text-xs text-zinc-100 select-text"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Password Administrator
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-900 rounded-lg px-3 py-2 text-xs text-zinc-100 select-text"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800 text-[11px] text-red-200">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                <span>Masuk Developer</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const ThemeBuilderContent: React.FC = () => {
  const {
    slides,
    activeSlideIndex,
    setActiveSlideIndex,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    commitElementHistory,
    deleteElement,
    duplicateElement,
    adjustElementZIndex,
    alignElementOnCanvas,
    setSlideBackgroundColor,
    applyLayoutToSlide,
    addElement,
    addSlide,
    deleteSlide,
    duplicateSlide,
    aspectRatio,
    setAspectRatio,
    activeThemeId,
    setActiveTheme,
    getActiveTheme,
    updateThemeColors,
    branding,
    updateBranding,
    scriptText,
    undo,
    redo,
    past,
    future,
    setActiveView,
    setCloudMasterTemplates,
    loadProjectSnapshot,
    workspaceDarkMode,
    setWorkspaceDarkMode,
  } = useStudioStore();

  const themePalette = getActiveTheme();

  // Template Identification for Publishing
  const [templateName, setTemplateName] = useState('Aesthetic Editorial Story');
  const [templateCategory, setTemplateCategory] = useState<
    'Editorial' | 'Media' | 'Minimalist' | 'Playful' | 'Typography' | 'Custom'
  >('Editorial');
  const [templateDesc, setTemplateDesc] = useState(
    '6-Slide Master Template dengan tipografi editorial modern dan palet visual eksklusif'
  );

  // Left Sidebar Tabs
  const [activeLeftTab, setActiveLeftTab] = useState<
    'theme' | 'layouts' | 'elements' | 'branding' | 'cloud'
  >('theme');
  const [layoutFilter, setLayoutFilter] = useState<
    'All' | 'Editorial' | 'Media' | 'Minimalist' | 'Playful' | 'Typography'
  >('All');

  // Helper to determine if a hex color is light
  const isColorLight = (hexColor: string) => {
    try {
      const hex = hexColor.replace('#', '');
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return (r * 299 + g * 587 + b * 114) / 1000 >= 160;
      }
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 >= 160;
      }
    } catch {
      // fallback
    }
    return true;
  };

  const isCurrentThemeLight = isColorLight(themePalette.background);

  // Automatically keep workspace and canvas backdrop in sync with the active theme mode
  // If the active theme is light, background becomes crisp light; if dark, deep dark
  useEffect(() => {
    if (isCurrentThemeLight) {
      setWorkspaceDarkMode(false);
      setCanvasStageBg('light');
    } else {
      setWorkspaceDarkMode(true);
      setCanvasStageBg('dark');
    }
  }, [themePalette.id, isCurrentThemeLight, setWorkspaceDarkMode]);

  // Canvas Stage controls
  const [canvasStageBg, setCanvasStageBg] = useState<'slate' | 'dark' | 'light'>(
    isCurrentThemeLight ? 'light' : 'slate'
  );
  const [canvasZoom, setCanvasZoom] = useState<number>(0.45);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Status & Notifications
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Dynamic Fit Zoom calculator
  const calculateFitZoom = () => {
    const container = previewContainerRef.current;
    const dim = ASPECT_RATIOS[aspectRatio];
    if (!container) {
      if (aspectRatio === '9:16') return 0.28;
      if (aspectRatio === '4:5') return 0.42;
      return 0.5;
    }
    const availW = Math.max(160, container.clientWidth - 56);
    const availH = Math.max(160, container.clientHeight - 56);
    const scaleX = availW / dim.stageWidth;
    const scaleY = availH / dim.stageHeight;
    const fitScale = Math.min(scaleX, scaleY);
    return Math.max(0.18, Math.min(1.0, Number(fitScale.toFixed(2))));
  };

  const handleFitZoom = () => {
    setCanvasZoom(calculateFitZoom());
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanvasZoom(calculateFitZoom());
    }, 60);
    return () => clearTimeout(timer);
  }, [aspectRatio]);

  // Option + Scroll Wheel or Trackpad Pinch to Zoom
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.altKey || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();

        const isPinch = e.ctrlKey && !e.altKey && !e.metaKey;
        const zoomRate = isPinch ? 0.008 : 0.0018;
        const delta = -e.deltaY * zoomRate;

        setCanvasZoom((prev) =>
          Math.max(0.18, Math.min(2.0, Number((prev + delta).toFixed(2))))
        );
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const activeSlide = slides[activeSlideIndex] || slides[0];

  // Publish to Cloud Database as a new Master Template
  const handlePublishToCloud = async () => {
    setIsPublishing(true);
    setStatusMessage(null);

    const safeTitle = templateName.trim() || 'Untitled Master Template';
    const cleanId = `master-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    try {
      const res = await publishMasterTemplateToCloud({
        id: cleanId,
        name: safeTitle,
        description: templateDesc.trim() || 'Master template by developer',
        aspectRatio,
        themeId: themePalette.id,
        branding,
        scriptText,
        slides,
      });

      // Refresh cloud store cache
      const cloudData = await fetchCloudStudioData();
      if (cloudData.masterTemplates.length > 0) {
        setCloudMasterTemplates(cloudData.masterTemplates);
      }

      setStatusMessage({
        type: 'success',
        text: `Template "${safeTitle}" berhasil di-publish ke Cloud Database (${
          res.mode === 'supabase' ? 'Supabase Sync Aktif' : 'Cache Cloud Lokal'
        })! Template kini otomatis tampil di galeri semua perangkat.`,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Gagal mem-publish master template ke cloud.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Open in Main Editor directly
  const handleOpenInEditor = () => {
    loadProjectSnapshot(
      {
        id: `tpl-${Date.now()}`,
        projectTitle: templateName,
        aspectRatio,
        activeThemeId: themePalette.id,
        branding,
        scriptText,
        slides,
      },
      true
    );
    setActiveView('editor');
  };

  const filteredPresets =
    layoutFilter === 'All'
      ? LAYOUT_PRESETS
      : LAYOUT_PRESETS.filter((p) => p.category === layoutFilter);

  // Stage dimensions & zoom
  const dim = ASPECT_RATIOS[aspectRatio];
  const scaledW = Math.round(dim.stageWidth * canvasZoom);
  const scaledH = Math.round(dim.stageHeight * canvasZoom);

  // Bottom filmstrip thumbnail dimensions
  const thumbScale =
    aspectRatio === '9:16' ? 0.055 : aspectRatio === '4:5' ? 0.07 : 0.085;
  const thumbW = Math.round(dim.stageWidth * thumbScale);
  const thumbH = Math.round(dim.stageHeight * thumbScale);

  return (
    <div
      className={`h-screen w-screen flex flex-col select-none overflow-hidden transition-colors duration-200 ${
        workspaceDarkMode
          ? 'studio-theme-dark bg-[#050811] text-slate-100'
          : 'studio-theme-light bg-white text-slate-900'
      }`}
    >
      {/* 1. TOP HEADER BAR */}
      <header
        className={`h-13 border-b border-zinc-800/90 bg-zinc-900/95 flex items-center justify-between shrink-0 z-30 mac-drag-region ${
          isElectronMac() ? 'pl-22 pr-4' : 'px-4'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 mac-no-drag">
          <button
            type="button"
            onClick={() => setActiveView('editor')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer transition-colors"
            title="Kembali ke Editor Studio"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Studio</span>
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <img
              src={studioLogo}
              alt="Logo"
              className="w-5 h-5 object-contain rounded"
            />
            <span className="text-xs font-bold text-zinc-100 truncate">
              Theme & Master Template Studio
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/20 text-blue-400 border border-blue-900/40 font-semibold uppercase tracking-wider">
              Developer Mode
            </span>
          </div>
        </div>

        {/* Center: Aspect Ratio & History Controls */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Aspect Ratio */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px]">
            {(['4:5', '9:16', '1:1'] as AspectRatioKey[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAspectRatio(r)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  aspectRatio === r
                    ? 'bg-blue-900 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {ASPECT_RATIOS[r].shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Workspace Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMode = !workspaceDarkMode;
              setWorkspaceDarkMode(nextMode);
              setCanvasStageBg(nextMode ? 'dark' : 'light');
            }}
            title={workspaceDarkMode ? 'Ubah Tampilan ke Mode Terang (Light)' : 'Ubah Tampilan ke Mode Gelap (Dark)'}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white cursor-pointer transition-colors"
          >
            {workspaceDarkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenInEditor}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
            title="Buka langsung ke Editor Carousel"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Buka di Editor</span>
          </button>

          <button
            type="button"
            onClick={handlePublishToCloud}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            <Cloud
              className={`w-3.5 h-3.5 ${isPublishing ? 'animate-spin' : ''}`}
            />
            <span>
              {isPublishing
                ? 'Menyimpan ke Cloud...'
                : 'Simpan Master Template ke Cloud'}
            </span>
          </button>
        </div>
      </header>

      {/* NOTIFICATION BANNER */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between z-20 shrink-0 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950 border-b border-emerald-800 text-emerald-200'
              : 'bg-red-950 border-b border-red-800 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:opacity-80 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN 3-COLUMN STUDIO WORKSPACE: LEFT (TABS) | CENTER (WYSIWYG CANVAS) | RIGHT (INSPECTOR) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT COLUMN: THEME & BUILDER CONTROLS */}
        <aside className="w-80 border-r border-zinc-800/80 bg-zinc-950 flex flex-col shrink-0 select-none h-full overflow-hidden">
          {/* Tab Selector Buttons */}
          <div className="grid grid-cols-5 p-1.5 gap-1 bg-zinc-900/60 border-b border-zinc-800/80 shrink-0 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveLeftTab('theme')}
              className={`py-1.5 rounded-md font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeLeftTab === 'theme'
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Warna & Font Tema"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Tema</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLeftTab('layouts')}
              className={`py-1.5 rounded-md font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeLeftTab === 'layouts'
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Layout Presets Visual"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Layout</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLeftTab('elements')}
              className={`py-1.5 rounded-md font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeLeftTab === 'elements'
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Tambah Elemen Objek"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Elemen</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLeftTab('branding')}
              className={`py-1.5 rounded-md font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeLeftTab === 'branding'
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Header & Branding Template"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Branding</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLeftTab('cloud')}
              className={`py-1.5 rounded-md font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeLeftTab === 'cloud'
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Publish Master Template ke Cloud"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>
          </div>

          {/* TAB 1: THEME & COLOR PALETTE */}
          {activeLeftTab === 'theme' && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scroller-dark text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                  Preset Palet Bawaan
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {THEME_PALETTES.map((preset) => {
                    const isSelected = activeThemeId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setActiveTheme(preset.id)}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-900/15 border-blue-900 text-blue-300 font-semibold ring-1 ring-blue-900/40'
                            : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-black/20 shrink-0 shadow-xs flex items-center justify-center text-[9px] font-bold"
                          style={{
                            backgroundColor: preset.background,
                            color: preset.accent,
                          }}
                        >
                          A
                        </div>
                        <span className="truncate text-[11px]">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Customizer */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
                <label className="text-[11px] font-semibold text-zinc-300 block uppercase tracking-wider">
                  Kustomisasi Warna Tema
                </label>
                {[
                  { key: 'background', label: 'Background Terang' },
                  { key: 'darkBackground', label: 'Background Gelap' },
                  { key: 'surface', label: 'Surface / Card' },
                  { key: 'textPrimary', label: 'Teks Utama' },
                  { key: 'textSecondary', label: 'Teks Sekunder' },
                  { key: 'accent', label: 'Warna Aksen' },
                  { key: 'divider', label: 'Garis Pembatas' },
                ].map(({ key, label }) => {
                  const val = (themePalette as any)[key] || '#000000';
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80"
                    >
                      <span className="text-[11px] text-zinc-300">{label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={val.startsWith('#') ? val : '#181C1A'}
                          onChange={(e) =>
                            updateThemeColors({ [key]: e.target.value })
                          }
                          className="w-6 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent p-0"
                        />
                        <span className="text-[10px] font-mono text-zinc-400 w-16 text-right">
                          {val}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Typography */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <label className="text-[11px] font-semibold text-zinc-300 block uppercase tracking-wider">
                  Pilihan Font Template
                </label>
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1">
                    Heading Font:
                  </span>
                  <select
                    value={themePalette.headingFont}
                    onChange={(e) =>
                      updateThemeColors({ headingFont: e.target.value as FontFamilyName })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 cursor-pointer"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1">
                    Body Font:
                  </span>
                  <select
                    value={themePalette.bodyFont}
                    onChange={(e) =>
                      updateThemeColors({ bodyFont: e.target.value as FontFamilyName })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 cursor-pointer"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAYOUT PRESETS WITH VISUAL THUMBNAILS */}
          {activeLeftTab === 'layouts' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scroller-dark text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                  Kategori Layout ({filteredPresets.length})
                </label>
                <div className="flex flex-wrap gap-1">
                  {(
                    ['All', 'Editorial', 'Media', 'Minimalist', 'Playful', 'Typography'] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLayoutFilter(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        layoutFilter === cat
                          ? 'bg-blue-900 text-white font-semibold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyLayoutToSlide(activeSlideIndex, preset.id)}
                    className="group flex flex-col p-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-blue-900/60 transition-all cursor-pointer text-left shadow-xs"
                  >
                    <div className="w-full rounded-md overflow-hidden border border-zinc-800/80 mb-1.5 group-hover:ring-1 group-hover:ring-blue-900/50 transition-all">
                      <LayoutVisualThumbnail
                        layoutId={preset.id}
                        theme={themePalette}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-200 truncate group-hover:text-blue-300">
                      {preset.name}
                    </span>
                    <span className="text-[9.5px] text-zinc-500 truncate">
                      {preset.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ADD ELEMENTS */}
          {activeLeftTab === 'elements' && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scroller-dark text-xs">
              <div>
                <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
                  Tambah Objek ke Kanvas
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Tambahkan elemen bebas ke Slide {activeSlideIndex + 1}. Drag & drop, resize langsung di kanvas.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2.5">
                  <button
                    type="button"
                    onClick={() => addElement('text')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-900/40 text-zinc-200 transition-all cursor-pointer"
                  >
                    <Type className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium">Tambah Teks</span>
                    <span className="text-[10px] text-zinc-500">Judul / Body</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addElement('image')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-900/40 text-zinc-200 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium">Foto / Frame</span>
                    <span className="text-[10px] text-zinc-500">Pan & Zoom</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addElement('divider')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-900/40 text-zinc-200 transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium">Garis Divider</span>
                    <span className="text-[10px] text-zinc-500">Hairline Rule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addElement('badge')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-900/40 text-zinc-200 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium">Badge / Pill</span>
                    <span className="text-[10px] text-zinc-500">Label Kategori</span>
                  </button>
                </div>
              </div>

              {/* Slide Background Color */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                <label className="text-[11px] font-semibold text-zinc-300 block uppercase tracking-wider">
                  Warna Latar Slide Aktif
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeSlide.backgroundColor || themePalette.background}
                    onChange={(e) =>
                      setSlideBackgroundColor(activeSlideIndex, e.target.value)
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0"
                  />
                  <div className="flex-1 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideBackgroundColor(
                          activeSlideIndex,
                          themePalette.background
                        )
                      }
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800 cursor-pointer"
                    >
                      Light ({themePalette.background})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideBackgroundColor(
                          activeSlideIndex,
                          themePalette.darkBackground
                        )
                      }
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800 cursor-pointer"
                    >
                      Dark ({themePalette.darkBackground})
                    </button>
                  </div>
                </div>
              </div>

              {/* Elements on this slide */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-300 block uppercase tracking-wider">
                  Daftar Elemen ({activeSlide.elements.length})
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto scroller-dark">
                  {activeSlide.elements.map((el, i) => {
                    const isSelected = selectedElementId === el.id;
                    return (
                      <div
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`p-1.5 rounded-lg flex items-center justify-between gap-1 text-[11px] cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-900/20 border border-blue-900/60 text-white font-medium'
                            : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            #{i + 1}
                          </span>
                          <span className="truncate">
                            {el.type === 'text'
                              ? el.content.slice(0, 18) || 'Text block'
                              : el.type === 'image'
                              ? 'Foto Frame'
                              : el.type === 'divider'
                              ? 'Divider Line'
                              : 'Badge Label'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateElement(el.id);
                            }}
                            className="p-1 hover:text-white text-zinc-400"
                            title="Duplikat"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteElement(el.id);
                            }}
                            className="p-1 hover:text-red-400 text-zinc-400"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRANDING & HEADERS */}
          {activeLeftTab === 'branding' && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scroller-dark text-xs">
              <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
                Header & Footer Branding
              </h3>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Nama Publikasi:
                </label>
                <input
                  type="text"
                  value={branding.publicationName}
                  onChange={(e) =>
                    updateBranding({ publicationName: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                  placeholder="ARUNE MASTER SERIES"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Issue Label / Edisi:
                </label>
                <input
                  type="text"
                  value={branding.issueLabel}
                  onChange={(e) => updateBranding({ issueLabel: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                  placeholder="VOL. 2026"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Handle / Akun Media Sosial:
                </label>
                <input
                  type="text"
                  value={branding.authorOrHandle}
                  onChange={(e) =>
                    updateBranding({ authorOrHandle: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                  placeholder="@arune.studio"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Footer Note:
                </label>
                <input
                  type="text"
                  value={branding.footerNote}
                  onChange={(e) => updateBranding({ footerNote: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                  placeholder="Master Edition"
                />
              </div>
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branding.showSlideNumbers}
                    onChange={(e) =>
                      updateBranding({ showSlideNumbers: e.target.checked })
                    }
                    className="rounded border-zinc-700 bg-zinc-900 text-blue-900 cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-300">
                    Tampilkan Nomor Slide (01 / 06)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branding.showFooterBar}
                    onChange={(e) =>
                      updateBranding({ showFooterBar: e.target.checked })
                    }
                    className="rounded border-zinc-700 bg-zinc-900 text-blue-900 cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-300">
                    Tampilkan Garis Footer Bar
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: PUBLISH TO CLOUD */}
          {activeLeftTab === 'cloud' && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scroller-dark text-xs">
              <div>
                <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
                  Publish Master Template
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Simpan tema & susunan slide ini ke Cloud Database Supabase agar dapat digunakan oleh semua pengguna.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Nama Master Template:
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                    placeholder="Contoh: Warm Linen Editorial"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Kategori:
                  </label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 cursor-pointer"
                  >
                    <option value="Editorial">Editorial</option>
                    <option value="Media">Media</option>
                    <option value="Minimalist">Minimalist</option>
                    <option value="Playful">Playful</option>
                    <option value="Typography">Typography</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Deskripsi Template:
                  </label>
                  <textarea
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 resize-none"
                    placeholder="Deskripsi singkat mengenai template ini..."
                  />
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Jumlah Slide:</span>
                    <span className="font-semibold text-zinc-200">
                      {slides.length} Slide
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aspek Rasio:</span>
                    <span className="font-semibold text-zinc-200">
                      {ASPECT_RATIOS[aspectRatio].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tema Palet:</span>
                    <span className="font-semibold text-zinc-200">
                      {themePalette.name}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePublishToCloud}
                  disabled={isPublishing}
                  className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-60"
                >
                  <Cloud
                    className={`w-4 h-4 ${isPublishing ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isPublishing
                      ? 'Menyimpan ke Cloud...'
                      : 'Publish Master Template Sekarang'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* CENTER COLUMN: LIVE INTERACTIVE WYSIWYG CANVAS */}
        <main className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden relative transition-colors ${
          workspaceDarkMode ? 'bg-[#050811]' : 'bg-slate-50'
        }`}>
          {/* Top Sub-bar with Canvas Tools */}
          <div className="h-10 border-b border-zinc-800/80 bg-zinc-900/60 px-4 flex items-center justify-between shrink-0 select-none text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 font-medium">
                Slide{' '}
                <strong className="text-zinc-100 font-bold">
                  {activeSlideIndex + 1}
                </strong>{' '}
                dari {slides.length}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-mono text-[11px]">
                {activeSlide.layout || 'Freeform Layout'}
              </span>
            </div>

            {/* Stage background & Zoom controls */}
            <div className="flex items-center gap-3">
              {/* Background dots style */}
              <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCanvasStageBg('slate')}
                  className={`p-1 rounded cursor-pointer ${
                    canvasStageBg === 'slate'
                      ? 'bg-zinc-800 text-blue-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Slate Dot Grid"
                >
                  <Grid className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasStageBg('dark')}
                  className={`p-1 rounded cursor-pointer ${
                    canvasStageBg === 'dark'
                      ? 'bg-zinc-800 text-blue-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Dark Grid"
                >
                  <Moon className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasStageBg('light')}
                  className={`p-1 rounded cursor-pointer ${
                    canvasStageBg === 'light'
                      ? 'bg-zinc-800 text-blue-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Light Grid"
                >
                  <Sun className="w-3 h-3" />
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-zinc-950 px-1 py-0.5 rounded-md border border-zinc-800">
                <button
                  type="button"
                  onClick={() =>
                    setCanvasZoom((z) => Math.max(0.2, Number((z - 0.05).toFixed(2))))
                  }
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-[11px] font-mono text-zinc-300 w-10 text-center">
                  {Math.round(canvasZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCanvasZoom((z) => Math.min(1.5, Number((z + 0.05).toFixed(2))))
                  }
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleFitZoom}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer font-medium"
                  title="Fit Slide ke Layar Kanvas"
                >
                  Fit
                </button>
              </div>

              <span className="text-[11px] text-zinc-400 font-mono">
                {ASPECT_RATIOS[aspectRatio].label}
              </span>
            </div>
          </div>

          {/* Interactive WYSIWYG Center Stage */}
          <div
            ref={previewContainerRef}
            onClick={() => setSelectedElementId(null)}
            className={`flex-1 overflow-auto flex items-center justify-center p-6 transition-colors scroller relative ${
              canvasStageBg === 'light'
                ? 'canvas-dot-grid-light'
                : canvasStageBg === 'slate'
                ? 'canvas-dot-grid-slate'
                : 'canvas-dot-grid-dark'
            }`}
          >
            {/* FLOATING ACTION PILL FOR SELECTED OBJECT */}
            {selectedElementId && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 z-40 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  onClick={() => alignElementOnCanvas(selectedElementId, 'center-x')}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white"
                  title="Ratakan Tengah Horizontal"
                >
                  <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => alignElementOnCanvas(selectedElementId, 'center-y')}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white"
                  title="Ratakan Tengah Vertikal"
                >
                  <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-zinc-800" />
                <button
                  type="button"
                  onClick={() => adjustElementZIndex(selectedElementId, 'forward')}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white"
                  title="Pindahkan Maju Satu Layer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustElementZIndex(selectedElementId, 'backward')}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white"
                  title="Pindahkan Mundur Satu Layer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-zinc-800" />
                <button
                  type="button"
                  onClick={() => duplicateElement(selectedElementId)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white"
                  title="Duplikat Elemen"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteElement(selectedElementId)}
                  className="p-1 hover:bg-zinc-800 rounded text-red-400 hover:text-red-300"
                  title="Hapus Elemen (Delete)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Real Interactive Scaled Slide Stage */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative shadow-[0_25px_70px_rgba(0,0,0,0.85)] rounded-md overflow-hidden ring-1 ring-white/20 transition-[width,height] duration-150 my-auto shrink-0"
              style={{
                width: `${scaledW}px`,
                height: `${scaledH}px`,
              }}
            >
              <SlideStage
                slide={activeSlide}
                slideIndex={activeSlideIndex}
                totalSlides={slides.length}
                aspectRatio={aspectRatio}
                theme={themePalette}
                branding={branding}
                scale={canvasZoom}
                interactive={true}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={updateElement}
                onCommitHistory={commitElementHistory}
              />
            </div>
          </div>

          {/* Bottom Filmstrip Carousel */}
          <div className="h-28 border-t border-zinc-800/80 bg-zinc-900/80 px-4 py-2 flex items-center gap-3 overflow-x-auto scroller-dark shrink-0">
            {slides.map((slide, idx) => {
              const isSelected = activeSlideIndex === idx;
              return (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-lg border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-blue-900/20 border-blue-900 ring-1 ring-blue-900/50'
                      : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800/80'
                  }`}
                >
                  <div
                    className="rounded-xs overflow-hidden relative shadow-xs bg-zinc-900 shrink-0 pointer-events-none"
                    style={{
                      width: `${thumbW}px`,
                      height: `${thumbH}px`,
                    }}
                  >
                    <SlideStage
                      slide={slide}
                      slideIndex={idx}
                      totalSlides={slides.length}
                      aspectRatio={aspectRatio}
                      theme={themePalette}
                      branding={branding}
                      scale={thumbScale}
                      interactive={false}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full px-1">
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-blue-400 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Slide {idx + 1}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSlide(idx);
                        }}
                        className="p-0.5 hover:text-white text-zinc-400"
                        title="Duplikat Slide"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                      {slides.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSlide(idx);
                          }}
                          className="p-0.5 hover:text-red-400 text-zinc-400"
                          title="Hapus Slide"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => addSlide('editorial-dropcap')}
              className="h-20 rounded-lg border border-dashed border-zinc-700 hover:border-blue-900/60 bg-zinc-950/60 hover:bg-zinc-900 px-3 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-blue-400 cursor-pointer shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[9px] font-medium">+ Slide</span>
            </button>
          </div>
        </main>

        {/* RIGHT COLUMN: FULL RIGHT INSPECTOR (TYPOGRAPHY, FILTERS, STYLES, LAYERS) */}
        <div className="w-80 border-l border-zinc-800/80 bg-zinc-950 flex flex-col shrink-0 h-full overflow-hidden">
          <RightInspector />
        </div>
      </div>
    </div>
  );
};

export const ThemeBuilderPage: React.FC = () => {
  const {
    isAdminAuthenticated,
    setAdminAuthenticated,
    setActiveView,
  } = useStudioStore();

  if (!isAdminAuthenticated) {
    return (
      <DeveloperAccessGuard
        onBack={() => setActiveView('gallery')}
        onAuthenticated={() => setAdminAuthenticated(true)}
      />
    );
  }

  return <ThemeBuilderContent />;
};

