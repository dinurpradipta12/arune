import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  FileJson,
  FolderHeart,
  FolderOpen,
  LayoutGrid,
  LayoutList,
  Moon,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  ASPECT_RATIOS,
  CURATED_GALLERY_TEMPLATES,
  THEME_PALETTES,
} from '../../constants/themesAndPresets';
import {
  deleteTemplateById,
  listTemplates,
  upsertTemplate,
} from '../../services/supabaseTemplates';
import { useStudioStore } from '../../store/useStudioStore';
import type {
  AspectRatioKey,
  CloudTemplateRecord,
  CuratedGalleryTemplate,
} from '../../types/studio';
import {
  buildSlideFromParsedScript,
  parseScriptToStructuredSlides,
} from '../../utils/scriptParser';
import { SlideStage } from '../canvas/SlideStage';
import { DownloadStandaloneModal } from '../modals/DownloadStandaloneModal';
import { UserAuthButton } from '../common/UserAuthButton';
import { studioLogo } from '../../assets/branding';
import { isElectronMac } from '../../utils/platform';

export const TemplateGalleryPage: React.FC = () => {
  const {
    projectTitle,
    aspectRatio,
    slides,
    getActiveTheme,
    branding,
    workspaceDarkMode,
    setWorkspaceDarkMode,
    setActiveView,
    setActiveModal,
    saveCurrentProjectToVault,
    applyCuratedGalleryTemplate,
    createNewProject,
    loadProjectSnapshot,
    openDocuments,
    settings,
    cloudMasterTemplates,
    lastSavedAt,
    past,
  } = useStudioStore();

  const [savedProjects, setSavedProjects] = useState<CloudTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const isUnsaved = !lastSavedAt || (past && past.length > 0);
  const autoSaveBeforeSwitch = settings.autoSaveLocalCache;
  const openInNewTab = settings.defaultOpenInNewTab;
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Desktop / Web Version Check State
  const [updateAvailable, setUpdateAvailable] = useState<{
    hasUpdate: boolean;
    version: string;
    releaseDate?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAppVersion = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).aruneDesktop?.checkForUpdates) {
          const currentBuild =
            typeof __APP_BUILD_ID__ !== 'undefined'
              ? __APP_BUILD_ID__
              : typeof __APP_VERSION__ !== 'undefined'
              ? __APP_VERSION__
              : '1.0.0';
          const res = await (window as any).aruneDesktop.checkForUpdates(currentBuild);
          if (isMounted && res && res.hasUpdate) {
            setUpdateAvailable({
              hasUpdate: true,
              version: res.latestVersion || '1.0.2',
              releaseDate: res.releaseDate,
            });
            return;
          }
        }

        const targetUrl =
          typeof window !== 'undefined' && window.location.origin.startsWith('http')
            ? `${window.location.origin}/version.json?t=${Date.now()}`
            : `https://arune.pages.dev/version.json?t=${Date.now()}`;
        const res = await fetch(targetUrl, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) return;
        const data = await res.json();
        const currentBuild =
          typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : '';
        const currentVersion =
          typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.1';

        const hasRemoteUpdate = Boolean(
          (data.build && currentBuild && !currentBuild.includes(data.build.slice(0, 7))) ||
          (data.version && data.version !== currentVersion)
        );

        if (isMounted && hasRemoteUpdate) {
          setUpdateAvailable({
            hasUpdate: true,
            version: data.version || '1.0.2',
            releaseDate: data.builtAt,
          });
        }
      } catch {
        // ignore network error
      }
    };

    void checkAppVersion();
    const interval = setInterval(checkAppVersion, 45_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeTheme = getActiveTheme();

  const refreshSavedProjects = async () => {
    setIsLoading(true);
    try {
      const res = await listTemplates();
      setSavedProjects(res.templates);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSavedProjects();
  }, []);

  // 1-Click Quick Create from Aspect Ratio Card
  const handleQuickCreateProject = async (ratio: AspectRatioKey) => {
    const label = ASPECT_RATIOS[ratio].shortLabel;
    const count = openDocuments.length + 1;
    await createNewProject({
      title: `Project ${label} #${count}`,
      aspectRatio: ratio,
      themeId: activeTheme.id,
      slideCount: 1,
      initialLayout: 'blank',
      saveCurrentFirst: autoSaveBeforeSwitch && openDocuments.length > 0,
      openInNewTab,
    });
    setActiveView('editor');
  };

  const handleSaveCurrent = async (asNewCopy = false) => {
    await saveCurrentProjectToVault({
      asNewCopy,
      customTitle: asNewCopy ? `${projectTitle} (Copy)` : projectTitle,
      description: `${slides.length} slides · ${aspectRatio} · ${activeTheme.name}`,
    });
    setSaveToast('Disimpan ke Local Cache!');
    setTimeout(() => setSaveToast(null), 2500);
    await refreshSavedProjects();
  };

  const handleOpenSavedProject = async (record: CloudTemplateRecord) => {
    if (autoSaveBeforeSwitch && openDocuments.length > 0) {
      await saveCurrentProjectToVault();
    }
    loadProjectSnapshot(
      {
        id: record.id,
        projectTitle: record.name,
        aspectRatio: record.aspectRatio,
        activeThemeId: record.themeId,
        branding: record.branding,
        scriptText: record.scriptText,
        slides: record.slides,
      },
      openInNewTab
    );
    setActiveView('editor');
  };

  const handleDuplicateSavedProject = async (record: CloudTemplateRecord) => {
    await upsertTemplate({
      id: `${record.id}-copy-${Date.now().toString(36).slice(-4)}`,
      name: `${record.name} (Copy)`,
      description: record.description,
      aspectRatio: record.aspectRatio,
      themeId: record.themeId,
      branding: record.branding,
      scriptText: record.scriptText,
      slides: JSON.parse(JSON.stringify(record.slides)),
    });
    await refreshSavedProjects();
  };

  // Pre-build curated templates previews
  const curatedPreviews = useMemo(() => {
    const builtIn = CURATED_GALLERY_TEMPLATES.map((tpl) => {
      const theme =
        THEME_PALETTES.find((t) => t.id === tpl.themeId) || THEME_PALETTES[0];
      const parsedSlides = parseScriptToStructuredSlides(tpl.scriptText);
      const firstSlide = buildSlideFromParsedScript(
        parsedSlides[0],
        0,
        theme,
        tpl.aspectRatio
      );
      return {
        tpl,
        theme,
        firstSlide,
        slideCount: parsedSlides.length,
        cloudSlides: undefined as CloudTemplateRecord['slides'] | undefined,
      };
    });

    const fromCloud = cloudMasterTemplates.map((rec) => {
      const theme =
        THEME_PALETTES.find((t) => t.id === rec.themeId) || THEME_PALETTES[0];
      const tpl: CuratedGalleryTemplate = {
        id: rec.id,
        title: rec.name,
        subtitle: rec.description || 'Synced Cloud Master Template',
        category: 'Cloud Master',
        aspectRatio: rec.aspectRatio,
        themeId: rec.themeId,
        branding: rec.branding,
        scriptText: rec.scriptText,
      };
      const firstSlide =
        rec.slides?.[0] ||
        buildSlideFromParsedScript(
          parseScriptToStructuredSlides(rec.scriptText)[0],
          0,
          theme,
          rec.aspectRatio
        );
      return {
        tpl,
        theme,
        firstSlide,
        slideCount: rec.slides?.length || 1,
        cloudSlides: rec.slides,
      };
    });

    return [...fromCloud, ...builtIn];
  }, [cloudMasterTemplates]);

  const templateCategories = useMemo(() => {
    const cats = new Set<string>(['All']);
    curatedPreviews.forEach(({ tpl }) => cats.add(tpl.category));
    return Array.from(cats);
  }, [curatedPreviews]);

  const filteredSavedProjects = useMemo(() => {
    if (!searchQuery.trim()) return savedProjects;
    const q = searchQuery.toLowerCase();
    return savedProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [savedProjects, searchQuery]);

  const filteredTemplates = useMemo(() => {
    return curatedPreviews.filter(({ tpl }) => {
      const matchCat =
        selectedCategory === 'All' || tpl.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [curatedPreviews, selectedCategory, searchQuery]);

  return (
    <div
      className={`flex-1 flex flex-col h-full w-full overflow-hidden select-none transition-colors ${
        workspaceDarkMode
          ? 'bg-[#0A1A2F] text-zinc-100'
          : 'bg-[#F1F5F4] text-[#2F3E46]'
      }`}
    >
      {/* ================================================================== */}
      {/* 1. TOP HEADER BAR (Logo, Centered Search Bar, Utilities, Profile)  */}
      {/* ================================================================== */}
      <header
        className={`h-14 px-6 border-b flex items-center justify-between gap-4 shrink-0 mac-drag-region transition-colors ${
          workspaceDarkMode
            ? 'border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md'
            : 'border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs'
        } ${isElectronMac() ? 'pl-22' : 'px-6'}`}
      >
        {/* Left: Studio Logo & Title */}
        <div className="flex items-center gap-3 mac-no-drag shrink-0">
          <img
            src={studioLogo}
            alt="Arune Studio Logo"
            className="w-8 h-8 object-contain shrink-0 rounded-lg shadow-sm"
          />
          <div className="hidden sm:block">
            <h1 className="text-xs font-bold leading-tight tracking-tight">
              {settings.studioName || 'Arune Carousel Studio'}
            </h1>
            <p className="text-[10px] font-mono font-medium text-blue-500 leading-none mt-0.5">
              {settings.studioSubtitle || 'Carousel & Story Pro'}
            </p>
          </div>
        </div>

        {/* Center: Sleek Search Bar */}
        <div className="flex-1 max-w-lg mac-no-drag">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari project tersimpan atau template majalah..."
              className={`w-full pl-9 pr-8 py-1.5 rounded-full text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                workspaceDarkMode
                  ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500'
                  : 'bg-slate-100 border border-slate-200 text-slate-800 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Tools & Profile */}
        <div className="flex items-center gap-2 mac-no-drag shrink-0">
          <button
            type="button"
            onClick={() => setActiveModal('json')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              workspaceDarkMode
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
            title="Import File .JSON Proyek"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">Buka JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('team')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              workspaceDarkMode
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
            title="Team Workspace & Folder Proyek"
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">Team</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceDarkMode(!workspaceDarkMode)}
            title={workspaceDarkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              workspaceDarkMode
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-amber-300'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-amber-500 shadow-2xs'
            }`}
          >
            {workspaceDarkMode ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('settings')}
            title="Pengaturan Studio"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              workspaceDarkMode
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <div
            className={`w-px h-5 mx-0.5 ${
              workspaceDarkMode ? 'bg-zinc-800' : 'bg-slate-200'
            }`}
          />

          <UserAuthButton darkMode={workspaceDarkMode} />
        </div>
      </header>

      {/* ================================================================== */}
      {/* 2. MAIN SCROLLABLE CONTENT (Quick Start, Recent, Curated)          */}
      {/* ================================================================== */}
      <div className="flex-1 overflow-y-auto scroller-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

          {/* ACTIVE SESSION HERO CARD (If user currently has an open draft) */}
          {openDocuments.length > 0 && (
            <div
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${
                isUnsaved
                  ? workspaceDarkMode
                    ? 'bg-blue-950/20 border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-200'
                  : workspaceDarkMode
                  ? 'bg-zinc-900/70 border-zinc-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 w-full md:w-auto">
                {/* Mini Slide 0 Preview */}
                {slides[0] && (
                  <div
                    className="relative overflow-hidden rounded-lg border border-zinc-700/60 shrink-0 shadow-md bg-zinc-950"
                    style={{
                      width: `${Math.round(
                        ASPECT_RATIOS[aspectRatio].stageWidth * 0.08
                      )}px`,
                      height: `${Math.round(
                        ASPECT_RATIOS[aspectRatio].stageHeight * 0.08
                      )}px`,
                    }}
                  >
                    <div className="pointer-events-none">
                      <SlideStage
                        slide={slides[0]}
                        slideIndex={0}
                        totalSlides={slides.length}
                        aspectRatio={aspectRatio}
                        theme={activeTheme}
                        branding={branding}
                        scale={0.08}
                        interactive={false}
                      />
                    </div>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 uppercase">
                      Sesi Aktif ({aspectRatio})
                    </span>
                    {isUnsaved ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Draft Belum Disimpan
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        ✓ Tersimpan {lastSavedAt ? `(${lastSavedAt})` : ''}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold truncate">
                    {projectTitle || 'Untitled Carousel'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {slides.length} slide • Tema: {activeTheme.name}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveCurrent(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${
                    workspaceDarkMode
                      ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                  title="Simpan Proyek Sekarang"
                >
                  <Save className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Simpan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('editor')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span>Lanjutkan Desain di Editor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 1: MULAI DESAIN BARU (1-Click Quick Start Cards) */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Mulai Desain Baru</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pilih format kanvas untuk langsung membuat carousel atau story baru dengan 1 klik.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Instagram Carousel (4:5 Portrait) */}
              <button
                type="button"
                onClick={() => handleQuickCreateProject('4:5')}
                className={`group p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:scale-[1.01] ${
                  workspaceDarkMode
                    ? 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-blue-500/50'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Miniature 4:5 Frame Illustration */}
                  <div
                    className={`w-12 h-14 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      workspaceDarkMode
                        ? 'bg-zinc-950 border-zinc-800 group-hover:border-blue-500/50'
                        : 'bg-slate-100 border-slate-200 group-hover:border-blue-400'
                    }`}
                  >
                    <div className="w-6 h-8 rounded-xs border-2 border-blue-500 bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    1080 × 1350 px
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold group-hover:text-blue-500 transition-colors">
                      Instagram Carousel (4:5)
                    </h3>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    Format portrait feed terfavorit untuk carousel bernilai edukasi, tips, dan microblog.
                  </p>
                </div>
              </button>

              {/* 2. Stories & Reels (9:16 Vertical) */}
              <button
                type="button"
                onClick={() => handleQuickCreateProject('9:16')}
                className={`group p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:scale-[1.01] ${
                  workspaceDarkMode
                    ? 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-purple-500/50'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-purple-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Miniature 9:16 Frame Illustration */}
                  <div
                    className={`w-12 h-14 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      workspaceDarkMode
                        ? 'bg-zinc-950 border-zinc-800 group-hover:border-purple-500/50'
                        : 'bg-slate-100 border-slate-200 group-hover:border-purple-400'
                    }`}
                  >
                    <div className="w-5 h-9 rounded-xs border-2 border-purple-500 bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    1080 × 1920 px
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold group-hover:text-purple-500 transition-colors">
                      Stories &amp; Reels (9:16)
                    </h3>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    Full-bleed vertical untuk Instagram Stories, TikTok, dan kartu visual Reels.
                  </p>
                </div>
              </button>

              {/* 3. Square Post (1:1 Square) */}
              <button
                type="button"
                onClick={() => handleQuickCreateProject('1:1')}
                className={`group p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:scale-[1.01] ${
                  workspaceDarkMode
                    ? 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-emerald-500/50'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Miniature 1:1 Frame Illustration */}
                  <div
                    className={`w-12 h-14 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      workspaceDarkMode
                        ? 'bg-zinc-950 border-zinc-800 group-hover:border-emerald-500/50'
                        : 'bg-slate-100 border-slate-200 group-hover:border-emerald-400'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xs border-2 border-emerald-500 bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    1080 × 1080 px
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold group-hover:text-emerald-500 transition-colors">
                      Square Feed Post (1:1)
                    </h3>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    Format bujur sangkar serbaguna untuk postingan feed Instagram, LinkedIn &amp; Twitter.
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* SECTION 2: PROYEK TERAKHIR (Recent Projects) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderHeart className="w-4 h-4 text-blue-500" />
                <h2 className="text-lg font-bold tracking-tight">Proyek Terakhir</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                  {filteredSavedProjects.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewLayout('grid')}
                    className={`p-1 rounded cursor-pointer ${
                      viewLayout === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLayout('list')}
                    className={`p-1 rounded cursor-pointer ${
                      viewLayout === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="List View"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={refreshSavedProjects}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                    workspaceDarkMode
                      ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                  title="Segarkan Daftar Proyek"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            {filteredSavedProjects.length === 0 ? (
              <div
                className={`rounded-2xl border border-dashed p-8 text-center space-y-3 ${
                  workspaceDarkMode
                    ? 'border-zinc-800 bg-zinc-900/20'
                    : 'border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Belum Ada Proyek Tersimpan</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Mulai dengan memilih salah satu format kanvas di atas atau pilih template siap pakai di bawah untuk mulai mendesain.
                  </p>
                </div>
              </div>
            ) : viewLayout === 'list' ? (
              <div className="space-y-2">
                {filteredSavedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenSavedProject(proj)}
                    className={`group p-3.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      workspaceDarkMode
                        ? 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-blue-500/50'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-400 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate group-hover:text-blue-500 transition-colors">
                          {proj.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {proj.description || `${proj.slides.length} slides • ${proj.aspectRatio}`}
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 shrink-0"
                    >
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                        {proj.aspectRatio} • {proj.slides.length} slides
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSavedProject(proj)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-xs"
                      >
                        Buka
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateSavedProject(proj)}
                        title="Duplikat Proyek"
                        className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                          workspaceDarkMode
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteTemplateById(proj.id);
                          refreshSavedProjects();
                        }}
                        title="Hapus Proyek"
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSavedProjects.map((proj) => {
                  const projTheme =
                    THEME_PALETTES.find((t) => t.id === proj.themeId) ||
                    THEME_PALETTES[0];
                  const dim =
                    ASPECT_RATIOS[proj.aspectRatio] || ASPECT_RATIOS['4:5'];
                  const previewScale =
                    proj.aspectRatio === '9:16' ? 0.20 : 0.26;
                  const firstSlide = proj.slides?.[0];

                  return (
                    <div
                      key={proj.id}
                      onClick={() => handleOpenSavedProject(proj)}
                      className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer ${
                        workspaceDarkMode
                          ? 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-blue-500/50'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div
                        className={`p-4 flex items-center justify-center border-b min-h-[200px] ${
                          workspaceDarkMode
                            ? 'bg-zinc-950/80 border-zinc-800/80'
                            : 'bg-slate-100/70 border-slate-200'
                        }`}
                      >
                        {firstSlide ? (
                          <div
                            className="relative overflow-hidden rounded-md shadow-md ring-1 ring-white/10 group-hover:scale-[1.02] transition-transform"
                            style={{
                              width: `${Math.round(
                                dim.stageWidth * previewScale
                              )}px`,
                              height: `${Math.round(
                                dim.stageHeight * previewScale
                              )}px`,
                            }}
                          >
                            <div className="pointer-events-none">
                              <SlideStage
                                slide={firstSlide}
                                slideIndex={0}
                                totalSlides={proj.slides.length}
                                aspectRatio={proj.aspectRatio}
                                theme={projTheme}
                                branding={proj.branding}
                                scale={previewScale}
                                interactive={false}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-20 rounded bg-zinc-800/40 flex items-center justify-center text-zinc-500">
                            <FolderOpen className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info & Action Buttons */}
                      <div className="p-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase">
                              {proj.aspectRatio} • {proj.slides.length} Slide
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <h4 className="text-xs font-bold truncate group-hover:text-blue-500 transition-colors">
                            {proj.name}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {proj.description || 'Proyek Carousel'}
                          </p>
                        </div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 pt-1 border-t border-zinc-800/50"
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenSavedProject(proj)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>Buka</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateSavedProject(proj)}
                            title="Duplikat Proyek"
                            className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                              workspaceDarkMode
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteTemplateById(proj.id);
                              refreshSavedProjects();
                            }}
                            title="Hapus Proyek"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION 3: TEMPLATE MAJALAH & INSPIRASI (Curated Templates) */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-purple-500" />
                <h2 className="text-lg font-bold tracking-tight">
                  Template Majalah &amp; Desain Pilihan
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-semibold">
                  {filteredTemplates.length}
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {templateCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : workspaceDarkMode
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredTemplates.map(
                ({ tpl, theme, firstSlide, slideCount, cloudSlides }) => {
                  const dim = ASPECT_RATIOS[tpl.aspectRatio];
                  const previewScale =
                    tpl.aspectRatio === '9:16' ? 0.20 : 0.26;

                  const handleUseTemplate = () => {
                    if (cloudSlides && cloudSlides.length > 0) {
                      loadProjectSnapshot(
                        {
                          id: `tpl-${tpl.id}-${Date.now().toString(36).slice(-4)}`,
                          projectTitle: tpl.title,
                          aspectRatio: tpl.aspectRatio,
                          activeThemeId: tpl.themeId,
                          branding: tpl.branding,
                          scriptText: tpl.scriptText,
                          slides: cloudSlides,
                        },
                        openInNewTab
                      );
                    } else {
                      applyCuratedGalleryTemplate(
                        tpl,
                        autoSaveBeforeSwitch,
                        openInNewTab
                      );
                    }
                    setActiveView('editor');
                  };

                  return (
                    <div
                      key={tpl.id}
                      onClick={handleUseTemplate}
                      className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer ${
                        workspaceDarkMode
                          ? 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-purple-500/50'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-purple-400'
                      }`}
                    >
                      {/* Cover Thumbnail */}
                      <div
                        className={`p-4 flex items-center justify-center border-b min-h-[210px] ${
                          workspaceDarkMode
                            ? 'bg-zinc-950/80 border-zinc-800/80'
                            : 'bg-slate-100/70 border-slate-200'
                        }`}
                      >
                        <div
                          className="relative overflow-hidden rounded-md shadow-md ring-1 ring-white/10 group-hover:scale-[1.02] transition-transform"
                          style={{
                            width: `${Math.round(
                              dim.stageWidth * previewScale
                            )}px`,
                            height: `${Math.round(
                              dim.stageHeight * previewScale
                            )}px`,
                          }}
                        >
                          <div className="pointer-events-none">
                            <SlideStage
                              slide={firstSlide}
                              slideIndex={0}
                              totalSlides={slideCount}
                              aspectRatio={tpl.aspectRatio}
                              theme={theme}
                              branding={tpl.branding}
                              scale={previewScale}
                              interactive={false}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="p-4 space-y-2.5">
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 uppercase">
                              {tpl.category}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 font-medium">
                              {slideCount} Slide
                            </span>
                          </div>
                          <h4 className="text-xs font-bold truncate group-hover:text-purple-500 transition-colors">
                            {tpl.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {tpl.subtitle}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-xs font-semibold text-blue-500 group-hover:text-blue-400">
                          <span>Gunakan Template</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          {/* New App Version Update Alert (If available) */}
          {updateAvailable?.hasUpdate && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-100" />
                </div>
                <div>
                  <div className="text-sm font-bold">
                    Versi Baru Tersedia (v{updateAvailable.version})
                  </div>
                  <div className="text-xs text-emerald-100">
                    Klik untuk memperbarui aplikasi ke versi terbaru dengan fitur dan performa lebih baik.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('check-desktop-update-manual'));
                }}
                className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer shrink-0 shadow-md"
              >
                Perbarui Sekarang
              </button>
            </div>
          )}

          {/* Toast Notification */}
          {saveToast && (
            <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <Check className="w-4 h-4" />
              <span>{saveToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* Standalone Desktop App Download Modal */}
      <DownloadStandaloneModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
};
