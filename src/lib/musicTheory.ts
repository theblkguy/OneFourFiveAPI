/**
 * Music theory: Roman numeral to chord symbol in a given key and scale.
 * Supports major, natural minor, borrowed chords (bVII, bVI, bIII, bII, iv, iio),
 * and extended harmony: 7ths (maj7, 7, m7, dim7, ø) and 9ths (maj9, 9, m9).
 */

import type { ChordQuality, RomanInfo, ParsedChord, ChordToRomanResult } from '../types';

// All 12 roots in sharp form for consistent indexing (C=0, C#=1, ... B=11)
export const ROOTS_SHARP: readonly string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const ROOTS_FLAT: readonly string[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Normalize key to 0-11 and preferred spelling (we use sharp for internal scale)
export const KEY_ALIASES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

type RomanDegreeEntry = { degree: number; quality: ChordQuality };
type RomanBorrowedEntry = { flatDegree?: number; degree?: number; quality: ChordQuality };

const ROMAN_MAJOR: Record<string, RomanDegreeEntry> = {
  I: { degree: 1, quality: 'major' },
  ii: { degree: 2, quality: 'minor' },
  iii: { degree: 3, quality: 'minor' },
  IV: { degree: 4, quality: 'major' },
  V: { degree: 5, quality: 'major' },
  vi: { degree: 6, quality: 'minor' },
  vii: { degree: 7, quality: 'dim' },
  viidim: { degree: 7, quality: 'dim' },
};

const ROMAN_MINOR: Record<string, RomanDegreeEntry> = {
  i: { degree: 1, quality: 'minor' },
  II: { degree: 2, quality: 'dim' },
  'II°': { degree: 2, quality: 'dim' },
  III: { degree: 3, quality: 'major' },
  iv: { degree: 4, quality: 'minor' },
  v: { degree: 5, quality: 'minor' },
  VI: { degree: 6, quality: 'major' },
  VII: { degree: 7, quality: 'major' },
};

const BORROWED: Record<string, RomanBorrowedEntry> = {
  bVII: { flatDegree: 7, quality: 'major' },
  bVI: { flatDegree: 6, quality: 'major' },
  bIII: { flatDegree: 3, quality: 'major' },
  bII: { flatDegree: 2, quality: 'major' },
  iv: { degree: 4, quality: 'minor' },
  III: { degree: 3, quality: 'major' },
  iio: { degree: 2, quality: 'dim' },
  'ii°': { degree: 2, quality: 'dim' },
};

const EXTENSION_PATTERN = /^(maj7|7|m7|maj9|9|m9|dim7|ø|halfDim|m7b5)$/i;

const ROMAN_KEYS_BY_LENGTH: string[] = [
  ...Object.keys(BORROWED),
  ...Object.keys(ROMAN_MAJOR),
  ...Object.keys(ROMAN_MINOR),
].filter((k, i, a) => a.indexOf(k) === i).sort((a, b) => b.length - a.length);

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

export function getRootIndex(key: string | null | undefined): number | null {
  const k = (key || '').trim();
  const idx = KEY_ALIASES[k];
  if (idx === undefined) return null;
  return idx;
}

export function getScaleRoots(key: string | null | undefined, scale: string | null | undefined): string[] | null {
  const rootIdx = getRootIndex(key);
  if (rootIdx === null) return null;
  const intervals = (scale || 'major').toLowerCase() === 'minor' ? MINOR_INTERVALS : MAJOR_INTERVALS;
  return intervals.map((semi) => ROOTS_SHARP[(rootIdx + semi) % 12]);
}

export function parseRoman(roman: string | null | undefined): RomanInfo | null {
  const r = (roman || '').trim();
  if (!r) return null;
  let base = r;
  let extension: string | null = null;
  for (const key of ROMAN_KEYS_BY_LENGTH) {
    if (r === key) {
      base = key;
      break;
    }
    if (r.startsWith(key)) {
      const rest = r.slice(key.length).trim();
      if (EXTENSION_PATTERN.test(rest)) {
        base = key;
        extension = rest.toLowerCase() === 'halfdim' ? 'halfDim' : rest.toLowerCase();
        if (extension === 'm7b5') extension = 'halfDim';
        break;
      }
    }
  }
  const borrowedEntry = BORROWED[base];
  const majorEntry = ROMAN_MAJOR[base];
  const minorEntry = ROMAN_MINOR[base];
  const raw = borrowedEntry ? { ...borrowedEntry, borrowed: true as const } : majorEntry ? { ...majorEntry, borrowed: false as const } : minorEntry ? { ...minorEntry, borrowed: false as const } : null;
  if (!raw) return null;
  const info: RomanInfo = {
    ...raw,
    quality: raw.quality,
    baseRoman: base,
  };
  if (extension) info.extension = extension;
  return info;
}

function extensionToSuffix(extension: string | null | undefined, quality: ChordQuality): string {
  if (!extension) return '';
  switch (extension) {
    case 'maj7': return 'maj7';
    case '7': return quality === 'minor' ? 'm7' : quality === 'dim' ? 'ø' : '7';
    case 'm7': return 'm7';
    case 'maj9': return 'maj9';
    case '9': return '9';
    case 'm9': return 'm9';
    case 'dim7': return 'dim7';
    case 'ø':
    case 'halfDim': return 'ø';
    default: return '';
  }
}

export function romanToChord(roman: string, key: string, scale?: string | null): string | null {
  const keyIdx = getRootIndex(key);
  const scaleRoots = getScaleRoots(key, scale);
  if (keyIdx === null || !scaleRoots) return null;
  const isMinor = (scale || 'major').toLowerCase() === 'minor';
  const info = parseRoman(roman);
  if (!info) return null;

  const hasExtension = !!info.extension;
  const extSuffix = extensionToSuffix(info.extension ?? null, info.quality);

  if (info.borrowed) {
    if (info.flatDegree !== undefined) {
      const degreeIdx = info.flatDegree - 1;
      const intervals = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
      const scaleNoteIdx = (keyIdx + intervals[degreeIdx]) % 12;
      const rootNoteIdx = isMinor ? scaleNoteIdx : (scaleNoteIdx - 1 + 12) % 12;
      const rootName = ROOTS_SHARP[rootNoteIdx];
      if (hasExtension) return rootName + extSuffix;
      return rootName + (info.quality === 'major' ? '' : 'm');
    }
    if (info.degree !== undefined) {
      const rootName = scaleRoots[info.degree - 1];
      if (hasExtension) return rootName + extSuffix;
      if (info.quality === 'major') return rootName;
      if (info.quality === 'minor') return rootName + 'm';
      if (info.quality === 'dim') return rootName + 'dim';
      return rootName;
    }
  }

  const degree = info.degree!;
  const rootName = scaleRoots[degree - 1];
  if (hasExtension) return rootName + extSuffix;
  if (info.quality === 'major') return rootName;
  if (info.quality === 'minor') return rootName + 'm';
  if (info.quality === 'dim') return rootName + 'dim';
  return rootName;
}

export function getChordQuality(roman: string | null | undefined): ChordQuality {
  const info = parseRoman(roman);
  if (!info) return 'major';
  return info.quality;
}

/**
 * Return the base roman numeral (no extension) for comparison.
 * e.g. "IVmaj7" -> "IV", "vi7" -> "vi".
 */
export function getBaseRoman(roman: string | null | undefined): string | null {
  const info = parseRoman(roman);
  return info ? info.baseRoman : null;
}

/**
 * Parse a chord symbol into root (0-11), quality, and optional extension.
 * Handles C, Cm, Cmaj7, G7, Am7, Cmaj9, Bø, etc.
 */
export function parseChordSymbol(symbol: string | null | undefined): ParsedChord | null {
  const s = String(symbol || '').trim();
  if (!s) return null;
  let rootStr = '';
  let i = 0;
  if (s[i] && /[A-Ga-g]/.test(s[i])) rootStr += s[i++];
  if (s[i] && /[#b]/.test(s[i])) rootStr += s[i++];
  if (rootStr.length === 0) return null;
  const root = rootStr.charAt(0).toUpperCase() + (rootStr.slice(1) || '');
  const idx = getRootIndex(root);
  if (idx === null) return null;
  let quality: ChordQuality = 'major';
  let extension: string | undefined;
  const rest = s.slice(i).toLowerCase();
  if ((rest.startsWith('m') && !rest.startsWith('maj')) || rest.startsWith('-')) quality = 'minor';
  else if (/dim|°|o/.test(rest) && !rest.includes('7') && !rest.includes('9')) quality = 'dim';
  if (rest.includes('maj9') || rest.includes('ma9')) extension = 'maj9';
  else if (rest.includes('maj7') || rest.includes('ma7') || rest.includes('Δ')) extension = 'maj7';
  else if (rest.includes('m9')) extension = 'm9';
  else if (/\b9\b/.test(rest) || rest.endsWith('9')) extension = '9';
  else if (rest.includes('m7') || rest.includes('-7')) extension = 'm7';
  else if (rest.includes('dim7')) extension = 'dim7';
  else if (rest.includes('ø') || rest.includes('m7b5') || rest.includes('halfdim')) extension = 'halfDim';
  else if (rest.includes('7')) extension = quality === 'minor' ? 'm7' : '7';
  return { rootIndex: idx, quality, rootName: root, ...(extension ? { extension } : {}) };
}

/**
 * Convert a chord symbol to its roman numeral in the given key and scale.
 * Returns { roman, quality, extension? } or null if unparseable or not in key.
 * Matching uses root+quality only (Cmaj7 and C both map to I).
 */
export function chordToRoman(chordSymbol: string, key: string, scale?: string | null): ChordToRomanResult | null {
  const parsed = parseChordSymbol(chordSymbol);
  if (!parsed) return null;
  const scaleRoots = getScaleRoots(key, scale);
  if (!scaleRoots) return null;
  const isMinor = (scale || 'major').toLowerCase() === 'minor';
  const keyIdx = getRootIndex(key);
  if (keyIdx === null) return null;

  const intervals = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
  const result: ChordToRomanResult = { roman: null, quality: parsed.quality };
  if (parsed.extension) result.extension = parsed.extension;

  for (let degree = 1; degree <= 7; degree++) {
    const scaleRootIdx = (keyIdx + intervals[degree - 1]) % 12;
    if (parsed.rootIndex === scaleRootIdx) {
      const info = isMinor ? ROMAN_MINOR : ROMAN_MAJOR;
      const romanKey = Object.keys(info).find((k) => {
        const v = info[k];
        return v.degree === degree && v.quality === parsed.quality;
      });
      if (romanKey) {
        result.roman = romanKey;
        return result;
      }
      break;
    }
  }

  for (const [roman, spec] of Object.entries(BORROWED)) {
    if (spec.quality !== parsed.quality) continue;
    let expectedIdx: number;
    if (spec.flatDegree !== undefined) {
      const degreeIdx = spec.flatDegree - 1;
      const ints = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
      const scaleNoteIdx = (keyIdx + ints[degreeIdx]) % 12;
      expectedIdx = isMinor ? scaleNoteIdx : (scaleNoteIdx - 1 + 12) % 12;
    } else if (spec.degree !== undefined) {
      expectedIdx = (keyIdx + (isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS)[spec.degree - 1]) % 12;
    } else continue;
    if (parsed.rootIndex === expectedIdx) {
      result.roman = roman;
      return result;
    }
  }
  return null;
}
