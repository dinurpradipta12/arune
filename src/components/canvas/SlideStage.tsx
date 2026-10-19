import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { ASPECT_RATIOS } from '../../constants/themesAndPresets';
import type {
  AspectRatioKey,
  CanvasElement,
  DividerCanvasElement,
  GlobalBranding,
  ImageCanvasElement,
  ShapeCanvasElement,
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

interface DistanceBadge {
  x: number;
  y: number;
  distance: number;
  orientation: 'horizontal' | 'vertical';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface ActiveGuides {
  verticalCenter: boolean;
  horizontalCenter: boolean;
  leftMargin: boolean;
  rightMargin: boolean;
  topMargin: boolean;
  bottomMargin: boolean;
  // Dynamic alignment lines across canvas or between objects
  verticalLines: number[];
  horizontalLines: number[];
  distanceBadges: DistanceBadge[];
}

const SNAP_THRESHOLD = 6;
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
    topMargin: false,
    bottomMargin: false,
    verticalLines: [],
    horizontalLines: [],
    distanceBadges: [],
  });

  useEffect(() => {
    if (editingTextId && editingTextId !== selectedElementId) {
      setEditingTextId(null);
    }
  }, [selectedElementId, editingTextId]);

  const isColorDark = (hexOrRgb: string): boolean => {
    if (!hexOrRgb) return false;
    const str = hexOrRgb.trim().toLowerCase();
    if (str.startsWith('#')) {
      const hex = str.slice(1);
      const fullHex = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
      if (fullHex.length >= 6) {
        const r = parseInt(fullHex.substring(0, 2), 16) || 0;
        const g = parseInt(fullHex.substring(2, 4), 16) || 0;
        const b = parseInt(fullHex.substring(4, 6), 16) || 0;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        return lum < 145;
      }
    } else if (str.startsWith('rgb')) {
      const match = str.match(/\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
        if (parts.length >= 3) {
          const lum = 0.299 * parts[0] + 0.587 * parts[1] + 0.114 * parts[2];
          return lum < 145;
        }
      }
    }
    return false;
  };

  const isSlideDark =
    slide.layout === 'cover-overlay' ||
    slide.layout === 'full-bleed-bottom-story' ||
    slide.layout === 'media-outro-cta' ||
    slide.layout === 'playful-outro-cta' ||
    slide.layout.startsWith('typo-') ||
    isColorDark(slide.backgroundColor) ||
    slide.backgroundColor.toLowerCase() === theme.darkBackground.toLowerCase();

  const isDarkSlide = isSlideDark;

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

      const otherElements = slide.elements.filter(
        (other) => other.id !== element.id && !other.hidden
      );

      const nextGuides: ActiveGuides = {
        verticalCenter: false,
        horizontalCenter: false,
        leftMargin: false,
        rightMargin: false,
        topMargin: false,
        bottomMargin: false,
        verticalLines: [],
        horizontalLines: [],
        distanceBadges: [],
      };

      // 1. Canvas Boundary & Center Snapping
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

      if (Math.abs(nextY - EDITORIAL_MARGIN) <= SNAP_THRESHOLD) {
        nextY = EDITORIAL_MARGIN;
        nextGuides.topMargin = true;
      }

      if (Math.abs(nextY + elH - (H - EDITORIAL_MARGIN)) <= SNAP_THRESHOLD) {
        nextY = H - EDITORIAL_MARGIN - elH;
        nextGuides.bottomMargin = true;
      }

      // 2. Object-to-Object Snapping (Alignment & Distance)
      const curLeft = nextX;
      const curRight = nextX + elW;
      const curCenterX = nextX + elW / 2;
      const curTop = nextY;
      const curBottom = nextY + elH;
      const curCenterY = nextY + elH / 2;

      const vLines = new Set<number>();
      const hLines = new Set<number>();
      const badges: DistanceBadge[] = [];

      for (const other of otherElements) {
        const oLeft = other.x;
        const oRight = other.x + other.width;
        const oCenterX = other.x + other.width / 2;
        const oTop = other.y;
        const oBottom = other.y + other.height;
        const oCenterY = other.y + other.height / 2;

        // --- X Alignments ---
        // Left to Left
        if (Math.abs(curLeft - oLeft) <= SNAP_THRESHOLD) {
          nextX = oLeft;
          vLines.add(oLeft);
        }
        // Right to Right
        else if (Math.abs(curRight - oRight) <= SNAP_THRESHOLD) {
          nextX = oRight - elW;
          vLines.add(oRight);
        }
        // Center to Center X
        else if (Math.abs(curCenterX - oCenterX) <= SNAP_THRESHOLD) {
          nextX = Math.round(oCenterX - elW / 2);
          vLines.add(oCenterX);
        }
        // Left to Right (adjacent)
        else if (Math.abs(curLeft - oRight) <= SNAP_THRESHOLD) {
          nextX = oRight;
          vLines.add(oRight);
        }
        // Right to Left (adjacent)
        else if (Math.abs(curRight - oLeft) <= SNAP_THRESHOLD) {
          nextX = oLeft - elW;
          vLines.add(oLeft);
        }

        // --- Y Alignments ---
        // Top to Top
        if (Math.abs(curTop - oTop) <= SNAP_THRESHOLD) {
          nextY = oTop;
          hLines.add(oTop);
        }
        // Bottom to Bottom
        else if (Math.abs(curBottom - oBottom) <= SNAP_THRESHOLD) {
          nextY = oBottom - elH;
          hLines.add(oBottom);
        }
        // Center to Center Y
        else if (Math.abs(curCenterY - oCenterY) <= SNAP_THRESHOLD) {
          nextY = Math.round(oCenterY - elH / 2);
          hLines.add(oCenterY);
        }
        // Top to Bottom (stacked)
        else if (Math.abs(curTop - oBottom) <= SNAP_THRESHOLD) {
          nextY = oBottom;
          hLines.add(oBottom);
        }
        // Bottom to Top (stacked)
        else if (Math.abs(curBottom - oTop) <= SNAP_THRESHOLD) {
          nextY = oTop - elH;
          hLines.add(oTop);
        }

        // --- Distance Measurements & Badges ---
        // Vertical gap between elements when horizontally overlapping
        const xOverlap = Math.max(0, Math.min(curRight, oRight) - Math.max(curLeft, oLeft));
        if (xOverlap > 20) {
          const midX = Math.round((Math.max(curLeft, oLeft) + Math.min(curRight, oRight)) / 2);
          // Current is below Other
          if (curTop >= oBottom && curTop - oBottom < 160) {
            const gap = Math.round(curTop - oBottom);
            if (gap > 4) {
              badges.push({
                x: midX,
                y: Math.round(oBottom + gap / 2),
                distance: gap,
                orientation: 'vertical',
                startX: midX,
                startY: oBottom,
                endX: midX,
                endY: curTop,
              });
            }
          }
          // Current is above Other
          else if (oTop >= curBottom && oTop - curBottom < 160) {
            const gap = Math.round(oTop - curBottom);
            if (gap > 4) {
              badges.push({
                x: midX,
                y: Math.round(curBottom + gap / 2),
                distance: gap,
                orientation: 'vertical',
                startX: midX,
                startY: curBottom,
                endX: midX,
                endY: oTop,
              });
            }
          }
        }

        // Horizontal gap between elements when vertically overlapping
        const yOverlap = Math.max(0, Math.min(curBottom, oBottom) - Math.max(curTop, oTop));
        if (yOverlap > 20) {
          const midY = Math.round((Math.max(curTop, oTop) + Math.min(curBottom, oBottom)) / 2);
          // Current is to the right of Other
          if (curLeft >= oRight && curLeft - oRight < 160) {
            const gap = Math.round(curLeft - oRight);
            if (gap > 4) {
              badges.push({
                x: Math.round(oRight + gap / 2),
                y: midY,
                distance: gap,
                orientation: 'horizontal',
                startX: oRight,
                startY: midY,
                endX: curLeft,
                endY: midY,
              });
            }
          }
          // Current is to the left of Other
          else if (oLeft >= curRight && oLeft - curRight < 160) {
            const gap = Math.round(oLeft - curRight);
            if (gap > 4) {
              badges.push({
                x: Math.round(curRight + gap / 2),
                y: midY,
                distance: gap,
                orientation: 'horizontal',
                startX: curRight,
                startY: midY,
                endX: oLeft,
                endY: midY,
              });
            }
          }
        }
      }

      nextGuides.verticalLines = Array.from(vLines);
      nextGuides.horizontalLines = Array.from(hLines);
      nextGuides.distanceBadges = badges.slice(0, 4); // Limit badges to keep UI crisp

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
        topMargin: false,
        bottomMargin: false,
        verticalLines: [],
        horizontalLines: [],
        distanceBadges: [],
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
          backgroundColor: el.backgroundColor || 'transparent',
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
          className={`w-full h-full pointer-events-none select-none ${
            el.objectFit === 'contain' ? 'object-contain' : 'object-cover'
          }`}
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

  const renderShapeNode = (el: ShapeCanvasElement) => {
    const shadowCss = el.shadow?.enabled
      ? `${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px ${el.shadow.color}`
      : 'none';

    let borderRadius = el.borderRadius ?? 0;
    if (el.shapeKind === 'circle' || el.shapeKind === 'pill') {
      borderRadius = 9999;
    } else if (el.shapeKind === 'rectangle') {
      borderRadius = 0;
    }

    return (
      <div
        className="w-full h-full relative select-none"
        style={{
          backgroundColor: el.fillColor || theme.accent,
          borderRadius: `${borderRadius}px`,
          border:
            el.strokeWidth && el.strokeWidth > 0
              ? `${el.strokeWidth}px solid ${el.strokeColor || '#000000'}`
              : undefined,
          boxShadow: shadowCss,
        }}
      />
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
          className={`absolute top-0 bottom-0 w-px z-[999] pointer-events-none ${
            isDarkSlide ? 'bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.8)]' : 'bg-blue-900/90'
          }`}
          style={{ left: `${W / 2}px` }}
        />
      )}
      {interactive && guides.horizontalCenter && (
        <div
          className={`absolute left-0 right-0 h-px z-[999] pointer-events-none ${
            isDarkSlide ? 'bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.8)]' : 'bg-blue-900/90'
          }`}
          style={{ top: `${H / 2}px` }}
        />
      )}
      {interactive && guides.leftMargin && (
        <div
          className={`absolute top-0 bottom-0 w-px z-[999] pointer-events-none ${
            isDarkSlide ? 'bg-sky-300/90' : 'bg-sky-500/80'
          }`}
          style={{ left: `${EDITORIAL_MARGIN}px` }}
        />
      )}
      {interactive && guides.rightMargin && (
        <div
          className={`absolute top-0 bottom-0 w-px z-[999] pointer-events-none ${
            isDarkSlide ? 'bg-sky-300/90' : 'bg-sky-500/80'
          }`}
          style={{ left: `${W - EDITORIAL_MARGIN}px` }}
        />
      )}
      {interactive && guides.topMargin && (
        <div
          className={`absolute left-0 right-0 h-px z-[999] pointer-events-none ${
            isDarkSlide ? 'bg-sky-300/90' : 'bg-sky-500/80'
          }`}
          style={{ top: `${EDITORIAL_MARGIN}px` }}
        />
      )}
      {interactive && guides.bottomMargin && (
        <div
          className={`absolute left-0 right-0 h-px z-[999] pointer-events-none ${
            isDarkSlide ? 'bg-sky-300/90' : 'bg-sky-500/80'
          }`}
          style={{ top: `${H - EDITORIAL_MARGIN}px` }}
        />
      )}

      {/* Dynamic Object-to-Object Alignment Lines */}
      {interactive &&
        guides.verticalLines.map((xVal, idx) => (
          <div
            key={`vl-${idx}-${xVal}`}
            className="absolute top-0 bottom-0 w-px bg-rose-500/85 shadow-[0_0_4px_rgba(244,63,94,0.7)] z-[999] pointer-events-none"
            style={{ left: `${xVal}px` }}
          />
        ))}
      {interactive &&
        guides.horizontalLines.map((yVal, idx) => (
          <div
            key={`hl-${idx}-${yVal}`}
            className="absolute left-0 right-0 h-px bg-rose-500/85 shadow-[0_0_4px_rgba(244,63,94,0.7)] z-[999] pointer-events-none"
            style={{ top: `${yVal}px` }}
          />
        ))}

      {/* Dynamic Distance / Gap Measurement Indicators */}
      {interactive &&
        guides.distanceBadges.map((badge, idx) => (
          <React.Fragment key={`badge-${idx}-${badge.orientation}-${badge.x}-${badge.y}`}>
            {/* Gap Extent Line with T-bars */}
            {badge.orientation === 'vertical' ? (
              <div
                className="absolute w-px bg-rose-500/90 pointer-events-none z-[998]"
                style={{
                  left: `${badge.startX}px`,
                  top: `${Math.min(badge.startY, badge.endY)}px`,
                  height: `${Math.abs(badge.endY - badge.startY)}px`,
                }}
              >
                {/* Top T-bar */}
                <div className="absolute top-0 -left-1 w-2.5 h-px bg-rose-500" />
                {/* Bottom T-bar */}
                <div className="absolute bottom-0 -left-1 w-2.5 h-px bg-rose-500" />
              </div>
            ) : (
              <div
                className="absolute h-px bg-rose-500/90 pointer-events-none z-[998]"
                style={{
                  top: `${badge.startY}px`,
                  left: `${Math.min(badge.startX, badge.endX)}px`,
                  width: `${Math.abs(badge.endX - badge.startX)}px`,
                }}
              >
                {/* Left T-bar */}
                <div className="absolute left-0 -top-1 w-px h-2.5 bg-rose-500" />
                {/* Right T-bar */}
                <div className="absolute right-0 -top-1 w-px h-2.5 bg-rose-500" />
              </div>
            )}

            {/* Distance Number Badge */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold shadow-md z-[1000] pointer-events-none flex items-center justify-center tabular-nums leading-none"
              style={{
                left: `${badge.x}px`,
                top: `${badge.y}px`,
              }}
            >
              {badge.distance}px
            </div>
          </React.Fragment>
        ))}

      {/* Slide Elements */}
      {sortedElements.map((el) => {
        if (el.hidden) return null;

        const isSelected = interactive && selectedElementId === el.id;
        const isDragging = isDraggingId === el.id;

        // Determine if this element is over a dark background:
        // Either the slide itself is dark, or there is an image element beneath this element
        // that covers significant space, or if the element is an image itself.
        const isElementOverDark = (() => {
          if (isDarkSlide) return true;
          // Check if there is an image element underneath
          const hasImageBelow = sortedElements.some(
            (other) =>
              other.id !== el.id &&
              other.type === 'image' &&
              !other.hidden &&
              other.zIndex < el.zIndex &&
              other.width >= W * 0.5 &&
              other.height >= H * 0.4 &&
              el.x < other.x + other.width &&
              el.x + el.width > other.x &&
              el.y < other.y + other.height &&
              el.y + el.height > other.y
          );
          return hasImageBelow;
        })();

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
                      ? isElementOverDark
                        ? 'ring-1 ring-sky-300 shadow-[0_0_0_1px_rgba(255,255,255,0.7),0_0_8px_rgba(56,189,248,0.4)]'
                        : 'ring-1 ring-blue-900 shadow-[0_0_0_1px_rgba(30,58,138,0.5),0_0_6px_rgba(30,58,138,0.2)]'
                      : isElementOverDark
                      ? 'hover:ring-1 hover:ring-sky-300/60'
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
              {el.type === 'shape' && renderShapeNode(el as ShapeCanvasElement)}
              {(el.type === 'text' || el.type === 'badge') && renderTextNode(el)}
            </div>

            {/* Selection Controls: Label Pill, Rotation Handle, and 8 Resize Handles */}
            {isSelected && editingTextId !== el.id && (
              <>
                {/* Minimalist Frameless Label: Tanpa Kotak, Font Super Mini & Elegan */}
                {(() => {
                  const labelText = `${el.name} · ${el.width}×${el.height}${rot ? ` · ${rot}°` : ''}${el.locked ? ' · 🔒' : ''}`;
                  return (
                    <div
                      className="absolute -top-3.5 left-0 font-normal tracking-tight whitespace-nowrap pointer-events-none z-50 text-[6.5px] text-zinc-300/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] max-w-[180px] truncate select-none"
                    >
                      {labelText}
                    </div>
                  );
                })()}

                {!el.locked && (
                  <>
                    {/* Minimalist Transparent Rotation Handle */}
                    <div
                      onPointerDown={(e) => startRotate(e, el)}
                      title="Drag to Rotate Object"
                      className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-50 transition-all bg-zinc-950/30 hover:bg-zinc-950/70 text-zinc-400 hover:text-white backdrop-blur-xs border border-white/20 hover:border-white/40"
                    >
                      <RotateCw className="w-2 h-2 opacity-75" />
                    </div>

                    {/* Minimalist Solid Corner & Edge Dots (No Stroke, Clean Solid Dots) */}
                    {(
                      [
                        {
                          h: 'nw',
                          cls: '-top-1 -left-1 cursor-nwse-resize',
                        },
                        {
                          h: 'n',
                          cls: '-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize',
                        },
                        {
                          h: 'ne',
                          cls: '-top-1 -right-1 cursor-nesw-resize',
                        },
                        {
                          h: 'e',
                          cls: 'top-1/2 -translate-y-1/2 -right-1 cursor-ew-resize',
                        },
                        {
                          h: 'se',
                          cls: '-bottom-1 -right-1 cursor-nwse-resize',
                        },
                        {
                          h: 's',
                          cls: '-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize',
                        },
                        {
                          h: 'sw',
                          cls: '-bottom-1 -left-1 cursor-nesw-resize',
                        },
                        {
                          h: 'w',
                          cls: 'top-1/2 -translate-y-1/2 -left-1 cursor-ew-resize',
                        },
                      ] as { h: ResizeHandle; cls: string }[]
                    ).map(({ h, cls }) => (
                      <div
                        key={h}
                        onPointerDown={(e) => startResize(e, el, h)}
                        className={`absolute w-1.5 h-1.5 rounded-xs z-50 bg-white hover:scale-135 transition-transform shadow-xs ${cls}`}
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
