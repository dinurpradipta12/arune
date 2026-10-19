import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AspectRatioKey, CloudTemplateRecord } from '../types/studio';

// 1. LOCAL USER PROJECTS CACHE KEY (Strictly per-device browser cache, NEVER synced to Supabase)
const LOCAL_USER_PROJECTS_CACHE_KEY = 'arune_local_user_projects_cache_v1';
const LEGACY_LOCAL_PROJECTS_KEY = 'editorial_carousel_studio_templates_v1';

// 2. CLOUD MASTER TEMPLATES & GLOBAL CONFIG CACHE KEYS (Synced with Supabase by Admin/Developer)
const LOCAL_CLOUD_TEMPLATES_CACHE_KEY = 'arune_cloud_master_templates_cache_v1';
const LOCAL_GLOBAL_CONFIG_KEY = 'arune_global_studio_config_v1';
const LOCAL_STORAGE_SUPA_CONFIG_KEY = 'editorial_carousel_studio_supabase_cfg_v1';

// Reserved row ID inside `editorial_templates` table used to store global studio config & admin credentials
const GLOBAL_CONFIG_ROW_ID = '__arune_global_studio_config__';

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

export interface CloudGlobalStudioConfig {
  studioName: string;
  studioSubtitle: string;
  adminUsername: string;
  adminPassword: string;
  defaultAspectRatio: AspectRatioKey;
  defaultThemeId: string;
  defaultSlideCount: number;
  updatedAt: string;
}

export const DEFAULT_GLOBAL_STUDIO_CONFIG: CloudGlobalStudioConfig = {
  studioName: 'Arune Carousel Studio',
  studioSubtitle: 'Carousel & Story Pro',
  adminUsername: 'arunika',
  adminPassword: 'Ar4925',
  defaultAspectRatio: '4:5',
  defaultThemeId: 'kinfolk-linen',
  defaultSlideCount: 6,
  updatedAt: new Date().toISOString(),
};

export function getSupabaseConfig(): SupabaseRuntimeConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SUPA_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
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
  } catch {
    // ignore
  }
}

function getClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url.trim() && anonKey.trim());
}

// ============================================================================
// LAYER 1: LOCAL USER PROJECTS (Strictly Browser Local Cache per User Device)
// ============================================================================

export function getLocalTemplates(): CloudTemplateRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_USER_PROJECTS_CACHE_KEY);
    if (raw) {
      return (JSON.parse(raw) as CloudTemplateRecord[]).filter(
        (t) => t.id !== GLOBAL_CONFIG_ROW_ID
      );
    }
    // Migrate legacy local projects if present
    const legacyRaw = localStorage.getItem(LEGACY_LOCAL_PROJECTS_KEY);
    if (legacyRaw) {
      const parsed = (JSON.parse(legacyRaw) as CloudTemplateRecord[]).filter(
        (t) => t.id !== GLOBAL_CONFIG_ROW_ID
      );
      localStorage.setItem(
        LOCAL_USER_PROJECTS_CACHE_KEY,
        JSON.stringify(parsed)
      );
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveLocalTemplates(templates: CloudTemplateRecord[]): void {
  try {
    const clean = templates.filter((t) => t.id !== GLOBAL_CONFIG_ROW_ID);
    localStorage.setItem(LOCAL_USER_PROJECTS_CACHE_KEY, JSON.stringify(clean));
  } catch {
    // ignore quota errors
  }
}

export function clearLocalUserProjectsCache(): void {
  try {
    localStorage.removeItem(LOCAL_USER_PROJECTS_CACHE_KEY);
    localStorage.removeItem(LEGACY_LOCAL_PROJECTS_KEY);
  } catch {
    // ignore
  }
}

/**
 * Lists the user's personal saved projects from local device cache ONLY
 * so user projects never mix across different users in Supabase.
 */
export async function listTemplates(): Promise<{
  templates: CloudTemplateRecord[];
  mode: 'local';
  error?: string;
}> {
  const local = getLocalTemplates();
  return { templates: local, mode: 'local' };
}

/**
 * Saves a user's project strictly into their own browser's local cache.
 */
export async function upsertTemplate(
  record: Omit<CloudTemplateRecord, 'updatedAt' | 'source'>
): Promise<{
  saved: CloudTemplateRecord;
  mode: 'local';
  warning?: string;
}> {
  const timestamp = new Date().toISOString();
  const localRecord: CloudTemplateRecord = {
    ...record,
    updatedAt: timestamp,
    source: 'local',
  };

  const existing = getLocalTemplates().filter((t) => t.id !== record.id);
  saveLocalTemplates([localRecord, ...existing]);

  return { saved: localRecord, mode: 'local' };
}

export async function deleteTemplateById(id: string): Promise<void> {
  const remaining = getLocalTemplates().filter((t) => t.id !== id);
  saveLocalTemplates(remaining);
}

// ============================================================================
// LAYER 2: SUPABASE CLOUD DATABASE (Admin Credentials, Studio Name & Master Templates)
// ============================================================================

export function getCachedGlobalStudioConfig(): CloudGlobalStudioConfig {
  try {
    const raw = localStorage.getItem(LOCAL_GLOBAL_CONFIG_KEY);
    if (!raw) return DEFAULT_GLOBAL_STUDIO_CONFIG;
    const parsed = JSON.parse(raw) as Partial<CloudGlobalStudioConfig>;
    return {
      ...DEFAULT_GLOBAL_STUDIO_CONFIG,
      ...parsed,
    };
  } catch {
    return DEFAULT_GLOBAL_STUDIO_CONFIG;
  }
}

export function saveCachedGlobalStudioConfig(
  cfg: CloudGlobalStudioConfig
): void {
  try {
    localStorage.setItem(LOCAL_GLOBAL_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

export function getCachedCloudMasterTemplates(): CloudTemplateRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_CLOUD_TEMPLATES_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CloudTemplateRecord[];
  } catch {
    return [];
  }
}

export function saveCachedCloudMasterTemplates(
  list: CloudTemplateRecord[]
): void {
  try {
    localStorage.setItem(LOCAL_CLOUD_TEMPLATES_CACHE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/**
 * Fetches Global Studio Config (Admin Credentials, App Name, Defaults) AND
 * Published Master Templates from Supabase so all devices stay synchronized.
 */
export async function fetchCloudStudioData(): Promise<{
  config: CloudGlobalStudioConfig;
  masterTemplates: CloudTemplateRecord[];
  mode: 'supabase' | 'local';
  error?: string;
}> {
  const cachedConfig = getCachedGlobalStudioConfig();
  const cachedTemplates = getCachedCloudMasterTemplates();
  const client = getClient();

  if (!client) {
    return {
      config: cachedConfig,
      masterTemplates: cachedTemplates,
      mode: 'local',
    };
  }

  try {
    const { data, error } = await client
      .from('editorial_templates')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      return {
        config: cachedConfig,
        masterTemplates: cachedTemplates,
        mode: 'local',
        error: `Supabase fallback ke cache lokal (${error.message})`,
      };
    }

    let remoteConfig: CloudGlobalStudioConfig = cachedConfig;
    const remoteMasterTemplates: CloudTemplateRecord[] = [];

    for (const row of (data || []) as Record<string, unknown>[]) {
      const rowId = String(row.id || '');
      if (rowId === GLOBAL_CONFIG_ROW_ID) {
        try {
          const parsedCfg = JSON.parse(
            String(row.script_text || '{}')
          ) as Partial<CloudGlobalStudioConfig>;
          remoteConfig = {
            ...DEFAULT_GLOBAL_STUDIO_CONFIG,
            ...parsedCfg,
            studioName:
              String(row.name || parsedCfg.studioName || 'Arune Carousel Studio'),
            updatedAt: String(row.updated_at || new Date().toISOString()),
          };
          saveCachedGlobalStudioConfig(remoteConfig);
        } catch {
          // ignore malformed config
        }
        continue;
      }

      remoteMasterTemplates.push({
        id: rowId,
        name: String(row.name || 'Untitled Arune Template'),
        description: String(row.description || ''),
        aspectRatio:
          (row.aspect_ratio as CloudTemplateRecord['aspectRatio']) || '4:5',
        themeId: String(row.theme_id || 'kinfolk-linen'),
        branding: (row.branding as CloudTemplateRecord['branding']) || {
          publicationName: 'ARUNE CHRONICLES',
          issueLabel: 'VOL. XIV',
          authorOrHandle: '@arune.studio',
          footerNote: '2026',
          showSlideNumbers: true,
          showFooterBar: true,
        },
        scriptText: String(row.script_text || ''),
        slides: (row.slides as CloudTemplateRecord['slides']) || [],
        updatedAt: String(row.updated_at || new Date().toISOString()),
        source: 'supabase',
      });
    }

    saveCachedCloudMasterTemplates(remoteMasterTemplates);
    return {
      config: remoteConfig,
      masterTemplates: remoteMasterTemplates,
      mode: 'supabase',
    };
  } catch (err) {
    return {
      config: cachedConfig,
      masterTemplates: cachedTemplates,
      mode: 'local',
      error:
        err instanceof Error ? err.message : 'Network error — menggunakan cache lokal',
    };
  }
}

/**
 * Verifies Administrator Login against both the master credentials (`arunika` / `Ar4925`)
 * and any synced Supabase database admin credentials across devices.
 */
export async function verifyAdministratorCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<{
  ok: boolean;
  config: CloudGlobalStudioConfig;
  source: 'supabase' | 'master';
}> {
  const cleanUser = usernameInput.trim();
  const cleanPass = passwordInput;

  // Sync latest config from Supabase if available so cross-device login always works
  const cloudData = await fetchCloudStudioData();
  const cfg = cloudData.config;

  // Match against either the built-in master admin credential (arunika / Ar4925)
  // or the synced database admin credential
  const matchesMaster =
    cleanUser.toLowerCase() === 'arunika' && cleanPass === 'Ar4925';
  const matchesSynced =
    cleanUser.toLowerCase() === cfg.adminUsername.toLowerCase() &&
    cleanPass === cfg.adminPassword;

  if (matchesMaster || matchesSynced) {
    return {
      ok: true,
      config: cfg,
      source: cloudData.mode === 'supabase' ? 'supabase' : 'master',
    };
  }

  return {
    ok: false,
    config: cfg,
    source: cloudData.mode === 'supabase' ? 'supabase' : 'master',
  };
}

/**
 * Syncs Global Studio Config (Studio Name, Admin Credentials, Default Settings) to Supabase.
 */
export async function syncGlobalConfigToSupabase(
  partial: Partial<Omit<CloudGlobalStudioConfig, 'updatedAt'>>
): Promise<{
  config: CloudGlobalStudioConfig;
  mode: 'supabase' | 'local';
  message: string;
}> {
  const timestamp = new Date().toISOString();
  const nextConfig: CloudGlobalStudioConfig = {
    ...getCachedGlobalStudioConfig(),
    ...partial,
    updatedAt: timestamp,
  };

  saveCachedGlobalStudioConfig(nextConfig);

  const client = getClient();
  if (!client) {
    return {
      config: nextConfig,
      mode: 'local',
      message:
        'Disimpan di perangkat ini. Hubungkan URL & Anon Key Supabase untuk sinkronisasi otomatis ke semua perangkat.',
    };
  }

  try {
    const { error } = await client.from('editorial_templates').upsert(
      {
        id: GLOBAL_CONFIG_ROW_ID,
        name: nextConfig.studioName,
        description: 'GLOBAL_STUDIO_CONFIG_AND_ADMIN_CREDENTIALS',
        aspect_ratio: nextConfig.defaultAspectRatio,
        theme_id: nextConfig.defaultThemeId,
        branding: {},
        script_text: JSON.stringify(nextConfig),
        slides: [],
        updated_at: timestamp,
      },
      { onConflict: 'id' }
    );

    if (error) {
      return {
        config: nextConfig,
        mode: 'local',
        message: `Tersimpan lokal (Catatan tabel Supabase: ${error.message})`,
      };
    }

    return {
      config: nextConfig,
      mode: 'supabase',
      message:
        'Berhasil disinkronkan ke database Supabase! Nama studio, pengaturan default, dan kredensial admin kini aktif di semua perangkat.',
    };
  } catch (err) {
    return {
      config: nextConfig,
      mode: 'local',
      message:
        err instanceof Error
          ? err.message
          : 'Disimpan secara lokal (gagal terhubung ke Supabase)',
    };
  }
}

/**
 * Used exclusively by Administrator in Developer Menu to publish or update
 * a Master Template to the Supabase database.
 */
export async function publishMasterTemplateToCloud(
  record: Omit<CloudTemplateRecord, 'updatedAt' | 'source'>
): Promise<{
  saved: CloudTemplateRecord;
  mode: 'supabase' | 'local';
  message: string;
}> {
  const timestamp = new Date().toISOString();
  const cloudRecord: CloudTemplateRecord = {
    ...record,
    updatedAt: timestamp,
    source: 'supabase',
  };

  const existing = getCachedCloudMasterTemplates().filter(
    (t) => t.id !== record.id
  );
  saveCachedCloudMasterTemplates([cloudRecord, ...existing]);

  const client = getClient();
  if (!client) {
    return {
      saved: cloudRecord,
      mode: 'local',
      message:
        'Template dipublikasikan ke daftar Template Majalah lokal. Konfigurasikan Supabase URL & Key untuk menyebarkan ke semua perangkat.',
    };
  }

  try {
    const { error } = await client.from('editorial_templates').upsert(
      {
        id: record.id,
        name: record.name,
        description: record.description,
        aspect_ratio: record.aspectRatio,
        theme_id: record.themeId,
        branding: record.branding,
        script_text: record.scriptText,
        slides: record.slides,
        updated_at: timestamp,
      },
      { onConflict: 'id' }
    );

    if (error) {
      return {
        saved: cloudRecord,
        mode: 'local',
        message: `Template disimpan di perangkat ini (Supabase: ${error.message})`,
      };
    }

    return {
      saved: cloudRecord,
      mode: 'supabase',
      message:
        'Template berhasil dipublikasikan ke database Supabase dan langsung ter-update di semua perangkat!',
    };
  } catch (err) {
    return {
      saved: cloudRecord,
      mode: 'local',
      message:
        err instanceof Error ? err.message : 'Template disimpan secara lokal',
    };
  }
}

export async function deleteMasterTemplateFromCloud(id: string): Promise<void> {
  const remaining = getCachedCloudMasterTemplates().filter((t) => t.id !== id);
  saveCachedCloudMasterTemplates(remaining);

  const client = getClient();
  if (client) {
    try {
      await client.from('editorial_templates').delete().eq('id', id);
    } catch {
      // ignore remote error
    }
  }
}
