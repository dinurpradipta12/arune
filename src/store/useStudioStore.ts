import { create } from 'zustand';
import {
  ASPECT_RATIOS,
  CURATED_EDITORIAL_IMAGES,
  DEFAULT_BRANDING,
  DEFAULT_SCRIPT,
  THEME_PALETTES,
} from '../constants/themesAndPresets';
import {
  injectFontStyleIntoDocument,
  loadSavedCustomFonts,
  saveCustomFontsToStorage,
} from '../services/fontManager';
import {
  getCachedCloudMasterTemplates,
  getCachedGlobalStudioConfig,
  upsertTemplate,
} from '../services/supabaseTemplates';
import {
  type FontCombinationPreset,
} from '../constants/fontCombinations';
import type {
  AspectRatioKey,
  CanvasComment,
  CanvasCommentReply,
  CanvasElement,
  CloudTemplateRecord,
  CuratedGalleryTemplate,
  CustomFontRecord,
  DividerCanvasElement,
  GlobalBranding,
  ImageCanvasElement,
  LayoutPresetId,
  ProjectVersionSnapshot,
  ShapeCanvasElement,
  ShapeKind,
  Slide,
  TextCanvasElement,
  ThemePalette,
} from '../types/studio';
import {
  buildSlideFromParsedScript,
  extractParsedScriptFromSlide,
  parseScriptToStructuredSlides,
} from '../utils/scriptParser';
import { multiplayerService } from '../services/multiplayerService';
import { saveProjectVersionSnapshot } from '../services/versionHistoryService';

export interface HistorySnapshot {
  slides: Slide[];
  activeSlideIndex: number;
  aspectRatio: AspectRatioKey;
  activeThemeId: string;
  themeOverride: Partial<ThemePalette>;
  branding: GlobalBranding;
}

export interface OpenDocumentTab {
  id: string;
  projectTitle: string;
  aspectRatio: AspectRatioKey;
  activeThemeId: string;
  themeOverride: Partial<ThemePalette>;
  branding: GlobalBranding;
  scriptText: string;
  slides: Slide[];
  activeSlideIndex: number;
  canvasZoom: number;
  lastSavedAt: string | null;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

export interface StudioHotkeys {
  undo: string;
  redo: string;
  saveProject: string;
  duplicateElement: string;
  deleteElement: string;
  newTab: string;
  exportModal: string;
  openSettings: string;
  prevSlide: string;
  nextSlide: string;
}

export interface StudioGeneralSettings {
  studioName: string;
  studioSubtitle: string;
  showCanvasRulers: boolean;
  showCanvasDotGrid: boolean;
  snapToGrid: boolean;
  defaultAspectRatio: AspectRatioKey;
  defaultThemeId: string;
  defaultSlideCount: number;
  defaultOpenInNewTab: boolean;
  autoSaveLocalCache: boolean;
  defaultExportFormat: 'png' | 'jpg' | 'pdf';
  defaultExportWidthPx: number;
  hotkeys: StudioHotkeys;
}

export const DEFAULT_STUDIO_HOTKEYS: StudioHotkeys = {
  undo: 'Mod+Z',
  redo: 'Mod+Shift+Z',
  saveProject: 'Mod+S',
  duplicateElement: 'Mod+D',
  deleteElement: 'Delete',
  newTab: 'Mod+T',
  exportModal: 'Mod+E',
  openSettings: 'Mod+,',
  prevSlide: 'ArrowLeft',
  nextSlide: 'ArrowRight',
};

const LOCAL_SETTINGS_STORAGE_KEY = 'arune_studio_general_settings_v1';
const LOCAL_ADMIN_AUTH_KEY = 'arune_admin_session_active_v1';
const LOCAL_ACTIVE_VIEW_KEY = 'arune_studio_active_view_v1';
const LOCAL_ACTIVE_WORKING_PROJECT_KEY = 'arune_active_working_project_v2';

export interface SavedWorkingProject {
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
  comments?: CanvasComment[];
}

export function saveActiveWorkingProjectToStorage(doc: SavedWorkingProject): void {
  try {
    if (!doc.slides || doc.slides.length === 0) return;
    localStorage.setItem(LOCAL_ACTIVE_WORKING_PROJECT_KEY, JSON.stringify(doc));
  } catch {
    // ignore
  }
}

export function loadSavedWorkingProjectFromStorage(): SavedWorkingProject | null {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVE_WORKING_PROJECT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function getInitialActiveView(): StudioViewMode {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (
        viewParam === 'editor' ||
        viewParam === 'gallery' ||
        viewParam === 'theme-builder' ||
        viewParam === 'team'
      ) {
        return viewParam;
      }
    }
  } catch {
    // ignore
  }
  return 'gallery';
}

export function saveActiveView(view: StudioViewMode): void {
  try {
    localStorage.setItem(LOCAL_ACTIVE_VIEW_KEY, view);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // ignore
  }
}

export function buildDefaultStudioSettings(): StudioGeneralSettings {
  const globalCfg = getCachedGlobalStudioConfig();
  return {
    studioName: globalCfg.studioName || 'Arune Carousel Studio',
    studioSubtitle: globalCfg.studioSubtitle || 'Carousel & Story Pro',
    showCanvasRulers: true,
    showCanvasDotGrid: true,
    snapToGrid: true,
    defaultAspectRatio: globalCfg.defaultAspectRatio || '4:5',
    defaultThemeId: globalCfg.defaultThemeId || THEME_PALETTES[0].id,
    defaultSlideCount: globalCfg.defaultSlideCount || 6,
    defaultOpenInNewTab: true,
    autoSaveLocalCache: true,
    defaultExportFormat: 'png',
    defaultExportWidthPx: 1080,
    hotkeys: { ...DEFAULT_STUDIO_HOTKEYS },
  };
}

function loadSavedStudioSettings(): StudioGeneralSettings {
  const defaults = buildDefaultStudioSettings();
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<StudioGeneralSettings>;
    return {
      ...defaults,
      ...parsed,
      hotkeys: {
        ...DEFAULT_STUDIO_HOTKEYS,
        ...(parsed.hotkeys || {}),
      },
    };
  } catch {
    return defaults;
  }
}

function saveStudioSettingsToStorage(settings: StudioGeneralSettings): void {
  try {
    localStorage.setItem(LOCAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function loadSavedAdminAuth(): boolean {
  try {
    return localStorage.getItem(LOCAL_ADMIN_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export type LeftSidebarTab = 'templates' | 'elements' | 'font-combinations';
export type StudioModalType =
  | 'branding'
  | 'settings'
  | 'team'
  | 'json'
  | 'fonts'
  | 'script'
  | 'export'
  | 'preview'
  | 'version-history'
  | null;
export type StudioViewMode = 'editor' | 'gallery' | 'theme-builder' | 'team';

interface StudioState {
  // Core project state
  projectId: string;
  projectTitle: string;
  aspectRatio: AspectRatioKey;
  activeThemeId: string;
  themeOverride: Partial<ThemePalette>;
  branding: GlobalBranding;
  scriptText: string;
  slides: Slide[];
  activeSlideIndex: number;
  selectedElementId: string | null;
  lastSavedAt: string | null;

  // Multi-Document Tabs (Affinity / Photoshop style)
  openDocuments: OpenDocumentTab[];
  activeDocumentId: string;

  // General Studio Settings, Hotkeys, Admin Mode & Cloud Master Templates
  settings: StudioGeneralSettings;
  isAdminAuthenticated: boolean;
  cloudMasterTemplates: CloudTemplateRecord[];

  // Custom & Local Computer Fonts
  customFonts: CustomFontRecord[];

  // Workspace UI state
  activeView: StudioViewMode;
  canvasZoom: number; // 0.5 to 1.5
  workspaceDarkMode: boolean;
  leftSidebarOpen: boolean;
  activeLeftTab: LeftSidebarTab;
  activeModal: StudioModalType;
  isExporting: boolean;
  exportProgress: string | null;

  // Undo / Redo stacks
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Computed helpers
  getActiveTheme: () => ThemePalette;
  getActiveSlide: () => Slide;
  getSelectedElement: () => CanvasElement | null;

  // Multi-Document Tab Actions
  switchDocumentTab: (docId: string) => void;
  closeDocumentTab: (docId: string) => void;
  openBlankDocumentTab: (ratio?: AspectRatioKey) => void;

  // Actions
  setProjectTitle: (title: string) => void;
  setAspectRatio: (ratio: AspectRatioKey) => void;
  setActiveTheme: (themeId: string) => void;
  updateThemeColors: (partial: Partial<ThemePalette>) => void;
  updateBranding: (partial: Partial<GlobalBranding>) => void;

  // Font actions
  addCustomFont: (font: CustomFontRecord) => void;
  addBatchLocalFonts: (families: string[]) => void;
  removeCustomFont: (family: string) => void;

  // Project Save & Gallery Template actions
  saveCurrentProjectToVault: (options?: {
    asNewCopy?: boolean;
    customTitle?: string;
    description?: string;
  }) => Promise<{ mode: 'supabase' | 'local'; warning?: string }>;
  restoreVersionSnapshot: (snapshot: ProjectVersionSnapshot) => void;
  applyCuratedGalleryTemplate: (
    template: CuratedGalleryTemplate,
    saveCurrentFirst?: boolean,
    openInNewTab?: boolean
  ) => Promise<void>;
  createNewProject: (options: {
    title: string;
    aspectRatio: AspectRatioKey;
    themeId: string;
    slideCount: number;
    initialLayout: LayoutPresetId;
    saveCurrentFirst?: boolean;
    openInNewTab?: boolean;
  }) => Promise<void>;

  setScriptText: (script: string) => void;
  generateSlidesFromScript: (
    scriptOverride?: string,
    preservePhotos?: boolean,
    layoutOverride?: LayoutPresetId,
    applyOverrideToAll?: boolean
  ) => void;

  setActiveSlideIndex: (index: number) => void;
  setSelectedElementId: (id: string | null) => void;

  // Slide management
  addSlide: (layout?: LayoutPresetId) => void;
  duplicateSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  reorderSlide: (fromIndex: number, direction: 'left' | 'right') => void;
  applyLayoutToSlide: (slideIndex: number, layout: LayoutPresetId) => void;
  applyLayoutToAllSlides: (layout: LayoutPresetId) => void;
  applyFontCombination: (
    preset: FontCombinationPreset,
    mode?: 'insert' | 'blank' | 'new-slide'
  ) => void;
  setSlideBackgroundColor: (slideIndex: number, color: string) => void;

  // Element management
  addElement: (
    kind: 'text' | 'image' | 'divider' | 'badge' | 'shape',
    initialProps?: Partial<CanvasElement>
  ) => void;
  updateElement: (
    elementId: string,
    updater: Partial<CanvasElement> | ((prev: CanvasElement) => CanvasElement),
    recordHistory?: boolean
  ) => void;
  updateSlideElementRemote: (
    slideIndex: number,
    elementId: string,
    updates: Partial<CanvasElement>
  ) => void;
  commitElementHistory: () => void;
  deleteElement: (elementId?: string) => void;
  duplicateElement: (elementId?: string) => void;
  adjustElementZIndex: (
    elementId: string,
    direction: 'forward' | 'backward' | 'front' | 'back'
  ) => void;
  alignElementOnCanvas: (
    elementId: string,
    alignment:
      | 'center-x'
      | 'center-y'
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'fit-canvas'
      | 'fit-margin'
  ) => void;

  // Undo / Redo
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Import / Export JSON
  loadProjectSnapshot: (
    payload: {
      id?: string;
      projectTitle?: string;
      aspectRatio: AspectRatioKey;
      activeThemeId: string;
      branding: GlobalBranding;
      scriptText: string;
      slides: Slide[];
    },
    openInNewTab?: boolean
  ) => void;
  syncRemoteCanvasSnapshot: (snapshot: {
    id?: string;
    projectTitle?: string;
    aspectRatio?: AspectRatioKey;
    activeThemeId?: string;
    themeOverride?: any;
    branding?: GlobalBranding;
    scriptText?: string;
    slides?: Slide[];
    activeSlideIndex?: number;
  }) => void;

  // Collaborative In-Canvas Comments (Figma-Style)
  comments: CanvasComment[];
  activeCommentId: string | null;
  isCommentMode: boolean;
  showResolvedComments: boolean;
  setCommentMode: (active: boolean) => void;
  setActiveCommentId: (id: string | null) => void;
  toggleShowResolvedComments: () => void;
  addComment: (comment: Omit<CanvasComment, 'id' | 'createdAt' | 'isResolved' | 'replies'>) => CanvasComment;
  addCommentReply: (commentId: string, reply: Omit<CanvasCommentReply, 'id' | 'createdAt'>) => void;
  toggleResolveComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;
  syncRemoteComments: (comments: CanvasComment[]) => void;

  // UI controls
  setActiveView: (view: StudioViewMode) => void;
  setCanvasZoom: (zoom: number) => void;
  setWorkspaceDarkMode: (dark: boolean) => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setActiveLeftTab: (tab: LeftSidebarTab) => void;
  setActiveModal: (modal: StudioModalType) => void;
  setExportState: (isExporting: boolean, progress?: string | null) => void;

  // Settings, Hotkeys, Admin & Cloud Master Templates actions
  updateSettings: (partial: Partial<StudioGeneralSettings>) => void;
  updateHotkey: (key: keyof StudioHotkeys, combo: string) => void;
  resetSettingsToDefault: () => void;
  setAdminAuthenticated: (auth: boolean) => void;
  setCloudMasterTemplates: (list: CloudTemplateRecord[]) => void;
}

function cloneSlides(slides: Slide[]): Slide[] {
  return JSON.parse(JSON.stringify(slides));
}

function snapshotCurrentActiveDoc(state: StudioState): OpenDocumentTab {
  return {
    id: state.projectId,
    projectTitle: state.projectTitle,
    aspectRatio: state.aspectRatio,
    activeThemeId: state.activeThemeId,
    themeOverride: { ...state.themeOverride },
    branding: { ...state.branding },
    scriptText: state.scriptText,
    slides: cloneSlides(state.slides),
    activeSlideIndex: state.activeSlideIndex,
    canvasZoom: state.canvasZoom,
    lastSavedAt: state.lastSavedAt,
    past: state.past,
    future: state.future,
  };
}

function upsertOpenDocumentList(
  state: StudioState,
  nextDoc: OpenDocumentTab,
  openInNewTab: boolean
): OpenDocumentTab[] {
  if (!state.openDocuments || state.openDocuments.length === 0) {
    return [nextDoc];
  }

  // First sync the currently active document into the existing list
  const currentSnap = snapshotCurrentActiveDoc(state);
  const syncedList = state.openDocuments.map((doc) =>
    doc.id === state.activeDocumentId ? currentSnap : doc
  );

  // If nextDoc's id already exists in syncedList, update it in place
  if (syncedList.some((d) => d.id === nextDoc.id)) {
    return syncedList.map((d) => (d.id === nextDoc.id ? nextDoc : d));
  }

  if (openInNewTab) {
    return [...syncedList, nextDoc];
  }

  // Replace current active document tab in-place
  return syncedList.map((d) =>
    d.id === state.activeDocumentId ? nextDoc : d
  );
}

let broadcastCanvasTimer: any = null;
function broadcastCurrentCanvasStateDebounced(state: StudioState) {
  if (broadcastCanvasTimer) clearTimeout(broadcastCanvasTimer);
  broadcastCanvasTimer = setTimeout(() => {
    if (!state.slides || state.slides.length === 0) return;
    multiplayerService.broadcastCanvasState({
      projectId: state.projectId,
      projectTitle: state.projectTitle || 'Untitled Carousel Project',
      aspectRatio: state.aspectRatio,
      activeThemeId: state.activeThemeId,
      themeOverride: state.themeOverride,
      branding: state.branding,
      scriptText: state.scriptText,
      slides: state.slides,
      activeSlideIndex: state.activeSlideIndex,
    });
  }, 120);
}

let autoSaveProjectTimer: any = null;
function autoSaveWorkingProjectDebounced(state: StudioState) {
  if (autoSaveProjectTimer) clearTimeout(autoSaveProjectTimer);
  autoSaveProjectTimer = setTimeout(() => {
    if (!state.slides || state.slides.length === 0) return;
    saveActiveWorkingProjectToStorage({
      projectId: state.projectId,
      projectTitle: state.projectTitle || 'Untitled Carousel Project',
      aspectRatio: state.aspectRatio,
      activeThemeId: state.activeThemeId,
      themeOverride: state.themeOverride,
      branding: state.branding,
      scriptText: state.scriptText,
      slides: state.slides,
      activeSlideIndex: state.activeSlideIndex,
      openDocuments: state.openDocuments,
      activeDocumentId: state.activeDocumentId,
      comments: state.comments,
    });
  }, 150);
}

const savedWorkingDoc = loadSavedWorkingProjectFromStorage();

export const useStudioStore = create<StudioState>((set, get) => ({
  projectId: savedWorkingDoc?.projectId || '',
  projectTitle: savedWorkingDoc?.projectTitle || 'Untitled Carousel Project',
  aspectRatio: savedWorkingDoc?.aspectRatio || '4:5',
  activeThemeId: savedWorkingDoc?.activeThemeId || THEME_PALETTES[0].id,
  themeOverride: savedWorkingDoc?.themeOverride || {},
  branding: savedWorkingDoc?.branding || DEFAULT_BRANDING,
  scriptText: savedWorkingDoc?.scriptText || '',
  slides: savedWorkingDoc?.slides || [],
  activeSlideIndex: savedWorkingDoc?.activeSlideIndex || 0,
  selectedElementId: null,
  lastSavedAt: null,

  // Collaborative Comments
  comments: savedWorkingDoc?.comments || [],
  activeCommentId: null,
  isCommentMode: false,
  showResolvedComments: false,

  setCommentMode: (isCommentMode) => set({ isCommentMode }),
  setActiveCommentId: (activeCommentId) => set({ activeCommentId }),
  toggleShowResolvedComments: () =>
    set((state) => ({ showResolvedComments: !state.showResolvedComments })),

  addComment: (input) => {
    const id = `comment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newComment: CanvasComment = {
      ...input,
      id,
      createdAt: new Date().toISOString(),
      isResolved: false,
      replies: [],
    };
    const nextComments = [...get().comments, newComment];
    set({
      comments: nextComments,
      activeCommentId: id,
    });
    multiplayerService.broadcastComments(nextComments);
    autoSaveWorkingProjectDebounced(get());
    return newComment;
  },

  addCommentReply: (commentId, replyInput) => {
    const replyId = `reply-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newReply: CanvasCommentReply = {
      ...replyInput,
      id: replyId,
      createdAt: new Date().toISOString(),
    };
    const nextComments = get().comments.map((c) =>
      c.id === commentId
        ? { ...c, replies: [...(c.replies || []), newReply] }
        : c
    );
    set({ comments: nextComments });
    multiplayerService.broadcastComments(nextComments);
    autoSaveWorkingProjectDebounced(get());
  },

  toggleResolveComment: (commentId) => {
    const nextComments = get().comments.map((c) =>
      c.id === commentId ? { ...c, isResolved: !c.isResolved } : c
    );
    set({ comments: nextComments });
    multiplayerService.broadcastComments(nextComments);
    autoSaveWorkingProjectDebounced(get());
  },

  deleteComment: (commentId) => {
    const nextComments = get().comments.filter((c) => c.id !== commentId);
    set({
      comments: nextComments,
      activeCommentId: get().activeCommentId === commentId ? null : get().activeCommentId,
    });
    multiplayerService.broadcastComments(nextComments);
    autoSaveWorkingProjectDebounced(get());
  },

  syncRemoteComments: (comments) => {
    if (!Array.isArray(comments)) return;
    set({ comments });
    autoSaveWorkingProjectDebounced(get());
  },

  openDocuments:
    savedWorkingDoc?.openDocuments && savedWorkingDoc.openDocuments.length > 0
      ? savedWorkingDoc.openDocuments
      : savedWorkingDoc?.slides && savedWorkingDoc.slides.length > 0
      ? [
          {
            id: savedWorkingDoc.projectId || 'doc-default',
            projectTitle: savedWorkingDoc.projectTitle || 'Untitled Carousel Project',
            aspectRatio: savedWorkingDoc.aspectRatio,
            activeThemeId: savedWorkingDoc.activeThemeId,
            themeOverride: savedWorkingDoc.themeOverride || {},
            branding: savedWorkingDoc.branding,
            scriptText: savedWorkingDoc.scriptText,
            slides: cloneSlides(savedWorkingDoc.slides),
            activeSlideIndex: savedWorkingDoc.activeSlideIndex || 0,
            canvasZoom: 0.9,
            lastSavedAt: null,
            past: [],
            future: [],
          },
        ]
      : [],
  activeDocumentId: savedWorkingDoc?.activeDocumentId || savedWorkingDoc?.projectId || '',

  settings: loadSavedStudioSettings(),
  isAdminAuthenticated: loadSavedAdminAuth(),
  cloudMasterTemplates: getCachedCloudMasterTemplates(),

  customFonts: loadSavedCustomFonts(),

  activeView: getInitialActiveView(),
  canvasZoom: 0.9,
  workspaceDarkMode: false,
  leftSidebarOpen: true,
  activeLeftTab: 'elements',
  activeModal: null,
  isExporting: false,
  exportProgress: null,

  past: [],
  future: [],

  getActiveTheme: () => {
    const state = get();
    const base =
      THEME_PALETTES.find((t) => t.id === state.activeThemeId) ||
      THEME_PALETTES[0];
    return {
      ...base,
      ...state.themeOverride,
    };
  },

  getActiveSlide: () => {
    const state = get();
    return state.slides[state.activeSlideIndex] || state.slides[0];
  },

  getSelectedElement: () => {
    const state = get();
    const slide = state.slides[state.activeSlideIndex];
    if (!slide || !state.selectedElementId) return null;
    return slide.elements.find((e) => e.id === state.selectedElementId) || null;
  },

  switchDocumentTab: (docId) => {
    saveActiveView('editor');
    const state = get();
    if (docId === state.activeDocumentId) {
      set({ activeView: 'editor' });
      return;
    }

    // Save current active document state into openDocuments first
    const currentSnap = snapshotCurrentActiveDoc(state);
    const updatedList = state.openDocuments.map((doc) =>
      doc.id === state.activeDocumentId ? currentSnap : doc
    );

    const target = updatedList.find((doc) => doc.id === docId);
    if (!target) return;

    set({
      openDocuments: updatedList,
      activeDocumentId: target.id,
      projectId: target.id,
      projectTitle: target.projectTitle,
      aspectRatio: target.aspectRatio,
      activeThemeId: target.activeThemeId,
      themeOverride: { ...target.themeOverride },
      branding: { ...target.branding },
      scriptText: target.scriptText,
      slides: cloneSlides(target.slides),
      activeSlideIndex: Math.min(
        target.activeSlideIndex,
        Math.max(0, target.slides.length - 1)
      ),
      canvasZoom: target.canvasZoom,
      lastSavedAt: target.lastSavedAt,
      past: target.past,
      future: target.future,
      selectedElementId: null,
      activeView: 'editor',
    });
  },

  closeDocumentTab: (docId) => {
    const state = get();
    if (state.openDocuments.length <= 1) return;

    // First sync current active doc
    const currentSnap = snapshotCurrentActiveDoc(state);
    const syncedList = state.openDocuments.map((doc) =>
      doc.id === state.activeDocumentId ? currentSnap : doc
    );

    const targetIdx = syncedList.findIndex((doc) => doc.id === docId);
    if (targetIdx === -1) return;

    const remaining = syncedList.filter((doc) => doc.id !== docId);

    // If closing a background tab, just update openDocuments
    if (docId !== state.activeDocumentId) {
      set({ openDocuments: remaining });
      return;
    }

    // Otherwise activate neighbor tab
    const nextActive =
      remaining[Math.min(targetIdx, remaining.length - 1)] || remaining[0];

    set({
      openDocuments: remaining,
      activeDocumentId: nextActive.id,
      projectId: nextActive.id,
      projectTitle: nextActive.projectTitle,
      aspectRatio: nextActive.aspectRatio,
      activeThemeId: nextActive.activeThemeId,
      themeOverride: { ...nextActive.themeOverride },
      branding: { ...nextActive.branding },
      scriptText: nextActive.scriptText,
      slides: cloneSlides(nextActive.slides),
      activeSlideIndex: Math.min(
        nextActive.activeSlideIndex,
        Math.max(0, nextActive.slides.length - 1)
      ),
      canvasZoom: nextActive.canvasZoom,
      lastSavedAt: nextActive.lastSavedAt,
      past: nextActive.past,
      future: nextActive.future,
      selectedElementId: null,
    });
  },

  openBlankDocumentTab: (ratio = '4:5') => {
    const state = get();
    const targetTheme = state.getActiveTheme();
    const tabNumber = state.openDocuments.length + 1;
    const newId = `doc-${Date.now().toString(36).slice(-5)}`;
    const newTitle = `Dokumen ${String(tabNumber).padStart(2, '0')}`;

    const blankSlide: Slide = {
      id: `slide-1`,
      layout: 'blank',
      elements: [],
      backgroundColor: '#ffffff',
    };

    const suggestedZoom =
      ratio === '9:16' ? 0.7 : ratio === '4:5' ? 0.9 : 0.95;

    const newDocTab: OpenDocumentTab = {
      id: newId,
      projectTitle: newTitle,
      aspectRatio: ratio,
      activeThemeId: targetTheme.id,
      themeOverride: {},
      branding: { ...state.branding },
      scriptText: '',
      slides: [blankSlide],
      activeSlideIndex: 0,
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
    };

    const nextOpenDocs = upsertOpenDocumentList(state, newDocTab, true);

    set({
      openDocuments: nextOpenDocs,
      activeDocumentId: newId,
      projectId: newId,
      projectTitle: newTitle,
      aspectRatio: ratio,
      activeThemeId: targetTheme.id,
      themeOverride: {},
      slides: [blankSlide],
      activeSlideIndex: 0,
      selectedElementId: null,
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
      activeView: 'editor',
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  addCustomFont: (font) => {
    injectFontStyleIntoDocument(font);
    const existing = get().customFonts.filter(
      (f) => f.family.toLowerCase() !== font.family.toLowerCase()
    );
    const next = [font, ...existing];
    saveCustomFontsToStorage(next);
    set({ customFonts: next });
  },

  addBatchLocalFonts: (families) => {
    const current = get().customFonts;
    const currentSet = new Set(current.map((f) => f.family.toLowerCase()));
    const added: CustomFontRecord[] = [];

    for (const fam of families) {
      const clean = fam.trim();
      if (!clean || currentSet.has(clean.toLowerCase())) continue;
      const rec: CustomFontRecord = {
        family: clean,
        category: 'Local Computer',
        source: 'local-system',
      };
      injectFontStyleIntoDocument(rec);
      added.push(rec);
      currentSet.add(clean.toLowerCase());
    }

    if (added.length > 0) {
      const next = [...added, ...current];
      saveCustomFontsToStorage(next);
      set({ customFonts: next });
    }
  },

  removeCustomFont: (family) => {
    const next = get().customFonts.filter(
      (f) => f.family.toLowerCase() !== family.toLowerCase()
    );
    saveCustomFontsToStorage(next);
    set({ customFonts: next });
  },

  saveCurrentProjectToVault: async (options) => {
    const state = get();
    if (!state.projectId && state.slides.length === 0) {
      return { mode: 'local', warning: 'Belum ada dokumen yang dibuka' };
    }
    const titleToUse = options?.customTitle?.trim() || state.projectTitle || 'Dokumen Carousel';
    const idToUse = options?.asNewCopy
      ? `proj-${Date.now().toString(36)}`
      : state.projectId ||
        titleToUse.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
        `proj-${Date.now().toString(36)}`;

    const desc =
      options?.description ||
      `${state.slides.length} slides · ${state.aspectRatio} · ${
        state.getActiveTheme().name
      }`;

    const res = await upsertTemplate({
      id: idToUse,
      name: titleToUse,
      description: desc,
      aspectRatio: state.aspectRatio,
      themeId: state.activeThemeId,
      branding: state.branding,
      scriptText: state.scriptText,
      slides: cloneSlides(state.slides),
    });

    const savedTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedDocs = state.openDocuments.map((d) =>
      d.id === state.activeDocumentId
        ? {
            ...snapshotCurrentActiveDoc(state),
            id: idToUse,
            projectTitle: titleToUse,
            lastSavedAt: savedTime,
          }
        : d
    );

    set({
      projectId: idToUse,
      activeDocumentId: idToUse,
      projectTitle: titleToUse,
      lastSavedAt: savedTime,
      openDocuments: updatedDocs,
    });

    // Save snapshot revision in Team Version History
    try {
      const myIdentity = multiplayerService.getMyIdentity();
      saveProjectVersionSnapshot({
        projectId: idToUse,
        projectTitle: titleToUse,
        versionName: options?.customTitle || `Simpan ${savedTime}`,
        authorId: myIdentity.userId,
        authorName: myIdentity.name,
        authorAvatarColor: myIdentity.avatarColor,
        slideCount: state.slides.length,
        slides: cloneSlides(state.slides),
        aspectRatio: state.aspectRatio,
        activeThemeId: state.activeThemeId,
        branding: { ...state.branding },
        scriptText: state.scriptText,
      });
    } catch {
      // ignore
    }

    return { mode: res.mode, warning: res.warning };
  },

  restoreVersionSnapshot: (snapshot) => {
    set({
      slides: cloneSlides(snapshot.slides),
      aspectRatio: snapshot.aspectRatio,
      activeThemeId: snapshot.activeThemeId,
      branding: { ...snapshot.branding },
      scriptText: snapshot.scriptText || '',
      projectTitle: snapshot.projectTitle || get().projectTitle,
      activeSlideIndex: 0,
      selectedElementId: null,
      past: [],
      future: [],
    });

    // Auto-save working project
    autoSaveWorkingProjectDebounced(get());

    // Broadcast restored state to all peers in the collaboration room
    multiplayerService.broadcastCanvasState({
      projectId: snapshot.projectId,
      projectTitle: snapshot.projectTitle || get().projectTitle,
      aspectRatio: snapshot.aspectRatio,
      activeThemeId: snapshot.activeThemeId,
      themeOverride: get().themeOverride,
      branding: snapshot.branding,
      scriptText: snapshot.scriptText || '',
      slides: snapshot.slides,
      activeSlideIndex: 0,
    });
  },

  applyCuratedGalleryTemplate: async (
    template,
    saveCurrentFirst = true,
    openInNewTab = true
  ) => {
    const state = get();
    if (saveCurrentFirst) {
      await state.saveCurrentProjectToVault();
    }

    const latestState = get();
    const targetTheme =
      THEME_PALETTES.find((t) => t.id === template.themeId) ||
      THEME_PALETTES[0];
    const parsed = parseScriptToStructuredSlides(template.scriptText);
    const builtSlides = parsed.map((item, idx) =>
      buildSlideFromParsedScript(item, idx, targetTheme, template.aspectRatio)
    );

    const suggestedZoom =
      template.aspectRatio === '9:16'
        ? 0.7
        : template.aspectRatio === '4:5'
        ? 0.9
        : 0.95;

    const newId = `proj-${template.id}-${Date.now().toString(36).slice(-4)}`;
    const newDocTab: OpenDocumentTab = {
      id: newId,
      projectTitle: template.title,
      aspectRatio: template.aspectRatio,
      activeThemeId: template.themeId,
      themeOverride: {},
      branding: { ...template.branding },
      scriptText: template.scriptText,
      slides: cloneSlides(builtSlides),
      activeSlideIndex: 0,
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
    };

    const nextOpenDocs = upsertOpenDocumentList(
      latestState,
      newDocTab,
      openInNewTab
    );

    set({
      openDocuments: nextOpenDocs,
      activeDocumentId: newId,
      projectId: newId,
      projectTitle: template.title,
      aspectRatio: template.aspectRatio,
      activeThemeId: template.themeId,
      themeOverride: {},
      branding: { ...template.branding },
      scriptText: template.scriptText,
      slides: builtSlides,
      activeSlideIndex: 0,
      selectedElementId: null,
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
      activeView: 'editor',
    });
    saveActiveView('editor');
    broadcastCurrentCanvasStateDebounced(get());
  },

  createNewProject: async (options) => {
    const state = get();
    if (options.saveCurrentFirst) {
      await state.saveCurrentProjectToVault();
    }

    const latestState = get();
    const openInNewTab = options.openInNewTab ?? true;

    const targetTheme =
      THEME_PALETTES.find((t) => t.id === options.themeId) ||
      THEME_PALETTES[0];

    const layoutRotation: LayoutPresetId[] =
      options.themeId === 'aesthetic-typo' || options.initialLayout.startsWith('typo-')
        ? [
            'typo-untold-story',
            'typo-playful-arch',
            'typo-brush-satire',
            'typo-cinematic-indie',
            'typo-split-journal',
          ]
        : options.themeId === 'media-redaksi' || options.initialLayout.startsWith('media-')
        ? [
            'media-breaking-cover',
            'media-stat-card',
            'media-quote-split',
            'media-timeline-list',
            'media-outro-cta',
          ]
        : options.themeId === 'minimalist-mono' || options.initialLayout.startsWith('minimal-')
        ? [
            'minimal-bold-cover',
            'minimal-quote-focus',
            'minimal-photo-frame',
            'minimal-numbered-list',
            'minimal-quote-focus',
          ]
        : options.themeId === 'playful-pop' || options.initialLayout.startsWith('playful-')
        ? [
            'playful-hero-cover',
            'playful-card-step',
            'playful-dual-cards',
            'playful-bento-fun',
            'playful-outro-cta',
          ]
        : [
            options.initialLayout,
            'editorial-dropcap',
            'top-photo-bottom-split',
            'split-vertical-collage',
            'full-bleed-bottom-story',
            'editorial-bento-grid',
          ];

    const count = Math.max(1, Math.min(12, options.slideCount || 1));
    const titleClean = options.title.trim() || 'Untitled Editorial Story';

    const builtSlides: Slide[] =
      options.initialLayout === 'blank'
        ? Array.from({ length: count }).map((_, idx) => ({
            id: `slide-${idx + 1}-${Date.now().toString(36).slice(-4)}`,
            layout: 'blank',
            elements: [],
            backgroundColor: '#ffffff',
          }))
        : Array.from({ length: count }).map((_, idx) => {
            const layout =
              idx === 0
                ? options.initialLayout
                : layoutRotation[idx % layoutRotation.length];
            if (layout.startsWith('typo-')) {
              return buildSlideFromParsedScript(
                { layout },
                idx,
                targetTheme,
                options.aspectRatio
              );
            }
            return buildSlideFromParsedScript(
              {
                layout,
                header: `${titleClean.toUpperCase()} — SLIDE 0${idx + 1}`,
                kicker: idx === 0 ? 'EDITORIAL ISSUE' : `CHAPTER 0${idx}`,
                title:
                  idx === 0
                    ? `${titleClean.split(' ').slice(0, 2).join(' ')} *${
                        titleClean.split(' ').slice(2).join(' ') || 'Edition'
                      }*`
                    : `Quiet *Moments* 0${idx}`,
                lead: '*A curated visual essay crafted with unhurried typography and spatial balance.*',
                body: '[W]e begin with light and proportion. Every frame invites the reader to pause and observe the subtle textures of the story.',
                caption: '*Editorial studio notes · Archive series.*',
              },
              idx,
              targetTheme,
              options.aspectRatio
            );
          });

    const suggestedZoom =
      options.aspectRatio === '9:16'
        ? 0.7
        : options.aspectRatio === '4:5'
        ? 0.9
        : 0.95;

    const newId = `proj-${Date.now().toString(36)}`;
    const newDocTab: OpenDocumentTab = {
      id: newId,
      projectTitle: titleClean,
      aspectRatio: options.aspectRatio,
      activeThemeId: targetTheme.id,
      themeOverride: {},
      branding: {
        ...latestState.branding,
        showSlideNumbers: !options.initialLayout.startsWith('typo-'),
        showFooterBar: !options.initialLayout.startsWith('typo-'),
      },
      scriptText: DEFAULT_SCRIPT,
      slides: cloneSlides(builtSlides),
      activeSlideIndex: 0,
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
    };

    const nextOpenDocs = upsertOpenDocumentList(
      latestState,
      newDocTab,
      openInNewTab
    );

    set({
      openDocuments: nextOpenDocs,
      activeDocumentId: newId,
      projectId: newId,
      projectTitle: titleClean,
      aspectRatio: options.aspectRatio,
      activeThemeId: targetTheme.id,
      themeOverride: {},
      slides: builtSlides,
      activeSlideIndex: 0,
      selectedElementId: null,
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
      activeView: 'editor',
    });
    saveActiveView('editor');
    broadcastCurrentCanvasStateDebounced(get());
  },

  pushHistory: () => {
    const state = get();
    const snapshot: HistorySnapshot = {
      slides: cloneSlides(state.slides),
      activeSlideIndex: state.activeSlideIndex,
      aspectRatio: state.aspectRatio,
      activeThemeId: state.activeThemeId,
      themeOverride: { ...state.themeOverride },
      branding: { ...state.branding },
    };
    set({
      past: [...state.past.slice(-29), snapshot],
      future: [],
    });
  },

  undo: () => {
    const {
      past,
      future,
      slides,
      activeSlideIndex,
      aspectRatio,
      activeThemeId,
      themeOverride,
      branding,
    } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const currentSnapshot: HistorySnapshot = {
      slides: cloneSlides(slides),
      activeSlideIndex,
      aspectRatio,
      activeThemeId,
      themeOverride: { ...themeOverride },
      branding: { ...branding },
    };
    set({
      slides: previous.slides,
      activeSlideIndex: Math.min(
        previous.activeSlideIndex,
        previous.slides.length - 1
      ),
      aspectRatio: previous.aspectRatio,
      activeThemeId: previous.activeThemeId,
      themeOverride: previous.themeOverride,
      branding: previous.branding,
      past: past.slice(0, -1),
      future: [currentSnapshot, ...future.slice(0, 29)],
      selectedElementId: null,
    });
  },

  redo: () => {
    const {
      past,
      future,
      slides,
      activeSlideIndex,
      aspectRatio,
      activeThemeId,
      themeOverride,
      branding,
    } = get();
    if (future.length === 0) return;
    const next = future[0];
    const currentSnapshot: HistorySnapshot = {
      slides: cloneSlides(slides),
      activeSlideIndex,
      aspectRatio,
      activeThemeId,
      themeOverride: { ...themeOverride },
      branding: { ...branding },
    };
    set({
      slides: next.slides,
      activeSlideIndex: Math.min(next.activeSlideIndex, next.slides.length - 1),
      aspectRatio: next.aspectRatio,
      activeThemeId: next.activeThemeId,
      themeOverride: next.themeOverride,
      branding: next.branding,
      past: [...past, currentSnapshot],
      future: future.slice(1),
      selectedElementId: null,
    });
  },

  setProjectTitle: (projectTitle) => {
    set((state) => ({
      projectTitle,
      openDocuments: state.openDocuments.map((doc) =>
        doc.id === state.activeDocumentId ? { ...doc, projectTitle } : doc
      ),
    }));
    broadcastCurrentCanvasStateDebounced(get());
  },

  setAspectRatio: (newRatio) => {
    const state = get();
    if (state.aspectRatio === newRatio) return;
    state.pushHistory();

    const oldDim = ASPECT_RATIOS[state.aspectRatio];
    const newDim = ASPECT_RATIOS[newRatio];
    const scaleY = newDim.stageHeight / oldDim.stageHeight;
    const scaleX = newDim.stageWidth / oldDim.stageWidth;

    const updatedSlides = state.slides.map((slide) => {
      const scaledElements = slide.elements.map((el) => {
        if (
          el.type === 'image' &&
          el.width >= oldDim.stageWidth - 4 &&
          el.height >= oldDim.stageHeight - 4
        ) {
          return {
            ...el,
            x: 0,
            y: 0,
            width: newDim.stageWidth,
            height: newDim.stageHeight,
          };
        }
        return {
          ...el,
          x: Math.round(el.x * scaleX),
          y: Math.round(el.y * scaleY),
          width: Math.round(el.width * scaleX),
          height:
            el.type === 'image'
              ? Math.max(40, Math.round(el.height * scaleY))
              : el.type === 'divider' && el.orientation === 'vertical'
              ? Math.max(20, Math.round(el.height * scaleY))
              : el.height,
        };
      });
      return {
        ...slide,
        elements: scaledElements,
      };
    });

    const suggestedZoom =
      newRatio === '9:16'
        ? Math.min(state.canvasZoom, 0.72)
        : newRatio === '4:5'
        ? Math.max(state.canvasZoom, 0.88)
        : 0.95;

    set({
      aspectRatio: newRatio,
      slides: updatedSlides,
      canvasZoom: suggestedZoom,
      openDocuments: state.openDocuments.map((doc) =>
        doc.id === state.activeDocumentId
          ? { ...doc, aspectRatio: newRatio, slides: cloneSlides(updatedSlides), canvasZoom: suggestedZoom }
          : doc
      ),
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  setActiveTheme: (themeId) => {
    const state = get();
    const newTheme =
      THEME_PALETTES.find((t) => t.id === themeId) || THEME_PALETTES[0];
    const prevTheme = state.getActiveTheme();
    state.pushHistory();

    const updatedSlides = state.slides.map((slide) => {
      const isDarkSlide =
        slide.layout === 'cover-overlay' ||
        slide.layout === 'full-bleed-bottom-story' ||
        slide.layout === 'media-outro-cta' ||
        slide.layout === 'playful-outro-cta' ||
        slide.layout.startsWith('typo-') ||
        slide.backgroundColor.toLowerCase() ===
          prevTheme.darkBackground.toLowerCase();

      const nextBg = isDarkSlide
        ? newTheme.darkBackground
        : newTheme.background;

      const updatedElements = slide.elements.map((el) => {
        if (el.type === 'divider') {
          const isAccent =
            el.color.toLowerCase() === prevTheme.accent.toLowerCase();
          return {
            ...el,
            color: isDarkSlide
              ? 'rgba(247, 244, 238, 0.35)'
              : isAccent
              ? newTheme.accent
              : newTheme.divider,
          };
        }
        if (el.type === 'text' || el.type === 'badge') {
          let nextColor = el.color;
          if (!isDarkSlide) {
            if (el.role === 'kicker') nextColor = newTheme.accent;
            else if (
              el.role === 'header' ||
              el.role === 'caption' ||
              el.role === 'lead'
            ) {
              nextColor = newTheme.textSecondary;
            } else {
              nextColor = newTheme.textPrimary;
            }
          } else {
            nextColor =
              el.role === 'title'
                ? newTheme.textOnDark
                : 'rgba(247, 244, 238, 0.88)';
          }

          const nextFont =
            el.role === 'title'
              ? newTheme.headingFont
              : el.role === 'body' ||
                el.role === 'lead' ||
                el.role === 'caption'
              ? newTheme.bodyFont
              : newTheme.sansFont;

          return {
            ...el,
            color: nextColor,
            dropCapColor: newTheme.accent,
            fontFamily: nextFont,
          };
        }
        return el;
      });

      return {
        ...slide,
        backgroundColor: nextBg,
        elements: updatedElements,
      };
    });

    set({
      activeThemeId: themeId,
      themeOverride: {},
      slides: updatedSlides,
    });
  },

  updateThemeColors: (partial) => {
    const state = get();
    state.pushHistory();
    const mergedOverride = { ...state.themeOverride, ...partial };
    set({ themeOverride: mergedOverride });

    const activeTheme = get().getActiveTheme();
    const updatedSlides = state.slides.map((slide) => {
      const isDark =
        slide.layout === 'cover-overlay' ||
        slide.layout === 'full-bleed-bottom-story' ||
        slide.layout === 'media-outro-cta' ||
        slide.layout === 'playful-outro-cta' ||
        slide.layout.startsWith('typo-');
      return {
        ...slide,
        backgroundColor: isDark
          ? activeTheme.darkBackground
          : partial.background || slide.backgroundColor,
        elements: slide.elements.map((el) => {
          if ((el.type === 'text' || el.type === 'badge') && partial.accent) {
            return {
              ...el,
              dropCapColor: partial.accent,
              color:
                el.role === 'kicker' && !isDark ? partial.accent : el.color,
            };
          }
          if (
            (el.type === 'text' || el.type === 'badge') &&
            partial.textPrimary &&
            !isDark
          ) {
            if (el.role === 'title' || el.role === 'body') {
              return { ...el, color: partial.textPrimary };
            }
          }
          return el;
        }),
      };
    });

    set({ slides: updatedSlides });
  },

  updateBranding: (partial) => {
    set((state) => ({
      branding: { ...state.branding, ...partial },
    }));
    broadcastCurrentCanvasStateDebounced(get());
  },

  setScriptText: (scriptText) => set({ scriptText }),

  generateSlidesFromScript: (
    scriptOverride,
    preservePhotos = true,
    layoutOverride,
    applyOverrideToAll = false
  ) => {
    const state = get();
    state.pushHistory();
    const textToParse =
      typeof scriptOverride === 'string' ? scriptOverride : state.scriptText;
    const theme = state.getActiveTheme();
    const parsedList = parseScriptToStructuredSlides(textToParse);

    if (parsedList.length === 0) return;

    const newSlides = parsedList.map((parsed, idx) => {
      if (layoutOverride && layoutOverride !== 'blank') {
        if (applyOverrideToAll) {
          parsed.layout = layoutOverride;
        } else {
          // Smart variation:
          if (idx === 0) {
            parsed.layout = layoutOverride;
          } else if (idx === parsedList.length - 1 && parsedList.length > 2) {
            parsed.layout = layoutOverride.startsWith('media-')
              ? 'media-outro-cta'
              : layoutOverride.startsWith('playful-')
              ? 'playful-outro-cta'
              : 'full-bleed-bottom-story';
          } else {
            parsed.layout = layoutOverride;
          }
        }
      }

      const existingSlide = state.slides[idx];
      const existingImages =
        preservePhotos && existingSlide
          ? (existingSlide.elements.filter(
              (e) => e.type === 'image'
            ) as ImageCanvasElement[])
          : undefined;

      return buildSlideFromParsedScript(
        parsed,
        idx,
        theme,
        state.aspectRatio,
        existingImages
      );
    });

    let updatedScriptText = textToParse;
    if (layoutOverride && applyOverrideToAll && layoutOverride !== 'blank') {
      updatedScriptText = textToParse.replace(
        /^---\s*\[layout:\s*[a-z0-9-]+\s*\]/gim,
        `--- [layout: ${layoutOverride}]`
      );
    }

    set({
      scriptText: updatedScriptText,
      slides: newSlides,
      activeSlideIndex: Math.min(state.activeSlideIndex, newSlides.length - 1),
      selectedElementId: null,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  setActiveSlideIndex: (index) => {
    const { slides } = get();
    if (index < 0 || index >= slides.length) return;
    set({ activeSlideIndex: index, selectedElementId: null });
  },

  setSelectedElementId: (id) => set({ selectedElementId: id }),

  addSlide: (layout?: LayoutPresetId) => {
    const state = get();
    state.pushHistory();
    const newId = `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newSlide: Slide = {
      id: newId,
      layout: layout || 'blank',
      elements: [],
      backgroundColor: '#ffffff',
    };
    const nextSlides = [...state.slides, newSlide];
    set({
      slides: nextSlides,
      activeSlideIndex: nextSlides.length - 1,
      selectedElementId: null,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  duplicateSlide: (index) => {
    const state = get();
    const target = state.slides[index];
    if (!target) return;
    state.pushHistory();

    const suffix = Math.random().toString(36).slice(2, 6);
    const cloned: Slide = {
      ...JSON.parse(JSON.stringify(target)),
      id: `slide-copy-${suffix}`,
      elements: target.elements.map((el) => ({
        ...JSON.parse(JSON.stringify(el)),
        id: `${el.id}-copy-${suffix}`,
      })),
    };

    const nextSlides = [...state.slides];
    nextSlides.splice(index + 1, 0, cloned);
    set({
      slides: nextSlides,
      activeSlideIndex: index + 1,
      selectedElementId: null,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  deleteSlide: (index) => {
    const state = get();
    if (state.slides.length <= 1) return;
    state.pushHistory();
    const nextSlides = state.slides.filter((_, idx) => idx !== index);
    set({
      slides: nextSlides,
      activeSlideIndex: Math.max(
        0,
        Math.min(state.activeSlideIndex, nextSlides.length - 1)
      ),
      selectedElementId: null,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  reorderSlide: (fromIndex, direction) => {
    const state = get();
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= state.slides.length) return;
    state.pushHistory();

    const nextSlides = [...state.slides];
    const [moved] = nextSlides.splice(fromIndex, 1);
    nextSlides.splice(toIndex, 0, moved);
    set({
      slides: nextSlides,
      activeSlideIndex: toIndex,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  applyLayoutToSlide: (slideIndex, layout) => {
    const state = get();
    const targetSlide = state.slides[slideIndex];
    if (!targetSlide) return;
    state.pushHistory();

    const theme = state.getActiveTheme();
    const extracted = {
      ...extractParsedScriptFromSlide(targetSlide),
      layout,
    };

    const existingImages = targetSlide.elements.filter(
      (e) => e.type === 'image'
    ) as ImageCanvasElement[];

    const rebuilt = buildSlideFromParsedScript(
      extracted,
      slideIndex,
      theme,
      state.aspectRatio,
      existingImages.length > 0 ? existingImages : undefined
    );

    const nextSlides = [...state.slides];
    nextSlides[slideIndex] = rebuilt;
    set({
      slides: nextSlides,
      selectedElementId: null,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  applyLayoutToAllSlides: (layout) => {
    const state = get();
    if (state.slides.length === 0) return;
    state.pushHistory();

    const theme = state.getActiveTheme();
    const nextSlides = state.slides.map((targetSlide, slideIndex) => {
      const extracted = {
        ...extractParsedScriptFromSlide(targetSlide),
        layout,
      };

      const existingImages = targetSlide.elements.filter(
        (e) => e.type === 'image'
      ) as ImageCanvasElement[];

      return buildSlideFromParsedScript(
        extracted,
        slideIndex,
        theme,
        state.aspectRatio,
        existingImages.length > 0 ? existingImages : undefined
      );
    });

    const updatedScriptText = state.scriptText.replace(
      /^---\s*\[layout:\s*[a-z0-9-]+\s*\]/gim,
      `--- [layout: ${layout}]`
    );

    set({
      slides: nextSlides,
      scriptText: updatedScriptText,
      selectedElementId: null,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  setSlideBackgroundColor: (slideIndex, color) => {
    const state = get();
    state.pushHistory();
    const nextSlides = state.slides.map((s, idx) =>
      idx === slideIndex ? { ...s, backgroundColor: color } : s
    );
    set({ slides: nextSlides });
    broadcastCurrentCanvasStateDebounced(get());
  },

  applyFontCombination: (preset, mode = 'insert') => {
    const state = get();
    const slide = state.getActiveSlide();
    if (!slide) return;
    state.pushHistory();

    const dim = ASPECT_RATIOS[state.aspectRatio];
    const centerX = Math.round(dim.stageWidth / 2);
    const centerY = Math.round(dim.stageHeight / 2);

    const baseZ =
      mode === 'blank'
        ? 1
        : slide.elements.reduce((m, e) => Math.max(m, e.zIndex), 0) + 1;

    const newElements: TextCanvasElement[] = preset.items.map((item, idx) => {
      const elWidth = item.width;
      const elHeight = item.height;
      const x = Math.round(centerX - elWidth / 2 + (item.offsetX || 0));
      const y = Math.round(centerY + item.offsetY - elHeight / 2);

      return {
        id: `el-fontcomb-${Date.now().toString(36).slice(-5)}-${idx}`,
        type: 'text',
        name: `${preset.name} - ${item.content.replace(/\n/g, ' ').slice(0, 20)}`,
        role: 'custom',
        content: item.content,
        x,
        y,
        width: elWidth,
        height: elHeight,
        zIndex: baseZ + idx,
        opacity: 1,
        fontFamily: item.fontFamily,
        fontWeight: item.fontWeight,
        fontSize: item.fontSize,
        italic: item.italic,
        uppercase: item.uppercase,
        dropCap: false,
        textAlign: item.textAlign,
        lineHeight: item.lineHeight,
        letterSpacing: item.letterSpacing,
        color: item.color || '#000000',
        shadow: {
          enabled: false,
          offsetX: 0,
          offsetY: 2,
          blur: 8,
          color: 'rgba(0,0,0,0.35)',
        },
        stroke: item.stroke
          ? { ...item.stroke }
          : {
              enabled: false,
              width: 1,
              color: '#000000',
            },
      };
    });

    if (mode === 'new-slide') {
      const newId = `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newSlide: Slide = {
        id: newId,
        layout: 'blank' as LayoutPresetId,
        elements: newElements,
        backgroundColor: '#ffffff',
      };
      const nextSlides = [...state.slides, newSlide];
      set({
        slides: nextSlides,
        activeSlideIndex: nextSlides.length - 1,
        selectedElementId: newElements[0]?.id || null,
      });
      broadcastCurrentCanvasStateDebounced(get());
      return;
    }

    const nextSlides: Slide[] = state.slides.map((s, idx) => {
      if (idx !== state.activeSlideIndex) return s;
      if (mode === 'blank') {
        return {
          ...s,
          layout: 'blank' as LayoutPresetId,
          backgroundColor: '#ffffff',
          elements: newElements,
        };
      }
      return {
        ...s,
        elements: [...s.elements, ...newElements],
      };
    });

    set({
      slides: nextSlides,
      selectedElementId: newElements[0]?.id || null,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  addElement: (kind, initialProps) => {
    const state = get();
    const slide = state.getActiveSlide();
    if (!slide) return;
    state.pushHistory();

    const theme = state.getActiveTheme();
    const dim = ASPECT_RATIOS[state.aspectRatio];
    const maxZ = slide.elements.reduce((m, e) => Math.max(m, e.zIndex), 1);
    const id = `el-${kind}-${Date.now().toString(36).slice(-5)}`;

    let newElement: CanvasElement;

    if (kind === 'text') {
      const textEl: TextCanvasElement = {
        id,
        type: 'text',
        name: 'Editorial Text Block',
        role: 'custom',
        content: 'New *Editorial* Heading',
        x: Math.round(dim.stageWidth / 2 - 140),
        y: Math.round(dim.stageHeight / 2 - 40),
        width: 280,
        height: 72,
        zIndex: maxZ + 1,
        opacity: 1,
        fontFamily: theme.headingFont,
        fontWeight: 400,
        fontSize: 32,
        italic: false,
        uppercase: false,
        dropCap: false,
        dropCapColor: theme.accent,
        textAlign: 'center',
        lineHeight: 1.15,
        letterSpacing: 0,
        color:
          slide.layout === 'cover-overlay' ||
          slide.layout === 'full-bleed-bottom-story' ||
          slide.layout === 'media-outro-cta' ||
          slide.layout === 'playful-outro-cta' ||
          slide.layout.startsWith('typo-')
            ? theme.textOnDark
            : theme.textPrimary,
        shadow: {
          enabled: false,
          offsetX: 0,
          offsetY: 2,
          blur: 8,
          color: 'rgba(0,0,0,0.35)',
        },
        stroke: {
          enabled: false,
          width: 1,
          color: '#000000',
        },
      };
      newElement = textEl;
    } else if (kind === 'badge') {
      const badgeEl: TextCanvasElement = {
        id,
        type: 'badge',
        name: 'Editorial Issue Badge',
        role: 'badge',
        content: 'ISSUE NO. 14 · ARCHIVE',
        x: Math.round(dim.stageWidth / 2 - 90),
        y: Math.round(dim.stageHeight / 2 - 18),
        width: 180,
        height: 32,
        zIndex: maxZ + 1,
        opacity: 1,
        fontFamily: theme.sansFont,
        fontWeight: 500,
        fontSize: 9.5,
        italic: false,
        uppercase: true,
        dropCap: false,
        dropCapColor: theme.accent,
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0.22,
        color: theme.textOnDark,
        backgroundColor: theme.accent,
        borderRadius: 999,
        paddingX: 14,
        paddingY: 6,
        shadow: {
          enabled: false,
          offsetX: 0,
          offsetY: 2,
          blur: 8,
          color: 'rgba(0,0,0,0.25)',
        },
        stroke: {
          enabled: false,
          width: 1,
          color: '#000000',
        },
      };
      newElement = badgeEl;
    } else if (kind === 'image') {
      const imgEl: ImageCanvasElement = {
        id,
        type: 'image',
        name: 'Photo Frame',
        src: CURATED_EDITORIAL_IMAGES.roomInterior1,
        alt: 'Editorial Photo Frame',
        x: Math.round(dim.stageWidth / 2 - 120),
        y: Math.round(dim.stageHeight / 2 - 150),
        width: 240,
        height: 300,
        zIndex: maxZ + 1,
        opacity: 1,
        zoom: 1,
        panX: 50,
        panY: 50,
        dimmerOpacity: 0,
        dimmerType: 'bottom-gradient',
        borderRadius: 0,
      };
      newElement = imgEl;
    } else if (kind === 'shape') {
      const shapeProps = initialProps as Partial<ShapeCanvasElement> | undefined;
      const shapeKind: ShapeKind = shapeProps?.shapeKind || 'rounded-rect';
      const shapeEl: ShapeCanvasElement = {
        id,
        type: 'shape',
        name: shapeKind === 'circle' ? 'Circle Shape' : 'Editorial Shape Block',
        shapeKind,
        x: Math.round(dim.stageWidth / 2 - 80),
        y: Math.round(dim.stageHeight / 2 - 80),
        width: 160,
        height: 160,
        zIndex: maxZ + 1,
        opacity: 1,
        fillColor: theme.accent,
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius:
          shapeKind === 'rounded-rect' ? 16 : shapeKind === 'circle' ? 9999 : 0,
        shadow: {
          enabled: false,
          offsetX: 0,
          offsetY: 4,
          blur: 12,
          color: 'rgba(0,0,0,0.15)',
        },
      };
      newElement = shapeEl;
    } else {
      const divEl: DividerCanvasElement = {
        id,
        type: 'divider',
        name: 'Editorial Rule Line',
        x: Math.round(dim.stageWidth / 2 - 80),
        y: Math.round(dim.stageHeight / 2 - 6),
        width: 160,
        height: 12,
        zIndex: maxZ + 1,
        opacity: 1,
        orientation: 'horizontal',
        color: theme.accent,
        thickness: 1,
        style: 'solid',
      };
      newElement = divEl;
    }

    if (initialProps) {
      newElement = { ...newElement, ...initialProps } as CanvasElement;
    }

    const nextSlides = state.slides.map((s, idx) =>
      idx === state.activeSlideIndex
        ? { ...s, elements: [...s.elements, newElement] }
        : s
    );

    set({
      slides: nextSlides,
      selectedElementId: newElement.id,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  updateElement: (elementId, updater, recordHistory = false) => {
    const state = get();
    if (recordHistory) {
      state.pushHistory();
    }

    let updatedPartial: Partial<CanvasElement> | null = null;

    const nextSlides = state.slides.map((slide, idx) => {
      if (idx !== state.activeSlideIndex) return slide;
      return {
        ...slide,
        elements: slide.elements.map((el) => {
          if (el.id !== elementId) return el;
          const updated =
            typeof updater === 'function'
              ? updater(el)
              : ({ ...el, ...updater } as CanvasElement);
          updatedPartial = typeof updater === 'function' ? updated : updater;
          return updated;
        }),
      };
    });

    set({ slides: nextSlides });

    if (updatedPartial) {
      multiplayerService.sendElementUpdate(state.activeSlideIndex, elementId, updatedPartial);
    }
    autoSaveWorkingProjectDebounced(get());
  },

  commitElementHistory: () => {
    get().pushHistory();
    broadcastCurrentCanvasStateDebounced(get());
    autoSaveWorkingProjectDebounced(get());
  },

  updateSlideElementRemote: (slideIndex, elementId, updates) => {
    const state = get();
    const nextSlides = state.slides.map((slide, idx) => {
      if (idx !== slideIndex) return slide;
      return {
        ...slide,
        elements: slide.elements.map((el) => {
          if (el.id !== elementId) return el;
          return { ...el, ...updates } as CanvasElement;
        }),
      };
    });
    set({ slides: nextSlides });
  },

  deleteElement: (elementId) => {
    const state = get();
    const targetId = elementId || state.selectedElementId;
    if (!targetId) return;
    state.pushHistory();

    const nextSlides = state.slides.map((slide, idx) => {
      if (idx !== state.activeSlideIndex) return slide;
      return {
        ...slide,
        elements: slide.elements.filter((el) => el.id !== targetId),
      };
    });

    set({
      slides: nextSlides,
      selectedElementId:
        state.selectedElementId === targetId ? null : state.selectedElementId,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  duplicateElement: (elementId) => {
    const state = get();
    const targetId = elementId || state.selectedElementId;
    const slide = state.getActiveSlide();
    if (!slide || !targetId) return;
    const original = slide.elements.find((e) => e.id === targetId);
    if (!original) return;

    state.pushHistory();
    const maxZ = slide.elements.reduce((m, e) => Math.max(m, e.zIndex), 1);
    const copyId = `${original.id}-dup-${Date.now().toString(36).slice(-4)}`;
    const copy: CanvasElement = {
      ...JSON.parse(JSON.stringify(original)),
      id: copyId,
      name: `${original.name} Copy`,
      x: original.x + 18,
      y: original.y + 18,
      zIndex: maxZ + 1,
    };

    const nextSlides = state.slides.map((s, idx) =>
      idx === state.activeSlideIndex
        ? { ...s, elements: [...s.elements, copy] }
        : s
    );

    set({
      slides: nextSlides,
      selectedElementId: copyId,
    });
    broadcastCurrentCanvasStateDebounced(get());
  },

  adjustElementZIndex: (elementId, direction) => {
    const state = get();
    const slide = state.getActiveSlide();
    if (!slide) return;
    const target = slide.elements.find((e) => e.id === elementId);
    if (!target) return;

    state.pushHistory();
    const zValues = slide.elements.map((e) => e.zIndex);
    const maxZ = Math.max(...zValues, 1);
    const minZ = Math.min(...zValues, 1);

    let nextZ = target.zIndex;
    if (direction === 'front') nextZ = maxZ + 1;
    else if (direction === 'back') nextZ = Math.max(0, minZ - 1);
    else if (direction === 'forward') nextZ = target.zIndex + 1;
    else if (direction === 'backward') nextZ = Math.max(0, target.zIndex - 1);

    state.updateElement(elementId, { zIndex: nextZ });
  },

  alignElementOnCanvas: (elementId, alignment) => {
    const state = get();
    const slide = state.getActiveSlide();
    if (!slide) return;
    const target = slide.elements.find((e) => e.id === elementId);
    if (!target) return;

    const dim = ASPECT_RATIOS[state.aspectRatio];
    state.pushHistory();

    if (alignment === 'center-x') {
      state.updateElement(elementId, {
        x: Math.round((dim.stageWidth - target.width) / 2),
      });
    } else if (alignment === 'center-y') {
      state.updateElement(elementId, {
        y: Math.round((dim.stageHeight - target.height) / 2),
      });
    } else if (alignment === 'left') {
      state.updateElement(elementId, { x: 36 });
    } else if (alignment === 'right') {
      state.updateElement(elementId, {
        x: Math.round(dim.stageWidth - target.width - 36),
      });
    } else if (alignment === 'top') {
      state.updateElement(elementId, { y: 36 });
    } else if (alignment === 'bottom') {
      state.updateElement(elementId, {
        y: Math.round(dim.stageHeight - target.height - 36),
      });
    } else if (alignment === 'fit-canvas') {
      state.updateElement(elementId, {
        x: 0,
        y: 0,
        width: dim.stageWidth,
        height: dim.stageHeight,
      });
    } else if (alignment === 'fit-margin') {
      state.updateElement(elementId, {
        x: 36,
        y: 36,
        width: dim.stageWidth - 72,
        height: dim.stageHeight - 72,
      });
    }
  },

  loadProjectSnapshot: (payload, openInNewTab = true) => {
    const state = get();
    const nextRatio = payload.aspectRatio || '4:5';
    const nextThemeId = payload.activeThemeId || THEME_PALETTES[0].id;
    const nextBranding = payload.branding || DEFAULT_BRANDING;
    const nextScript = payload.scriptText || DEFAULT_SCRIPT;
    const nextSlides =
      payload.slides && payload.slides.length > 0
        ? cloneSlides(payload.slides)
        : cloneSlides(state.slides);
    const nextTitle = payload.projectTitle || state.projectTitle;
    const nextId =
      payload.id ||
      `${nextTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()
        .toString(36)
        .slice(-4)}`;

    const suggestedZoom =
      nextRatio === '9:16' ? 0.7 : nextRatio === '4:5' ? 0.9 : 0.95;

    const newDocTab: OpenDocumentTab = {
      id: nextId,
      projectTitle: nextTitle,
      aspectRatio: nextRatio,
      activeThemeId: nextThemeId,
      themeOverride: {},
      branding: { ...nextBranding },
      scriptText: nextScript,
      slides: cloneSlides(nextSlides),
      activeSlideIndex: 0,
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
    };

    const nextOpenDocs = upsertOpenDocumentList(state, newDocTab, openInNewTab);

    set({
      openDocuments: nextOpenDocs,
      activeDocumentId: nextId,
      projectId: nextId,
      projectTitle: nextTitle,
      aspectRatio: nextRatio,
      activeThemeId: nextThemeId,
      themeOverride: {},
      branding: nextBranding,
      scriptText: nextScript,
      slides: nextSlides,
      activeSlideIndex: 0,
      selectedElementId: null,
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
      activeView: 'editor',
    });
    saveActiveView('editor');
    broadcastCurrentCanvasStateDebounced(get());
  },

  syncRemoteCanvasSnapshot: (payload) => {
    const state = get();
    if (!payload.slides || payload.slides.length === 0) return;
    const nextRatio = (payload.aspectRatio as AspectRatioKey) || state.aspectRatio;
    const nextThemeId = payload.activeThemeId || state.activeThemeId;
    const nextBranding = payload.branding || state.branding;
    const nextScript = payload.scriptText ?? state.scriptText;
    const nextSlides = cloneSlides(payload.slides);
    const nextTitle = payload.projectTitle || state.projectTitle || 'Untitled Carousel Project';
    const nextId = payload.id || state.activeDocumentId || `doc-team-${state.aspectRatio}`;

    const suggestedZoom =
      nextRatio === '9:16' ? 0.7 : nextRatio === '4:5' ? 0.9 : 0.95;

    const newDocTab: OpenDocumentTab = {
      id: nextId,
      projectTitle: nextTitle,
      aspectRatio: nextRatio,
      activeThemeId: nextThemeId,
      themeOverride: payload.themeOverride || {},
      branding: { ...nextBranding },
      scriptText: nextScript,
      slides: cloneSlides(nextSlides),
      activeSlideIndex: typeof payload.activeSlideIndex === 'number'
        ? Math.min(payload.activeSlideIndex, Math.max(0, nextSlides.length - 1))
        : Math.min(state.activeSlideIndex, Math.max(0, nextSlides.length - 1)),
      canvasZoom: suggestedZoom,
      lastSavedAt: null,
      past: [],
      future: [],
    };

    const nextOpenDocs = upsertOpenDocumentList(state, newDocTab, false);

    set({
      openDocuments: nextOpenDocs,
      activeDocumentId: nextId,
      projectId: nextId,
      projectTitle: nextTitle,
      aspectRatio: nextRatio,
      activeThemeId: nextThemeId,
      themeOverride: payload.themeOverride || {},
      branding: nextBranding,
      scriptText: nextScript,
      slides: nextSlides,
      activeSlideIndex: typeof payload.activeSlideIndex === 'number'
        ? Math.min(payload.activeSlideIndex, Math.max(0, nextSlides.length - 1))
        : Math.min(state.activeSlideIndex, Math.max(0, nextSlides.length - 1)),
    });
    autoSaveWorkingProjectDebounced(get());
  },

  setActiveView: (activeView) => {
    saveActiveView(activeView);
    const state = get();
    const currentSnap = snapshotCurrentActiveDoc(state);
    set({
      activeView,
      selectedElementId: null,
      openDocuments: state.openDocuments.map((doc) =>
        doc.id === state.activeDocumentId ? currentSnap : doc
      ),
    });
  },
  setCanvasZoom: (canvasZoom) =>
    set({
      canvasZoom: Math.max(0.2, Math.min(2.5, Number(canvasZoom.toFixed(2)))),
    }),
  setWorkspaceDarkMode: (workspaceDarkMode) => set({ workspaceDarkMode }),
  setLeftSidebarOpen: (leftSidebarOpen) => set({ leftSidebarOpen }),
  setActiveLeftTab: (activeLeftTab) =>
    set({ activeLeftTab, leftSidebarOpen: true }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setExportState: (isExporting, exportProgress = null) =>
    set({ isExporting, exportProgress }),

  updateSettings: (partial) => {
    const current = get().settings;
    const next: StudioGeneralSettings = {
      ...current,
      ...partial,
      hotkeys: {
        ...current.hotkeys,
        ...(partial.hotkeys || {}),
      },
    };
    saveStudioSettingsToStorage(next);
    set({ settings: next });
  },

  updateHotkey: (key, combo) => {
    const current = get().settings;
    const next: StudioGeneralSettings = {
      ...current,
      hotkeys: {
        ...current.hotkeys,
        [key]: combo,
      },
    };
    saveStudioSettingsToStorage(next);
    set({ settings: next });
  },

  resetSettingsToDefault: () => {
    const defaults = buildDefaultStudioSettings();
    saveStudioSettingsToStorage(defaults);
    set({ settings: defaults });
  },

  setAdminAuthenticated: (isAdminAuthenticated) => {
    try {
      if (isAdminAuthenticated) {
        localStorage.setItem(LOCAL_ADMIN_AUTH_KEY, 'true');
      } else {
        localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
      }
    } catch {
      // ignore
    }
    set({ isAdminAuthenticated });
  },

  setCloudMasterTemplates: (cloudMasterTemplates) =>
    set({ cloudMasterTemplates }),
}));
