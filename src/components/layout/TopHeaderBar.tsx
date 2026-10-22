import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileJson,
  FilePlus2,
  Folder,
  Home,
  ImageDown,
  Loader2,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Redo2,
  Settings,
  Sparkles,
  Sun,
  Undo2,
  Users,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { copySlideToClipboard, exportSingleSlidePng } from '../../utils/exportEngine';
import { isElectronMac } from '../../utils/platform';
import { UserAuthButton } from '../common/UserAuthButton';
import { getActiveTeamId, getCurrentUserTeamRole } from '../../services/teamWorkspaceService';
import { MoveToFolderModal } from '../folders/MoveToFolderModal';
import {
  type ProjectFolder,
  getFoldersForProject,
  subscribeToProjectFolders,
} from '../../services/projectFolderService';

export const TopHeaderBar: React.FC = () => {
  const {
    projectId,
    projectTitle,
    setProjectTitle,
    aspectRatio,
    leftSidebarOpen,
    setLeftSidebarOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
    workspaceDarkMode,
    setWorkspaceDarkMode,
    activeView,
    setActiveView,
    setActiveModal,
    isExporting,
    exportProgress,
    past,
    future,
    undo,
    redo,
    openDocuments,
    openBlankDocumentTab,
    slides,
    activeSlideIndex,
    lastSavedAt,
    saveCurrentProjectToVault,
  } = useStudioStore();

  const activeTeamId = getActiveTeamId();
  const isViewer = Boolean(activeTeamId && getCurrentUserTeamRole(activeTeamId) === 'viewer');

  // Dropdown states
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isCopyingSlide, setIsCopyingSlide] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Folder Modal & Membership State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [assignedFolders, setAssignedFolders] = useState<ProjectFolder[]>(() =>
    projectId ? getFoldersForProject(projectId) : []
  );

  useEffect(() => {
    if (projectId) {
      setAssignedFolders(getFoldersForProject(projectId));
    } else {
      setAssignedFolders([]);
    }

    const unsub = subscribeToProjectFolders(() => {
      if (projectId) {
        setAssignedFolders(getFoldersForProject(projectId));
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleOpenFolderModal = async () => {
    // If project has not been saved yet, save it first so it gets a stable ID in templates
    if (!projectId || !lastSavedAt) {
      await saveCurrentProjectToVault();
    }
    setIsFolderModalOpen(true);
  };

  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setExportMenuOpen(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const handleCopyCurrentSlide = async () => {
    try {
      setIsCopyingSlide(true);
      await copySlideToClipboard({ slideIndex: activeSlideIndex });
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setExportMenuOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to copy slide:', err);
    } finally {
      setIsCopyingSlide(false);
    }
  };

  const handleExportSingleSlide = () => {
    const currentSlide = slides[activeSlideIndex];
    exportSingleSlidePng({
      slideIndex: activeSlideIndex,
      slideLayout: currentSlide?.layout || 'slide',
      projectTitle,
      pixelRatio: 3,
    });
    setExportMenuOpen(false);
  };

  return (
    <header
      className={`h-12 border-b flex items-center justify-between gap-2 select-none z-40 shrink-0 mac-drag-region transition-colors ${
        isElectronMac() ? 'mac-traffic-light-pad is-active pl-22 sm:pl-24 pr-3' : 'px-3'
      } ${
        workspaceDarkMode
          ? 'border-zinc-800/80 bg-zinc-950/95 text-zinc-100 backdrop-blur-md'
          : 'border-slate-200 bg-white/95 text-slate-800 backdrop-blur-md shadow-2xs'
      }`}
    >
      {/* LEFT: Sidebar Toggle + Home + File Title Input + Undo/Redo */}
      <div className="flex items-center gap-2 min-w-0 mac-no-drag">
        {activeView === 'editor' && (
          <button
            type="button"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            title={leftSidebarOpen ? 'Sembunyikan Sidebar Kiri' : 'Tampilkan Sidebar Kiri'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              workspaceDarkMode
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {leftSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Home Button */}
        <button
          type="button"
          onClick={() => setActiveView('gallery')}
          title="Kembali ke Home (Pilihan Project & Template)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            workspaceDarkMode
              ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs'
          }`}
        >
          <Home className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">Home</span>
        </button>

        {/* Vertical Divider */}
        <div
          className={`w-px h-4.5 mx-0.5 ${
            workspaceDarkMode ? 'bg-zinc-800' : 'bg-slate-200'
          }`}
        />

        {/* Project Title Input (Clean inline editing) */}
        {openDocuments.length <= 1 && (
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              aria-label="Project title"
              title="Klik untuk mengubah nama project"
              className={`text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 w-32 sm:w-44 md:w-56 truncate bg-transparent transition-colors ${
                workspaceDarkMode
                  ? 'text-zinc-100 hover:bg-zinc-900/50'
                  : 'text-slate-800 hover:bg-slate-100/60'
              }`}
            />
            {openDocuments.length === 1 && (
              <button
                type="button"
                onClick={() => openBlankDocumentTab(aspectRatio)}
                title="Buka Dokumen Baru di Tab Baru"
                className={`p-1 rounded-md text-[10.5px] font-medium border flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                  workspaceDarkMode
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <FilePlus2 className="w-3 h-3 text-blue-500" />
                <span className="hidden xl:inline">+ Tab</span>
              </button>
            )}

            {/* Folder Assignment Button / Pill */}
            <button
              type="button"
              onClick={handleOpenFolderModal}
              title={
                assignedFolders.length > 0
                  ? `Folder: ${assignedFolders.map((f) => f.name).join(', ')} (Klik untuk memindahkan)`
                  : 'Simpan / Pindahkan ke Folder'
              }
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                assignedFolders.length > 0
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  : workspaceDarkMode
                  ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Folder className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline font-semibold max-w-[120px] truncate">
                {assignedFolders.length > 0 ? assignedFolders[0].name : 'Pindahkan ke Folder'}
              </span>
              {assignedFolders.length > 1 && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                  +{assignedFolders.length - 1}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            type="button"
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Cmd/Ctrl+Z)"
            className={`p-1.5 rounded-md disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer ${
              workspaceDarkMode
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Cmd/Ctrl+Shift+Z)"
            className={`p-1.5 rounded-md disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer ${
              workspaceDarkMode
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Viewer Role Indicator Badge */}
        {isViewer && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-[10.5px] font-semibold shrink-0">
            <Eye className="w-3 h-3" />
            <span>Viewer Mode</span>
          </div>
        )}
      </div>

      {/* RIGHT: Team + Compact Utilities + Smart Export + User Profile */}
      <div className="flex items-center gap-1.5 mac-no-drag shrink-0">
        {/* Team Workspace Button */}
        <button
          type="button"
          onClick={() => setActiveView('team')}
          title="Team Workspace & Folder Proyek"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            workspaceDarkMode
              ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline font-semibold">Team</span>
        </button>

        {/* Vertical Divider */}
        <div
          className={`w-px h-4.5 mx-0.5 ${
            workspaceDarkMode ? 'bg-zinc-800' : 'bg-slate-200'
          }`}
        />

        {/* Dark / Light Mode Toggle */}
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

        {/* More Actions Menu (...) */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            title="Menu Lainnya (Branding, Template JSON, Pengaturan)"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              moreMenuOpen
                ? workspaceDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
                : workspaceDarkMode
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* More Options Flyout Dropdown */}
          {moreMenuOpen && (
            <div
              className={`absolute right-0 mt-1.5 w-56 rounded-xl border shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                workspaceDarkMode
                  ? 'bg-zinc-950/98 border-zinc-800 text-zinc-200'
                  : 'bg-white/98 border-slate-200 text-slate-800 shadow-xl'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveModal('branding');
                  setMoreMenuOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  workspaceDarkMode ? 'hover:bg-zinc-850 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <div>
                  <div className="font-semibold">Global Branding</div>
                  <div className="text-[10px] text-zinc-400">Atur watermark, logo, dan handle</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal('json');
                  setMoreMenuOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  workspaceDarkMode ? 'hover:bg-zinc-850 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileJson className="w-3.5 h-3.5 text-emerald-500" />
                <div>
                  <div className="font-semibold">Import / Export JSON</div>
                  <div className="text-[10px] text-zinc-400">Simpan atau pulihkan file proyek</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleOpenFolderModal();
                  setMoreMenuOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  workspaceDarkMode ? 'hover:bg-zinc-850 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <div className="font-semibold">Simpan / Pindahkan ke Folder</div>
                  <div className="text-[10px] text-zinc-400">
                    {assignedFolders.length > 0
                      ? `Di folder: ${assignedFolders.map((f) => f.name).join(', ')}`
                      : 'Kelompokkan proyek ke folder kategori'}
                  </div>
                </div>
              </button>

              <div
                className={`my-1 border-t ${
                  workspaceDarkMode ? 'border-zinc-800' : 'border-slate-150'
                }`}
              />

              <button
                type="button"
                onClick={() => {
                  setActiveModal('settings');
                  setMoreMenuOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  workspaceDarkMode ? 'hover:bg-zinc-850 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <div>
                  <div className="font-semibold">Pengaturan Studio</div>
                  <div className="text-[10px] text-zinc-400">Hotkey, interface & preset studio</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Right Inspector Sidebar Toggle (Editor View Only) */}
        {activeView === 'editor' && (
          <button
            type="button"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            title={rightSidebarOpen ? 'Sembunyikan Inspector Kanan' : 'Tampilkan Inspector Kanan'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              rightSidebarOpen
                ? workspaceDarkMode
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-blue-400'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-blue-600 shadow-2xs'
                : workspaceDarkMode
                ? 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800/80 text-zinc-400'
                : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-500'
            }`}
          >
            {rightSidebarOpen ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Vertical Divider */}
        <div
          className={`w-px h-4.5 mx-0.5 ${
            workspaceDarkMode ? 'bg-zinc-800' : 'bg-slate-200'
          }`}
        />

        {/* Unified Smart Export Button */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer select-none ${
              workspaceDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
                : 'bg-[#2F3E46] hover:bg-[#3D505A] active:bg-[#253238] text-white shadow-sm'
            } disabled:opacity-60`}
            title="Pilihan Export (Download HD .ZIP, Salin Slide ke Clipboard, atau Download PNG)"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="max-w-[120px] truncate">
                  {exportProgress || 'Exporting...'}
                </span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.25]" />
                <span>Export HD</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-150 ${
                    exportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </>
            )}
          </button>

          {/* Smart Export Dropdown Menu */}
          {exportMenuOpen && (
            <div
              className={`absolute right-0 top-full mt-1.5 w-64 rounded-xl border shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                workspaceDarkMode
                  ? 'bg-zinc-950/98 border-zinc-800 text-zinc-200'
                  : 'bg-white/98 border-slate-200 text-slate-800 shadow-xl'
              }`}
            >
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono">
                Pilihan Export
              </div>

              {/* 1. Download Semua Slide (.ZIP) */}
              <button
                type="button"
                onClick={() => {
                  setActiveModal('export');
                  setExportMenuOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  workspaceDarkMode ? 'hover:bg-zinc-850 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Download Semua Slide (.ZIP)</div>
                  <div className="text-[10px] text-zinc-400">Export batch PNG / JPG / PDF</div>
                </div>
              </button>

              <div
                className={`my-1 border-t ${
                  workspaceDarkMode ? 'border-zinc-800' : 'border-slate-150'
                }`}
              />

              {/* 2. Salin Slide Ini ke Clipboard */}
              <button
                type="button"
                disabled={isCopyingSlide}
                onClick={handleCopyCurrentSlide}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  workspaceDarkMode ? 'hover:bg-zinc-850 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    {copySuccess ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {copySuccess ? 'Tersalin ke Clipboard!' : 'Salin Slide Ini'}
                    </div>
                    <div className="text-[10px] text-zinc-400">Siap Paste ke WA / Slack</div>
                  </div>
                </div>
                {isCopyingSlide && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
              </button>

              {/* 3. Download Slide Ini (PNG) */}
              <button
                type="button"
                onClick={handleExportSingleSlide}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  workspaceDarkMode ? 'hover:bg-zinc-850 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <ImageDown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Download Slide Ini Saja</div>
                  <div className="text-[10px] text-zinc-400">HD PNG (Resolusi Retina 3×)</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <UserAuthButton darkMode={workspaceDarkMode} />
      </div>

      {/* Move / Save to Folder Modal in Editor */}
      {isFolderModalOpen && (
        <MoveToFolderModal
          isOpen={isFolderModalOpen}
          project={{
            id: projectId || 'proj-current',
            name: projectTitle || 'Dokumen Carousel',
          }}
          onClose={() => setIsFolderModalOpen(false)}
        />
      )}
    </header>
  );
};
