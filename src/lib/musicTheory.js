/**
 * Music theory: Roman numeral to chord symbol in a given key and scale.
 * Supports major, natural minor, and borrowed chords (bVII, bVI, bIII, bII, iv, iio).
 */

// All 12 roots in sharp form for consistent indexing (C=0, C#=1, ... B=11)
const ROOTS_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ROOTS_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Normalize key to 0-11 and preferred spelling (we use sharp for internal scale)
const KEY_ALIASES = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

function getRootIndex(key) {
  const k = (key || '').trim();
  const idx = KEY_ALIASES[k];
  if (idx === undefined) return null;
  return idx;
}

function getScaleRoots(key, scale) {
  const rootIdx = getRootIndex(key);
  if (rootIdx === null) return null;
  const roots = ROOTS_SHARP;
  // Major scale: 0 2 4 5 7 9 11 (W W H W W W H)
  const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
  // Natural minor: 0 2 3 5 7 8 10
  const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
  const intervals = (scale || 'major').toLowerCase() === 'minor' ? MINOR_INTERVALS : MAJOR_INTERVALS;
  return intervals.map((semi) => roots[(rootIdx + semi) % 12]);
}

// Roman numeral (string) -> { degree 1-7, quality: 'major'|'minor'|'dim', borrowed?: true }
const ROMAN_MAJOR = {
  I: { degree: 1, quality: 'major' },
  ii: { degree: 2, quality: 'minor' },
  iii: { degree: 3, quality: 'minor' },
  IV: { degree: 4, quality: 'major' },
  V: { degree: 5, quality: 'major' },
  vi: { degree: 6, quality: 'minor' },
  vii: { degree: 7, quality: 'dim' },
  viidim: { degree: 7, quality: 'dim' },
};
const ROMAN_MINOR = {
  i: { degree: 1, quality: 'minor' },
  II: { degree: 2, quality: 'dim' },
  'II°': { degree: 2, quality: 'dim' },
  III: { degree: 3, quality: 'major' },
  iv: { degree: 4, quality: 'minor' },
  v: { degree: 5, quality: 'minor' },
  VI: { degree: 6, quality: 'major' },
  VII: { degree: 7, quality: 'major' },
};
// Borrowed chords: flatDegree = flatten scale degree (bVII, bVI, bIII, bII); degree = same root, different quality (iv, iio)
const BORROWED = {
  bVII: { flatDegree: 7, quality: 'major' },
  bVI: { flatDegree: 6, quality: 'major' },
  bIII: { flatDegree: 3, quality: 'major' },
  bII: { flatDegree: 2, quality: 'major' },
  iv: { degree: 4, quality: 'minor' },
  III: { degree: 3, quality: 'major' },
  iio: { degree: 2, quality: 'dim' },
  'ii°': { degree: 2, quality: 'dim' },
};

function parseRoman(roman) {
  const r = (roman || '').trim();
  if (BORROWED[r]) return { ...BORROWED[r], borrowed: true };
  const fromMajor = ROMAN_MAJOR[r];
  if (fromMajor) return { ...fromMajor, borrowed: false };
  const fromMinor = ROMAN_MINOR[r];
  if (fromMinor) return { ...fromMinor, borrowed: false };
  return null;
}

function romanToChord(roman, key, scale) {
  const scaleRoots = getScaleRoots(key, scale);
  if (!scaleRoots) return null;
  const isMinor = (scale || 'major').toLowerCase() === 'minor';
  const info = parseRoman(roman);
  if (!info) return null;

  if (info.borrowed) {
    if (info.flatDegree) {
      // bVII, bVI, bIII, bII: flatten scale degree in major; in minor use natural minor scale
      const degreeIdx = info.flatDegree - 1;
      const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
      const scaleNoteIdx = (getRootIndex(key) + intervals[degreeIdx]) % 12;
      const rootNoteIdx = isMinor ? scaleNoteIdx : (scaleNoteIdx - 1 + 12) % 12;
      const rootName = ROOTS_SHARP[rootNoteIdx];
      return rootName + (info.quality === 'major' ? '' : 'm');
    }
    if (info.degree) {
      // iv, iio: same root as scale degree, different quality (borrowed from parallel minor)
      const rootName = scaleRoots[info.degree - 1];
      if (info.quality === 'major') return rootName;
      if (info.quality === 'minor') return rootName + 'm';
      if (info.quality === 'dim') return rootName + 'dim';
      return rootName;
    }
  }

  const degree = info.degree;
  const rootName = scaleRoots[degree - 1];
  if (info.quality === 'major') return rootName;
  if (info.quality === 'minor') return rootName + 'm';
  if (info.quality === 'dim') return rootName + 'dim';
  return rootName;
}

function getChordQuality(roman) {
  const info = parseRoman(roman);
  if (!info) return 'major';
  return info.quality;
}

/**
 * Parse a chord symbol into root (0-11) and quality.
 * Handles C, Cm, Am, F#m, Bbdim, G7, etc. Strips 7ths for triad matching.
 */
function parseChordSymbol(symbol) {
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
  let quality = 'major';
  const rest = s.slice(i).toLowerCase();
  if ((rest.startsWith('m') && !rest.startsWith('maj')) || rest.startsWith('-')) quality = 'minor';
  else if (/dim|°|o/.test(rest)) quality = 'dim';
  return { rootIndex: idx, quality, rootName: root };
}

/**
 * Convert a chord symbol to its roman numeral in the given key and scale.
 * Returns { roman, quality } or null if unparseable or not in key.
 */
function chordToRoman(chordSymbol, key, scale) {
  const parsed = parseChordSymbol(chordSymbol);
  if (!parsed) return null;
  const scaleRoots = getScaleRoots(key, scale);
  if (!scaleRoots) return null;
  const isMinor = (scale || 'major').toLowerCase() === 'minor';
  const keyIdx = getRootIndex(key);
  if (keyIdx === null) return null;

  const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
  const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
  const intervals = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;

  for (let degree = 1; degree <= 7; degree++) {
    const scaleRootIdx = (keyIdx + intervals[degree - 1]) % 12;
    const scaleRoot = ROOTS_SHARP[scaleRootIdx];
    if (parsed.rootIndex === scaleRootIdx) {
      const info = isMinor ? ROMAN_MINOR : ROMAN_MAJOR;
      const romanKey = Object.keys(info).find((k) => {
        const v = info[k];
        return v.degree === degree && v.quality === parsed.quality;
      });
      if (romanKey) return { roman: romanKey, quality: parsed.quality };
      break;
    }
  }

  for (const [roman, spec] of Object.entries(BORROWED)) {
    if (spec.quality !== parsed.quality) continue;
    let expectedIdx;
    if (spec.flatDegree) {
      const degreeIdx = spec.flatDegree - 1;
      const ints = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
      const scaleNoteIdx = (keyIdx + ints[degreeIdx]) % 12;
      expectedIdx = isMinor ? scaleNoteIdx : (scaleNoteIdx - 1 + 12) % 12;
    } else if (spec.degree) {
      expectedIdx = (keyIdx + (isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS)[spec.degree - 1]) % 12;
    } else continue;
    if (parsed.rootIndex === expectedIdx) return { roman, quality: parsed.quality };
  }
  return null;
}

module.exports = {
  getRootIndex,
  getScaleRoots,
  parseRoman,
  romanToChord,
  chordToRoman,
  parseChordSymbol,
  getChordQuality,
  ROOTS_SHARP,
  ROOTS_FLAT,
  KEY_ALIASES,
};
