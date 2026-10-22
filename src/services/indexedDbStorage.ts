/**
 * IndexedDB Storage Engine for Arune Carousel Studio
 * 
 * Provides practically unlimited, asynchronous persistent storage for:
 * 1. Active Working Project & open document tabs (including high-res base64 images)
 * 2. Saved User Projects (Proyek Terakhir & folder collections)
 * 3. Rotating Project Recovery Vault (automatic snapshots of last 20 projects)
 * 4. Version History Snapshots (revisions over time)
 * 
 * Unlike localStorage (which has a strict 5MB quota and silently drops data on QuotaExceededError),
 * IndexedDB supports hundreds of megabytes/gigabytes of storage without quota crashes.
 */

import type { CloudTemplateRecord, ProjectVersionSnapshot, Slide, AspectRatioKey, GlobalBranding } from '../types/studio';
import type { OpenDocumentTab } from '../store/useStudioStore';

const DB_NAME = 'arune_carousel_studio_db_v1';
const DB_VERSION = 1;

export interface IDBSavedWorkingProject {
  projectId: string;
  projectTitle: string;
  aspectRatio: AspectRatioKey;
  activeThemeId: string;
  themeOverride?: any;
  branding: GlobalBranding;
  scriptText: string;
  slides: Slide[];
  activeSlideIndex: number;
  openDocuments: OpenDocumentTab[];
  activeDocumentId: string;
  comments?: any[];
  savedAt: string;
  timestamp: number;
}

export interface IDBVaultItem {
  id: string; // usually projectId or timestamp
  projectId: string;
  projectTitle: string;
  aspectRatio: AspectRatioKey;
  slideCount: number;
  slides: Slide[];
  branding: GlobalBranding;
  activeThemeId: string;
  scriptText?: string;
  savedAt: string;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;

function isIDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Initialize and open IndexedDB instance
 */
export function getStudioDB(): Promise<IDBDatabase | null> {
  if (!isIDBSupported()) return Promise.resolve(null);
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Working Project (key: 'current')
        if (!db.objectStoreNames.contains('working_project')) {
          db.createObjectStore('working_project');
        }

        // 2. Saved Projects / Templates (key: record.id)
        if (!db.objectStoreNames.contains('saved_projects')) {
          db.createObjectStore('saved_projects', { keyPath: 'id' });
        }

        // 3. Project Recovery Vault (key: id, indexed by timestamp)
        if (!db.objectStoreNames.contains('project_vault')) {
          const vaultStore = db.createObjectStore('project_vault', { keyPath: 'id' });
          vaultStore.createIndex('timestamp', 'timestamp', { unique: false });
          vaultStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // 4. Version History Snapshots (key: id, indexed by projectId)
        if (!db.objectStoreNames.contains('project_snapshots')) {
          const snapStore = db.createObjectStore('project_snapshots', { keyPath: 'id' });
          snapStore.createIndex('projectId', 'projectId', { unique: false });
          snapStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn('Failed to open IndexedDB:', err);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB initialization error:', err);
      resolve(null);
    }
  });

  return dbInitPromise;
}

// ============================================================================
// 1. ACTIVE WORKING PROJECT (Canvas Live Session)
// ============================================================================

export async function saveWorkingProjectIDB(doc: IDBSavedWorkingProject): Promise<boolean> {
  try {
    const db = await getStudioDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(['working_project', 'project_vault'], 'readwrite');
      const store = tx.objectStore('working_project');
      const vaultStore = tx.objectStore('project_vault');

      const payload: IDBSavedWorkingProject = {
        ...doc,
        savedAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      store.put(payload, 'current');

      // Also automatically update rotating recovery vault
      if (doc.slides && doc.slides.length > 0) {
        const vaultId = doc.projectId || `proj_${Date.now()}`;
        const vaultItem: IDBVaultItem = {
          id: vaultId,
          projectId: vaultId,
          projectTitle: doc.projectTitle || 'Untitled Carousel',
          aspectRatio: doc.aspectRatio,
          slideCount: doc.slides.length,
          slides: doc.slides,
          branding: doc.branding,
          activeThemeId: doc.activeThemeId,
          scriptText: doc.scriptText,
          savedAt: new Date().toISOString(),
          timestamp: Date.now(),
        };
        vaultStore.put(vaultItem);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('Error saving to IndexedDB working_project:', e);
    return false;
  }
}

export async function loadWorkingProjectIDB(): Promise<IDBSavedWorkingProject | null> {
  try {
    const db = await getStudioDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction('working_project', 'readonly');
      const store = tx.objectStore('working_project');
      const request = store.get('current');

      request.onsuccess = () => {
        const res = request.result;
        if (res && Array.isArray(res.slides) && res.slides.length > 0) {
          resolve(res);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('Error loading from IndexedDB working_project:', e);
    return null;
  }
}

// ============================================================================
// 2. SAVED USER PROJECTS (Proyek Terakhir / Templates)
// ============================================================================

export async function saveUserProjectIDB(record: CloudTemplateRecord): Promise<boolean> {
  try {
    const db = await getStudioDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction('saved_projects', 'readwrite');
      const store = tx.objectStore('saved_projects');
      store.put(record);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('Error saving to IndexedDB saved_projects:', e);
    return false;
  }
}

export async function getAllUserProjectsIDB(): Promise<CloudTemplateRecord[]> {
  try {
    const db = await getStudioDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction('saved_projects', 'readonly');
      const store = tx.objectStore('saved_projects');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // Sort newest first
        results.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        resolve(results);
      };

      request.onerror = () => resolve([]);
    });
  } catch (e) {
    console.warn('Error getting all user projects from IndexedDB:', e);
    return [];
  }
}

export async function deleteUserProjectIDB(id: string): Promise<boolean> {
  try {
    const db = await getStudioDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction('saved_projects', 'readwrite');
      const store = tx.objectStore('saved_projects');
      store.delete(id);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('Error deleting user project from IndexedDB:', e);
    return false;
  }
}

// ============================================================================
// 3. PROJECT RECOVERY VAULT (Backup history)
// ============================================================================

export async function getVaultProjectsIDB(): Promise<IDBVaultItem[]> {
  try {
    const db = await getStudioDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction('project_vault', 'readonly');
      const store = tx.objectStore('project_vault');
      const request = store.getAll();

      request.onsuccess = () => {
        const items: IDBVaultItem[] = request.result || [];
        items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(items.slice(0, 30)); // retain last 30 backup snapshots
      };

      request.onerror = () => resolve([]);
    });
  } catch (e) {
    console.warn('Error getting vault projects from IndexedDB:', e);
    return [];
  }
}

// ============================================================================
// 4. VERSION HISTORY SNAPSHOTS
// ============================================================================

export async function saveVersionSnapshotIDB(snapshot: ProjectVersionSnapshot): Promise<boolean> {
  try {
    const db = await getStudioDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction('project_snapshots', 'readwrite');
      const store = tx.objectStore('project_snapshots');
      store.put(snapshot);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('Error saving snapshot to IndexedDB:', e);
    return false;
  }
}

export async function getVersionSnapshotsIDB(projectId: string): Promise<ProjectVersionSnapshot[]> {
  try {
    const db = await getStudioDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction('project_snapshots', 'readonly');
      const store = tx.objectStore('project_snapshots');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const list: ProjectVersionSnapshot[] = request.result || [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };

      request.onerror = () => resolve([]);
    });
  } catch (e) {
    console.warn('Error getting version snapshots from IndexedDB:', e);
    return [];
  }
}
