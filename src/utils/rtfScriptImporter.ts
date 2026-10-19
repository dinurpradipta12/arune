/**
 * RTF Content Script Importer
 *
 * Reads a "Content Script Writing Development" RTF document (Google Docs / Word export)
 * and converts it into the studio's structured carousel script syntax:
 *
 *   --- [layout: cover-overlay]
 *   #kicker: HOOK · PAIN
 *   #title: ...
 *   #lead: ...
 *
 * Supported document structure:
 * - Metadata lines: "Judul Konten : ...", "Content Pillar : ...", "Tanggal Upload : ...", "Jenis Konten : ..."
 * - Script table with columns: Frame | Tipe CPW | Script (one row per copy block; empty Frame inherits previous slide)
 * - "Caption Development" section
 * - "Hastag / Hashtag Development" section
 */

import type { LayoutPresetId } from '../types/studio';

const CELL = '\u241F';
const ROW = '\u241E';

// Destinations whose content should never appear in the plain text output.
const SKIP_DESTINATIONS = new Set([
  'fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'header', 'footer',
  'headerl', 'headerr', 'headerf', 'footerl', 'footerr', 'footerf', 'listtable',
  'listoverridetable', 'rsidtbl', 'generator', 'themedata', 'colorschememapping',
  'datastore', 'latentstyles', 'xmlnstbl', 'mmathPr', 'pgdsctbl', 'fldinst',
  'filetbl', 'revtbl', 'shppict', 'nonshppict', 'bkmkstart', 'bkmkend', 'blipuid',
  'pnseclvl', 'listtext', 'pntext', 'pntxta', 'pntxtb', 'ftnsep', 'ftnsepc', 'aftncn',
]);

// Windows-1252 code points for bytes 0x80–0x9F.
const CP1252_HIGH: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020,
  0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160, 0x8b: 0x2039, 0x8c: 0x0152,
  0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022,
  0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a,
  0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
};

function isAlpha(code: number) {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isDigit(code: number) {
  return code >= 48 && code <= 57;
}

/** Skip from the current position (just after an opening control word) to the end of the enclosing group. */
function skipGroup(data: string, start: number): number {
  let depth = 1;
  let i = start;
  const n = data.length;
  while (i < n && depth > 0) {
    const c = data.charCodeAt(i);
    if (c === 92 /* \ */) {
      i += 2;
      continue;
    }
    if (c === 123 /* { */) depth++;
    else if (c === 125 /* } */) depth--;
    i++;
  }
  return i; // position right after the closing brace
}

/**
 * Convert RTF source into plain text. Table cells are separated by CELL markers and
 * rows terminated by ROW markers so the table structure can be recovered.
 * Embedded images and other binary destinations are skipped efficiently.
 */
export function rtfToStructuredText(data: string): string {
  const out: string[] = [];
  const ucStack: number[] = [];
  let uc = 1;
  let pendingSkip = 0;
  let i = 0;
  const n = data.length;

  const emit = (s: string) => {
    if (pendingSkip > 0) {
      pendingSkip--;
      return;
    }
    out.push(s);
  };

  while (i < n) {
    const c = data.charCodeAt(i);

    if (c === 123 /* { */) {
      ucStack.push(uc);
      i++;
      // Fast-skip "{\*\dest ...}" ignorable destinations and known binary destinations.
      if (data.charCodeAt(i) === 92 && data.charCodeAt(i + 1) === 42 /* * */) {
        i = skipGroup(data, i);
        uc = ucStack.pop() ?? 1;
        continue;
      }
      if (data.charCodeAt(i) === 92 && isAlpha(data.charCodeAt(i + 1))) {
        let j = i + 1;
        while (j < n && isAlpha(data.charCodeAt(j))) j++;
        const word = data.slice(i + 1, j);
        if (SKIP_DESTINATIONS.has(word)) {
          i = skipGroup(data, j);
          uc = ucStack.pop() ?? 1;
          continue;
        }
      }
      continue;
    }

    if (c === 125 /* } */) {
      uc = ucStack.pop() ?? 1;
      i++;
      continue;
    }

    if (c === 92 /* \ */) {
      const next = data[i + 1];
      if (next === undefined) break;

      if (next === '\\' || next === '{' || next === '}') {
        emit(next);
        i += 2;
        continue;
      }
      if (next === "'") {
        const byte = parseInt(data.substr(i + 2, 2), 16);
        i += 4;
        if (!Number.isNaN(byte)) {
          emit(String.fromCharCode(CP1252_HIGH[byte] ?? byte));
        }
        continue;
      }
      if (next === '\r' || next === '\n') {
        emit('\n');
        i += 2;
        continue;
      }
      if (next === '~') {
        emit(' ');
        i += 2;
        continue;
      }
      if (next === '_') {
        emit('-');
        i += 2;
        continue;
      }
      if (!isAlpha(next.charCodeAt(0))) {
        // Other control symbols (\-, \|, \:) are ignored.
        i += 2;
        continue;
      }

      // Control word
      let j = i + 1;
      while (j < n && isAlpha(data.charCodeAt(j))) j++;
      const word = data.slice(i + 1, j);
      let argStart = j;
      if (data[j] === '-') j++;
      while (j < n && isDigit(data.charCodeAt(j))) j++;
      const argStr = data.slice(argStart, j);
      const arg = argStr ? parseInt(argStr, 10) : NaN;
      if (data[j] === ' ') j++;
      i = j;

      switch (word) {
        case 'par':
        case 'line':
        case 'sect':
        case 'page':
          out.push('\n');
          break;
        case 'tab':
          out.push('\t');
          break;
        case 'cell':
        case 'nestcell':
          out.push(CELL);
          break;
        case 'row':
        case 'nestrow':
          out.push(ROW + '\n');
          break;
        case 'uc':
          uc = Number.isNaN(arg) ? 1 : arg;
          break;
        case 'u': {
          let code = arg;
          if (code < 0) code += 65536;
          if (!Number.isNaN(code)) out.push(String.fromCharCode(code));
          pendingSkip = uc;
          break;
        }
        case 'bin':
          if (!Number.isNaN(arg)) i += arg;
          break;
        case 'emdash':
          out.push('—');
          break;
        case 'endash':
          out.push('–');
          break;
        case 'bullet':
          out.push('•');
          break;
        case 'lquote':
          out.push('‘');
          break;
        case 'rquote':
          out.push('’');
          break;
        case 'ldblquote':
          out.push('“');
          break;
        case 'rdblquote':
          out.push('”');
          break;
        default:
          break;
      }
      continue;
    }

    if (c === 13 || c === 10) {
      i++;
      continue;
    }

    emit(data[i]);
    i++;
  }

  return out.join('');
}

export interface ContentScriptRow {
  frame: string;
  slideKey: string;
  type: string;
  script: string;
}

export interface ContentScriptSlide {
  key: string;
  label: string;
  rows: ContentScriptRow[];
}

export interface ParsedContentScript {
  title: string;
  pillar: string;
  uploadDate: string;
  contentType: string;
  slides: ContentScriptSlide[];
  totalRows: number;
  caption: string;
  hashtags: string;
}

function cleanCell(value: string | undefined): string {
  return (value || '')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/g, '').replace(/^[ \t]+/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readMeta(text: string, label: RegExp): string {
  const m = text.match(label);
  return m ? m[1].trim() : '';
}

function extractSection(flat: string, start: RegExp, stops: RegExp[]): string {
  const startMatch = flat.match(start);
  if (!startMatch || startMatch.index === undefined) return '';
  const from = startMatch.index + startMatch[0].length;
  const rest = flat.slice(from);
  let end = rest.length;
  for (const stop of stops) {
    const m = rest.match(stop);
    if (m && m.index !== undefined && m.index < end) end = m.index;
  }
  return rest
    .slice(0, end)
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
    .replace(/\n{3,}/g, '\n\n');
}

/** Parse the plain structured text produced by `rtfToStructuredText`. */
export function parseContentScriptText(structured: string): ParsedContentScript {
  const flat = structured.split(CELL).join('\n').split(ROW).join('\n');

  const title = readMeta(flat, /Judul\s*Konten\s*:\s*(.+)/i);
  const pillar = readMeta(flat, /Content\s*Pillar\s*:\s*(.+)/i);
  const uploadDate = readMeta(flat, /Tanggal\s*Upload\s*:\s*(.+)/i);
  const contentType = readMeta(flat, /Jenis\s*Konten\s*:\s*(.+)/i);

  // --- Script table ---
  const rowChunks = structured.split(ROW);
  let colFrame = 0;
  let colType = 1;
  let colScript = 2;
  let headerFound = false;

  const rows: ContentScriptRow[] = [];
  let currentKey = '';
  let currentFrame = '';
  let anonymousCounter = 0;

  for (const chunk of rowChunks) {
    if (!chunk.includes(CELL)) continue;
    const rawCells = chunk.split(CELL);
    // The first cell may contain paragraphs that precede the table; keep only its last line.
    const firstLines = rawCells[0].split('\n').filter((l) => l.trim() !== '');
    const cells = rawCells.map(cleanCell);
    cells[0] = cleanCell(firstLines[firstLines.length - 1]);

    if (!headerFound) {
      const lower = cells.map((c) => c.toLowerCase());
      const scriptIdx = lower.findIndex((c) => /^(script|naskah|copy|copywriting)/.test(c));
      const typeIdx = lower.findIndex((c) => /(tipe|type|cpw)/.test(c));
      const frameIdx = lower.findIndex((c) => /^(frame|slide|halaman|page)/.test(c));
      if (scriptIdx !== -1 && (typeIdx !== -1 || frameIdx !== -1)) {
        colScript = scriptIdx;
        colType = typeIdx !== -1 ? typeIdx : -1;
        colFrame = frameIdx !== -1 ? frameIdx : 0;
        headerFound = true;
        continue;
      }
      // Not the script table header yet (e.g. caption/hashtag boxes) – skip.
      continue;
    }

    const frame = cells[colFrame] || '';
    const type = colType >= 0 ? cells[colType] || '' : '';
    const script = cells[colScript] || '';

    // Single-cell boxes after the table (caption / hashtag) end the script table.
    const nonEmpty = cells.filter(Boolean).length;
    if (!frame && !type && !script) continue;
    if (nonEmpty <= 1 && !/slide/i.test(frame) && !type) {
      if (rows.length > 0) break;
      continue;
    }

    if (frame) {
      const slideNum = frame.match(/(?:slide|frame|page|halaman)\s*(\d+)/i);
      const key = slideNum ? `slide-${parseInt(slideNum[1], 10)}` : `frame-${frame.toLowerCase()}`;
      if (key !== currentKey) {
        currentKey = key;
        currentFrame = slideNum ? `Slide ${parseInt(slideNum[1], 10)}` : frame;
      }
    } else if (!currentKey) {
      anonymousCounter++;
      currentKey = `slide-auto-${anonymousCounter}`;
      currentFrame = `Slide ${anonymousCounter}`;
    }

    rows.push({ frame: currentFrame, slideKey: currentKey, type, script });
  }

  // Group rows by slide while preserving first-appearance order.
  const slideMap = new Map<string, ContentScriptSlide>();
  for (const row of rows) {
    let slide = slideMap.get(row.slideKey);
    if (!slide) {
      slide = { key: row.slideKey, label: row.frame, rows: [] };
      slideMap.set(row.slideKey, slide);
    }
    slide.rows.push(row);
  }

  const caption = extractSection(flat, /Caption\s*Development/i, [
    /⚠/,
    /Hash?tag\s*Development/i,
  ]);
  const hashtagSection = extractSection(flat, /Hash?tag\s*Development/i, [/⚠/]);
  const hashtagTokens = hashtagSection.match(/#[\p{L}\p{N}_]+/gu);
  const hashtags = hashtagTokens ? hashtagTokens.join(' ') : hashtagSection;

  return {
    title,
    pillar,
    uploadDate,
    contentType,
    slides: Array.from(slideMap.values()),
    totalRows: rows.length,
    caption,
    hashtags,
  };
}

export function parseContentScriptRtf(rtf: string): ParsedContentScript {
  return parseContentScriptText(rtfToStructuredText(rtf));
}

const TITLE_TYPES = /^(hook|headline|judul|title|heading)/i;

/** Prevent script lines from being mistaken for #tags by the slide script parser. */
function safeLine(text: string): string {
  return text
    .split('\n')
    .map((l) => (/^#(header|kicker|title|lead|body|caption):/i.test(l.trim()) ? ` ${l}` : l))
    .join('\n')
    .replace(/^---/gm, '—');
}

function pickLayout(index: number, total: number, sequence: LayoutPresetId[]): LayoutPresetId {
  const seq = sequence.length > 0 ? sequence : (['cover-overlay', 'editorial-dropcap'] as LayoutPresetId[]);
  if (index === 0) return seq[0];
  if (seq.length === 1) return seq[0];
  if (index === total - 1 && total > 2 && seq.length > 2) return seq[seq.length - 1];
  const middle = seq.length > 2 ? seq.slice(1, -1) : seq.slice(1);
  return middle[(index - 1) % middle.length];
}

/**
 * Convert a parsed content script into the studio carousel script syntax.
 * Every table row is placed into a slide field, so no copy is dropped.
 */
export function contentScriptToStudioScript(
  parsed: ParsedContentScript,
  layoutSequence: LayoutPresetId[]
): string {
  const total = parsed.slides.length;
  const headerBase = [parsed.pillar, parsed.contentType]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  return parsed.slides
    .map((slide, idx) => {
      const layout = pickLayout(idx, total, layoutSequence);
      const titleRows = slide.rows.filter((r) => TITLE_TYPES.test(r.type));
      const otherRows = slide.rows.filter((r) => !TITLE_TYPES.test(r.type));

      let title = titleRows[0]?.script || '';
      const extraTitles = titleRows.slice(1).map((r) => r.script);

      // If a slide has no hook/headline, promote its first row to the title.
      let bodyRows = otherRows.map((r) => r.script);
      if (!title && bodyRows.length > 0) {
        title = bodyRows[0];
        bodyRows = bodyRows.slice(1);
      }
      bodyRows = [...extraTitles, ...bodyRows].filter(Boolean);

      let lead = '';
      let body = '';
      if (bodyRows.length === 1) {
        if (idx === 0 || bodyRows[0].length <= 160) lead = bodyRows[0];
        else body = bodyRows[0];
      } else if (bodyRows.length > 1) {
        if (bodyRows[0].length <= 160) {
          lead = bodyRows[0];
          body = bodyRows.slice(1).join('\n\n');
        } else {
          body = bodyRows.join('\n\n');
        }
      }

      const types = Array.from(new Set(slide.rows.map((r) => r.type).filter(Boolean)));
      const kicker = `${String(idx + 1).padStart(2, '0')} · ${types.join(' · ')}`.toUpperCase();

      const lines = [`--- [layout: ${layout}]`];
      if (headerBase) lines.push(`#header: ${headerBase}`);
      lines.push(`#kicker: ${kicker}`);
      if (title) lines.push(`#title: ${safeLine(title)}`);
      if (lead) lines.push(`#lead: ${safeLine(lead)}`);
      if (body) lines.push(`#body: ${safeLine(body)}`);
      return lines.join('\n');
    })
    .join('\n\n');
}
