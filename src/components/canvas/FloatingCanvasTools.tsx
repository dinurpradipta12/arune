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
  Image as ImageIcon,
  Eraser,
  MessageSquare,
  X,
  Plus,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import type { ShapeKind } from '../../types/studio';

export type CanvasToolMode = 'select' | 'hand';

interface FloatingCanvasToolsProps {
  activeTool: CanvasToolMode;
  setActiveTool: (tool: CanvasToolMode) => void;
  onTriggerImageUpload: () => void;
  onTriggerEraser: () => void;
  isErasingBg?: boolean;
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
    label: 'Kotak (Rectangle)',
    defaultRadius: 0,
    icon: <Square className="w-4 h-4" />,
  },
  {
    id: 'rounded-rect',
    label: 'Sudut Bulat (Rounded)',
    defaultRadius: 16,
    icon: <Square className="w-4 h-4 rounded-md" />,
  },
  {
    id: 'circle',
    label: 'Lingkaran (Circle)',
    icon: <Circle className="w-4 h-4" />,
  },
  {
    id: 'pill',
    label: 'Kapsul (Pill)',
    icon: <Pill className="w-4 h-4" />,
  },
  {
    id: 'triangle',
    label: 'Segitiga (Triangle)',
    icon: <Triangle className="w-4 h-4" />,
  },
  {
    id: 'star',
    label: 'Bintang (Star)',
    icon: <Star className="w-4 h-4" />,
  },
  {
    id: 'diamond',
    label: 'Diamond (Belah Ketupat)',
    icon: <Diamond className="w-4 h-4" />,
  },
  {
    id: 'polygon',
    label: 'Hexagon (Segi Enam)',
    icon: <Hexagon className="w-4 h-4" />,
  },
  {
    id: 'arrow',
    label: 'Panah (Arrow)',
    icon: <ArrowRight className="w-4 h-4" />,
  },
  {
    id: 'heart',
    label: 'Hati (Heart)',
    icon: <Heart className="w-4 h-4" />,
  },
];

const RADIUS_CHIPS = [
  { label: '0px Tajam', value: 0 },
  { label: '8px', value: 8 },
  { label: '16px', value: 16 },
  { label: '24px', value: 24 },
  { label: '36px', value: 36 },
  { label: '50px', value: 50 },
];

export const FloatingCanvasTools: React.FC<FloatingCanvasToolsProps> = ({
  activeTool,
  setActiveTool,
  onTriggerImageUpload,
  onTriggerEraser,
  isErasingBg = false,
}) => {
  const {
    addElement,
    getActiveTheme,
    isCommentMode,
    setCommentMode,
    getSelectedElement,
  } = useStudioStore();

  const theme = getActiveTheme();
  const selectedElement = getSelectedElement();
  const isImageSelected = selectedElement?.type === 'image';

  // Floating shape picker flyout state
  const [isShapeFlyoutOpen, setIsShapeFlyoutOpen] = useState(false);
  const [activeShapeKind, setActiveShapeKind] = useState<ShapeKind>('rounded-rect');
  const [shapeRadius, setShapeRadius] = useState<number>(16);
  const [shapeFillColor, setShapeFillColor] = useState<string>(theme.accent || '#3b82f6');

  const flyoutRef = useRef<HTMLDivElement>(null);

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setIsShapeFlyoutOpen(false);
      }
    };
    if (isShapeFlyoutOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShapeFlyoutOpen]);

  // Sync default color with theme changes
  useEffect(() => {
    setShapeFillColor(theme.accent || '#3b82f6');
  }, [theme.accent]);

  const handleSelectShapePreset = (preset: ShapePresetOption) => {
    setActiveShapeKind(preset.id);
    if (preset.id === 'rectangle') {
      setShapeRadius(0);
    } else if (preset.id === 'rounded-rect') {
      setShapeRadius(shapeRadius === 0 ? 16 : shapeRadius);
    }
  };

  const handleInsertShape = () => {
    const computedRadius =
      activeShapeKind === 'circle' || activeShapeKind === 'pill'
        ? 9999
        : activeShapeKind === 'rectangle' || activeShapeKind === 'rounded-rect'
        ? shapeRadius
        : 0;

    addElement('shape', {
      shapeKind: activeShapeKind,
      borderRadius: computedRadius,
      fillColor: shapeFillColor,
      name:
        activeShapeKind === 'rectangle'
          ? `Rectangle ${shapeRadius > 0 ? `(r:${shapeRadius}px)` : ''}`
          : activeShapeKind === 'rounded-rect'
          ? `Rounded Box (${shapeRadius}px)`
          : `${activeShapeKind.charAt(0).toUpperCase() + activeShapeKind.slice(1)} Shape`,
    });

    setIsShapeFlyoutOpen(false);
    setActiveTool('select');
  };

  const isRadiusConfigurable =
    activeShapeKind === 'rectangle' || activeShapeKind === 'rounded-rect';

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 select-none">
      {/* Vertical Tool Palette (Glassmorphism dark container) */}
      <div className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 shadow-2xl">
        {/* 1. Move / Select Tool (V) */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              setActiveTool('select');
              setIsShapeFlyoutOpen(false);
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
            }`}
            title="Move & Select Tool (V)"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[10.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
            Move Tool <span className="text-zinc-400 font-mono text-[9.5px]">V</span>
          </span>
        </div>

        {/* 2. Hand / Pan Tool (H) */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              setActiveTool('hand');
              setIsShapeFlyoutOpen(false);
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'hand'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
            }`}
            title="Hand & Pan Canvas Tool (H / Hold Space)"
          >
            <Hand className="w-4 h-4" />
          </button>
          <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[10.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
            Pan Tool <span className="text-zinc-400 font-mono text-[9.5px]">H / Space</span>
          </span>
        </div>

        <div className="w-6 h-px bg-zinc-800/80 my-0.5" />

        {/* 3. Text Tool (T) */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              addElement('text');
              setActiveTool('select');
              setIsShapeFlyoutOpen(false);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-all cursor-pointer"
            title="Tambah Teks Editorial (T)"
          >
            <Type className="w-4 h-4" />
          </button>
          <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[10.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
            Tambah Teks <span className="text-zinc-400 font-mono text-[9.5px]">T</span>
          </span>
        </div>

        {/* 4. Shape Tool with Floating Flyout (R) */}
        <div className="relative">
          <div className="relative group">
            <button
              type="button"
              onClick={() => setIsShapeFlyoutOpen(!isShapeFlyoutOpen)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isShapeFlyoutOpen
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
              }`}
              title="Koleksi Bentuk / Shapes (R)"
            >
              <Shapes className="w-4 h-4" />
            </button>
            <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[10.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
              Shapes & Radius <span className="text-zinc-400 font-mono text-[9.5px]">R</span>
            </span>
          </div>

          {/* Floating Shape Modal / Flyout Box Beside Tool */}
          {isShapeFlyoutOpen && (
            <div
              ref={flyoutRef}
              className="absolute left-full ml-3 top-[-80px] w-80 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-left-2 duration-150"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400">
                    <Shapes className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">Bentuk & Geometri</h4>
                    <p className="text-[10px] text-zinc-400">Pilih bentuk dan atur rounded radius</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShapeFlyoutOpen(false)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grid of Shapes */}
              <div className="mb-3">
                <span className="text-[10.5px] font-medium text-zinc-400 block mb-1.5">
                  Pilihan Bentuk (10 Varian)
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {SHAPE_PRESETS.map((preset) => {
                    const isSelected = activeShapeKind === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectShapePreset(preset)}
                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-[9.5px] cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-xs'
                            : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title={preset.label}
                      >
                        {preset.icon}
                        <span className="truncate max-w-[50px] text-[8.5px] font-medium">
                          {preset.id === 'rounded-rect' ? 'Rounded' : preset.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Corner Radius Controller for Rectangle & Rounded */}
              {isRadiusConfigurable && (
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-zinc-200 flex items-center gap-1">
                      <span>Sudut Rounded (Corner Radius)</span>
                    </label>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-blue-400">
                      {shapeRadius}px
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={shapeRadius}
                    onChange={(e) => setShapeRadius(Number(e.target.value))}
                    aria-label="Shape Corner Radius"
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />

                  {/* Quick Preset Radius Chips */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {RADIUS_CHIPS.map((chip) => (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setShapeRadius(chip.value)}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                          shapeRadius === chip.value
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Shape Preview Box */}
              <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-850 mb-3">
                <div className="flex items-center gap-2">
                  {/* Live Visual Preview */}
                  <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: shapeFillColor,
                        borderRadius:
                          activeShapeKind === 'circle' || activeShapeKind === 'pill'
                            ? '9999px'
                            : activeShapeKind === 'rectangle' || activeShapeKind === 'rounded-rect'
                            ? `${shapeRadius / 3}px`
                            : undefined,
                        clipPath:
                          activeShapeKind === 'triangle'
                            ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                            : activeShapeKind === 'star'
                            ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                            : activeShapeKind === 'diamond'
                            ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                            : activeShapeKind === 'polygon'
                            ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                            : activeShapeKind === 'arrow'
                            ? 'polygon(0% 25%, 60% 25%, 60% 0%, 100% 50%, 60% 100%, 60% 75%, 0% 75%)'
                            : undefined,
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-200 capitalize block leading-tight">
                      {activeShapeKind}
                    </span>
                    <span className="text-[9.5px] text-zinc-400">
                      {isRadiusConfigurable ? `Radius: ${shapeRadius}px` : 'Geometri proporsional'}
                    </span>
                  </div>
                </div>

                {/* Color swatch picker */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={shapeFillColor.startsWith('#') ? shapeFillColor : '#3b82f6'}
                    onChange={(e) => setShapeFillColor(e.target.value)}
                    aria-label="Pilih Warna Isi"
                    className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>

              {/* Action Button: Insert to Canvas */}
              <button
                type="button"
                onClick={handleInsertShape}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sisipkan ke Kanvas</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Image Upload Tool */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              onTriggerImageUpload();
              setActiveTool('select');
              setIsShapeFlyoutOpen(false);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-all cursor-pointer"
            title="Sisipkan Foto / Gambar"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[10.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
            Unggah Foto
          </span>
        </div>

        {/* 6. Divider / Line Tool */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              addElement('divider');
              setActiveTool('select');
              setIsShapeFlyoutOpen(false);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-all cursor-pointer"
            title="Tambah Garis / Divider"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[10.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
            Garis / Divider
          </span>
        </div>

        <div className="w-6 h-px bg-zinc-800/80 my-0.5" />

        {/* 7. AI Magic Eraser / Background Remover */}
        <div className="relative group">
          <button
            type="button"
            onClick={onTriggerEraser}
            disabled={isErasingBg}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isImageSelected
                ? 'text-amber-400 hover:bg-amber-500/20 hover:text-amber-300'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850'
            }`}
            title={
              isImageSelected
                ? 'Hapus Background Foto Otomatis (AI Eraser)'
                : 'Pilih foto di kanvas untuk menggunakan AI Eraser'
            }
          >
            <Eraser className="w-4 h-4" />
          </button>
          <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[10.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
            {isImageSelected ? 'AI Magic Eraser' : 'Pilih Foto Dahulu'}
          </span>
        </div>

        {/* 8. Collaborative Comment Pin (C) */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              setCommentMode(!isCommentMode);
              setIsShapeFlyoutOpen(false);
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isCommentMode
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
            }`}
            title="Mode Komentar & Feedback Kanvas (C)"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[10.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
            Komentar <span className="text-zinc-400 font-mono text-[9.5px]">C</span>
          </span>
        </div>
      </div>
    </div>
  );
};
