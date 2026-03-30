/**
 * Deterministic Roman-numeral transforms for progression templates.
 * Same-length only — preserves bar math in getProgressions.
 */

import { parseRoman } from './musicTheory';

export type ProgressionScale = 'major' | 'minor';

export interface ApplyTransformsContext {
  scale: ProgressionScale;
  /** Steps for `rotate` (default 1). Cyclic left shift: index 0 moves toward the end. */
  rotateSteps?: number;
}

export interface ApplyTransformsResult {
  pattern: string[];
  applied: string[];
  skipped: string[];
}

type TransformFn = (pattern: string[], ctx: ApplyTransformsContext) => string[];

function rotateTransform(pattern: string[], ctx: ApplyTransformsContext): string[] {
  const n = pattern.length;
  if (n === 0) return pattern;
  const raw = ctx.rotateSteps ?? 1;
  const steps = ((Math.floor(raw) % n) + n) % n;
  return [...pattern.slice(steps), ...pattern.slice(0, steps)];
}

function dominantExtensionsTransform(pattern: string[], ctx: ApplyTransformsContext): string[] {
  if (ctx.scale !== 'major') return pattern;
  return pattern.map((r) => {
    const info = parseRoman(r);
    if (!info) return r;
    if (info.baseRoman === 'V' && info.quality === 'major' && !info.extension) {
      return 'V7';
    }
    return r;
  });
}

function borrowedIvTransform(pattern: string[], ctx: ApplyTransformsContext): string[] {
  if (ctx.scale !== 'major') return pattern;
  return pattern.map((r) => {
    const info = parseRoman(r);
    if (!info) return r;
    if (info.baseRoman === 'IV' && info.quality === 'major' && !info.extension) {
      return 'iv';
    }
    return r;
  });
}

const TRANSFORMS: Record<string, TransformFn> = {
  rotate: rotateTransform,
  dominant_extensions: dominantExtensionsTransform,
  borrowed_iv: borrowedIvTransform,
};

/** Known transform ids (for OpenAPI / docs). */
export const PROGRESSION_TRANSFORM_IDS = Object.keys(TRANSFORMS).sort() as readonly string[];

function normalizeName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
}

/**
 * Apply named transforms in order. Unknown names are listed in `skipped` and ignored.
 */
/**
 * Deterministic shuffle of transform ids (e.g. when `seed` is passed with multiple transforms).
 */
export function orderTransformsWithSeed(names: string[], seed: number): string[] {
  if (names.length <= 1) return [...names];
  let state = (Number(seed) >>> 0) || 1;
  const next = (): number => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  const arr = [...names];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j]!;
    arr[j] = t!;
  }
  return arr;
}

/** Parse comma-separated or repeated query values into trim non-empty strings. */
export function parseTransformNamesFromQuery(value: unknown): string[] | undefined {
  if (value == null || value === '') return undefined;
  if (Array.isArray(value)) {
    const out = value.flatMap((v) => String(v).split(',')).map((s) => s.trim()).filter(Boolean);
    return out.length ? out : undefined;
  }
  const s = String(value).trim();
  if (!s) return undefined;
  const out = s.split(',').map((x) => x.trim()).filter(Boolean);
  return out.length ? out : undefined;
}

export function applyTransforms(
  pattern: string[],
  names: string[] | null | undefined,
  ctx: ApplyTransformsContext,
): ApplyTransformsResult {
  const list = names?.filter((n) => String(n).trim()) ?? [];
  if (list.length === 0) {
    return { pattern: [...pattern], applied: [], skipped: [] };
  }

  let current = [...pattern];
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const raw of list) {
    const key = normalizeName(raw);
    const fn = TRANSFORMS[key];
    if (!fn) {
      skipped.push(String(raw).trim());
      continue;
    }
    current = fn(current, ctx);
    applied.push(key);
  }

  return { pattern: current, applied, skipped };
}
