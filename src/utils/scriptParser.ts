import {
  ASPECT_RATIOS,
  CURATED_EDITORIAL_IMAGES,
} from '../constants/themesAndPresets';
import type {
  AspectRatioKey,
  CanvasElement,
  DividerCanvasElement,
  ImageCanvasElement,
  LayoutPresetId,
  Slide,
  TextCanvasElement,
  TextRole,
  ThemePalette,
} from '../types/studio';

export interface ParsedSlideScript {
  layout: LayoutPresetId;
  header?: string;
  kicker?: string;
  title?: string;
  lead?: string;
  body?: string;
  caption?: string;
}

const VALID_LAYOUTS: LayoutPresetId[] = [
  // Classic Editorial
  'cover-overlay',
  'editorial-dropcap',
  'top-photo-bottom-split',
  'split-vertical-collage',
  'full-bleed-bottom-story',
  'editorial-bento-grid',
  // Media / Newsroom
  'media-breaking-cover',
  'media-stat-card',
  'media-quote-split',
  'media-timeline-list',
  'media-outro-cta',
  // Minimalist Mono
  'minimal-bold-cover',
  'minimal-quote-focus',
  'minimal-photo-frame',
  'minimal-numbered-list',
  // Playful Pop
  'playful-hero-cover',
  'playful-card-step',
  'playful-dual-cards',
  'playful-bento-fun',
  'playful-outro-cta',
  // Aesthetic Typography Stories
  'typo-untold-story',
  'typo-playful-arch',
  'typo-brush-satire',
  'typo-cinematic-indie',
  'typo-split-journal',
];

function createDefaultShadow(enabled = false, color = 'rgba(0,0,0,0.45)') {
  return {
    enabled,
    offsetX: 0,
    offsetY: 2,
    blur: 10,
    color,
  };
}

function createDefaultStroke() {
  return {
    enabled: false,
    width: 1,
    color: '#000000',
  };
}

export function parseScriptToStructuredSlides(scriptText: string): ParsedSlideScript[] {
  const rawBlocks = scriptText
    .split(/(?=^---\s*\[layout:)/m)
    .map((b) => b.trim())
    .filter(Boolean);

  if (rawBlocks.length === 0 && scriptText.trim()) {
    rawBlocks.push(scriptText.trim());
  }

  return rawBlocks.map((block, index) => {
    const lines = block.split(/\r?\n/);
    let layout: LayoutPresetId = VALID_LAYOUTS[index % VALID_LAYOUTS.length];

    const firstLine = lines[0]?.trim() || '';
    const layoutMatch = firstLine.match(/^---\s*\[layout:\s*([a-z0-9-]+)\s*\]/i);
    let startLineIdx = 0;

    if (layoutMatch) {
      const candidate = layoutMatch[1].toLowerCase() as LayoutPresetId;
      if (VALID_LAYOUTS.includes(candidate)) {
        layout = candidate;
      }
      startLineIdx = 1;
    } else if (firstLine.startsWith('---')) {
      startLineIdx = 1;
    }

    const fields: Partial<Record<'header' | 'kicker' | 'title' | 'lead' | 'body' | 'caption', string>> = {};
    let currentKey: 'header' | 'kicker' | 'title' | 'lead' | 'body' | 'caption' | null = null;

    for (let i = startLineIdx; i < lines.length; i++) {
      const line = lines[i];
      const tagMatch = line.match(/^#(header|kicker|title|lead|body|caption):\s*(.*)$/i);
      if (tagMatch) {
        currentKey = tagMatch[1].toLowerCase() as
          | 'header'
          | 'kicker'
          | 'title'
          | 'lead'
          | 'body'
          | 'caption';
        fields[currentKey] = tagMatch[2];
      } else if (currentKey && line.trim() !== '') {
        fields[currentKey] = fields[currentKey]
          ? `${fields[currentKey]}\n${line}`
          : line;
      }
    }

    return {
      layout,
      ...fields,
    };
  });
}

function makeTextElement(
  partial: Partial<TextCanvasElement> & {
    id: string;
    name: string;
    role: TextRole;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
  },
  theme: ThemePalette
): TextCanvasElement {
  const hasBracketDropCap = /^\[([A-Za-z])\]/.test(partial.content.trim());
  return {
    id: partial.id,
    type: partial.type || 'text',
    name: partial.name,
    role: partial.role,
    content: partial.content,
    x: Math.round(partial.x),
    y: Math.round(partial.y),
    width: Math.round(partial.width),
    height: Math.round(partial.height),
    rotation: partial.rotation,
    zIndex: partial.zIndex ?? 10,
    opacity: partial.opacity ?? 1,
    fontFamily: partial.fontFamily || theme.headingFont,
    fontWeight: partial.fontWeight || 400,
    fontSize: partial.fontSize || 16,
    italic: partial.italic ?? false,
    uppercase: partial.uppercase ?? false,
    dropCap: partial.dropCap ?? hasBracketDropCap,
    dropCapColor: partial.dropCapColor || theme.accent,
    textAlign: partial.textAlign || 'left',
    lineHeight: partial.lineHeight ?? 1.4,
    letterSpacing: partial.letterSpacing ?? 0,
    color: partial.color || theme.textPrimary,
    backgroundColor: partial.backgroundColor,
    borderColor: partial.borderColor,
    borderWidth: partial.borderWidth,
    borderRadius: partial.borderRadius,
    paddingX: partial.paddingX,
    paddingY: partial.paddingY,
    shadow: partial.shadow || createDefaultShadow(false),
    stroke: partial.stroke || createDefaultStroke(),
  };
}

function makeImageElement(
  partial: Partial<ImageCanvasElement> & {
    id: string;
    name: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
): ImageCanvasElement {
  return {
    id: partial.id,
    type: 'image',
    name: partial.name,
    src: partial.src,
    alt: partial.alt || partial.name,
    x: Math.round(partial.x),
    y: Math.round(partial.y),
    width: Math.round(partial.width),
    height: Math.round(partial.height),
    zIndex: partial.zIndex ?? 1,
    opacity: partial.opacity ?? 1,
    zoom: partial.zoom ?? 1,
    panX: partial.panX ?? 50,
    panY: partial.panY ?? 50,
    dimmerOpacity: partial.dimmerOpacity ?? 0,
    dimmerType: partial.dimmerType || 'bottom-gradient',
    borderRadius: partial.borderRadius ?? 0,
    brightness: partial.brightness,
    contrast: partial.contrast,
    saturation: partial.saturation,
    grayscale: partial.grayscale,
    blur: partial.blur,
  };
}

function makeDividerElement(
  partial: Partial<DividerCanvasElement> & {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }
): DividerCanvasElement {
  return {
    id: partial.id,
    type: 'divider',
    name: partial.name,
    x: Math.round(partial.x),
    y: Math.round(partial.y),
    width: Math.round(partial.width),
    height: Math.round(partial.height),
    zIndex: partial.zIndex ?? 8,
    opacity: partial.opacity ?? 1,
    orientation: partial.orientation || 'horizontal',
    color: partial.color,
    thickness: partial.thickness ?? 1,
    style: partial.style || 'solid',
  };
}

export function buildSlideFromParsedScript(
  parsed: ParsedSlideScript,
  slideIndex: number,
  theme: ThemePalette,
  aspectRatio: AspectRatioKey,
  existingImages?: ImageCanvasElement[]
): Slide {
  const { stageWidth: W, stageHeight: H } = ASPECT_RATIOS[aspectRatio];
  const slideId = `slide-${slideIndex + 1}-${Date.now().toString(36).slice(-4)}`;
  const prefix = `s${slideIndex + 1}`;
  const elements: CanvasElement[] = [];

  const getImgSrc = (slotIndex: number, fallbackUrl: string) => {
    return existingImages?.[slotIndex]?.src || fallbackUrl;
  };

  const layout = parsed.layout;

  if (layout === 'cover-overlay') {
    // Full-bleed cover with atmospheric vignette and centered editorial typography
    elements.push(
      makeImageElement({
        id: `${prefix}-img-cover`,
        name: 'Cover Hero Photo',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.coverForest),
        x: 0,
        y: 0,
        width: W,
        height: H,
        zIndex: 1,
        dimmerOpacity: 0.42,
        dimmerType: 'radial-vignette',
      })
    );

    // Top subtle border rule
    elements.push(
      makeDividerElement({
        id: `${prefix}-div-top`,
        name: 'Top Frame Rule',
        x: 38,
        y: 38,
        width: W - 76,
        height: 12,
        color: 'rgba(247, 244, 238, 0.32)',
        zIndex: 5,
      })
    );

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Cover Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: 50,
            y: H * 0.29,
            width: W - 100,
            height: 26,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 10,
            uppercase: true,
            letterSpacing: 0.28,
            textAlign: 'center',
            color: 'rgba(247, 244, 238, 0.88)',
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Cover Display Title',
            role: 'title',
            content: parsed.title,
            x: 40,
            y: H * 0.34,
            width: W - 80,
            height: 148,
            fontFamily: theme.headingFont,
            fontWeight: 400,
            fontSize: 56,
            lineHeight: 1.04,
            letterSpacing: -0.01,
            textAlign: 'center',
            color: theme.textOnDark,
            shadow: createDefaultShadow(true, 'rgba(0,0,0,0.38)'),
            zIndex: 11,
          },
          theme
        )
      );
    }

    // Center accent divider
    elements.push(
      makeDividerElement({
        id: `${prefix}-div-center`,
        name: 'Center Accent Line',
        x: W / 2 - 28,
        y: H * 0.59,
        width: 56,
        height: 12,
        color: 'rgba(247, 244, 238, 0.55)',
        zIndex: 9,
      })
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-lead`,
            name: 'Cover Subtitle Lead',
            role: 'lead',
            content: parsed.lead,
            x: 64,
            y: H * 0.63,
            width: W - 128,
            height: 44,
            fontFamily: theme.sansFont,
            fontWeight: 400,
            fontSize: 9.5,
            uppercase: true,
            letterSpacing: 0.24,
            lineHeight: 1.6,
            textAlign: 'center',
            color: 'rgba(247, 244, 238, 0.9)',
            zIndex: 12,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Cover Footer Caption',
            role: 'caption',
            content: parsed.caption,
            x: 60,
            y: H - 56,
            width: W - 120,
            height: 24,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 9,
            uppercase: true,
            letterSpacing: 0.3,
            textAlign: 'center',
            color: 'rgba(247, 244, 238, 0.78)',
            zIndex: 13,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.darkBackground,
      elements,
    };
  }

  if (layout === 'editorial-dropcap') {
    // Running header + rule
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Running Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 28,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-header`,
        name: 'Header Rule',
        x: 36,
        y: 50,
        width: W - 72,
        height: 10,
        color: theme.divider,
        zIndex: 8,
      })
    );

    // Left Portrait Photo
    const photoTop = 72;
    const photoHeight = Math.round(H * 0.64);
    const photoWidth = 212;
    elements.push(
      makeImageElement({
        id: `${prefix}-img-left`,
        name: 'Editorial Feature Photo',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.wovenTunnel),
        x: 36,
        y: photoTop,
        width: photoWidth,
        height: photoHeight,
        zIndex: 2,
      })
    );

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Photo Caption',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: photoTop + photoHeight + 14,
            width: photoWidth,
            height: 54,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 11.5,
            lineHeight: 1.45,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    // Right Editorial Column
    const rightX = 272;
    const rightW = W - rightX - 36;

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Section Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: rightX,
            y: 76,
            width: rightW,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.2,
            color: theme.accent,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Headline Title',
            role: 'title',
            content: parsed.title,
            x: rightX,
            y: 102,
            width: rightW,
            height: 88,
            fontFamily: theme.headingFont,
            fontWeight: 400,
            fontSize: 34,
            lineHeight: 1.08,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-lead`,
            name: 'Editorial Standfirst / Lead',
            role: 'lead',
            content: parsed.lead,
            x: rightX,
            y: 202,
            width: rightW,
            height: 118,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 13.5,
            lineHeight: 1.52,
            color: theme.textSecondary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-mid`,
        name: 'Column Divider',
        x: rightX,
        y: 332,
        width: 48,
        height: 10,
        color: theme.accent,
        zIndex: 9,
      })
    );

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Drop-Cap Body Prose',
            role: 'body',
            content: parsed.body,
            x: rightX,
            y: 352,
            width: rightW,
            height: Math.max(160, H - 410),
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 13.5,
            lineHeight: 1.62,
            textAlign: 'justify',
            dropCap: true,
            dropCapColor: theme.accent,
            color: theme.textPrimary,
            zIndex: 13,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'top-photo-bottom-split') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Running Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 26,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    const imgTop = 54;
    const imgH = Math.round(H * 0.53);
    elements.push(
      makeImageElement({
        id: `${prefix}-img-top`,
        name: 'Upper Feature Photo',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.bambooStaircase),
        x: 36,
        y: imgTop,
        width: W - 72,
        height: imgH,
        zIndex: 2,
      })
    );

    const splitY = imgTop + imgH + 28;

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Chapter Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: 36,
            y: splitY,
            width: 170,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 9,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.accent,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Split Display Title',
            role: 'title',
            content: parsed.title,
            x: 36,
            y: splitY + 24,
            width: 185,
            height: 96,
            fontFamily: theme.headingFont,
            fontWeight: 400,
            fontSize: 38,
            lineHeight: 1.05,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    // Vertical subtle divider between title & body
    elements.push(
      makeDividerElement({
        id: `${prefix}-div-vert`,
        name: 'Split Vertical Rule',
        x: 234,
        y: splitY + 4,
        width: 12,
        height: Math.max(100, H - splitY - 64),
        orientation: 'vertical',
        color: theme.divider,
        zIndex: 8,
      })
    );

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Split Narrative Body',
            role: 'body',
            content: parsed.body,
            x: 256,
            y: splitY + 4,
            width: W - 256 - 36,
            height: Math.max(120, H - splitY - 56),
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 14.5,
            lineHeight: 1.62,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'split-vertical-collage') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Running Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 28,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-top`,
        name: 'Top Rule',
        x: 36,
        y: 50,
        width: W - 72,
        height: 10,
        color: theme.divider,
        zIndex: 8,
      })
    );

    // Left narrative column
    const leftW = 216;
    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Story Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: 36,
            y: 84,
            width: leftW,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.2,
            color: theme.accent,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Chapter Title',
            role: 'title',
            content: parsed.title,
            x: 36,
            y: 112,
            width: leftW,
            height: 92,
            fontFamily: theme.headingFont,
            fontWeight: 400,
            fontSize: 38,
            lineHeight: 1.06,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-accent`,
        name: 'Accent Rule',
        x: 36,
        y: 214,
        width: 44,
        height: 10,
        color: theme.accent,
        zIndex: 9,
      })
    );

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Chapter Body',
            role: 'body',
            content: parsed.body,
            x: 36,
            y: 236,
            width: leftW,
            height: 210,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.65,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Collage Caption',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 84,
            width: leftW,
            height: 44,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 11.5,
            lineHeight: 1.45,
            color: theme.textSecondary,
            zIndex: 13,
          },
          theme
        )
      );
    }

    // Right Vertical Diptych (2 stacked/staggered images)
    const rightX = 274;
    const rightW = W - rightX - 36;
    const availH = H - 118;
    const topImgH = Math.round(availH * 0.48);
    const botImgH = availH - topImgH - 14;

    elements.push(
      makeImageElement({
        id: `${prefix}-img-1`,
        name: 'Collage Top Frame',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.roomInterior1),
        x: rightX,
        y: 72,
        width: rightW,
        height: topImgH,
        zIndex: 2,
      })
    );

    elements.push(
      makeImageElement({
        id: `${prefix}-img-2`,
        name: 'Collage Bottom Frame',
        src: getImgSrc(1, CURATED_EDITORIAL_IMAGES.roomInterior2),
        x: rightX,
        y: 72 + topImgH + 14,
        width: rightW,
        height: botImgH,
        zIndex: 3,
      })
    );

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'full-bleed-bottom-story') {
    elements.push(
      makeImageElement({
        id: `${prefix}-img-bleed`,
        name: 'Full Bleed Background Photo',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.sunlitBalcony),
        x: 0,
        y: 0,
        width: W,
        height: H,
        zIndex: 1,
        dimmerOpacity: 0.62,
        dimmerType: 'bottom-gradient',
      })
    );

    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Top Story Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 30,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.24,
            color: 'rgba(247, 244, 238, 0.85)',
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-top`,
        name: 'Top Translucent Rule',
        x: 36,
        y: 52,
        width: W - 72,
        height: 10,
        color: 'rgba(247, 244, 238, 0.28)',
        zIndex: 9,
      })
    );

    const bottomBlockY = H - 236;

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Story Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: 42,
            y: bottomBlockY,
            width: W - 84,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 9,
            uppercase: true,
            letterSpacing: 0.25,
            color: 'rgba(247, 244, 238, 0.85)',
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Full-Bleed Title',
            role: 'title',
            content: parsed.title,
            x: 42,
            y: bottomBlockY + 22,
            width: W - 84,
            height: 58,
            fontFamily: theme.headingFont,
            fontWeight: 400,
            fontSize: 42,
            lineHeight: 1.06,
            color: theme.textOnDark,
            shadow: createDefaultShadow(true, 'rgba(0,0,0,0.35)'),
            zIndex: 12,
          },
          theme
        )
      );
    }

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Full-Bleed Narrative',
            role: 'body',
            content: parsed.body,
            x: 42,
            y: bottomBlockY + 88,
            width: W - 104,
            height: 96,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 15,
            lineHeight: 1.58,
            color: 'rgba(247, 244, 238, 0.92)',
            zIndex: 13,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.darkBackground,
      elements,
    };
  }

  // 6th layout: 'editorial-bento-grid'
  // Top narrative header + Asymmetric 4-frame Bento Mosaic (Left tall + Right 3 stacked) + Bottom caption
  if (layout === 'editorial-bento-grid') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Running Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 24,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-top`,
        name: 'Header Rule',
        x: 36,
        y: 44,
        width: W - 72,
        height: 8,
        color: theme.divider,
        zIndex: 8,
      })
    );

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Bento Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: 36,
            y: 58,
            width: 180,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.2,
            color: theme.accent,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Bento Title',
            role: 'title',
            content: parsed.title,
            x: 36,
            y: 78,
            width: 196,
            height: 76,
            fontFamily: theme.headingFont,
            fontWeight: 400,
            fontSize: 33,
            lineHeight: 1.05,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Bento Intro Body',
            role: 'body',
            content: parsed.body,
            x: 244,
            y: 58,
            width: W - 244 - 36,
            height: 104,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 12.5,
            lineHeight: 1.52,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    // Asymmetric 4-Photo Bento Grid
    const gridTop = 172;
    const gridBottomMargin = parsed.caption ? 76 : 44;
    const gridH = Math.max(240, H - gridTop - gridBottomMargin);
    const gap = 10;
    const leftColW = Math.round((W - 72 - gap) * 0.54);
    const rightColW = W - 72 - gap - leftColW;
    const rightX = 36 + leftColW + gap;
    const smallH = Math.floor((gridH - gap * 2) / 3);

    elements.push(
      makeImageElement({
        id: `${prefix}-img-bento-left`,
        name: 'Bento Left Feature',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.bentoStones),
        x: 36,
        y: gridTop,
        width: leftColW,
        height: gridH,
        zIndex: 2,
      })
    );

    elements.push(
      makeImageElement({
        id: `${prefix}-img-bento-r1`,
        name: 'Bento Top Right (Pond)',
        src: getImgSrc(1, CURATED_EDITORIAL_IMAGES.bentoPond),
        x: rightX,
        y: gridTop,
        width: rightColW,
        height: smallH,
        zIndex: 3,
      })
    );

    elements.push(
      makeImageElement({
        id: `${prefix}-img-bento-r2`,
        name: 'Bento Mid Right (Path)',
        src: getImgSrc(2, CURATED_EDITORIAL_IMAGES.bentoPath),
        x: rightX,
        y: gridTop + smallH + gap,
        width: rightColW,
        height: smallH,
        zIndex: 4,
      })
    );

    elements.push(
      makeImageElement({
        id: `${prefix}-img-bento-r3`,
        name: 'Bento Bottom Right (Garden)',
        src: getImgSrc(3, CURATED_EDITORIAL_IMAGES.bentoGarden),
        x: rightX,
        y: gridTop + (smallH + gap) * 2,
        width: rightColW,
        height: gridH - (smallH + gap) * 2,
        zIndex: 5,
      })
    );

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Bento Gallery Caption',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: gridTop + gridH + 10,
            width: W - 72,
            height: 36,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 11,
            lineHeight: 1.4,
            color: theme.textSecondary,
            zIndex: 13,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  // =========================================================================
  // MEDIA / NEWSROOM LAYOUTS
  // =========================================================================
  if (layout === 'media-breaking-cover') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'News Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 26,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-breaking-tag`,
          name: 'Breaking Badge',
          role: 'badge',
          type: 'badge',
          content: parsed.kicker || 'BREAKING NEWS',
          x: 36,
          y: 52,
          width: 144,
          height: 24,
          fontFamily: theme.sansFont,
          fontWeight: 700,
          fontSize: 9,
          uppercase: true,
          letterSpacing: 0.18,
          textAlign: 'center',
          color: '#FFFFFF',
          backgroundColor: theme.accent,
          borderRadius: 4,
          paddingY: 5,
          zIndex: 11,
        },
        theme
      )
    );

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Breaking Title',
            role: 'title',
            content: parsed.title,
            x: 36,
            y: 84,
            width: W - 72,
            height: 96,
            fontFamily: theme.headingFont,
            fontWeight: 700,
            fontSize: 34,
            lineHeight: 1.08,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    const heroImgY = 188;
    const heroImgH = Math.round(H * 0.44);
    elements.push(
      makeImageElement({
        id: `${prefix}-img-hero`,
        name: 'News Photo',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.mediaNewsHero),
        x: 36,
        y: heroImgY,
        width: W - 72,
        height: heroImgH,
        borderRadius: 4,
        zIndex: 2,
      })
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-img-source`,
          name: 'Photo Source Tag',
          role: 'caption',
          type: 'badge',
          content: 'FOTO: REUTERS / PERS',
          x: 46,
          y: heroImgY + heroImgH - 28,
          width: 130,
          height: 18,
          fontFamily: theme.sansFont,
          fontWeight: 600,
          fontSize: 7.5,
          uppercase: true,
          letterSpacing: 0.14,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.95)',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          borderRadius: 3,
          paddingY: 3,
          zIndex: 5,
        },
        theme
      )
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-lead`,
            name: 'News Summary Lead',
            role: 'lead',
            content: parsed.lead,
            x: 36,
            y: heroImgY + heroImgH + 16,
            width: W - 72,
            height: 70,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 1.5,
            color: theme.textPrimary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Dateline Caption',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 38,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.18,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'media-stat-card') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'News Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 26,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-top`,
        name: 'Header Rule',
        x: 36,
        y: 46,
        width: W - 72,
        height: 6,
        color: theme.divider,
        zIndex: 8,
      })
    );

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Section Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: 36,
            y: 58,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 9,
            uppercase: true,
            letterSpacing: 0.2,
            color: theme.accent,
            zIndex: 10,
          },
          theme
        )
      );
    }

    const boxY = 86;
    const boxH = Math.round(H * 0.36);
    elements.push(
      makeTextElement(
        {
          id: `${prefix}-stat-box`,
          name: 'Stat Card Container',
          role: 'custom',
          type: 'badge',
          content: '',
          x: 36,
          y: boxY,
          width: W - 72,
          height: boxH,
          backgroundColor: theme.surface,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.divider,
          zIndex: 1,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-stat-number`,
          name: 'Giant Metric Value',
          role: 'title',
          content: parsed.title || '+78%',
          x: 56,
          y: boxY + 18,
          width: W - 112,
          height: 80,
          fontFamily: theme.headingFont,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1,
          color: theme.accent,
          zIndex: 10,
        },
        theme
      )
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-stat-label`,
            name: 'Stat Subtitle',
            role: 'lead',
            content: parsed.lead,
            x: 56,
            y: boxY + 104,
            width: W - 112,
            height: 48,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 10.5,
            uppercase: true,
            letterSpacing: 0.16,
            lineHeight: 1.45,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Analysis Narrative',
            role: 'body',
            content: parsed.body,
            x: 36,
            y: boxY + boxH + 24,
            width: W - 72,
            height: 120,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.58,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Source Attribution',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 42,
            width: W - 72,
            height: 22,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 9,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'media-quote-split') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'News Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 26,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-top`,
        name: 'Header Rule',
        x: 36,
        y: 46,
        width: W - 72,
        height: 6,
        color: theme.divider,
        zIndex: 8,
      })
    );

    const quoteY = 66;
    const quoteH = Math.round(H * 0.32);

    elements.push(
      makeDividerElement({
        id: `${prefix}-quote-bar`,
        name: 'Quote Accent Bar',
        x: 36,
        y: quoteY,
        width: 6,
        height: quoteH,
        orientation: 'vertical',
        color: theme.accent,
        thickness: 6,
        zIndex: 9,
      })
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-quote`,
          name: 'Pull Quote',
          role: 'title',
          content: parsed.title || 'Kutipan Pernyataan Redaksi',
          x: 56,
          y: quoteY,
          width: W - 92,
          height: quoteH,
          fontFamily: theme.headingFont,
          fontWeight: 400,
          fontSize: 25,
          italic: true,
          lineHeight: 1.25,
          color: theme.textPrimary,
          zIndex: 10,
        },
        theme
      )
    );

    const speakerY = quoteY + quoteH + 20;
    elements.push(
      makeImageElement({
        id: `${prefix}-speaker-img`,
        name: 'Speaker Portrait',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.mediaSpeaker),
        x: 36,
        y: speakerY,
        width: 64,
        height: 64,
        borderRadius: 32,
        zIndex: 3,
      })
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-speaker-name`,
            name: 'Speaker Name',
            role: 'lead',
            content: parsed.lead,
            x: 114,
            y: speakerY + 10,
            width: W - 150,
            height: 22,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 11,
            uppercase: true,
            letterSpacing: 0.16,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-speaker-role`,
            name: 'Speaker Role',
            role: 'kicker',
            content: parsed.kicker,
            x: 114,
            y: speakerY + 34,
            width: W - 150,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 9.5,
            color: theme.textSecondary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Context Body',
            role: 'body',
            content: parsed.body,
            x: 36,
            y: speakerY + 84,
            width: W - 72,
            height: 100,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 13.5,
            lineHeight: 1.54,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Location Dateline',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 38,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'media-timeline-list') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'News Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 26,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeDividerElement({
        id: `${prefix}-div-top`,
        name: 'Header Rule',
        x: 36,
        y: 46,
        width: W - 72,
        height: 6,
        color: theme.divider,
        zIndex: 8,
      })
    );

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Highlights Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: 36,
            y: 58,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 9,
            uppercase: true,
            letterSpacing: 0.2,
            color: theme.accent,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Main Section Title',
            role: 'title',
            content: parsed.title,
            x: 36,
            y: 80,
            width: W - 72,
            height: 52,
            fontFamily: theme.headingFont,
            fontWeight: 700,
            fontSize: 23,
            lineHeight: 1.15,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    const startY = 148;
    const rowH = Math.round((H - startY - 60) / 3);

    const bullets = [
      {
        num: '01',
        title: 'Inflasi Inti Terkendali & Pasar Stabil',
        desc: 'Bank sentral mempertahankan suku bunga acuan dan mencatat pergerakan nilai tukar yang stabil.',
      },
      {
        num: '02',
        title: 'Armada Transportasi Baru Beroperasi',
        desc: 'Sebanyak 20 unit bus listrik resmi melayani koridor utama kota untuk mengurai kepadatan lalu lintas.',
      },
      {
        num: '03',
        title: 'Pasokan Komoditas Pangan Aman',
        desc: 'Dinas perdagangan memastikan stok pangan pokok tercukupi hingga akhir kuartal ini.',
      },
    ];

    bullets.forEach((b, i) => {
      const curY = startY + i * rowH;

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-row-num-${i + 1}`,
            name: `Item ${b.num} Badge`,
            role: 'badge',
            type: 'badge',
            content: b.num,
            x: 36,
            y: curY + 4,
            width: 32,
            height: 24,
            fontFamily: theme.sansFont,
            fontWeight: 800,
            fontSize: 10.5,
            textAlign: 'center',
            color: '#FFFFFF',
            backgroundColor: theme.accent,
            borderRadius: 4,
            paddingY: 4,
            zIndex: 12,
          },
          theme
        )
      );

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-row-title-${i + 1}`,
            name: `Item ${b.num} Title`,
            role: 'lead',
            content: b.title,
            x: 78,
            y: curY + 2,
            width: W - 114,
            height: 22,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 12,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-row-desc-${i + 1}`,
            name: `Item ${b.num} Text`,
            role: 'body',
            content: b.desc,
            x: 78,
            y: curY + 26,
            width: W - 114,
            height: 48,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 12,
            lineHeight: 1.45,
            color: theme.textSecondary,
            zIndex: 12,
          },
          theme
        )
      );

      if (i < 2) {
        elements.push(
          makeDividerElement({
            id: `${prefix}-row-div-${i + 1}`,
            name: `Row ${b.num} Divider`,
            x: 36,
            y: curY + rowH - 6,
            width: W - 72,
            height: 4,
            color: theme.divider,
            zIndex: 8,
          })
        );
      }
    });

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Footer Timestamp',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 38,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'media-outro-cta') {
    elements.push(
      makeTextElement(
        {
          id: `${prefix}-news-pill`,
          name: 'Newsroom Pill',
          role: 'badge',
          type: 'badge',
          content: 'DAILY BRIEF · EDISI RESMI',
          x: W / 2 - 90,
          y: H * 0.18,
          width: 180,
          height: 24,
          fontFamily: theme.sansFont,
          fontWeight: 700,
          fontSize: 8.5,
          uppercase: true,
          letterSpacing: 0.22,
          textAlign: 'center',
          color: '#FFFFFF',
          backgroundColor: theme.accent,
          borderRadius: 4,
          paddingY: 5,
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title`,
          name: 'Outro Title',
          role: 'title',
          content: parsed.title || 'Simpan & Bagikan Edisi Ini',
          x: 40,
          y: H * 0.25,
          width: W - 80,
          height: 110,
          fontFamily: theme.headingFont,
          fontWeight: 700,
          fontSize: 34,
          lineHeight: 1.12,
          textAlign: 'center',
          color: theme.textOnDark,
          zIndex: 11,
        },
        theme
      )
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-lead`,
            name: 'Outro Subtitle',
            role: 'lead',
            content: parsed.lead,
            x: 50,
            y: H * 0.44,
            width: W - 100,
            height: 48,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 1.5,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.85)',
            zIndex: 12,
          },
          theme
        )
      );
    }

    const btnW = W - 100;
    const btnY = H * 0.56;
    const actions = [
      { text: '↗  Bagikan ke Rekan Anda', bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.25)' },
      { text: '★  Simpan Berita Ini', bg: theme.accent, border: 'transparent' },
      { text: '+  Ikuti Edisi Sore Pukul 17.00', bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.25)' },
    ];

    actions.forEach((act, idx) => {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-btn-${idx + 1}`,
            name: `Action Button ${idx + 1}`,
            role: 'badge',
            type: 'badge',
            content: act.text,
            x: 50,
            y: btnY + idx * 44,
            width: btnW,
            height: 34,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 11,
            textAlign: 'center',
            color: '#FFFFFF',
            backgroundColor: act.bg,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: act.border,
            paddingY: 8,
            zIndex: 15,
          },
          theme
        )
      );
    });

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Official Footer',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 42,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 9,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.65)',
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.darkBackground,
      elements,
    };
  }

  // =========================================================================
  // MINIMALIST / SWISS GRID LAYOUTS
  // =========================================================================
  if (layout === 'minimal-bold-cover') {
    elements.push(
      makeTextElement(
        {
          id: `${prefix}-counter`,
          name: 'Index Counter',
          role: 'kicker',
          content: parsed.kicker || '[ 01 / 04 ] · DESIGN PRINCIPLES',
          x: 40,
          y: 44,
          width: W - 80,
          height: 20,
          fontFamily: theme.sansFont,
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: 0.2,
          color: theme.textSecondary,
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title`,
          name: 'Massive Minimal Title',
          role: 'title',
          content: parsed.title || 'Less, but better.',
          x: 40,
          y: H * 0.22,
          width: W - 80,
          height: 180,
          fontFamily: theme.headingFont,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 0.96,
          letterSpacing: -0.04,
          color: theme.textPrimary,
          zIndex: 11,
        },
        theme
      )
    );

    const ruleY = H * 0.58;
    elements.push(
      makeDividerElement({
        id: `${prefix}-rule-main`,
        name: 'Hairline Rule',
        x: 40,
        y: ruleY,
        width: W - 80,
        height: 2,
        color: theme.divider,
        thickness: 1,
        zIndex: 8,
      })
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-lead`,
            name: 'Minimal Lead',
            role: 'lead',
            content: parsed.lead,
            x: 40,
            y: ruleY + 24,
            width: W - 80,
            height: 70,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 10,
            uppercase: true,
            letterSpacing: 0.2,
            lineHeight: 1.6,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Minimal Footer',
            role: 'caption',
            content: parsed.caption,
            x: 40,
            y: H - 42,
            width: W - 80,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 400,
            fontSize: 8.5,
            letterSpacing: 0.16,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: '#FFFFFF',
      elements,
    };
  }

  if (layout === 'minimal-quote-focus') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Running Header',
            role: 'header',
            content: parsed.header,
            x: 40,
            y: 32,
            width: W - 80,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.2,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.kicker) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-kicker`,
            name: 'Principle Kicker',
            role: 'kicker',
            content: parsed.kicker,
            x: 40,
            y: 56,
            width: 140,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 9,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textPrimary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-quote`,
          name: 'Manifesto Quote',
          role: 'title',
          content: parsed.title || 'Ruang kosong bekerja.',
          x: 44,
          y: H * 0.28,
          width: W - 88,
          height: 160,
          fontFamily: theme.headingFont,
          fontWeight: 600,
          fontSize: 30,
          lineHeight: 1.25,
          textAlign: 'center',
          color: theme.textPrimary,
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeDividerElement({
        id: `${prefix}-dash`,
        name: 'Center Dash',
        x: W / 2 - 16,
        y: H * 0.58,
        width: 32,
        height: 2,
        color: theme.textPrimary,
        thickness: 2,
        zIndex: 9,
      })
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-author`,
            name: 'Quote Author',
            role: 'lead',
            content: parsed.lead,
            x: 40,
            y: H * 0.62,
            width: W - 80,
            height: 24,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 10,
            uppercase: true,
            letterSpacing: 0.24,
            textAlign: 'center',
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Minimal Context',
            role: 'body',
            content: parsed.body,
            x: 54,
            y: H * 0.68,
            width: W - 108,
            height: 70,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 1.55,
            textAlign: 'center',
            color: theme.textSecondary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Grid Note',
            role: 'caption',
            content: parsed.caption,
            x: 40,
            y: H - 42,
            width: W - 80,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 400,
            fontSize: 8.5,
            textAlign: 'center',
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: '#FFFFFF',
      elements,
    };
  }

  if (layout === 'minimal-photo-frame') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Running Header',
            role: 'header',
            content: parsed.header,
            x: 40,
            y: 30,
            width: W - 80,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.2,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    const frameY = 58;
    const frameH = Math.round(H * 0.52);

    elements.push(
      makeImageElement({
        id: `${prefix}-photo-frame`,
        name: 'Geometric Frame',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.minimalistArch),
        x: 40,
        y: frameY,
        width: W - 80,
        height: frameH,
        borderRadius: 0,
        zIndex: 2,
      })
    );

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-fig-caption`,
            name: 'Figure Tag',
            role: 'caption',
            content: parsed.caption,
            x: 40,
            y: frameY + frameH + 14,
            width: W - 80,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 9,
            uppercase: true,
            letterSpacing: 0.16,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Frame Title',
            role: 'title',
            content: parsed.title,
            x: 40,
            y: frameY + frameH + 36,
            width: W - 80,
            height: 36,
            fontFamily: theme.headingFont,
            fontWeight: 700,
            fontSize: 24,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-body`,
            name: 'Minimal Observation',
            role: 'body',
            content: parsed.body,
            x: 40,
            y: frameY + frameH + 74,
            width: W - 80,
            height: 80,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 1.55,
            color: theme.textPrimary,
            zIndex: 12,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: '#FFFFFF',
      elements,
    };
  }

  if (layout === 'minimal-numbered-list') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Running Header',
            role: 'header',
            content: parsed.header,
            x: 40,
            y: 30,
            width: W - 80,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 500,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.2,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Section Title',
            role: 'title',
            content: parsed.title,
            x: 40,
            y: 60,
            width: W - 80,
            height: 48,
            fontFamily: theme.headingFont,
            fontWeight: 700,
            fontSize: 28,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    const items = [
      {
        num: '01',
        title: 'Reduksi Tanpa Kompromi',
        desc: 'Hapus setiap ornamen yang tidak esensial hingga yang tersisa adalah inti murni.',
      },
      {
        num: '02',
        title: 'Hierarki Tipografi Tajam',
        desc: 'Ukuran huruf dan kontras berat menentukan urutan baca tanpa kebingungan.',
      },
      {
        num: '03',
        title: 'Kejelasan & Kejujuran Fungsi',
        desc: 'Bentuk selalu mengikuti fungsi. Jangan menyembunyikan struktur desain.',
      },
    ];

    const listStartY = 130;
    const itemH = Math.round((H - listStartY - 60) / 3);

    items.forEach((it, idx) => {
      const itY = listStartY + idx * itemH;

      elements.push(
        makeDividerElement({
          id: `${prefix}-div-${idx + 1}`,
          name: `Divider ${it.num}`,
          x: 40,
          y: itY,
          width: W - 80,
          height: 2,
          color: theme.divider,
          thickness: 1,
          zIndex: 8,
        })
      );

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-num-${idx + 1}`,
            name: `Number ${it.num}`,
            role: 'badge',
            content: it.num,
            x: 40,
            y: itY + 12,
            width: 44,
            height: 32,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 20,
            color: theme.textPrimary,
            zIndex: 10,
          },
          theme
        )
      );

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title-${idx + 1}`,
            name: `Item Title ${it.num}`,
            role: 'lead',
            content: it.title,
            x: 94,
            y: itY + 14,
            width: W - 134,
            height: 24,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 13,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-desc-${idx + 1}`,
            name: `Item Desc ${it.num}`,
            role: 'body',
            content: it.desc,
            x: 94,
            y: itY + 40,
            width: W - 134,
            height: 48,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 12.5,
            lineHeight: 1.45,
            color: theme.textSecondary,
            zIndex: 11,
          },
          theme
        )
      );
    });

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Minimal Footer',
            role: 'caption',
            content: parsed.caption,
            x: 40,
            y: H - 42,
            width: W - 80,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 400,
            fontSize: 8.5,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: '#FFFFFF',
      elements,
    };
  }

  // =========================================================================
  // PLAYFUL / SOCIAL POP LAYOUTS
  // =========================================================================
  if (layout === 'playful-hero-cover') {
    elements.push(
      makeTextElement(
        {
          id: `${prefix}-pill-badge`,
          name: 'Playful Pill Badge',
          role: 'badge',
          type: 'badge',
          content: parsed.kicker || '✨ REKOMENDASI SERU',
          x: 36,
          y: 44,
          width: 170,
          height: 28,
          fontFamily: theme.sansFont,
          fontWeight: 700,
          fontSize: 9.5,
          uppercase: true,
          letterSpacing: 0.16,
          textAlign: 'center',
          color: '#FFFFFF',
          backgroundColor: theme.accent,
          borderRadius: 999,
          paddingY: 6,
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title`,
          name: 'Bouncy Title',
          role: 'title',
          content: parsed.title || 'Weekend Fun Club!',
          x: 36,
          y: 84,
          width: W - 72,
          height: 100,
          fontFamily: theme.headingFont,
          fontWeight: 800,
          fontSize: 42,
          lineHeight: 1.06,
          color: theme.textPrimary,
          zIndex: 11,
        },
        theme
      )
    );

    const picY = 194;
    const picH = Math.round(H * 0.45);
    elements.push(
      makeImageElement({
        id: `${prefix}-img-hero`,
        name: 'Playful Photo Card',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.playfulPicnic),
        x: 36,
        y: picY,
        width: W - 72,
        height: picH,
        borderRadius: 22,
        zIndex: 2,
      })
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-lead`,
            name: 'Subtitle Card',
            role: 'lead',
            type: 'badge',
            content: parsed.lead,
            x: 36,
            y: picY + picH + 16,
            width: W - 72,
            height: 48,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 10.5,
            uppercase: true,
            letterSpacing: 0.14,
            textAlign: 'center',
            color: theme.textPrimary,
            backgroundColor: theme.surface,
            borderRadius: 14,
            paddingX: 16,
            paddingY: 14,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Swipe Prompt',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 42,
            width: W - 72,
            height: 22,
            fontFamily: theme.sansFont,
            fontWeight: 800,
            fontSize: 10,
            uppercase: true,
            letterSpacing: 0.18,
            textAlign: 'center',
            color: theme.accent,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'playful-card-step') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Fun Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 26,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    const cardY = 56;
    const cardH = Math.round(H * 0.82);

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-card-bg`,
          name: 'Step Card Container',
          role: 'custom',
          type: 'badge',
          content: '',
          x: 36,
          y: cardY,
          width: W - 72,
          height: cardH,
          backgroundColor: theme.surface,
          borderRadius: 24,
          borderWidth: 2,
          borderColor: theme.divider,
          zIndex: 1,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-step-badge`,
          name: 'Step Number Badge',
          role: 'badge',
          type: 'badge',
          content: '1',
          x: 54,
          y: cardY + 18,
          width: 44,
          height: 44,
          fontFamily: theme.headingFont,
          fontWeight: 800,
          fontSize: 22,
          textAlign: 'center',
          color: '#FFFFFF',
          backgroundColor: theme.accent,
          borderRadius: 22,
          paddingY: 8,
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-step-title`,
          name: 'Step Title',
          role: 'title',
          content: parsed.title || 'Langkah Seru',
          x: 108,
          y: cardY + 22,
          width: W - 162,
          height: 44,
          fontFamily: theme.headingFont,
          fontWeight: 700,
          fontSize: 20,
          lineHeight: 1.15,
          color: theme.textPrimary,
          zIndex: 11,
        },
        theme
      )
    );

    const stepImgY = cardY + 74;
    const stepImgH = Math.round(cardH * 0.44);
    elements.push(
      makeImageElement({
        id: `${prefix}-step-img`,
        name: 'Step Image',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.playfulBakery),
        x: 54,
        y: stepImgY,
        width: W - 108,
        height: stepImgH,
        borderRadius: 16,
        zIndex: 3,
      })
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-step-lead`,
            name: 'Quick Tip Pill',
            role: 'lead',
            type: 'badge',
            content: parsed.lead,
            x: 54,
            y: stepImgY + stepImgH + 16,
            width: W - 108,
            height: 28,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 9,
            uppercase: true,
            letterSpacing: 0.14,
            textAlign: 'center',
            color: '#FFFFFF',
            backgroundColor: theme.accent,
            borderRadius: 8,
            paddingY: 7,
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.body) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-step-body`,
            name: 'Friendly Description',
            role: 'body',
            content: parsed.body,
            x: 54,
            y: stepImgY + stepImgH + 52,
            width: W - 108,
            height: 90,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 1.5,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Card Location Note',
            role: 'caption',
            content: parsed.caption,
            x: 54,
            y: cardY + cardH - 32,
            width: W - 108,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 9,
            color: theme.textSecondary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'playful-dual-cards') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Fun Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 26,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Dual Cards Title',
            role: 'title',
            content: parsed.title,
            x: 36,
            y: 52,
            width: W - 72,
            height: 48,
            fontFamily: theme.headingFont,
            fontWeight: 800,
            fontSize: 26,
            lineHeight: 1.15,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    const dualY = 110;
    const dualH = Math.round(H * 0.62);
    const gap = 12;
    const colW = Math.round((W - 72 - gap) / 2);

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-card-a-bg`,
          name: 'Card A Container',
          role: 'custom',
          type: 'badge',
          content: '',
          x: 36,
          y: dualY,
          width: colW,
          height: dualH,
          backgroundColor: theme.surface,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: theme.divider,
          zIndex: 1,
        },
        theme
      )
    );

    elements.push(
      makeImageElement({
        id: `${prefix}-card-a-img`,
        name: 'Card A Image',
        src: getImgSrc(0, CURATED_EDITORIAL_IMAGES.playfulCraft),
        x: 46,
        y: dualY + 10,
        width: colW - 20,
        height: Math.round(dualH * 0.52),
        borderRadius: 14,
        zIndex: 3,
      })
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-card-a-title`,
          name: 'Card A Title',
          role: 'lead',
          content: 'A. DIY Pottery',
          x: 46,
          y: dualY + Math.round(dualH * 0.52) + 20,
          width: colW - 20,
          height: 22,
          fontFamily: theme.sansFont,
          fontWeight: 700,
          fontSize: 12,
          color: theme.textPrimary,
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-card-a-desc`,
          name: 'Card A Desc',
          role: 'body',
          content: 'Bikin cangkir keramik sendiri dengan cat warna-warni!',
          x: 46,
          y: dualY + Math.round(dualH * 0.52) + 44,
          width: colW - 20,
          height: 60,
          fontFamily: theme.bodyFont,
          fontWeight: 400,
          fontSize: 11.5,
          lineHeight: 1.4,
          color: theme.textSecondary,
          zIndex: 10,
        },
        theme
      )
    );

    const cardBX = 36 + colW + gap;
    elements.push(
      makeTextElement(
        {
          id: `${prefix}-card-b-bg`,
          name: 'Card B Container',
          role: 'custom',
          type: 'badge',
          content: '',
          x: cardBX,
          y: dualY,
          width: colW,
          height: dualH,
          backgroundColor: theme.surface,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: theme.divider,
          zIndex: 1,
        },
        theme
      )
    );

    elements.push(
      makeImageElement({
        id: `${prefix}-card-b-img`,
        name: 'Card B Image',
        src: getImgSrc(1, CURATED_EDITORIAL_IMAGES.playfulStreet),
        x: cardBX + 10,
        y: dualY + 10,
        width: colW - 20,
        height: Math.round(dualH * 0.52),
        borderRadius: 14,
        zIndex: 3,
      })
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-card-b-title`,
          name: 'Card B Title',
          role: 'lead',
          content: 'B. Hidden Bakery',
          x: cardBX + 10,
          y: dualY + Math.round(dualH * 0.52) + 20,
          width: colW - 20,
          height: 22,
          fontFamily: theme.sansFont,
          fontWeight: 700,
          fontSize: 12,
          color: theme.textPrimary,
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-card-b-desc`,
          name: 'Card B Desc',
          role: 'body',
          content: 'Cari kafe kecil dan coba menu cromboloni renyah!',
          x: cardBX + 10,
          y: dualY + Math.round(dualH * 0.52) + 44,
          width: colW - 20,
          height: 60,
          fontFamily: theme.bodyFont,
          fontWeight: 400,
          fontSize: 11.5,
          lineHeight: 1.4,
          color: theme.textSecondary,
          zIndex: 10,
        },
        theme
      )
    );

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Footer Caption',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 38,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 9,
            textAlign: 'center',
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'playful-bento-fun') {
    if (parsed.header) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-header`,
            name: 'Fun Header',
            role: 'header',
            content: parsed.header,
            x: 36,
            y: 26,
            width: W - 72,
            height: 18,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 8.5,
            uppercase: true,
            letterSpacing: 0.22,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    if (parsed.title) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-title`,
            name: 'Checklist Title',
            role: 'title',
            content: parsed.title,
            x: 36,
            y: 52,
            width: W - 72,
            height: 44,
            fontFamily: theme.headingFont,
            fontWeight: 800,
            fontSize: 26,
            color: theme.textPrimary,
            zIndex: 11,
          },
          theme
        )
      );
    }

    const gridY = 106;
    const gridH = Math.round(H * 0.68);
    const gap = 12;
    const boxW = Math.round((W - 72 - gap) / 2);
    const boxH = Math.round((gridH - gap) / 2);

    const bentoItems = [
      { emoji: '🎲', title: 'Board Games', note: 'Main Catan atau Uno bareng teman!' },
      { emoji: '📸', title: 'Foto Polaroid', note: 'Abadikan tawa tanpa filter digital.' },
      { emoji: '🍿', title: 'Nonton Kartun', note: 'Maraton film animasi di sofa.' },
      { emoji: '🍹', title: 'Bikin Mocktail', note: 'Campur soda, sirup & buah segar!' },
    ];

    bentoItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bX = 36 + col * (boxW + gap);
      const bY = gridY + row * (boxH + gap);

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-box-bg-${i + 1}`,
            name: `Box ${i + 1} Container`,
            role: 'custom',
            type: 'badge',
            content: '',
            x: bX,
            y: bY,
            width: boxW,
            height: boxH,
            backgroundColor: theme.surface,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: theme.divider,
            zIndex: 1,
          },
          theme
        )
      );

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-box-emoji-${i + 1}`,
            name: `Box ${i + 1} Emoji`,
            role: 'badge',
            content: item.emoji,
            x: bX + 14,
            y: bY + 12,
            width: 36,
            height: 36,
            fontFamily: theme.sansFont,
            fontSize: 24,
            zIndex: 10,
          },
          theme
        )
      );

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-box-title-${i + 1}`,
            name: `Box ${i + 1} Title`,
            role: 'lead',
            content: item.title,
            x: bX + 14,
            y: bY + 54,
            width: boxW - 28,
            height: 24,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 13,
            color: theme.textPrimary,
            zIndex: 10,
          },
          theme
        )
      );

      elements.push(
        makeTextElement(
          {
            id: `${prefix}-box-note-${i + 1}`,
            name: `Box ${i + 1} Note`,
            role: 'body',
            content: item.note,
            x: bX + 14,
            y: bY + 80,
            width: boxW - 28,
            height: 48,
            fontFamily: theme.bodyFont,
            fontWeight: 400,
            fontSize: 11.5,
            lineHeight: 1.4,
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    });

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Footer Caption',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 38,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 9,
            textAlign: 'center',
            color: theme.textSecondary,
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.background,
      elements,
    };
  }

  if (layout === 'playful-outro-cta') {
    elements.push(
      makeTextElement(
        {
          id: `${prefix}-top-badge`,
          name: 'Social Pill Badge',
          role: 'badge',
          type: 'badge',
          content: '✨ YUK IKUTAN DISKUSI',
          x: W / 2 - 90,
          y: H * 0.16,
          width: 180,
          height: 26,
          fontFamily: theme.sansFont,
          fontWeight: 700,
          fontSize: 9,
          uppercase: true,
          letterSpacing: 0.18,
          textAlign: 'center',
          color: '#FFFFFF',
          backgroundColor: theme.accent,
          borderRadius: 999,
          paddingY: 5,
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title`,
          name: 'Playful Outro Title',
          role: 'title',
          content: parsed.title || 'Mana yang paling kamu suka?',
          x: 40,
          y: H * 0.24,
          width: W - 80,
          height: 110,
          fontFamily: theme.headingFont,
          fontWeight: 800,
          fontSize: 38,
          lineHeight: 1.1,
          textAlign: 'center',
          color: theme.textOnDark,
          zIndex: 11,
        },
        theme
      )
    );

    if (parsed.lead) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-lead`,
            name: 'Playful Subtitle',
            role: 'lead',
            content: parsed.lead,
            x: 40,
            y: H * 0.44,
            width: W - 80,
            height: 48,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 11,
            uppercase: true,
            letterSpacing: 0.16,
            textAlign: 'center',
            color: theme.accent,
            zIndex: 12,
          },
          theme
        )
      );
    }

    const btnW = W - 110;
    const btnY = H * 0.54;
    const buttons = [
      { text: '❤️  Suka & Tap 2x', bg: 'rgba(255,255,255,0.14)', textCol: '#FFFFFF' },
      { text: '💬  Tulis di Komentar', bg: theme.accent, textCol: '#FFFFFF' },
      { text: '🔖  Simpan Buat Nanti', bg: 'rgba(255,255,255,0.14)', textCol: '#FFFFFF' },
    ];

    buttons.forEach((btn, idx) => {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-btn-${idx + 1}`,
            name: `Button ${idx + 1}`,
            role: 'badge',
            type: 'badge',
            content: btn.text,
            x: 55,
            y: btnY + idx * 46,
            width: btnW,
            height: 36,
            fontFamily: theme.sansFont,
            fontWeight: 700,
            fontSize: 12,
            textAlign: 'center',
            color: btn.textCol,
            backgroundColor: btn.bg,
            borderRadius: 999,
            paddingY: 8,
            zIndex: 15,
          },
          theme
        )
      );
    });

    if (parsed.caption) {
      elements.push(
        makeTextElement(
          {
            id: `${prefix}-caption`,
            name: 'Social Handle',
            role: 'caption',
            content: parsed.caption,
            x: 36,
            y: H - 42,
            width: W - 72,
            height: 20,
            fontFamily: theme.sansFont,
            fontWeight: 600,
            fontSize: 9.5,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10,
          },
          theme
        )
      );
    }

    return {
      id: slideId,
      layout,
      backgroundColor: theme.darkBackground,
      elements,
    };
  }

  // ============================================================================
  // AESTHETIC TYPOGRAPHY & STORY SERIES (5 Exact Editable Story Layouts)
  // ============================================================================

  if (layout === 'typo-untold-story') {
    elements.push(
      makeImageElement({
        id: `${prefix}-bg-img`,
        name: 'Full-Bleed Story Photo',
        src: CURATED_EDITORIAL_IMAGES.typoUntoldKids,
        x: 0,
        y: 0,
        width: W,
        height: H,
        dimmerOpacity: 0.34,
        dimmerType: 'solid',
        brightness: 92,
        contrast: 105,
        zIndex: 1,
      })
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-header`,
          name: 'Story Number',
          role: 'header',
          content: parsed.header || '03.',
          x: 34,
          y: 34,
          width: 90,
          height: 30,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 19,
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.35)'),
          zIndex: 10,
        },
        theme
      )
    );

    const kickerParts = (parsed.kicker || 'THEUNTOLD STORIES | MARCH\n2022')
      .split('|')
      .map((s) => s.trim());

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-kicker-left`,
          name: 'Spaced Kicker',
          role: 'kicker',
          content: kickerParts[0] || 'THEUNTOLD STORIES',
          x: 34,
          y: Math.round(H * 0.25),
          width: W - 150,
          height: 22,
          fontFamily: 'Inter',
          fontWeight: 500,
          fontSize: 9.5,
          uppercase: true,
          letterSpacing: 0.28,
          color: 'rgba(255, 255, 255, 0.92)',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.4)'),
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-kicker-date`,
          name: 'Date Stamp',
          role: 'custom',
          content: kickerParts[1] || 'MARCH\n2022',
          x: W - 122,
          y: Math.round(H * 0.305),
          width: 88,
          height: 34,
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: 9.5,
          lineHeight: 1.25,
          uppercase: true,
          letterSpacing: 0.14,
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.4)'),
          zIndex: 10,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title`,
          name: 'Lowercase Bold Headline',
          role: 'title',
          content: parsed.title || 'happiness\nis simple.',
          x: 34,
          y: Math.round(H * 0.44),
          width: W - 68,
          height: 98,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 0.96,
          letterSpacing: -0.03,
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.45)'),
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-lead`,
          name: 'Story Subtitle',
          role: 'lead',
          content: parsed.lead || 'Menikmati Sore hari dengan\npotret bahagia',
          x: 34,
          y: Math.round(H * 0.595),
          width: W - 90,
          height: 44,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 13.5,
          lineHeight: 1.28,
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.45)'),
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-body`,
          name: 'Camera & Story Notes',
          role: 'body',
          content:
            parsed.body ||
            'foto ini di ambil dengan menggunakan.\nKamera DSLR Nikon D3400 dan lensa\nfix nikkor 50mm f / 1.8',
          x: 34,
          y: Math.round(H * 0.678),
          width: W - 90,
          height: 58,
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 10,
          lineHeight: 1.48,
          color: 'rgba(255, 255, 255, 0.9)',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.45)'),
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-caption`,
          name: 'Creator Credit',
          role: 'caption',
          content: parsed.caption || 'instastories by zaa',
          x: W - 210,
          y: H - 38,
          width: 176,
          height: 22,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 10.5,
          textAlign: 'right',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.5)'),
          zIndex: 11,
        },
        theme
      )
    );

    return {
      id: slideId,
      layout,
      backgroundColor: '#161B18',
      elements,
    };
  }

  if (layout === 'typo-playful-arch') {
    elements.push(
      makeImageElement({
        id: `${prefix}-bg-img`,
        name: 'Golden Paddy Field Photo',
        src: CURATED_EDITORIAL_IMAGES.typoGoldenPaddy,
        x: 0,
        y: 0,
        width: W,
        height: H,
        dimmerOpacity: 0.24,
        dimmerType: 'solid',
        brightness: 96,
        contrast: 106,
        zIndex: 1,
      })
    );

    const titleLines = (parsed.title || 'TerlihaT\nTerlibaT')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const wordTop = titleLines[0] || 'TerlihaT';
    const wordBottom = titleLines[1] || 'TerlibaT';

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-kicker`,
          name: 'Top Small Connector',
          role: 'kicker',
          content: parsed.kicker || 'Jarang',
          x: Math.round(W * 0.34),
          y: Math.round(H * 0.195),
          width: 130,
          height: 28,
          rotation: -3,
          fontFamily: 'Fredoka',
          fontWeight: 700,
          fontSize: 18,
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.55)'),
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title-1`,
          name: 'Display Word 1',
          role: 'title',
          content: wordTop,
          x: 24,
          y: Math.round(H * 0.228),
          width: W - 48,
          height: 64,
          rotation: -1,
          fontFamily: 'Fredoka',
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 0.95,
          letterSpacing: 0.02,
          textAlign: 'center',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.55)'),
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-lead`,
          name: 'Middle Small Connector',
          role: 'lead',
          content: parsed.lead || 'Tapi Sering',
          x: Math.round(W * 0.27),
          y: Math.round(H * 0.312),
          width: 180,
          height: 28,
          fontFamily: 'Fredoka',
          fontWeight: 700,
          fontSize: 17,
          textAlign: 'center',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.55)'),
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title-2`,
          name: 'Display Word 2',
          role: 'body',
          content: parsed.body || wordBottom,
          x: 24,
          y: Math.round(H * 0.342),
          width: W - 48,
          height: 64,
          rotation: 1,
          fontFamily: 'Fredoka',
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 0.95,
          letterSpacing: 0.02,
          textAlign: 'center',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.55)'),
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-caption`,
          name: 'Instagram URL Footer',
          role: 'caption',
          content: parsed.caption || 'www.instagram.com/firman_nhakim',
          x: 30,
          y: H - 38,
          width: W - 60,
          height: 22,
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 10,
          textAlign: 'center',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.65)'),
          zIndex: 11,
        },
        theme
      )
    );

    return {
      id: slideId,
      layout,
      backgroundColor: '#1E2C15',
      elements,
    };
  }

  if (layout === 'typo-brush-satire') {
    elements.push(
      makeImageElement({
        id: `${prefix}-bg-img`,
        name: 'Moody Rice Field Photo',
        src: CURATED_EDITORIAL_IMAGES.typoDarkPaddy,
        x: 0,
        y: 0,
        width: W,
        height: H,
        dimmerOpacity: 0.44,
        dimmerType: 'solid',
        brightness: 88,
        contrast: 108,
        zIndex: 1,
      })
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-kicker`,
          name: 'Brush Line 1',
          role: 'kicker',
          content: parsed.kicker || 'RAKYAT NYA SIBUK MENCARI SESUAP',
          x: 24,
          y: Math.round(H * 0.155),
          width: W - 48,
          height: 28,
          fontFamily: 'Caveat Brush',
          fontWeight: 400,
          fontSize: 17.5,
          uppercase: true,
          letterSpacing: 0.04,
          textAlign: 'center',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.75)'),
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title`,
          name: 'Brush Giant Word',
          role: 'title',
          content: parsed.title || 'NASI',
          x: 24,
          y: Math.round(H * 0.19),
          width: W - 48,
          height: 86,
          fontFamily: 'Caveat Brush',
          fontWeight: 400,
          fontSize: 78,
          lineHeight: 0.9,
          uppercase: true,
          letterSpacing: 0.04,
          textAlign: 'center',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.8)'),
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-lead`,
          name: 'Brush Line 3',
          role: 'lead',
          content: parsed.lead || 'EH PEJABATNYA SIBUK',
          x: 24,
          y: Math.round(H * 0.318),
          width: W - 48,
          height: 28,
          fontFamily: 'Caveat Brush',
          fontWeight: 400,
          fontSize: 18.5,
          uppercase: true,
          letterSpacing: 0.05,
          textAlign: 'center',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.75)'),
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-body`,
          name: 'Brush Punchline Word',
          role: 'body',
          content: parsed.body || 'KORUPSI',
          x: 24,
          y: Math.round(H * 0.354),
          width: W - 48,
          height: 54,
          fontFamily: 'Caveat Brush',
          fontWeight: 400,
          fontSize: 44,
          lineHeight: 0.95,
          uppercase: true,
          letterSpacing: 0.05,
          textAlign: 'center',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.8)'),
          zIndex: 12,
        },
        theme
      )
    );

    // Bottom Instagram Switcher UI: Reels | [Feed] | Story
    elements.push(
      makeTextElement(
        {
          id: `${prefix}-nav-reels`,
          name: 'Switcher Reels',
          role: 'custom',
          content: 'Reels',
          x: Math.round(W / 2 - 96),
          y: H - 52,
          width: 52,
          height: 24,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 11,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.92)',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.6)'),
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-nav-feed`,
          name: 'Switcher Feed Pill',
          role: 'caption',
          type: 'badge',
          content: parsed.caption && !parsed.caption.includes('|') ? parsed.caption : 'Feed',
          x: Math.round(W / 2 - 32),
          y: H - 55,
          width: 64,
          height: 26,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 11,
          textAlign: 'center',
          color: '#FFFFFF',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderColor: '#FFFFFF',
          borderWidth: 1.5,
          borderRadius: 6,
          paddingY: 4,
          zIndex: 13,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-nav-story`,
          name: 'Switcher Story',
          role: 'custom',
          content: 'Story',
          x: Math.round(W / 2 + 44),
          y: H - 52,
          width: 52,
          height: 24,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 11,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.92)',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.6)'),
          zIndex: 12,
        },
        theme
      )
    );

    return {
      id: slideId,
      layout,
      backgroundColor: '#0E1911',
      elements,
    };
  }

  if (layout === 'typo-cinematic-indie') {
    elements.push(
      makeImageElement({
        id: `${prefix}-bg-img`,
        name: 'Moody Night Window Photo',
        src: CURATED_EDITORIAL_IMAGES.typoNightWindow,
        x: 0,
        y: 0,
        width: W,
        height: H,
        dimmerOpacity: 0.36,
        dimmerType: 'solid',
        brightness: 88,
        contrast: 110,
        zIndex: 1,
      })
    );

    const headerParts = (parsed.header || 'Pause. | Breathe.')
      .split('|')
      .map((s) => s.trim());

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-header-left`,
          name: 'Top Left Indie Cue',
          role: 'header',
          content: headerParts[0] || 'Pause.',
          x: 34,
          y: 28,
          width: 130,
          height: 22,
          fontFamily: 'Space Mono',
          fontWeight: 400,
          fontSize: 11,
          color: '#E85D35',
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-header-right`,
          name: 'Top Right Indie Cue',
          role: 'custom',
          content: headerParts[1] || 'Breathe.',
          x: W - 164,
          y: 28,
          width: 130,
          height: 22,
          fontFamily: 'Space Mono',
          fontWeight: 400,
          fontSize: 11,
          textAlign: 'right',
          color: '#E85D35',
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-kicker`,
          name: 'Indie Credits Block',
          role: 'kicker',
          content: parsed.kicker || 'Desing by Sally Xon\nPhoto by Branislav Rodman',
          x: Math.round(W * 0.44),
          y: Math.round(H * 0.145),
          width: Math.round(W * 0.48),
          height: 38,
          fontFamily: 'Space Mono',
          fontWeight: 400,
          fontSize: 9.5,
          lineHeight: 1.35,
          letterSpacing: -0.02,
          color: 'rgba(235, 225, 215, 0.72)',
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title`,
          name: 'Minimalist Thin Display',
          role: 'title',
          content: parsed.title || 'Thoughts\nshape\nreality',
          x: 34,
          y: Math.round(H * 0.255),
          width: W - 68,
          height: 205,
          fontFamily: 'Inter',
          fontWeight: 300,
          fontSize: 60,
          lineHeight: 1.02,
          letterSpacing: -0.03,
          color: '#F4EFEA',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.35)'),
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-lead`,
          name: 'Monospace Sub-Cue',
          role: 'lead',
          content: parsed.lead || 'Choose them with love',
          x: 36,
          y: Math.round(H * 0.575),
          width: W - 72,
          height: 26,
          fontFamily: 'Space Mono',
          fontWeight: 400,
          fontSize: 11.5,
          letterSpacing: -0.02,
          color: 'rgba(244, 239, 234, 0.86)',
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-caption`,
          name: 'Warm Accent Footer',
          role: 'caption',
          content: parsed.caption || 'Whats inside matters more.',
          x: 34,
          y: H - 56,
          width: W - 68,
          height: 24,
          fontFamily: 'Space Mono',
          fontWeight: 400,
          fontSize: 11.5,
          textAlign: 'center',
          color: '#E85D35',
          zIndex: 12,
        },
        theme
      )
    );

    return {
      id: slideId,
      layout,
      backgroundColor: '#120E0C',
      elements,
    };
  }

  if (layout === 'typo-split-journal') {
    const splitY = Math.round(H * 0.52);

    elements.push(
      makeImageElement({
        id: `${prefix}-img-top`,
        name: 'Top Journal Photo',
        src: CURATED_EDITORIAL_IMAGES.typoStreetCat,
        x: 0,
        y: 0,
        width: W,
        height: splitY,
        dimmerOpacity: 0.36,
        dimmerType: 'solid',
        brightness: 90,
        contrast: 106,
        zIndex: 1,
      })
    );

    elements.push(
      makeImageElement({
        id: `${prefix}-img-bottom`,
        name: 'Bottom Botanical Photo',
        src: CURATED_EDITORIAL_IMAGES.typoDarkFoliage,
        x: 0,
        y: splitY,
        width: W,
        height: H - splitY,
        dimmerOpacity: 0.3,
        dimmerType: 'solid',
        brightness: 88,
        contrast: 108,
        zIndex: 1,
      })
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-header`,
          name: 'Day Journal Tag',
          role: 'header',
          content: parsed.header || '// day 22\nRamadhan',
          x: 28,
          y: 24,
          width: 120,
          height: 34,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 600,
          fontSize: 9.5,
          lineHeight: 1.25,
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.5)'),
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-kicker`,
          name: 'Micro Slash Tag',
          role: 'kicker',
          content: parsed.kicker || '//restingtime',
          x: 68,
          y: Math.round(H * 0.14),
          width: 130,
          height: 18,
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 8.5,
          color: 'rgba(255, 255, 255, 0.85)',
          zIndex: 11,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-title`,
          name: 'Journal Reminder Title',
          role: 'title',
          content: parsed.title || 'reminder\ntoday with\nresting',
          x: 68,
          y: Math.round(H * 0.165),
          width: 190,
          height: 82,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 800,
          fontSize: 22,
          lineHeight: 1.04,
          letterSpacing: -0.02,
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.45)'),
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-bookmark-badge`,
          name: 'Save Bookmark Icon',
          role: 'badge',
          type: 'badge',
          content: '🔖',
          x: W - 54,
          y: Math.round(H * 0.255),
          width: 26,
          height: 26,
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 11,
          textAlign: 'center',
          color: '#FFFFFF',
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
          borderColor: 'rgba(255, 255, 255, 0.45)',
          borderWidth: 1,
          borderRadius: 6,
          paddingY: 4,
          zIndex: 13,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-lead`,
          name: 'Left Reflection Quote',
          role: 'lead',
          content:
            parsed.lead ||
            'Bagaimana mungkin engkau bisa\nmerasa sombong dan lari dari Allah?',
          x: 28,
          y: Math.round(H * 0.345),
          width: Math.round(W * 0.68),
          height: 36,
          fontFamily: 'Inter',
          fontWeight: 500,
          fontSize: 8.5,
          lineHeight: 1.35,
          color: 'rgba(255, 255, 255, 0.92)',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.55)'),
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-body`,
          name: 'Right Reflection Quote',
          role: 'body',
          content:
            parsed.body ||
            'Padahal Allah lebih deket\nsama kita, bahkan lebih deket dari\nurat nadi kita sendiri',
          x: Math.round(W * 0.3),
          y: Math.round(H * 0.415),
          width: W - Math.round(W * 0.3) - 28,
          height: 44,
          fontFamily: 'Inter',
          fontWeight: 500,
          fontSize: 8.5,
          lineHeight: 1.35,
          textAlign: 'right',
          color: 'rgba(255, 255, 255, 0.92)',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.55)'),
          zIndex: 12,
        },
        theme
      )
    );

    const captionParts = (parsed.caption || 'Archive by\n*Kohh* | #shooton\nsamsung')
      .split('|')
      .map((s) => s.trim());

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-caption-left`,
          name: 'Archive Signature Left',
          role: 'caption',
          content: captionParts[0] || 'Archive by\n*Kohh*',
          x: 28,
          y: H - 56,
          width: 140,
          height: 38,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 500,
          fontSize: 10.5,
          lineHeight: 1.2,
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.65)'),
          zIndex: 12,
        },
        theme
      )
    );

    elements.push(
      makeTextElement(
        {
          id: `${prefix}-caption-right`,
          name: 'Shot On Tag Right',
          role: 'custom',
          content: captionParts[1] || '#shooton\nsamsung',
          x: W - 168,
          y: H - 56,
          width: 140,
          height: 38,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 10.5,
          lineHeight: 1.2,
          textAlign: 'right',
          color: '#FFFFFF',
          shadow: createDefaultShadow(true, 'rgba(0,0,0,0.65)'),
          zIndex: 12,
        },
        theme
      )
    );

    return {
      id: slideId,
      layout,
      backgroundColor: '#121512',
      elements,
    };
  }

  // Fallback if none matched
  return {
    id: slideId,
    layout,
    backgroundColor: theme.background,
    elements,
  };
}

export function extractParsedScriptFromSlide(slide: Slide): ParsedSlideScript {
  const result: ParsedSlideScript = {
    layout: slide.layout,
  };

  for (const el of slide.elements) {
    if (el.type === 'text' || el.type === 'badge') {
      if (
        el.role === 'header' ||
        el.role === 'kicker' ||
        el.role === 'title' ||
        el.role === 'lead' ||
        el.role === 'body' ||
        el.role === 'caption'
      ) {
        result[el.role] = el.content;
      }
    }
  }

  // Provide defaults if switching to a layout that expects certain fields
  if (!result.kicker) result.kicker = 'CHAPTER NOTE';
  if (!result.title) result.title = 'Quiet *moments*';
  if (!result.body) {
    result.body =
      '[W]hen the afternoon slows down, every detail in the room begins to speak in a softer register.';
  }
  if (!result.header) result.header = 'EDITORIAL CHRONICLE — VOL. XIV';
  if (!result.caption) result.caption = '*Notes from the highland sanctuary.*';

  return result;
}
