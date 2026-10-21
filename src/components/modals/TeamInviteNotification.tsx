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
  const { setActiveView } = useStudioStore();

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
              // Fetch team name
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
                  teamName: teamData?.name || 'Workspace Tim',
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

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className="rounded-2xl p-4 shadow-2xl border bg-zinc-950/95 dark:bg-zinc-950/95 bg-white/95 border-emerald-500/40 dark:border-emerald-500/40 border-emerald-400/60 backdrop-blur-xl ring-1 ring-emerald-500/20 text-zinc-100 dark:text-zinc-100 text-stone-900">
        {/* Top Header with Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-emerald-400 dark:text-emerald-400 text-emerald-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Undangan Tim Masuk
                </span>
              </div>
              <h4 className="text-sm font-bold text-white dark:text-white text-stone-900 leading-snug">
                Ditambahkan ke Workspace
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotification(null)}
            title="Tutup Notifikasi"
            className="p-1 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-800 hover:bg-stone-100 text-zinc-400 hover:text-white dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <div className="mt-2.5 space-y-2">
          <p className="text-xs leading-relaxed text-zinc-300 dark:text-zinc-300 text-stone-600">
            <span className="font-semibold text-white dark:text-white text-stone-900">
              {notification.inviterName}
            </span>{' '}
            telah menambahkan Anda ke folder{' '}
            <span className="font-semibold text-emerald-300 dark:text-emerald-300 text-emerald-700">
              "{notification.teamName}"
            </span>{' '}
            sebagai <span className="font-medium text-white dark:text-white text-stone-800">{roleLabel}</span>.
          </p>

          {/* Feature connection badge */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/30 dark:bg-emerald-950/30 bg-emerald-50/80 border border-emerald-800/30 dark:border-emerald-800/30 border-emerald-200 text-[11px] text-emerald-300 dark:text-emerald-300 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>Terhubung untuk kolaborasi & kursor live realtime</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-zinc-800/60 dark:border-zinc-800/60 border-stone-200">
          <button
            type="button"
            onClick={handleOpenWorkspace}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-[0.98]"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Buka Workspace Tim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setNotification(null)}
            className="px-3 py-2 rounded-xl border text-xs font-medium hover:bg-zinc-800/60 dark:hover:bg-zinc-800/60 hover:bg-stone-100 border-zinc-800 dark:border-zinc-800 border-stone-200 text-zinc-400 hover:text-white dark:hover:text-white transition-colors cursor-pointer"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
};
