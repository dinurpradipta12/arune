import React, { useEffect, useState, useRef } from 'react';
import { Users, X } from 'lucide-react';
import {
  multiplayerService,
  type MultiplayerState,
} from '../../services/multiplayerService';
import { getAvatarPresetById } from '../../constants/avatarPresets';
import { isSupabaseConfigured } from '../../services/supabaseClient';

interface LiveCollaboratorsBarProps {
  darkMode?: boolean;
  placement?: 'top' | 'bottom';
  compact?: boolean;
}

export const LiveCollaboratorsBar: React.FC<LiveCollaboratorsBarProps> = ({
  darkMode = true,
  placement = 'bottom',
  compact = false,
}) => {
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerState>({
    isConnected: false,
    roomId: '',
    peers: [],
    activeUsersCount: 1,
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let lastSummary = '';
    const unsubscribe = multiplayerService.subscribeToState((state) => {
      const summary = `${state.isConnected}_${state.roomId}_${state.activeUsersCount}_${state.peers
        .map((p) => `${p.userId}:${p.name}:${p.activeSlideIndex}`)
        .join('|')}`;
      if (summary !== lastSummary) {
        lastSummary = summary;
        setMultiplayerState(state);
      }
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasSupabase = isSupabaseConfigured();
  const myIdentity = multiplayerService.getMyIdentity();
  const myAvatarPreset = getAvatarPresetById(myIdentity.avatarId);
  const otherPeers = multiplayerState.peers;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Kolaborasi Realtime Tim & Kursor Multiplayer"
        className={`flex items-center gap-1.5 rounded-md border font-medium transition-all cursor-pointer ${
          compact ? 'px-2 py-0.5 text-[11px] h-5.5' : 'px-2.5 py-1.5 text-xs'
        } ${
          darkMode
            ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
            : 'bg-white hover:bg-zinc-50 border-zinc-200/90 text-zinc-700 shadow-2xs'
        }`}
      >
        {/* Pulsing Green Live Dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        {/* Stacked Avatars for other peers */}
        {otherPeers.length > 0 ? (
          <div className="flex items-center -space-x-1.5">
            {otherPeers.slice(0, 3).map((peer) => {
              const preset = getAvatarPresetById(peer.avatarId);
              return (
                <img
                  key={peer.userId}
                  src={preset.svgDataUri}
                  alt={peer.name}
                  title={`${peer.name} (Slide ${peer.activeSlideIndex + 1})`}
                  className="w-3.5 h-3.5 rounded-full ring-1 ring-zinc-900 object-cover shadow-2xs"
                />
              );
            })}
            {otherPeers.length > 3 && (
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-700 text-[8.5px] font-bold text-white flex items-center justify-center ring-1 ring-zinc-900">
                +{otherPeers.length - 3}
              </span>
            )}
          </div>
        ) : (
          <Users className="w-3 h-3 text-emerald-500" />
        )}

        <span className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
          {multiplayerState.activeUsersCount} Online
        </span>
      </button>

      {/* Popover / Dropdown Menu Floating Window */}
      {isOpen && (
        <div
          className={`absolute right-0 w-72 rounded-xl border shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            darkMode
              ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100'
              : 'bg-white/95 border-zinc-200 text-zinc-800'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60 dark:border-zinc-800/60 border-zinc-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold tracking-tight">Kolaborator Tim Online</span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                {multiplayerState.activeUsersCount} Aktif
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
              title="Tutup (Close)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Room info */}
          <div className="py-1 px-2 mt-2 rounded bg-zinc-900/50 dark:bg-zinc-900/50 bg-zinc-100 flex items-center justify-between text-[10.5px] text-zinc-400 dark:text-zinc-400 text-zinc-500 font-mono">
            <span>Room:</span>
            <span className="truncate max-w-[150px] font-semibold text-emerald-600 dark:text-emerald-400" title={multiplayerState.roomId}>
              {multiplayerState.roomId || 'global_collab_room'}
            </span>
          </div>

          {/* Collaborators List */}
          <div className="mt-2.5 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 text-zinc-500">
              Anggota di Kanvas ({multiplayerState.activeUsersCount})
            </div>

            {/* Local User */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-900/40 dark:bg-zinc-900/40 bg-zinc-100/70 border border-zinc-800/40 dark:border-zinc-800/40 border-zinc-200">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={myAvatarPreset.svgDataUri}
                  alt={myIdentity.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500/50 shrink-0"
                />
                <div className="truncate">
                  <div className="text-xs font-medium truncate flex items-center gap-1">
                    <span>{myIdentity.name}</span>
                    <span className="text-[9px] text-emerald-500 font-bold">(Anda)</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-400 text-zinc-500">
                    Kursor aktif
                  </div>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            </div>

            {/* Remote Peers */}
            {otherPeers.length === 0 ? (
              <div className="py-2 text-center text-xs text-zinc-500 dark:text-zinc-500 italic">
                Belum ada rekan tim lain di kanvas ini.
              </div>
            ) : (
              otherPeers.map((peer) => {
                const preset = getAvatarPresetById(peer.avatarId);
                return (
                  <div
                    key={peer.userId}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-900/30 dark:bg-zinc-900/30 bg-zinc-50 border border-zinc-800/30 dark:border-zinc-800/30 border-zinc-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={preset.svgDataUri}
                        alt={peer.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                        style={{ outline: `2px solid ${peer.avatarColor || '#5E887E'}` }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-medium truncate">{peer.name}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-400 text-zinc-500">
                          Melihat Slide {peer.activeSlideIndex + 1}
                        </div>
                      </div>
                    </div>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: peer.avatarColor || '#5E887E' }}
                    ></span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-zinc-800/50 dark:border-zinc-800/50 border-zinc-200 text-[10px] text-zinc-400 dark:text-zinc-400 text-zinc-500 flex items-center justify-between">
            <span>Sinkronisasi Kursor & Elemen</span>
            <span className="text-emerald-500 font-semibold">{hasSupabase ? 'Supabase Realtime' : 'Aktif'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
