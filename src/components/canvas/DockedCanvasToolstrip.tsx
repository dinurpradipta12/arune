import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer2,
  Hand,
  Type,
  Shapes,
  Square,
  Circle,
  Pill,
  Triangle,
  Star,
  Diamond,
  Hexagon,
  Heart,
  ArrowRight,
  Minus,
  ImagePlus,
  Eraser,
  Crop,
  Blend,
  Scaling,
  MessageSquare,
  Wand2,
  Save,
  Check,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { ASPECT_RATIOS, THEME_PALETTES } from '../../constants/themesAndPresets';
import type { AspectRatioKey, ShapeKind } from '../../types/studio';
import { trimTransparentImage } from '../../services/backgroundRemoval';

export type CanvasToolMode = 'select' | 'hand';

export type ToolFlyoutType = 'shapes' | 'crop' | 'transparent' | 'color' | 'resize' | null;

export interface DockedCanvasToolstripProps {
  activeTool: CanvasToolMode;
  setActiveTool: (tool: CanvasToolMode) => void;
  onTriggerImageUpload: () => void;
  onTriggerEraser: () => void;
  onRevertEraser: () => void;
  isErasingBg?: boolean;
  erasingProgress?: string;
  onOpenScriptModal?: () => void;
  onQuickSave?: () => void;
  justSaved?: boolean;
  lastSavedAt?: string | null;
}

interface ShapePresetOption {
  id: ShapeKind;
  label: string;
  defaultRadius?: number;
  icon: React.ReactNode;
}

const SHAPE_PRESETS: ShapePresetOption[] = [
  {
    id: 'rectangle',
    label: 'Kotak (Rect)',
    defaultRadius: 0,
    icon: <Square className="w-3.5 h-3.5" />,
  },
  {
    id: 'rounded-rect',
    label: 'Rounded',
    defaultRadius: 16,
    icon: <Square className="w-3.5 h-3.5 rounded-sm" />,
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: <Circle className="w-3.5 h-3.5" />,
  },
  {
    id: 'pill',
    label: 'Pill',
    icon: <Pill className="w-3.5 h-3.5" />,
  },
  {
    id: 'triangle',
    label: 'Triangle',
    icon: <Triangle className="w-3.5 h-3.5" />,
  },
  {
    id: 'star',
    label: 'Bintang',
    icon: <Star className="w-3.5 h-3.5" />,
  },
  {
    id: 'diamond',
    label: 'Diamond',
    icon: <Diamond className="w-3.5 h-3.5" />,
  },
  {
    id: 'polygon',
    label: 'Hexagon',
    icon: <Hexagon className="w-3.5 h-3.5" />,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: <ArrowRight className="w-3.5 h-3.5" />,
  },
  {
    id: 'heart',
    label: 'Heart',
    icon: <Heart className="w-3.5 h-3.5" />,
  },
];

const RADIUS_CHIPS = [
  { label: '0px', value: 0 },
  { label: '8px', value: 8 },
  { label: '16px', value: 16 },
  { label: '24px', value: 24 },
  { label: '36px', value: 36 },
  { label: '50px', value: 50 },
];

export const DockedCanvasToolstrip: React.FC<DockedCanvasToolstripProps> = ({
  activeTool,
  setActiveTool,
  onTriggerImageUpload,
  onTriggerEraser,
  onRevertEraser,
  isErasingBg = false,
  erasingProgress,
  onOpenScriptModal,
  onQuickSave,
  justSaved = false,
  lastSavedAt,
}) => {
  const {
    addElement,
    updateElement,
    getSelectedElement,
    getActiveTheme,
    activeThemeId,
    setActiveTheme,
    setSlideBackgroundColor,
    commitElementHistory,
    alignElementOnCanvas,
    aspectRatio,
    setAspectRatio,
    comments,
    isCommentMode,
    setCommentMode,
    activeSlideIndex,
    slides,
  } = useStudioStore();

  const theme = getActiveTheme();
  const selectedElement = getSelectedElement();
  const isImageSelected = selectedElement?.type === 'image';
  const activeSlide = slides[activeSlideIndex] || slides[0];
  const dim = ASPECT_RATIOS[aspectRatio];

  // Active flyout menu state
  const [activeFlyout, setActiveFlyout] = useState<ToolFlyoutType>(null);

  // Shape creation state
  const [activeShapeKind, setActiveShapeKind] = useState<ShapeKind>('rounded-rect');
  const [shapeRadius, setShapeRadius] = useState<number>(16);
  const [shapeFillColor, setShapeFillColor] = useState<string>(theme.accent || '#3b82f6');

  const containerRef = useRef<HTMLDivElement>(null);

  // Close flyouts when clicking outside the entire toolbar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveFlyout(null);
      }
    };
    if (activeFlyout) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFlyout]);

  // Keep shape color in sync with theme changes
  useEffect(() => {
    if (theme.accent) {
      setShapeFillColor(theme.accent);
    }
  }, [theme.accent]);

  const toggleFlyout = (flyout: ToolFlyoutType) => {
    setActiveFlyout(activeFlyout === flyout ? null : flyout);
  };

  const handleSelectShapePreset = (preset: ShapePresetOption) => {
    setActiveShapeKind(preset.id);
    if (preset.defaultRadius !== undefined) {
      setShapeRadius(preset.defaultRadius);
    } else if (preset.id === 'circle' || preset.id === 'pill') {
      setShapeRadius(9999);
    } else {
      setShapeRadius(0);
    }
  };

  const handleInsertShape = () => {
    let finalRadius = shapeRadius;
    if (activeShapeKind === 'circle' || activeShapeKind === 'pill') {
      finalRadius = 9999;
    } else if (activeShapeKind !== 'rectangle' && activeShapeKind !== 'rounded-rect') {
      finalRadius = 0;
    }

    addElement('shape', {
      shapeKind: activeShapeKind,
      borderRadius: finalRadius,
      fillColor: shapeFillColor,
      name:
        activeShapeKind === 'rounded-rect'
          ? 'Rounded Rectangle'
          : `${activeShapeKind.charAt(0).toUpperCase() + activeShapeKind.slice(1)} Shape`,
    });

    setActiveFlyout(null);
    setActiveTool('select');
  };

  // Determine active object color
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
    if (selectedElement.type === 'shape') {
      return selectedElement.fillColor || theme.accent;
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
    } else if (selectedElement.type === 'shape') {
      updateElement(selectedElement.id, { fillColor: nextColor }, true);
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

  const isRadiusConfigurable =
    activeShapeKind === 'rectangle' || activeShapeKind === 'rounded-rect';

  const unresolvedCommentsCount = comments.filter((c) => !c.isResolved).length;

  return (
    <div
      ref={containerRef}
      className="w-9 border-r border-zinc-800/80 bg-zinc-950 flex flex-col items-center py-2 px-1 gap-1 shrink-0 z-30 select-none relative"
      aria-label="Adobe Photoshop Style Canvas Toolstrip"
    >
      {/* 1. Move / Select Tool (V) */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => {
            setActiveTool('select');
            setActiveFlyout(null);
          }}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
            activeTool === 'select'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
          }`}
          title="Move / Select Tool (V)"
          aria-label="Select Tool"
        >
          <MousePointer2 className="w-3.5 h-3.5" />
        </button>
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
          Move Tool <span className="text-zinc-400 font-mono text-[9px]">V</span>
        </span>
      </div>

      {/* 2. Hand / Pan Canvas Tool (H) */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => {
            setActiveTool('hand');
            setActiveFlyout(null);
          }}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
            activeTool === 'hand'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
          }`}
          title="Hand / Pan Canvas Tool (H / Space)"
          aria-label="Hand Tool"
        >
          <Hand className="w-3.5 h-3.5" />
        </button>
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
          Pan Tool <span className="text-zinc-400 font-mono text-[9px]">H / Space</span>
        </span>
      </div>

      <div className="w-4 h-px bg-zinc-800/80 my-0.5" />

      {/* 3. Text Tool (T) */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => {
            addElement('text');
            setActiveTool('select');
            setActiveFlyout(null);
          }}
          className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-all cursor-pointer"
          title="Tambah Teks (T)"
          aria-label="Text Tool"
        >
          <Type className="w-3.5 h-3.5" />
        </button>
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
          Tambah Teks <span className="text-zinc-400 font-mono text-[9px]">T</span>
        </span>
      </div>

      {/* 4. Shapes & Radius Tool (R) with Flyout */}
      <div className="relative">
        <div className="relative group">
          <button
            type="button"
            onClick={() => toggleFlyout('shapes')}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              activeFlyout === 'shapes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
            }`}
            title="Koleksi Bentuk / Shapes & Radius (R)"
            aria-label="Shape Tool"
          >
            <Shapes className="w-3.5 h-3.5" />
          </button>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
            Shapes & Radius <span className="text-zinc-400 font-mono text-[9px]">R</span>
          </span>
        </div>

        {/* Shape Flyout Modal */}
        {activeFlyout === 'shapes' && (
          <div className="absolute left-full ml-2 -top-2 w-76 rounded-2xl bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-left-2 duration-150 max-h-[85vh] overflow-y-auto scroller-dark">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                  <Shapes className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">Bentuk & Geometri</h4>
                  <p className="text-[10px] text-zinc-400">10 bentuk dengan radius kustom</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFlyout(null)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shape Grid */}
            <div className="mb-2.5">
              <span className="text-[10.5px] font-medium text-zinc-400 block mb-1.5">Pilihan Bentuk</span>
              <div className="grid grid-cols-5 gap-1">
                {SHAPE_PRESETS.map((preset) => {
                  const isSelected = activeShapeKind === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectShapePreset(preset)}
                      className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-lg border text-[9px] cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-xs'
                          : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {preset.icon}
                      <span className="truncate max-w-[42px] leading-tight mt-0.5">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Radius Slider */}
            {isRadiusConfigurable && (
              <div className="mb-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-zinc-400">Corner Radius</span>
                  <span className="font-mono text-blue-400 font-semibold">{shapeRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={shapeRadius}
                  onChange={(e) => setShapeRadius(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {RADIUS_CHIPS.map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setShapeRadius(chip.value)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer ${
                        shapeRadius === chip.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shape Color Picker */}
            <div className="mb-3 flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[10.5px]">
              <span className="text-zinc-400">Warna Isi</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={shapeFillColor}
                  onChange={(e) => setShapeFillColor(e.target.value)}
                  className="w-20 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700 font-mono text-[10px] text-zinc-100"
                />
                <input
                  type="color"
                  value={shapeFillColor.startsWith('#') ? shapeFillColor : '#3b82f6'}
                  onChange={(e) => setShapeFillColor(e.target.value)}
                  aria-label="Pilih Warna Isi"
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            {/* Insert Button */}
            <button
              type="button"
              onClick={handleInsertShape}
              className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sisipkan ke Kanvas</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Add Photo Tool */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => {
            onTriggerImageUpload();
            setActiveTool('select');
            setActiveFlyout(null);
          }}
          className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-all cursor-pointer"
          title="Upload Foto / Gambar (atau Paste Ctrl+V)"
          aria-label="Add Photo"
        >
          <ImagePlus className="w-3.5 h-3.5" />
        </button>
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
          Upload Foto
        </span>
      </div>

      {/* 6. Divider Line Tool */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => {
            addElement('divider');
            setActiveTool('select');
            setActiveFlyout(null);
          }}
          className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-all cursor-pointer"
          title="Tambah Garis / Divider"
          aria-label="Divider Tool"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
          Garis Divider
        </span>
      </div>

      <div className="w-4 h-px bg-zinc-800/80 my-0.5" />

      {/* 7. AI Background Eraser Tool */}
      <div className="relative group">
        <button
          type="button"
          disabled={isErasingBg || !isImageSelected}
          onClick={() => {
            if (isErasingBg || !selectedElement || selectedElement.type !== 'image') return;
            if (selectedElement.originalSrc) {
              onRevertEraser();
            } else {
              onTriggerEraser();
            }
          }}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all relative ${
            isErasingBg
              ? 'bg-blue-600/20 text-blue-400 cursor-wait'
              : isImageSelected
              ? selectedElement?.originalSrc
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer shadow-xs'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 cursor-pointer'
              : 'text-zinc-600 cursor-not-allowed opacity-40'
          }`}
          title={
            isErasingBg
              ? erasingProgress || 'Sedang menghapus background...'
              : isImageSelected
              ? selectedElement?.originalSrc
                ? 'Kembalikan Foto Asli (Background sudah dihapus)'
                : 'Hapus Background Foto (1-Klik AI)'
              : 'Pilih foto di canvas terlebih dahulu untuk menghapus background'
          }
          aria-label="AI Eraser"
        >
          {isErasingBg ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Eraser className="w-3.5 h-3.5" />
          )}
          {isImageSelected && selectedElement?.originalSrc && !isErasingBg && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
          )}
        </button>
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
          {isImageSelected
            ? selectedElement?.originalSrc
              ? 'Kembalikan Foto Asli'
              : 'AI Magic Eraser'
            : 'Pilih Foto Dahulu'}
        </span>
      </div>

      {/* 8. Crop & Trim Tool with Flyout */}
      <div className="relative">
        <div className="relative group">
          <button
            type="button"
            disabled={!isImageSelected}
            onClick={() => toggleFlyout('crop')}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
              activeFlyout === 'crop'
                ? 'bg-blue-600 text-white shadow-xs'
                : isImageSelected
                ? 'text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer'
                : 'text-zinc-600 cursor-not-allowed opacity-40'
            }`}
            title={
              isImageSelected
                ? 'Crop / Potong Bounding Box Foto'
                : 'Pilih foto di kanvas untuk memotong (crop)'
            }
            aria-label="Crop Tool"
          >
            <Crop className="w-3.5 h-3.5" />
          </button>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
            {isImageSelected ? 'Crop & Trim Bounding Box' : 'Pilih Foto Dahulu'}
          </span>
        </div>

        {/* Crop Flyout */}
        {activeFlyout === 'crop' && isImageSelected && selectedElement && (
          <div className="absolute left-full ml-2 -top-16 w-72 rounded-2xl bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-left-2 duration-150 space-y-2.5 max-h-[85vh] overflow-y-auto scroller-dark text-xs text-zinc-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Crop className="w-3.5 h-3.5 text-blue-400" />
                <span>Potong Bounding Box</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    commitElementHistory();
                    const trimmed = await trimTransparentImage(selectedElement.src);
                    const curCenterX = selectedElement.x + selectedElement.width / 2;
                    const curCenterY = selectedElement.y + selectedElement.height / 2;
                    let nextW = selectedElement.width;
                    let nextH = selectedElement.height;
                    if (trimmed.width > 0 && trimmed.height > 0) {
                      const ratio = trimmed.width / trimmed.height;
                      if (ratio >= 1) {
                        nextW = Math.round(Math.min(selectedElement.width, selectedElement.height * ratio));
                        nextH = Math.round(nextW / ratio);
                      } else {
                        nextH = Math.round(Math.min(selectedElement.height, selectedElement.width / ratio));
                        nextW = Math.round(nextH * ratio);
                      }
                      nextW = Math.max(36, nextW);
                      nextH = Math.max(36, nextH);
                    }
                    const nextX = Math.round(curCenterX - nextW / 2);
                    const nextY = Math.round(curCenterY - nextH / 2);
                    updateElement(
                      selectedElement.id,
                      {
                        src: trimmed.dataUrl,
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
                  } catch (err) {
                    console.error('Trim error:', err);
                  }
                }}
                title="Pangkas Bounding Box Kosong (Auto-Trim Transparan)"
                className="text-[9.5px] px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer transition-colors shadow-xs"
              >
                ⚡ Auto-Fit Box
              </button>
            </div>

            {/* 4-Edge Crop Sliders */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px] font-medium text-zinc-400">
                <span>Potong Tepi Foto</span>
                <button
                  type="button"
                  onClick={() =>
                    updateElement(
                      selectedElement.id,
                      {
                        cropTop: 0,
                        cropBottom: 0,
                        cropLeft: 0,
                        cropRight: 0,
                      },
                      true
                    )
                  }
                  className="text-[9.5px] text-blue-400 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
                {(
                  [
                    { k: 'cropLeft', label: 'Kiri', val: selectedElement.cropLeft || 0 },
                    { k: 'cropRight', label: 'Kanan', val: selectedElement.cropRight || 0 },
                    { k: 'cropTop', label: 'Atas', val: selectedElement.cropTop || 0 },
                    { k: 'cropBottom', label: 'Bawah', val: selectedElement.cropBottom || 0 },
                  ] as const
                ).map((c) => (
                  <div key={c.k}>
                    <div className="flex justify-between text-[9px] text-zinc-400">
                      <span>{c.label}</span>
                      <span className="font-mono text-blue-400 font-semibold">{c.val}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={1}
                      value={c.val}
                      onChange={(e) =>
                        updateElement(
                          selectedElement.id,
                          { [c.k]: Number(e.target.value) },
                          false
                        )
                      }
                      className="w-full accent-blue-500 cursor-pointer h-1 bg-zinc-800 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mode Tampilan */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px] text-zinc-400">
              <span>Mode Tampilan:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { objectFit: 'cover' }, true)}
                  className={`px-2 py-0.5 rounded text-[9.5px] cursor-pointer transition-colors ${
                    !selectedElement.objectFit || selectedElement.objectFit === 'cover'
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  Cover
                </button>
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { objectFit: 'contain' }, true)}
                  className={`px-2 py-0.5 rounded text-[9.5px] cursor-pointer transition-colors ${
                    selectedElement.objectFit === 'contain'
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  Contain
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. Opacity / Transparency Tool with Flyout */}
      <div className="relative">
        <div className="relative group">
          <button
            type="button"
            onClick={() => toggleFlyout('transparent')}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              activeFlyout === 'transparent' || (selectedElement && selectedElement.opacity < 1)
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
            }`}
            title={`Transparansi / Opacity (${Math.round((selectedElement?.opacity ?? 1) * 100)}%)`}
            aria-label="Opacity Tool"
          >
            <Blend className="w-3.5 h-3.5" />
          </button>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
            Transparansi
          </span>
        </div>

        {/* Opacity Flyout */}
        {activeFlyout === 'transparent' && (
          <div className="absolute left-full ml-2 -top-20 w-60 rounded-2xl bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-left-2 duration-150 space-y-2.5 text-xs text-zinc-200">
            {selectedElement ? (
              <>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="truncate max-w-[130px] text-zinc-400">
                    Transparansi ({selectedElement.name})
                  </span>
                  <span className="font-mono text-blue-400 font-semibold">
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
                    updateElement(selectedElement.id, { opacity: Number(e.target.value) }, false)
                  }
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
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
                        updateElement(selectedElement.id, { opacity: preset.val }, true)
                      }
                      className={`py-1 rounded border text-[9px] font-mono cursor-pointer ${
                        Math.abs(selectedElement.opacity - preset.val) < 0.03
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {(selectedElement.type === 'text' || selectedElement.type === 'badge') && (
                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedElement.id, { backgroundColor: 'transparent' }, true)
                    }
                    className="w-full py-1 px-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[10px] cursor-pointer"
                  >
                    Set Background Box Transparan
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 block">
                  Pilih objek di kanvas untuk mengatur transparansi objek, atau reset background slide:
                </span>
                <button
                  type="button"
                  onClick={() => setSlideBackgroundColor(activeSlideIndex, theme.background)}
                  className="w-full py-1.5 px-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-[10px] cursor-pointer"
                >
                  Reset ke Warna Default Theme
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 10. Color / Fill Swatch Tool with Flyout */}
      <div className="relative">
        <div className="relative group">
          <button
            type="button"
            onClick={() => toggleFlyout('color')}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              activeFlyout === 'color'
                ? 'ring-2 ring-blue-500 bg-zinc-850'
                : 'hover:bg-zinc-850'
            }`}
            title={
              selectedElement
                ? `Warna ${selectedElement.name} (${currentObjectColor})`
                : `Warna Background Slide (${currentObjectColor})`
            }
            aria-label="Color Swatch Tool"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-zinc-500/70 shadow-xs block"
              style={{ backgroundColor: currentObjectColor }}
            />
          </button>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
            Warna & Palet
          </span>
        </div>

        {/* Color Flyout */}
        {activeFlyout === 'color' && (
          <div className="absolute left-full ml-2 -top-24 w-60 rounded-2xl bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-left-2 duration-150 space-y-2.5 text-xs text-zinc-200">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="truncate">
                {selectedElement ? `Warna: ${selectedElement.name}` : 'Warna Background'}
              </span>
              <span className="font-mono text-[9.5px] text-blue-400">{currentObjectColor}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentObjectColor.startsWith('#') ? currentObjectColor : '#1C1917'}
                onChange={(e) => handleObjectColorChange(e.target.value)}
                aria-label="Color Picker"
                className="w-7 h-7 rounded-lg cursor-pointer border border-zinc-700 bg-zinc-900 p-0.5 shrink-0"
              />
              <input
                type="text"
                value={currentObjectColor}
                onChange={(e) => handleObjectColorChange(e.target.value)}
                className="flex-1 border border-zinc-800 bg-zinc-900 rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-100 focus:outline-none"
              />
            </div>

            {/* Quick Editorial Swatches */}
            <div className="grid grid-cols-8 gap-1 pt-1">
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
                  className="w-5 h-5 rounded-full border border-zinc-500/40 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>

            {/* Global Theme Palette Quick Dots */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
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
                        ? 'scale-115 border-blue-500 ring-2 ring-blue-500/40'
                        : 'border-zinc-500/40 opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: t.background }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-4 h-px bg-zinc-800/80 my-0.5" />

      {/* 11. Canvas Aspect Ratio & Object Scale Tool with Flyout */}
      <div className="relative">
        <div className="relative group">
          <button
            type="button"
            onClick={() => toggleFlyout('resize')}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              activeFlyout === 'resize'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
            }`}
            title={`Ukuran Canvas (${ASPECT_RATIOS[aspectRatio].shortLabel}) & Skala`}
            aria-label="Resize Tool"
          >
            <Scaling className="w-3.5 h-3.5" />
          </button>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
            Ukuran & Skala
          </span>
        </div>

        {/* Resize Flyout */}
        {activeFlyout === 'resize' && (
          <div className="absolute left-full ml-2 -top-28 w-56 rounded-2xl bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-left-2 duration-150 space-y-2.5 text-xs text-zinc-200">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
              <span>Ukuran Canvas</span>
              <span className="font-mono text-[9.5px] text-blue-400">
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
                    className={`py-1 px-1 rounded-lg border text-[10px] font-medium cursor-pointer transition-all ${
                      active
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>

            {selectedElement && (
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
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
                          width: Math.max(20, Math.round(selectedElement.width * 0.9)),
                          height: Math.max(10, Math.round(selectedElement.height * 0.9)),
                        },
                        true
                      )
                    }
                    title="Perkecil Object -10%"
                    className="py-1 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-mono cursor-pointer"
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
                    className="py-1 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-mono cursor-pointer"
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    onClick={() => alignElementOnCanvas(selectedElement.id, 'fit-margin')}
                    title="Fit ke Margin"
                    className="py-1 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] cursor-pointer"
                  >
                    Margin
                  </button>
                  <button
                    type="button"
                    onClick={() => alignElementOnCanvas(selectedElement.id, 'fit-canvas')}
                    title="Full Bleed Canvas"
                    className="py-1 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] cursor-pointer"
                  >
                    Full
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 12. Collaborative Commenting Pin Tool (C) */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => {
            setCommentMode(!isCommentMode);
            setActiveFlyout(null);
          }}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer relative ${
            isCommentMode
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
          }`}
          title="Mode Komentar & Feedback Kanvas (C)"
          aria-label="Comments Tool"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {unresolvedCommentsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-0.5 min-w-[12px] h-[12px] rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center leading-none shadow-xs">
              {unresolvedCommentsCount}
            </span>
          )}
        </button>
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
          Komentar <span className="text-zinc-400 font-mono text-[9px]">C</span>
        </span>
      </div>

      <div className="flex-1" />

      {/* 13. AI Script Auto-Generator */}
      {onOpenScriptModal && (
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              setActiveFlyout(null);
              onOpenScriptModal();
            }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 transition-all cursor-pointer"
            title="Script Auto-Generator AI"
            aria-label="Script Generator"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
            AI Script Generator
          </span>
        </div>
      )}

      {/* 14. Quick Save Project */}
      {onQuickSave && (
        <div className="relative group">
          <button
            type="button"
            onClick={onQuickSave}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              justSaved
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:text-blue-400 hover:bg-zinc-850'
            }`}
            title={lastSavedAt ? `Simpan Project (Terakhir: ${lastSavedAt})` : 'Simpan Project (Ctrl+S)'}
            aria-label="Save Project"
          >
            {justSaved ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
          </button>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
            {justSaved ? 'Tersimpan!' : 'Simpan Project'}
          </span>
        </div>
      )}
    </div>
  );
};
