import { useEffect } from 'react';
import { SlideStage } from './components/canvas/SlideStage';
import { TemplateGalleryPage } from './components/gallery/TemplateGalleryPage';
import { ThemeBuilderPage } from './components/builder/ThemeBuilderPage';
import { TeamWorkspacePage } from './components/team/TeamWorkspacePage';
import { CenterWorkspace } from './components/layout/CenterWorkspace';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightInspector } from './components/layout/RightInspector';
import { TopHeaderBar } from './components/layout/TopHeaderBar';
import { StudioModals } from './components/modals/StudioModals';
import { UpdateNotifier } from './components/modals/UpdateNotifier';
import { DesktopUpdateModal } from './components/modals/DesktopUpdateModal';
import { LocalFontAccessModal } from './components/modals/LocalFontAccessModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { isDesktopApp } from './utils/platform';
import { scanComputerFonts } from './services/fontManager';
import { fetchCloudStudioData } from './services/supabaseTemplates';
import { useStudioStore } from './store/useStudioStore';

function matchesHotkey(e: KeyboardEvent, combo: string): boolean {
  if (!combo) return false;
  const parts = combo.split('+').map((p) => p.trim().toLowerCase());
  const wantsMod = parts.includes('mod') || parts.includes('cmd') || parts.includes('ctrl');
  const wantsShift = parts.includes('shift');
  const wantsAlt = parts.includes('alt');
  const mainKey = parts.find(
    (p) => !['mod', 'cmd', 'ctrl', 'shift', 'alt'].includes(p)
  );
  if (!mainKey) return false;

  const hasMod = e.metaKey || e.ctrlKey;
  if (wantsMod !== hasMod) return false;
  if (wantsShift !== e.shiftKey) return false;
  if (wantsAlt !== e.altKey) return false;

  const pressedKey = e.key === ' ' ? 'space' : e.key.toLowerCase();
  if (mainKey === 'backspace' && (pressedKey === 'backspace' || pressedKey === 'delete')) {
    return true;
  }
  return pressedKey === mainKey;
}

export function App() {
  const {
    slides,
    activeSlideIndex,
    setActiveSlideIndex,
    aspectRatio,
    getActiveTheme,
    branding,
    selectedElementId,
    deleteElement,
    duplicateElement,
    activeView,
    setActiveView,
    setActiveModal,
    workspaceDarkMode,
    addBatchLocalFonts,
    undo,
    redo,
    saveCurrentProjectToVault,
    openBlankDocumentTab,
    settings,
    updateSettings,
    setCloudMasterTemplates,
  } = useStudioStore();

  const theme = getActiveTheme();

  // Keep browser document title synced with Studio Name
  useEffect(() => {
    if (settings.studioName) {
      document.title = settings.studioName;
    }
  }, [settings.studioName]);

  // Sync Cloud Master Templates & Global Studio Config (Admin Credentials, Studio Name) on mount
  useEffect(() => {
    let active = true;
    fetchCloudStudioData().then((res) => {
      if (!active) return;
      if (res.masterTemplates.length > 0) {
        setCloudMasterTemplates(res.masterTemplates);
      }
      if (res.config?.studioName) {
        updateSettings({
          studioName: res.config.studioName,
          studioSubtitle:
            res.config.studioSubtitle || settings.studioSubtitle,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [setCloudMasterTemplates, updateSettings]);

  // Automatically detect installed computer fonts on mount & on first user interaction
  useEffect(() => {
    let mounted = true;
    scanComputerFonts().then((res) => {
      if (mounted && res.families.length > 0) {
        addBatchLocalFonts(res.families);
      }
    });

    const triggerFullLocalFontScanOnce = () => {
      scanComputerFonts().then((res) => {
        if (mounted && res.families.length > 0) {
          addBatchLocalFonts(res.families);
        }
      });
      window.removeEventListener('pointerdown', triggerFullLocalFontScanOnce);
    };

    window.addEventListener('pointerdown', triggerFullLocalFontScanOnce, {
      once: true,
    });

    return () => {
      mounted = false;
      window.removeEventListener('pointerdown', triggerFullLocalFontScanOnce);
    };
  }, [addBatchLocalFonts]);

  // Global Customizable Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const hk = settings.hotkeys;

      // Open Settings shortcut works everywhere unless typing in an input
      if (!isInput && matchesHotkey(e, hk.openSettings)) {
        e.preventDefault();
        setActiveModal('settings');
        return;
      }

      if (!isInput && matchesHotkey(e, hk.saveProject)) {
        e.preventDefault();
        saveCurrentProjectToVault();
        return;
      }

      if (!isInput && matchesHotkey(e, hk.exportModal)) {
        e.preventDefault();
        setActiveModal('export');
        return;
      }

      if (!isInput && matchesHotkey(e, hk.newTab)) {
        e.preventDefault();
        openBlankDocumentTab(aspectRatio);
        setActiveView('editor');
        return;
      }

      if (!isInput && matchesHotkey(e, hk.redo)) {
        e.preventDefault();
        redo();
        return;
      }

      if (!isInput && matchesHotkey(e, hk.undo)) {
        e.preventDefault();
        undo();
        return;
      }

      if (!isInput && selectedElementId && matchesHotkey(e, hk.duplicateElement)) {
        e.preventDefault();
        duplicateElement(selectedElementId);
        return;
      }

      if (!isInput && selectedElementId && matchesHotkey(e, hk.deleteElement)) {
        e.preventDefault();
        deleteElement(selectedElementId);
        return;
      }

      if (!isInput && activeView === 'editor' && matchesHotkey(e, hk.prevSlide)) {
        e.preventDefault();
        setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
        return;
      }

      if (!isInput && activeView === 'editor' && matchesHotkey(e, hk.nextSlide)) {
        e.preventDefault();
        setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    settings.hotkeys,
    selectedElementId,
    deleteElement,
    duplicateElement,
    undo,
    redo,
    saveCurrentProjectToVault,
    openBlankDocumentTab,
    aspectRatio,
    setActiveView,
    setActiveModal,
    activeView,
    activeSlideIndex,
    setActiveSlideIndex,
    slides.length,
  ]);

  return (
    <ErrorBoundary fallbackTitle="Terjadi Masalah pada Tampilan Studio">
      <div
        className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-200 ${
          workspaceDarkMode
            ? 'studio-theme-dark bg-[#0A1A2F] text-slate-100'
            : 'studio-theme-light bg-white text-slate-900'
        }`}
      >
        {/* Main View Switcher: Full-Screen Studio Home Hub vs 3-Column Studio Editor vs Theme Builder vs Team Workspace */}
        {activeView === 'gallery' ? (
          <TemplateGalleryPage />
        ) : activeView === 'theme-builder' ? (
          <ThemeBuilderPage />
        ) : activeView === 'team' ? (
          <TeamWorkspacePage />
        ) : (
          <>
            <TopHeaderBar />
            <div className="flex-1 flex min-h-0 overflow-hidden">
              <LeftSidebar />
              <CenterWorkspace />
              <RightInspector />
            </div>
          </>
        )}

        {/* Quick Modals (Global Branding, JSON Import/Export, Supabase Sync, Local & Custom Fonts) */}
        <StudioModals />

        {/* Local Computer Fonts Access & Permission Modal (Prompt on launch) */}
        <LocalFontAccessModal />

        {/* Update Detector: In-App Desktop Updater for Electron, Web Deploy Notifier for Browser */}
        {isDesktopApp() ? (
          <DesktopUpdateModal />
        ) : (
          <UpdateNotifier darkMode={workspaceDarkMode} />
        )}

        {/* Offscreen 1:1 Stage Renderer for Batch HD (.ZIP) Export */}
        <div
          id="offscreen-export-stage"
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            pointerEvents: 'none',
            opacity: 1,
          }}
        >
          {slides.map((slide, idx) => (
            <SlideStage
              key={slide.id}
              exportId={`export-slide-node-${idx}`}
              slide={slide}
              slideIndex={idx}
              totalSlides={slides.length}
              aspectRatio={aspectRatio}
              theme={theme}
              branding={branding}
              scale={1}
              interactive={false}
            />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
