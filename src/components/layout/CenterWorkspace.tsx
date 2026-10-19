import React, { useState } from 'react';
import {
  Blend,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  FolderOpen,
  Plus,
  Save,
  Scaling,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import {
  ASPECT_RATIOS,
  THEME_PALETTES,
} from '../../constants/themesAndPresets';
import { useStudioStore } from '../../store/useStudioStore';
import type { AspectRatioKey } from '../../types/studio';
import { SlideStage } from '../canvas/SlideStage';

export const CenterWorkspace: React.FC = () => {
  const {
    projectTitle,
    slides,
    activeSlideIndex,
    setActiveSlideIndex,
    aspectRatio,
    setAspectRatio,
    activeThemeId,
    setActiveTheme,
    getActiveTheme,
    branding,
    canvasZoom,
    workspaceDarkMode,
    selectedElementId,
    setSelectedElementId,
    getSelectedElement,
    updateElement,
    alignElementOnCanvas,
    setSlideBackgroundColor,
    commitElementHistory,
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
  } = useStudioStore();

  const [justSaved, setJustSaved] = useState(false);
  const [activePopover, setActivePopover] = useState<
    'resize' | 'transparent' | 'color' | null
  >(null);

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

  // Determine active color for the object color indicator
  const currentObjectColor = (() => {
    if (!selectedElement) {
      return activeSlide?.backgroundColor || theme.background;
    }
    if (selectedElement.type === 'text' || selectedElement.type === 'badge') {
      return selectedElement.color || theme.textPrimary;
    }
    if (selectedElement.type === 'divider') {
      return selectedElement.color || theme.divider;
    }
    return selectedElement.borderColor || theme.accent;
  })();

  const handleObjectColorChange = (nextColor: string) => {
    if (!selectedElement) {
      setSlideBackgroundColor(activeSlideIndex, nextColor);
      return;
    }
    if (
      selectedElement.type === 'text' ||
      selectedElement.type === 'badge' ||
      selectedElement.type === 'divider'
    ) {
      updateElement(selectedElement.id, { color: nextColor }, true);
    } else if (selectedElement.type === 'image') {
      updateElement(
        selectedElement.id,
        {
          borderColor: nextColor,
          borderWidth: Math.max(selectedElement.borderWidth || 0, 2),
        },
        true
      );
    }
  };

  const currentOpacity = selectedElement ? selectedElement.opacity : 1;

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
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedElementId(null);
              setActivePopover(null);
            }
          }}
          className={`flex-1 relative overflow-auto flex flex-col items-center justify-between p-6 scroller ${
            settings.showCanvasDotGrid
              ? workspaceDarkMode
                ? 'canvas-dot-grid-dark'
                : 'canvas-dot-grid-light'
              : workspaceDarkMode
              ? 'bg-[#090d16]'
              : 'bg-[#f8fafc]'
          }`}
        >
          {/* Top Floating Icon-Only Quick Action Pill (Positioned cleanly below Top Ruler) */}
          <div className="sticky top-0 z-30 flex flex-col items-center mb-3">
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border shadow-md backdrop-blur-md ${
                workspaceDarkMode
                  ? 'bg-zinc-900/90 border-zinc-800 text-zinc-200'
                  : 'bg-white/95 border-zinc-300 text-zinc-700'
              }`}
            >
              {/* Previous Slide */}
              <button
                type="button"
                onClick={() =>
                  setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))
                }
                disabled={activeSlideIndex === 0}
                className="p-1.5 rounded-full hover:bg-zinc-800/60 disabled:opacity-30 cursor-pointer transition-colors"
                title={`Slide Sebelumnya (${activeSlideIndex + 1}/${slides.length})`}
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-zinc-800/80 mx-0.5" />

            {/* 1. Script Auto-Generator Icon */}
            <button
              type="button"
              onClick={() => {
                setActivePopover(null);
                setActiveModal('script');
              }}
              title="Script Auto-Generator"
              aria-label="Script Auto-Generator"
              className="p-1.5 rounded-full hover:bg-zinc-800/70 text-blue-900 hover:text-blue-800 cursor-pointer transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>

            {/* 2. Save Project Icon */}
            <button
              type="button"
              onClick={handleQuickSave}
              title={
                lastSavedAt
                  ? `Simpan Project (Terakhir: ${lastSavedAt})`
                  : 'Simpan Project'
              }
              aria-label="Simpan Project"
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                justSaved
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-zinc-800/70 text-zinc-300 hover:text-blue-900'
              }`}
            >
              {justSaved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
            </button>

            {/* 3. Resize Canvas & Object Icon */}
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === 'resize' ? null : 'resize')
              }
              title={`Resize Canvas (${ASPECT_RATIOS[aspectRatio].shortLabel}) & Object`}
              aria-label="Resize Canvas and Object"
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                activePopover === 'resize'
                  ? 'bg-blue-900/15 text-blue-900'
                  : 'hover:bg-zinc-800/70 text-zinc-300 hover:text-blue-900'
              }`}
            >
              <Scaling className="w-3.5 h-3.5" />
            </button>

            {/* 4. Transparent / Opacity Icon */}
            <button
              type="button"
              onClick={() =>
                setActivePopover(
                  activePopover === 'transparent' ? null : 'transparent'
                )
              }
              title={`Transparansi / Opacity (${Math.round(currentOpacity * 100)}%)`}
              aria-label="Transparency and Opacity"
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                activePopover === 'transparent' || currentOpacity < 1
                  ? 'bg-blue-900/15 text-blue-900'
                  : 'hover:bg-zinc-800/70 text-zinc-300 hover:text-blue-900'
              }`}
            >
              <Blend className="w-3.5 h-3.5" />
            </button>

            {/* 5. Indikator Ganti Warna Object */}
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === 'color' ? null : 'color')
              }
              title={
                selectedElement
                  ? `Ganti Warna ${selectedElement.name} (${currentObjectColor})`
                  : `Ganti Warna Background Slide (${currentObjectColor})`
              }
              aria-label="Object Color Indicator"
              className={`p-1 rounded-full cursor-pointer transition-all flex items-center justify-center ${
                activePopover === 'color'
                  ? 'ring-2 ring-blue-900 bg-zinc-800/60'
                  : 'hover:bg-zinc-800/70'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-zinc-400/60 shadow-xs block"
                style={{ backgroundColor: currentObjectColor }}
              />
            </button>

            <div className="w-px h-4 bg-zinc-800/80 mx-0.5" />

            {/* Next Slide */}
            <button
              type="button"
              onClick={() =>
                setActiveSlideIndex(
                  Math.min(slides.length - 1, activeSlideIndex + 1)
                )
              }
              disabled={activeSlideIndex === slides.length - 1}
              className="p-1.5 rounded-full hover:bg-zinc-800/60 disabled:opacity-30 cursor-pointer transition-colors"
              title={`Slide Berikutnya (${activeSlideIndex + 1}/${slides.length})`}
              aria-label="Next Slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* POPOVER 1: RESIZE CANVAS & OBJECT */}
          {activePopover === 'resize' && (
            <div className="mt-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-xl backdrop-blur-md w-56 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                <span>Ukuran Canvas (Resize)</span>
                <span className="font-mono text-[9.5px]">
                  {dim.exportWidth}×{dim.exportHeight}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((key) => {
                  const cfg = ASPECT_RATIOS[key];
                  const active = aspectRatio === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAspectRatio(key)}
                      className={`py-1.5 px-1.5 rounded-lg border text-[10px] font-medium cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {cfg.shortLabel}
                    </button>
                  );
                })}
              </div>

              {selectedElement && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <span className="text-[10px] text-zinc-400 block">
                    Resize Object ({selectedElement.name})
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(
                          selectedElement.id,
                          {
                            width: Math.max(
                              20,
                              Math.round(selectedElement.width * 0.9)
                            ),
                            height: Math.max(
                              10,
                              Math.round(selectedElement.height * 0.9)
                            ),
                          },
                          true
                        )
                      }
                      title="Perkecil Object -10%"
                      className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono text-zinc-300 cursor-pointer"
                    >
                      -10%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(
                          selectedElement.id,
                          {
                            width: Math.round(selectedElement.width * 1.1),
                            height: Math.round(selectedElement.height * 1.1),
                          },
                          true
                        )
                      }
                      title="Perbesar Object +10%"
                      className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono text-zinc-300 cursor-pointer"
                    >
                      +10%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        alignElementOnCanvas(selectedElement.id, 'fit-margin')
                      }
                      title="Fit ke Margin"
                      className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 cursor-pointer"
                    >
                      Margin
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        alignElementOnCanvas(selectedElement.id, 'fit-canvas')
                      }
                      title="Full Bleed Canvas"
                      className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 cursor-pointer"
                    >
                      Full
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* POPOVER 2: TRANSPARENT / OPACITY */}
          {activePopover === 'transparent' && (
            <div className="mt-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-xl backdrop-blur-md w-56 space-y-2 text-xs">
              {selectedElement ? (
                <>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="truncate max-w-[140px]">
                      Transparansi ({selectedElement.name})
                    </span>
                    <span className="font-mono text-blue-900 font-semibold">
                      {Math.round(selectedElement.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedElement.opacity}
                    onChange={(e) =>
                      updateElement(
                        selectedElement.id,
                        { opacity: Number(e.target.value) },
                        false
                      )
                    }
                    className="w-full accent-blue-900 cursor-pointer"
                  />
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { label: '0%', val: 0 },
                      { label: '25%', val: 0.25 },
                      { label: '50%', val: 0.5 },
                      { label: '75%', val: 0.75 },
                      { label: '100%', val: 1 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          updateElement(
                            selectedElement.id,
                            { opacity: preset.val },
                            true
                          )
                        }
                        className={`py-1 rounded border text-[9.5px] font-mono cursor-pointer ${
                          Math.abs(selectedElement.opacity - preset.val) < 0.03
                            ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  {(selectedElement.type === 'text' ||
                    selectedElement.type === 'badge') && (
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(
                          selectedElement.id,
                          { backgroundColor: 'transparent' },
                          true
                        )
                      }
                      className="w-full py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 cursor-pointer"
                    >
                      Set Background Box Transparan
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 block">
                    Pilih objek di canvas untuk mengatur tingkat transparansi
                    objek, atau reset background slide:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSlideBackgroundColor(
                        activeSlideIndex,
                        theme.background
                      )
                    }
                    className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-200 cursor-pointer"
                  >
                    Reset ke Warna Kertas Default Theme
                  </button>
                </div>
              )}
            </div>
          )}

          {/* POPOVER 3: INDIKATOR GANTI WARNA OBJECT & THEME */}
          {activePopover === 'color' && (
            <div className="mt-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-xl backdrop-blur-md w-60 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="truncate">
                  {selectedElement
                    ? `Warna: ${selectedElement.name}`
                    : 'Warna Background Slide'}
                </span>
                <span className="font-mono text-[9.5px]">
                  {currentObjectColor}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    currentObjectColor.startsWith('#')
                      ? currentObjectColor
                      : '#1C1917'
                  }
                  onChange={(e) => handleObjectColorChange(e.target.value)}
                  aria-label="Color Picker"
                  className="w-7 h-7 rounded-lg cursor-pointer bg-zinc-900 border border-zinc-700 p-0.5 shrink-0"
                />
                <input
                  type="text"
                  value={currentObjectColor}
                  onChange={(e) => handleObjectColorChange(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-100 focus:outline-none"
                />
              </div>

              {/* Quick Editorial Swatches */}
              <div className="grid grid-cols-8 gap-1">
                {[
                  theme.textPrimary,
                  theme.textSecondary,
                  theme.accent,
                  theme.background,
                  theme.surface,
                  theme.darkBackground,
                  '#FFFFFF',
                  '#090F1E',
                ].map((swatch, idx) => (
                  <button
                    key={`${swatch}-${idx}`}
                    type="button"
                    onClick={() => handleObjectColorChange(swatch)}
                    title={swatch}
                    className="w-5 h-5 rounded-full border border-zinc-700 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>

              {/* Global Theme Palette Quick Dots */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Theme Global</span>
                <div className="flex items-center gap-1.5">
                  {THEME_PALETTES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTheme(t.id)}
                      title={t.name}
                      className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                        activeThemeId === t.id
                          ? 'scale-115 border-blue-900 ring-1 ring-blue-900/50'
                          : 'border-zinc-700 opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: t.background }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scaled Wrapper around SlideStage */}
        {activeSlide && (
          <div
            className="relative shadow-[0_24px_70px_-15px_rgba(0,0,0,0.55)] ring-1 ring-black/15 transition-[width,height] duration-150 my-auto"
            style={{
              width: `${scaledW}px`,
              height: `${scaledH}px`,
            }}
          >
            <SlideStage
              slide={activeSlide}
              slideIndex={activeSlideIndex}
              totalSlides={slides.length}
              aspectRatio={aspectRatio}
              theme={theme}
              branding={branding}
              scale={canvasZoom}
              interactive={true}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={updateElement}
              onCommitHistory={commitElementHistory}
            />
          </div>
        )}
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
