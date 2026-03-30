import { chordToRoman, parseChordSymbol, ROOTS_SHARP, getRootIndex } from '../lib/musicTheory';
import type { ServiceError } from '../types';

const VALID_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const VALID_SCALES = ['major', 'minor'];

export type ReharmKind = 'extension' | 'sus_add' | 'substitution';

export interface ReharmonizeAlternative {
  symbol: string;
  description: string;
  kind: ReharmKind;
}

export interface ReharmonizeSuccess {
  original: string;
  key: string;
  scale: string;
  roman: string | null;
  alternatives: ReharmonizeAlternative[];
}

export type ReharmonizeResult = ReharmonizeSuccess | (ServiceError & { error: string; message: string });

const ALL_KINDS: ReharmKind[] = ['extension', 'sus_add', 'substitution'];

function activeKinds(requested: string[] | null | undefined): Set<ReharmKind> {
  if (!requested || requested.length === 0) return new Set(ALL_KINDS);
  const s = new Set<ReharmKind>();
  for (const k of requested) {
    const low = String(k).toLowerCase().trim();
    if (low === 'extension' || low === 'extensions') s.add('extension');
    if (low === 'sus_add' || low === 'sus' || low === 'add') s.add('sus_add');
    if (low === 'substitution' || low === 'substitutions') s.add('substitution');
  }
  return s.size > 0 ? s : new Set(ALL_KINDS);
}

function uniqAlts(alts: ReharmonizeAlternative[], original: string, limit: number): ReharmonizeAlternative[] {
  const seen = new Set<string>([original.replace(/\s+/g, '')]);
  const out: ReharmonizeAlternative[] = [];
  for (const a of alts) {
    const sym = a.symbol.trim();
    if (!sym || seen.has(sym)) continue;
    seen.add(sym);
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

export function reharmonizeChord(params: {
  chord?: string | null;
  key?: string | null;
  scale?: string | null;
  kinds?: string[] | null;
  limit?: number | null;
} | null | undefined): ReharmonizeResult {
  const chord = params?.chord ? String(params.chord).trim() : '';
  const keyStr = params?.key ? String(params.key).trim() : '';
  const scaleStr = params?.scale ? String(params.scale).toLowerCase().trim() : '';
  const kinds = activeKinds(params?.kinds ?? undefined);
  const limit = params?.limit != null && !Number.isNaN(Number(params.limit)) ? Math.max(1, Math.min(48, Math.floor(Number(params.limit)))) : 24;

  if (!chord || !keyStr || !scaleStr) {
    return { error: 'invalid_params', message: 'Provide chord, key, and scale' };
  }
  if (getRootIndex(keyStr) === null) {
    return { error: 'invalid key', message: `Key must be one of: ${VALID_KEYS.join(', ')}` };
  }
  if (!VALID_SCALES.includes(scaleStr)) {
    return { error: 'invalid scale', message: `Scale must be one of: ${VALID_SCALES.join(', ')}` };
  }

  const parsed = parseChordSymbol(chord);
  if (!parsed) {
    return { error: 'invalid_chord', message: 'Could not parse chord symbol' };
  }

  const romanResult = chordToRoman(chord, keyStr, scaleStr);
  const roman = romanResult?.roman ?? null;
  const romanExt = romanResult?.extension;

  const root = parsed.rootName;
  const q = parsed.quality;
  const ext = parsed.extension;

  const alts: ReharmonizeAlternative[] = [];

  if (kinds.has('extension')) {
    if (q === 'major') {
      if (ext !== 'maj7') alts.push({ symbol: `${root}maj7`, description: 'Major 7th', kind: 'extension' });
      if (ext !== '7') alts.push({ symbol: `${root}7`, description: 'Dominant 7th', kind: 'extension' });
      if (ext !== 'maj9' && ext !== '9') alts.push({ symbol: `${root}maj9`, description: 'Major 9th', kind: 'extension' });
      if (ext === '7') {
        alts.push({ symbol: `${root}9`, description: 'Dominant 9th', kind: 'extension' });
        alts.push({ symbol: `${root}13`, description: 'Dominant 13th', kind: 'extension' });
      }
    } else if (q === 'minor') {
      if (ext !== 'm7') alts.push({ symbol: `${root}m7`, description: 'Minor 7th', kind: 'extension' });
      if (ext !== 'm9') alts.push({ symbol: `${root}m9`, description: 'Minor 9th', kind: 'extension' });
      if (ext !== 'maj7') alts.push({ symbol: `${root}m(maj7)`, description: 'Minor-major 7th', kind: 'extension' });
    } else if (q === 'dim' && ext !== 'dim7') {
      alts.push({ symbol: `${root}dim7`, description: 'Fully diminished 7th', kind: 'extension' });
    }
  }

  if (kinds.has('sus_add')) {
    if (q === 'major') {
      alts.push({ symbol: `${root}sus2`, description: 'Sus2 (no 3rd)', kind: 'sus_add' });
      alts.push({ symbol: `${root}sus4`, description: 'Sus4 (no 3rd)', kind: 'sus_add' });
      alts.push({ symbol: `${root}add9`, description: 'Add9', kind: 'sus_add' });
      alts.push({ symbol: `${root}6`, description: 'Major 6th', kind: 'sus_add' });
    } else if (q === 'minor') {
      alts.push({ symbol: `${root}m(add9)`, description: 'Minor add9', kind: 'sus_add' });
      alts.push({ symbol: `${root}sus4`, description: 'Sus4 on minor root', kind: 'sus_add' });
      alts.push({ symbol: `${root}sus2`, description: 'Sus2', kind: 'sus_add' });
    }
  }

  if (kinds.has('substitution')) {
    const isDom7 = ext === '7' && q === 'major';
    const vWithSeven = roman === 'V' && (romanExt === '7' || isDom7);
    if (vWithSeven || (isDom7 && scaleStr === 'major' && roman === 'V')) {
      const tritoneRoot = (parsed.rootIndex + 6) % 12;
      const tritoneName = ROOTS_SHARP[tritoneRoot];
      alts.push({
        symbol: `${tritoneName}7`,
        description: 'Tritone substitution (same dominant function, different root)',
        kind: 'substitution',
      });
    }
    if (isDom7) {
      alts.push({
        symbol: `${root}sus4`,
        description: 'Dominant sus4 (3rd removed; reharm color)',
        kind: 'substitution',
      });
    }
  }

  return {
    original: chord,
    key: keyStr,
    scale: scaleStr,
    roman,
    alternatives: uniqAlts(alts, chord, limit),
  };
}

export type ReharmProgressionStrategy = 'extensions_only' | 'light_jazz';

export interface ReharmonizeProgressionSlot {
  position: number;
  original: string;
  symbol: string;
  altered: boolean;
}

export interface ReharmonizeProgressionSuccess {
  key: string;
  scale: string;
  strategy: ReharmProgressionStrategy;
  progression: string[];
  slots: ReharmonizeProgressionSlot[];
}

export type ReharmonizeProgressionResult =
  | ReharmonizeProgressionSuccess
  | (ServiceError & { error: string; message: string });

function normChord(s: string): string {
  return s.replace(/\s+/g, '');
}

function kindsForStrategy(strategy: string): string[] {
  const s = String(strategy || 'extensions_only').toLowerCase().trim();
  if (s === 'light_jazz' || s === 'lightjazz') {
    return ['extension', 'sus_add', 'substitution'];
  }
  return ['extension'];
}

/**
 * Apply coherent reharmonization across a chord loop (first suitable alternative per slot, cap on changes).
 */
export function reharmonizeProgression(params: {
  chords?: string[] | null;
  key?: string | null;
  scale?: string | null;
  strategy?: string | null;
  max_altered_slots?: number | null;
} | null | undefined): ReharmonizeProgressionResult {
  const chords = params?.chords;
  const keyStr = params?.key ? String(params.key).trim() : '';
  const scaleStr = params?.scale ? String(params.scale).toLowerCase().trim() : '';
  const strategyRaw = String(params?.strategy || 'extensions_only').toLowerCase().trim();
  const strategy: ReharmProgressionStrategy =
    strategyRaw === 'light_jazz' || strategyRaw === 'lightjazz' ? 'light_jazz' : 'extensions_only';
  const maxAltered =
    params?.max_altered_slots != null && !Number.isNaN(Number(params.max_altered_slots))
      ? Math.max(0, Math.min(64, Math.floor(Number(params.max_altered_slots))))
      : 8;

  if (!chords || !Array.isArray(chords) || chords.length === 0) {
    return { error: 'invalid_params', message: 'Provide chords as a non-empty array' };
  }
  if (!keyStr || !scaleStr) {
    return { error: 'invalid_params', message: 'Provide key and scale' };
  }
  if (getRootIndex(keyStr) === null) {
    return { error: 'invalid key', message: `Key must be one of: ${VALID_KEYS.join(', ')}` };
  }
  if (!VALID_SCALES.includes(scaleStr)) {
    return { error: 'invalid scale', message: `Scale must be one of: ${VALID_SCALES.join(', ')}` };
  }

  const kinds = kindsForStrategy(strategy);
  const progression: string[] = [];
  const slots: ReharmonizeProgressionSlot[] = [];
  let alteredCount = 0;

  for (let i = 0; i < chords.length; i++) {
    const original = String(chords[i] || '').trim();
    if (!original) {
      return { error: 'invalid_params', message: `Empty chord at index ${i}` };
    }
    const one = reharmonizeChord({
      chord: original,
      key: keyStr,
      scale: scaleStr,
      kinds,
      limit: 48,
    });
    if ('error' in one) {
      return one;
    }

    let symbol = original;
    let altered = false;
    if (alteredCount < maxAltered) {
      const origN = normChord(original);
      const pick = one.alternatives.find((a) => normChord(a.symbol) !== origN);
      if (pick) {
        symbol = pick.symbol;
        altered = true;
        alteredCount++;
      }
    }

    progression.push(symbol);
    slots.push({
      position: i + 1,
      original,
      symbol,
      altered,
    });
  }

  return {
    key: keyStr,
    scale: scaleStr,
    strategy,
    progression,
    slots,
  };
}
