import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  FileJson,
  Folder,
  FolderHeart,
  FolderOpen,
  FolderPlus,
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
  Users,
  X,
  Layers,
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
import {
  getCurrentUserProfile,
  getActiveTeamId,
  getTeams,
  getTeamProjects,
  subscribeToActiveTeam,
  setActiveTeamId,
  syncTeamsFromCloud,
  syncProjectsFromCloud,
  deduplicateTeamMembers,
} from '../../services/teamWorkspaceService';
import type { TeamWorkspace, TeamProjectRecord } from '../../types/team';
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
import { MoveToFolderModal } from '../folders/MoveToFolderModal';
import { UserGuidePdfModal } from '../modals/UserGuidePdfModal';
import {
  type ProjectFolder,
  getProjectFolders,
  getFolderColorTheme,
  subscribeToProjectFolders,
} from '../../services/projectFolderService';
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

  // Project Folders State
  const [allFolders, setAllFolders] = useState<ProjectFolder[]>(() => getProjectFolders());
  const [projectForFolderModal, setProjectForFolderModal] = useState<CloudTemplateRecord | null>(null);

  // User Guide PDF Modal State
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToProjectFolders((updated) => {
      setAllFolders(updated);
    });
    return () => unsub();
  }, []);

  // User Profile & Warm Greeting State
  const currentUser = useMemo(() => getCurrentUserProfile(), []);
  const firstName = useMemo(() => {
    if (!currentUser?.name) return 'Kreator';
    const parts = currentUser.name.trim().split(' ');
    return parts[0] || 'Kreator';
  }, [currentUser]);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      return { text: 'Selamat Pagi' };
    } else if (hour >= 11 && hour < 15) {
      return { text: 'Selamat Siang' };
    } else if (hour >= 15 && hour < 18) {
      return { text: 'Selamat Sore' };
    } else {
      return { text: 'Selamat Malam' };
    }
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Team Workspace & Folder State
  const [activeTeamId, setActiveTeamIdState] = useState<string | null>(getActiveTeamId());
  const [teams, setTeams] = useState<TeamWorkspace[]>(getTeams());
  const [teamProjects, setTeamProjects] = useState<TeamProjectRecord[]>(() => {
    const currentId = getActiveTeamId();
    return currentId ? getTeamProjects(currentId) : [];
  });

  useEffect(() => {
    const unsub = subscribeToActiveTeam((tId) => {
      setActiveTeamIdState(tId);
      setTeams(getTeams());
      if (tId) {
        setTeamProjects(getTeamProjects(tId));
      } else {
        setTeamProjects([]);
      }
    });
    return () => unsub();
  }, []);

  const currentTeam = useMemo(() => {
    if (!activeTeamId) return teams[0] || null;
    return teams.find((t) => t.id === activeTeamId) || teams[0] || null;
  }, [activeTeamId, teams]);

  // Synchronize teams from cloud on mount
  useEffect(() => {
    void (async () => {
      try {
        const cloudTeams = await syncTeamsFromCloud();
        setTeams(cloudTeams);
        const currId = getActiveTeamId() || cloudTeams[0]?.id || null;
        if (currId) {
          const projs = await syncProjectsFromCloud(currId);
          setTeamProjects(projs);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSwitchTeam = async (teamId: string) => {
    if (teamId === activeTeamId) return;
    setActiveTeamId(teamId);
    setActiveTeamIdState(teamId);
    setTeamProjects(getTeamProjects(teamId));
    try {
      const cloudProjs = await syncProjectsFromCloud(teamId);
      setTeamProjects(cloudProjs);
    } catch {
      // ignore
    }
  };

  // Stack of up to 5 teams, with current team always at the front/top
  const stackedTeams = useMemo(() => {
    if (!teams || teams.length === 0) return [];
    const active = currentTeam || teams[0];
    const others = teams.filter((t) => t.id !== active.id);
    return [active, ...others].slice(0, 5);
  }, [teams, currentTeam]);

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

  const handleOpenTeamProject = (project: TeamProjectRecord) => {
    try {
      const parsed = JSON.parse(project.projectJson);
      loadProjectSnapshot(
        {
          ...parsed,
          id: project.id,
        },
        openInNewTab
      );
      setActiveView('editor');
    } catch (e) {
      console.error('Failed to parse team project snapshot:', e);
      setSaveToast('Gagal memuat proyek tim: format snapshot rusak');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  const handleCreateTeamProject = async () => {
    const count = teamProjects.length + 1;
    await createNewProject({
      title: `${currentTeam?.name || 'Tim'} - Proyek #${count}`,
      aspectRatio,
      themeId: activeTheme.id,
      slideCount: 6,
      initialLayout: 'blank',
      saveCurrentFirst: autoSaveBeforeSwitch && openDocuments.length > 0,
      openInNewTab,
    });
    setActiveView('editor');
  };

  const formatRelativeTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins}m lalu`;
      if (diffHours < 24) return `${diffHours}j lalu`;
      if (diffDays < 7) return `${diffDays}h lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
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
        className={`h-14 border-b flex items-center justify-between gap-4 shrink-0 mac-drag-region transition-colors ${
          workspaceDarkMode
            ? 'border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md'
            : 'border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs'
        } ${isElectronMac() ? 'mac-traffic-light-pad is-active pl-22 sm:pl-24 pr-6' : 'px-6'}`}
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

          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            title="Buka Buku Panduan Pengguna & Tutorial PDF"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all shadow-2xs group ${
              workspaceDarkMode
                ? 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Panduan PDF</span>
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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Left Column: Greeting, Hero Draft, Quick Start, Recent Projects, Templates */}
            <div className="flex-1 min-w-0 w-full space-y-10">

              {/* WARM PERSONAL GREETING (Clean & Borderless) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      workspaceDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    {timeGreeting.text}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    • {todayFormatted}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Halo,{' '}
                  <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                    {firstName}
                  </span>
                  !
                </h1>

                <p
                  className={`text-sm sm:text-base leading-relaxed ${
                    workspaceDarkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  Mau mendesain cerita apa hari ini? Yuk, buat konten visual yang memikat dan berkesan untuk audiensmu.
                </p>
              </div>

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
                {/* Project Folders Navigation Button (to the left of Grid/List switcher) */}
                <button
                  type="button"
                  onClick={() => setActiveView('folders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all group shadow-2xs ${
                    workspaceDarkMode
                      ? 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                  title="Buka Kumpulan Folder Proyek"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Folder Proyek</span>
                  <span className="sm:hidden">Folder</span>
                </button>

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

                        {/* Folder Badges in List View */}
                        {(() => {
                          const assigned = allFolders.filter((f) => f.projectIds.includes(proj.id));
                          if (assigned.length === 0) return null;
                          return (
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {assigned.map((f) => {
                                const c = getFolderColorTheme(f.color);
                                return (
                                  <span
                                    key={f.id}
                                    className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded border flex items-center gap-1 ${c.bg} ${c.border} ${c.text}`}
                                  >
                                    <Folder className="w-2.5 h-2.5" />
                                    <span>{f.name}</span>
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
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
                        onClick={() => setProjectForFolderModal(proj)}
                        title="Simpan / Pindahkan ke Folder"
                        className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                          workspaceDarkMode
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-zinc-700'
                            : 'bg-white hover:bg-slate-100 text-amber-600 border-slate-200'
                        }`}
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
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

                          {/* Folder Tags in Grid Card */}
                          {(() => {
                            const assigned = allFolders.filter((f) => f.projectIds.includes(proj.id));
                            if (assigned.length === 0) return null;
                            return (
                              <div className="flex items-center gap-1 flex-wrap mt-2">
                                {assigned.map((f) => {
                                  const c = getFolderColorTheme(f.color);
                                  return (
                                    <span
                                      key={f.id}
                                      className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${c.bg} ${c.border} ${c.text}`}
                                    >
                                      <Folder className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[110px]">{f.name}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          })()}
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
                            onClick={() => setProjectForFolderModal(proj)}
                            title="Simpan / Pindahkan ke Folder"
                            className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                              workspaceDarkMode
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-zinc-700'
                                : 'bg-white hover:bg-slate-100 text-amber-600 border-slate-200'
                            }`}
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
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

          {/* SECTION 3: TEMPLATE CAROUSEL (Curated Templates) */}
          <section className="space-y-3.5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Template Carousel
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                    {filteredTemplates.length}
                  </span>
                </div>

                <span className="text-xs text-zinc-400 hidden sm:inline">
                  {filteredTemplates.length} desain editorial pilihan
                </span>
              </div>

              {/* Category Filter Pills - Organized Neatly in Scrollable Horizontal Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
                {templateCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : workspaceDarkMode
                        ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
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
        </div>

        {/* RIGHT COLUMN: TEAM FOLDER & WORKSPACE PANEL (DOWNWARD STACK DECK) */}
        <aside className="w-full lg:w-80 shrink-0 space-y-3.5 lg:sticky lg:top-8">
          {/* New App Version Update Alert (Compact Banner above Ruang Kerja Tim, pushes team stack down when visible) */}
          {updateAvailable?.hasUpdate && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-md flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">
                    Versi Baru (v{updateAvailable.version})
                  </div>
                  <div className="text-[10px] text-emerald-100 leading-tight truncate">
                    Fitur &amp; performa lebih baik
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('check-desktop-update-manual'));
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                Perbarui
              </button>
            </div>
          )}

          {/* Stack Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Ruang Kerja Tim ({teams.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('team')}
                  className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <span>Buka Penuh</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {currentTeam ? (
                <div className="space-y-3">
                  {/* 1. FRONT & ACTIVE CARD (Full Interactive View) */}
                  <div
                    className={`p-5 rounded-2xl border transition-all duration-300 transform shadow-sm ${
                      workspaceDarkMode
                        ? 'bg-[#0B1A2D] border-zinc-700/80'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Team Header */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {currentTeam.iconUrl ? (
                          <img
                            src={currentTeam.iconUrl}
                            alt={currentTeam.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm border border-zinc-700/50"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                            style={{ backgroundColor: currentTeam.avatarColor || '#3B82F6' }}
                          >
                            {currentTeam.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold truncate leading-tight">
                            {currentTeam.name}
                          </h3>
                          <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                            Folder Tim Aktif • {deduplicateTeamMembers(currentTeam.members || [], currentTeam.ownerId).length} Anggota
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('team')}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                        title="Buka Ruang Kerja Tim Penuh"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Team Members List */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/40 dark:border-zinc-800/60 mb-4">
                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {deduplicateTeamMembers(currentTeam.members || [], currentTeam.ownerId).slice(0, 5).map((member) => (
                          <div
                            key={member.id || member.email}
                            className="w-6 h-6 rounded-full border border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: member.avatarColor || '#6366F1' }}
                            title={`${member.name} (${member.role})`}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {deduplicateTeamMembers(currentTeam.members || [], currentTeam.ownerId).length > 5 && (
                          <div className="w-6 h-6 rounded-full border border-white dark:border-zinc-900 bg-zinc-700 text-[9px] font-semibold text-zinc-200 flex items-center justify-center">
                            +{deduplicateTeamMembers(currentTeam.members || [], currentTeam.ownerId).length - 5}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('team')}
                        className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 cursor-pointer transition-colors"
                      >
                        Kelola Tim →
                      </button>
                    </div>

                    {/* Recent Team Projects In Folder */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                          <Folder className="w-3.5 h-3.5 text-blue-500" />
                          <span>Folder Proyek Tim</span>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-500">
                          {teamProjects.length} proyek
                        </span>
                      </div>

                      {teamProjects.length === 0 ? (
                        <div className="py-6 px-4 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                          <FolderOpen className="w-7 h-7 mx-auto text-zinc-400 mb-1.5 opacity-60" />
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                            Belum ada proyek tim
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                            Mulai buat carousel pertama yang dapat diedit bersama rekan timmu.
                          </p>
                          <button
                            type="button"
                            onClick={handleCreateTeamProject}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Buat Proyek Tim</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {teamProjects.slice(0, 4).map((tp) => (
                            <button
                              key={tp.id}
                              type="button"
                              onClick={() => handleOpenTeamProject(tp)}
                              className={`w-full group p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                workspaceDarkMode
                                  ? 'bg-zinc-800/40 hover:bg-zinc-800/90 border-zinc-800/80 hover:border-blue-500/40'
                                  : 'bg-slate-50 hover:bg-white border-slate-200/80 hover:border-blue-400 shadow-2xs hover:shadow-xs'
                              }`}
                              title="Buka Proyek Tim di Editor"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    {tp.aspectRatio}
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    {tp.slideCount} slides
                                  </span>
                                </div>
                                <h4 className="text-xs font-semibold truncate group-hover:text-blue-500 transition-colors">
                                  {tp.title}
                                </h4>
                                <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                                  {tp.lastEditedBy ? `${tp.lastEditedBy} • ` : ''}
                                  {formatRelativeTime(tp.lastEditedAt)}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                          ))}

                          {teamProjects.length > 4 && (
                            <button
                              type="button"
                              onClick={() => setActiveView('team')}
                              className="w-full py-1.5 text-center text-xs text-blue-500 hover:text-blue-400 font-medium cursor-pointer"
                            >
                              Lihat semua {teamProjects.length} proyek tim →
                            </button>
                          )}
                        </div>
                      )}

                      {/* Quick Action Button */}
                      {teamProjects.length > 0 && (
                        <button
                          type="button"
                          onClick={handleCreateTeamProject}
                          className={`w-full mt-2 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                            workspaceDarkMode
                              ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-500" />
                          <span>+ Proyek Tim Baru</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. DOWNWARD STACKED DECK: OTHER TEAMS IN STACK (Hover to Pop!) */}
                  {stackedTeams.length > 1 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Tim Lainnya ({stackedTeams.length - 1})</span>
                        <span className="text-[9px] text-zinc-500">Sentuh untuk buka ke atas</span>
                      </div>

                      <div className="space-y-1.5">
                        {stackedTeams.slice(1).map((team) => {
                          const pCount = getTeamProjects(team.id).length;
                          const mCount = deduplicateTeamMembers(team.members || [], team.ownerId).length;

                          return (
                            <div
                              key={team.id}
                              onMouseEnter={() => handleSwitchTeam(team.id)}
                              onClick={() => handleSwitchTeam(team.id)}
                              className={`group relative p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-101 ${
                                workspaceDarkMode
                                  ? 'bg-[#0A1A2F]/80 hover:bg-[#0E2442] border-zinc-800 hover:border-blue-500/60'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-400'
                              }`}
                              style={{
                                borderLeftWidth: '4px',
                                borderLeftColor: team.avatarColor || '#3B82F6',
                              }}
                              title={`Arahkan kursor atau klik untuk membuka ${team.name}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {team.iconUrl ? (
                                  <img
                                    src={team.iconUrl}
                                    alt={team.name}
                                    className="w-7 h-7 rounded-lg object-cover shrink-0 shadow-2xs border border-zinc-700/40"
                                  />
                                ) : (
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                                    style={{ backgroundColor: team.avatarColor || '#3B82F6' }}
                                  >
                                    {team.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold truncate group-hover:text-blue-500 transition-colors">
                                    {team.name}
                                  </h4>
                                  <p className="text-[10px] text-zinc-400 truncate mt-0.2">
                                    {mCount} anggota • {pCount} proyek
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-zinc-400 group-hover:text-blue-500">
                                <span className="text-[10px] font-medium hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                                  Buka
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add Team Quick Button if less than 5 teams */}
                  {teams.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setActiveView('team')}
                      className={`w-full py-2 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        workspaceDarkMode
                          ? 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                          : 'border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Buat Ruang Kerja Tim Baru</span>
                    </button>
                  )}
                </div>
              ) : (
                /* No active team / Personal Mode card */
                <div
                  className={`p-6 rounded-2xl border transition-all text-center ${
                    workspaceDarkMode
                      ? 'bg-gradient-to-b from-blue-950/20 to-zinc-900 border-zinc-800'
                      : 'bg-gradient-to-b from-blue-50/50 to-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-500 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold">Folder Kolaborasi Tim</h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Bekerja bersama tim secara real-time, bagikan aset brand kit, dan kelola arsip carousel dalam satu ruang kerja.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveView('team')}
                    className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Ruang Kerja Tim</span>
                  </button>
                </div>
              )}
            </aside>
          </div>

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

      {/* Move / Save to Folder Modal */}
      {projectForFolderModal && (
        <MoveToFolderModal
          isOpen={Boolean(projectForFolderModal)}
          project={projectForFolderModal}
          onClose={() => setProjectForFolderModal(null)}
          onSuccess={(assigned) => {
            setSaveToast(
              assigned.length > 0
                ? `Proyek dimasukkan ke ${assigned.map((f) => f.name).join(', ')}`
                : 'Proyek dikeluarkan dari folder'
            );
            setTimeout(() => setSaveToast(null), 3000);
          }}
        />
      )}

      {/* FLOATING ACTION BUTTON: TUTORIAL & PANDUAN PENGGUNA (BOTTOM RIGHT) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsGuideModalOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-white/20 backdrop-blur-md group"
          title="Buka Buku Panduan Lengkap PDF Landscape Arune Studio (18 Halaman)"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="leading-tight text-white font-bold">Panduan Pengguna</span>
            <span className="text-[9px] text-blue-100 font-medium leading-none">Ebook Landscape 18 Halaman</span>
          </div>
        </button>
      </div>

      {/* User Guide PDF Modal Viewer */}
      <UserGuidePdfModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
};
