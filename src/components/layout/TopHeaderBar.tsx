import React from 'react';
import {
  Download,
  FileJson,
  FilePlus2,
  Home,
  Loader2,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Redo2,
  Settings,
  Sparkles,
  Sun,
  Undo2,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';

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
  } = useStudioStore();

  return (
    <header className="h-12 px-3 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md flex items-center justify-between gap-2 select-none z-40 shrink-0">
      {/* LEFT: Sidebar Toggle + Home + File Name (Only when tabs inactive) + Undo/Redo */}
      <div className="flex items-center gap-2 min-w-0">
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

        {/* File Name Input: Only shown when document tabs are inactive (< 2 open docs), without logo */}
        {openDocuments.length < 2 && (
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

      {/* RIGHT: Branding + Theme Mode + JSON + Settings + Export HD (.ZIP) Modal Trigger */}
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
    </header>
  );
};
