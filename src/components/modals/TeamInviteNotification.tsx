import React, { useEffect, useState } from 'react';
import { Sparkles, Users, ArrowRight, X, Briefcase, CheckCircle2 } from 'lucide-react';
import {
  subscribeToInviteNotifications,
  type TeamInviteNotificationPayload,
  setActiveTeamId,
  syncTeamsFromCloud,
} from '../../services/teamWorkspaceService';
import { getCurrentAuthUser, subscribeToAuthChanges, type AuthUser } from '../../services/authService';
import { getSupabaseClient, isSupabaseConfigured } from '../../services/supabaseClient';
import { useStudioStore } from '../../store/useStudioStore';

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Note 1: E5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: B5 (higher pitch chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.09, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // audio context might be blocked if user has not interacted with DOM yet
  }
}

export const TeamInviteNotification: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentAuthUser());
  const [notification, setNotification] = useState<TeamInviteNotificationPayload | null>(null);
  const { setActiveView, workspaceDarkMode } = useStudioStore();

  useEffect(() => {
    return subscribeToAuthChanges((u) => setCurrentUser(u));
  }, []);

  const handleIncomingNotification = (notif: TeamInviteNotificationPayload) => {
    if (!notif) return;
    const me = getCurrentAuthUser();
    if (!me) return;

    const myId = me.id.toLowerCase();
    const myEmail = (me.email || '').trim().toLowerCase();
    const targetId = (notif.targetUserId || '').toLowerCase();
    const targetEmail = (notif.targetEmail || '').trim().toLowerCase();

    // Check if this notification is targeted at the current user
    const isForMe =
      (myEmail && targetEmail && myEmail === targetEmail) ||
      (myId && targetId && myId === targetId);

    if (isForMe) {
      setNotification(notif);
      playNotificationChime();
      // Silently refresh teams in background so folder appears immediately
      syncTeamsFromCloud().catch(() => {});
    }
  };

  useEffect(() => {
    // 1. In-memory listener
    const unsubMemory = subscribeToInviteNotifications(handleIncomingNotification);

    // 2. Local Inter-Tab BroadcastChannel
    let localBus: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        localBus = new BroadcastChannel('arune_team_invite_bus');
        localBus.onmessage = (event) => {
          if (event.data) {
            handleIncomingNotification(event.data);
          }
        };
      }
    } catch {
      // ignore
    }

    // 3. Supabase Realtime Broadcast & Postgres changes
    const client = getSupabaseClient();
    let supabaseChannel: any = null;

    if (client && isSupabaseConfigured()) {
      supabaseChannel = client.channel('arune_global_notifications');

      supabaseChannel
        .on('broadcast', { event: 'team_invite' }, ({ payload }: any) => {
          handleIncomingNotification(payload);
        })
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'team_members' },
          async (payload: any) => {
            const newMember = payload.new;
            const me = getCurrentAuthUser();
            if (me && newMember && newMember.user_id === me.id) {
              try {
                const { data: teamData } = await client
                  .from('teams')
                  .select('id, name')
                  .eq('id', newMember.team_id)
                  .maybeSingle();

                handleIncomingNotification({
                  id: `notif_${Date.now()}`,
                  targetUserId: me.id,
                  targetEmail: me.email,
                  teamId: newMember.team_id,
                  teamName: teamData?.name || 'Creative Studio Team',
                  inviterName: 'Rekan Tim',
                  role: newMember.role || 'editor',
                  timestamp: Date.now(),
                });
              } catch {
                // ignore
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      unsubMemory();
      if (localBus) localBus.close();
      if (supabaseChannel) supabaseChannel.unsubscribe();
    };
  }, [currentUser]);

  if (!notification) return null;

  const inviterName = notification.inviterName?.trim() || 'Rekan Tim';
  const teamName = notification.teamName?.trim() || 'Creative Studio Team';
  const roleLabel =
    notification.role === 'owner'
      ? 'Co-Owner'
      : notification.role === 'viewer'
      ? 'Viewer (Reviewer)'
      : 'Editor (Bisa Edit)';

  const handleOpenWorkspace = () => {
    setActiveTeamId(notification.teamId);
    setActiveView('team');
    setNotification(null);
  };

  const isDark = workspaceDarkMode;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div
        className={`rounded-2xl p-4.5 shadow-2xl border backdrop-blur-xl transition-colors duration-150 ${
          isDark
            ? 'bg-[#0A1A2F]/98 border-zinc-800 text-slate-100 ring-1 ring-blue-500/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]'
            : 'bg-white border-[#DFE6E4] text-[#2F3E46] ring-1 ring-black/5 shadow-[0_12px_40px_rgba(47,62,70,0.14)]'
        }`}
      >
        {/* Top Header with Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 ${
                isDark
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-500'
                  : 'bg-gradient-to-tr from-[#5E887E] to-[#4A6E65]'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold tracking-tight flex items-center gap-1 ${
                    isDark ? 'text-blue-400' : 'text-[#5E887E]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Undangan Tim Masuk
                </span>
              </div>
              <h4
                className={`text-sm font-bold leading-snug ${
                  isDark ? 'text-white' : 'text-[#2F3E46]'
                }`}
              >
                Ditambahkan ke Workspace
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotification(null)}
            title="Tutup Notifikasi"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                : 'hover:bg-[#EAEFEF] text-[#8E9F9B] hover:text-[#2F3E46]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <div className="mt-3 space-y-2.5">
          <p
            className={`text-xs leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-[#556B65]'
            }`}
          >
            <span
              className={`font-bold ${
                isDark ? 'text-white' : 'text-[#2F3E46]'
              }`}
            >
              {inviterName}
            </span>{' '}
            telah menambahkan Anda ke folder{' '}
            <span
              className={`font-bold ${
                isDark ? 'text-blue-400' : 'text-[#5E887E]'
              }`}
            >
              "{teamName}"
            </span>{' '}
            sebagai{' '}
            <span
              className={`font-bold ${
                isDark ? 'text-white' : 'text-[#2F3E46]'
              }`}
            >
              {roleLabel}
            </span>
            .
          </p>

          {/* Feature connection badge */}
          <div
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-medium ${
              isDark
                ? 'bg-blue-950/40 border-blue-900/50 text-blue-300'
                : 'bg-[#EBF3F1] border-[#C3D8D3] text-[#2F3E46]'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                isDark ? 'text-blue-400' : 'text-[#5E887E]'
              }`}
            />
            <span>Terhubung untuk kolaborasi & kursor live realtime</span>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className={`mt-3.5 flex items-center gap-2 pt-2.5 border-t ${
            isDark ? 'border-zinc-800/80' : 'border-[#DFE6E4]'
          }`}
        >
          <button
            type="button"
            onClick={handleOpenWorkspace}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-[0.98] ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-[#5E887E] hover:bg-[#4E756B]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Buka Workspace Tim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setNotification(null)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-slate-300 hover:text-white'
                : 'bg-[#F7FAF9] hover:bg-[#EAEFEF] border-[#DFE6E4] text-[#556B65] hover:text-[#2F3E46]'
            }`}
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
};
