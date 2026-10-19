import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { ASPECT_RATIOS } from '../../constants/themesAndPresets';
import type {
  AspectRatioKey,
  CanvasElement,
  DividerCanvasElement,
  GlobalBranding,
  ImageCanvasElement,
  Slide,
  TextCanvasElement,
  ThemePalette,
} from '../../types/studio';
import { renderEditorialTextContent } from '../../utils/richTextRenderer';

interface SlideStageProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  aspectRatio: AspectRatioKey;
  theme: ThemePalette;
  branding: GlobalBranding;
  scale?: number;
  interactive?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (
    elementId: string,
    updater: Partial<CanvasElement> | ((prev: CanvasElement) => CanvasElement),
    recordHistory?: boolean
  ) => void;
  onCommitHistory?: () => void;
  exportId?: string;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ActiveGuides {
  verticalCenter: boolean;
  horizontalCenter: boolean;
  leftMargin: boolean;
  rightMargin: boolean;
}

const SNAP_THRESHOLD = 5;
const EDITORIAL_MARGIN = 36;

export const SlideStage: React.FC<SlideStageProps> = ({
  slide,
  slideIndex,
  totalSlides,
  aspectRatio,
  theme,
  branding,
  scale = 1,
  interactive = false,
  selectedElementId = null,
  onSelectElement,
  onUpdateElement,
  onCommitHistory,
  exportId,
}) => {
  const { stageWidth: W, stageHeight: H } = ASPECT_RATIOS[aspectRatio];
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const [guides, setGuides] = useState<ActiveGuides>({
    verticalCenter: false,
    horizontalCenter: false,
    leftMargin: false,
    rightMargin: false,
  });

  useEffect(() => {
    if (editingTextId && editingTextId !== selectedElementId) {
      setEditingTextId(null);
    }
  }, [selectedElementId, editingTextId]);

  const isDarkSlide =
    slide.layout === 'cover-overlay' ||
    slide.layout === 'full-bleed-bottom-story' ||
    slide.layout === 'media-outro-cta' ||
    slide.layout === 'playful-outro-cta' ||
    slide.layout.startsWith('typo-') ||
    slide.backgroundColor.toLowerCase() === theme.darkBackground.toLowerCase();

  const folioColor = isDarkSlide
    ? 'rgba(247, 244, 238, 0.68)'
    : theme.textSecondary;

  const startDrag = (
    e: React.PointerEvent<HTMLDivElement>,
    element: CanvasElement
  ) => {
    if (!interactive || e.button !== 0) return;
    if (editingTextId === element.id) return;

    e.stopPropagation();
    onSelectElement?.(element.id);
    if (element.locked) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initialX = element.x;
    const initialY = element.y;
    const elW = element.width;
    const elH = element.height;
    let moved = false;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;

      if (!moved && Math.hypot(dx, dy) < 2) return;
      if (!moved) {
        moved = true;
        setIsDraggingId(element.id);
        onCommitHistory?.();
      }

      let nextX = Math.round(initialX + dx);
      let nextY = Math.round(initialY + dy);

      nextX = Math.max(-elW + 24, Math.min(W - 24, nextX));
      nextY = Math.max(-elH + 24, Math.min(H - 24, nextY));

      const nextGuides: ActiveGuides = {
        verticalCenter: false,
        horizontalCenter: false,
        leftMargin: false,
        rightMargin: false,
      };

      const centerX = nextX + elW / 2;
      if (Math.abs(centerX - W / 2) <= SNAP_THRESHOLD) {
        nextX = Math.round(W / 2 - elW / 2);
        nextGuides.verticalCenter = true;
      }

      const centerY = nextY + elH / 2;
      if (Math.abs(centerY - H / 2) <= SNAP_THRESHOLD) {
        nextY = Math.round(H / 2 - elH / 2);
        nextGuides.horizontalCenter = true;
      }

      if (Math.abs(nextX - EDITORIAL_MARGIN) <= SNAP_THRESHOLD) {
        nextX = EDITORIAL_MARGIN;
        nextGuides.leftMargin = true;
      }

      if (Math.abs(nextX + elW - (W - EDITORIAL_MARGIN)) <= SNAP_THRESHOLD) {
        nextX = W - EDITORIAL_MARGIN - elW;
        nextGuides.rightMargin = true;
      }

      setGuides(nextGuides);
      onUpdateElement?.(element.id, { x: nextX, y: nextY }, false);
    };

    const handlePointerUp = () => {
      setIsDraggingId(null);
      setGuides({
        verticalCenter: false,
        horizontalCenter: false,
        leftMargin: false,
        rightMargin: false,
      });
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const startResize = (
    e: React.PointerEvent<HTMLDivElement>,
    element: CanvasElement,
    handle: ResizeHandle
  ) => {
    if (!interactive || e.button !== 0 || element.locked) return;
    e.stopPropagation();
    e.preventDefault();
    onCommitHistory?.();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = element.x;
    const startY = element.y;
    const startW = element.width;
    const startH = element.height;

    const minW = element.type === 'divider' ? 12 : 32;
    const minH = element.type === 'divider' ? 8 : 18;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startClientX) / scale;
      const dy = (moveEvt.clientY - startClientY) / scale;

      let nextX = startX;
      let nextY = startY;
      let nextW = startW;
      let nextH = startH;

      if (handle.includes('e')) {
        nextW = Math.max(minW, Math.round(startW + dx));
      }
      if (handle.includes('s')) {
        nextH = Math.max(minH, Math.round(startH + dy));
      }
      if (handle.includes('w')) {
        const proposedW = Math.max(minW, Math.round(startW - dx));
        nextX = startX + (startW - proposedW);
        nextW = proposedW;
      }
      if (handle.includes('n')) {
        const proposedH = Math.max(minH, Math.round(startH - dy));
        nextY = startY + (startH - proposedH);
        nextH = proposedH;
      }

      onUpdateElement?.(
        element.id,
        {
          x: nextX,
          y: nextY,
          width: nextW,
          height: nextH,
        },
        false
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const startRotate = (
    e: React.PointerEvent<HTMLDivElement>,
    element: CanvasElement
  ) => {
    if (!interactive || e.button !== 0 || element.locked) return;
    e.stopPropagation();
    e.preventDefault();
    onCommitHistory?.();

    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;

    const centerX =
      stageRect.left + (element.x + element.width / 2) * scale;
    const centerY =
      stageRect.top + (element.y + element.height / 2) * scale;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const radians = Math.atan2(
        moveEvt.clientY - centerY,
        moveEvt.clientX - centerX
      );
      let degrees = Math.round((radians * 180) / Math.PI + 90);
      if (degrees > 180) degrees -= 360;
      if (degrees < -180) degrees += 360;

      // Snap to 0, 45, 90, -45, -90, 180 when within 3 degrees unless Shift is not pressed
      const snapAngles = [-180, -135, -90, -45, 0, 45, 90, 135, 180];
      for (const sa of snapAngles) {
        if (Math.abs(degrees - sa) <= 3) {
          degrees = sa;
          break;
        }
      }

      onUpdateElement?.(element.id, { rotation: degrees }, false);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const renderImageNode = (el: ImageCanvasElement) => {
    const feather = el.radialFeather ?? 55;
    let overlayBackground = 'transparent';
    if (el.dimmerOpacity > 0) {
      const alpha = el.dimmerOpacity;
      if (el.dimmerType === 'bottom-gradient') {
        overlayBackground = `linear-gradient(180deg, rgba(16,15,13,${(
          alpha * 0.25
        ).toFixed(2)}) 0%, rgba(16,15,13,${(alpha * 0.45).toFixed(
          2
        )}) 48%, rgba(14,13,11,${Math.min(0.95, alpha * 1.15).toFixed(
          2
        )}) 100%)`;
      } else if (el.dimmerType === 'radial-vignette') {
        overlayBackground = `radial-gradient(circle at 50% 50%, rgba(20,18,15,0) ${Math.max(
          5,
          feather - 35
        )}%, rgba(12,11,9,${Math.min(0.95, alpha * 1.15).toFixed(
          2
        )}) ${feather + 30}%)`;
      } else if (el.dimmerType === 'radial-spotlight') {
        overlayBackground = `radial-gradient(circle at ${el.panX}% ${
          el.panY
        }%, rgba(255,248,231,0.18) 0%, rgba(10,10,12,${Math.min(
          0.95,
          alpha * 1.2
        ).toFixed(2)}) ${feather + 20}%)`;
      } else {
        overlayBackground = `rgba(16, 15, 13, ${alpha})`;
      }
    }

    // Crop Inset & Shape
    const cTop = el.cropTop || 0;
    const cRight = el.cropRight || 0;
    const cBottom = el.cropBottom || 0;
    const cLeft = el.cropLeft || 0;

    let clipPathValue: string | undefined;
    let computedRadius = `${el.borderRadius}px`;

    if (el.cropShape === 'circle') {
      clipPathValue = `circle(${50 - Math.max(cTop, cLeft)}% at 50% 50%)`;
      computedRadius = '9999px';
    } else if (el.cropShape === 'arch') {
      computedRadius = '9999px 9999px 8px 8px';
      if (cTop || cRight || cBottom || cLeft) {
        clipPathValue = `inset(${cTop}% ${cRight}% ${cBottom}% ${cLeft}% round 9999px 9999px 8px 8px)`;
      }
    } else if (el.cropShape === 'pill') {
      computedRadius = '9999px';
      if (cTop || cRight || cBottom || cLeft) {
        clipPathValue = `inset(${cTop}% ${cRight}% ${cBottom}% ${cLeft}% round 9999px)`;
      }
    } else if (el.cropShape === 'diamond') {
      clipPathValue = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    } else if (cTop || cRight || cBottom || cLeft) {
      clipPathValue = `inset(${cTop}% ${cRight}% ${cBottom}% ${cLeft}% round ${el.borderRadius}px)`;
    }

    // CSS Filters
    const brightness = el.brightness ?? 100;
    const contrast = el.contrast ?? 100;
    const saturation = el.saturation ?? 100;
    const grayscale = el.grayscale ?? 0;
    const blur = el.blur ?? 0;
    const filterCss =
      brightness !== 100 ||
      contrast !== 100 ||
      saturation !== 100 ||
      grayscale !== 0 ||
      blur !== 0
        ? `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) blur(${blur}px)`
        : undefined;

    return (
      <div
        className="w-full h-full relative overflow-hidden select-none"
        style={{
          borderRadius: computedRadius,
          clipPath: clipPathValue,
          backgroundColor: theme.surface,
          border:
            el.borderWidth && el.borderWidth > 0
              ? `${el.borderWidth}px solid ${el.borderColor || theme.accent}`
              : undefined,
        }}
      >
        <img
          src={el.src}
          alt={el.alt || el.name}
          crossOrigin="anonymous"
          draggable={false}
          className="w-full h-full object-cover pointer-events-none select-none"
          style={{
            objectPosition: `${el.panX}% ${el.panY}%`,
            transform: `scale(${el.zoom})`,
            transformOrigin: `${el.panX}% ${el.panY}%`,
            filter: filterCss,
          }}
        />
        {el.dimmerOpacity > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: overlayBackground }}
          />
        )}
      </div>
    );
  };

  const renderDividerNode = (el: DividerCanvasElement) => {
    const isVert = el.orientation === 'vertical';
    return (
      <div className="w-full h-full flex items-center justify-center pointer-events-none">
        {isVert ? (
          <div
            style={{
              height: '100%',
              width: 0,
              borderLeftWidth: `${el.thickness}px`,
              borderLeftStyle: el.style,
              borderLeftColor: el.color,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 0,
              borderTopWidth: `${el.thickness}px`,
              borderTopStyle: el.style,
              borderTopColor: el.color,
            }}
          />
        )}
      </div>
    );
  };

  const renderTextNode = (el: TextCanvasElement) => {
    const isEditing = interactive && editingTextId === el.id;

    const textShadowCss = el.shadow?.enabled
      ? `${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px ${el.shadow.color}`
      : 'none';

    const textStrokeCss = el.stroke?.enabled
      ? `${el.stroke.width}px ${el.stroke.color}`
      : undefined;

    const effectiveTransform =
      el.textTransform || (el.uppercase ? 'uppercase' : 'none');

    const fontStyle: React.CSSProperties = {
      fontFamily: `'${el.fontFamily}', Georgia, serif`,
      fontWeight: el.fontWeight,
      fontSize: `${el.fontSize}px`,
      fontStyle: el.italic ? 'italic' : 'normal',
      textTransform: effectiveTransform,
      textDecoration: el.textDecoration || 'none',
      textAlign: el.textAlign,
      lineHeight: el.lineHeight,
      letterSpacing: `${el.letterSpacing}em`,
      wordSpacing: el.wordSpacing ? `${el.wordSpacing}px` : undefined,
      fontKerning: el.fontKerning || 'auto',
      fontFeatureSettings:
        el.opticalKerning !== false ? '"kern" 1, "liga" 1' : '"kern" 0',
      textIndent: el.paragraphIndent ? `${el.paragraphIndent}px` : undefined,
      color: el.color,
      textShadow: textShadowCss,
      WebkitTextStroke: textStrokeCss,
      backgroundColor: el.backgroundColor || 'transparent',
      borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
      padding:
        el.paddingX || el.paddingY
          ? `${el.paddingY || 0}px ${el.paddingX || 0}px`
          : undefined,
      border:
        el.borderWidth && el.borderWidth > 0
          ? `${el.borderWidth}px solid ${el.borderColor || theme.accent}`
          : el.borderColor
          ? `1px solid ${el.borderColor}`
          : undefined,
    };

    const vAlignClass =
      el.verticalAlign === 'middle' || el.type === 'badge'
        ? 'flex flex-col justify-center'
        : el.verticalAlign === 'bottom'
        ? 'flex flex-col justify-end'
        : '';

    if (isEditing) {
      return (
        <textarea
          autoFocus
          value={el.content}
          onChange={(e) =>
            onUpdateElement?.(el.id, { content: e.target.value }, false)
          }
          onBlur={() => setEditingTextId(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditingTextId(null);
            }
            e.stopPropagation();
          }}
          className="w-full h-full bg-black/15 backdrop-blur-[1px] outline-none resize-none p-0.5 rounded"
          style={fontStyle}
        />
      );
    }

    return (
      <div
        className={`w-full h-full whitespace-pre-wrap break-words ${vAlignClass}`}
        style={fontStyle}
      >
        <div>{renderEditorialTextContent(el, theme.accent)}</div>
      </div>
    );
  };

  const sortedElements = [...slide.elements].sort(
    (a, b) => a.zIndex - b.zIndex
  );

  return (
    <div
      id={exportId}
      ref={stageRef}
      onPointerDown={() => {
        if (interactive) {
          onSelectElement?.(null);
          setEditingTextId(null);
        }
      }}
      className="relative overflow-hidden select-none"
      style={{
        width: `${W}px`,
        height: `${H}px`,
        backgroundColor: slide.backgroundColor,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* Smart Alignment Guide Lines (Interactive Mode Only) */}
      {interactive && guides.verticalCenter && (
        <div
          className="absolute top-0 bottom-0 w-px bg-blue-900/90 z-[999] pointer-events-none"
          style={{ left: `${W / 2}px` }}
        />
      )}
      {interactive && guides.horizontalCenter && (
        <div
          className="absolute left-0 right-0 h-px bg-blue-900/90 z-[999] pointer-events-none"
          style={{ top: `${H / 2}px` }}
        />
      )}
      {interactive && guides.leftMargin && (
        <div
          className="absolute top-0 bottom-0 w-px bg-sky-400/75 z-[999] pointer-events-none"
          style={{ left: `${EDITORIAL_MARGIN}px` }}
        />
      )}
      {interactive && guides.rightMargin && (
        <div
          className="absolute top-0 bottom-0 w-px bg-sky-400/75 z-[999] pointer-events-none"
          style={{ left: `${W - EDITORIAL_MARGIN}px` }}
        />
      )}

      {/* Slide Elements */}
      {sortedElements.map((el) => {
        if (el.hidden) return null;

        const isSelected = interactive && selectedElementId === el.id;
        const isDragging = isDraggingId === el.id;

        const rot = el.rotation || 0;
        const fx = el.flipX ? -1 : 1;
        const fy = el.flipY ? -1 : 1;
        const skX = el.skewX || 0;
        const skY = el.skewY || 0;

        const transformParts: string[] = [];
        if (rot !== 0) transformParts.push(`rotate(${rot}deg)`);
        if (fx !== 1 || fy !== 1) transformParts.push(`scale(${fx}, ${fy})`);
        if (skX !== 0 || skY !== 0)
          transformParts.push(`skew(${skX}deg, ${skY}deg)`);

        return (
          <div
            key={el.id}
            role={interactive ? 'group' : undefined}
            aria-label={
              interactive ? `${el.name} (Use arrow keys to nudge)` : undefined
            }
            tabIndex={interactive ? 0 : -1}
            onPointerDown={(e) => startDrag(e, el)}
            onDoubleClick={(e) => {
              if (!interactive || el.locked) return;
              e.stopPropagation();
              if (el.type === 'text' || el.type === 'badge') {
                onCommitHistory?.();
                setEditingTextId(el.id);
              }
            }}
            onKeyDown={(e) => {
              if (!interactive || editingTextId === el.id || el.locked) return;
              const step = e.shiftKey ? 10 : 1;
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onUpdateElement?.(el.id, { x: el.x - step }, true);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                onUpdateElement?.(el.id, { x: el.x + step }, true);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onUpdateElement?.(el.id, { y: el.y - step }, true);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onUpdateElement?.(el.id, { y: el.y + step }, true);
              }
            }}
            className={`absolute outline-none ${
              interactive
                ? `drag-handle ${isDragging ? 'dragging' : ''} ${
                    isSelected
                      ? 'ring-1 ring-blue-900 shadow-[0_0_0_1px_rgba(30,58,138,0.5)]'
                      : 'hover:ring-1 hover:ring-blue-900/40'
                  }`
                : ''
            }`}
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: `${el.height}px`,
              zIndex: el.zIndex,
              opacity: el.opacity,
              mixBlendMode: el.mixBlendMode || 'normal',
            }}
          >
            {/* Inner Transformed Content Wrapper */}
            <div
              className="w-full h-full"
              style={{
                transform:
                  transformParts.length > 0
                    ? transformParts.join(' ')
                    : undefined,
                transformOrigin: 'center center',
              }}
            >
              {el.type === 'image' && renderImageNode(el)}
              {el.type === 'divider' && renderDividerNode(el)}
              {(el.type === 'text' || el.type === 'badge') && renderTextNode(el)}
            </div>

            {/* Selection Controls: Label Pill, Rotation Handle, and 8 Resize Handles */}
            {isSelected && editingTextId !== el.id && (
              <>
                <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-blue-900 text-white text-[9px] font-medium tracking-wider uppercase whitespace-nowrap pointer-events-none shadow-sm z-50">
                  {el.name} · {el.width}×{el.height}
                  {rot ? ` · ${rot}°` : ''}
                  {el.locked ? ' · LOCKED' : ''}
                </div>

                {!el.locked && (
                  <>
                    {/* Interactive Rotation Handle */}
                    <div
                      onPointerDown={(e) => startRotate(e, el)}
                      title="Drag to Rotate Object"
                      className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-900 text-white border border-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing z-50"
                    >
                      <RotateCw className="w-3 h-3" />
                    </div>

                    {(
                      [
                        {
                          h: 'nw',
                          cls: '-top-1.5 -left-1.5 cursor-nwse-resize',
                        },
                        {
                          h: 'n',
                          cls: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
                        },
                        {
                          h: 'ne',
                          cls: '-top-1.5 -right-1.5 cursor-nesw-resize',
                        },
                        {
                          h: 'e',
                          cls: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize',
                        },
                        {
                          h: 'se',
                          cls: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
                        },
                        {
                          h: 's',
                          cls: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
                        },
                        {
                          h: 'sw',
                          cls: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
                        },
                        {
                          h: 'w',
                          cls: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize',
                        },
                      ] as { h: ResizeHandle; cls: string }[]
                    ).map(({ h, cls }) => (
                      <div
                        key={h}
                        onPointerDown={(e) => startResize(e, el, h)}
                        className={`absolute w-2.5 h-2.5 bg-white border border-blue-900 rounded-[2px] z-50 ${cls}`}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Global Editorial Folio Footer Bar */}
      {(branding.showFooterBar || branding.showSlideNumbers) && (
        <div
          className="absolute left-[36px] right-[36px] bottom-[14px] flex items-center justify-between pointer-events-none z-[60]"
          style={{
            fontFamily: `'${theme.sansFont}', Inter, sans-serif`,
            fontSize: '7.5px',
            letterSpacing: '0.24em',
            color: folioColor,
          }}
        >
          <div className="uppercase truncate max-w-[75%]">
            {branding.showFooterBar ? (
              <>
                <span>{branding.authorOrHandle}</span>
                {branding.footerNote ? (
                  <span className="mx-2 opacity-60">·</span>
                ) : null}
                <span>{branding.footerNote}</span>
              </>
            ) : null}
          </div>
          {branding.showSlideNumbers && (
            <div className="uppercase font-medium tabular-nums">
              {String(slideIndex + 1).padStart(2, '0')} /{' '}
              {String(totalSlides).padStart(2, '0')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
