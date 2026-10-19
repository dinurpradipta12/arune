import type { CustomFontRecord } from '../types/studio';

const LOCAL_STORAGE_FONTS_KEY = 'editorial_carousel_studio_custom_fonts_v2';

interface LocalFontData {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

declare global {
  interface Window {
    queryLocalFonts?: () => Promise<LocalFontData[]>;
  }
}

// Comprehensive list of macOS, Windows, and Editorial fonts to auto-detect on startup
const CANDIDATE_COMPUTER_FONTS = [
  // Editorial & Literary Serifs (macOS / Windows / Design)
  'Didot',
  'Baskerville',
  'Bodoni 72',
  'Bodoni 72 Oldstyle',
  'Bodoni 72 Smallcaps',
  'Big Caslon',
  'Hoefler Text',
  'Charter',
  'Palatino',
  'Palatino Linotype',
  'Cochin',
  'Georgia',
  'Times New Roman',
  'Times',
  'New York',
  'American Typewriter',
  'Garamond',
  'Apple Garamond',
  'Book Antiqua',
  'Bookman Old Style',
  'Constantia',
  'Cambria',
  'Rockwell',
  'Superclarendon',
  'Iowan Old Style',
  'Athelas',
  'Marion',
  // Clean Sans & Display (macOS / Windows / Design)
  'Optima',
  'Futura',
  'Gill Sans',
  'Avenir Next',
  'Avenir Next Condensed',
  'Avenir',
  'Helvetica Neue',
  'Helvetica',
  'SF Pro Display',
  'SF Pro Text',
  'SF Compact',
  'Arial',
  'Arial Narrow',
  'DIN Alternate',
  'DIN Condensed',
  'Geneva',
  'Lucida Grande',
  'Century Gothic',
  'Skia',
  'Copperplate',
  'Phosphate',
  'Impact',
  'Trebuchet MS',
  'Verdana',
  'Tahoma',
  'Segoe UI',
  'Candara',
  'Corbel',
  'Franklin Gothic Medium',
  // Script & Calligraphic
  'Snell Roundhand',
  'Savoye LET',
  'Zapfino',
  'Brush Script MT',
  'Apple Chancery',
  'Bradley Hand',
  // Monospace
  'SF Mono',
  'Menlo',
  'Monaco',
  'Andale Mono',
  'Courier New',
  'Courier',
  'Consolas',
  'PT Mono',
  'PT Serif',
  'PT Sans',
];

/**
 * Fast synchronous canvas measurement check to see if a font is installed on the user's computer
 */
export function isSystemFontInstalled(fontFamily: string): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const sampleText = 'mmmmmmmmmmlliWW1234567890';
  const baseFonts = ['monospace', 'sans-serif', 'serif'];

  const baseWidths: Record<string, number> = {};
  for (const base of baseFonts) {
    ctx.font = `72px ${base}`;
    baseWidths[base] = ctx.measureText(sampleText).width;
  }

  for (const base of baseFonts) {
    ctx.font = `72px "${fontFamily}", ${base}`;
    const measured = ctx.measureText(sampleText).width;
    if (measured !== baseWidths[base]) {
      return true;
    }
  }
  return false;
}

/**
 * Automatically detects all installed computer fonts from CANDIDATE_COMPUTER_FONTS synchronously
 */
export function detectInstalledComputerFontsSync(): CustomFontRecord[] {
  if (typeof document === 'undefined') return [];
  const detected: CustomFontRecord[] = [];
  for (const fam of CANDIDATE_COMPUTER_FONTS) {
    if (isSystemFontInstalled(fam)) {
      const record: CustomFontRecord = {
        family: fam,
        category: 'Local Computer',
        source: 'local-system',
      };
      injectFontStyleIntoDocument(record);
      detected.push(record);
    }
  }
  return detected;
}

/**
 * Injects a <style> tag for an uploaded custom font or local system font so DOM & html-to-image can render it
 */
export function injectFontStyleIntoDocument(font: CustomFontRecord): void {
  if (typeof document === 'undefined') return;
  const styleId = `custom-font-${font.family
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()}`;
  if (document.getElementById(styleId)) return;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;

  if (font.source === 'uploaded-file' && font.dataUrl) {
    const formatClause = font.format ? ` format('${font.format}')` : '';
    styleEl.textContent = `
      @font-face {
        font-family: '${font.family}';
        src: url('${font.dataUrl}')${formatClause};
        font-weight: 100 900;
        font-style: normal;
        font-display: swap;
      }
    `;
    try {
      const face = new FontFace(font.family, `url(${font.dataUrl})`, {
        weight: '100 900',
      });
      face
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
        })
        .catch(() => {
          // Style tag fallback is already active
        });
    } catch {
      // ignore
    }
    document.head.appendChild(styleEl);
  }
}

/**
 * Loads saved custom fonts AND automatically merges detected computer fonts so local fonts are always available out-of-the-box!
 */
export function loadSavedCustomFonts(): CustomFontRecord[] {
  const autoDetected = detectInstalledComputerFontsSync();
  let saved: CustomFontRecord[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONTS_KEY);
    if (raw) {
      saved = JSON.parse(raw) as CustomFontRecord[];
      saved.forEach((f) => injectFontStyleIntoDocument(f));
    }
  } catch {
    // ignore
  }

  const seen = new Set<string>();
  const merged: CustomFontRecord[] = [];

  for (const item of [...saved, ...autoDetected]) {
    const key = item.family.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}

export function saveCustomFontsToStorage(fonts: CustomFontRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FONTS_KEY, JSON.stringify(fonts));
  } catch {
    try {
      const slim = fonts.map((f) =>
        f.dataUrl && f.dataUrl.length > 1_500_000
          ? { ...f, dataUrl: undefined, source: 'local-system' as const }
          : f
      );
      localStorage.setItem(LOCAL_STORAGE_FONTS_KEY, JSON.stringify(slim));
    } catch {
      // ignore
    }
  }
}

/**
 * Reads ALL fonts installed on the user's computer:
 * 1. Tries browser Local Font Access API (`window.queryLocalFonts()`) for full computer font enumeration.
 * 2. Combines with synchronous canvas detection of installed OS fonts so it never returns empty.
 */
export async function scanComputerFonts(): Promise<{
  families: string[];
  method: 'queryLocalFonts' | 'system-probe';
  warning?: string;
}> {
  const syncDetected = detectInstalledComputerFontsSync().map((f) => f.family);

  if (
    typeof window !== 'undefined' &&
    typeof window.queryLocalFonts === 'function'
  ) {
    try {
      const localFonts = await window.queryLocalFonts();
      if (localFonts && localFonts.length > 0) {
        const uniqueFamilies = Array.from(
          new Set([
            ...localFonts.map((f) => f.family?.trim()).filter(Boolean),
            ...syncDetected,
          ])
        ).sort((a, b) => a.localeCompare(b));

        return {
          families: uniqueFamilies,
          method: 'queryLocalFonts',
        };
      }
    } catch {
      return {
        families: syncDetected,
        method: 'system-probe',
        warning: `Menampilkan ${syncDetected.length} font komputer yang terdeteksi secara otomatis. (Jika ingin membuka seluruh font tambahan melalui izin browser, pastikan izin Local Fonts diaktifkan pada ikon gembok URL browser).`,
      };
    }
  }

  return {
    families: syncDetected,
    method: 'system-probe',
    warning: `Terdeteksi otomatis ${syncDetected.length} font yang terinstal di komputer Anda.`,
  };
}

export function parseUploadedFontFile(file: File): Promise<CustomFontRecord> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let format = 'truetype';
    if (ext === 'otf') format = 'opentype';
    else if (ext === 'woff') format = 'woff';
    else if (ext === 'woff2') format = 'woff2';

    const cleanFamilyName = file.name
      .replace(/\.(ttf|otf|woff2?|ttc)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file font.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Hasil pembacaan file font tidak valid.'));
        return;
      }
      const record: CustomFontRecord = {
        family: cleanFamilyName || 'Custom Editorial Font',
        category: 'Uploaded Custom',
        source: 'uploaded-file',
        dataUrl: reader.result,
        format,
      };
      injectFontStyleIntoDocument(record);
      resolve(record);
    };
    reader.readAsDataURL(file);
  });
}
