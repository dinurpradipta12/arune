import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { copySlideToClipboard } from '../../utils/exportEngine';
import {
  ASPECT_RATIOS,
} from '../../constants/themesAndPresets';
import { useStudioStore, loadSavedWorkingProjectFromStorage } from '../../store/useStudioStore';
import type { AspectRatioKey, CanvasElement } from '../../types/studio';
import { removeImageBackground } from '../../services/backgroundRemoval';
import { SlideStage } from '../canvas/SlideStage';
import { MultiplayerCursorsLayer } from '../canvas/MultiplayerCursorsLayer';
import { CanvasCommentsLayer } from '../canvas/CanvasCommentsLayer';
import {
  DockedCanvasToolstrip,
  type CanvasToolMode,
} from '../canvas/DockedCanvasToolstrip';
import {
  multiplayerService,
  type RemotePeer,
} from '../../services/multiplayerService';
import { getAvatarPresetById } from '../../constants/avatarPresets';
import { getActiveTeamId, getCurrentUserTeamRole, getTeamProjects, subscribeToActiveTeam } from '../../services/teamWorkspaceService';

export const CenterWorkspace: React.FC = () => {
  const {
    projectTitle,
    slides,
    activeSlideIndex,
    setActiveSlideIndex,
    aspectRatio,
    getActiveTheme,
    branding,
    canvasZoom,
    setCanvasZoom,
    workspaceDarkMode,
    selectedElementId,
    setSelectedElementId,
    getSelectedElement,
    updateElement,
    commitElementHistory,
    addElement,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlide,
    setActiveModal,
    setActiveView,
    saveCurrentProjectToVault,
    lastSavedAt,
    openDocuments,
    activeDocumentId,
    switchDocumentTab,
    closeDocumentTab,
    openBlankDocumentTab,
    settings,
    updateSlideElementRemote,
    syncRemoteCanvasSnapshot,
    loadProjectSnapshot,
    setCommentMode,
    syncRemoteComments,
  } = useStudioStore();

  const [multiplayerPeers, setMultiplayerPeers] = useState<RemotePeer[]>([]);
  const [copiedSlideIndex, setCopiedSlideIndex] = useState<number | null>(null);

  const handleCopySlideImage = async (e: React.MouseEvent, slideIdx: number) => {
    e.stopPropagation();
    try {
      await copySlideToClipboard({ slideIndex: slideIdx });
      setCopiedSlideIndex(slideIdx);
      setTimeout(() => setCopiedSlideIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy slide image:', err);
    }
  };

  // Harmonize multiplayer collaboration room ID across team members (reactive state)
  const [activeTeamId, setActiveTeamIdState] = useState<string | null>(getActiveTeamId());

  useEffect(() => {
    const unsub = subscribeToActiveTeam((teamId) => {
      setActiveTeamIdState(teamId);
    });
    return () => unsub();
  }, []);

  const collabRoomId = activeTeamId
    ? `team_${activeTeamId}`
    : 'global_collab_room';

  const isViewer = Boolean(activeTeamId && getCurrentUserTeamRole(activeTeamId) === 'viewer');

  // Connect to multiplayer collaboration room
  useEffect(() => {
    multiplayerService.connectToRoom(collabRoomId);
    multiplayerService.updatePresence(activeSlideIndex, selectedElementId);
    multiplayerService.sendCanvasStateRequest();

    const unsubState = multiplayerService.subscribeToState((s) => {
      setMultiplayerPeers(s.peers);
    });

    const unsubRemoteUpdate = multiplayerService.onRemoteElementUpdate((payload) => {
      updateSlideElementRemote(payload.slideIndex, payload.elementId, payload.updates);
    });

    // 1. When a new peer joins and requests current live canvas state
    const unsubCanvasReq = multiplayerService.onCanvasStateRequest(() => {
      // ONLY respond if we are in an active team workspace
      const currentTeamId = getActiveTeamId();
      if (!currentTeamId) return;

      const currentStore = useStudioStore.getState();
      const hasContent =
        currentStore.slides &&
        currentStore.slides.length > 0 &&
        currentStore.slides.some((s) => s.elements && s.elements.length > 0);

      // ONLY broadcast if we have actual content! A blank client must NEVER respond with empty slides!
      if (hasContent) {
        multiplayerService.broadcastCanvasState({
          projectId: currentStore.projectId,
          projectTitle: currentStore.projectTitle || 'Untitled Carousel Project',
          aspectRatio: currentStore.aspectRatio,
          activeThemeId: currentStore.activeThemeId,
          themeOverride: currentStore.themeOverride,
          branding: currentStore.branding,
          scriptText: currentStore.scriptText,
          slides: currentStore.slides,
          activeSlideIndex: currentStore.activeSlideIndex,
        });
      }
    });

    // 2. When receiving live canvas updates/sync from team collaborators
    const unsubCanvasSync = multiplayerService.onRemoteCanvasState((payload) => {
      // In personal mode, do NOT accept remote canvas updates from global_collab_room!
      const currentTeamId = getActiveTeamId();
      if (!currentTeamId) return;

      if (!payload.slides || payload.slides.length === 0) return;
      syncRemoteCanvasSnapshot({
        id: payload.projectId,
        projectTitle: payload.projectTitle,
        aspectRatio: payload.aspectRatio as AspectRatioKey,
        activeThemeId: payload.activeThemeId,
        themeOverride: payload.themeOverride,
        branding: payload.branding,
        scriptText: payload.scriptText,
        slides: payload.slides,
        activeSlideIndex: payload.activeSlideIndex,
        timestamp: payload.timestamp,
      });
    });

    // 3. When receiving live comment sync from peers
    const unsubComments = multiplayerService.onRemoteComments((remoteComments) => {
      syncRemoteComments(remoteComments);
    });

    return () => {
      unsubState();
      unsubRemoteUpdate();
      unsubCanvasReq();
      unsubCanvasSync();
      unsubComments();
    };
  }, [collabRoomId, updateSlideElementRemote, syncRemoteCanvasSnapshot, syncRemoteComments]);

  // If user opens editor with empty canvas (e.g. newcomer joining the active room)
  useEffect(() => {
    if (slides.length === 0) {
      // 1. First check if we have a saved working project in localStorage before doing anything destructive
      const saved = loadSavedWorkingProjectFromStorage();
      if (saved && saved.slides && saved.slides.length > 0) {
        useStudioStore.setState({
          projectId: saved.projectId,
          projectTitle: saved.projectTitle,
          aspectRatio: saved.aspectRatio,
          activeThemeId: saved.activeThemeId,
          themeOverride: saved.themeOverride || {},
          branding: saved.branding,
          scriptText: saved.scriptText || '',
          slides: saved.slides,
          activeSlideIndex: saved.activeSlideIndex || 0,
          openDocuments: saved.openDocuments || [],
          activeDocumentId: saved.activeDocumentId || saved.projectId,
        });
        return;
      }

      // 2. If in team mode, request live canvas state from connected peers
      if (activeTeamId) {
        multiplayerService.sendCanvasStateRequest();
      }

      // 3. Fallback only if canvas still remains empty
      const timer = setTimeout(() => {
        const currentSlides = useStudioStore.getState().slides;
        if (currentSlides.length === 0) {
          if (activeTeamId) {
            const teamProjects = getTeamProjects(activeTeamId);
            if (teamProjects.length > 0 && teamProjects[0].projectJson) {
              try {
                const parsed = JSON.parse(teamProjects[0].projectJson);
                loadProjectSnapshot(parsed, false);
                return;
              } catch {
                // ignore
              }
            }
          }
          openBlankDocumentTab(aspectRatio || '4:5');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [slides.length, activeTeamId, openBlankDocumentTab, aspectRatio, loadProjectSnapshot]);

  // Sync presence when slide or element selection changes
  useEffect(() => {
    multiplayerService.updatePresence(activeSlideIndex, selectedElementId);
  }, [activeSlideIndex, selectedElementId]);

  // Global Hotkey 'C' to toggle comment mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (e.key === 'c' || e.key === 'C') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setCommentMode(!useStudioStore.getState().isCommentMode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommentMode]);

  // Wrap updateElement to broadcast live edits to peers
  const handleUpdateElement = (
    elementId: string,
    updater: Partial<CanvasElement> | ((prev: CanvasElement) => CanvasElement),
    recordHistory = false
  ) => {
    updateElement(elementId, updater, recordHistory);
    if (typeof updater !== 'function') {
      multiplayerService.sendElementUpdate(activeSlideIndex, elementId, updater);
    }
  };

  const handleSlideMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    multiplayerService.sendCursorPosition(xPercent, yPercent, activeSlideIndex);
  };

  // Keep cursor visible at last known position while active in window (Figma style).
  // Only send cursor leave when user actually unfocuses or leaves the window.
  useEffect(() => {
    const handleBlur = () => {
      multiplayerService.sendCursorLeave();
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const [justSaved, setJustSaved] = useState(false);
  const [isErasingBg, setIsErasingBg] = useState(false);
  const [erasingProgress, setErasingProgress] = useState<string>('');
  const [erasingError, setErasingError] = useState<string | null>(null);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);

  // Professional Canvas Tools & Pan state
  const [activeTool, setActiveTool] = useState<CanvasToolMode>('select');
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const isPanDraggingRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const isPanningActive = activeTool === 'hand' || isSpaceDown;

  // Spacebar toggle and hotkeys for tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (e.code === 'Space' && !e.repeat) {
        setIsSpaceDown(true);
      } else if ((e.key === 'v' || e.key === 'V') && !e.metaKey && !e.ctrlKey) {
        setActiveTool('select');
      } else if ((e.key === 'h' || e.key === 'H') && !e.metaKey && !e.ctrlKey) {
        setActiveTool('hand');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        isPanDraggingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanningActive) {
      isPanDraggingRef.current = true;
      const el = canvasContainerRef.current;
      if (el) {
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
        };
      }
      return;
    }

    if (e.target === e.currentTarget) {
      setSelectedElementId(null);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanDraggingRef.current) {
      const el = canvasContainerRef.current;
      if (el) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        el.scrollLeft = panStartRef.current.scrollLeft - dx;
        el.scrollTop = panStartRef.current.scrollTop - dy;
      }
    }
  };

  const handleCanvasPointerUp = () => {
    isPanDraggingRef.current = false;
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const theme = getActiveTheme();
  const activeSlide = slides[activeSlideIndex] || slides[0];
  const selectedElement = getSelectedElement();
  const dim = ASPECT_RATIOS[aspectRatio];

  const scaledW = Math.round(dim.stageWidth * canvasZoom);
  const scaledH = Math.round(dim.stageHeight * canvasZoom);

  // Thumbnail scale for bottom filmstrip
  const thumbScale = aspectRatio === '9:16' ? 0.11 : 0.135;
  const thumbW = Math.round(dim.stageWidth * thumbScale);
  const thumbH = Math.round(dim.stageHeight * thumbScale);

  const handleQuickSave = async () => {
    await saveCurrentProjectToVault();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleRemoveBackground = async () => {
    if (!selectedElement || selectedElement.type !== 'image') return;
    setIsErasingBg(true);
    setErasingError(null);
    setErasingProgress('Menyiapkan AI model...');
    commitElementHistory();

    try {
      const res = await removeImageBackground(
        selectedElement.src,
        (p) => {
          setErasingProgress(
            p.percent > 0 ? `Menghapus background (${p.percent}%)...` : 'Memproses foto...'
          );
        }
      );

      // Calculate tightly fitted bounding box keeping center position
      const curW = selectedElement.width;
      const curH = selectedElement.height;
      const curCenterX = selectedElement.x + curW / 2;
      const curCenterY = selectedElement.y + curH / 2;

      let nextW = curW;
      let nextH = curH;
      if (res.trimmedWidth > 0 && res.trimmedHeight > 0) {
        // Compute new width and height based on the trimmed ratio
        const trimRatio = res.trimmedWidth / res.trimmedHeight;
        // Keep either current height or width, whichever fits best
        if (trimRatio >= 1) {
          nextW = Math.round(Math.min(curW, curH * trimRatio));
          nextH = Math.round(nextW / trimRatio);
        } else {
          nextH = Math.round(Math.min(curH, curW / trimRatio));
          nextW = Math.round(nextH * trimRatio);
        }
        // Ensure reasonable minimums
        nextW = Math.max(48, nextW);
        nextH = Math.max(48, nextH);
      }

      const nextX = Math.round(curCenterX - nextW / 2);
      const nextY = Math.round(curCenterY - nextH / 2);

      updateElement(
        selectedElement.id,
        {
          src: res.dataUrl,
          originalSrc: selectedElement.originalSrc || selectedElement.src,
          originalWidth: selectedElement.originalWidth || selectedElement.width,
          originalHeight: selectedElement.originalHeight || selectedElement.height,
          width: nextW,
          height: nextH,
          x: nextX,
          y: nextY,
          cropTop: 0,
          cropBottom: 0,
          cropLeft: 0,
          cropRight: 0,
        },
        true
      );
    } catch (err: unknown) {
      console.error('Failed to remove background:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menghapus background foto.';
      setErasingError(msg);
    } finally {
      setIsErasingBg(false);
      setErasingProgress('');
    }
  };

  const handleRevertOriginalPhoto = () => {
    if (!selectedElement || selectedElement.type !== 'image' || !selectedElement.originalSrc) return;
    commitElementHistory();

    const origW = selectedElement.originalWidth || selectedElement.width;
    const origH = selectedElement.originalHeight || selectedElement.height;
    const curCenterX = selectedElement.x + selectedElement.width / 2;
    const curCenterY = selectedElement.y + selectedElement.height / 2;
    const nextX = Math.round(curCenterX - origW / 2);
    const nextY = Math.round(curCenterY - origH / 2);

    updateElement(
      selectedElement.id,
      {
        src: selectedElement.originalSrc,
        originalSrc: undefined,
        originalWidth: undefined,
        originalHeight: undefined,
        width: origW,
        height: origH,
        x: nextX,
        y: nextY,
      },
      true
    );
  };

  // Helper to read an image File or Blob and add it to canvas with appropriate dimensions
  const insertImageFileToCanvas = (file: File | Blob, customName?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const stageW = dim.stageWidth;
        const stageH = dim.stageHeight;

        // Calculate aspect-ratio-preserving width & height that fit nicely inside stage
        const maxW = Math.round(stageW * 0.7);
        const maxH = Math.round(stageH * 0.6);
        let targetW = img.naturalWidth || 280;
        let targetH = img.naturalHeight || 320;

        const scaleRatio = Math.min(1, maxW / targetW, maxH / targetH);
        targetW = Math.round(targetW * scaleRatio);
        targetH = Math.round(targetH * scaleRatio);

        // Center on canvas
        const posX = Math.round(stageW / 2 - targetW / 2);
        const posY = Math.round(stageH / 2 - targetH / 2);

        const fileName = customName || (file instanceof File ? file.name : 'Pasted Photo');
        addElement('image', {
          name: fileName.replace(/\.[^/.]+$/, '').slice(0, 32) || 'Imported Photo',
          src: dataUrl,
          alt: fileName,
          x: posX,
          y: posY,
          width: targetW,
          height: targetH,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      insertImageFileToCanvas(files[i]);
    }
    e.target.value = '';
  };

  // Global Paste Listener for Images (Ctrl+V / Cmd+V anywhere on editor)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste if user is typing into an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            insertImageFileToCanvas(file, `Pasted Image ${new Date().toLocaleTimeString()}`);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [dim.stageWidth, dim.stageHeight]);

  const targetZoomRef = useRef<number>(canvasZoom);
  const rafZoomRef = useRef<number | null>(null);

  // Sync targetZoom when external controls (slider, Fit button) change zoom
  useEffect(() => {
    if (!rafZoomRef.current) {
      targetZoomRef.current = canvasZoom;
    }
  }, [canvasZoom]);

  // Cleanup active animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafZoomRef.current) {
        cancelAnimationFrame(rafZoomRef.current);
        rafZoomRef.current = null;
      }
    };
  }, []);

  // Smooth Canvas zoom on Wheel: Option + Scroll (Mac), Cmd + Scroll, or Trackpad Pinch
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Mac Opt (Alt), Cmd (Meta), or Ctrl (Trackpad Pinch on Mac)
      if (e.altKey || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();

        const isPinch = e.ctrlKey && !e.altKey && !e.metaKey;
        // Natural exponential scaling rates
        const zoomRate = isPinch ? 0.0075 : 0.0016;
        const factor = Math.exp(-e.deltaY * zoomRate);

        const currentTarget = targetZoomRef.current;
        const nextTarget = Math.max(0.2, Math.min(2.5, currentTarget * factor));
        targetZoomRef.current = nextTarget;

        if (!rafZoomRef.current) {
          const animateZoom = () => {
            const current = useStudioStore.getState().canvasZoom;
            const target = targetZoomRef.current;
            const diff = target - current;

            // When close enough, snap to target and finish
            if (Math.abs(diff) < 0.001) {
              setCanvasZoom(Number(target.toFixed(3)));
              rafZoomRef.current = null;
              return;
            }

            // Exponential easing lerp: 0.22 per frame gives silky-smooth momentum at 60/120fps
            const nextVal = current + diff * 0.22;
            setCanvasZoom(Number(nextVal.toFixed(4)));
            rafZoomRef.current = requestAnimationFrame(animateZoom);
          };
          rafZoomRef.current = requestAnimationFrame(animateZoom);
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [setCanvasZoom]);

  // Touch Bar support on Mac Electron
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const desktop = (window as any).aruneDesktop;
    if (!desktop?.onTouchBarAction) return;

    const unbind = desktop.onTouchBarAction((action: { type: string }) => {
      const state = useStudioStore.getState();
      if (action.type === 'zoom-in') {
        state.setCanvasZoom(Math.min(2.5, Number((state.canvasZoom + 0.1).toFixed(2))));
      } else if (action.type === 'zoom-out') {
        state.setCanvasZoom(Math.max(0.2, Number((state.canvasZoom - 0.1).toFixed(2))));
      } else if (action.type === 'zoom-fit') {
        state.setCanvasZoom(state.aspectRatio === '9:16' ? 0.68 : 0.9);
      } else if (action.type === 'prev-slide') {
        if (state.activeSlideIndex > 0) {
          state.setActiveSlideIndex(state.activeSlideIndex - 1);
        }
      } else if (action.type === 'next-slide') {
        if (state.activeSlideIndex < state.slides.length - 1) {
          state.setActiveSlideIndex(state.activeSlideIndex + 1);
        }
      }
    });

    return () => {
      if (unbind) unbind();
    };
  }, []);

  // Drag and drop handlers for canvas container
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFileOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the container boundaries
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFileOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        insertImageFileToCanvas(file);
      }
    }
  };

  // Pixel ticks for Top Horizontal Ruler (0 .. exportWidth) & Left Vertical Ruler (0 .. exportHeight)
  const horizontalTicks = Array.from(
    { length: Math.floor(dim.exportWidth / 50) + 1 },
    (_, i) => i * 50
  );
  const verticalTicks = Array.from(
    { length: Math.floor(dim.exportHeight / 50) + 1 },
    (_, i) => i * 50
  );

  // Selected element bounds in percentages of stage for ruler highlight
  const selLeftPct = selectedElement
    ? Math.max(0, Math.min(100, (selectedElement.x / dim.stageWidth) * 100))
    : null;
  const selWidthPct = selectedElement
    ? Math.max(
        0,
        Math.min(100 - (selLeftPct || 0), (selectedElement.width / dim.stageWidth) * 100)
      )
    : null;
  const selTopPct = selectedElement
    ? Math.max(0, Math.min(100, (selectedElement.y / dim.stageHeight) * 100))
    : null;
  const selHeightPct = selectedElement
    ? Math.max(
        0,
        Math.min(
          100 - (selTopPct || 0),
          (selectedElement.height / dim.stageHeight) * 100
        )
      )
    : null;

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
      {/* ================================================================== */}
      {/* CONDITIONAL MULTI-DOCUMENT TAB BAR (AUTO-SHOWS WHEN >= 2 DOCS)     */}
      {/* "jika aku membuka hanya 1 maka tab tidak aktif jika 2 maka tab     */}
      {/*  akan otomatis tampil di atas ruler bagian atas"                   */}
      {/* ================================================================== */}
      {openDocuments.length >= 2 && (
        <div className="h-8 border-b border-zinc-800/80 bg-zinc-900/90 flex items-center px-1.5 gap-1 overflow-x-auto no-scrollbar shrink-0 select-none z-30">
          {openDocuments.map((doc) => {
            const isActive = doc.id === activeDocumentId;
            const liveTitle = isActive ? projectTitle : doc.projectTitle;
            const liveRatio = isActive ? aspectRatio : doc.aspectRatio;
            const liveSlideCount = isActive ? slides.length : doc.slides.length;

            return (
              <div
                key={doc.id}
                onClick={() => switchDocumentTab(doc.id)}
                className={`group h-7 px-2.5 rounded-t-md border-t-2 border-x flex items-center gap-2 text-[11px] cursor-pointer transition-all shrink-0 max-w-[230px] ${
                  isActive
                    ? 'bg-zinc-950 border-t-blue-900 border-x-zinc-800 text-zinc-100 font-semibold shadow-xs'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-t-transparent border-x-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText
                  className={`w-3 h-3 shrink-0 ${
                    isActive ? 'text-blue-900' : 'text-zinc-500'
                  }`}
                />
                <span className="truncate">{liveTitle}</span>
                <span
                  className={`text-[9.5px] font-mono px-1 py-0.2 rounded shrink-0 ${
                    isActive
                      ? 'bg-blue-900/10 text-blue-900 font-semibold'
                      : 'bg-zinc-800/80 text-zinc-400'
                  }`}
                >
                  {liveRatio} · {liveSlideCount}s
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDocumentTab(doc.id);
                  }}
                  title={`Tutup Tab "${liveTitle}"`}
                  aria-label={`Close ${liveTitle}`}
                  className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Quick + New Blank Tab & Open Another Project From Hub */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => openBlankDocumentTab(aspectRatio)}
              title="Tambah Tab Dokumen Baru (+)"
              aria-label="New Document Tab"
              className="h-6 w-6 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('gallery')}
              title="Buka Project atau File Lain dari Home"
              className="h-6 px-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FolderOpen className="w-3 h-3 text-blue-900" />
              <span className="hidden sm:inline">Buka Lainnya</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ================================================================== */}
      {/* MAIN WORKSPACE: DOCKED LEFT TOOLBAR + (RULERS & CANVAS COLUMN)    */}
      {/* ================================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Docked Left Toolstrip (Photoshop Style Column) */}
        <DockedCanvasToolstrip
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onTriggerImageUpload={() => fileInputRef.current?.click()}
          onTriggerEraser={handleRemoveBackground}
          onRevertEraser={handleRevertOriginalPhoto}
          isErasingBg={isErasingBg}
          erasingProgress={erasingProgress}
          onOpenScriptModal={() => setActiveModal('script')}
          onQuickSave={handleQuickSave}
          justSaved={justSaved}
          lastSavedAt={lastSavedAt}
        />

        {/* Right Canvas Column: Top ruler + (Vertical ruler + Canvas stage) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          {/* ================================================================== */}
          {/* TOP HORIZONTAL RULER ("RULER BAGIAN ATAS")                         */}
          {/* ================================================================== */}
          {settings.showCanvasRulers && (
            <div className="h-6 border-b border-zinc-800/80 bg-zinc-950/95 flex items-stretch shrink-0 select-none z-20">
              {/* Top-Left Origin Corner Box (px) */}
              <div className="w-6 h-6 border-r border-zinc-800/80 bg-zinc-900/90 flex items-center justify-center text-[8.5px] font-mono text-blue-900 font-semibold shrink-0">
                px
              </div>

              {/* Top Horizontal Ruler Track */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <div
                  className="relative h-full border-x border-blue-900/30 bg-zinc-900/25 transition-[width] duration-150"
                  style={{ width: `${scaledW}px` }}
                >
                  {/* Selected Object Horizontal Highlight on Top Ruler */}
                  {selLeftPct !== null && selWidthPct !== null && (
                    <div
                      className="absolute inset-y-0 bg-blue-900/20 border-x border-blue-900/80 pointer-events-none"
                      style={{
                        left: `${selLeftPct}%`,
                        width: `${selWidthPct}%`,
                      }}
                    />
                  )}

                  {/* Tick Marks (every 50px in export coordinates, labeled every 200px) */}
                  {horizontalTicks.map((pxVal) => {
                    const pct = (pxVal / dim.exportWidth) * 100;
                    const isMajor = pxVal % 200 === 0;
                    const isMid = pxVal % 100 === 0;
                    return (
                      <div
                        key={pxVal}
                        className="absolute bottom-0 flex flex-col items-start pointer-events-none"
                        style={{ left: `${pct}%` }}
                      >
                        {isMajor && (
                          <span className="text-[8px] font-mono text-zinc-400 pl-0.5 leading-none mb-0.5">
                            {pxVal}
                          </span>
                        )}
                        <div
                          className={`w-px ${
                            isMajor
                              ? 'h-2.5 bg-zinc-400'
                              : isMid
                              ? 'h-1.5 bg-zinc-500/80'
                              : 'h-1 bg-zinc-600/60'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* WORKSPACE BODY: LEFT VERTICAL RULER + MAIN DOT-GRID CANVAS AREA    */}
          {/* ================================================================== */}
          <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* Left Vertical Ruler */}
        {settings.showCanvasRulers && (
          <div className="w-6 border-r border-zinc-800/80 bg-zinc-950/95 relative overflow-hidden flex flex-col items-center justify-center shrink-0 select-none z-20">
            <div
              className="relative w-full border-y border-blue-900/30 bg-zinc-900/25 transition-[height] duration-150"
              style={{ height: `${scaledH}px` }}
            >
              {/* Selected Object Vertical Highlight on Left Ruler */}
              {selTopPct !== null && selHeightPct !== null && (
                <div
                  className="absolute inset-x-0 bg-blue-900/20 border-y border-blue-900/80 pointer-events-none"
                  style={{
                    top: `${selTopPct}%`,
                    height: `${selHeightPct}%`,
                  }}
                />
              )}

              {verticalTicks.map((pxVal) => {
                const pct = (pxVal / dim.exportHeight) * 100;
                const isMajor = pxVal % 200 === 0;
                const isMid = pxVal % 100 === 0;
                return (
                  <div
                    key={pxVal}
                    className="absolute right-0 flex items-center justify-end pointer-events-none"
                    style={{ top: `${pct}%` }}
                  >
                    {isMajor && (
                      <span className="text-[7.5px] font-mono text-zinc-400 pr-0.5 leading-none [writing-mode:vertical-lr] rotate-180">
                        {pxVal}
                      </span>
                    )}
                    <div
                      className={`h-px ${
                        isMajor
                          ? 'w-2.5 bg-zinc-400'
                          : isMid
                          ? 'w-1.5 bg-zinc-500/80'
                          : 'w-1 bg-zinc-600/60'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Dot-Grid Canvas Stage Area */}
        <div
          ref={canvasContainerRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 relative overflow-auto flex flex-col items-center justify-between p-6 scroller transition-colors ${
            isPanningActive ? 'cursor-grab active:cursor-grabbing' : ''
          } ${
            isDraggingFileOver
              ? 'ring-2 ring-blue-500/80 bg-blue-950/20'
              : settings.showCanvasDotGrid
              ? workspaceDarkMode
                ? 'canvas-dot-grid-dark'
                : 'canvas-dot-grid-light'
              : workspaceDarkMode
              ? 'bg-[#071322]'
              : 'bg-[#f8fafc]'
          }`}
        >
          {/* Drag & Drop Visual Dropzone Overlay Banner */}
          {isDraggingFileOver && (
            <div className="absolute inset-4 z-50 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-950/75 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none transition-all shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-blue-900/60 border border-blue-400 flex items-center justify-center text-white mb-2 shadow-lg">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>
              <p className="text-sm font-semibold text-white tracking-wide">
                Lepaskan foto di sini untuk menambahkan ke slide
              </p>
              <p className="text-xs text-blue-200 mt-1">
                Format didukung: PNG, JPG, WEBP, SVG
              </p>
            </div>
          )}


          {/* Direct Feedback Toast for Background Removal */}
          {(isErasingBg || erasingError) && (
            <div className="sticky top-3 z-30 flex justify-center mb-3 pointer-events-none">
              <div className="px-3 py-1.5 rounded-full bg-zinc-950/95 border border-zinc-800 text-xs shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-auto animate-in fade-in slide-in-from-top-1 duration-200">
                {isErasingBg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span className="text-zinc-200 text-[11px] font-medium">
                      {erasingProgress || 'Sedang menghapus background...'}
                    </span>
                  </>
                ) : erasingError ? (
                  <div className="flex items-center gap-2 text-rose-400 text-[11px]">
                    <span>{erasingError}</span>
                    <button
                      type="button"
                      onClick={() => setErasingError(null)}
                      className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}

        {/* Scaled Wrapper around SlideStage */}
        {activeSlide && (
          <div
            className="relative shadow-[0_24px_70px_-15px_rgba(0,0,0,0.55)] ring-1 ring-black/15 my-auto will-change-[width,height] select-none"
            style={{
              width: `${scaledW}px`,
              height: `${scaledH}px`,
            }}
            onMouseMove={handleSlideMouseMove}
          >
            <SlideStage
              slide={activeSlide}
              slideIndex={activeSlideIndex}
              totalSlides={slides.length}
              aspectRatio={aspectRatio}
              theme={theme}
              branding={branding}
              scale={canvasZoom}
              interactive={!isViewer}
              selectedElementId={isViewer ? null : selectedElementId}
              onSelectElement={(id) => {
                if (isViewer) return;
                setSelectedElementId(id);
                multiplayerService.sendElementSelection(id, activeSlideIndex);
              }}
              onUpdateElement={isViewer ? () => {} : handleUpdateElement}
              onCommitHistory={isViewer ? () => {} : commitElementHistory}
              showSafeZoneOverlay={settings.showSafeZoneOverlay}
              safeZonePlatform={settings.safeZonePlatform}
            />

            {/* Multiplayer Remote Cursors & Peer Selections Layer */}
            <MultiplayerCursorsLayer
              activeSlideIndex={activeSlideIndex}
              slide={activeSlide}
              aspectRatio={aspectRatio}
              scale={canvasZoom}
            />

            {/* In-Canvas Pin Comments & Feedback Layer */}
            <CanvasCommentsLayer
              activeSlideIndex={activeSlideIndex}
              aspectRatio={aspectRatio}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  </div>

      {/* Bottom Slide Filmstrip */}
      <div className="h-32 border-t border-zinc-800/80 bg-zinc-950/95 px-4 py-2 flex items-center gap-3 overflow-x-auto scroller-dark shrink-0 z-20">
        {slides.map((s, idx) => {
          const isCurrent = idx === activeSlideIndex;
          return (
            <div
              key={s.id}
              onClick={() => setActiveSlideIndex(idx)}
              className={`group relative flex flex-col items-center shrink-0 cursor-pointer transition-transform ${
                isCurrent ? '-translate-y-0.5' : ' opacity-80 hover:opacity-100'
              }`}
            >
              {/* Mini Slide Preview Container */}
              <div
                className={`relative overflow-hidden rounded-sm transition-all ${
                  isCurrent
                    ? 'ring-2 ring-blue-900 shadow-md'
                    : 'ring-1 ring-zinc-800 hover:ring-zinc-600'
                }`}
                style={{
                  width: `${thumbW}px`,
                  height: `${thumbH}px`,
                }}
              >
                <div className="pointer-events-none">
                  <SlideStage
                    slide={s}
                    slideIndex={idx}
                    totalSlides={slides.length}
                    aspectRatio={aspectRatio}
                    theme={theme}
                    branding={branding}
                    scale={thumbScale}
                    interactive={false}
                  />
                </div>

                {/* Remote Collaborators on this slide thumbnail */}
                {(() => {
                  const peersOnThumb = multiplayerPeers.filter(
                    (p) => p.activeSlideIndex === idx
                  );
                  if (peersOnThumb.length === 0) return null;
                  return (
                    <div className="absolute top-1 right-1 flex items-center -space-x-1.5 z-10 pointer-events-none">
                      {peersOnThumb.map((p) => {
                        const preset = getAvatarPresetById(p.avatarId);
                        return (
                          <img
                            key={p.userId}
                            src={preset.svgDataUri}
                            alt={p.name}
                            title={`${p.name} sedang melihat slide ini`}
                            className="w-3.5 h-3.5 rounded-full ring-1 ring-white shadow-xs object-cover"
                            style={{ outline: `1.5px solid ${p.avatarColor || '#5E887E'}` }}
                          />
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Hover Quick Actions Bar on Thumbnail */}
                <div className="absolute inset-x-0 bottom-0 bg-zinc-950/85 backdrop-blur-xs py-0.5 px-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderSlide(idx, 'left');
                    }}
                    disabled={idx === 0}
                    title="Move Left"
                    className="p-0.5 text-zinc-300 hover:text-white disabled:opacity-25"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopySlideImage(e, idx)}
                    title={
                      copiedSlideIndex === idx
                        ? 'Gambar Berhasil Disalin!'
                        : 'Salin Gambar Slide (Siap Paste ke WhatsApp/Slack)'
                    }
                    className="p-0.5 text-zinc-300 hover:text-emerald-400"
                  >
                    {copiedSlideIndex === idx ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <ImageIcon className="w-2.5 h-2.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSlide(idx);
                    }}
                    title="Duplicate Slide"
                    className="p-0.5 text-zinc-300 hover:text-blue-900"
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSlide(idx);
                    }}
                    disabled={slides.length <= 1}
                    title="Delete Slide"
                    className="p-0.5 text-zinc-300 hover:text-red-400 disabled:opacity-25"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderSlide(idx, 'right');
                    }}
                    disabled={idx === slides.length - 1}
                    title="Move Right"
                    className="p-0.5 text-zinc-300 hover:text-white disabled:opacity-25"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Slide Number & Layout Tag */}
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={`text-[10px] font-mono ${
                    isCurrent ? 'text-blue-900 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
            </div>
          );
        })}

        {/* + Add Slide Button */}
        <button
          type="button"
          onClick={() => addSlide('editorial-dropcap')}
          style={{
            width: `${thumbW}px`,
            height: `${thumbH}px`,
          }}
          className="shrink-0 rounded-sm border border-dashed border-zinc-700 hover:border-blue-900/60 bg-zinc-900/40 hover:bg-zinc-900 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-blue-900 transition-colors cursor-pointer mb-4"
          title="Add New Editorial Slide"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[9.5px] font-medium">Add Slide</span>
        </button>
      </div>
    </main>
  );
};
