import { getAllTemplates } from '../data/templates';
import { getRootIndex, romanToChord, chordToRoman, getBaseRoman } from '../lib/musicTheory';
import type { ResolveParams, ServiceError } from '../types';

const VALID_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const VALID_SCALES = ['major', 'minor'];

function maxChordsResolve(): number {
  const n = parseInt(process.env.MAX_CHORDS_RESOLVE ?? '', 10);
  if (!Number.isFinite(n) || n < 1) return 200;
  return Math.min(500, Math.floor(n));
}

function normalizeRoman(r: string): string {
  const base = getBaseRoman((r || '').trim());
  if (!base) return (r || '').trim();
  if (base === 'ii°' || base === 'iio') return 'iio';
  return base;
}

function resolveMatchMode(match: unknown): 'strict' | 'relaxed' {
  const m = String(match || 'strict').toLowerCase().trim();
  return m === 'relaxed' ? 'relaxed' : 'strict';
}

function resolveLimit(limit: unknown, fallback: number, cap: number): number {
  if (limit == null || Number.isNaN(Number(limit))) return fallback;
  return Math.max(1, Math.min(cap, Math.floor(Number(limit))));
}

export interface ResolveMatch {
  progression: string[];
  roman_pattern: string[];
  genre: string;
  style: string | null;
  mood: string | null;
  default_bpm: number;
  /** Present when match=relaxed: fraction of distinct input romans found in the template (0–1). */
  match_score?: number;
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
  const { chords, key, scale, genre, mood, style, match, limit: limitParam } = params || {};
  const matchMode = resolveMatchMode(match);
  const limit = resolveLimit(limitParam, 20, 100);

  if (!chords || !Array.isArray(chords) || chords.length === 0) {
    return { error: 'chords required', message: 'Provide chords as an array (e.g. ["C", "G", "Am"])' };
  }
  const maxC = maxChordsResolve();
  if (chords.length > maxC) {
    return { error: 'too many chords', message: `Maximum ${maxC} chords per request` };
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

  if (matchMode === 'strict') {
    templates = templates.filter((t) => {
      if (t.scaleRequired && t.scaleRequired !== scaleStr) return false;
      const patternRomans = new Set(t.romanPattern.map(normalizeRoman));
      return [...userRomanSet].every((r) => patternRomans.has(r));
    });
  } else {
    templates = templates.filter((t) => !(t.scaleRequired && t.scaleRequired !== scaleStr));
  }

  let matches: ResolveMatch[];
  if (matchMode === 'strict') {
    matches = templates.map((t) => {
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
  } else {
    const userList = [...userRomanSet];
    const scored = templates
      .map((t) => {
        const patternRomans = new Set(t.romanPattern.map(normalizeRoman));
        let hits = 0;
        for (const r of userList) {
          if (patternRomans.has(r)) hits++;
        }
        const score = userList.length > 0 ? hits / userList.length : 0;
        return { t, match_score: score };
      })
      .filter((x) => x.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score || b.t.romanPattern.length - a.t.romanPattern.length)
      .slice(0, limit);

    matches = scored.map(({ t, match_score }) => {
      const progression = t.romanPattern.map((r) => romanToChord(r, keyStr, scaleStr)).filter((x): x is string => Boolean(x));
      return {
        progression,
        roman_pattern: t.romanPattern,
        genre: t.genre,
        style: t.style || null,
        mood: t.mood || null,
        default_bpm: t.defaultBpm,
        match_score,
      };
    });
  }

  return {
    input_chords: chords.filter((c) => String(c).trim()),
    input_romans: [...new Set(inputRomans.filter((r): r is string => r != null))],
    key: keyStr,
    scale: scaleStr,
    matches,
    message:
      matches.length === 0
        ? matchMode === 'strict'
          ? 'No templates contain all your chords.'
          : 'No templates overlap your chords (relaxed match).'
        : undefined,
  };
}

/**
 * Find full progressions that start with the user's chord sequence (prefix match),
 * and return the completion (rest of the progression) so the user can finish their idea.
 */
export function completeProgressions(params: ResolveParams | null | undefined): CompleteResult {
  const { chords, key, scale, genre, mood, style, match, limit: limitParam } = params || {};
  const matchMode = resolveMatchMode(match);
  const limit = resolveLimit(limitParam, 20, 100);

  if (!chords || !Array.isArray(chords) || chords.length === 0) {
    return { error: 'chords required', message: 'Provide chords as an array (e.g. ["C", "G", "Am"])' };
  }
  const maxC = maxChordsResolve();
  if (chords.length > maxC) {
    return { error: 'too many chords', message: `Maximum ${maxC} chords per request` };
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

  if (matchMode === 'strict') {
    templates = templates.filter((t) => {
      if (t.scaleRequired && t.scaleRequired !== scaleStr) return false;
      if (t.romanPattern.length < userPrefixNormalized.length) return false;
      const templatePrefix = t.romanPattern.slice(0, userPrefixNormalized.length).map(normalizeRoman);
      return templatePrefix.every((r, i) => r === userPrefixNormalized[i]);
    });
  } else {
    templates = templates.filter(
      (t) =>
        !(t.scaleRequired && t.scaleRequired !== scaleStr) &&
        t.romanPattern.length >= userPrefixNormalized.length,
    );
  }

  let matches: CompleteMatch[];
  if (matchMode === 'strict') {
    matches = templates.map((t) => {
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
  } else {
    const plen = userPrefixNormalized.length;
    const scored = templates
      .map((t) => {
        const templatePrefix = t.romanPattern.slice(0, plen).map(normalizeRoman);
        let hits = 0;
        for (let i = 0; i < plen; i++) {
          if (templatePrefix[i] === userPrefixNormalized[i]) hits++;
        }
        const match_score = plen > 0 ? hits / plen : 0;
        return { t, match_score };
      })
      .filter((x) => x.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score || b.t.romanPattern.length - a.t.romanPattern.length)
      .slice(0, limit);

    matches = scored.map(({ t, match_score }) => {
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
        match_score,
      };
    });
  }

  return {
    input_chords: chords.filter((c) => String(c).trim()),
    input_romans: userRomans,
    key: keyStr,
    scale: scaleStr,
    matches,
    message:
      matches.length === 0
        ? matchMode === 'strict'
          ? 'No templates start with your chord sequence.'
          : 'No templates partially match your prefix (relaxed match).'
        : undefined,
  };
}
