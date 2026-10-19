import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  Download,
  FileJson,
  FilePlus2,
  FolderHeart,
  FolderOpen,
  Home,
  LayoutGrid,
  LayoutList,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import {
  ASPECT_RATIOS,
  CURATED_GALLERY_TEMPLATES,
  LAYOUT_PRESETS,
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
  LayoutPresetId,
} from '../../types/studio';
import {
  buildSlideFromParsedScript,
  parseScriptToStructuredSlides,
} from '../../utils/scriptParser';
import { SlideStage } from '../canvas/SlideStage';
import { DownloadStandaloneModal } from '../modals/DownloadStandaloneModal';

type HomeNavTab = 'home' | 'new-project' | 'recent' | 'templates';

export const TemplateGalleryPage: React.FC = () => {
  const {
    projectTitle,
    setProjectTitle,
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
    activeDocumentId,
    switchDocumentTab,
    closeDocumentTab,
    openBlankDocumentTab,
    settings,
    cloudMasterTemplates,
    lastSavedAt,
    past,
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<HomeNavTab>('home');
  const [savedProjects, setSavedProjects] = useState<CloudTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const isUnsaved = !lastSavedAt || (past && past.length > 0);
  const [autoSaveBeforeSwitch, setAutoSaveBeforeSwitch] = useState(
    settings.autoSaveLocalCache
  );
  const [openInNewTab, setOpenInNewTab] = useState(
    settings.defaultOpenInNewTab
  );
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Affinity / Photoshop "New Document" Builder State
  const [newDocTitle, setNewDocTitle] = useState('Untitled Editorial Story');
  const [newDocRatio, setNewDocRatio] = useState<AspectRatioKey>(
    settings.defaultAspectRatio || '4:5'
  );
  const [newDocThemeId, setNewDocThemeId] = useState<string>(
    settings.defaultThemeId || THEME_PALETTES[0].id
  );
  const [newDocSlideCount, setNewDocSlideCount] = useState<number>(
    settings.defaultSlideCount || 6
  );
  const [newDocLayout, setNewDocLayout] =
    useState<LayoutPresetId>('cover-overlay');

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

  const handleSaveCurrent = async (asNewCopy = false) => {
    await saveCurrentProjectToVault({
      asNewCopy,
      customTitle: asNewCopy ? `${projectTitle} (Copy)` : projectTitle,
      description: `${slides.length} slides · ${aspectRatio} · ${activeTheme.name}`,
    });
    setSaveToast('Disimpan ke Local Cache Perangkat!');
    setTimeout(() => setSaveToast(null), 2800);
    await refreshSavedProjects();
  };

  const handleOpenSavedProject = async (record: CloudTemplateRecord) => {
    if (autoSaveBeforeSwitch) {
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

  const handleQuickCreatePreset = async (ratio: AspectRatioKey) => {
    await createNewProject({
      title: `Editorial ${ASPECT_RATIOS[ratio].shortLabel} #${
        openDocuments.length + 1
      }`,
      aspectRatio: ratio,
      themeId: activeTheme.id,
      slideCount: settings.defaultSlideCount || 6,
      initialLayout: 'cover-overlay',
      saveCurrentFirst: autoSaveBeforeSwitch,
      openInNewTab,
    });
  };

  const handleCreateCustomDocument = async () => {
    await createNewProject({
      title: newDocTitle,
      aspectRatio: newDocRatio,
      themeId: newDocThemeId,
      slideCount: newDocSlideCount,
      initialLayout: newDocLayout,
      saveCurrentFirst: autoSaveBeforeSwitch,
      openInNewTab,
    });
  };

  // Pre-build cover slides for curated + cloud master templates
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

  // Pre-build visual thumbnail slides for each layout preset using the selected theme & ratio
  const layoutPreviews = useMemo(() => {
    const selectedTheme =
      THEME_PALETTES.find((t) => t.id === newDocThemeId) || THEME_PALETTES[0];
    const map: Record<string, ReturnType<typeof buildSlideFromParsedScript>> = {};

    for (const lp of LAYOUT_PRESETS) {
      try {
        const slide = buildSlideFromParsedScript(
          {
            layout: lp.id,
            header: 'CAROUSEL EDITION · ISSUE 01',
            kicker: 'CHAPTER 01 · PERSPECTIVE',
            title: lp.name.split(' ').length > 2
              ? `${lp.name.split(' ').slice(0, 2).join(' ')} *${lp.name.split(' ').slice(2).join(' ')}*`
              : `${lp.name} *Visuals*`,
            lead: '*A quiet visual exploration crafted with unhurried typography and spatial balance.*',
            body: '[W]e begin with light and structure. Every frame invites the viewer to pause and experience design with purpose.',
            caption: '*Studio Notes · 2026 Archive.*',
          },
          0,
          selectedTheme,
          newDocRatio
        );
        map[lp.id] = slide;
      } catch (e) {
        console.warn(`Failed to build preview for layout ${lp.id}:`, e);
      }
    }
    return map;
  }, [newDocThemeId, newDocRatio]);

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

  const selectedNewDocTheme =
    THEME_PALETTES.find((t) => t.id === newDocThemeId) || THEME_PALETTES[0];
  const selectedNewDocDim = ASPECT_RATIOS[newDocRatio];

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-zinc-950 text-zinc-100 select-none">
      {/* ================================================================== */}
      {/* LEFT SIDEBAR RAIL (AFFINITY / PHOTOSHOP WELCOME DOCK)              */}
      {/* ================================================================== */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-900/50 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-5">
          {/* Studio Brand Header */}
          <div className="flex items-center gap-3 px-1">
            <img
              src="/favicon.png"
              alt="Arune Carousel Studio"
              className="w-11 h-11 object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[13px] font-bold tracking-tight text-zinc-100 leading-tight truncate">
                {settings.studioName || 'Arune Carousel Studio'}
              </div>
              <div className="text-[10.5px] font-mono text-blue-900 mt-0.5 truncate font-medium">
                {settings.studioSubtitle || 'Carousel & Story Pro'}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons: New Project & Open JSON */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab('new-project')}
              className="w-full py-2.5 px-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Project Baru (New)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('json')}
              className="w-full py-2 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-900" />
              <span>Buka File (.JSON)...</span>
            </button>
          </div>

          {/* Navigation Links (Home, New Document, Recent Projects, Templates) */}
          <nav className="space-y-1 pt-2 border-t border-zinc-800/80">
            {(
              [
                {
                  id: 'home',
                  label: 'Beranda (Home)',
                  icon: Home,
                },
                {
                  id: 'new-project',
                  label: 'Preset & Dokumen Baru',
                  icon: FilePlus2,
                },
                {
                  id: 'recent',
                  label: 'Project Tersimpan',
                  icon: FolderHeart,
                  badge: savedProjects.length,
                },
                {
                  id: 'templates',
                  label: 'Template Majalah',
                  icon: LayoutGrid,
                  badge: curatedPreviews.length,
                },
              ] as {
                id: HomeNavTab;
                label: string;
                icon: React.ElementType;
                badge?: number;
              }[]
            ).map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-900/10 text-blue-900 border border-blue-900/30 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-blue-900" />
                    <span>{item.label}</span>
                  </span>
                  {typeof item.badge === 'number' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Active Editor Session Card & Workspace Utilities */}
        <div className="space-y-3 pt-3 border-t border-zinc-800/80">
          {/* Open Document Tabs & Active Session Card */}
          <div
            className={`p-3 rounded-xl space-y-2.5 transition-all ${
              isUnsaved
                ? 'bg-gradient-to-br from-amber-950/25 via-zinc-900/90 to-zinc-900 border border-amber-500/40 shadow-xs ring-1 ring-amber-500/20'
                : 'bg-zinc-900 border border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 whitespace-nowrap">
                  Dokumen ({openDocuments.length})
                </span>
                {isUnsaved ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                    <span>Draft</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-400 font-medium">✓ Saved</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => openBlankDocumentTab(aspectRatio)}
                title="Tambah Tab Dokumen Baru"
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-900/10 hover:bg-blue-900/20 border border-blue-900/30 text-blue-900 cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Tab Baru</span>
              </button>
            </div>

            {/* List of Open Document Tabs */}
            <div className="space-y-1 max-h-28 overflow-y-auto scroller-dark">
              {openDocuments.map((doc) => {
                const isActive = doc.id === activeDocumentId;
                const liveTitle = isActive ? projectTitle : doc.projectTitle;
                const liveRatio = isActive ? aspectRatio : doc.aspectRatio;
                const docUnsaved = isActive ? isUnsaved : !doc.lastSavedAt;
                return (
                  <div
                    key={doc.id}
                    onClick={() => switchDocumentTab(doc.id)}
                    className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors ${
                      isActive
                        ? docUnsaved
                          ? 'bg-amber-500/15 border border-amber-500/40 text-amber-100 font-semibold shadow-xs'
                          : 'bg-blue-900/10 border border-blue-900/30 text-zinc-100 font-semibold'
                        : 'bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/70 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate flex-1">
                      {docUnsaved && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Ada perubahan belum disimpan" />
                      )}
                      <span className="truncate">{liveTitle}</span>
                    </div>
                    <span className="text-[9.5px] font-mono text-zinc-400 shrink-0">
                      {liveRatio}
                    </span>
                    {openDocuments.length >= 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeDocumentTab(doc.id);
                        }}
                        title="Tutup Tab"
                        className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveView('editor')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Buka Editor</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleSaveCurrent(false)}
                title="Simpan Sesi Aktif"
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-blue-900" />
              </button>
            </div>
            {saveToast && (
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span className="truncate">{saveToast}</span>
              </div>
            )}
          </div>

          {/* Workspace Mode & Studio Settings Footer */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => setWorkspaceDarkMode(!workspaceDarkMode)}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {workspaceDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-blue-900" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-900" />
                  <span>Dark Navy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('settings')}
              title="Pengaturan Studio (Settings, Hotkeys & Interface)"
              className="py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-blue-900" />
              <span>Setting</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================================================================== */}
      {/* CENTER & RIGHT WORKSPACE AREA                                      */}
      {/* ================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Hub Bar (Search, New Tab Toggle, Auto-Save Toggle, & Quick Jump to Active Editor) */}
        <header className="h-14 px-6 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari project tersimpan atau template majalah..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-900 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <label
              title="Jika dicentang, membuka project/template kedua akan otomatis membuka Tab baru di atas ruler"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-blue-900 focus:ring-0"
              />
              <span>Buka sebagai Tab Baru</span>
            </label>

            <label className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSaveBeforeSwitch}
                onChange={(e) => setAutoSaveBeforeSwitch(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-blue-900 focus:ring-0"
              />
              <span>Auto-save</span>
            </label>

            <button
              type="button"
              onClick={() => setActiveModal('script')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-blue-900" />
              <span className="hidden sm:inline">Script Generator</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 hover:from-blue-600 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-950/40 cursor-pointer transition-all"
              title="Unduh Installer Standalone untuk macOS atau Windows"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Standalone App</span>
            </button>
          </div>
        </header>

        {/* ================================================================ */}
        {/* TAB 2: AFFINITY / PHOTOSHOP "NEW DOCUMENT" BUILDER               */}
        {/* ================================================================ */}
        {activeTab === 'new-project' ? (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Center Preset Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroller-dark">
              <div>
                <h1 className="text-xl font-serif text-zinc-100">
                  Buat Project Baru (New Document)
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pilih ukuran rasio kanvas, layout pembuka, dan palet warna editorial seperti pada Affinity / Photoshop.
                </p>
              </div>

              {/* Step 1: Canvas Aspect Ratio Presets */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  1. Pilih Ukuran Kanvas (Document Preset)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map(
                    (key) => {
                      const cfg = ASPECT_RATIOS[key];
                      const active = newDocRatio === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setNewDocRatio(key)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                            active
                              ? 'bg-blue-900/10 border-blue-900/40 text-zinc-100 shadow-sm'
                              : 'bg-zinc-900/75 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          {/* Visual Ratio Frame */}
                          <div className="w-11 h-14 flex items-center justify-center shrink-0">
                            <div
                              className={`border-2 rounded-xs ${
                                active
                                  ? 'border-blue-900 bg-blue-900/20'
                                  : 'border-zinc-600 bg-zinc-800'
                              }`}
                              style={{
                                width:
                                  key === '1:1'
                                    ? '34px'
                                    : key === '4:5'
                                    ? '32px'
                                    : '26px',
                                height:
                                  key === '1:1'
                                    ? '34px'
                                    : key === '4:5'
                                    ? '40px'
                                    : '46px',
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-zinc-100">
                              {cfg.shortLabel}
                            </div>
                            <div className="text-[11px] font-mono text-blue-900 mt-0.5 font-medium">
                              {cfg.exportWidth} × {cfg.exportHeight} px
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              {key === '4:5'
                                ? 'Instagram Feed Portrait'
                                : key === '9:16'
                                ? 'Instagram Story / Reels'
                                : 'Classic Square Carousel'}
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Step 2: Theme Palette Selection */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  2. Pilih Palet Warna & Tipografi Majalah
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {THEME_PALETTES.map((t) => {
                    const active = newDocThemeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewDocThemeId(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                          active
                            ? 'bg-blue-900/10 border-blue-900/40 text-zinc-100'
                            : 'bg-zinc-900/75 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {[
                            t.background,
                            t.darkBackground,
                            t.accent,
                            t.textPrimary,
                          ].map((c, idx) => (
                            <span
                              key={idx}
                              className="w-4 h-4 rounded-full border border-zinc-700"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-100">
                            {t.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 line-clamp-1">
                            {t.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Starting Cover Layout with Visual Design Thumbnails */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    3. Pilih Layout Slide Pertama (Live Design Preview)
                  </h2>
                  <span className="text-[10px] text-zinc-400">
                    Menampilkan {LAYOUT_PRESETS.length} layout visual dengan tema {selectedNewDocTheme.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {LAYOUT_PRESETS.map((lp) => {
                    const active = newDocLayout === lp.id;
                    const previewSlide = layoutPreviews[lp.id];
                    // Dynamic scale: 4:5 ~0.24, 9:16 ~0.20, 1:1 ~0.25
                    const thumbScale =
                      newDocRatio === '9:16'
                        ? 0.20
                        : newDocRatio === '4:5'
                        ? 0.24
                        : 0.25;
                    const thumbW = Math.round(selectedNewDocDim.stageWidth * thumbScale);
                    const thumbH = Math.round(selectedNewDocDim.stageHeight * thumbScale);

                    return (
                      <button
                        key={lp.id}
                        type="button"
                        onClick={() => setNewDocLayout(lp.id)}
                        className={`group rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm ${
                          active
                            ? 'bg-blue-900/15 border-blue-900 ring-2 ring-blue-900/40 text-zinc-100 shadow-md scale-[1.01]'
                            : 'bg-zinc-900/75 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        {/* Visual Live Slide Thumbnail Canvas */}
                        <div className="bg-zinc-950/80 p-3.5 flex items-center justify-center border-b border-zinc-800/80 min-h-[175px] relative overflow-hidden">
                          {previewSlide ? (
                            <div
                              className="relative overflow-hidden rounded shadow-lg ring-1 ring-white/10 group-hover:scale-[1.03] transition-transform duration-200"
                              style={{
                                width: `${thumbW}px`,
                                height: `${thumbH}px`,
                              }}
                            >
                              <div className="pointer-events-none">
                                <SlideStage
                                  slide={previewSlide}
                                  slideIndex={0}
                                  totalSlides={newDocSlideCount}
                                  aspectRatio={newDocRatio}
                                  theme={selectedNewDocTheme}
                                  branding={branding}
                                  scale={thumbScale}
                                  interactive={false}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-500">
                              Preview...
                            </div>
                          )}

                          {/* Active Indicator Badge Overlay */}
                          {active && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-blue-900 text-white text-[9px] font-semibold shadow-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Dipilih
                            </span>
                          )}
                        </div>

                        {/* Layout Info Footer */}
                        <div className="p-3 space-y-1 bg-zinc-900/90">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-zinc-100 truncate">
                              {lp.name}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-blue-900 font-semibold shrink-0">
                              {lp.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 leading-snug">
                            {lp.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right-Hand Affinity/Photoshop Preset Details Inspector */}
            <aside className="w-80 border-l border-zinc-800/80 bg-zinc-900/60 p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-4">
                <div className="pb-3 border-b border-zinc-800">
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                    Preset Details
                  </div>
                  <div className="text-sm font-semibold text-zinc-100 mt-0.5">
                    Konfigurasi Dokumen
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 block">
                    Judul Project (Document Title)
                  </label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-900 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-zinc-400 block">
                      Width (Lebar)
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-100">
                      {selectedNewDocDim.exportWidth} px
                    </span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-zinc-400 block">
                      Height (Tinggi)
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-100">
                      {selectedNewDocDim.exportHeight} px
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Jumlah Slide Awal</span>
                    <span className="font-mono text-blue-900 font-semibold">
                      {newDocSlideCount} Slides
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={newDocSlideCount}
                    onChange={(e) =>
                      setNewDocSlideCount(Number(e.target.value))
                    }
                    className="w-full accent-blue-900 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Rasio Kanvas</span>
                    <span className="font-mono text-zinc-200">
                      {selectedNewDocDim.shortLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Palet Tema</span>
                    <span className="text-zinc-200">
                      {selectedNewDocTheme.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Heading Font</span>
                    <span className="text-zinc-200">
                      {selectedNewDocTheme.headingFont}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Color Space</span>
                    <span className="font-mono text-zinc-200">sRGB · 300 DPI</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateCustomDocument}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Buat & Buka di Editor</span>
              </button>
            </aside>
          </div>
        ) : (
          /* ================================================================ */
          /* TABS: HOME, RECENT SAVED PROJECTS, & CURATED TEMPLATES           */
          /* ================================================================ */
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scroller-dark">
            {/* QUICK START FORMAT PRESETS BAR (Shown on Home Tab) */}
            {activeTab === 'home' && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-serif text-zinc-100">
                      Selamat Datang di {settings.studioName || 'Arune Carousel Studio'}
                    </h1>
                    <p className="text-xs text-zinc-400">
                      Mulai dokumen baru dari ukuran preset, lanjutkan sesi terakhir, atau buka template majalah.
                    </p>
                  </div>
                </div>

                {/* Affinity / Photoshop Quick Preset Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map(
                    (key) => {
                      const cfg = ASPECT_RATIOS[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleQuickCreatePreset(key)}
                          className="group p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-blue-900/50 flex items-center gap-3.5 text-left transition-all cursor-pointer shadow-xs"
                        >
                          <div className="w-10 h-12 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-blue-900/40">
                            <div
                              className="border-2 border-blue-900 bg-blue-900/15 rounded-[2px]"
                              style={{
                                width:
                                  key === '1:1'
                                    ? '24px'
                                    : key === '4:5'
                                    ? '22px'
                                    : '18px',
                                height:
                                  key === '1:1'
                                    ? '24px'
                                    : key === '4:5'
                                    ? '28px'
                                    : '32px',
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-100 group-hover:text-blue-900 transition-colors">
                              + {cfg.shortLabel} Baru
                            </div>
                            <div className="text-[10.5px] font-mono text-zinc-400">
                              {cfg.exportWidth} × {cfg.exportHeight} px
                            </div>
                            <div className="text-[10px] text-blue-900 font-medium mt-0.5">
                              Klik untuk mulai cepat →
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}

                  {/* Active Session Quick Card in the 4th slot */}
                  <div
                    className={`p-3.5 rounded-xl transition-all flex items-center justify-between gap-3 shadow-md ${
                      isUnsaved
                        ? 'bg-gradient-to-br from-amber-950/50 via-zinc-900 to-amber-900/30 border-2 border-amber-500/60 shadow-amber-950/40 ring-1 ring-amber-500/30'
                        : 'bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-900 border border-emerald-500/40 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {slides[0] && (
                        <div
                          className={`relative overflow-hidden rounded shrink-0 transition-all ${
                            isUnsaved
                              ? 'border-2 border-amber-500/70 ring-1 ring-amber-500/40 shadow-xs'
                              : 'border border-zinc-700'
                          }`}
                          style={{
                            width: `${Math.round(
                              ASPECT_RATIOS[aspectRatio].stageWidth * 0.09
                            )}px`,
                            height: `${Math.round(
                              ASPECT_RATIOS[aspectRatio].stageHeight * 0.09
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
                              scale={0.09}
                              interactive={false}
                            />
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isUnsaved ? (
                            <>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-300">
                                Sedang Diedit · Belum Disimpan
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
                                Sedang Diedit · Tersimpan {lastSavedAt ? `(${lastSavedAt})` : ''}
                              </span>
                            </>
                          )}
                        </div>
                        <input
                          type="text"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          aria-label="Judul Project Aktif"
                          className="bg-transparent text-xs font-bold text-zinc-100 focus:outline-none border-b border-zinc-700/60 focus:border-amber-400 w-full truncate pb-0.5"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setActiveView('editor')}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                              isUnsaved
                                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                                : 'bg-blue-900 hover:bg-blue-800 text-white'
                            }`}
                          >
                            <span>Lanjutkan</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCurrent(false)}
                            className={`text-[11px] font-medium px-2 py-1 rounded-lg border cursor-pointer flex items-center gap-1 transition-colors ${
                              isUnsaved
                                ? 'bg-zinc-800/90 hover:bg-zinc-700 text-amber-200 border-amber-500/40'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            <Save className={`w-3 h-3 ${isUnsaved ? 'text-amber-400' : 'text-zinc-400'}`} />
                            <span>Simpan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION: RECENT / SAVED PROJECTS (Shown on Home & Recent Tabs) */}
            {(activeTab === 'home' || activeTab === 'recent') && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderHeart className="w-4 h-4 text-blue-900" />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-100">
                      Recent & Saved Projects ({filteredSavedProjects.length})
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveCurrent(false)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Simpan Sesi Saat Ini</span>
                    </button>

                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewLayout('grid')}
                        title="Grid View"
                        className={`p-1 rounded cursor-pointer ${
                          viewLayout === 'grid'
                            ? 'bg-zinc-800 text-blue-900'
                            : 'text-zinc-400'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewLayout('list')}
                        title="List View"
                        className={`p-1 rounded cursor-pointer ${
                          viewLayout === 'list'
                            ? 'bg-zinc-800 text-blue-900'
                            : 'text-zinc-400'
                        }`}
                      >
                        <LayoutList className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={refreshSavedProjects}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                      title="Segarkan Daftar Project"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isLoading ? 'animate-spin' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {filteredSavedProjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="text-xs font-medium text-zinc-200">
                        Belum ada project yang tersimpan di daftar Recent Projects
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Simpan sesi project yang sedang Anda kerjakan atau pilih salah satu template di bawah untuk memulai.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveCurrent(false)}
                      className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Project Aktif Sekarang</span>
                    </button>
                  </div>
                ) : viewLayout === 'list' ? (
                  <div className="space-y-2">
                    {filteredSavedProjects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => handleOpenSavedProject(proj)}
                        className="group p-3 rounded-xl bg-zinc-900/75 hover:bg-zinc-900 border border-zinc-800 hover:border-blue-900/50 flex items-center justify-between gap-4 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FolderOpen className="w-4 h-4 text-blue-900 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-100 truncate">
                              {proj.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate">
                              {proj.description}
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 shrink-0"
                        >
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-blue-900 font-medium">
                            {proj.aspectRatio} · {proj.slides.length} slides
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenSavedProject(proj)}
                            className="px-3 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs cursor-pointer"
                          >
                            Buka
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateSavedProject(proj)}
                            title="Duplikat"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteTemplateById(proj.id);
                              refreshSavedProjects();
                            }}
                            title="Hapus"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 cursor-pointer"
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
                        proj.aspectRatio === '9:16' ? 0.21 : 0.28;
                      const firstSlide = proj.slides?.[0];

                      return (
                        <div
                          key={proj.id}
                          onClick={() => handleOpenSavedProject(proj)}
                          className="group rounded-xl bg-zinc-900/75 border border-zinc-800/90 hover:border-blue-900/50 overflow-hidden flex flex-col justify-between transition-all shadow-sm cursor-pointer"
                        >
                          <div className="bg-zinc-950/80 p-3.5 flex items-center justify-center border-b border-zinc-800/80 min-h-[210px]">
                            {firstSlide ? (
                              <div
                                className="relative overflow-hidden rounded shadow-md ring-1 ring-white/10 group-hover:scale-[1.02] transition-transform"
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
                              <div className="text-xs text-zinc-500">
                                No preview
                              </div>
                            )}
                          </div>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="p-3.5 space-y-2.5"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-xs font-semibold text-zinc-100 truncate">
                                  {proj.name}
                                </h3>
                                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-blue-900 font-medium shrink-0">
                                  {proj.aspectRatio} · {proj.slides.length}s
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                {proj.description}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(proj.updatedAt).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenSavedProject(proj)}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Buka Project</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDuplicateSavedProject(proj)
                                }
                                title="Duplikat Project"
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteTemplateById(proj.id);
                                  refreshSavedProjects();
                                }}
                                title="Hapus Project"
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 cursor-pointer"
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
            )}

            {/* SECTION: CURATED EDITORIAL MAGAZINE TEMPLATES (Shown on Home & Templates Tabs) */}
            {(activeTab === 'home' || activeTab === 'templates') && (
              <section className="space-y-3.5 pt-2 border-t border-zinc-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-blue-900" />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-100">
                      Presets & Koleksi Template Majalah ({filteredTemplates.length})
                    </h2>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    {templateCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium cursor-pointer transition-colors ${
                          selectedCategory === cat
                            ? 'bg-blue-900/10 text-blue-900 border border-blue-900/30 font-semibold'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredTemplates.map(
                    ({ tpl, theme, firstSlide, slideCount, cloudSlides }) => {
                      const dim = ASPECT_RATIOS[tpl.aspectRatio];
                      const previewScale =
                        tpl.aspectRatio === '9:16' ? 0.21 : 0.28;

                      const handleUseTemplate = () => {
                        if (cloudSlides && cloudSlides.length > 0) {
                          loadProjectSnapshot(
                            {
                              id: `tpl-${tpl.id}-${Date.now()
                                .toString(36)
                                .slice(-4)}`,
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
                      };

                      return (
                        <div
                          key={tpl.id}
                          onClick={handleUseTemplate}
                          className="group rounded-xl bg-zinc-900/75 border border-zinc-800/90 hover:border-blue-900/50 overflow-hidden flex flex-col justify-between transition-all shadow-sm cursor-pointer"
                        >
                          <div className="bg-zinc-950/90 p-3.5 flex items-center justify-center border-b border-zinc-800/80 min-h-[215px]">
                            <div
                              className="relative overflow-hidden rounded shadow-md ring-1 ring-white/10 group-hover:scale-[1.02] transition-transform"
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

                          <div className="p-3.5 space-y-2.5">
                            <div>
                              <div className="flex items-center justify-between gap-1.5 mb-1">
                                <span className="text-[9.5px] uppercase tracking-wider text-blue-900 font-semibold truncate">
                                  {tpl.category}
                                </span>
                                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0">
                                  {tpl.aspectRatio} · {slideCount} Slides
                                </span>
                              </div>
                              <h3 className="text-xs font-semibold text-zinc-100">
                                {tpl.title}
                              </h3>
                              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {tpl.subtitle}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseTemplate();
                              }}
                              className="w-full py-1.5 px-3 rounded-lg bg-zinc-800 group-hover:bg-blue-900 text-zinc-100 group-hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Gunakan Template</span>
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Standalone Desktop App Download Modal */}
      <DownloadStandaloneModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
};

