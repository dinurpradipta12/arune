import { getSupabaseClient } from './supabaseClient';
import { type SupabaseClient, type User } from '@supabase/supabase-js';
import { AVATAR_PRESETS, getAvatarPresetById } from '../constants/avatarPresets';
import { saveCurrentUserProfile } from './teamWorkspaceService';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarId: string;
  avatarColor: string;
  isSupabaseUser: boolean;
  createdAt?: string;
}

const STORAGE_KEY_AUTH_USER = 'arune_auth_user_session_v1';
const AUTH_LISTENERS: Array<(user: AuthUser | null) => void> = [];

function notifyAuthListeners(user: AuthUser | null) {
  AUTH_LISTENERS.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.warn('Error in auth listener:', e);
    }
  });
}

export function subscribeToAuthChanges(callback: (user: AuthUser | null) => void): () => void {
  AUTH_LISTENERS.push(callback);
  callback(getCurrentAuthUser());
  return () => {
    const idx = AUTH_LISTENERS.indexOf(callback);
    if (idx !== -1) AUTH_LISTENERS.splice(idx, 1);
  };
}

function getClient(): SupabaseClient | null {
  return getSupabaseClient();
}

export function getCurrentAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

function saveLocalSession(user: AuthUser | null) {
  if (user) {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      const avatarPreset = getAvatarPresetById(user.avatarId);
      saveCurrentUserProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: avatarPreset.bgColor || user.avatarColor || '#5E887E',
      });
    } catch {
      // ignore
    }
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    } catch {
      // ignore
    }
  }
  notifyAuthListeners(user);
}

// Map a Supabase User object into our AuthUser
async function mapSupabaseUser(supaUser: User, client: SupabaseClient): Promise<AuthUser> {
  let name = supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'Member';
  let avatarId = supaUser.user_metadata?.avatar_id || 'ava-1';

  try {
    const { data: profile } = await client
      .from('profiles')
      .select('name, avatar_id')
      .eq('id', supaUser.id)
      .maybeSingle();

    if (profile) {
      if (profile.name) name = profile.name;
      if (profile.avatar_id) avatarId = profile.avatar_id;
    }
  } catch {
    // table might not exist yet, fallback to user_metadata
  }

  const avatar = getAvatarPresetById(avatarId);
  return {
    id: supaUser.id,
    email: supaUser.email || '',
    name,
    avatarId,
    avatarColor: avatar.bgColor,
    isSupabaseUser: true,
    createdAt: supaUser.created_at,
  };
}

// 1. SIGN IN WITH EMAIL & PASSWORD
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ user?: AuthUser; error?: string }> {
  const client = getClient();

  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const authUser = await mapSupabaseUser(data.user, client);
        saveLocalSession(authUser);
        return { user: authUser };
      }
    } catch (e: any) {
      return { error: e.message || 'Gagal login ke Supabase.' };
    }
  }

  // Offline / Demo Fallback Mode
  const fallbackAvatar = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
  const nameFromEmail = email.split('@')[0] || 'Anggota Tim';
  const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

  const fallbackUser: AuthUser = {
    id: `local_user_${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: capitalizedName,
    avatarId: fallbackAvatar.id,
    avatarColor: fallbackAvatar.bgColor,
    isSupabaseUser: false,
    createdAt: new Date().toISOString(),
  };

  saveLocalSession(fallbackUser);
  return { user: fallbackUser };
}

// 2. SIGN UP WITH EMAIL, PASSWORD & AVATAR PRESET
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string,
  avatarId: string
): Promise<{ user?: AuthUser; error?: string }> {
  const client = getClient();
  const avatar = getAvatarPresetById(avatarId);

  if (client) {
    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            name: name.trim(),
            avatar_id: avatarId,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Try creating / updating profile row
        try {
          await client.from('profiles').upsert({
            id: data.user.id,
            email: email.trim(),
            name: name.trim(),
            avatar_id: avatarId,
            avatar_color: avatar.bgColor,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // table might not be initialized yet
        }

        const authUser = await mapSupabaseUser(data.user, client);
        saveLocalSession(authUser);
        return { user: authUser };
      }
    } catch (e: any) {
      return { error: e.message || 'Gagal registrasi ke Supabase.' };
    }
  }

  // Offline / Demo Fallback Mode
  const fallbackUser: AuthUser = {
    id: `local_user_${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name.trim() || 'Anggota Tim',
    avatarId,
    avatarColor: avatar.bgColor,
    isSupabaseUser: false,
    createdAt: new Date().toISOString(),
  };

  saveLocalSession(fallbackUser);
  return { user: fallbackUser };
}

// 3. LOGOUT
export async function logoutUser(): Promise<void> {
  const client = getClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch {
      // ignore
    }
  }
  saveLocalSession(null);
}

// 4. UPDATE USER PROFILE (NAME OR AVATAR)
export async function updateAuthUserProfile(
  partial: Partial<Pick<AuthUser, 'name' | 'avatarId'>>
): Promise<AuthUser | null> {
  const current = getCurrentAuthUser();
  if (!current) return null;

  const nextAvatarId = partial.avatarId || current.avatarId;
  const avatar = getAvatarPresetById(nextAvatarId);

  const updated: AuthUser = {
    ...current,
    name: partial.name ? partial.name.trim() : current.name,
    avatarId: nextAvatarId,
    avatarColor: avatar.bgColor,
  };

  const client = getClient();
  if (client && current.isSupabaseUser) {
    try {
      await client.auth.updateUser({
        data: {
          name: updated.name,
          avatar_id: updated.avatarId,
        },
      });
      await client.from('profiles').upsert({
        id: current.id,
        name: updated.name,
        avatar_id: updated.avatarId,
        avatar_color: updated.avatarColor,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to sync profile update to Supabase:', e);
    }
  }

  saveLocalSession(updated);
  return updated;
}
