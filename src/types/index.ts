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
}

/** Params for resolveProgressions */
export interface ResolveParams {
  chords?: string[];
  key?: string;
  scale?: string;
  genre?: string;
  mood?: string;
  style?: string;
}

/** Error shape returned by services */
export interface ServiceError {
  error: string;
  message: string;
  invalid_chords?: string[];
}
