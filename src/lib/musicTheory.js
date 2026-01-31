/**
 * Music theory: Roman numeral to chord symbol in a given key and scale.
 * Supports major, natural minor, and borrowed chords (bVII, bVI in minor; bVII in major).
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
// Borrowed: bVII, bVI (minor or major). Root = flat 7 or flat 6 in the scale's key.
const BORROWED = {
  bVII: { flatDegree: 7, quality: 'major' },
  bVI: { flatDegree: 6, quality: 'major' },
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
    // In minor (e.g. Andalusian): bVII = 7th of natural minor, bVI = 6th of natural minor (Am–G–F–E).
    // In major (e.g. rock): bVII = semitone below 7th (C–Bb–F–C).
    const degreeIdx = info.flatDegree - 1;
    const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const scaleNoteIdx = (getRootIndex(key) + intervals[degreeIdx]) % 12;
    const rootNoteIdx = isMinor ? scaleNoteIdx : (scaleNoteIdx - 1 + 12) % 12;
    const rootName = ROOTS_SHARP[rootNoteIdx];
    return rootName + (info.quality === 'major' ? '' : 'm');
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

module.exports = {
  getRootIndex,
  getScaleRoots,
  parseRoman,
  romanToChord,
  getChordQuality,
  ROOTS_SHARP,
  ROOTS_FLAT,
  KEY_ALIASES,
};
