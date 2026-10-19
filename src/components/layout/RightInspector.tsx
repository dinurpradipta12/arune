import React, { useRef, useState } from 'react';
import {
  AlignCenter,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalJustifyCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalJustifyCenter,
  ArrowDown,
  ArrowUp,
  Bold,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Copy,
  Crop,
  FlipHorizontal2,
  FlipVertical2,
  GripVertical,
  Image as ImageIcon,
  Italic,
  Layers,
  Lock,
  Maximize,
  Move,
  Palette,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Sliders,
  Sparkles,
  SunMedium,
  Trash2,
  Type,
  Underline,
  Unlock,
  Upload,
} from 'lucide-react';
import {
  CURATED_EDITORIAL_IMAGES,
  FONT_FAMILIES,
  getFontVariantsForFamily,
} from '../../constants/themesAndPresets';
import { scanComputerFonts } from '../../services/fontManager';
import { trimTransparentImage } from '../../services/backgroundRemoval';
import { useStudioStore } from '../../store/useStudioStore';
import type {
  BlendModeType,
  CanvasElement,
  DividerCanvasElement,
  FontFamilyName,
  ImageCanvasElement,
  ImageCropShape,
  TextCanvasElement,
} from '../../types/studio';

type InspectorModuleId =
  | 'font'
  | 'crop'
  | 'transform'
  | 'effects'
  | 'tone'
  | 'divider'
  | 'slide'
  | 'branding';

interface ModalCardProps {
  id: InspectorModuleId;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Reusable Modular Floating Card ("Per Modal Panel") inside the Right Sidebar.
 * Users can collapse/expand or reorder each modal up/down to customize their right workspace.
 */
const InspectorModalCard: React.FC<ModalCardProps> = ({
  title,
  subtitle,
  icon,
  isCollapsed,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  headerAction,
  children,
}) => {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 shadow-sm overflow-hidden transition-all">
      {/* Modal Card Header */}
      <div
        onClick={onToggleCollapse}
        className="px-3 py-2 bg-zinc-900/90 border-b border-zinc-800/70 flex items-center justify-between gap-1.5 cursor-pointer hover:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3 h-3 text-zinc-500 shrink-0" />
          <span className="text-blue-900 shrink-0">{icon}</span>
          <span className="text-[11px] font-semibold tracking-wide text-zinc-100 truncate">
            {title}
          </span>
          {subtitle && (
            <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono shrink-0">
              {subtitle}
            </span>
          )}
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 shrink-0"
        >
          {headerAction}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Pindahkan Modal ke Atas"
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            title="Pindahkan Modal ke Bawah"
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Buka Modal' : 'Lipat Modal'}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Modal Card Body */}
      {!isCollapsed && (
        <div className="p-3 space-y-3 bg-zinc-950">{children}</div>
      )}
    </div>
  );
};

export const RightInspector: React.FC = () => {
  const {
    slides,
    activeSlideIndex,
    getActiveTheme,
    updateThemeColors,
    branding,
    updateBranding,
    setSlideBackgroundColor,
    getSelectedElement,
    updateElement,
    deleteElement,
    duplicateElement,
    alignElementOnCanvas,
    customFonts,
    addBatchLocalFonts,
    setActiveModal,
    commitElementHistory,
  } = useStudioStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isAutoScanningFonts, setIsAutoScanningFonts] = useState(false);

  // User-customizable order of modular inspector panels
  const [moduleOrder, setModuleOrder] = useState<InspectorModuleId[]>([
    'font',
    'crop',
    'divider',
    'transform',
    'effects',
    'tone',
    'slide',
    'branding',
  ]);

  // Collapsed state per modular panel
  const [collapsedModules, setCollapsedModules] = useState<
    Record<string, boolean>
  >({
    effects: false,
    tone: false,
  });

  const activeSlide = slides[activeSlideIndex] || slides[0];
  const selectedElement = getSelectedElement();
  const theme = getActiveTheme();

  const toggleCollapse = (id: InspectorModuleId) => {
    setCollapsedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const moveModule = (
    id: InspectorModuleId,
    direction: 'up' | 'down',
    visibleList: InspectorModuleId[]
  ) => {
    const idxInVisible = visibleList.indexOf(id);
    if (idxInVisible === -1) return;
    const swapTargetId =
      direction === 'up'
        ? visibleList[idxInVisible - 1]
        : visibleList[idxInVisible + 1];
    if (!swapTargetId) return;

    setModuleOrder((prev) => {
      const next = [...prev];
      const idxA = next.indexOf(id);
      const idxB = next.indexOf(swapTargetId);
      if (idxA !== -1 && idxB !== -1) {
        next[idxA] = swapTargetId;
        next[idxB] = id;
      }
      return next;
    });
  };

  const handleLocalImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    elementId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateElement(elementId, { src: reader.result }, true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAutoReadComputerFonts = async () => {
    if (isAutoScanningFonts) return;
    setIsAutoScanningFonts(true);
    try {
      const res = await scanComputerFonts();
      if (res.families.length > 0) {
        addBatchLocalFonts(res.families);
      }
    } finally {
      setIsAutoScanningFonts(false);
    }
  };

  // ============================================================================
  // MODULAR PANEL 1: TRANSFORM, POSITION & ROTATION MODAL (ICON-ONLY CONTROLS)
  // ============================================================================
  const renderTransformModalContent = (el: CanvasElement) => {
    const rotation = el.rotation || 0;
    const skewX = el.skewX || 0;
    const skewY = el.skewY || 0;

    return (
      <div className="space-y-3">
        {/* Coordinates: X, Y, W, H, Z */}
        <div className="grid grid-cols-5 gap-1.5 text-[10px]">
          {(
            [
              { k: 'x', label: 'X', val: el.x },
              { k: 'y', label: 'Y', val: el.y },
              { k: 'width', label: 'W', val: el.width },
              { k: 'height', label: 'H', val: el.height },
              { k: 'zIndex', label: 'Z', val: el.zIndex },
            ] as const
          ).map((coord) => (
            <div
              key={coord.k}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 flex flex-col"
            >
              <span className="text-zinc-500 font-mono text-[9px]">
                {coord.label}
              </span>
              <input
                type="number"
                value={coord.val}
                onChange={(e) =>
                  updateElement(
                    el.id,
                    { [coord.k]: Number(e.target.value) },
                    true
                  )
                }
                aria-label={coord.label}
                className="bg-transparent text-zinc-100 font-mono text-[11px] focus:outline-none w-full"
              />
            </div>
          ))}
        </div>

        {/* Icon-Only Snap Alignment on Canvas */}
        <div className="grid grid-cols-6 gap-1">
          <button
            type="button"
            onClick={() => alignElementOnCanvas(el.id, 'left')}
            className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            title="Rata Kiri (Snap Left)"
            aria-label="Snap Left"
          >
            <AlignStartVertical className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => alignElementOnCanvas(el.id, 'center-x')}
            className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            title="Rata Tengah Horizontal (Center X)"
            aria-label="Center Horizontally"
          >
            <AlignHorizontalJustifyCenter className="w-3.5 h-3.5 text-blue-900" />
          </button>
          <button
            type="button"
            onClick={() => alignElementOnCanvas(el.id, 'right')}
            className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            title="Rata Kanan (Snap Right)"
            aria-label="Snap Right"
          >
            <AlignEndVertical className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => alignElementOnCanvas(el.id, 'top')}
            className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            title="Rata Atas (Snap Top)"
            aria-label="Snap Top"
          >
            <AlignStartHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => alignElementOnCanvas(el.id, 'center-y')}
            className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            title="Rata Tengah Vertikal (Center Y)"
            aria-label="Center Vertically"
          >
            <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-blue-900" />
          </button>
          <button
            type="button"
            onClick={() => alignElementOnCanvas(el.id, 'bottom')}
            className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            title="Rata Bawah (Snap Bottom)"
            aria-label="Snap Bottom"
          >
            <AlignEndHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rotation Slider & Icon-Only Transform Actions */}
        <div className="space-y-2 pt-1 border-t border-zinc-800/70">
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-900 shrink-0"
              title="Rotate Angle"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) =>
                updateElement(
                  el.id,
                  { rotation: Number(e.target.value) },
                  false
                )
              }
              aria-label="Rotation Angle Slider"
              className="flex-1 accent-blue-900 cursor-pointer"
            />
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5 w-15">
              <input
                type="number"
                min={-360}
                max={360}
                value={rotation}
                onChange={(e) =>
                  updateElement(
                    el.id,
                    { rotation: Number(e.target.value) },
                    true
                  )
                }
                aria-label="Rotation Degrees"
                className="w-full bg-transparent text-[11px] font-mono text-zinc-100 focus:outline-none text-right"
              />
              <span className="text-[10px] text-zinc-500 ml-0.5">°</span>
            </div>
          </div>

          {/* Icon-Only Quick Rotate, Flip, Fit & Reset Toolbar */}
          <div className="grid grid-cols-6 gap-1">
            <button
              type="button"
              onClick={() =>
                updateElement(el.id, { rotation: ((rotation - 90 + 540) % 360) - 180 }, true)
              }
              title="Putar -90° Kiri (Rotate Left 90°)"
              aria-label="Rotate Left 90"
              className="py-1.5 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                updateElement(el.id, { rotation: ((rotation + 90 + 540) % 360) - 180 }, true)
              }
              title="Putar +90° Kanan (Rotate Right 90°)"
              aria-label="Rotate Right 90"
              className="py-1.5 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => updateElement(el.id, { flipX: !el.flipX }, true)}
              title="Flip Horizontal (Cermin Kiri-Kanan)"
              aria-label="Flip Horizontal"
              className={`py-1.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                el.flipX
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-blue-900'
              }`}
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => updateElement(el.id, { flipY: !el.flipY }, true)}
              title="Flip Vertical (Cermin Atas-Bawah)"
              aria-label="Flip Vertical"
              className={`py-1.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                el.flipY
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-blue-900'
              }`}
            >
              <FlipVertical2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => alignElementOnCanvas(el.id, 'fit-margin')}
              title="Fit ke Margin Canvas"
              aria-label="Fit Margin"
              className="py-1.5 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                updateElement(
                  el.id,
                  {
                    rotation: 0,
                    flipX: false,
                    flipY: false,
                    skewX: 0,
                    skewY: 0,
                  },
                  true
                )
              }
              title="Reset Transform (0°)"
              aria-label="Reset Transform"
              className="py-1.5 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-blue-900 flex items-center justify-center cursor-pointer transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <div className="flex justify-between text-[9.5px] text-zinc-400">
                <span>Skew X</span>
                <span className="font-mono">{skewX}°</span>
              </div>
              <input
                type="range"
                min={-35}
                max={35}
                step={1}
                value={skewX}
                onChange={(e) =>
                  updateElement(
                    el.id,
                    { skewX: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[9.5px] text-zinc-400">
                <span>Skew Y</span>
                <span className="font-mono">{skewY}°</span>
              </div>
              <input
                type="range"
                min={-35}
                max={35}
                step={1}
                value={skewY}
                onChange={(e) =>
                  updateElement(
                    el.id,
                    { skewY: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MODULAR PANEL 3: FONT & TYPOGRAPHY EDITOR MODAL
  // ============================================================================
  const renderFontModalContent = (textEl: TextCanvasElement) => {
    const uploadedFonts = customFonts.filter(
      (f) => f.source === 'uploaded-file'
    );
    const systemFonts = customFonts.filter((f) => f.source === 'local-system');
    const availableVariants = getFontVariantsForFamily(textEl.fontFamily);
    const activeVariantId = `${textEl.fontWeight}-${
      textEl.italic ? 'italic' : 'normal'
    }`;
    const isBoldActive = textEl.fontWeight >= 700;

    return (
      <div className="space-y-3">
        {/* Editorial Copy Textarea */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-400">Text Content</span>
            <span className="text-blue-900 font-mono">
              *italic* · [W] Drop-Cap
            </span>
          </div>
          <textarea
            rows={2}
            value={textEl.content}
            onChange={(e) =>
              updateElement(textEl.id, { content: e.target.value }, false)
            }
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-900/40 rounded-lg p-2 text-xs text-zinc-100 focus:outline-none resize-y select-text"
          />
        </div>

        {/* Font Family & Font Variants Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">Font Family</span>
            <button
              type="button"
              onClick={() => setActiveModal('fonts')}
              className="text-[10px] text-blue-900 hover:text-blue-900 font-medium cursor-pointer"
            >
              + Custom Font
            </button>
          </div>

          <select
            value={textEl.fontFamily}
            onFocus={handleAutoReadComputerFonts}
            onChange={(e) =>
              updateElement(
                textEl.id,
                { fontFamily: e.target.value as FontFamilyName },
                true
              )
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-900/40"
          >
            <optgroup label="Editorial Serif">
              {FONT_FAMILIES.filter(
                (f) => f.category === 'Editorial Serif'
              ).map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Clean Sans">
              {FONT_FAMILIES.filter((f) => f.category === 'Clean Sans').map(
                (f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                )
              )}
            </optgroup>
            {uploadedFonts.length > 0 && (
              <optgroup label="Custom Fonts">
                {uploadedFonts.map((cf) => (
                  <option key={cf.family} value={cf.family}>
                    {cf.family}
                  </option>
                ))}
              </optgroup>
            )}
            {systemFonts.length > 0 && (
              <optgroup label="System Fonts">
                {systemFonts.map((cf) => (
                  <option key={cf.family} value={cf.family}>
                    {cf.family}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Font Variant (Varian Font: Light, Regular, Medium, SemiBold, Bold, Italic, etc.) */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-zinc-400">
                Varian Font ({textEl.fontFamily})
              </label>
              <span className="text-[9.5px] font-mono text-zinc-500">
                {availableVariants.length} styles
              </span>
            </div>

            <select
              value={
                availableVariants.some((v) => v.id === activeVariantId)
                  ? activeVariantId
                  : `${textEl.fontWeight}-normal`
              }
              onChange={(e) => {
                const chosen = availableVariants.find(
                  (v) => v.id === e.target.value
                );
                if (chosen) {
                  updateElement(
                    textEl.id,
                    {
                      fontWeight: chosen.weight,
                      italic: chosen.italic,
                    },
                    true
                  );
                }
              }}
              aria-label="Varian Font"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-900/40"
            >
              <optgroup label="Regular / Upright Styles">
                {availableVariants
                  .filter((v) => !v.italic)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
              </optgroup>
              {availableVariants.some((v) => v.italic) && (
                <optgroup label="Italic Styles">
                  {availableVariants
                    .filter((v) => v.italic)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>

            {/* Quick Variant Chips (Light, Regular, Medium, SemiBold, Bold, Italic, Bold Italic) */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {availableVariants
                .filter(
                  (v) =>
                    (!v.italic && [300, 400, 500, 600, 700, 800].includes(v.weight)) ||
                    (v.italic && [400, 700].includes(v.weight))
                )
                .map((v) => {
                  const isActive =
                    textEl.fontWeight === v.weight &&
                    textEl.italic === v.italic;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        updateElement(
                          textEl.id,
                          { fontWeight: v.weight, italic: v.italic },
                          true
                        )
                      }
                      style={{
                        fontFamily: `"${textEl.fontFamily}", serif`,
                        fontWeight: v.weight,
                        fontStyle: v.italic ? 'italic' : 'normal',
                      }}
                      className={`px-2 py-0.5 rounded-md border text-[10px] cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {v.shortLabel}
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">
                Weight
              </label>
              <select
                value={textEl.fontWeight}
                onChange={(e) =>
                  updateElement(
                    textEl.id,
                    {
                      fontWeight: Number(
                        e.target.value
                      ) as TextCanvasElement['fontWeight'],
                    },
                    true
                  )
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none"
              >
                <option value={100}>100 Thin</option>
                <option value={200}>200 ExtraLight</option>
                <option value={300}>300 Light</option>
                <option value={400}>400 Regular</option>
                <option value={500}>500 Medium</option>
                <option value={600}>600 SemiBold</option>
                <option value={700}>700 Bold</option>
                <option value={800}>800 ExtraBold</option>
                <option value={900}>900 Black</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">
                Size (px)
              </label>
              <input
                type="number"
                min={6}
                max={180}
                step={0.5}
                value={textEl.fontSize}
                onChange={(e) =>
                  updateElement(
                    textEl.id,
                    { fontSize: Number(e.target.value) },
                    true
                  )
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Style Toggles: Bold, Italic, Underline, Caps, Drop-Cap */}
          <div className="grid grid-cols-5 gap-1">
            <button
              type="button"
              onClick={() =>
                updateElement(
                  textEl.id,
                  { fontWeight: isBoldActive ? 400 : 700 },
                  true
                )
              }
              title="Bold (700)"
              className={`py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-0.5 cursor-pointer ${
                isBoldActive
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
              <span>Bold</span>
            </button>

            <button
              type="button"
              onClick={() =>
                updateElement(textEl.id, { italic: !textEl.italic }, true)
              }
              title="Italic"
              className={`py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-0.5 cursor-pointer ${
                textEl.italic
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Italic className="w-3 h-3" />
              <span>Italic</span>
            </button>

            <button
              type="button"
              onClick={() =>
                updateElement(
                  textEl.id,
                  {
                    textDecoration:
                      textEl.textDecoration === 'underline'
                        ? 'none'
                        : 'underline',
                  },
                  true
                )
              }
              title="Underline"
              className={`py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-0.5 cursor-pointer ${
                textEl.textDecoration === 'underline'
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Underline className="w-3 h-3" />
              <span>Line</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextUpper = !textEl.uppercase;
                updateElement(
                  textEl.id,
                  {
                    uppercase: nextUpper,
                    textTransform: nextUpper ? 'uppercase' : 'none',
                  },
                  true
                );
              }}
              title="Uppercase"
              className={`py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-0.5 cursor-pointer ${
                textEl.uppercase || textEl.textTransform === 'uppercase'
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="font-mono text-[10px]">AA</span>
              <span>Caps</span>
            </button>

            <button
              type="button"
              onClick={() =>
                updateElement(textEl.id, { dropCap: !textEl.dropCap }, true)
              }
              title="Editorial Drop-Cap"
              className={`py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-0.5 cursor-pointer ${
                textEl.dropCap
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="font-serif font-bold text-xs leading-none">
                D
              </span>
              <span>Drop</span>
            </button>
          </div>
        </div>

        {/* Leading, Tracking, Kerning & Spacing */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/70">
          <div className="grid grid-cols-7 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {(
              [
                { align: 'left', icon: AlignLeft, label: 'Align Left' },
                { align: 'center', icon: AlignCenter, label: 'Align Center' },
                { align: 'right', icon: AlignRight, label: 'Align Right' },
                { align: 'justify', icon: AlignJustify, label: 'Justify' },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = textEl.textAlign === item.align;
              return (
                <button
                  key={item.align}
                  type="button"
                  onClick={() =>
                    updateElement(textEl.id, { textAlign: item.align }, true)
                  }
                  title={item.label}
                  className={`py-1 rounded flex items-center justify-center cursor-pointer ${
                    active
                      ? 'bg-zinc-800 text-blue-900 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}

            {(['top', 'middle', 'bottom'] as const).map((v) => {
              const active = (textEl.verticalAlign || 'top') === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    updateElement(textEl.id, { verticalAlign: v }, true)
                  }
                  title={`Vertical Align: ${v}`}
                  className={`py-1 rounded text-[9px] uppercase font-mono flex items-center justify-center cursor-pointer ${
                    active
                      ? 'bg-zinc-800 text-blue-900 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {v === 'middle' ? 'Mid' : v}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-zinc-300">
                <span>Leading</span>
                <input
                  type="number"
                  step={0.05}
                  min={0.7}
                  max={3}
                  value={textEl.lineHeight}
                  onChange={(e) =>
                    updateElement(
                      textEl.id,
                      { lineHeight: Number(e.target.value) },
                      true
                    )
                  }
                  aria-label="Leading Line Height"
                  className="w-11 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.2 text-right font-mono text-[10px] text-blue-900"
                />
              </div>
              <input
                type="range"
                min={0.75}
                max={2.4}
                step={0.02}
                value={textEl.lineHeight}
                onChange={(e) =>
                  updateElement(
                    textEl.id,
                    { lineHeight: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-zinc-300">
                <span>Tracking</span>
                <input
                  type="number"
                  step={0.01}
                  min={-0.2}
                  max={0.8}
                  value={textEl.letterSpacing}
                  onChange={(e) =>
                    updateElement(
                      textEl.id,
                      { letterSpacing: Number(e.target.value) },
                      true
                    )
                  }
                  aria-label="Tracking Letter Spacing"
                  className="w-11 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.2 text-right font-mono text-[10px] text-blue-900"
                />
              </div>
              <input
                type="range"
                min={-0.08}
                max={0.5}
                step={0.01}
                value={textEl.letterSpacing}
                onChange={(e) =>
                  updateElement(
                    textEl.id,
                    { letterSpacing: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-zinc-300">
                <span>Word Space</span>
                <span className="font-mono text-blue-900">
                  {textEl.wordSpacing || 0}px
                </span>
              </div>
              <input
                type="range"
                min={-8}
                max={24}
                step={1}
                value={textEl.wordSpacing || 0}
                onChange={(e) =>
                  updateElement(
                    textEl.id,
                    { wordSpacing: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-zinc-300">
                <span>Kerning</span>
              </div>
              <select
                value={textEl.fontKerning || 'auto'}
                onChange={(e) =>
                  updateElement(
                    textEl.id,
                    {
                      fontKerning: e.target
                        .value as TextCanvasElement['fontKerning'],
                    },
                    true
                  )
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[10.5px] text-zinc-200"
              >
                <option value="auto">Metric Auto</option>
                <option value="normal">Optical Normal</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Color & Opacity */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/70">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>Text Color & Opacity</span>
            <span className="font-mono">{Math.round(textEl.opacity * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={
                textEl.color.startsWith('#') ? textEl.color : theme.textPrimary
              }
              onChange={(e) =>
                updateElement(textEl.id, { color: e.target.value }, true)
              }
              aria-label="Text Color"
              className="w-7 h-7 rounded-lg cursor-pointer bg-zinc-900 border border-zinc-700 p-0.5"
            />
            <input
              type="text"
              value={textEl.color}
              onChange={(e) =>
                updateElement(textEl.id, { color: e.target.value }, false)
              }
              aria-label="Text Color CSS Value"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-200 focus:outline-none"
            />
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={textEl.opacity}
            onChange={(e) =>
              updateElement(
                textEl.id,
                { opacity: Number(e.target.value) },
                false
              )
            }
            aria-label="Text Opacity"
            className="w-full accent-blue-900 cursor-pointer"
          />
        </div>
      </div>
    );
  };

  // ============================================================================
  // MODULAR PANEL 4: TEXT EFFECTS (SHADOW & STROKE) MODAL
  // ============================================================================
  const renderTextEffectsModalContent = (textEl: TextCanvasElement) => {
    return (
      <div className="space-y-3">
        {/* Text Shadow */}
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] font-medium text-zinc-200">
              Text Drop Shadow
            </span>
            <input
              type="checkbox"
              checked={textEl.shadow.enabled}
              onChange={(e) =>
                updateElement(
                  textEl.id,
                  {
                    shadow: { ...textEl.shadow, enabled: e.target.checked },
                  },
                  true
                )
              }
              className="rounded border-zinc-700 bg-zinc-900 text-blue-900"
            />
          </label>

          {textEl.shadow.enabled && (
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-900/70 p-2 rounded-lg border border-zinc-800/80">
              <div>
                <label className="text-[9.5px] text-zinc-400 block">
                  X Offset
                </label>
                <input
                  type="number"
                  value={textEl.shadow.offsetX}
                  onChange={(e) =>
                    updateElement(textEl.id, {
                      shadow: {
                        ...textEl.shadow,
                        offsetX: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs font-mono text-zinc-200"
                />
              </div>
              <div>
                <label className="text-[9.5px] text-zinc-400 block">
                  Y Offset
                </label>
                <input
                  type="number"
                  value={textEl.shadow.offsetY}
                  onChange={(e) =>
                    updateElement(textEl.id, {
                      shadow: {
                        ...textEl.shadow,
                        offsetY: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs font-mono text-zinc-200"
                />
              </div>
              <div>
                <label className="text-[9.5px] text-zinc-400 block">
                  Blur (px)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={textEl.shadow.blur}
                  onChange={(e) =>
                    updateElement(textEl.id, {
                      shadow: {
                        ...textEl.shadow,
                        blur: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs font-mono text-zinc-200"
                />
              </div>
              <div className="col-span-3 flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-400">Shadow Color</span>
                <input
                  type="color"
                  value={
                    textEl.shadow.color.startsWith('#')
                      ? textEl.shadow.color
                      : '#000000'
                  }
                  onChange={(e) =>
                    updateElement(textEl.id, {
                      shadow: { ...textEl.shadow, color: e.target.value },
                    })
                  }
                  aria-label="Shadow Color"
                  className="w-6 h-6 rounded cursor-pointer bg-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Text Stroke */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/70">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] font-medium text-zinc-200">
              Text Stroke (Outline)
            </span>
            <input
              type="checkbox"
              checked={textEl.stroke.enabled}
              onChange={(e) =>
                updateElement(
                  textEl.id,
                  {
                    stroke: { ...textEl.stroke, enabled: e.target.checked },
                  },
                  true
                )
              }
              className="rounded border-zinc-700 bg-zinc-900 text-blue-900"
            />
          </label>

          {textEl.stroke.enabled && (
            <div className="grid grid-cols-2 gap-2 bg-zinc-900/70 p-2 rounded-lg border border-zinc-800/80">
              <div>
                <label className="text-[9.5px] text-zinc-400 block mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={textEl.stroke.width}
                  onChange={(e) =>
                    updateElement(textEl.id, {
                      stroke: {
                        ...textEl.stroke,
                        width: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-200"
                />
              </div>
              <div>
                <label className="text-[9.5px] text-zinc-400 block mb-1">
                  Stroke Color
                </label>
                <input
                  type="color"
                  value={textEl.stroke.color}
                  onChange={(e) =>
                    updateElement(textEl.id, {
                      stroke: { ...textEl.stroke, color: e.target.value },
                    })
                  }
                  aria-label="Text Stroke Color"
                  className="w-full h-7 rounded cursor-pointer bg-zinc-900 border border-zinc-700"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // MODULAR PANEL 5: PHOTO UPLOAD, CROP, FLIP & RADIAL MASK MODAL
  // ============================================================================
  const renderPhotoCropModalContent = (imgEl: ImageCanvasElement) => {
    return (
      <div className="space-y-3">
        {/* Upload Local Image or Paste URL */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleLocalImageUpload(e, imgEl.id)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 rounded-lg bg-blue-900/10 hover:bg-blue-900/20 border border-blue-900/30 text-blue-900 font-semibold text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Foto dari Komputer</span>
          </button>

          <input
            type="url"
            value={imgEl.src.startsWith('data:') ? '' : imgEl.src}
            placeholder="Atau paste Image URL (https://...)"
            onChange={(e) =>
              updateElement(imgEl.id, { src: e.target.value }, true)
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-900/40 select-text"
          />

          <div className="grid grid-cols-5 gap-1.5 pt-0.5">
            {Object.entries(CURATED_EDITORIAL_IMAGES).map(([key, url]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateElement(imgEl.id, { src: url }, true)}
                title={key}
                className={`aspect-square rounded-md overflow-hidden border transition-all cursor-pointer ${
                  imgEl.src === url
                    ? 'border-blue-900 ring-1 ring-blue-900'
                    : 'border-zinc-800 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={url}
                  alt={key}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Crop Shape / Radial Mask */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">
              Crop Shape & Radial Mask
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    commitElementHistory();
                    const trimmed = await trimTransparentImage(imgEl.src);
                    const curCenterX = imgEl.x + imgEl.width / 2;
                    const curCenterY = imgEl.y + imgEl.height / 2;
                    let nextW = imgEl.width;
                    let nextH = imgEl.height;
                    if (trimmed.width > 0 && trimmed.height > 0) {
                      const ratio = trimmed.width / trimmed.height;
                      if (ratio >= 1) {
                        nextW = Math.round(Math.min(imgEl.width, imgEl.height * ratio));
                        nextH = Math.round(nextW / ratio);
                      } else {
                        nextH = Math.round(Math.min(imgEl.height, imgEl.width / ratio));
                        nextW = Math.round(nextH * ratio);
                      }
                      nextW = Math.max(36, nextW);
                      nextH = Math.max(36, nextH);
                    }
                    const nextX = Math.round(curCenterX - nextW / 2);
                    const nextY = Math.round(curCenterY - nextH / 2);
                    updateElement(
                      imgEl.id,
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
                className="text-[9.5px] px-1.5 py-0.5 rounded bg-blue-900/15 hover:bg-blue-900/25 text-blue-900 font-medium cursor-pointer transition-colors"
              >
                Auto-Trim Box
              </button>
              <button
                type="button"
                onClick={() =>
                  updateElement(
                    imgEl.id,
                    {
                      cropShape: 'rect',
                      cropTop: 0,
                      cropBottom: 0,
                      cropLeft: 0,
                      cropRight: 0,
                      flipX: false,
                      flipY: false,
                    },
                    true
                  )
                }
                className="text-[9.5px] text-zinc-400 hover:text-blue-900 cursor-pointer"
              >
                Reset Crop
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {(
              [
                { id: 'rect', label: 'Rect' },
                { id: 'circle', label: 'Radial' },
                { id: 'arch', label: 'Arch' },
                { id: 'pill', label: 'Pill' },
                { id: 'diamond', label: 'Diamond' },
              ] as { id: ImageCropShape; label: string }[]
            ).map((sh) => {
              const active = (imgEl.cropShape || 'rect') === sh.id;
              return (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => {
                    const nextUpdate: Partial<ImageCanvasElement> = {
                      cropShape: sh.id,
                    };
                    if (sh.id === 'circle') {
                      const size = Math.min(imgEl.width, imgEl.height);
                      nextUpdate.width = size;
                      nextUpdate.height = size;
                    }
                    updateElement(imgEl.id, nextUpdate, true);
                  }}
                  className={`py-1.5 rounded-lg border text-[10px] font-medium cursor-pointer ${
                    active
                      ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sh.label}
                </button>
              );
            })}
          </div>

          {/* Aspect Ratio Crop Presets */}
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() =>
                updateElement(
                  imgEl.id,
                  { height: imgEl.width, cropShape: 'rect' },
                  true
                )
              }
              className="py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-mono cursor-pointer"
            >
              1:1 Sq
            </button>
            <button
              type="button"
              onClick={() =>
                updateElement(
                  imgEl.id,
                  {
                    height: Math.round(imgEl.width * 1.25),
                    cropShape: 'rect',
                  },
                  true
                )
              }
              className="py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-mono cursor-pointer"
            >
              4:5 Port
            </button>
            <button
              type="button"
              onClick={() =>
                updateElement(
                  imgEl.id,
                  {
                    height: Math.round(imgEl.width * 0.65),
                    cropShape: 'rect',
                  },
                  true
                )
              }
              className="py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-mono cursor-pointer"
            >
              16:10
            </button>
            <button
              type="button"
              onClick={() => alignElementOnCanvas(imgEl.id, 'fit-canvas')}
              className="py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-blue-900 flex items-center justify-center gap-0.5 cursor-pointer"
            >
              <Maximize className="w-2.5 h-2.5" />
              <span>Full</span>
            </button>
          </div>

          {/* Fit Mode (Cover vs Contain) */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800">
            <span>Fit Mode Foto:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateElement(imgEl.id, { objectFit: 'cover' }, true)}
                className={`px-2 py-0.5 rounded text-[9.5px] cursor-pointer transition-colors ${
                  !imgEl.objectFit || imgEl.objectFit === 'cover'
                    ? 'bg-blue-900 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cover (Penuh)
              </button>
              <button
                type="button"
                onClick={() => updateElement(imgEl.id, { objectFit: 'contain' }, true)}
                className={`px-2 py-0.5 rounded text-[9.5px] cursor-pointer transition-colors ${
                  imgEl.objectFit === 'contain'
                    ? 'bg-blue-900 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Contain (Utuh)
              </button>
            </div>
          </div>

          {/* 4-Edge Crop Sliders */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2 grid grid-cols-2 gap-2">
            {(
              [
                { k: 'cropTop', label: 'Potong Atas', val: imgEl.cropTop || 0 },
                {
                  k: 'cropBottom',
                  label: 'Potong Bawah',
                  val: imgEl.cropBottom || 0,
                },
                { k: 'cropLeft', label: 'Potong Kiri', val: imgEl.cropLeft || 0 },
                {
                  k: 'cropRight',
                  label: 'Potong Kanan',
                  val: imgEl.cropRight || 0,
                },
              ] as const
            ).map((c) => (
              <div key={c.k}>
                <div className="flex justify-between text-[9.5px] text-zinc-400">
                  <span>{c.label}</span>
                  <span className="font-mono text-blue-900">{c.val}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={c.val}
                  onChange={(e) =>
                    updateElement(
                      imgEl.id,
                      { [c.k]: Number(e.target.value) },
                      false
                    )
                  }
                  className="w-full accent-blue-900 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Flip & Rotate 90° */}
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() =>
                updateElement(imgEl.id, { flipX: !imgEl.flipX }, true)
              }
              className={`py-1.5 rounded-lg border text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                imgEl.flipX
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
              }`}
            >
              <FlipHorizontal2 className="w-3 h-3" />
              <span>Flip H</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateElement(imgEl.id, { flipY: !imgEl.flipY }, true)
              }
              className={`py-1.5 rounded-lg border text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                imgEl.flipY
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
              }`}
            >
              <FlipVertical2 className="w-3 h-3" />
              <span>Flip V</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateElement(
                  imgEl.id,
                  { rotation: ((imgEl.rotation || 0) - 90) % 360 },
                  true
                )
              }
              className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>-90°</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateElement(
                  imgEl.id,
                  { rotation: ((imgEl.rotation || 0) + 90) % 360 },
                  true
                )
              }
              className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>+90°</span>
            </button>
          </div>
        </div>

        {/* Frame Pan & Zoom */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Move className="w-3 h-3 text-blue-900" />
              <span>Pan & Zoom Inside Frame</span>
            </span>
            <button
              type="button"
              onClick={() =>
                updateElement(
                  imgEl.id,
                  { zoom: 1, panX: 50, panY: 50 },
                  true
                )
              }
              className="text-[9.5px] text-zinc-400 hover:text-blue-900 cursor-pointer"
            >
              Reset Pan
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
              <span>Zoom Scale</span>
              <span className="font-mono text-blue-900">
                {imgEl.zoom.toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={imgEl.zoom}
              onChange={(e) =>
                updateElement(
                  imgEl.id,
                  { zoom: Number(e.target.value) },
                  false
                )
              }
              className="w-full accent-blue-900 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[9.5px] text-zinc-400">
                <span>Pan X</span>
                <span className="font-mono">{Math.round(imgEl.panX)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={imgEl.panX}
                onChange={(e) =>
                  updateElement(
                    imgEl.id,
                    { panX: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9.5px] text-zinc-400">
                <span>Pan Y</span>
                <span className="font-mono">{Math.round(imgEl.panY)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={imgEl.panY}
                onChange={(e) =>
                  updateElement(
                    imgEl.id,
                    { panY: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MODULAR PANEL 6: RADIAL VIGNETTE & TONE GRADING MODAL
  // ============================================================================
  const renderImageToneModalContent = (imgEl: ImageCanvasElement) => {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">
            Radial Vignette / Spotlight Mode
          </label>
          <select
            value={imgEl.dimmerType}
            onChange={(e) =>
              updateElement(
                imgEl.id,
                {
                  dimmerType: e.target
                    .value as ImageCanvasElement['dimmerType'],
                },
                true
              )
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="radial-vignette">Cinema Radial Vignette</option>
            <option value="radial-spotlight">Radial Focal Spotlight</option>
            <option value="bottom-gradient">
              Warm Editorial Bottom Gradient
            </option>
            <option value="solid">Uniform Warm Wash</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex justify-between text-[9.5px] text-zinc-400">
              <span>Dimmer</span>
              <span className="font-mono text-blue-900">
                {Math.round(imgEl.dimmerOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.02}
              value={imgEl.dimmerOpacity}
              onChange={(e) =>
                updateElement(
                  imgEl.id,
                  { dimmerOpacity: Number(e.target.value) },
                  false
                )
              }
              className="w-full accent-blue-900 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9.5px] text-zinc-400">
              <span>Radial Feather</span>
              <span className="font-mono text-blue-900">
                {imgEl.radialFeather ?? 55}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={2}
              value={imgEl.radialFeather ?? 55}
              onChange={(e) =>
                updateElement(
                  imgEl.id,
                  { radialFeather: Number(e.target.value) },
                  false
                )
              }
              className="w-full accent-blue-900 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[9.5px] text-zinc-400">
            <span>Corner Radius</span>
            <span className="font-mono">{imgEl.borderRadius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={140}
            step={1}
            value={imgEl.borderRadius}
            onChange={(e) =>
              updateElement(
                imgEl.id,
                { borderRadius: Number(e.target.value) },
                false
              )
            }
            className="w-full accent-blue-900 cursor-pointer"
          />
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-800/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">Tone & Film Grade</span>
            <button
              type="button"
              onClick={() =>
                updateElement(
                  imgEl.id,
                  {
                    brightness: 100,
                    contrast: 100,
                    saturation: 100,
                    grayscale: 0,
                    blur: 0,
                  },
                  true
                )
              }
              className="text-[9.5px] text-zinc-400 hover:text-blue-900 cursor-pointer"
            >
              Reset Tone
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2">
            <div>
              <div className="flex justify-between text-[9.5px] text-zinc-400">
                <span>Brightness</span>
                <span className="font-mono">{imgEl.brightness ?? 100}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={imgEl.brightness ?? 100}
                onChange={(e) =>
                  updateElement(
                    imgEl.id,
                    { brightness: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9.5px] text-zinc-400">
                <span>Contrast</span>
                <span className="font-mono">{imgEl.contrast ?? 100}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={imgEl.contrast ?? 100}
                onChange={(e) =>
                  updateElement(
                    imgEl.id,
                    { contrast: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9.5px] text-zinc-400">
                <span>Saturation</span>
                <span className="font-mono">{imgEl.saturation ?? 100}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={180}
                value={imgEl.saturation ?? 100}
                onChange={(e) =>
                  updateElement(
                    imgEl.id,
                    { saturation: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9.5px] text-zinc-400">
                <span>Monochrome</span>
                <span className="font-mono">{imgEl.grayscale ?? 0}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={imgEl.grayscale ?? 0}
                onChange={(e) =>
                  updateElement(
                    imgEl.id,
                    { grayscale: Number(e.target.value) },
                    false
                  )
                }
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MODULAR PANEL 7: DIVIDER LINE MODAL
  // ============================================================================
  const renderDividerModalContent = (divEl: DividerCanvasElement) => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          {(['horizontal', 'vertical'] as const).map((ori) => (
            <button
              key={ori}
              type="button"
              onClick={() =>
                updateElement(
                  divEl.id,
                  {
                    orientation: ori,
                    width: ori === 'horizontal' ? 140 : 12,
                    height: ori === 'horizontal' ? 12 : 140,
                  },
                  true
                )
              }
              className={`py-1.5 rounded-lg border text-xs capitalize cursor-pointer ${
                divEl.orientation === ori
                  ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {ori}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Thickness (px)
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={divEl.thickness}
              onChange={(e) =>
                updateElement(
                  divEl.id,
                  { thickness: Number(e.target.value) },
                  true
                )
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-mono text-zinc-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">
              Line Style
            </label>
            <select
              value={divEl.style}
              onChange={(e) =>
                updateElement(
                  divEl.id,
                  { style: e.target.value as DividerCanvasElement['style'] },
                  true
                )
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200"
            >
              <option value="solid">Solid Hairline</option>
              <option value="dashed">Dashed Rule</option>
              <option value="dotted">Dotted Rule</option>
              <option value="double">Double Rule</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={divEl.color.startsWith('#') ? divEl.color : theme.accent}
            onChange={(e) =>
              updateElement(divEl.id, { color: e.target.value }, true)
            }
            aria-label="Rule Color"
            className="w-7 h-7 rounded-lg cursor-pointer bg-zinc-900 border border-zinc-700"
          />
          <input
            type="text"
            value={divEl.color}
            onChange={(e) =>
              updateElement(divEl.id, { color: e.target.value }, false)
            }
            aria-label="Rule Color CSS"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-mono text-zinc-200"
          />
          <select
            value={divEl.mixBlendMode || 'normal'}
            onChange={(e) =>
              updateElement(
                divEl.id,
                { mixBlendMode: e.target.value as BlendModeType },
                true
              )
            }
            aria-label="Blend Mode"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-1 text-[11px] text-zinc-200"
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
          </select>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MODULAR PANEL 8: SLIDE BACKGROUND & THEME COLORS MODAL
  // ============================================================================
  const renderSlideThemeModalContent = () => {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <span className="text-[10px] text-zinc-400 block">
            Slide Background Color
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeSlide?.backgroundColor || theme.background}
              onChange={(e) =>
                setSlideBackgroundColor(activeSlideIndex, e.target.value)
              }
              aria-label="Slide Background Color Picker"
              className="w-7 h-7 rounded-lg cursor-pointer bg-zinc-900 border border-zinc-700 p-0.5 shrink-0"
            />
            <input
              type="text"
              value={activeSlide?.backgroundColor || theme.background}
              onChange={(e) =>
                setSlideBackgroundColor(activeSlideIndex, e.target.value)
              }
              aria-label="Slide Background Hex Code"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-200 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[
              { hex: theme.background, label: 'Theme Paper' },
              { hex: theme.darkBackground, label: 'Theme Dark' },
              { hex: theme.surface, label: 'Theme Surface' },
              { hex: '#F5F2EB', label: 'Warm Linen' },
              { hex: '#ECECE6', label: 'Chalk Stone' },
              { hex: '#050811', label: 'Midnight Donker' },
              { hex: '#151D18', label: 'Forest Moss' },
            ].map((sw, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlideBackgroundColor(activeSlideIndex, sw.hex)}
                title={sw.label}
                className="w-5 h-5 rounded-full border border-zinc-700 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: sw.hex }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-800/70">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>Global Theme Palette</span>
            <span className="text-blue-900 font-medium">{theme.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: 'background', label: 'Paper Bg', val: theme.background },
                {
                  key: 'darkBackground',
                  label: 'Dark Bg',
                  val: theme.darkBackground,
                },
                {
                  key: 'textPrimary',
                  label: 'Primary Ink',
                  val: theme.textPrimary,
                },
                { key: 'accent', label: 'Accent Cap', val: theme.accent },
              ] as const
            ).map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-lg px-2 py-1.5"
              >
                <span className="text-[10.5px] text-zinc-300">
                  {item.label}
                </span>
                <input
                  type="color"
                  value={item.val}
                  onChange={(e) =>
                    updateThemeColors({ [item.key]: e.target.value })
                  }
                  aria-label={item.label}
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MODULAR PANEL 9: EDITORIAL BRANDING MODAL
  // ============================================================================
  const renderBrandingModalContent = () => {
    return (
      <div className="space-y-2.5">
        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">
            Publication / Series Title
          </label>
          <input
            type="text"
            value={branding.publicationName}
            onChange={(e) =>
              updateBranding({ publicationName: e.target.value })
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-900/40"
          />
        </div>

        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">
            Author / Instagram Handle
          </label>
          <input
            type="text"
            value={branding.authorOrHandle}
            onChange={(e) => updateBranding({ authorOrHandle: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-900/40"
          />
        </div>

        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">
            Location / Issue Dateline
          </label>
          <input
            type="text"
            value={branding.footerNote}
            onChange={(e) => updateBranding({ footerNote: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-900/40"
          />
        </div>

        <div className="pt-1 space-y-1.5">
          <label className="flex items-center justify-between text-[11px] text-zinc-300 cursor-pointer">
            <span>Slide Folio Numbers (01 / 06)</span>
            <input
              type="checkbox"
              checked={branding.showSlideNumbers}
              onChange={(e) =>
                updateBranding({ showSlideNumbers: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-900 text-blue-900"
            />
          </label>
          <label className="flex items-center justify-between text-[11px] text-zinc-300 cursor-pointer">
            <span>Editorial Footer Credits</span>
            <input
              type="checkbox"
              checked={branding.showFooterBar}
              onChange={(e) =>
                updateBranding({ showFooterBar: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-900 text-blue-900"
            />
          </label>
        </div>
      </div>
    );
  };

  // Determine which modular cards apply to the current selection
  const activeModulesConfig: {
    id: InspectorModuleId;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    render: () => React.ReactNode;
  }[] = [];

  if (!selectedElement) {
    activeModulesConfig.push(
      {
        id: 'slide',
        title: 'Slide & Theme Studio',
        subtitle: `Slide ${String(activeSlideIndex + 1).padStart(2, '0')}`,
        icon: <Palette className="w-3.5 h-3.5" />,
        render: renderSlideThemeModalContent,
      },
      {
        id: 'branding',
        title: 'Editorial Branding',
        icon: <Sparkles className="w-3.5 h-3.5" />,
        render: renderBrandingModalContent,
      }
    );
  } else if (
    selectedElement.type === 'text' ||
    selectedElement.type === 'badge'
  ) {
    const textEl = selectedElement as TextCanvasElement;
    activeModulesConfig.push(
      {
        id: 'font',
        title: 'Font & Typography',
        subtitle: `${textEl.fontSize}px`,
        icon: <Type className="w-3.5 h-3.5" />,
        render: () => renderFontModalContent(textEl),
      },
      {
        id: 'transform',
        title: 'Transform & Posisi',
        subtitle: `${selectedElement.rotation || 0}°`,
        icon: <Sliders className="w-3.5 h-3.5" />,
        render: () => renderTransformModalContent(selectedElement),
      },
      {
        id: 'effects',
        title: 'Shadow & Outline',
        icon: <Sparkles className="w-3.5 h-3.5" />,
        render: () => renderTextEffectsModalContent(textEl),
      }
    );
  } else if (selectedElement.type === 'image') {
    const imgEl = selectedElement as ImageCanvasElement;
    activeModulesConfig.push(
      {
        id: 'crop',
        title: 'Photo, Crop & Flip',
        subtitle: imgEl.cropShape || 'rect',
        icon: <Crop className="w-3.5 h-3.5" />,
        render: () => renderPhotoCropModalContent(imgEl),
      },
      {
        id: 'tone',
        title: 'Radial & Tone Grade',
        icon: <CircleDot className="w-3.5 h-3.5" />,
        render: () => renderImageToneModalContent(imgEl),
      },
      {
        id: 'transform',
        title: 'Transform & Posisi',
        subtitle: `${selectedElement.rotation || 0}°`,
        icon: <Sliders className="w-3.5 h-3.5" />,
        render: () => renderTransformModalContent(selectedElement),
      }
    );
  } else {
    const divEl = selectedElement as DividerCanvasElement;
    activeModulesConfig.push(
      {
        id: 'divider',
        title: 'Divider & Hairline',
        subtitle: `${divEl.thickness}px`,
        icon: <SunMedium className="w-3.5 h-3.5" />,
        render: () => renderDividerModalContent(divEl),
      },
      {
        id: 'transform',
        title: 'Transform & Posisi',
        subtitle: `${selectedElement.rotation || 0}°`,
        icon: <Sliders className="w-3.5 h-3.5" />,
        render: () => renderTransformModalContent(selectedElement),
      }
    );
  }

  // Sort active modules according to user's custom moduleOrder
  const sortedModules = [...activeModulesConfig].sort(
    (a, b) => moduleOrder.indexOf(a.id) - moduleOrder.indexOf(b.id)
  );
  const visibleIds = sortedModules.map((m) => m.id);

  return (
    <aside className="w-80 border-l border-zinc-800/80 bg-zinc-950 flex flex-col shrink-0 select-none z-20 h-full overflow-hidden">
      {/* Sticky Top Context Bar */}
      <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-2 shrink-0">
        {selectedElement ? (
          <>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-blue-900 shrink-0">
                {selectedElement.type === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5" />
                ) : selectedElement.type === 'divider' ? (
                  <Layers className="w-3.5 h-3.5" />
                ) : (
                  <Type className="w-3.5 h-3.5" />
                )}
              </span>
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) =>
                  updateElement(
                    selectedElement.id,
                    { name: e.target.value },
                    false
                  )
                }
                aria-label="Selected Object Name"
                className="text-xs font-semibold text-zinc-100 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-900 rounded px-1 truncate w-32"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  updateElement(
                    selectedElement.id,
                    { locked: !selectedElement.locked },
                    true
                  )
                }
                title={selectedElement.locked ? 'Unlock Object' : 'Lock Object'}
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  selectedElement.locked
                    ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
                }`}
              >
                {selectedElement.locked ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Unlock className="w-3 h-3" />
                )}
              </button>
              <button
                type="button"
                onClick={() => duplicateElement(selectedElement.id)}
                title="Duplicate Object"
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-blue-900 border border-zinc-800 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => deleteElement(selectedElement.id)}
                title="Delete Object"
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-800 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-900" />
              <span className="text-xs font-semibold text-zinc-100">
                Modular Inspector
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              Slide {String(activeSlideIndex + 1).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Quick Module Toggle Pills Bar (Allows combining/toggling sub-modals quickly) */}
      <div className="px-2.5 py-1.5 border-b border-zinc-800/60 bg-zinc-950 flex items-center gap-1 overflow-x-auto scroller-dark shrink-0">
        {sortedModules.map((mod) => {
          const isOpen = !collapsedModules[mod.id];
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggleCollapse(mod.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 shrink-0 border transition-all cursor-pointer ${
                isOpen
                  ? 'bg-blue-900/10 border-blue-900/30 text-blue-900 font-semibold'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title="Klik untuk membuka/melipat modal ini"
            >
              {mod.icon}
              <span>{mod.title.replace(',', '').split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Modular Stack of Floating Sub-Modals */}
      <div className="flex-1 overflow-y-auto scroller-dark p-2.5 space-y-2.5">
        {sortedModules.map((mod, idx) => (
          <InspectorModalCard
            key={mod.id}
            id={mod.id}
            title={mod.title}
            subtitle={mod.subtitle}
            icon={mod.icon}
            isCollapsed={Boolean(collapsedModules[mod.id])}
            onToggleCollapse={() => toggleCollapse(mod.id)}
            onMoveUp={() => moveModule(mod.id, 'up', visibleIds)}
            onMoveDown={() => moveModule(mod.id, 'down', visibleIds)}
            isFirst={idx === 0}
            isLast={idx === sortedModules.length - 1}
          >
            {mod.render()}
          </InspectorModalCard>
        ))}
      </div>
    </aside>
  );
};
