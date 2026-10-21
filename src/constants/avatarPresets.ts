export interface AvatarPreset {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  svgDataUri: string;
}

function createAvatarSvg(bg: string, skin: string, hair: string, accessory: string, eyes: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <rect width="100" height="100" rx="50" fill="${bg}"/>
    <circle cx="50" cy="52" r="26" fill="${skin}"/>
    <path d="${hair}" fill="${accessory}"/>
    <circle cx="42" cy="52" r="3" fill="${eyes}"/>
    <circle cx="58" cy="52" r="3" fill="${eyes}"/>
    <path d="M46 60 Q50 64 54 60" stroke="${eyes}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M26 95 C26 78 37 74 50 74 C63 74 74 78 74 95 Z" fill="${accessory}"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'avatar-sage',
    name: 'Sage Creator',
    bgColor: '#5E887E',
    textColor: '#FFFFFF',
    accentColor: '#D4E2DE',
    svgDataUri: createAvatarSvg(
      '#5E887E',
      '#FFDFC4',
      'M30 45 C30 28 70 28 70 45 C66 40 60 36 50 36 C40 36 34 40 30 45 Z',
      '#2F3E46',
      '#2F3E46'
    ),
  },
  {
    id: 'avatar-slate',
    name: 'Slate Architect',
    bgColor: '#2F3E46',
    textColor: '#FFFFFF',
    accentColor: '#5E887E',
    svgDataUri: createAvatarSvg(
      '#2F3E46',
      '#FCD3B8',
      'M28 42 C28 26 72 26 72 42 C64 36 58 34 50 34 C42 34 36 36 28 42 Z',
      '#5E887E',
      '#FFFFFF'
    ),
  },
  {
    id: 'avatar-dusty',
    name: 'Dusty Artist',
    bgColor: '#EBAEB3',
    textColor: '#2F3E46',
    accentColor: '#9E5960',
    svgDataUri: createAvatarSvg(
      '#EBAEB3',
      '#FFE0BD',
      'M30 48 C28 28 72 28 70 48 C64 42 58 38 50 38 C42 38 36 42 30 48 Z',
      '#9E5960',
      '#2F3E46'
    ),
  },
  {
    id: 'avatar-blue',
    name: 'Sky Thinker',
    bgColor: '#A7C7E7',
    textColor: '#2F3E46',
    accentColor: '#3A638E',
    svgDataUri: createAvatarSvg(
      '#A7C7E7',
      '#F5D0B5',
      'M32 44 C32 26 68 26 68 44 C62 38 56 35 50 35 C44 35 38 38 32 44 Z',
      '#2C4A6F',
      '#2F3E46'
    ),
  },
  {
    id: 'avatar-amber',
    name: 'Warm Writer',
    bgColor: '#F6D8A8',
    textColor: '#2F3E46',
    accentColor: '#8C6228',
    svgDataUri: createAvatarSvg(
      '#F6D8A8',
      '#FFDFBA',
      'M30 46 C30 25 70 25 70 46 C65 40 58 36 50 36 C42 36 35 40 30 46 Z',
      '#6E4A1B',
      '#2F3E46'
    ),
  },
  {
    id: 'avatar-emerald',
    name: 'Emerald Guide',
    bgColor: '#059669',
    textColor: '#FFFFFF',
    accentColor: '#A7F3D0',
    svgDataUri: createAvatarSvg(
      '#059669',
      '#E8BEAC',
      'M29 44 C29 27 71 27 71 44 C65 38 58 35 50 35 C42 35 35 38 29 44 Z',
      '#064E3B',
      '#064E3B'
    ),
  },
  {
    id: 'avatar-lavender',
    name: 'Lavender Stylist',
    bgColor: '#C4B5FD',
    textColor: '#2F3E46',
    accentColor: '#5B21B6',
    svgDataUri: createAvatarSvg(
      '#C4B5FD',
      '#FFDFC4',
      'M31 46 C31 28 69 28 69 46 C63 40 57 37 50 37 C43 37 37 40 31 46 Z',
      '#4C1D95',
      '#2F3E46'
    ),
  },
  {
    id: 'avatar-coral',
    name: 'Coral Designer',
    bgColor: '#FB7185',
    textColor: '#FFFFFF',
    accentColor: '#FFF1F2',
    svgDataUri: createAvatarSvg(
      '#FB7185',
      '#FCD3B8',
      'M30 45 C30 26 70 26 70 45 C64 39 58 36 50 36 C42 36 36 39 30 45 Z',
      '#9F1239',
      '#FFFFFF'
    ),
  },
];

export function getAvatarPresetById(id?: string): AvatarPreset {
  if (!id) return AVATAR_PRESETS[0];
  const found = AVATAR_PRESETS.find((a) => a.id === id);
  return found || AVATAR_PRESETS[0];
}
