/**
 * Shared types for the OneFourFive API.
 */

export interface Template {
  genre: string;
  style: string;
  mood: string;
  romanPattern: string[];
  defaultBpm: number;
  scaleRequired?: 'minor';
  voicing?: string;
  /** Optional grouping (e.g. four_chord_pop, royal_road) for discovery and filtering. */
  family?: string;
}

export type ChordQuality = 'major' | 'minor' | 'dim';

export interface RomanInfo {
  degree?: number;
  quality: ChordQuality;
  borrowed?: boolean;
  baseRoman: string;
  extension?: string;
  flatDegree?: number;
}

export interface ParsedChord {
  rootIndex: number;
  quality: ChordQuality;
  rootName: string;
  extension?: string;
}

export interface ChordToRomanResult {
  roman: string | null;
  quality: ChordQuality;
  extension?: string;
}

/** Params for getProgressions / getProgressionsSimple */
export interface ProgressionParams {
  key?: string;
  scale?: string;
  mood?: string;
  style?: string;
  genre?: string;
  bpm?: number;
  duration_seconds?: number;
  bars?: number;
  /** When multiple templates share the same mood, pick by index (0-based). */
  variation?: number;
  /** If true, use legacy template resolution (style OR mood; style wins). */
  legacy?: boolean | string;
  /** Roman-level transforms applied after template resolution (same-length). */
  transforms?: string[];
  /** Steps for the `rotate` transform (default 1). */
  transform_rotate_steps?: number;
  /** Deterministic seed: shuffles transform order before applying (see progression service). */
  seed?: number;
  /** Restrict templates to this family id (see GET /progressions/options families). */
  family?: string;
}

/** One section for POST /progressions/song */
export interface SongSectionParams {
  label: string;
  genre?: string;
  mood?: string;
  style?: string;
  variation?: number;
  legacy?: boolean | string;
  bpm?: number;
  duration_seconds?: number;
  bars?: number;
  /** Repeat the section's chord loop this many times (1–32). */
  repeat?: number;
  transforms?: string[];
  transform_rotate_steps?: number;
  seed?: number;
  family?: string;
}

export interface SongParams {
  key: string;
  scale: string;
  sections: SongSectionParams[];
}

/** Params for resolveProgressions */
export interface ResolveParams {
  chords?: string[];
  key?: string;
  scale?: string;
  genre?: string;
  mood?: string;
  style?: string;
  /** strict: all chords must appear in template (default). relaxed: rank by coverage. */
  match?: 'strict' | 'relaxed';
  /** Max matches when match=relaxed (default 20). */
  limit?: number;
}

/** Error shape returned by services */
export interface ServiceError {
  error: string;
  message: string;
  invalid_chords?: string[];
}

/** Stored user (no password in responses) */
export interface User {
  id: string;
  email: string;
  createdAt: string; // ISO
}

/** Body for POST /auth/register */
export interface RegisterBody {
  email: string;
  password: string;
}

/** Body for POST /auth/login */
export interface LoginBody {
  email: string;
  password: string;
}

/** Success response for register/login */
export interface AuthSuccess {
  token: string;
  user: User;
  expiresIn: string; // e.g. "7d"
}

/** JWT payload (sub = userId) */
export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
