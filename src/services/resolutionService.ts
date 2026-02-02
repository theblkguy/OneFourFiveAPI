import { getAllTemplates } from '../data/templates';
import { getRootIndex, romanToChord, chordToRoman, getBaseRoman } from '../lib/musicTheory';
import type { ResolveParams, ServiceError } from '../types';

const VALID_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const VALID_SCALES = ['major', 'minor'];
const MAX_CHORDS = 50;

function normalizeRoman(r: string): string {
  const base = getBaseRoman((r || '').trim());
  if (!base) return (r || '').trim();
  if (base === 'ii°' || base === 'iio') return 'iio';
  return base;
}

export interface ResolveMatch {
  progression: string[];
  roman_pattern: string[];
  genre: string;
  style: string | null;
  mood: string | null;
  default_bpm: number;
}

export interface ResolveSuccess {
  input_chords: string[];
  input_romans: string[];
  key: string;
  scale: string;
  matches: ResolveMatch[];
  message?: string;
}

export type ResolveResult = ResolveSuccess | (ServiceError & { error: string; message: string; invalid_chords?: string[] });

/** Match from completeProgressions: full progression plus completion (rest of progression after user's prefix). */
export interface CompleteMatch extends ResolveMatch {
  completion: string[];
}

export interface CompleteSuccess {
  input_chords: string[];
  input_romans: string[];
  key: string;
  scale: string;
  matches: CompleteMatch[];
  message?: string;
}

export type CompleteResult = CompleteSuccess | (ServiceError & { error: string; message: string; invalid_chords?: string[] });

/**
 * Find full progressions from templates that contain all of the user's chords,
 * filtered by optional genre, mood, and style preferences.
 */
export function resolveProgressions(params: ResolveParams | null | undefined): ResolveResult {
  const { chords, key, scale, genre, mood, style } = params || {};

  if (!chords || !Array.isArray(chords) || chords.length === 0) {
    return { error: 'chords required', message: 'Provide chords as an array (e.g. ["C", "G", "Am"])' };
  }
  if (chords.length > MAX_CHORDS) {
    return { error: 'too many chords', message: `Maximum ${MAX_CHORDS} chords per request` };
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

  const inputRomans: (string | null)[] = [];
  const invalidChords: string[] = [];
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

  const userRomanSet = new Set(inputRomans.filter((r): r is string => r != null).map(normalizeRoman));
  let templates = getAllTemplates();

  if (genre) {
    const g = String(genre).toLowerCase().trim();
    const alias: Record<string, string> = { 'avant-garde': 'avantGarde', avantgarde: 'avantGarde' };
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

  const matches: ResolveMatch[] = templates.map((t) => {
    const progression = t.romanPattern.map((r) => romanToChord(r, keyStr, scaleStr)).filter((x): x is string => Boolean(x));
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
    input_romans: [...new Set(inputRomans.filter((r): r is string => r != null))],
    key: keyStr,
    scale: scaleStr,
    matches,
    message: matches.length === 0 ? 'No templates contain all your chords.' : undefined,
  };
}

/**
 * Find full progressions that start with the user's chord sequence (prefix match),
 * and return the completion (rest of the progression) so the user can finish their idea.
 */
export function completeProgressions(params: ResolveParams | null | undefined): CompleteResult {
  const { chords, key, scale, genre, mood, style } = params || {};

  if (!chords || !Array.isArray(chords) || chords.length === 0) {
    return { error: 'chords required', message: 'Provide chords as an array (e.g. ["C", "G", "Am"])' };
  }
  if (chords.length > MAX_CHORDS) {
    return { error: 'too many chords', message: `Maximum ${MAX_CHORDS} chords per request` };
  }
  if (!key || !scale) {
    return { error: 'key and scale required', message: 'Provide key (e.g. C) and scale (major or minor) to complete chords' };
  }

  const keyStr = String(key).trim();
  const scaleStr = String(scale).toLowerCase().trim();

  if (getRootIndex(keyStr) === null) {
    return { error: 'invalid key', message: `Key must be one of: ${VALID_KEYS.join(', ')}` };
  }
  if (!VALID_SCALES.includes(scaleStr)) {
    return { error: 'invalid scale', message: `Scale must be one of: ${VALID_SCALES.join(', ')}` };
  }

  const inputRomans: (string | null)[] = [];
  const invalidChords: string[] = [];
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

  const userRomans = inputRomans.filter((r): r is string => r != null);
  const userPrefixNormalized = userRomans.map(normalizeRoman);

  let templates = getAllTemplates();

  if (genre) {
    const g = String(genre).toLowerCase().trim();
    const alias: Record<string, string> = { 'avant-garde': 'avantGarde', avantgarde: 'avantGarde' };
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
    if (t.romanPattern.length < userPrefixNormalized.length) return false;
    const templatePrefix = t.romanPattern.slice(0, userPrefixNormalized.length).map(normalizeRoman);
    return templatePrefix.every((r, i) => r === userPrefixNormalized[i]);
  });

  const matches: CompleteMatch[] = templates.map((t) => {
    const progression = t.romanPattern.map((r) => romanToChord(r, keyStr, scaleStr)).filter((x): x is string => Boolean(x));
    const completion = progression.slice(userRomans.length);
    return {
      progression,
      roman_pattern: t.romanPattern,
      genre: t.genre,
      style: t.style || null,
      mood: t.mood || null,
      default_bpm: t.defaultBpm,
      completion,
    };
  });

  return {
    input_chords: chords.filter((c) => String(c).trim()),
    input_romans: userRomans,
    key: keyStr,
    scale: scaleStr,
    matches,
    message: matches.length === 0 ? 'No templates start with your chord sequence.' : undefined,
  };
}
