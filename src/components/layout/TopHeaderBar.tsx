import {
  Download,
  FileJson,
  FilePlus2,
  Home,
  ImageDown,
  Loader2,
  Maximize2,
  Minus,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Redo2,
  Settings,
  Sparkles,
  Sun,
  Undo2,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { exportSingleSlidePng } from '../../utils/exportEngine';
import { isElectronMac } from '../../utils/platform';

export const TopHeaderBar: React.FC = () => {
  const {
    projectTitle,
    setProjectTitle,
    aspectRatio,
    leftSidebarOpen,
    setLeftSidebarOpen,
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
    canvasZoom,
    setCanvasZoom,
    slides,
    activeSlideIndex,
  } = useStudioStore();

  return (
    <header
      className={`h-12 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md flex items-center justify-between gap-2 select-none z-40 shrink-0 mac-drag-region ${
        isElectronMac() ? 'pl-22 pr-3' : 'px-3'
      }`}
    >
      {/* LEFT: Sidebar Toggle + Home + File Name (Only when tabs inactive) + Undo/Redo */}
      <div className="flex items-center gap-2 min-w-0 mac-no-drag">
        {activeView === 'editor' && (
          <button
            type="button"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            title={
              leftSidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'
            }
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition-colors cursor-pointer"
          >
            {leftSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Home / Project Hub Button with Home Icon (No Brand Logo) */}
        <button
          type="button"
          onClick={() => setActiveView('gallery')}
          title="Kembali ke Home / Pemilihan Project & Template"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-100 hover:text-blue-900 transition-all cursor-pointer shrink-0"
        >
          <Home className="w-4 h-4 text-blue-900" />
          <span className="hidden sm:inline font-semibold">Home</span>
        </button>

        {/* File Name Input: Only shown when exactly 1 document is open */}
        {openDocuments.length === 1 && (
          <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-2">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              aria-label="Project title"
              className="bg-transparent text-xs font-medium text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-900 rounded px-1.5 py-0.5 w-36 sm:w-48 truncate"
            />
            <button
              type="button"
              onClick={() => openBlankDocumentTab(aspectRatio)}
              title="Buka Dokumen Baru di Tab Baru"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 transition-colors cursor-pointer flex items-center gap-1 text-[10.5px]"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-blue-900" />
              <span className="hidden lg:inline">+ Tab</span>
            </button>
          </div>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Cmd/Ctrl+Z)"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Cmd/Ctrl+Shift+Z)"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RIGHT: Canvas Zoom & Export Slide Ini + Utilities + Export HD (.ZIP) */}
      <div className="flex items-center gap-2 mac-no-drag">
        {/* Canvas Zoom & Single Slide Export (Editor Mode) */}
        {activeView === 'editor' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/90 text-zinc-200 shadow-xs">
            <button
              type="button"
              onClick={() => setCanvasZoom(canvasZoom - 0.1)}
              disabled={canvasZoom <= 0.5}
              title="Zoom Out"
              className="p-1 rounded hover:bg-zinc-700/50 disabled:opacity-30 cursor-pointer text-zinc-400 hover:text-zinc-100"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={50}
              max={150}
              step={5}
              value={Math.round(canvasZoom * 100)}
              onChange={(e) => setCanvasZoom(Number(e.target.value) / 100)}
              aria-label="Canvas Zoom Percentage"
              className="w-16 sm:w-20 lg:w-24 accent-blue-900 cursor-pointer h-1"
            />

            <span className="text-[11px] font-mono w-9 text-center tabular-nums text-zinc-300">
              {Math.round(canvasZoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setCanvasZoom(canvasZoom + 0.1)}
              disabled={canvasZoom >= 1.5}
              title="Zoom In"
              className="p-1 rounded hover:bg-zinc-700/50 disabled:opacity-30 cursor-pointer text-zinc-400 hover:text-zinc-100"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setCanvasZoom(aspectRatio === '9:16' ? 0.68 : 0.9)}
              title="Reset Zoom to Fit"
              className="p-1 rounded hover:bg-zinc-700/50 text-[10.5px] font-medium px-1.5 border-l border-zinc-700/50 cursor-pointer flex items-center gap-1 text-zinc-300 hover:text-white"
            >
              <Maximize2 className="w-3 h-3 text-zinc-400" />
              <span>Fit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const currentSlide = slides[activeSlideIndex];
                exportSingleSlidePng({
                  slideIndex: activeSlideIndex,
                  slideLayout: currentSlide?.layout || 'slide',
                  projectTitle,
                  pixelRatio: 3,
                });
              }}
              title="Export Slide Ini (HD PNG)"
              className="p-1 rounded hover:bg-blue-900/30 text-blue-400 hover:text-blue-300 text-[10.5px] font-medium px-2 border-l border-zinc-700/50 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <ImageDown className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Export Slide Ini</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveModal('branding')}
            title="Global Branding"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-900" />
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceDarkMode(!workspaceDarkMode)}
            title={
              workspaceDarkMode
                ? 'Switch Workspace to White Mode'
                : 'Switch Workspace to Deep Midnight Navy (Biru Donker Gelap)'
            }
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            {workspaceDarkMode ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('json')}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Import or Export JSON Carousel Template"
          >
            <FileJson className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('settings')}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 transition-colors cursor-pointer"
            title="Pengaturan Studio (Settings, Hotkeys & Interface)"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('export')}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-60 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="max-w-[140px] truncate">
                  {exportProgress || 'Exporting HD...'}
                </span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.25]" />
                <span>Export HD (.ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
