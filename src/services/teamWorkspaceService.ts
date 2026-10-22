import type { TeamWorkspace, TeamMember, TeamProjectRecord, TeamFolder, TeamRole, TeamBrandKit } from '../types/team';
import { DEFAULT_TEAM_BRAND_KIT } from '../types/team';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { getCurrentAuthUser } from './authService';

const STORAGE_KEY_TEAMS = 'arune_team_workspaces_v1';
const STORAGE_KEY_ACTIVE_TEAM = 'arune_active_team_id_v1';
const STORAGE_KEY_TEAM_PROJECTS = 'arune_team_projects_v1';
const STORAGE_KEY_TEAM_FOLDERS = 'arune_team_folders_v1';
const STORAGE_KEY_USER_PROFILE = 'arune_user_profile_v1';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarId?: string;
  avatarColor: string;
}

export interface TeamInviteNotificationPayload {
  id: string;
  targetUserId: string;
  targetEmail: string;
  teamId: string;
  teamName: string;
  inviterName: string;
  role: TeamRole;
  timestamp: number;
}

const INVITE_LISTENERS: Array<(notif: TeamInviteNotificationPayload) => void> = [];

export function subscribeToInviteNotifications(
  callback: (notif: TeamInviteNotificationPayload) => void
): () => void {
  INVITE_LISTENERS.push(callback);
  return () => {
    const idx = INVITE_LISTENERS.indexOf(callback);
    if (idx !== -1) INVITE_LISTENERS.splice(idx, 1);
  };
}

export function broadcastTeamInviteNotification(payload: TeamInviteNotificationPayload) {
  // 1. Notify in-memory listeners
  INVITE_LISTENERS.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.warn('Error in invite notification listener:', e);
    }
  });

  // 2. Local Inter-Tab BroadcastChannel
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bus = new BroadcastChannel('arune_team_invite_bus');
      bus.postMessage(payload);
      bus.close();
    }
  } catch (e) {
    // ignore
  }

  // 3. Supabase Realtime broadcast
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const channel = client.channel('arune_global_notifications');
      channel.send({
        type: 'broadcast',
        event: 'team_invite',
        payload,
      });
    } catch (e) {
      console.warn('Failed to broadcast invite via Supabase:', e);
    }
  }
}

const DEFAULT_AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export function getRandomAvatarColor(): string {
  return DEFAULT_AVATAR_COLORS[Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length)];
}

function stringToUuid(str: string): string {
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + code;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + code;
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const full = (hex1 + hex2 + hex1 + hex2).substring(0, 32);
  return `${full.slice(0, 8)}-${full.slice(8, 12)}-4${full.slice(13, 16)}-a${full.slice(17, 20)}-${full.slice(20, 32)}`;
}

export function ensureUuid(val?: string | null): string {
  if (!val) return generateUuid();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(val)) return val;
  return stringToUuid(val);
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getCurrentUserProfile(): UserProfile {
  const authUser = getCurrentAuthUser();
  if (authUser) {
    const profile: UserProfile = {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      avatarId: authUser.avatarId || 'ava-1',
      avatarColor: authUser.avatarColor,
    };
    saveCurrentUserProfile(profile);
    return profile;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  const defaultProfile: UserProfile = {
    id: ensureUuid(),
    name: 'Dinur Pradipta',
    email: 'snllabsarchive@gmail.com',
    avatarId: 'ava-1',
    avatarColor: '#5E887E',
  };
  saveCurrentUserProfile(defaultProfile);
  return defaultProfile;
}

export function saveCurrentUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function getInitialTeams(): TeamWorkspace[] {
  const me = getCurrentUserProfile();
  return [
    {
      id: ensureUuid('team_default_creative'),
      name: 'Creative Studio Team',
      description: 'Ruang kerja bersama untuk tim desain dan konten editorial.',
      ownerId: me.id,
      avatarColor: '#5E887E',
      brandKit: { ...DEFAULT_TEAM_BRAND_KIT },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        {
          id: me.id,
          name: me.name,
          email: me.email,
          role: 'owner',
          avatarId: me.avatarId || 'ava-1',
          avatarColor: me.avatarColor,
          joinedAt: new Date().toISOString(),
          isCurrentUser: true,
        },
      ],
    },
  ];
}

export function deduplicateTeamMembers(members: TeamMember[], ownerId?: string): TeamMember[] {
  const map = new Map<string, TeamMember>();

  for (const m of members) {
    if (!m) continue;
    const emailKey = (m.email || '').trim().toLowerCase();
    const idKey = (m.id || '').trim();
    const key = emailKey || idKey;
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, m);
    } else {
      const isOwner =
        m.role === 'owner' ||
        existing.role === 'owner' ||
        (ownerId ? m.id === ownerId || existing.id === ownerId : false);
      map.set(key, {
        ...existing,
        ...m,
        id: ownerId && (existing.id === ownerId || m.id === ownerId) ? ownerId : (m.id || existing.id),
        role: isOwner ? 'owner' : (m.role || existing.role),
        isCurrentUser: existing.isCurrentUser || m.isCurrentUser,
      });
    }
  }

  return Array.from(map.values());
}

export function clearTeamLocalCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_TEAMS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_TEAM);
    localStorage.removeItem(STORAGE_KEY_TEAM_PROJECTS);
    localStorage.removeItem(STORAGE_KEY_TEAM_FOLDERS);
    localStorage.removeItem('arune_deleted_team_ids');
  } catch {
    // ignore
  }
}

export function getTeams(): TeamWorkspace[] {
  const authUser = getCurrentAuthUser();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (raw !== null) {
      const parsed: TeamWorkspace[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];

        let changed = false;
        const deletedIds: string[] = JSON.parse(localStorage.getItem('arune_deleted_team_ids') || '[]');
        let filtered = parsed.filter((t) => !deletedIds.includes(t.id));

        // If user is logged in to Supabase, strictly only show teams they own or are members of
        if (authUser?.isSupabaseUser) {
          filtered = filtered.filter((t) => {
            const isOwner = t.ownerId === authUser.id;
            const isMember = Array.isArray(t.members) && t.members.some(
              (m) => m.id === authUser.id || (authUser.email && m.email && m.email.toLowerCase() === authUser.email.toLowerCase())
            );
            return isOwner || isMember;
          });
        }

        if (filtered.length !== parsed.length) {
          changed = true;
        }

        const sanitized = filtered.map((t) => {
          const validId = ensureUuid(t.id);
          const dedupedMembers = deduplicateTeamMembers(t.members || [], t.ownerId);
          if (validId !== t.id || dedupedMembers.length !== (t.members?.length || 0)) {
            changed = true;
          }
          if (validId !== t.id) {
            const currentActive = localStorage.getItem(STORAGE_KEY_ACTIVE_TEAM);
            if (currentActive === t.id) {
              localStorage.setItem(STORAGE_KEY_ACTIVE_TEAM, validId);
            }
          }
          return { ...t, id: validId, members: dedupedMembers };
        });
        if (changed) {
          saveTeams(sanitized);
        }
        return sanitized;
      }
    }
  } catch {
    // fallback
  }

  // If user is logged in to Supabase and has no cached teams, return empty array
  // DO NOT fabricate fake default teams or seed another user's teams!
  if (authUser?.isSupabaseUser) {
    return [];
  }

  const initial = getInitialTeams();
  saveTeams(initial);
  return initial;
}

export function saveTeams(teams: TeamWorkspace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
  } catch {
    // ignore
  }
}

const activeTeamListeners: Array<(teamId: string | null) => void> = [];

export function subscribeToActiveTeam(callback: (teamId: string | null) => void): () => void {
  activeTeamListeners.push(callback);
  callback(getActiveTeamId());
  return () => {
    const idx = activeTeamListeners.indexOf(callback);
    if (idx !== -1) activeTeamListeners.splice(idx, 1);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_ACTIVE_TEAM) {
      activeTeamListeners.forEach((fn) => fn(e.newValue));
    }
  });
}

export function getActiveTeamId(): string | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY_ACTIVE_TEAM);
    if (id) return id;
  } catch {
    // ignore
  }
  const teams = getTeams();
  const first = teams[0]?.id || null;
  if (first) setActiveTeamId(first);
  return first;
}

export function setActiveTeamId(teamId: string | null): void {
  try {
    if (teamId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TEAM, teamId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TEAM);
    }
  } catch {
    // ignore
  }
  activeTeamListeners.forEach((fn) => {
    try {
      fn(teamId);
    } catch {
      // ignore
    }
  });
}

// ============================================================================
// SUPABASE CLOUD SYNCHRONIZATION
// ============================================================================

/**
 * Fetch teams and their members/brand kits from Supabase.
 * If user has no teams in Supabase yet, automatically migrate local teams to Supabase!
 */
export async function syncTeamsFromCloud(): Promise<TeamWorkspace[]> {
  const client = getSupabaseClient();
  const authUser = getCurrentAuthUser();

  if (!client || !isSupabaseConfigured() || !authUser?.isSupabaseUser) {
    return getTeams();
  }

  try {
    // 1. Fetch teams where current user is member or creator
    const { data: teamsData, error: teamsError } = await client
      .from('teams')
      .select(`
        id,
        name,
        description,
        avatar_color,
        icon_url,
        created_by,
        created_at,
        updated_at,
        team_members (
          id,
          user_id,
          role,
          created_at
        ),
        team_brand_kits (*)
      `);

    if (teamsError) {
      console.warn('Error fetching teams from Supabase:', teamsError);
      return getTeams();
    }

    if (!teamsData || teamsData.length === 0) {
      // If user has locally created teams belonging to them, preserve them!
      const localOwned = getTeams().filter((t) => t.ownerId === authUser.id);
      if (localOwned.length > 0) {
        return localOwned;
      }
      saveTeams([]);
      setActiveTeamId(null);
      return [];
    }

    // Defensive user isolation: user must be team creator OR in team_members
    const userTeams = teamsData.filter((t: any) => {
      const isCreator = Boolean(t.created_by && t.created_by === authUser.id);
      const isMember = Array.isArray(t.team_members) && t.team_members.some((m: any) => m.user_id === authUser.id);
      return isCreator || isMember;
    });

    if (userTeams.length === 0) {
      // If user has locally created teams belonging to them, preserve them!
      const localOwned = getTeams().filter((t) => t.ownerId === authUser.id);
      if (localOwned.length > 0) {
        return localOwned;
      }
      saveTeams([]);
      setActiveTeamId(null);
      return [];
    }

    // 2. Collect all user IDs from team members to fetch their profile details
    const allUserIds = new Set<string>();
    userTeams.forEach((t: any) => {
      if (t.created_by) allUserIds.add(t.created_by);
      if (Array.isArray(t.team_members)) {
        t.team_members.forEach((m: any) => {
          if (m.user_id) allUserIds.add(m.user_id);
        });
      }
    });

    const profilesMap = new Map<string, { name: string; email: string; avatarId: string; avatarColor: string }>();
    if (allUserIds.size > 0) {
      const { data: profilesData } = await client
        .from('profiles')
        .select('id, name, email, avatar_id, avatar_color')
        .in('id', Array.from(allUserIds));

      if (profilesData) {
        profilesData.forEach((p) => {
          profilesMap.set(p.id, {
            name: p.name || 'Member',
            email: p.email || '',
            avatarId: p.avatar_id || 'ava-1',
            avatarColor: p.avatar_color || '#5E887E',
          });
        });
      }
    }

    // 3. Map Supabase rows to TeamWorkspace objects
    const mappedTeams: TeamWorkspace[] = userTeams.map((t: any) => {
      const rawMembers: TeamMember[] = Array.isArray(t.team_members)
        ? t.team_members.map((m: any) => {
            const profile = profilesMap.get(m.user_id);
            const isMe = m.user_id === authUser.id;
            return {
              id: m.user_id || m.id,
              name: isMe ? (authUser.name || profile?.name || 'Anda') : (profile?.name || 'Member'),
              email: profile?.email || (isMe ? authUser.email : ''),
              role: (m.role as TeamRole) || 'editor',
              avatarId: isMe ? (authUser.avatarId || 'ava-1') : (profile?.avatarId || 'ava-1'),
              avatarColor: profile?.avatarColor || '#5E887E',
              joinedAt: m.created_at || new Date().toISOString(),
              isCurrentUser: isMe,
            };
          })
        : [];

      // Make sure owner is in members list if not already
      const ownerProf = profilesMap.get(t.created_by);
      const isMeOwner = t.created_by === authUser.id;
      const ownerEmail = (ownerProf?.email || (isMeOwner ? authUser.email : '')).trim().toLowerCase();

      const hasOwner = rawMembers.some(
        (m) =>
          (t.created_by && (m.id === t.created_by || (m as any).user_id === t.created_by)) ||
          (ownerEmail && m.email.trim().toLowerCase() === ownerEmail)
      );

      if (!hasOwner && t.created_by) {
        rawMembers.unshift({
          id: t.created_by,
          name: isMeOwner ? (authUser.name || ownerProf?.name || 'Anda') : (ownerProf?.name || 'Owner'),
          email: ownerProf?.email || (isMeOwner ? authUser.email : ''),
          role: 'owner',
          avatarId: isMeOwner ? (authUser.avatarId || 'ava-1') : (ownerProf?.avatarId || 'ava-1'),
          avatarColor: ownerProf?.avatarColor || '#5E887E',
          joinedAt: t.created_at || new Date().toISOString(),
          isCurrentUser: isMeOwner,
        });
      }

      const members = deduplicateTeamMembers(rawMembers, t.created_by);

      // Map brand kit if exists
      let brandKit: TeamBrandKit = { ...DEFAULT_TEAM_BRAND_KIT };
      if (t.team_brand_kits && t.team_brand_kits.length > 0) {
        const bk = t.team_brand_kits[0];
        brandKit = {
          publicationName: bk.publication_name || DEFAULT_TEAM_BRAND_KIT.publicationName,
          authorOrHandle: bk.author_handle || DEFAULT_TEAM_BRAND_KIT.authorOrHandle,
          issueLabel: bk.issue_label || DEFAULT_TEAM_BRAND_KIT.issueLabel,
          footerNote: bk.footer_note || DEFAULT_TEAM_BRAND_KIT.footerNote,
          primaryColor: bk.primary_color || DEFAULT_TEAM_BRAND_KIT.primaryColor,
          accentColor: bk.accent_color || DEFAULT_TEAM_BRAND_KIT.accentColor,
          backgroundColor: bk.background_color || DEFAULT_TEAM_BRAND_KIT.backgroundColor,
          textColor: bk.text_color || DEFAULT_TEAM_BRAND_KIT.textColor,
          headingFont: bk.heading_font || DEFAULT_TEAM_BRAND_KIT.headingFont,
          bodyFont: bk.body_font || DEFAULT_TEAM_BRAND_KIT.bodyFont,
          brandColors: bk.brand_colors || DEFAULT_TEAM_BRAND_KIT.brandColors,
          showSlideNumbers: bk.show_slide_numbers ?? true,
          showFooterBar: bk.show_footer_bar ?? true,
        };
      }

      return {
        id: t.id,
        name: t.name,
        description: t.description || '',
        ownerId: t.created_by,
        avatarColor: t.avatar_color || '#5E887E',
        iconUrl: t.icon_url || undefined,
        members,
        brandKit,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      };
    });

    // Merge any locally created team that might not yet be returned by Supabase
    const localOwned = getTeams().filter((t) => t.ownerId === authUser.id);
    const combinedMapped = [...mappedTeams];
    for (const lt of localOwned) {
      if (!combinedMapped.some((ct) => ct.id === lt.id)) {
        combinedMapped.push(lt);
      }
    }

    // For authenticated Supabase users, Cloud is authoritative!
    const deletedIds: string[] = JSON.parse(localStorage.getItem('arune_deleted_team_ids') || '[]');
    const activeCloudTeams = combinedMapped.filter((t) => !deletedIds.includes(t.id));

    saveTeams(activeCloudTeams);

    // Prune local projects and folders for teams that no longer exist
    try {
      const validTeamIds = new Set(activeCloudTeams.map((t) => t.id));
      const prunedProjects = getAllStoredTeamProjects().filter((p) => validTeamIds.has(p.teamId));
      saveAllStoredTeamProjects(prunedProjects);

      const prunedFolders = getAllStoredTeamFolders().filter((f) => validTeamIds.has(f.teamId));
      saveAllStoredTeamFolders(prunedFolders);
    } catch {
      // ignore
    }

    const activeId = getActiveTeamId();
    if (!activeId || !activeCloudTeams.some((t) => t.id === activeId)) {
      setActiveTeamId(activeCloudTeams[0]?.id || null);
    }
    return activeCloudTeams;
  } catch (err) {
    console.error('Failed to sync teams with Supabase:', err);
    return getTeams();
  }
}

/**
 * Fetch projects for a team from Supabase Cloud.
 */
export async function syncProjectsFromCloud(teamId: string): Promise<TeamProjectRecord[]> {
  const client = getSupabaseClient();
  const validTeamId = ensureUuid(teamId);

  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('team_projects')
        .select('*')
        .eq('team_id', validTeamId)
        .order('last_edited_at', { ascending: false });

      if (!error && data) {
        const mapped: TeamProjectRecord[] = data.map((row: any) => {
          let folderId = row.folder_id || undefined;
          try {
            const parsed = typeof row.project_json === 'object' ? row.project_json : JSON.parse(row.project_json || '{}');
            if (!folderId && parsed?.teamFolderId) {
              folderId = parsed.teamFolderId;
            }
          } catch {
            // ignore
          }
          return {
            id: row.id,
            teamId: row.team_id,
            folderId,
            title: row.title || 'Untitled Carousel Project',
            aspectRatio: row.aspect_ratio || '4:5',
            slideCount: row.slide_count || 6,
            projectJson: typeof row.project_json === 'object' ? JSON.stringify(row.project_json) : (row.project_json || '{}'),
            lastEditedBy: row.last_edited_by || 'Member',
            lastEditedAt: row.last_edited_at || new Date().toISOString(),
          };
        });

        // Merge with local projects
        const allStored = getAllStoredTeamProjects().filter((p) => p.teamId !== validTeamId);
        saveAllStoredTeamProjects([...mapped, ...allStored]);
        return mapped;
      }
    } catch (err) {
      console.warn('Failed to fetch projects from Supabase:', err);
    }
  }

  return getTeamProjects(teamId);
}

// ============================================================================
// CRUD TEAMS & MEMBERS
// ============================================================================

export async function uploadTeamIcon(teamId: string, file: File): Promise<string> {
  const client = getSupabaseClient();

  // 1. If Supabase is connected, try uploading to Storage bucket 'team-icons'
  if (client && isSupabaseConfigured()) {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanTeamId = ensureUuid(teamId);
      const fileName = `${cleanTeamId}/icon_${Date.now()}.${fileExt}`;

      const { data, error } = await client.storage
        .from('team-icons')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: urlData } = client.storage
          .from('team-icons')
          .getPublicUrl(data.path);

        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase storage upload error:', error);
      }
    } catch (err) {
      console.warn('Failed to upload team icon to Supabase storage, falling back to data URL:', err);
    }
  }

  // 2. Fallback: Convert to optimized base64 Data URL so it always works immediately
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return reject(new Error('Gagal membaca file gambar.'));

      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/webp', 0.85));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function createTeamCloud(
  name: string,
  description?: string,
  iconUrl?: string,
  avatarColor?: string
): Promise<TeamWorkspace> {
  const client = getSupabaseClient();
  const authUser = getCurrentAuthUser();
  const newTeamId = generateUuid();
  const me = getCurrentUserProfile();

  const newTeam: TeamWorkspace = {
    id: newTeamId,
    name: name.trim() || 'Tim Baru',
    description: description?.trim() || '',
    ownerId: authUser?.id || me.id,
    avatarColor: avatarColor || getRandomAvatarColor(),
    iconUrl: iconUrl || undefined,
    brandKit: { ...DEFAULT_TEAM_BRAND_KIT },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      {
        id: authUser?.id || me.id,
        name: authUser?.name || me.name,
        email: authUser?.email || me.email,
        role: 'owner',
        avatarId: authUser?.avatarId || me.avatarId || 'ava-1',
        avatarColor: authUser?.avatarColor || me.avatarColor,
        joinedAt: new Date().toISOString(),
        isCurrentUser: true,
      },
    ],
  };

  // 1. Save to Supabase
  if (client && isSupabaseConfigured() && authUser?.isSupabaseUser) {
    try {
      const { error: insTeamErr } = await client.from('teams').insert({
        id: newTeamId,
        name: newTeam.name,
        description: newTeam.description,
        avatar_color: newTeam.avatarColor,
        icon_url: newTeam.iconUrl || null,
        created_by: authUser.id,
      });

      if (insTeamErr) {
        console.warn('Failed to insert team with created_by, retrying fallback:', insTeamErr);
        await client.from('teams').insert({
          id: newTeamId,
          name: newTeam.name,
          description: newTeam.description,
          avatar_color: newTeam.avatarColor,
          icon_url: newTeam.iconUrl || null,
        });
      }

      await client.from('team_members').upsert({
        team_id: newTeamId,
        user_id: authUser.id,
        role: 'owner',
      }, { onConflict: 'team_id,user_id' });

      await client.from('team_brand_kits').upsert({
        team_id: newTeamId,
        publication_name: newTeam.brandKit?.publicationName || 'Creative Editorial Studio',
        author_handle: newTeam.brandKit?.authorOrHandle || '@arune.studio',
        issue_label: newTeam.brandKit?.issueLabel || 'VOL. 01',
        footer_note: newTeam.brandKit?.footerNote || 'arune.studio • swipe to read',
        primary_color: newTeam.brandKit?.primaryColor || '#2F3E46',
        accent_color: newTeam.brandKit?.accentColor || '#5E887E',
        background_color: newTeam.brandKit?.backgroundColor || '#FFFFFF',
        text_color: newTeam.brandKit?.textColor || '#2F3E46',
        heading_font: newTeam.brandKit?.headingFont || 'Plus Jakarta Sans',
        body_font: newTeam.brandKit?.bodyFont || 'Plus Jakarta Sans',
        show_slide_numbers: true,
        show_footer_bar: true,
      }, { onConflict: 'team_id' });
    } catch (e) {
      console.warn('Failed to insert team to Supabase:', e);
    }
  }

  // 2. Save locally
  const teams = getTeams();
  const existingIdx = teams.findIndex((t) => t.id === newTeam.id);
  if (existingIdx !== -1) {
    teams[existingIdx] = newTeam;
  } else {
    teams.push(newTeam);
  }
  saveTeams(teams);
  setActiveTeamId(newTeam.id);
  return newTeam;
}

export function createTeam(name: string, description?: string): TeamWorkspace {
  const newTeamId = generateUuid();
  const me = getCurrentUserProfile();
  const newTeam: TeamWorkspace = {
    id: newTeamId,
    name: name.trim() || 'Tim Baru',
    description: description?.trim() || '',
    ownerId: me.id,
    avatarColor: getRandomAvatarColor(),
    brandKit: { ...DEFAULT_TEAM_BRAND_KIT },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      {
        id: me.id,
        name: me.name,
        email: me.email,
        role: 'owner',
        avatarColor: me.avatarColor,
        joinedAt: new Date().toISOString(),
        isCurrentUser: true,
      },
    ],
  };

  const teams = getTeams();
  teams.push(newTeam);
  saveTeams(teams);
  setActiveTeamId(newTeam.id);

  // Trigger cloud sync in background
  createTeamCloud(name, description);
  return newTeam;
}

export async function updateTeamCloud(
  teamId: string,
  partial: Partial<TeamWorkspace>
): Promise<TeamWorkspace | null> {
  const teams = getTeams();
  const index = teams.findIndex((t) => t.id === teamId);
  if (index === -1) return null;

  teams[index] = {
    ...teams[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveTeams(teams);

  // Background cloud update
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
      };
      if (partial.name !== undefined) updatePayload.name = partial.name;
      if (partial.description !== undefined) updatePayload.description = partial.description;
      if (partial.avatarColor !== undefined) updatePayload.avatar_color = partial.avatarColor;
      if (partial.iconUrl !== undefined) updatePayload.icon_url = partial.iconUrl;

      await client
        .from('teams')
        .update(updatePayload)
        .eq('id', teamId);
    } catch (e) {
      console.warn('Failed to update team in Supabase:', e);
    }
  }

  return teams[index];
}

export function updateTeam(teamId: string, partial: Partial<TeamWorkspace>): TeamWorkspace | null {
  void updateTeamCloud(teamId, partial);
  const teams = getTeams();
  const index = teams.findIndex((t) => t.id === teamId);
  if (index === -1) return null;
  return teams[index];
}

export async function deleteTeamCloud(teamId: string): Promise<boolean> {
  const validTeamId = ensureUuid(teamId);
  const client = getSupabaseClient();
  const authUser = getCurrentAuthUser();

  // 1. Mark as deleted in localStorage blacklist immediately
  try {
    const deletedList: string[] = JSON.parse(localStorage.getItem('arune_deleted_team_ids') || '[]');
    if (!deletedList.includes(validTeamId)) deletedList.push(validTeamId);
    if (!deletedList.includes(teamId)) deletedList.push(teamId);
    localStorage.setItem('arune_deleted_team_ids', JSON.stringify(deletedList));
    if (authUser?.id) {
      localStorage.setItem('arune_teams_seeded_' + authUser.id, 'true');
    }
  } catch {}

  // 2. Delete from Supabase Cloud (explicitly clean up child rows first)
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('team_folders').delete().eq('team_id', validTeamId);
      await client.from('team_projects').delete().eq('team_id', validTeamId);
      await client.from('team_brand_kits').delete().eq('team_id', validTeamId);
      await client.from('team_members').delete().eq('team_id', validTeamId);
      const { error } = await client.from('teams').delete().eq('id', validTeamId);
      if (error) {
        console.warn('Supabase delete team warning/error:', error);
      }
    } catch (e) {
      console.warn('Failed to delete team in Supabase:', e);
    }
  }

  // 3. Remove from local teams storage
  const currentTeams = getTeams().filter((t) => t.id !== validTeamId && t.id !== teamId);
  saveTeams(currentTeams);

  // 4. Remove all projects & folders associated with this team locally
  const remainingProjects = getAllStoredTeamProjects().filter(
    (p) => p.teamId !== validTeamId && p.teamId !== teamId
  );
  saveAllStoredTeamProjects(remainingProjects);

  const remainingFolders = getAllStoredTeamFolders().filter(
    (f) => f.teamId !== validTeamId && f.teamId !== teamId
  );
  saveAllStoredTeamFolders(remainingFolders);

  // 5. Update active team
  const currentActive = getActiveTeamId();
  if (currentActive === validTeamId || currentActive === teamId) {
    setActiveTeamId(currentTeams[0]?.id || null);
  }

  return true;
}

export function deleteTeam(teamId: string): void {
  void deleteTeamCloud(teamId);
}

/**
 * Add a member to a team with Supabase Cloud support!
 * Searches Supabase profiles by email so the member is properly linked to the database.
 */
export async function addTeamMemberCloud(
  teamId: string,
  memberData: { name: string; email: string; role: TeamRole }
): Promise<{ success: boolean; member?: TeamMember; error?: string }> {
  const client = getSupabaseClient();
  const validTeamId = ensureUuid(teamId);
  const trimmedEmail = memberData.email.trim().toLowerCase();
  const teams = getTeams();
  const team = teams.find((t) => t.id === validTeamId || t.id === teamId);
  if (!team) return { success: false, error: 'Folder tim tidak ditemukan.' };

  // Sanitize team id locally
  team.id = validTeamId;
  saveTeams(teams);

  // Check local existence
  const exists = team.members.find((m) => m.email.toLowerCase() === trimmedEmail);
  if (exists) {
    return { success: false, error: `Email ${trimmedEmail} sudah ada di dalam tim ini.` };
  }

  // 1. If Supabase is connected, ensure parent team exists & query profile
  if (client && isSupabaseConfigured()) {
    try {
      const authUser = getCurrentAuthUser();

      // Ensure parent team exists in Supabase
      const { data: existingTeam } = await client
        .from('teams')
        .select('id')
        .eq('id', validTeamId)
        .maybeSingle();

      if (!existingTeam) {
        const { error: insErr } = await client.from('teams').insert({
          id: validTeamId,
          name: team.name || 'Folder Tim',
          description: team.description || '',
          avatar_color: team.avatarColor || '#5E887E',
          created_by: authUser?.id || null,
        });

        if (insErr) {
          console.warn('Could not insert parent team in Supabase:', insErr);
        }

        if (authUser?.id) {
          await client.from('team_members').upsert({
            team_id: validTeamId,
            user_id: authUser.id,
            role: 'owner',
          }, { onConflict: 'team_id,user_id' });
        }
      }

      // Query target profile by email (Try RPC first to also check auth.users, fallback to profiles query)
      let profile: any = null;
      try {
        const { data: rpcProfile, error: rpcErr } = await client
          .rpc('find_user_by_email', { lookup_email: trimmedEmail });
        if (!rpcErr && rpcProfile) {
          profile = Array.isArray(rpcProfile) ? rpcProfile[0] : rpcProfile;
        }
      } catch {
        // RPC might not exist yet
      }

      if (!profile) {
        const { data: pData, error: pErr } = await client
          .from('profiles')
          .select('id, name, email, avatar_id, avatar_color')
          .ilike('email', trimmedEmail)
          .maybeSingle();

        if (pErr) {
          console.warn('Error checking profile:', pErr);
        }
        profile = pData;
      }

      if (!profile) {
        return {
          success: false,
          error: `Akun dengan email "${trimmedEmail}" belum terdaftar di tabel profil Arune Studio. Pastikan akun sudah dibuat di Supabase, lalu jalankan sinkronisasi profil atau daftarkan akun tersebut terlebih dahulu.`,
        };
      }

      // Ensure team owner is claimed if currently null
      if (authUser?.id) {
        try {
          await client
            .from('teams')
            .update({ created_by: authUser.id })
            .eq('id', validTeamId)
            .is('created_by', null);
        } catch {
          // ignore
        }
      }

      // Profile exists! Try RPC first for security definer execution
      let tmData: any = null;
      let tmErr: any = null;

      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc('add_member_to_team', {
          p_team_id: validTeamId,
          p_user_id: profile.id,
          p_role: memberData.role,
        });
        if (!rpcErr && rpcRes) {
          tmData = rpcRes;
        } else if (rpcErr) {
          console.warn('RPC add_member_to_team warning/fallback:', rpcErr);
        }
      } catch {
        // fallback to standard upsert
      }

      if (!tmData) {
        const res = await client
          .from('team_members')
          .upsert(
            {
              team_id: validTeamId,
              user_id: profile.id,
              role: memberData.role,
            },
            { onConflict: 'team_id,user_id' }
          )
          .select()
          .maybeSingle();

        tmData = res.data;
        tmErr = res.error;
      }

      if (tmErr) {
        console.error('Failed to add team member in Supabase:', tmErr);
        return { success: false, error: tmErr.message };
      }

      const newMember: TeamMember = {
        id: profile.id,
        name: profile.name || memberData.name.trim(),
        email: profile.email || trimmedEmail,
        role: memberData.role,
        avatarColor: profile.avatar_color || getRandomAvatarColor(),
        joinedAt: tmData?.created_at || new Date().toISOString(),
      };

      team.members = deduplicateTeamMembers([...team.members, newMember], team.ownerId);
      team.updatedAt = new Date().toISOString();
      saveTeams(teams);

      // Broadcast real-time invitation notification to the target user
      broadcastTeamInviteNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        targetUserId: profile.id,
        targetEmail: trimmedEmail,
        teamId: validTeamId,
        teamName: team.name,
        inviterName: authUser?.name || 'Rekan Tim',
        role: memberData.role,
        timestamp: Date.now(),
      });

      return { success: true, member: newMember };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menambahkan anggota ke database.' };
    }
  }

  // Local fallback
  const newMember: TeamMember = {
    id: `member_${Date.now()}`,
    name: memberData.name.trim(),
    email: trimmedEmail,
    role: memberData.role,
    avatarColor: getRandomAvatarColor(),
    joinedAt: new Date().toISOString(),
  };

  team.members = deduplicateTeamMembers([...team.members, newMember], team.ownerId);
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);

  // Broadcast real-time notification in local bus
  const authUser = getCurrentAuthUser();
  broadcastTeamInviteNotification({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    targetUserId: newMember.id,
    targetEmail: trimmedEmail,
    teamId: team.id,
    teamName: team.name,
    inviterName: authUser?.name || 'Rekan Tim',
    role: memberData.role,
    timestamp: Date.now(),
  });

  return { success: true, member: newMember };
}

export function addTeamMember(
  teamId: string,
  memberData: { name: string; email: string; role: TeamRole }
): TeamMember | null {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  const exists = team.members.find((m) => m.email.toLowerCase() === memberData.email.trim().toLowerCase());
  if (exists) return null;

  const newMember: TeamMember = {
    id: `member_${Date.now()}`,
    name: memberData.name.trim(),
    email: memberData.email.trim(),
    role: memberData.role,
    avatarColor: getRandomAvatarColor(),
    joinedAt: new Date().toISOString(),
  };

  team.members = deduplicateTeamMembers([...team.members, newMember], team.ownerId);
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);

  // Background cloud add
  addTeamMemberCloud(teamId, memberData).catch(() => {});
  return newMember;
}

export function updateMemberRole(teamId: string, memberId: string, newRole: TeamRole): boolean {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return false;

  const member = team.members.find((m) => m.id === memberId);
  if (!member) return false;

  if (member.id === team.ownerId && newRole !== 'owner') {
    return false;
  }

  member.role = newRole;
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    client
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', memberId)
      .then();
  }

  return true;
}

export function removeTeamMember(teamId: string, memberId: string): boolean {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return false;

  if (memberId === team.ownerId) return false;

  team.members = team.members.filter((m) => m.id !== memberId);
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    client
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', memberId)
      .then();
  }

  return true;
}

// ============================================================================
// TEAM PROJECTS MANAGEMENT WITH SUPABASE CLOUD
// ============================================================================

export function getTeamProjects(teamId: string): TeamProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAM_PROJECTS);
    if (raw) {
      const all: TeamProjectRecord[] = JSON.parse(raw);
      return all.filter((p) => p.teamId === teamId);
    }
  } catch {
    // ignore
  }
  return [];
}

export async function saveTeamProjectCloud(
  teamId: string,
  project: {
    id: string;
    title: string;
    aspectRatio: string;
    slideCount: number;
    projectJson: string;
    folderId?: string;
  }
): Promise<TeamProjectRecord> {
  const me = getCurrentUserProfile();
  const authUser = getCurrentAuthUser();
  const validProjectId = ensureUuid(project.id);
  const validTeamId = ensureUuid(teamId);
  const now = new Date().toISOString();

  let parsedJson: any = {};
  try {
    parsedJson = typeof project.projectJson === 'string' ? JSON.parse(project.projectJson) : (project.projectJson || {});
  } catch {
    parsedJson = {};
  }
  if (project.folderId !== undefined) {
    parsedJson.teamFolderId = project.folderId;
  }
  const effectiveFolderId = project.folderId !== undefined ? project.folderId : (parsedJson.teamFolderId || undefined);

  const record: TeamProjectRecord = {
    id: validProjectId,
    teamId: validTeamId,
    folderId: effectiveFolderId,
    title: project.title,
    aspectRatio: project.aspectRatio,
    slideCount: project.slideCount,
    lastEditedBy: authUser?.name || me.name,
    lastEditedAt: now,
    projectJson: typeof project.projectJson === 'string' ? (project.folderId !== undefined ? JSON.stringify(parsedJson) : project.projectJson) : JSON.stringify(parsedJson),
    isLocked: false,
  };

  // 1. Save locally
  const allProjects = getAllStoredTeamProjects();
  const index = allProjects.findIndex((p) => p.id === validProjectId && p.teamId === validTeamId);
  if (index >= 0) {
    allProjects[index] = { ...allProjects[index], ...record };
  } else {
    allProjects.unshift(record);
  }
  saveAllStoredTeamProjects(allProjects);

  // 2. Save to Supabase Cloud
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const payload: any = {
        id: validProjectId,
        team_id: validTeamId,
        title: project.title,
        aspect_ratio: project.aspectRatio,
        slide_count: project.slideCount,
        folder_id: effectiveFolderId ? ensureUuid(effectiveFolderId) : null,
        project_json: parsedJson,
        last_edited_by: authUser?.name || me.name,
        last_edited_at: now,
      };

      const { error } = await client.from('team_projects').upsert(
        payload,
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('Upsert with folder_id column failed, falling back without column:', error);
        delete payload.folder_id;
        await client.from('team_projects').upsert(payload, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('Error syncing project to Supabase:', e);
    }
  }

  return record;
}

export function saveTeamProject(
  teamId: string,
  project: {
    id: string;
    title: string;
    aspectRatio: string;
    slideCount: number;
    projectJson: string;
  }
): TeamProjectRecord {
  const me = getCurrentUserProfile();
  const validProjectId = ensureUuid(project.id);
  const validTeamId = ensureUuid(teamId);
  const now = new Date().toISOString();

  const record: TeamProjectRecord = {
    id: validProjectId,
    teamId: validTeamId,
    title: project.title,
    aspectRatio: project.aspectRatio,
    slideCount: project.slideCount,
    lastEditedBy: me.name,
    lastEditedAt: now,
    projectJson: project.projectJson,
    isLocked: false,
  };

  const allProjects = getAllStoredTeamProjects();
  const index = allProjects.findIndex((p) => p.id === validProjectId && p.teamId === validTeamId);
  if (index >= 0) {
    allProjects[index] = { ...allProjects[index], ...record };
  } else {
    allProjects.unshift(record);
  }
  saveAllStoredTeamProjects(allProjects);

  // Background save to Supabase
  saveTeamProjectCloud(teamId, project).catch(() => {});
  return record;
}

export function deleteTeamProject(teamId: string, projectId: string): void {
  const validProjectId = ensureUuid(projectId);
  const validTeamId = ensureUuid(teamId);

  const allProjects = getAllStoredTeamProjects().filter(
    (p) => !(p.id === validProjectId && p.teamId === validTeamId)
  );
  saveAllStoredTeamProjects(allProjects);

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    client.from('team_projects').delete().eq('id', validProjectId).eq('team_id', validTeamId).then();
  }
}

export function setProjectLock(
  teamId: string,
  projectId: string,
  isLocked: boolean
): void {
  const me = getCurrentUserProfile();
  const allProjects = getAllStoredTeamProjects();
  const record = allProjects.find((p) => p.id === projectId && p.teamId === teamId);
  if (record) {
    record.isLocked = isLocked;
    record.lockedBy = isLocked ? me.name : undefined;
    record.lockedAt = isLocked ? new Date().toISOString() : undefined;
    saveAllStoredTeamProjects(allProjects);
  }
}

export function getAllStoredTeamProjects(): TeamProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAM_PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveAllStoredTeamProjects(records: TeamProjectRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEAM_PROJECTS, JSON.stringify(records));
  } catch {
    // ignore
  }
}

// ============================================================================
// BRAND KIT
// ============================================================================

export function getTeamBrandKit(teamId: string): TeamBrandKit {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (team?.brandKit) return team.brandKit;
  return { ...DEFAULT_TEAM_BRAND_KIT };
}

export function updateTeamBrandKit(
  teamId: string,
  partial: Partial<TeamBrandKit>
): TeamBrandKit | null {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  const currentKit = team.brandKit || { ...DEFAULT_TEAM_BRAND_KIT };
  team.brandKit = {
    ...currentKit,
    ...partial,
  };
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    client
      .from('team_brand_kits')
      .upsert({
        team_id: teamId,
        publication_name: team.brandKit.publicationName,
        author_handle: team.brandKit.authorOrHandle,
        issue_label: team.brandKit.issueLabel,
        footer_note: team.brandKit.footerNote,
        primary_color: team.brandKit.primaryColor,
        accent_color: team.brandKit.accentColor,
        background_color: team.brandKit.backgroundColor,
        text_color: team.brandKit.textColor,
        brand_colors: team.brandKit.brandColors,
        heading_font: team.brandKit.headingFont,
        body_font: team.brandKit.bodyFont,
        show_slide_numbers: team.brandKit.showSlideNumbers,
        show_footer_bar: team.brandKit.showFooterBar,
        updated_at: new Date().toISOString(),
      })
      .then();
  }

  return team.brandKit;
}

/**
 * Resolves the role of the current logged-in user in the active team workspace.
 * Returns 'owner' | 'editor' | 'viewer'. Defaults to 'owner' if not in a team workspace.
 */
export function getCurrentUserTeamRole(teamId?: string | null): TeamRole {
  const targetTeamId = teamId || getActiveTeamId();
  if (!targetTeamId) return 'owner';

  const teams = getTeams();
  const team = teams.find((t) => t.id === targetTeamId);
  if (!team) return 'owner';

  const me = getCurrentUserProfile();
  const authUser = getCurrentAuthUser();
  const myId = authUser?.id || me.id;
  const myEmail = (authUser?.email || me.email || '').trim().toLowerCase();

  if (team.ownerId === myId) return 'owner';

  const member = team.members.find(
    (m) =>
      m.id === myId ||
      m.isCurrentUser ||
      (m.email && myEmail && m.email.trim().toLowerCase() === myEmail)
  );

  return member ? member.role : 'editor';
}

// ============================================================================
// TEAM FOLDERS (PROJECT & CUSTOMER GROUPING)
// ============================================================================

export const TEAM_FOLDER_COLORS = [
  { id: 'blue', label: 'Biru', hex: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500' },
  { id: 'emerald', label: 'Hijau Mint', hex: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500' },
  { id: 'amber', label: 'Amber', hex: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500' },
  { id: 'purple', label: 'Ungu', hex: '#A855F7', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500' },
  { id: 'rose', label: 'Merah', hex: '#F43F5E', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-500' },
  { id: 'indigo', label: 'Indigo', hex: '#6366F1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-500' },
  { id: 'cyan', label: 'Cyan', hex: '#06B6D4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-500' },
  { id: 'orange', label: 'Oranye', hex: '#F97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500' },
];

export function getTeamFolderColorTheme(colorId?: string) {
  return TEAM_FOLDER_COLORS.find((c) => c.id === colorId) || TEAM_FOLDER_COLORS[0];
}

export function getAllStoredTeamFolders(): TeamFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAM_FOLDERS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function saveAllStoredTeamFolders(folders: TeamFolder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEAM_FOLDERS, JSON.stringify(folders));
  } catch {
    // ignore
  }
}

export function getTeamFolders(teamId: string): TeamFolder[] {
  const all = getAllStoredTeamFolders();
  return all.filter((f) => f.teamId === teamId);
}

export async function saveTeamFolder(
  teamId: string,
  folder: { id?: string; name: string; description?: string; color?: string }
): Promise<TeamFolder> {
  const all = getAllStoredTeamFolders();
  const validTeamId = ensureUuid(teamId);
  const now = new Date().toISOString();
  const folderId = folder.id || `tf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const existingIndex = all.findIndex((f) => f.id === folderId);
  const record: TeamFolder = {
    id: folderId,
    teamId: validTeamId,
    name: folder.name.trim(),
    description: folder.description?.trim() || '',
    color: folder.color || 'blue',
    createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    all[existingIndex] = record;
  } else {
    all.push(record);
  }
  saveAllStoredTeamFolders(all);

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('team_folders').upsert({
        id: record.id,
        team_id: record.teamId,
        name: record.name,
        description: record.description,
        color: record.color,
        updated_at: record.updatedAt,
      });
    } catch {
      // ignore
    }
  }

  return record;
}

export async function deleteTeamFolder(teamId: string, folderId: string): Promise<void> {
  const all = getAllStoredTeamFolders().filter((f) => f.id !== folderId);
  saveAllStoredTeamFolders(all);

  // Unlink all projects that belonged to this folder
  const allProjects = getAllStoredTeamProjects();
  let changed = false;
  allProjects.forEach((p) => {
    if (p.teamId === teamId && p.folderId === folderId) {
      p.folderId = undefined;
      let parsed: any = {};
      try {
        parsed = typeof p.projectJson === 'string' ? JSON.parse(p.projectJson) : (p.projectJson || {});
      } catch {
        parsed = {};
      }
      parsed.teamFolderId = null;
      p.projectJson = JSON.stringify(parsed);
      changed = true;
    }
  });
  if (changed) {
    saveAllStoredTeamProjects(allProjects);
  }

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('team_projects').update({ folder_id: null }).eq('folder_id', folderId);
    } catch {
      // ignore
    }
    try {
      await client.from('team_folders').delete().eq('id', folderId);
    } catch {
      // ignore
    }
  }
}

export async function moveProjectToTeamFolder(
  teamId: string,
  projectId: string,
  folderId: string | null
): Promise<void> {
  const validProjectId = ensureUuid(projectId);
  const validTeamId = ensureUuid(teamId);
  const validFolderId = folderId ? ensureUuid(folderId) : null;

  const allProjects = getAllStoredTeamProjects();
  const project = allProjects.find((p) => p.id === validProjectId && p.teamId === validTeamId);
  if (project) {
    project.folderId = validFolderId || undefined;
    let parsed: any = {};
    try {
      parsed = typeof project.projectJson === 'string' ? JSON.parse(project.projectJson) : (project.projectJson || {});
    } catch {
      parsed = {};
    }
    parsed.teamFolderId = validFolderId;
    project.projectJson = JSON.stringify(parsed);
    project.lastEditedAt = new Date().toISOString();
    saveAllStoredTeamProjects(allProjects);
  }

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      let parsed: any = {};
      if (project) {
        try {
          parsed = typeof project.projectJson === 'string' ? JSON.parse(project.projectJson) : project.projectJson;
        } catch {}
      }
      parsed.teamFolderId = validFolderId;

      const updatePayload: any = {
        folder_id: validFolderId,
        project_json: parsed,
        last_edited_at: new Date().toISOString(),
      };

      const { error } = await client
        .from('team_projects')
        .update(updatePayload)
        .eq('id', validProjectId);

      if (error) {
        console.warn('Update team_projects with folder_id column failed, falling back:', error);
        delete updatePayload.folder_id;
        await client
          .from('team_projects')
          .update(updatePayload)
          .eq('id', validProjectId);
      }
    } catch (e) {
      console.warn('Failed to update project folder on Supabase:', e);
    }
  }
}

export async function syncTeamFoldersFromCloud(teamId: string): Promise<TeamFolder[]> {
  const client = getSupabaseClient();
  const validTeamId = ensureUuid(teamId);

  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('team_folders')
        .select('*')
        .eq('team_id', validTeamId);

      if (!error && data && data.length > 0) {
        const mapped: TeamFolder[] = data.map((row: any) => ({
          id: row.id,
          teamId: row.team_id,
          name: row.name,
          description: row.description || '',
          color: row.color || 'blue',
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
        }));

        const others = getAllStoredTeamFolders().filter((f) => f.teamId !== validTeamId);
        saveAllStoredTeamFolders([...mapped, ...others]);
        return mapped;
      }
    } catch {
      // ignore
    }
  }

  return getTeamFolders(teamId);
}
