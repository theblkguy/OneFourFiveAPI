const { getAllTemplates } = require('../data/templates');
const { getRootIndex, romanToChord, chordToRoman } = require('../lib/musicTheory');

const VALID_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const VALID_SCALES = ['major', 'minor'];

function normalizeRoman(r) {
  const s = (r || '').trim();
  if (s === 'ii°' || s === 'iio') return 'iio';
  return s;
}

/**
 * Find full progressions from templates that contain all of the user's chords,
 * filtered by optional genre, mood, and style preferences.
 */
function resolveProgressions(params) {
  const { chords, key, scale, genre, mood, style } = params || {};

  if (!chords || !Array.isArray(chords) || chords.length === 0) {
    return { error: 'chords required', message: 'Provide chords as an array (e.g. ["C", "G", "Am"])' };
  }
  if (!key || !scale) {
    return { error: 'key and scale required', message: 'Provide key (e.g. C) and scale (major or minor) to resolve chords' };
  }

  const keyStr = String(key).trim();
  const scaleStr = String(scale).toLowerCase().trim();

  if (getRootIndex(keyStr) === null) {
    return { error: 'invalid key', message: `Key must be one of: ${VALID_KEYS.join(', ')}` };
  }
  if (!VALID_SCALES.includes(scaleStr)) {
    return { error: 'invalid scale', message: `Scale must be one of: ${VALID_SCALES.join(', ')}` };
  }

  const inputRomans = [];
  const invalidChords = [];
  for (const c of chords) {
    const sym = String(c).trim();
    if (!sym) continue;
    const result = chordToRoman(sym, keyStr, scaleStr);
    if (result) {
      inputRomans.push(result.roman);
    } else {
      invalidChords.push(sym);
    }
  }

  if (invalidChords.length > 0) {
    return {
      error: 'invalid chords',
      message: `Could not parse chords in key ${keyStr} ${scaleStr}: ${invalidChords.join(', ')}`,
      invalid_chords: invalidChords,
    };
  }

  const userRomanSet = new Set(inputRomans.map(normalizeRoman));
  let templates = getAllTemplates();

  if (genre) {
    const g = String(genre).toLowerCase().trim();
    const alias = { 'avant-garde': 'avantGarde', avantgarde: 'avantGarde' };
    const norm = alias[g] || g;
    templates = templates.filter((t) => (t.genre || '').toLowerCase() === norm);
  }
  if (mood) {
    const m = String(mood).toLowerCase().trim();
    templates = templates.filter((t) => (t.mood || '').toLowerCase() === m);
  }
  if (style) {
    const s = String(style).toLowerCase().trim();
    templates = templates.filter((t) => (t.style || '').toLowerCase() === s);
  }

  templates = templates.filter((t) => {
    if (t.scaleRequired && t.scaleRequired !== scaleStr) return false;
    const patternRomans = new Set(t.romanPattern.map(normalizeRoman));
    return [...userRomanSet].every((r) => patternRomans.has(r));
  });

  const matches = templates.map((t) => {
    const progression = t.romanPattern.map((r) => romanToChord(r, keyStr, scaleStr)).filter(Boolean);
    return {
      progression,
      roman_pattern: t.romanPattern,
      genre: t.genre,
      style: t.style || null,
      mood: t.mood || null,
      default_bpm: t.defaultBpm,
    };
  });

  return {
    input_chords: chords.filter((c) => String(c).trim()),
    input_romans: [...new Set(inputRomans)],
    key: keyStr,
    scale: scaleStr,
    matches,
    message: matches.length === 0 ? 'No templates contain all your chords.' : undefined,
  };
}

module.exports = { resolveProgressions };
