import type {
  AspectRatioConfig,
  AspectRatioKey,
  CuratedGalleryTemplate,
  FontFamilyName,
  FontVariantOption,
  FontWeightValue,
  GlobalBranding,
  LayoutPresetId,
  ThemePalette,
} from '../types/studio';

export const ASPECT_RATIOS: Record<AspectRatioKey, AspectRatioConfig> = {
  '4:5': {
    key: '4:5',
    label: 'Post 4:5 [1080×1350]',
    shortLabel: 'Post 4:5',
    exportWidth: 1080,
    exportHeight: 1350,
    stageWidth: 540,
    stageHeight: 675,
  },
  '9:16': {
    key: '9:16',
    label: 'Story 9:16 [1080×1920]',
    shortLabel: 'Story 9:16',
    exportWidth: 1080,
    exportHeight: 1920,
    stageWidth: 540,
    stageHeight: 960,
  },
  '1:1': {
    key: '1:1',
    label: 'Square 1:1 [1080×1080]',
    shortLabel: 'Square 1:1',
    exportWidth: 1080,
    exportHeight: 1080,
    stageWidth: 540,
    stageHeight: 540,
  },
};

export const FONT_FAMILIES: {
  name: FontFamilyName;
  category: 'Editorial Serif' | 'Clean Sans';
  sample: string;
  weights: FontWeightValue[];
  hasItalic: boolean;
}[] = [
  {
    name: 'Cormorant Garamond',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Classic Literary',
    weights: [300, 400, 500, 600, 700],
    hasItalic: true,
  },
  {
    name: 'EB Garamond',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Old-Style Book',
    weights: [400, 500, 600, 700, 800],
    hasItalic: true,
  },
  {
    name: 'Playfair Display',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — High-Contrast',
    weights: [400, 500, 600, 700, 800, 900],
    hasItalic: true,
  },
  {
    name: 'Instrument Serif',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Condensed Modern',
    weights: [400],
    hasItalic: true,
  },
  {
    name: 'Inter',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Swiss Neo-Grotesque',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    hasItalic: true,
  },
  {
    name: 'Montserrat',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Geometric Caps',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    hasItalic: true,
  },
  {
    name: 'Plus Jakarta Sans',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Contemporary Humanist',
    weights: [200, 300, 400, 500, 600, 700, 800],
    hasItalic: true,
  },
  {
    name: 'Fredoka',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Expressive Display Pop',
    weights: [400, 500, 600, 700],
    hasItalic: false,
  },
  {
    name: 'Caveat Brush',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Street Brush Marker',
    weights: [400],
    hasItalic: false,
  },
  {
    name: 'Space Mono',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Indie Typewriter Mono',
    weights: [400, 700],
    hasItalic: true,
  },
  {
    name: 'Bebas Neue',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Condensed Poster Caps',
    weights: [400],
    hasItalic: false,
  },
  {
    name: 'Abril Fatface',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Heavy Headline Serif',
    weights: [400],
    hasItalic: false,
  },
  {
    name: 'League Spartan',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Ultra Geometric Bold',
    weights: [400, 600, 700, 800, 900],
    hasItalic: false,
  },
  {
    name: 'Sanchez',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Editorial Slab Serif',
    weights: [400],
    hasItalic: true,
  },
  {
    name: 'Bodoni Moda',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Didone Italian Luxury',
    weights: [400, 600, 700, 800, 900],
    hasItalic: true,
  },
  {
    name: 'Fraunces',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — 70s Soft Display Serif',
    weights: [400, 600, 700, 800, 900],
    hasItalic: true,
  },
  {
    name: 'Cinzel Decorative',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Classical Flared Titling',
    weights: [400, 700, 900],
    hasItalic: false,
  },
  {
    name: 'Great Vibes',
    category: 'Editorial Serif',
    sample: 'Aa Bb Cc — Flourishing Cursive Script',
    weights: [400],
    hasItalic: true,
  },
  {
    name: 'Pacifico',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Retro Casual Script',
    weights: [400],
    hasItalic: false,
  },
  {
    name: 'Quicksand',
    category: 'Clean Sans',
    sample: 'Aa Bb Cc — Soft Rounded Geometric',
    weights: [400, 500, 600, 700],
    hasItalic: false,
  },
];

const WEIGHT_NAMES: Record<FontWeightValue, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

export function getFontVariantsForFamily(
  fontFamily: string
): FontVariantOption[] {
  const studioFont = FONT_FAMILIES.find(
    (f) => f.name.toLowerCase() === fontFamily.toLowerCase()
  );
  const weights: FontWeightValue[] = studioFont
    ? studioFont.weights
    : [300, 400, 500, 600, 700, 800];
  const hasItalic = studioFont ? studioFont.hasItalic : true;

  const variants: FontVariantOption[] = [];

  for (const w of weights) {
    const wName = WEIGHT_NAMES[w];
    variants.push({
      id: `${w}-normal`,
      label: `${wName} (${w})`,
      shortLabel: wName,
      weight: w,
      italic: false,
    });
  }

  if (hasItalic) {
    for (const w of weights) {
      const wName = WEIGHT_NAMES[w];
      variants.push({
        id: `${w}-italic`,
        label: w === 400 ? 'Italic (400)' : `${wName} Italic (${w})`,
        shortLabel: w === 400 ? 'Italic' : `${wName} Italic`,
        weight: w,
        italic: true,
      });
    }
  }

  return variants;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'kinfolk-linen',
    name: 'Kinfolk Linen',
    subtitle: 'Warm alabaster paper & bronze ochre',
    background: '#F4EFE6',
    darkBackground: '#181614',
    surface: '#E8E0D2',
    textPrimary: '#1C1917',
    textSecondary: '#6B635B',
    textOnDark: '#F7F4EE',
    accent: '#8C5A32',
    divider: '#D6CEC0',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'EB Garamond',
    sansFont: 'Inter',
  },
  {
    id: 'cereal-ash',
    name: 'Cereal Minimal Ash',
    subtitle: 'Architectural chalk stone & muted sage',
    background: '#F6F6F3',
    darkBackground: '#141615',
    surface: '#EAEAE4',
    textPrimary: '#181918',
    textSecondary: '#6E716E',
    textOnDark: '#F5F6F4',
    accent: '#4A6353',
    divider: '#D8D9D4',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Cormorant Garamond',
    sansFont: 'Montserrat',
  },
  {
    id: 'muni-forest',
    name: 'Muni Forest',
    subtitle: 'Woven bamboo parchment & canopy moss',
    background: '#F2ECE1',
    darkBackground: '#151D18',
    surface: '#E5DEC9',
    textPrimary: '#19211C',
    textSecondary: '#58625B',
    textOnDark: '#F4F1EA',
    accent: '#9C6639',
    divider: '#CFC6B4',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'EB Garamond',
    sansFont: 'Plus Jakarta Sans',
  },
  {
    id: 'noir-atelier',
    name: 'Noir Atelier',
    subtitle: 'Obsidian gallery & champagne gold',
    background: '#151514',
    darkBackground: '#0D0D0C',
    surface: '#22211F',
    textPrimary: '#F3EFEA',
    textSecondary: '#A09A90',
    textOnDark: '#F5F2EC',
    accent: '#C99E67',
    divider: '#2E2C29',
    headingFont: 'Playfair Display',
    bodyFont: 'Cormorant Garamond',
    sansFont: 'Inter',
  },
  {
    id: 'terracotta-kyoto',
    name: 'Kyoto Washi',
    subtitle: 'Warm cedar paper & persimmon clay',
    background: '#F7EFE8',
    darkBackground: '#211713',
    surface: '#EDE0D4',
    textPrimary: '#241915',
    textSecondary: '#786258',
    textOnDark: '#F9F3EE',
    accent: '#B04A33',
    divider: '#DBCBC0',
    headingFont: 'Instrument Serif',
    bodyFont: 'EB Garamond',
    sansFont: 'Montserrat',
  },
  {
    id: 'media-newsroom',
    name: 'Media Newsroom',
    subtitle: 'Newsprint white, ink black & breaking red',
    background: '#FAFAF7',
    darkBackground: '#0F1115',
    surface: '#ECEBE6',
    textPrimary: '#111111',
    textSecondary: '#5A5A5A',
    textOnDark: '#F7F7F5',
    accent: '#D7261E',
    divider: '#D9D7D0',
    headingFont: 'Playfair Display',
    bodyFont: 'EB Garamond',
    sansFont: 'Inter',
  },
  {
    id: 'minimalist-mono',
    name: 'Minimalist Mono',
    subtitle: 'Pure white space, graphite & Swiss grid',
    background: '#FFFFFF',
    darkBackground: '#111111',
    surface: '#F2F2F2',
    textPrimary: '#141414',
    textSecondary: '#7A7A7A',
    textOnDark: '#FAFAFA',
    accent: '#141414',
    divider: '#E4E4E4',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    sansFont: 'Inter',
  },
  {
    id: 'playful-pop',
    name: 'Playful Pop',
    subtitle: 'Butter cream, grape violet & tangerine',
    background: '#FFF6E5',
    darkBackground: '#2B1B5A',
    surface: '#FFE3B8',
    textPrimary: '#24164D',
    textSecondary: '#6B5A94',
    textOnDark: '#FFF8EC',
    accent: '#FF6B3D',
    divider: '#F3D9AE',
    headingFont: 'Plus Jakarta Sans',
    bodyFont: 'Plus Jakarta Sans',
    sansFont: 'Montserrat',
  },
  {
    id: 'aesthetic-typo',
    name: 'Aesthetic Typo & Story',
    subtitle: 'Moody film grain, warm ember orange & expressive display type',
    background: '#161B18',
    darkBackground: '#0E1310',
    surface: '#222A25',
    textPrimary: '#F7F5F0',
    textSecondary: '#A2B0A7',
    textOnDark: '#FFFFFF',
    accent: '#E85D35',
    divider: 'rgba(255, 255, 255, 0.22)',
    headingFont: 'Plus Jakarta Sans',
    bodyFont: 'Inter',
    sansFont: 'Space Mono',
  },
  {
    id: 'typo-essonnes-parlare',
    name: 'Essonnes & Parlare',
    subtitle: 'High-contrast editorial serif titling with cursive script accent',
    background: '#FFFFFF',
    darkBackground: '#0A1A2F',
    surface: '#F8F9FA',
    textPrimary: '#000000',
    textSecondary: '#4A5568',
    textOnDark: '#FFFFFF',
    accent: '#000000',
    divider: '#E2E8F0',
    headingFont: 'Playfair Display',
    bodyFont: 'EB Garamond',
    sansFont: 'Inter',
  },
  {
    id: 'typo-futura-sloop',
    name: 'Futura & Sloop',
    subtitle: 'Geometric ultra-bold sans with elegant flowing calligraphic script',
    background: '#FFFFFF',
    darkBackground: '#0A1A2F',
    surface: '#F8F9FA',
    textPrimary: '#000000',
    textSecondary: '#4A5568',
    textOnDark: '#FFFFFF',
    accent: '#000000',
    divider: '#E2E8F0',
    headingFont: 'Montserrat',
    bodyFont: 'Inter',
    sansFont: 'Plus Jakarta Sans',
  },
  {
    id: 'typo-bebas-gelato',
    name: 'Bebas Neue & Gelato',
    subtitle: 'Tall condensed headline caps overlaid with playful lively script',
    background: '#FFFFFF',
    darkBackground: '#0A1A2F',
    surface: '#F8F9FA',
    textPrimary: '#000000',
    textSecondary: '#4A5568',
    textOnDark: '#FFFFFF',
    accent: '#000000',
    divider: '#E2E8F0',
    headingFont: 'Bebas Neue',
    bodyFont: 'Montserrat',
    sansFont: 'Inter',
  },
  {
    id: 'typo-playfair-kollektif',
    name: 'Playfair & Kollektif',
    subtitle: 'Understated boutique studio branding: italic serif & clean modern sans',
    background: '#FFFFFF',
    darkBackground: '#0A1A2F',
    surface: '#F8F9FA',
    textPrimary: '#000000',
    textSecondary: '#4A5568',
    textOnDark: '#FFFFFF',
    accent: '#000000',
    divider: '#E2E8F0',
    headingFont: 'Playfair Display',
    bodyFont: 'Plus Jakarta Sans',
    sansFont: 'Inter',
  },
  {
    id: 'typo-league-sanchez',
    name: 'League Spartan & Sanchez',
    subtitle: 'Heavy geometric lowercase heading with rugged slab-serif subtext',
    background: '#FFFFFF',
    darkBackground: '#0A1A2F',
    surface: '#F8F9FA',
    textPrimary: '#000000',
    textSecondary: '#4A5568',
    textOnDark: '#FFFFFF',
    accent: '#000000',
    divider: '#E2E8F0',
    headingFont: 'League Spartan',
    bodyFont: 'Sanchez',
    sansFont: 'Montserrat',
  },
  {
    id: 'typo-abril-glacial',
    name: 'Abril Fatface & Glacial',
    subtitle: 'Ultra-chunky display serif title balanced by airy geometric sans',
    background: '#FFFFFF',
    darkBackground: '#0A1A2F',
    surface: '#F8F9FA',
    textPrimary: '#000000',
    textSecondary: '#4A5568',
    textOnDark: '#FFFFFF',
    accent: '#000000',
    divider: '#E2E8F0',
    headingFont: 'Abril Fatface',
    bodyFont: 'Montserrat',
    sansFont: 'Inter',
  },
  {
    id: 'typo-bodoni-angela',
    name: 'Bodoni & Angela Heart',
    subtitle: 'High-contrast Italian Didone capitals with sign-painter brush lettering',
    background: '#FFFFFF',
    darkBackground: '#0A1A2F',
    surface: '#F8F9FA',
    textPrimary: '#000000',
    textSecondary: '#4A5568',
    textOnDark: '#FFFFFF',
    accent: '#000000',
    divider: '#E2E8F0',
    headingFont: 'Bodoni Moda',
    bodyFont: 'Plus Jakarta Sans',
    sansFont: 'Inter',
  },
];

export interface LayoutPresetDefinition {
  id: LayoutPresetId;
  name: string;
  category: 'Editorial' | 'Media' | 'Minimalist' | 'Playful' | 'Typography' | 'Single Feeds';
  badge: string;
  description: string;
}

export const LAYOUT_PRESETS: LayoutPresetDefinition[] = [
  // ===================== EDITORIAL CLASSIC =====================
  {
    id: 'cover-overlay',
    name: 'Cover Overlay',
    category: 'Editorial',
    badge: 'Cover 01',
    description: 'Full-bleed hero image with warm vignette, centered serif display title, kicker & bottom caption.',
  },
  {
    id: 'editorial-dropcap',
    name: 'Editorial Drop-Cap',
    category: 'Editorial',
    badge: 'Spread 02',
    description: 'Two-column magazine layout with left portrait frame, italic deck & 3-line accent Drop-Cap.',
  },
  {
    id: 'top-photo-bottom-split',
    name: 'Top Photo Split',
    category: 'Editorial',
    badge: 'Feature 03',
    description: 'Wide upper photograph paired with an asymmetric lower split for headline and narrative body.',
  },
  {
    id: 'split-vertical-collage',
    name: 'Vertical Split Collage',
    category: 'Editorial',
    badge: 'Diptych 04',
    description: 'Staggered dual-image vertical collage on the right with quiet editorial prose on the left.',
  },
  {
    id: 'full-bleed-bottom-story',
    name: 'Full Bleed Story',
    category: 'Editorial',
    badge: 'Cinema 05',
    description: 'Edge-to-edge photography with atmospheric gradient dimmer and lower-third editorial essay.',
  },
  {
    id: 'editorial-bento-grid',
    name: 'Asymmetric Bento Grid',
    category: 'Editorial',
    badge: 'Gallery 06',
    description: '4-frame asymmetric mosaic (tall left + 3 stacked right frames) with top narrative header.',
  },

  // ===================== MEDIA / NEWSROOM =====================
  {
    id: 'media-breaking-cover',
    name: 'Breaking News Cover',
    category: 'Media',
    badge: 'Media 01',
    description: 'Authoritative breaking banner, punchy left-aligned headline, framed news photo with credit tag & dateline.',
  },
  {
    id: 'media-stat-card',
    name: 'Headline & Big Data Stat',
    category: 'Media',
    badge: 'Media 02',
    description: 'Oversized +78% metric highlight card paired with headline takeaways, context body & source attribution.',
  },
  {
    id: 'media-quote-split',
    name: 'Statement & Quote Split',
    category: 'Media',
    badge: 'Media 03',
    description: 'Prominent red accent left border, featured speaker portrait, large pull-quote & editorial context.',
  },
  {
    id: 'media-timeline-list',
    name: '3-Point News Highlights',
    category: 'Media',
    badge: 'Media 04',
    description: 'Three structured news bullet cards with index numbers (01, 02, 03), clean dividers & timestamp notes.',
  },
  {
    id: 'media-outro-cta',
    name: 'Newsroom Summary & CTA',
    category: 'Media',
    badge: 'Media 05',
    description: 'Newsroom edition wrap-up card with 3 interactive action badges (Bagikan, Simpan, Komentar) & official footer.',
  },

  // ===================== MINIMALIST / SWISS =====================
  {
    id: 'minimal-bold-cover',
    name: 'Minimal Bold Title',
    category: 'Minimalist',
    badge: 'Mono 01',
    description: 'Pure high-contrast Swiss typography, [ 01 / 04 ] index counter, massive bold headline & hairline rule.',
  },
  {
    id: 'minimal-quote-focus',
    name: 'Minimal Manifesto Statement',
    category: 'Minimalist',
    badge: 'Mono 02',
    description: 'Deep generous negative space surrounding a centered high-contrast focal quotation & subtle accent dot.',
  },
  {
    id: 'minimal-photo-frame',
    name: 'Geometric Photo Frame',
    category: 'Minimalist',
    badge: 'Mono 03',
    description: 'Architectural duotone photo frame with 1px border, razor-sharp caption & clean paragraph beneath.',
  },
  {
    id: 'minimal-numbered-list',
    name: '3-Column Numbered Principles',
    category: 'Minimalist',
    badge: 'Mono 04',
    description: 'Clean stacked numbered rows (01, 02, 03) separated by razor-thin dividers with concise core tenets.',
  },

  // ===================== PLAYFUL / SOCIAL POP =====================
  {
    id: 'playful-hero-cover',
    name: 'Playful Pop Hero Cover',
    category: 'Playful',
    badge: 'Pop 01',
    description: 'Warm buttery background, rounded pill badge, bouncy headline, cheerful photo card & energetic arrow footer.',
  },
  {
    id: 'playful-card-step',
    name: 'Step & Tip Card Container',
    category: 'Playful',
    badge: 'Pop 02',
    description: 'Floating rounded card bubble with number circle badge ("1"), playful title & friendly conversational tips.',
  },
  {
    id: 'playful-dual-cards',
    name: 'Diptych Comparison Cards',
    category: 'Playful',
    badge: 'Pop 03',
    description: 'Two cheerful side-by-side rounded cards with contrasting surface fills, photos, and comparison captions.',
  },
  {
    id: 'playful-bento-fun',
    name: '4-Item Activity Checklist Bento',
    category: 'Playful',
    badge: 'Pop 04',
    description: 'Four colorful rounded box cards arranged neatly with emoji badges and interactive checklist items.',
  },
  {
    id: 'playful-outro-cta',
    name: 'Interactive Social Engagement Outro',
    category: 'Playful',
    badge: 'Pop 05',
    description: 'Cheerful wrap-up card with 3 action buttons (Like ❤️, Komentar 💬, Simpan 🔖) & playful social handle.',
  },

  // ===================== AESTHETIC TYPOGRAPHY & STORY =====================
  {
    id: 'typo-untold-story',
    name: '03. Happiness is Simple',
    category: 'Typography',
    badge: 'Typo 01',
    description: 'Top-left "03." counter, spaced "THEUNTOLD STORIES" & date, bold lowercase "happiness is simple." with camera EXIF notes.',
  },
  {
    id: 'typo-playful-arch',
    name: 'Jarang Terlihat Display',
    category: 'Typography',
    badge: 'Typo 02',
    description: 'Expressive stacked display typography ("Jarang TerlihaT Tapi Sering TerlibaT") over golden paddy field horizon.',
  },
  {
    id: 'typo-brush-satire',
    name: 'Brush Satire & Feed Pill',
    category: 'Typography',
    badge: 'Typo 03',
    description: 'Hand-brushed street typography ("RAKYAT NYA SIBUK MENCARI SESUAP NASI") with Reels / [Feed] / Story bottom bar.',
  },
  {
    id: 'typo-cinematic-indie',
    name: 'Pause. Breathe. Indie',
    category: 'Typography',
    badge: 'Typo 04',
    description: 'Ember orange "Pause. / Breathe." corners, oversized thin "Thoughts shape reality" headline & typewriter mono subtitle.',
  },
  {
    id: 'typo-split-journal',
    name: '// Split Photo Journal',
    category: 'Typography',
    badge: 'Typo 05',
    description: '50/50 top-bottom dual photo split ("// day 22 Ramadhan", "reminder today with resting", bookmark & Kohh archive credit).',
  },
  // ===================== CURATED SINGLE FEEDS =====================
  {
    id: 'feed-plm-community',
    name: 'PLM Social Community',
    category: 'Single Feeds',
    badge: 'Feed 01',
    description: 'Chunky retro editorial serif with pink highlighter, green callouts, floating cursor tags and stickers.',
  },
  {
    id: 'feed-action-clarity',
    name: 'Action Creates Clarity',
    category: 'Single Feeds',
    badge: 'Feed 02',
    description: 'Modern neo-grotesque social quote with profile header, underline, and pink clarity highlighter.',
  },
  {
    id: 'feed-backspace-content',
    name: 'Backspace Better Content',
    category: 'Single Feeds',
    badge: 'Feed 03',
    description: 'Sophisticated agency aesthetic with espresso typography, periwinkle accent bar, and chat CTA.',
  },
  {
    id: 'feed-designer-gatekeep',
    name: "Designers Don't Gatekeep",
    category: 'Single Feeds',
    badge: 'Feed 04',
    description: 'High-fashion condensed editorial serif with electric blue loop circle, folder sticker, and script edition.',
  },
  {
    id: 'feed-burnout-designer',
    name: 'Atin Burn-out Designer',
    category: 'Single Feeds',
    badge: 'Feed 05',
    description: 'Chunky graphic pop poster with white boxed words, sunny yellow burnout pill, and quote note.',
  },
];

export const DEFAULT_BRANDING: GlobalBranding = {
  publicationName: 'ARUNE EDITORIAL STUDIO',
  issueLabel: 'VOL. XIV · CREATIVE JOURNAL',
  authorOrHandle: '@dinurpradiptaa',
  footerNote: 'Banjarmasin - 2026',
  showSlideNumbers: true,
  showFooterBar: true,
};

export const CURATED_EDITORIAL_IMAGES = {
  // Editorial / Nature
  coverForest:
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
  wovenTunnel:
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1000&q=85',
  bambooStaircase:
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85',
  roomInterior1:
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=85',
  roomInterior2:
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85',
  sunlitBalcony:
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=85',
  bentoStones:
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=900&q=85',
  bentoPond:
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=85',
  bentoPath:
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=85',
  bentoGarden:
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=85',

  // Media / Newsroom
  mediaNewsHero:
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=85',
  mediaCityscape:
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=85',
  mediaSpeaker:
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=85',
  mediaWorkstation:
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=85',

  // Minimalist / Geometry
  minimalistArch:
    'https://images.unsplash.com/photo-1486718448742-163732cd1544?auto=format&fit=crop&w=1200&q=85',
  minimalistChair:
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=85',
  minimalistLight:
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=85',

  // Playful / Pop
  playfulPicnic:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85',
  playfulBakery:
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=85',
  playfulCraft:
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=85',
  playfulStreet:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85',

  // Aesthetic Typography & Story Scenes
  typoUntoldKids:
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=85',
  typoGoldenPaddy:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85',
  typoDarkPaddy:
    'https://images.unsplash.com/photo-1536617621572-1d5f1e6269a0?auto=format&fit=crop&w=1200&q=85',
  typoNightWindow:
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=85',
  typoStreetCat:
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=85',
  typoDarkFoliage:
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=85',
};

export const DEFAULT_SCRIPT = `--- [layout: cover-overlay]
#kicker: THE STAYCATION STORY
#title: A Nest
*Above Bandung*
#lead: FAMILY, FOREST AND THE ART OF STAYING STILL
#caption: MUNI FOREST · BANDUNG

--- [layout: editorial-dropcap]
#header: A NEST ABOVE BANDUNG — THE ESCAPE
#kicker: TRAVEL · BANDUNG, INDONESIA
#title: A pause *above the city*
#lead: *No passports and no packed itinerary: just a short escape into the cool, green hills of Cimenyan, and unhurried time together in a hotel woven into the trees.*
#body: [W]e didn't go far. Just a few minutes past Dago Pakar, the city falls away, and Muni Forest reveals itself the way a nest does: first as texture, then as shelter.
#caption: *Left: at the end of the woven tunnel, a first wave hello.*

--- [layout: top-photo-bottom-split]
#header: A NEST ABOVE BANDUNG — ARRIVAL
#kicker: CHAPTER ONE
#title: The way *in*
#body: A staircase climbs through a tunnel of woven branches toward a single bright opening. Before we had even reached our room, the place was quietly asking us to slow down.

--- [layout: split-vertical-collage]
#header: CHAPTER TWO — THE ROOM
#kicker: A NEST ABOVE BANDUNG
#title: Inside *the nest*
#body: The weave follows you indoors. Walls curve overhead like the inside of a basket, lamplight pools on timber floors, and every doorway frames another quiet room.
#caption: *Key no. 12, and a bedside corner.*

--- [layout: full-bleed-bottom-story]
#header: A NEST ABOVE BANDUNG — THE LIGHT
#kicker: CHAPTER THREE
#title: Where the *light* lands
#body: The sun slips past the woven walls and settles on the balcony rail. We followed it from the window to the balcony and let the hours pass slowly.

--- [layout: editorial-bento-grid]
#header: A NEST ABOVE BANDUNG — THE GROUNDS
#kicker: CHAPTER FOUR
#title: Small *discoveries*
#body: Stone figures stacked like quiet giants, a pond cradled between woven pods, and chickens murmuring behind a bamboo frame. The grounds unfold slowly and are best explored at a child's pace.
#caption: *Left: a small explorer among the stones. Right, from top: the pond, the garden path and the neighbours.*`;

export const CURATED_GALLERY_TEMPLATES: CuratedGalleryTemplate[] = [
  {
    id: 'preset-muni-forest-bandung',
    title: 'A Nest Above Bandung',
    subtitle: '6-Slide Kinfolk Staycation Essay in the Cimenyan Highlands',
    category: 'Travel & Sanctuary',
    aspectRatio: '4:5',
    themeId: 'kinfolk-linen',
    branding: DEFAULT_BRANDING,
    scriptText: DEFAULT_SCRIPT,
  },
  {
    id: 'preset-kyoto-tea-architecture',
    title: 'Ceremony of Quiet Cedar',
    subtitle: '5-Slide Monograph on Kyoto Machiya Craft & Morning Tea',
    category: 'Architecture & Craft',
    aspectRatio: '4:5',
    themeId: 'terracotta-kyoto',
    branding: {
      publicationName: 'KYOTO JOURNAL OF CRAFT',
      issueLabel: 'ISSUE NO. 09 · AUTUMN',
      authorOrHandle: '@kyoto.washi.press',
      footerNote: 'HIGASHIYAMA · KYOTO',
      showSlideNumbers: true,
      showFooterBar: true,
    },
    scriptText: `--- [layout: cover-overlay]
#kicker: ARCHITECTURE & RITUAL
#title: Ceremony of
*Quiet Cedar*
#lead: SHADOW, STEAM AND HINOKI TIMBER AT DAWN
#caption: HIGASHIYAMA · KYOTO

--- [layout: editorial-dropcap]
#header: CEREMONY OF QUIET CEDAR — THE COURTYARD
#kicker: ESSAY · KYOTO, JAPAN
#title: Built for *rain and moss*
#lead: *Behind a low noren curtain, the noise of the avenue dissolves into the scent of damp stone and aged cypress.*
#body: [E]very beam in a traditional machiya is joined without a single iron nail. Over decades, the timber breathes with the seasons, darkening to the colour of roasted chestnuts.
#caption: *Left: morning mist over the inner坪庭 (tsuboniwa) garden.*

--- [layout: top-photo-bottom-split]
#header: CEREMONY OF QUIET CEDAR — VESSELS
#kicker: PART ONE
#title: Hands & *clay*
#body: An unglazed stoneware bowl holds the warmth of boiled water long after the kettle is lifted from the hearth. Imperfection is not tolerated here; it is courted.

--- [layout: split-vertical-collage]
#header: PART TWO — THE TATAMI ROOM
#kicker: LIGHT THROUGH SHOJI
#title: Paper *diffusions*
#body: Washi screens soften the sharp autumn sun into an even, chalky glow that flatters both raw plaster and lacquerware.
#caption: *Cedar joinery and handmade Mino paper.*

--- [layout: full-bleed-bottom-story]
#header: CEREMONY OF QUIET CEDAR — EPILOGUE
#kicker: PART THREE
#title: Before the *first guest*
#body: When the garden stones are watered and the iron kettle begins to sing like wind in the pines, the room is finally complete.`,
  },
  {
    id: 'preset-cereal-nordic-monograph',
    title: 'Forms in Chalk & Pine',
    subtitle: '5-Slide Cereal-Inspired Nordic Architectural Study',
    category: 'Interior & Design',
    aspectRatio: '4:5',
    themeId: 'cereal-ash',
    branding: {
      publicationName: 'CEREAL MONOGRAPH SERIES',
      issueLabel: 'VOLUME XXII · NORDIC SPACE',
      authorOrHandle: '@cereal.atelier',
      footerNote: 'COPENHAGEN · AARHUS',
      showSlideNumbers: true,
      showFooterBar: true,
    },
    scriptText: `--- [layout: cover-overlay]
#kicker: ARCHITECTURAL STUDY
#title: Forms in
*Chalk & Pine*
#lead: A RESIDENCE DESIGNED AROUND NORTHERN LIGHT
#caption: AARHUS COAST · DENMARK

--- [layout: top-photo-bottom-split]
#header: FORMS IN CHALK & PINE — PROPORTION
#kicker: SPACE 01
#title: The discipline of *restraint*
#body: By paring the palette down to lime-washed brick, Douglas fir, and brushed steel, the architecture allows the shifting maritime sky to become the primary ornament.

--- [layout: editorial-dropcap]
#header: FORMS IN CHALK & PINE — MATERIALITY
#kicker: ESSAY · DENMARK
#title: Tactile *silence*
#lead: *Acoustics are rarely photographed, yet they define how a room feels within the first three seconds of crossing its threshold.*
#body: [L]ong planks of untreated pine run the entire length of the gallery, absorbing footsteps and echoing the pale horizon outside the floor-to-ceiling glazing.
#caption: *Left: morning light along the west corridor.*

--- [layout: editorial-bento-grid]
#header: FORMS IN CHALK & PINE — DETAILS
#kicker: ARCHIVE
#title: Honest *surfaces*
#body: Every handle, hinge, and window reveal was cast in solid unlacquered brass, intended to record the touch of its inhabitants over generations.
#caption: *Left: courtyard stone. Right, from top: joinery, limestone bench, and coastal pines.*`,
  },
  {
    id: 'preset-noir-atelier-story',
    title: 'Nocturne in Obsidian',
    subtitle: '4-Slide 9:16 Vertical Editorial Story in Dark Gallery Palette',
    category: 'Fashion & Cinema',
    aspectRatio: '9:16',
    themeId: 'noir-atelier',
    branding: {
      publicationName: 'ATELIER NOIR EDITION',
      issueLabel: 'AUTUMN / WINTER ARCHIVE',
      authorOrHandle: '@noir.editorial.studio',
      footerNote: 'PARIS · MILAN',
      showSlideNumbers: true,
      showFooterBar: true,
    },
    scriptText: `--- [layout: cover-overlay]
#kicker: AUTUMN MONOGRAPH
#title: Nocturne in
*Obsidian*
#lead: SILHOUETTE, SHADOW AND QUIET LUXURY
#caption: ATELIER ARCHIVE · 2026

--- [layout: full-bleed-bottom-story]
#header: NOCTURNE IN OBSIDIAN — ACT I
#kicker: THE SILHOUETTE
#title: tailored *for dusk*
#body: Heavy wool gabardine and raw silk catch the last amber streetlamps along the courtyard stones.

--- [layout: split-vertical-collage]
#header: NOCTURNE IN OBSIDIAN — ACT II
#kicker: TEXTURE STUDY
#title: Weight & *drape*
#body: When color is removed, structure speaks first. A collar turned against the evening air becomes architecture in miniature.
#caption: *Look 04 and brushed bronze hardware.*

--- [layout: editorial-dropcap]
#header: NOCTURNE IN OBSIDIAN — EPILOGUE
#kicker: NOTES ON CRAFT
#title: Enduring *form*
#lead: *Garments conceived not for a single season, but for a decade of quiet repetition.*
#body: [T]rue permanence lies in the unseen seams—hand-basted canvas, horn buttons, and linings that move like water.
#caption: *Left: final fitting in the rue Saint-Honoré studio.*`,
  },
  {
    id: 'preset-media-newsroom-brief',
    title: 'The Morning Brief',
    subtitle: '5-Slide News & Media Explainer with Breaking-Red Accents',
    category: 'Media',
    aspectRatio: '4:5',
    themeId: 'media-newsroom',
    branding: {
      publicationName: 'THE DAILY BRIEF',
      issueLabel: 'EDISI PAGI · NO. 128',
      authorOrHandle: '@dailybrief.id',
      footerNote: 'JAKARTA NEWSROOM · 2026',
      showSlideNumbers: true,
      showFooterBar: true,
    },
    scriptText: `--- [layout: media-breaking-cover]
#header: THE DAILY BRIEF — EDISI PAGI NO. 128
#kicker: BREAKING NEWS · EKONOMI & TEKNOLOGI
#title: IHSG Menguat & Redaksi Adopsi AI
#lead: Pasar regional dibuka menguat didorong sektor perbankan, sementara adopsi AI di newsroom global mencapai rekor tertinggi pekan ini.
#caption: JAKARTA NEWSROOM · FOTO: REUTERS

--- [layout: media-stat-card]
#header: THE MORNING BRIEF — DATA & STATISTIK
#kicker: 01 · INDIKATOR UTAMA
#title: +78%
#lead: LONJAKAN PENGGUNAAN ALAT BANTU RISET BERBASIS DATA
#body: Survei redaksi digital mencatat 78% jurnalis kini memakai alat otomasi untuk memverifikasi data dan riset awal sebelum proses penyuntingan dimulai.
#caption: Sumber data: Global Digital Newsroom Survey 2026

--- [layout: media-quote-split]
#header: THE MORNING BRIEF — WAWANCARA EKSKLUSIF
#kicker: 02 · PERNYATAAN KUNCI
#title: "Teknologi mempercepat verifikasi fakta, tetapi nurani jurnalistik tetap di tangan manusia."
#lead: AHMAD FAUZI — PEMIMPIN REDAKSI
#body: Dalam wawancara pagi ini, Fauzi menegaskan bahwa kecerdasan buatan bukan ancaman melainkan partner kerja untuk menghasilkan liputan investigasi mendalam.
#caption: Jakarta Press Center · 2026

--- [layout: media-timeline-list]
#header: THE MORNING BRIEF — 3 SOROTAN HARI INI
#kicker: 03 · RINGKASAN POIN
#title: Tiga agenda penting yang memengaruhi rutinitas Anda
#lead: 01. Inflasi Inti Terkendali · 02. Armada Transportasi Baru · 03. Suku Bunga Acuan Stabil
#body: Bank sentral mempertahankan suku bunga acuan, armada bus listrik bertambah 20 unit di koridor utama, dan harga komoditas pangan stabil di pasar induk.
#caption: Update langsung pukul 06.00 WIB

--- [layout: media-outro-cta]
#header: THE MORNING BRIEF — EDISI SELENGKAPNYA
#kicker: IKUTI BERITA TERBARU
#title: Simpan & Bagikan ke Rekan Kerja Anda
#lead: Dapatkan notifikasi edisi sore pukul 17.00 WIB setiap hari kerja.
#body: Kunjungi portal utama kami untuk analisis komprehensif, grafik interaktif, dan arsip dokumen resmi.
#caption: Redaksi @dailybrief.id · Kredibel & Terpercaya`,
  },
  {
    id: 'preset-minimalist-mono-studio',
    title: 'Less, But Better',
    subtitle: '4-Slide Minimalist Monochrome Studio Manifesto',
    category: 'Minimalist',
    aspectRatio: '1:1',
    themeId: 'minimalist-mono',
    branding: {
      publicationName: 'STUDIO / MONO',
      issueLabel: 'NOTES 01',
      authorOrHandle: '@studio.mono',
      footerNote: 'DESIGN PRINCIPLES',
      showSlideNumbers: true,
      showFooterBar: true,
    },
    scriptText: `--- [layout: minimal-bold-cover]
#header: STUDIO / MONO · MANIFESTO 01
#kicker: [ 01 / 04 ] · DESIGN PRINCIPLES
#title: Less, but better.
#lead: PENGHAPUSAN ELEMEN BERLEBIH UNTUK MENEMUKAN ESENSI BENTUK DAN FUNGSI.
#caption: ARCHIVE 2026 · SWISS TYPOGRAPHY

--- [layout: minimal-quote-focus]
#header: STUDIO / MONO — FOCUS
#kicker: PRINSIP 01
#title: "Ruang kosong bukanlah kekosongan tanpa makna, melainkan elemen visual yang paling aktif."
#lead: DIETER RAMS · ON RESTRAINT
#body: Ketika hiruk-pikuk visual disingkirkan, setiap huruf dan garis mendapat ruang bernapas untuk berbicara secara jujur kepada pembaca.
#caption: 12-Column Grid System · 72px Margins

--- [layout: minimal-photo-frame]
#header: STUDIO / MONO — MATERIALITY
#kicker: PRINSIP 02
#title: Kejujuran *material*
#body: Proporsi yang matang tidak membutuhkan hiasan buatan. Garis tegas dan kontras monokrom sudah cukup memandu perhatian mata.
#caption: Fig 02 — Bauhaus Geometry & Concrete Angle

--- [layout: minimal-numbered-list]
#header: STUDIO / MONO — SUMMARY
#kicker: PRINSIP 03
#title: Tiga pilar kesederhanaan
#lead: 01. Reduksi Tanpa Kompromi · 02. Hierarki Tipografi Tajam · 03. Kejelasan Fungsi
#body: Hindari dekorasi yang tidak memiliki fungsi. Prioritaskan keterbacaan, ritme visual yang konsisten, dan struktur informasi yang logis.
#caption: Studio Mono · All Rights Reserved`,
  },
  {
    id: 'preset-playful-pop-weekend',
    title: 'Weekend Fun Club',
    subtitle: '5-Slide Playful Story for Lifestyle, Kids & Community Brands',
    category: 'Playful',
    aspectRatio: '9:16',
    themeId: 'playful-pop',
    branding: {
      publicationName: 'FUN CLUB WEEKLY',
      issueLabel: 'VOL. 07 · WEEKEND EDITION',
      authorOrHandle: '@funclub.weekly',
      footerNote: 'SWIPE FOR MORE FUN →',
      showSlideNumbers: true,
      showFooterBar: true,
    },
    scriptText: `--- [layout: playful-hero-cover]
#header: FUN CLUB WEEKLY · EDISI 07
#kicker: ✨ REKOMENDASI SERU
#title: Weekend Fun Club!
#lead: 4 IDE HANGOUT & LIBURAN KREATIF MINGGU INI
#caption: SWIPE KE KANAN BUAT LIHAT IDE SERUNYA →

--- [layout: playful-card-step]
#header: FUN CLUB WEEKLY — IDE 01
#kicker: 01 · OUTDOOR VIBES
#title: Piknik estetik di taman kota 🌿
#lead: TIPS: BAWA BEKAL SENDIRI & PLAYLIST ASIK
#body: Gelar tikar kotak-kotak, bawa sandwich buatan sendiri, dan nikmati udara segar bareng teman dekat atau keluarga tanpa gadget!
#caption: Rekomendasi: Taman Hutan Kota pukul 07.30

--- [layout: playful-dual-cards]
#header: FUN CLUB WEEKLY — IDE 02 & 03
#kicker: KREATIF & KULINER
#title: Pilih aktivitas favoritmu!
#lead: A. DIY Pottery Class · B. Jelajah Hidden Gem Bakery
#body: Coba bikin cangkir keramik sendiri dengan cat warna-warni, atau keliling kafe kecil buat cobain pastry hangat yang lagi viral!
#caption: Dua cara asik recharge energi sebelum hari Senin

--- [layout: playful-bento-fun]
#header: FUN CLUB WEEKLY — IDE 04
#kicker: SERU-SERUAN BARENG
#title: Mini Activity Checklist
#lead: 1. Board Games · 2. Foto Polaroid · 3. Nonton Animasi · 4. Bikin Mocktail
#body: Hal kecil yang bisa bikin akhir pekan kamu berkesan tanpa perlu keluar banyak biaya. Ceklis mana aja yang udah kamu coba minggu ini!
#caption: Bagikan checklist ini ke story kamu!

--- [layout: playful-outro-cta]
#header: FUN CLUB WEEKLY — WRAP UP
#kicker: JANGAN LUPA INTERAKSI
#title: Mana ide yang paling kamu suka?
#lead: TULIS JAWABAN KAMU DI KOLOM KOMENTAR YA! 👇
#body: Tap tanda hati jika kamu suka rekomendasi ini, dan simpan postingan ini agar tidak lupa saat akhir pekan tiba!
#caption: @funclub.weekly · Sebarkan energi positif!`,
  },
  {
    id: 'preset-aesthetic-typography-stories',
    title: 'Untold Stories & Aesthetic Typo',
    subtitle: '5-Slide Expressive Typography Pack (Untold Stories, Display Arch, Brush Satire, Indie & Split Journal)',
    category: 'Typography',
    aspectRatio: '9:16',
    themeId: 'aesthetic-typo',
    branding: {
      publicationName: 'THE UNTOLD STORIES',
      issueLabel: 'MARCH 2022 · ARCHIVE',
      authorOrHandle: '@instastories.zaa',
      footerNote: 'AESTHETIC TYPOGRAPHY PACK',
      showSlideNumbers: false,
      showFooterBar: false,
    },
    scriptText: `--- [layout: typo-untold-story]
#header: 03.
#kicker: THEUNTOLD STORIES
#title: happiness
is simple.
#lead: Menikmati Sore hari dengan
potret bahagia
#body: foto ini di ambil dengan menggunakan.
Kamera DSLR Nikon D3400 dan lensa
fix nikkor 50mm f / 1.8
#caption: instastories by *zaa*

--- [layout: typo-playful-arch]
#kicker: Jarang
#title: TerlihaT
#lead: Tapi Sering
#body: TerlibaT
#caption: www.instagram.com/firman_nhakim

--- [layout: typo-brush-satire]
#kicker: RAKYAT NYA SIBUK MENCARI SESUAP
#title: NASI
#lead: EH PEJABATNYA SIBUK
#body: KORUPSI
#caption: Reels | Feed | Story

--- [layout: typo-cinematic-indie]
#header: Pause.
#kicker: Breathe.
#title: Thoughts
shape
reality
#lead: Choose them with love
#body: Desing by Sally Xon
Photo by Branislav Rodman
#caption: Whats inside matters more.

--- [layout: typo-split-journal]
#header: // day 22
Ramadhan
#kicker: //restingtime
#title: reminder
today with
resting
#lead: Padahal Allah lebih deket
sama kita, bahkan lebih deket dari
urat nadi kita sendiri
#body: Bagaimana mungkin engkau bisa
merasa sombong dan lari dari Allah?
#caption: Archive by *Kohh*`,
  },
];
