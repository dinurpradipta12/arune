import ava1 from '../avatar-icon/ava1.png';
import ava2 from '../avatar-icon/ava2.png';
import ava3 from '../avatar-icon/ava3.png';
import ava4 from '../avatar-icon/ava4.png';
import ava5 from '../avatar-icon/ava5.png';
import ava6 from '../avatar-icon/ava6.png';
import ava7 from '../avatar-icon/ava7.png';
import ava8 from '../avatar-icon/ava8.png';
import ava9 from '../avatar-icon/ava9.png';
import ava10 from '../avatar-icon/ava10.png';

export interface AvatarPreset {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  svgDataUri: string;
  imageUrl?: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'ava-1',
    name: 'Sky Alex',
    bgColor: '#1597FF',
    textColor: '#FFFFFF',
    accentColor: '#E0F2FE',
    svgDataUri: ava1,
    imageUrl: ava1,
  },
  {
    id: 'ava-2',
    name: 'Coral Leo',
    bgColor: '#F85863',
    textColor: '#FFFFFF',
    accentColor: '#FFE4E6',
    svgDataUri: ava2,
    imageUrl: ava2,
  },
  {
    id: 'ava-3',
    name: 'Mint Ken',
    bgColor: '#44DF9F',
    textColor: '#1F2937',
    accentColor: '#D1FAE5',
    svgDataUri: ava3,
    imageUrl: ava3,
  },
  {
    id: 'ava-4',
    name: 'Amber Sam',
    bgColor: '#F7B718',
    textColor: '#1F2937',
    accentColor: '#FEF3C7',
    svgDataUri: ava4,
    imageUrl: ava4,
  },
  {
    id: 'ava-5',
    name: 'Teal Max',
    bgColor: '#44DF9F',
    textColor: '#1F2937',
    accentColor: '#CCFBF1',
    svgDataUri: ava5,
    imageUrl: ava5,
  },
  {
    id: 'ava-6',
    name: 'Blue Nico',
    bgColor: '#1597FF',
    textColor: '#FFFFFF',
    accentColor: '#DBEAFE',
    svgDataUri: ava6,
    imageUrl: ava6,
  },
  {
    id: 'ava-7',
    name: 'Rose Mia',
    bgColor: '#F85863',
    textColor: '#FFFFFF',
    accentColor: '#FCE7F3',
    svgDataUri: ava7,
    imageUrl: ava7,
  },
  {
    id: 'ava-8',
    name: 'Sunny Ruby',
    bgColor: '#F7B718',
    textColor: '#1F2937',
    accentColor: '#FEF9C3',
    svgDataUri: ava8,
    imageUrl: ava8,
  },
  {
    id: 'ava-9',
    name: 'Honey Tara',
    bgColor: '#F7B718',
    textColor: '#1F2937',
    accentColor: '#FEF3C7',
    svgDataUri: ava9,
    imageUrl: ava9,
  },
  {
    id: 'ava-10',
    name: 'Ocean Chloe',
    bgColor: '#1597FF',
    textColor: '#FFFFFF',
    accentColor: '#E0F2FE',
    svgDataUri: ava10,
    imageUrl: ava10,
  },
];

const LEGACY_ID_MAP: Record<string, string> = {
  'avatar-sage': 'ava-3',
  'avatar-slate': 'ava-5',
  'avatar-dusty': 'ava-7',
  'avatar-blue': 'ava-1',
  'avatar-amber': 'ava-4',
  'avatar-emerald': 'ava-3',
  'avatar-lavender': 'ava-10',
  'avatar-coral': 'ava-2',
  'ava1': 'ava-1',
  'ava2': 'ava-2',
  'ava3': 'ava-3',
  'ava4': 'ava-4',
  'ava5': 'ava-5',
  'ava6': 'ava-6',
  'ava7': 'ava-7',
  'ava8': 'ava-8',
  'ava9': 'ava-9',
  'ava10': 'ava-10',
};

export function getAvatarPresetById(id?: string): AvatarPreset {
  if (!id) return AVATAR_PRESETS[0];
  const direct = AVATAR_PRESETS.find((a) => a.id === id);
  if (direct) return direct;

  const mappedId = LEGACY_ID_MAP[id];
  if (mappedId) {
    const found = AVATAR_PRESETS.find((a) => a.id === mappedId);
    if (found) return found;
  }

  return AVATAR_PRESETS[0];
}

export function getRandomAvatarPreset(): AvatarPreset {
  const index = Math.floor(Math.random() * AVATAR_PRESETS.length);
  return AVATAR_PRESETS[index];
}
