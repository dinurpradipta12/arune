import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface ProjectFolder {
  id: string;
  name: string;
  description: string;
  color: string; // e.g., 'blue', 'amber', 'emerald', 'purple', 'rose', 'indigo', 'cyan', 'pink'
  icon?: string;
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_FOLDERS_KEY = 'arune_project_folders_v1';

export const FOLDER_COLORS = [
  { id: 'blue', label: 'Biru', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500', hex: '#3B82F6' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500', hex: '#F59E0B' },
  { id: 'emerald', label: 'Hijau', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500', hex: '#10B981' },
  { id: 'purple', label: 'Ungu', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500', hex: '#A855F7' },
  { id: 'rose', label: 'Merah', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', badge: 'bg-rose-500', hex: '#F43F5E' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', badge: 'bg-indigo-500', hex: '#6366F1' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500', hex: '#06B6D4' },
  { id: 'orange', label: 'Oranye', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500', hex: '#F97316' },
];

export function getFolderColorTheme(colorId?: string) {
  return FOLDER_COLORS.find((c) => c.id === colorId) || FOLDER_COLORS[0];
}

// Initial default folders if none exist yet
const DEFAULT_FOLDERS: ProjectFolder[] = [
  {
    id: 'folder-editorial',
    name: 'Editorial & Magazine',
    description: 'Kumpulan carousel bergaya editorial majalah dan cerita inspiratif',
    color: 'amber',
    icon: 'folder',
    projectIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-business',
    name: 'Bisnis & Promosi Klien',
    description: 'Postingan penawaran produk, portofolio klien, dan branding komersial',
    color: 'blue',
    icon: 'folder',
    projectIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-education',
    name: 'Edukasi & Tips Tech',
    description: 'Konten microblog panduan step-by-step dan wawasan teknologi',
    color: 'emerald',
    icon: 'folder',
    projectIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get all project folders from LocalStorage
 */
export function getProjectFolders(): ProjectFolder[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FOLDERS_KEY);
    if (!raw) {
      // Initialize with default folders for quick onboarding
      localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(DEFAULT_FOLDERS));
      return DEFAULT_FOLDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse stored project folders:', err);
  }
  return DEFAULT_FOLDERS;
}

/**
 * Save all project folders to LocalStorage
 */
export function saveProjectFolders(folders: ProjectFolder[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(folders));
  } catch (err) {
    console.warn('Failed to save project folders to localStorage:', err);
  }
}

/**
 * Create a new project folder
 */
export function createProjectFolder(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): ProjectFolder {
  const folders = getProjectFolders();
  const newFolder: ProjectFolder = {
    id: `folder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name.trim() || 'Folder Baru',
    description: data.description?.trim() || '',
    color: data.color || 'blue',
    icon: data.icon || 'folder',
    projectIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newFolder, ...folders];
  saveProjectFolders(updated);

  // Background cloud sync if Supabase is active
  void syncFolderToCloud(newFolder);

  return newFolder;
}

/**
 * Update an existing project folder
 */
export function updateProjectFolder(
  id: string,
  updates: Partial<Omit<ProjectFolder, 'id' | 'createdAt'>>
): ProjectFolder | null {
  const folders = getProjectFolders();
  const index = folders.findIndex((f) => f.id === id);
  if (index === -1) return null;

  const updatedFolder: ProjectFolder = {
    ...folders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  folders[index] = updatedFolder;
  saveProjectFolders(folders);

  void syncFolderToCloud(updatedFolder);

  return updatedFolder;
}

/**
 * Delete a project folder
 */
export function deleteProjectFolder(id: string): boolean {
  const folders = getProjectFolders();
  const filtered = folders.filter((f) => f.id !== id);
  if (filtered.length === folders.length) return false;

  saveProjectFolders(filtered);

  // Delete from cloud if available
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      void (async () => {
        try {
          await client.from('project_folders').delete().eq('id', id);
        } catch {
          // ignore
        }
      })();
    }
  }

  return true;
}

/**
 * Add projects to a folder
 */
export function addProjectsToFolder(folderId: string, projectIdsToAdd: string[]): ProjectFolder | null {
  const folders = getProjectFolders();
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return null;

  const currentSet = new Set(folder.projectIds);
  projectIdsToAdd.forEach((pId) => currentSet.add(pId));

  folder.projectIds = Array.from(currentSet);
  folder.updatedAt = new Date().toISOString();

  saveProjectFolders(folders);
  void syncFolderToCloud(folder);

  return folder;
}

/**
 * Remove a single project from a folder
 */
export function removeProjectFromFolder(folderId: string, projectId: string): ProjectFolder | null {
  const folders = getProjectFolders();
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return null;

  folder.projectIds = folder.projectIds.filter((id) => id !== projectId);
  folder.updatedAt = new Date().toISOString();

  saveProjectFolders(folders);
  void syncFolderToCloud(folder);

  return folder;
}

/**
 * Move or assign a project to a different folder
 */
export function moveProjectToFolder(projectId: string, targetFolderId: string | null): void {
  const folders = getProjectFolders();

  // First remove project from any current folder it's in (if single-folder rule is preferred)
  folders.forEach((f) => {
    if (f.projectIds.includes(projectId)) {
      f.projectIds = f.projectIds.filter((id) => id !== projectId);
      f.updatedAt = new Date().toISOString();
    }
  });

  // Then add to target folder if specified
  if (targetFolderId) {
    const target = folders.find((f) => f.id === targetFolderId);
    if (target) {
      target.projectIds.push(projectId);
      target.updatedAt = new Date().toISOString();
    }
  }

  saveProjectFolders(folders);
}

/**
 * Get all folders that contain a specific project
 */
export function getFoldersForProject(projectId: string): ProjectFolder[] {
  const folders = getProjectFolders();
  return folders.filter((f) => f.projectIds.includes(projectId));
}

/**
 * Cloud Sync helpers (safe with fallback)
 */
async function syncFolderToCloud(folder: ProjectFolder): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('project_folders').upsert(
      {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        color: folder.color,
        icon: folder.icon,
        project_ids: folder.projectIds,
        updated_at: folder.updatedAt,
      },
      { onConflict: 'id' }
    );
  } catch {
    // Cloud sync failure is silently ignored so offline/local storage continues seamlessly
  }
}

export async function syncProjectFoldersFromCloud(): Promise<ProjectFolder[]> {
  if (!isSupabaseConfigured()) {
    return getProjectFolders();
  }
  const client = getSupabaseClient();
  if (!client) {
    return getProjectFolders();
  }

  try {
    const { data, error } = await client
      .from('project_folders')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getProjectFolders();
    }

    const cloudFolders: ProjectFolder[] = data.map((row: any) => ({
      id: row.id,
      name: row.name || 'Folder',
      description: row.description || '',
      color: row.color || 'blue',
      icon: row.icon || 'folder',
      projectIds: Array.isArray(row.project_ids) ? row.project_ids : [],
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));

    // Merge with local folders
    const localFolders = getProjectFolders();
    const map = new Map<string, ProjectFolder>();

    localFolders.forEach((f) => map.set(f.id, f));
    cloudFolders.forEach((f) => map.set(f.id, f));

    const merged = Array.from(map.values());
    saveProjectFolders(merged);
    return merged;
  } catch {
    return getProjectFolders();
  }
}
