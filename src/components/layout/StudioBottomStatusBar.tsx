import React from 'react';
import { CheckCircle2, Layers, Users } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { getActiveTeamId, getTeams } from '../../services/teamWorkspaceService';
import { LiveCollaboratorsBar } from '../common/LiveCollaboratorsBar';

export const StudioBottomStatusBar: React.FC = () => {
  const {
    slides,
    activeSlideIndex,
    aspectRatio,
    workspaceDarkMode,
  } = useStudioStore();

  const activeTeamId = getActiveTeamId();
  const isTeamMode = Boolean(activeTeamId);
  const teams = getTeams();
  const currentTeam = isTeamMode ? teams.find((t) => t.id === activeTeamId) : null;
  const activeSlide = slides[activeSlideIndex] || slides[0];

  return (
    <footer
      className={`h-7 px-3 border-t flex items-center justify-between text-[11px] select-none shrink-0 z-30 transition-colors ${
        workspaceDarkMode
          ? 'bg-zinc-950 border-zinc-800/80 text-zinc-400'
          : 'bg-white border-zinc-200/90 text-zinc-600 shadow-2xs'
      }`}
    >
      {/* Left: Slide & Project Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 font-medium">
          <Layers className="w-3 h-3 text-zinc-400 shrink-0" />
          <span>
            Slide <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{activeSlideIndex + 1}</strong> / {slides.length}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {activeSlide?.elements?.length || 0} elemen
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
            {aspectRatio}
          </span>
        </div>

        {/* Team / Personal Mode Pill */}
        <div className="hidden md:flex items-center gap-1 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          {isTeamMode ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-500/20">
              <Users className="w-2.5 h-2.5" />
              <span className="truncate max-w-[120px]">{currentTeam?.name || 'Workspace Tim'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium border border-zinc-200 dark:border-zinc-800">
              Personal
            </span>
          )}
        </div>
      </div>

      {/* Center: Autosave Status */}
      <div className="hidden sm:flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        <span>Tersimpan otomatis</span>
      </div>

      {/* Right: Live Collaborators Online Indicator (Bawah Kanan dengan Floating Popover) */}
      <div className="flex items-center gap-2">
        <LiveCollaboratorsBar
          darkMode={workspaceDarkMode}
          placement="top"
          compact={true}
        />
      </div>
    </footer>
  );
};
