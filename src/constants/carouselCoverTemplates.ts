import type {
  CanvasElement,
  FontWeightValue,
  ImageCanvasElement,
  LayoutPresetId,
  TextCanvasElement,
  TextRole,
} from '../types/studio';

/**
 * Helper to construct TextCanvasElement with default shadow and stroke.
 */
function coverText(item: {
  id: string;
  name: string;
  role?: TextRole;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily?: string;
  fontWeight?: FontWeightValue;
  fontSize?: number;
  italic?: boolean;
  uppercase?: boolean;
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
  rotation?: number;
  zIndex?: number;
  opacity?: number;
  shadow?: { enabled: boolean; offsetX: number; offsetY: number; blur: number; color: string };
  stroke?: { enabled: boolean; width: number; color: string };
}): TextCanvasElement {
  return {
    id: item.id,
    type: 'text',
    name: item.name,
    role: item.role || 'custom',
    content: item.content,
    x: Math.round(item.x),
    y: Math.round(item.y),
    width: Math.round(item.width),
    height: Math.round(item.height),
    rotation: item.rotation,
    zIndex: item.zIndex ?? 10,
    opacity: item.opacity ?? 1,
    fontFamily: item.fontFamily || 'Inter',
    fontWeight: item.fontWeight || 400,
    fontSize: item.fontSize || 16,
    italic: item.italic ?? false,
    uppercase: item.uppercase ?? false,
    textDecoration: item.textDecoration || 'none',
    dropCap: false,
    textAlign: item.textAlign || 'left',
    lineHeight: item.lineHeight ?? 1.2,
    letterSpacing: item.letterSpacing ?? 0,
    color: item.color || '#000000',
    backgroundColor: item.backgroundColor,
    borderColor: item.borderColor,
    borderWidth: item.borderWidth,
    borderRadius: item.borderRadius,
    paddingX: item.paddingX,
    paddingY: item.paddingY,
    shadow: item.shadow || {
      enabled: false,
      offsetX: 0,
      offsetY: 2,
      blur: 8,
      color: 'rgba(0,0,0,0.35)',
    },
    stroke: item.stroke || {
      enabled: false,
      width: 1,
      color: '#000000',
    },
  };
}

/**
 * Helper to construct ImageCanvasElement.
 */
function coverImage(item: {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  opacity?: number;
  zoom?: number;
  panX?: number;
  panY?: number;
  dimmerOpacity?: number;
  dimmerType?: 'solid' | 'bottom-gradient' | 'radial-vignette' | 'radial-spotlight';
  borderRadius?: number;
}): ImageCanvasElement {
  return {
    id: item.id,
    type: 'image',
    name: item.name,
    src: item.src,
    alt: item.name,
    x: Math.round(item.x),
    y: Math.round(item.y),
    width: Math.round(item.width),
    height: Math.round(item.height),
    rotation: item.rotation,
    zIndex: item.zIndex ?? 1,
    opacity: item.opacity ?? 1,
    zoom: item.zoom ?? 1,
    panX: item.panX ?? 50,
    panY: item.panY ?? 50,
    dimmerOpacity: item.dimmerOpacity ?? 0,
    dimmerType: item.dimmerType || 'radial-vignette',
    borderRadius: item.borderRadius ?? 0,
  };
}

export interface CarouselCoverDefinition {
  id: LayoutPresetId;
  name: string;
  category: 'Carousel Covers';
  badge: string;
  description: string;
  backgroundColor: string;
  createElements: (stageWidth?: number, stageHeight?: number) => CanvasElement[];
}

export const CAROUSEL_COVER_PRESETS: CarouselCoverDefinition[] = [
  // =========================================================================
  // 1. SCRAPBOOK BOOST INCOME (Yellow Bubble + Cutout Collage)
  // =========================================================================
  {
    id: 'cover-scrapbook-boost',
    name: 'Scrapbook Boost Income',
    category: 'Carousel Covers',
    badge: 'Cover 01',
    description: 'Chunky yellow bubble headline, cutout photo collage with white sticker borders, and doodle stars.',
    backgroundColor: '#9DA3A4',
    createElements: (_w = 540, _h = 675) => [
      // Background Image
      coverImage({
        id: `cov-boost-bg-${Date.now()}`,
        name: 'Desk Atmosphere Background',
        src: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1200&q=85',
        x: 0,
        y: 0,
        width: 540,
        height: 675,
        zIndex: 1,
        opacity: 0.85,
        dimmerOpacity: 0.25,
        dimmerType: 'radial-vignette',
      }),
      // Floating iPad / Photo Cutout Frame (Right)
      coverImage({
        id: `cov-boost-ipad-${Date.now()}`,
        name: 'Workstation Cutout Card',
        src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=85',
        x: 310,
        y: 195,
        width: 200,
        height: 180,
        rotation: 12,
        zIndex: 5,
        zoom: 1.1,
        borderRadius: 14,
      }),
      // Cutout Book / Magazine (Bottom Left)
      coverImage({
        id: `cov-boost-book-${Date.now()}`,
        name: 'Open Journal Cutout',
        src: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=85',
        x: 25,
        y: 430,
        width: 190,
        height: 170,
        rotation: -8,
        zIndex: 5,
        borderRadius: 12,
      }),
      // Yellow Bubble Headline: "BOOST"
      coverText({
        id: `cov-boost-h1-${Date.now()}`,
        name: 'Headline "BOOST"',
        role: 'header',
        content: 'BOOST',
        x: 45,
        y: 165,
        width: 320,
        height: 95,
        zIndex: 12,
        fontFamily: "'Fredoka', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 900,
        fontSize: 88,
        textAlign: 'left',
        lineHeight: 0.9,
        letterSpacing: -0.02,
        color: '#FACC15',
        stroke: { enabled: true, width: 3.5, color: '#FFFFFF' },
        shadow: { enabled: true, offsetX: 0, offsetY: 4, blur: 12, color: 'rgba(0,0,0,0.45)' },
      }),
      // White Bold Headline: "YOUR\nINCOME,"
      coverText({
        id: `cov-boost-h2-${Date.now()}`,
        name: 'Headline "YOUR INCOME,"',
        role: 'header',
        content: 'YOUR\nINCOME,',
        x: 48,
        y: 252,
        width: 330,
        height: 110,
        zIndex: 12,
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        fontWeight: 900,
        fontSize: 54,
        textAlign: 'left',
        lineHeight: 0.95,
        letterSpacing: -0.03,
        color: '#FFFFFF',
        shadow: { enabled: true, offsetX: 0, offsetY: 3, blur: 10, color: 'rgba(0,0,0,0.55)' },
      }),
      // Yellow Pill Tag: "GET IN TOUCH"
      coverText({
        id: `cov-boost-pill-${Date.now()}`,
        name: 'Callout Pill "GET IN TOUCH"',
        role: 'badge',
        content: 'GET IN TOUCH',
        x: 75,
        y: 368,
        width: 140,
        height: 30,
        zIndex: 14,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 800,
        fontSize: 10.5,
        textAlign: 'center',
        letterSpacing: 0.05,
        color: '#18181B',
        backgroundColor: '#FACC15',
        borderRadius: 15,
        paddingY: 7,
        shadow: { enabled: true, offsetX: 0, offsetY: 2, blur: 6, color: 'rgba(0,0,0,0.25)' },
      }),
      // Doodle Star Ornaments
      coverText({
        id: `cov-boost-stars-${Date.now()}`,
        name: 'Doodle Stars',
        content: '✧ ⋆ ⁺ ✦',
        x: 40,
        y: 228,
        width: 110,
        height: 30,
        zIndex: 15,
        fontSize: 20,
        color: '#FFFFFF',
      }),
      // Creator Branding Handle (Strictly @dinurpradiptaa)
      coverText({
        id: `cov-boost-handle-${Date.now()}`,
        name: 'Creator Branding Handle',
        role: 'caption',
        content: '@dinurpradiptaa',
        x: 45,
        y: 625,
        width: 220,
        height: 24,
        zIndex: 15,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: 0.08,
        color: '#FFFFFF',
        shadow: { enabled: true, offsetX: 0, offsetY: 1, blur: 4, color: 'rgba(0,0,0,0.6)' },
      }),
    ],
  },

  // =========================================================================
  // 2. COZY DID YOU KNOW (Chunky White Bubble + Yellow Note Pad)
  // =========================================================================
  {
    id: 'cover-cozy-didyouknow',
    name: 'Cozy Did You Know',
    category: 'Carousel Covers',
    badge: 'Cover 02',
    description: 'Chunky white rounded bubble letters, yellow notepad card, coffee cutout, and statue aesthetic.',
    backgroundColor: '#8C9294',
    createElements: (_w = 540, _h = 675) => [
      // Background Image
      coverImage({
        id: `cov-dyk-bg-${Date.now()}`,
        name: 'Cozy Interior Atmosphere',
        src: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=85',
        x: 0,
        y: 0,
        width: 540,
        height: 675,
        zIndex: 1,
        opacity: 0.8,
        dimmerOpacity: 0.35,
        dimmerType: 'radial-vignette',
      }),
      // Coffee Cutout Card (Top Right)
      coverImage({
        id: `cov-dyk-coffee-${Date.now()}`,
        name: 'Frothy Coffee Cup Cutout',
        src: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=85',
        x: 350,
        y: 45,
        width: 145,
        height: 145,
        zIndex: 5,
        borderRadius: 9999,
      }),
      // Classical Sculpture Cutout (Bottom Left)
      coverImage({
        id: `cov-dyk-statue-${Date.now()}`,
        name: 'Classical Sculpture Cutout',
        src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=85',
        x: 35,
        y: 440,
        width: 140,
        height: 170,
        zIndex: 5,
        borderRadius: 14,
      }),
      // Headline: "DID YOU\nKNOW?"
      coverText({
        id: `cov-dyk-h1-${Date.now()}`,
        name: 'Bubble Headline "DID YOU KNOW?"',
        role: 'header',
        content: 'DID YOU\nKNOW?',
        x: 140,
        y: 220,
        width: 270,
        height: 130,
        zIndex: 12,
        fontFamily: "'Fredoka', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 900,
        fontSize: 66,
        textAlign: 'center',
        lineHeight: 0.95,
        letterSpacing: -0.02,
        color: '#FFFFFF',
        stroke: { enabled: true, width: 2, color: '#18181B' },
        shadow: { enabled: true, offsetX: 0, offsetY: 4, blur: 12, color: 'rgba(0,0,0,0.5)' },
      }),
      // Yellow Note Pad (Middle Center)
      coverText({
        id: `cov-dyk-note-${Date.now()}`,
        name: 'Yellow Fact Note Pad',
        role: 'custom',
        content: 'Content that connects always\nsolves one specific problem\nwith pure authenticity.',
        x: 120,
        y: 355,
        width: 300,
        height: 80,
        zIndex: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 1.35,
        color: '#18181B',
        backgroundColor: '#FACC15',
        borderColor: '#18181B',
        borderWidth: 1.5,
        borderRadius: 8,
        paddingX: 14,
        paddingY: 12,
        shadow: { enabled: true, offsetX: 0, offsetY: 3, blur: 8, color: 'rgba(0,0,0,0.25)' },
      }),
      // Sparkle Doodles
      coverText({
        id: `cov-dyk-sparkles-${Date.now()}`,
        name: 'Corner Sparkles',
        content: '✦  ⋆',
        x: 110,
        y: 210,
        width: 60,
        height: 30,
        zIndex: 14,
        fontSize: 22,
        color: '#FFFFFF',
      }),
      // Creator Branding Handle
      coverText({
        id: `cov-dyk-handle-${Date.now()}`,
        name: 'Creator Branding Handle',
        role: 'caption',
        content: 'EDITORIAL ARCHIVE · @dinurpradiptaa',
        x: 120,
        y: 625,
        width: 300,
        height: 24,
        zIndex: 15,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 11,
        textAlign: 'center',
        letterSpacing: 0.12,
        color: '#FFFFFF',
        shadow: { enabled: true, offsetX: 0, offsetY: 1, blur: 4, color: 'rgba(0,0,0,0.6)' },
      }),
    ],
  },

  // =========================================================================
  // 3. TOP TIPS CONTENT KING (Yellow Bubble + Matcha Coffee Lifestyle)
  // =========================================================================
  {
    id: 'cover-tips-content-king',
    name: 'Top Tips Content King',
    category: 'Carousel Covers',
    badge: 'Cover 03',
    description: 'Yellow bubble heading "CONTENT IS KING", flatlay cafe backdrop, and campaign callout pill.',
    backgroundColor: '#7A8082',
    createElements: (_w = 540, _h = 675) => [
      // Background Image
      coverImage({
        id: `cov-king-bg-${Date.now()}`,
        name: 'Cafe Flatlay Texture',
        src: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=85',
        x: 0,
        y: 0,
        width: 540,
        height: 675,
        zIndex: 1,
        opacity: 0.85,
        dimmerOpacity: 0.3,
        dimmerType: 'radial-vignette',
      }),
      // Coffee Cup Cutout (Top Left)
      coverImage({
        id: `cov-king-coffee-${Date.now()}`,
        name: 'Latte Art Cutout',
        src: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=85',
        x: 25,
        y: 35,
        width: 100,
        height: 100,
        zIndex: 5,
        borderRadius: 9999,
      }),
      // Girl / Creator Cutout (Bottom Left)
      coverImage({
        id: `cov-king-person-${Date.now()}`,
        name: 'Creator Aesthetic Cutout',
        src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=85',
        x: 28,
        y: 430,
        width: 150,
        height: 180,
        zIndex: 5,
        borderRadius: 14,
      }),
      // Yellow Bubble Headline: "CONTENT\nIS KING"
      coverText({
        id: `cov-king-h1-${Date.now()}`,
        name: 'Bubble Headline "CONTENT IS KING"',
        role: 'header',
        content: 'CONTENT\nIS KING',
        x: 55,
        y: 200,
        width: 430,
        height: 150,
        zIndex: 12,
        fontFamily: "'Fredoka', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 900,
        fontSize: 76,
        textAlign: 'center',
        lineHeight: 0.95,
        letterSpacing: -0.02,
        color: '#FACC15',
        stroke: { enabled: true, width: 3, color: '#18181B' },
        shadow: { enabled: true, offsetX: 0, offsetY: 4, blur: 14, color: 'rgba(0,0,0,0.5)' },
      }),
      // Callout Yellow Note
      coverText({
        id: `cov-king-note-${Date.now()}`,
        name: 'Campaign Note Card',
        role: 'custom',
        content: 'CRAFTING\nCOMPELLING DIGITAL\nMARKETING\nCAMPAIGNS',
        x: 240,
        y: 375,
        width: 220,
        height: 95,
        zIndex: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 800,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 1.25,
        letterSpacing: 0.02,
        color: '#18181B',
        backgroundColor: '#FACC15',
        borderColor: '#18181B',
        borderWidth: 2,
        borderRadius: 10,
        paddingX: 12,
        paddingY: 12,
        shadow: { enabled: true, offsetX: 0, offsetY: 3, blur: 8, color: 'rgba(0,0,0,0.3)' },
      }),
      // Sunglasses Sticker 🕶️
      coverText({
        id: `cov-king-glasses-${Date.now()}`,
        name: 'Sunglasses Sticker',
        content: '🕶️',
        x: 185,
        y: 135,
        width: 50,
        height: 50,
        zIndex: 14,
        fontSize: 38,
        color: '#18181B',
      }),
      // Creator Branding Handle
      coverText({
        id: `cov-king-handle-${Date.now()}`,
        name: 'Creator Branding Handle',
        role: 'caption',
        content: '@dinurpradiptaa',
        x: 240,
        y: 625,
        width: 220,
        height: 24,
        zIndex: 15,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        textAlign: 'center',
        letterSpacing: 0.08,
        color: '#FFFFFF',
      }),
    ],
  },

  // =========================================================================
  // 4. PASTEL CONSISTENT CREATOR (Baby Blue & Coral Studio Vibe)
  // =========================================================================
  {
    id: 'cover-pastel-consistency',
    name: 'Pastel Consistent Creator',
    category: 'Carousel Covers',
    badge: 'Cover 04',
    description: 'Baby blue puffy typography, pastel pink sticky note underlay, and clean studio creator vibe.',
    backgroundColor: '#F0F9FF',
    createElements: (_w = 540, _h = 675) => [
      // Top Kicker Tag: "HOW TO BE"
      coverText({
        id: `cov-pas-kicker-${Date.now()}`,
        name: 'Top Tag "HOW TO BE"',
        role: 'kicker',
        content: 'HOW TO BE',
        x: 140,
        y: 110,
        width: 260,
        height: 28,
        zIndex: 10,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 800,
        fontSize: 15,
        textAlign: 'center',
        letterSpacing: 0.08,
        color: '#0284C7',
      }),
      // Big Pastel Card Underlay Box
      {
        id: `cov-pas-box-${Date.now()}`,
        type: 'shape',
        name: 'Pastel Card Underlay',
        shapeKind: 'rounded-rect',
        x: 55,
        y: 140,
        width: 430,
        height: 190,
        zIndex: 2,
        opacity: 0.95,
        fillColor: '#FFFFFF',
        strokeColor: '#BAE6FD',
        strokeWidth: 2,
        borderRadius: 16,
      },
      // Blue Puffy Headline: "CONSISTENT ON\nSOCIAL MEDIA"
      coverText({
        id: `cov-pas-h1-${Date.now()}`,
        name: 'Puffy Headline',
        role: 'header',
        content: 'CONSISTENT ON\nSOCIAL MEDIA',
        x: 65,
        y: 155,
        width: 410,
        height: 100,
        zIndex: 10,
        fontFamily: "'Fredoka', 'Plus Jakarta Sans', sans-serif",
        fontWeight: 900,
        fontSize: 44,
        textAlign: 'center',
        lineHeight: 1.05,
        letterSpacing: -0.02,
        color: '#0284C7',
      }),
      // Soft Cyan Pill Subtitle: "*without losing your sanity*"
      coverText({
        id: `cov-pas-sub-${Date.now()}`,
        name: 'Sanity Subtitle Pill',
        role: 'custom',
        content: '*without losing your sanity*',
        x: 100,
        y: 265,
        width: 340,
        height: 38,
        zIndex: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        fontSize: 14,
        textAlign: 'center',
        color: '#0369A1',
        backgroundColor: '#E0F2FE',
        borderRadius: 8,
        paddingY: 8,
      }),
      // Creator Portrait Photo Frame (Bottom Center)
      coverImage({
        id: `cov-pas-creator-${Date.now()}`,
        name: 'Creator Studio Photo',
        src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
        x: 135,
        y: 355,
        width: 270,
        height: 230,
        zIndex: 6,
        borderRadius: 16,
      }),
      // Floating Carousel Badge Icon
      coverText({
        id: `cov-pas-carousel-badge-${Date.now()}`,
        name: 'Carousel Icon',
        content: '⊞',
        x: 435,
        y: 35,
        width: 40,
        height: 40,
        zIndex: 15,
        fontSize: 26,
        color: '#94A3B8',
      }),
      // Realistic Tips Pill (Bottom Right)
      coverText({
        id: `cov-pas-tips-badge-${Date.now()}`,
        name: '5 Realistic Tips Tag',
        role: 'badge',
        content: '5 REALISTIC TIPS ➔',
        x: 310,
        y: 595,
        width: 185,
        height: 34,
        zIndex: 15,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 800,
        fontSize: 11,
        textAlign: 'center',
        color: '#DB2777',
        backgroundColor: '#FCE7F3',
        borderRadius: 17,
        paddingY: 9,
      }),
      // Creator Branding Handle
      coverText({
        id: `cov-pas-handle-${Date.now()}`,
        name: 'Creator Branding Handle',
        role: 'caption',
        content: '@dinurpradiptaa',
        x: 55,
        y: 600,
        width: 180,
        height: 24,
        zIndex: 15,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        color: '#0284C7',
      }),
    ],
  },

  // =========================================================================
  // 5. BERRY CONTENT BATCHING (Delicious Cafe & White Sticker Serif)
  // =========================================================================
  {
    id: 'cover-berry-batching-date',
    name: 'Berry Content Batching',
    category: 'Carousel Covers',
    badge: 'Cover 05',
    description: 'Strawberry cafe pancake backdrop with thick white-bordered deep berry serif typography & stamp.',
    backgroundColor: '#FFFDF9',
    createElements: (_w = 540, _h = 675) => [
      // Background Image
      coverImage({
        id: `cov-berry-bg-${Date.now()}`,
        name: 'Strawberry Pancake Flatlay',
        src: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85',
        x: 0,
        y: 0,
        width: 540,
        height: 675,
        zIndex: 1,
        opacity: 0.9,
      }),
      // Push Pin on Top (Left)
      coverText({
        id: `cov-berry-pin-${Date.now()}`,
        name: 'Push Pin Ornament',
        content: '📌',
        x: 28,
        y: 20,
        width: 36,
        height: 36,
        zIndex: 15,
        fontSize: 26,
      }),
      // Top Kicker Pill: "Come along for my"
      coverText({
        id: `cov-berry-kicker-${Date.now()}`,
        name: 'Top Script Kicker Pill',
        role: 'kicker',
        content: 'Come along for my',
        x: 110,
        y: 175,
        width: 170,
        height: 32,
        zIndex: 12,
        fontFamily: "'Dancing Script', 'Pacifico', cursive",
        fontWeight: 700,
        fontSize: 16,
        textAlign: 'center',
        color: '#FFFFFF',
        backgroundColor: '#EC4899',
        borderRadius: 16,
        paddingY: 4,
      }),
      // Retro Serif Headline: "Weekly\ncontent\nbatching\ndate" (with White Sticker Border effect)
      coverText({
        id: `cov-berry-h1-${Date.now()}`,
        name: 'Sticker Serif Headline',
        role: 'header',
        content: 'Weekly\ncontent\nbatching\ndate',
        x: 65,
        y: 215,
        width: 410,
        height: 220,
        zIndex: 12,
        fontFamily: "'Fraunces', 'Bookmania', 'Playfair Display', serif",
        fontWeight: 900,
        fontSize: 58,
        textAlign: 'center',
        lineHeight: 0.95,
        letterSpacing: -0.03,
        color: '#6B1D2F', // Deep Berry Wine
        stroke: { enabled: true, width: 4.5, color: '#FFFFFF' },
        shadow: { enabled: true, offsetX: 0, offsetY: 4, blur: 12, color: 'rgba(0,0,0,0.35)' },
      }),
      // Oval Stamp Badge "@dinurpradiptaa"
      coverText({
        id: `cov-berry-stamp-${Date.now()}`,
        name: 'Oval Stamp Badge',
        role: 'badge',
        content: '★ ARUNE EDITORIAL ★\n@dinurpradiptaa',
        x: 45,
        y: 435,
        width: 150,
        height: 52,
        rotation: -12,
        zIndex: 15,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 1.25,
        letterSpacing: 0.04,
        color: '#BE185D',
        backgroundColor: '#FDF2F8',
        borderColor: '#BE185D',
        borderWidth: 1.5,
        borderRadius: 26,
        paddingX: 10,
        paddingY: 10,
      }),
      // "New" Badge (Bottom Left)
      coverText({
        id: `cov-berry-new-badge-${Date.now()}`,
        name: '"New" Tag',
        role: 'badge',
        content: 'New',
        x: 45,
        y: 595,
        width: 60,
        height: 28,
        zIndex: 15,
        fontFamily: "'Playfair Display', serif",
        fontWeight: 700,
        fontSize: 18,
        textAlign: 'left',
        color: '#6B1D2F',
      }),
      // Creator Branding Handle (Bottom Right)
      coverText({
        id: `cov-berry-handle-${Date.now()}`,
        name: 'Creator Branding Handle',
        role: 'caption',
        content: '@dinurpradiptaa',
        x: 310,
        y: 600,
        width: 185,
        height: 24,
        zIndex: 15,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        textAlign: 'right',
        letterSpacing: 0.08,
        color: '#6B1D2F',
      }),
    ],
  },

  // =========================================================================
  // 6. MAGENTA CAROUSEL PLAYBOOK (Rich Magenta & Floating Polaroid Spread)
  // =========================================================================
  {
    id: 'cover-magenta-playbook',
    name: 'Magenta Carousel Playbook',
    category: 'Carousel Covers',
    badge: 'Cover 06',
    description: 'Deep berry magenta canvas, floating polaroid cards with white borders, and sticker serif headline.',
    backgroundColor: '#7A1437',
    createElements: (_w = 540, _h = 675) => [
      // Dual Polaroid Photo Cards (Left & Right)
      coverImage({
        id: `cov-mag-photo1-${Date.now()}`,
        name: 'Polaroid Card 1',
        src: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=700&q=85',
        x: 45,
        y: 85,
        width: 175,
        height: 200,
        rotation: -7,
        zIndex: 4,
        borderRadius: 8,
      }),
      coverImage({
        id: `cov-mag-photo2-${Date.now()}`,
        name: 'Polaroid Card 2',
        src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85',
        x: 320,
        y: 95,
        width: 175,
        height: 200,
        rotation: 6,
        zIndex: 4,
        borderRadius: 8,
      }),
      // White Push Pins 📌 on Polaroid Cards
      coverText({
        id: `cov-mag-pin1-${Date.now()}`,
        name: 'Push Pin 1',
        content: '📌',
        x: 120,
        y: 72,
        width: 32,
        height: 32,
        zIndex: 10,
        fontSize: 24,
      }),
      coverText({
        id: `cov-mag-pin2-${Date.now()}`,
        name: 'Push Pin 2',
        content: '📌',
        x: 395,
        y: 82,
        width: 32,
        height: 32,
        zIndex: 10,
        fontSize: 24,
      }),
      // Oval Stamp Badge "@dinurpradiptaa"
      coverText({
        id: `cov-mag-stamp-${Date.now()}`,
        name: 'Oval Stamp Badge',
        role: 'badge',
        content: '★ CREATOR PLAYBOOK ★\n@dinurpradiptaa',
        x: 195,
        y: 35,
        width: 150,
        height: 48,
        zIndex: 12,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontSize: 9.5,
        textAlign: 'center',
        lineHeight: 1.25,
        letterSpacing: 0.04,
        color: '#F472B6',
        backgroundColor: '#831843',
        borderColor: '#F472B6',
        borderWidth: 1.5,
        borderRadius: 24,
        paddingX: 8,
        paddingY: 8,
      }),
      // Big Retro Serif Headline
      coverText({
        id: `cov-mag-h1-${Date.now()}`,
        name: 'Playbook Headline',
        role: 'header',
        content: 'Things I do\nevery week to\nmake content\nmuch easier',
        x: 35,
        y: 325,
        width: 470,
        height: 210,
        zIndex: 12,
        fontFamily: "'Fraunces', 'Bookmania', 'Playfair Display', serif",
        fontWeight: 900,
        fontSize: 52,
        textAlign: 'center',
        lineHeight: 0.96,
        letterSpacing: -0.03,
        color: '#FFFFFF',
        shadow: { enabled: true, offsetX: 0, offsetY: 4, blur: 14, color: 'rgba(0,0,0,0.45)' },
      }),
      // Script Pill Tag: "+ it's a rinse + repeat"
      coverText({
        id: `cov-mag-sub-pill-${Date.now()}`,
        name: 'Rinse & Repeat Pill',
        role: 'badge',
        content: "+ it's a rinse + repeat",
        x: 175,
        y: 540,
        width: 190,
        height: 32,
        zIndex: 14,
        fontFamily: "'Dancing Script', 'Pacifico', cursive",
        fontWeight: 700,
        fontSize: 16,
        textAlign: 'center',
        color: '#FFFFFF',
        backgroundColor: '#EC4899',
        borderRadius: 16,
        paddingY: 4,
      }),
      // Creator Branding Handle
      coverText({
        id: `cov-mag-handle-${Date.now()}`,
        name: 'Creator Branding Handle',
        role: 'caption',
        content: 'CURATED BY @dinurpradiptaa',
        x: 120,
        y: 625,
        width: 300,
        height: 24,
        zIndex: 15,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 11,
        textAlign: 'center',
        letterSpacing: 0.15,
        color: '#FBCFE8',
      }),
    ],
  },
];
