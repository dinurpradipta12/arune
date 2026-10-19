export type AspectRatioKey = '4:5' | '9:16' | '1:1';

export interface AspectRatioConfig {
  key: AspectRatioKey;
  label: string;
  shortLabel: string;
  exportWidth: number;
  exportHeight: number;
  stageWidth: number;
  stageHeight: number;
}

export type LayoutPresetId =
  | 'blank'
  // Classic Editorial / Magazine
  | 'cover-overlay'
  | 'editorial-dropcap'
  | 'top-photo-bottom-split'
  | 'split-vertical-collage'
  | 'full-bleed-bottom-story'
  | 'editorial-bento-grid'
  // Media / Newsroom
  | 'media-breaking-cover'
  | 'media-stat-card'
  | 'media-quote-split'
  | 'media-timeline-list'
  | 'media-outro-cta'
  // Minimalist / Swiss Grid
  | 'minimal-bold-cover'
  | 'minimal-quote-focus'
  | 'minimal-photo-frame'
  | 'minimal-numbered-list'
  // Playful / Social Pop
  | 'playful-hero-cover'
  | 'playful-card-step'
  | 'playful-dual-cards'
  | 'playful-bento-fun'
  | 'playful-outro-cta'
  // Aesthetic Typography & Story
  | 'typo-untold-story'
  | 'typo-playful-arch'
  | 'typo-brush-satire'
  | 'typo-cinematic-indie'
  | 'typo-split-journal';

export type ElementType = 'text' | 'image' | 'divider' | 'badge' | 'shape';

export type TextRole =
  | 'header'
  | 'kicker'
  | 'title'
  | 'lead'
  | 'body'
  | 'caption'
  | 'badge'
  | 'custom';

export type FontFamilyName = string;

export interface CustomFontRecord {
  family: string;
  category:
    | 'Editorial Serif'
    | 'Clean Sans'
    | 'Local Computer'
    | 'Uploaded Custom';
  source: 'google' | 'local-system' | 'uploaded-file';
  dataUrl?: string;
  format?: string;
}

export interface TextShadowConfig {
  enabled: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface TextStrokeConfig {
  enabled: boolean;
  width: number;
  color: string;
}

export type BlendModeType =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light';

export interface BaseCanvasElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  opacity: number;
  // Professional Transform properties
  rotation?: number; // degrees (-180 to 180 or 0 to 360)
  flipX?: boolean;
  flipY?: boolean;
  skewX?: number; // degrees
  skewY?: number; // degrees
  borderWidth?: number;
  borderColor?: string;
  mixBlendMode?: BlendModeType;
  locked?: boolean;
  hidden?: boolean;
}

export type FontWeightValue = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface FontVariantOption {
  id: string;
  label: string;
  shortLabel: string;
  weight: FontWeightValue;
  italic: boolean;
}

export interface TextCanvasElement extends BaseCanvasElement {
  type: 'text' | 'badge';
  role: TextRole;
  content: string;
  fontFamily: FontFamilyName;
  fontWeight: FontWeightValue;
  fontSize: number;
  italic: boolean;
  uppercase: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  dropCap: boolean;
  dropCapColor?: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight: number; // Leading
  letterSpacing: number; // Tracking (em)
  wordSpacing?: number; // px (-10 to 30)
  fontKerning?: 'auto' | 'normal' | 'none'; // Kerning
  opticalKerning?: boolean; // font-feature-settings: "kern" 1, "liga" 1
  paragraphIndent?: number; // px (0 to 60)
  paragraphSpacing?: number; // px (0 to 40)
  color: string;
  backgroundColor?: string;
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
  shadow: TextShadowConfig;
  stroke: TextStrokeConfig;
}

export type ImageCropShape =
  | 'rect'
  | 'circle'
  | 'arch'
  | 'pill'
  | 'diamond';

export interface ImageCanvasElement extends BaseCanvasElement {
  type: 'image';
  src: string;
  alt?: string;
  zoom: number; // 1 to 4
  panX: number; // 0 to 100 (%)
  panY: number; // 0 to 100 (%)
  // Crop Insets (0 to 45%) & Crop Shape
  cropTop?: number;
  cropBottom?: number;
  cropLeft?: number;
  cropRight?: number;
  cropShape?: ImageCropShape;
  // Dimmer & Radial Vignette
  dimmerOpacity: number; // 0 to 0.9
  dimmerType: 'solid' | 'bottom-gradient' | 'radial-vignette' | 'radial-spotlight';
  radialFeather?: number; // 10 to 100 (%)
  borderRadius: number;
  // Image Filters
  brightness?: number; // 50 to 150 (%)
  contrast?: number; // 50 to 150 (%)
  saturation?: number; // 0 to 200 (%)
  grayscale?: number; // 0 to 100 (%)
  blur?: number; // 0 to 20 (px)
  objectFit?: 'cover' | 'contain';
  isCropping?: boolean; // when true, handles crop edges instead of resizing
  backgroundColor?: string; // custom container background, default transparent
  originalSrc?: string; // backup if background was removed
  originalWidth?: number;
  originalHeight?: number;
}

export interface DividerCanvasElement extends BaseCanvasElement {
  type: 'divider';
  orientation: 'horizontal' | 'vertical';
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'double' | 'dotted';
}

export type ShapeKind = 'rectangle' | 'rounded-rect' | 'circle' | 'pill';

export interface ShapeCanvasElement extends BaseCanvasElement {
  type: 'shape';
  shapeKind: ShapeKind;
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  shadow?: TextShadowConfig;
}

export type CanvasElement =
  | TextCanvasElement
  | ImageCanvasElement
  | DividerCanvasElement
  | ShapeCanvasElement;

export interface Slide {
  id: string;
  layout: LayoutPresetId;
  backgroundColor: string;
  elements: CanvasElement[];
  notes?: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  subtitle: string;
  background: string;
  darkBackground: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textOnDark: string;
  accent: string;
  divider: string;
  headingFont: FontFamilyName;
  bodyFont: FontFamilyName;
  sansFont: FontFamilyName;
}

export interface GlobalBranding {
  publicationName: string;
  issueLabel: string;
  authorOrHandle: string;
  footerNote: string;
  showSlideNumbers: boolean;
  showFooterBar: boolean;
}

export interface CloudTemplateRecord {
  id: string;
  name: string;
  description: string;
  aspectRatio: AspectRatioKey;
  themeId: string;
  branding: GlobalBranding;
  scriptText: string;
  slides: Slide[];
  updatedAt: string;
  source: 'supabase' | 'local';
}

export interface CuratedGalleryTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  aspectRatio: AspectRatioKey;
  themeId: string;
  branding: GlobalBranding;
  scriptText: string;
  slidePhotos?: string[];
}
