import type { ProjectVersionSnapshot } from '../types/studio';
import { useStudioStore } from '../store/useStudioStore';
import { multiplayerService } from './multiplayerService';

const STORAGE_PREFIX = 'arune_snapshots_v1_';
const MAX_SNAPSHOTS_PER_PROJECT = 40;

export function getProjectVersionSnapshots(projectId: string): ProjectVersionSnapshot[] {
  if (!projectId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!raw) return [];
    const list: ProjectVersionSnapshot[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn('Failed to load project snapshots:', e);
    return [];
  }
}

export function saveProjectVersionSnapshot(
  snapshotData: Omit<ProjectVersionSnapshot, 'id' | 'createdAt'>
): ProjectVersionSnapshot {
  const projectId = snapshotData.projectId;
  const existing = getProjectVersionSnapshots(projectId);

  const newSnapshot: ProjectVersionSnapshot = {
    ...snapshotData,
    id: `snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  // Prepend newest first
  const updated = [newSnapshot, ...existing].slice(0, MAX_SNAPSHOTS_PER_PROJECT);

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save project snapshot:', e);
  }

  return newSnapshot;
}

export function renameProjectVersionSnapshot(
  projectId: string,
  snapshotId: string,
  newName: string
): boolean {
  if (!projectId || !snapshotId || !newName.trim()) return false;
  const existing = getProjectVersionSnapshots(projectId);
  const target = existing.find((s) => s.id === snapshotId);
  if (!target) return false;

  target.versionName = newName.trim();
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(existing));
    return true;
  } catch {
    return false;
  }
}

export function deleteProjectVersionSnapshot(
  projectId: string,
  snapshotId: string
): boolean {
  if (!projectId || !snapshotId) return false;
  const existing = getProjectVersionSnapshots(projectId);
  const filtered = existing.filter((s) => s.id !== snapshotId);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates and records a snapshot of current live editor state.
 */
export function createMilestoneSnapshotFromCurrentStore(
  customVersionName?: string
): ProjectVersionSnapshot | null {
  const state = useStudioStore.getState();
  if (!state.projectId && state.slides.length === 0) return null;

  const myIdentity = multiplayerService.getMyIdentity();
  const projectId = state.projectId || 'default_project';
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const nameToUse =
    customVersionName?.trim() ||
    `Revisi ${timeStr} (${state.slides.length} slide)`;

  return saveProjectVersionSnapshot({
    projectId,
    projectTitle: state.projectTitle || 'Untitled Carousel',
    versionName: nameToUse,
    authorId: myIdentity.userId,
    authorName: myIdentity.name,
    authorAvatarColor: myIdentity.avatarColor,
    slideCount: state.slides.length,
    slides: JSON.parse(JSON.stringify(state.slides)),
    aspectRatio: state.aspectRatio,
    activeThemeId: state.activeThemeId,
    branding: JSON.parse(JSON.stringify(state.branding)),
    scriptText: state.scriptText,
  });
}
