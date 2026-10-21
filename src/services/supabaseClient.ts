import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const LOCAL_STORAGE_SUPA_CONFIG_KEY = 'editorial_carousel_studio_supabase_cfg_v1';

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseConfig(): SupabaseRuntimeConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (envUrl && envKey) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SUPA_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: (parsed.url || '').trim(),
        anonKey: (parsed.anonKey || '').trim(),
      };
    }
  } catch {
    // ignore storage errors
  }
  return { url: '', anonKey: '' };
}

export function saveSupabaseConfig(cfg: SupabaseRuntimeConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SUPA_CONFIG_KEY, JSON.stringify(cfg));
    // Reset cache so new config triggers new client
    cachedClient = null;
    cachedConfigKey = '';
  } catch {
    // ignore
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  const key = `${url}:::${anonKey}`;
  if (cachedClient && cachedConfigKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 30,
        },
      },
    });
    cachedConfigKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}
