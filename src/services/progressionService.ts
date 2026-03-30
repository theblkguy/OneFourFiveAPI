import { resolveTemplate, getAllTemplates, getTemplatesByGenre } from '../data/templates';
import { applyTransforms, orderTransformsWithSeed } from '../lib/progressionTransforms';
import { getRootIndex, romanToChord } from '../lib/musicTheory';
import type { ProgressionParams, ServiceError, SongParams } from '../types';

const VALID_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const VALID_SCALES = ['major', 'minor'];
const MAX_BARS = 10000;
const MAX_DURATION_SECONDS = 86400; // 24 hours

export interface ProgressionChord {
  position: number;
  roman: string;
  symbol: string;
  bars: number;
}

export interface ProgressionSuccess {
  summary: string;
  key: string;
  scale: string;
  bpm: number;
  progression: string[];
  bars: number;
  bar_duration_seconds: number;
  mood: string;
  genre: string;
  style: string;
  chords: ProgressionChord[];
  loop_description: string;
  /** Final Roman numerals after optional transforms. */
  roman_pattern: string[];
  /** Template Romans before transforms (only when transforms were requested). */
  roman_pattern_template?: string[];
  transforms_applied?: string[];
  transforms_skipped?: string[];
  duration_seconds?: number;
  voicing?: string;
  warnings?: { code: string; message: string }[];
}

export type ProgressionResult = ProgressionSuccess | (ServiceError & { error: string; message: string; validPairs?: { style: string; mood: string }[]; stylesForMood?: string[] });

/** Explicit false forces strict matching even when PROGRESSION_LEGACY_MATCH=true. */
function resolveLegacyMatch(legacy: ProgressionParams['legacy']): boolean {
  if (legacy === false) return false;
  if (legacy === true) return true;
  if (legacy != null) {
    const s = String(legacy).toLowerCase().trim();
    if (s === 'false' || s === '0' || s === 'no') return false;
    if (s === 'true' || s === '1' || s === 'yes') return true;
  }
  return (process.env.PROGRESSION_LEGACY_MATCH || '').toLowerCase() === 'true';
}

export function getProgressions(params: ProgressionParams | null | undefined): ProgressionResult {
  const {
    key,
    scale,
    mood,
    style,
    genre,
    bpm,
    duration_seconds,
    bars,
    variation,
    legacy,
    transforms: transformsParam,
    transform_rotate_steps,
    seed,
    family,
  } = params || {};

  if (!key || !scale) {
    return { error: 'key and scale are required', message: 'Provide key (e.g. C) and scale (major or minor)' };
  }

  const keyStr = String(key).trim();
  const scaleStr = String(scale).toLowerCase().trim();

  if (getRootIndex(keyStr) === null) {
    return { error: 'invalid key', message: `Key must be one of: ${VALID_KEYS.join(', ')}` };
  }
  if (!VALID_SCALES.includes(scaleStr)) {
    return { error: 'invalid scale', message: `Scale must be one of: ${VALID_SCALES.join(', ')}` };
  }

  const genreStr = genre ? String(genre).trim() : 'pop';
  const moodStr = mood ? String(mood).trim() : null;
  const styleStr = style ? String(style).trim() : null;
  const useLegacy = resolveLegacyMatch(legacy);

  const resolved = resolveTemplate(genreStr, {
    style: styleStr,
    mood: moodStr,
    variation: variation != null && !Number.isNaN(Number(variation)) ? Number(variation) : null,
    legacy: useLegacy,
    family: family != null && String(family).trim() ? String(family).trim() : null,
  });

  if (!resolved.ok) {
    return {
      error: resolved.error,
      message: resolved.message,
      ...(resolved.validPairs && { validPairs: resolved.validPairs }),
      ...(resolved.stylesForMood && { stylesForMood: resolved.stylesForMood }),
    };
  }
  const { template } = resolved;

  if (template.scaleRequired && template.scaleRequired !== scaleStr) {
    return { error: 'scale mismatch', message: `Template "${template.style || template.genre}" requires scale=${template.scaleRequired}` };
  }

  const bpmNum = bpm != null && !Number.isNaN(Number(bpm)) ? Math.max(1, Math.min(300, Number(bpm))) : template.defaultBpm;
  const sourcePattern = [...template.romanPattern];
  let transformNames = (transformsParam || []).map((n) => String(n).trim()).filter(Boolean);
  if (seed != null && !Number.isNaN(Number(seed)) && transformNames.length > 1) {
    transformNames = orderTransformsWithSeed(transformNames, Number(seed));
  }
  const rotateSteps =
    transform_rotate_steps != null && !Number.isNaN(Number(transform_rotate_steps))
      ? Math.floor(Number(transform_rotate_steps))
      : undefined;
  const transformResult = applyTransforms(sourcePattern, transformNames.length ? transformNames : undefined, {
    scale: scaleStr === 'minor' ? 'minor' : 'major',
    rotateSteps,
  });
  const pattern = transformResult.pattern;
  const patternLen = pattern.length;

  let numBars: number;
  if (duration_seconds != null && !Number.isNaN(Number(duration_seconds)) && Number(duration_seconds) > 0) {
    const cappedDuration = Math.min(Number(duration_seconds), MAX_DURATION_SECONDS);
    const secondsPerBar = (4 * 60) / bpmNum;
    numBars = Math.ceil(cappedDuration / secondsPerBar);
    numBars = Math.min(numBars, MAX_BARS);
    numBars = Math.max(patternLen, Math.ceil(numBars / patternLen) * patternLen);
  } else if (bars != null && !Number.isNaN(Number(bars)) && Number(bars) > 0) {
    numBars = Math.ceil(Number(bars));
    numBars = Math.min(numBars, MAX_BARS);
    numBars = Math.max(patternLen, Math.ceil(numBars / patternLen) * patternLen);
  } else {
    numBars = Math.ceil(8 / patternLen) * patternLen;
    if (numBars < patternLen) numBars = patternLen;
  }

  const barDurationSeconds = (4 * 60) / bpmNum;
  const barsPerChord = Math.floor(numBars / patternLen);
  const chords: ProgressionChord[] = [];
  const progression: string[] = [];
  for (let i = 0; i < patternLen; i++) {
    const roman = pattern[i];
    const symbol = romanToChord(roman, keyStr, scaleStr);
    if (symbol == null) continue;
    chords.push({ position: i + 1, roman, symbol, bars: barsPerChord });
    progression.push(symbol);
  }

  const loopCount = Math.floor(numBars / patternLen);
  const loopDescription = duration_seconds
    ? `Repeat progression ${loopCount} times to fill ~${Math.round(numBars * barDurationSeconds)}s at ${bpmNum} BPM.`
    : `Repeat progression ${loopCount} times (${numBars} bars).`;

  const durationSec = duration_seconds != null && duration_seconds > 0
    ? Math.round(numBars * barDurationSeconds)
    : null;
  const progressionLine = progression.join(' → ');
  const summary = durationSec
    ? `${keyStr} ${scaleStr}, ${bpmNum} BPM: ${progressionLine} (${loopCount}×, ~${durationSec}s)`
    : `${keyStr} ${scaleStr}, ${bpmNum} BPM: ${progressionLine} (${numBars} bars)`;

  const response: ProgressionSuccess = {
    summary,
    key: keyStr,
    scale: scaleStr,
    bpm: bpmNum,
    progression,
    bars: numBars,
    bar_duration_seconds: Math.round(barDurationSeconds * 100) / 100,
    mood: template.mood || moodStr || 'neutral',
    genre: template.genre,
    style: template.style,
    chords,
    loop_description: loopDescription,
    roman_pattern: pattern,
  };
  if (transformNames.length > 0) {
    response.roman_pattern_template = sourcePattern;
    response.transforms_applied = transformResult.applied;
    if (transformResult.skipped.length > 0) {
      response.transforms_skipped = transformResult.skipped;
    }
  }
  if (durationSec != null) {
    response.duration_seconds = durationSec;
  }
  if (template.voicing) {
    response.voicing = template.voicing;
  }
  if (resolved.legacy) {
    response.warnings = [
      {
        code: 'legacy_match',
        message:
          'Template was resolved with legacy rules (style OR mood). Pass legacy=false and matching style+mood pairs for strict matching.',
      },
    ];
  }
  return response;
}

export interface ProgressionSimpleSuccess {
  summary: string;
  key: string;
  scale: string;
  bpm: number;
  progression: string[];
  bars: number;
  duration_seconds?: number;
}

export function getProgressionsSimple(params: ProgressionParams | null | undefined): ProgressionSimpleSuccess | ProgressionResult {
  const full = getProgressions(params);
  if ('error' in full) return full;
  return {
    summary: full.summary,
    key: full.key,
    scale: full.scale,
    bpm: full.bpm,
    progression: full.progression,
    bars: full.bars,
    ...(full.duration_seconds != null && { duration_seconds: full.duration_seconds }),
  };
}

export function getOptions(genre?: string | null): {
  keys: string[];
  scales: string[];
  moods: string[];
  genres: string[];
  styles: string[];
  style_mood_pairs: { style: string; mood: string }[];
  families: string[];
} {
  const templates = genre
    ? getTemplatesByGenre(genre)
    : getAllTemplates();
  const allTemplates = getAllTemplates();
  const genres = [...new Set(allTemplates.map((t) => t.genre))];
  const moods = [...new Set(templates.flatMap((t) => (t.mood ? [t.mood] : [])))];
  const styles = [...new Set(templates.flatMap((t) => (t.style ? [t.style] : [])))];
  const style_mood_pairs = templates.map((t) => ({ style: t.style, mood: t.mood }));
  const families = [...new Set(templates.map((t) => t.family).filter((f): f is string => Boolean(f)))].sort();
  return {
    keys: VALID_KEYS,
    scales: VALID_SCALES,
    moods: [...new Set(moods)].filter(Boolean).sort(),
    genres: genres.sort(),
    styles: [...new Set(styles)].filter(Boolean).sort(),
    style_mood_pairs,
    families,
  };
}

const MAX_SONG_SECTIONS = 32;
const MAX_SECTION_BARS = 512;

export interface SongSectionResult extends ProgressionSuccess {
  label: string;
}

export interface SongSuccess {
  key: string;
  scale: string;
  sections: SongSectionResult[];
  full_progression: string[];
  total_bars: number;
  approximate_duration_seconds: number;
}

export type SongResult = SongSuccess | (ServiceError & { error: string; message: string });

export function getSong(params: SongParams | null | undefined): SongResult {
  if (!params?.sections || !Array.isArray(params.sections) || params.sections.length === 0) {
    return { error: 'sections required', message: 'Provide sections: [{ label, genre?, style?, mood?, ... }]' };
  }
  if (params.sections.length > MAX_SONG_SECTIONS) {
    return { error: 'too_many_sections', message: `Maximum ${MAX_SONG_SECTIONS} sections per request` };
  }
  const keyStr = String(params.key || '').trim();
  const scaleStr = String(params.scale || '').toLowerCase().trim();
  if (!keyStr || !scaleStr) {
    return { error: 'key and scale required', message: 'Provide key and scale for the song' };
  }
  if (getRootIndex(keyStr) === null) {
    return { error: 'invalid key', message: `Key must be one of: ${VALID_KEYS.join(', ')}` };
  }
  if (!VALID_SCALES.includes(scaleStr)) {
    return { error: 'invalid scale', message: `Scale must be one of: ${VALID_SCALES.join(', ')}` };
  }

  const sectionsOut: SongSectionResult[] = [];
  const fullProgression: string[] = [];
  let totalBars = 0;

  for (let s = 0; s < params.sections.length; s++) {
    const sec = params.sections[s];
    const label = String(sec.label || `section_${s + 1}`).trim() || `section_${s + 1}`;
    const repeat = sec.repeat != null && !Number.isNaN(Number(sec.repeat)) ? Math.max(1, Math.min(32, Math.floor(Number(sec.repeat)))) : 1;

    const sub = getProgressions({
      key: keyStr,
      scale: scaleStr,
      genre: sec.genre,
      mood: sec.mood,
      style: sec.style,
      variation: sec.variation,
      legacy: sec.legacy,
      bpm: sec.bpm,
      duration_seconds: sec.duration_seconds,
      bars: sec.bars,
      transforms: sec.transforms,
      transform_rotate_steps: sec.transform_rotate_steps,
      seed: sec.seed,
      family: sec.family,
    });

    if ('error' in sub) {
      return { ...sub, message: `${label}: ${sub.message}` };
    }

    const barsThis = sub.bars * repeat;
    if (barsThis > MAX_SECTION_BARS) {
      return {
        error: 'section_too_long',
        message: `Section "${label}" exceeds ${MAX_SECTION_BARS} bars (after repeat)`,
      };
    }

    const progressionRepeated =
      repeat > 1
        ? Array.from({ length: repeat }, () => sub.progression).flat()
        : sub.progression;
    fullProgression.push(...progressionRepeated);

    totalBars += sub.bars * repeat;

    const secDuration =
      sub.duration_seconds != null ? Math.round(sub.duration_seconds * repeat) : undefined;
    const summaryLine =
      repeat > 1
        ? `${sub.summary} [${label}: ${repeat}× loop]`
        : `${sub.summary} [${label}]`;

    sectionsOut.push({
      ...sub,
      label,
      summary: summaryLine,
      progression: progressionRepeated,
      bars: sub.bars * repeat,
      chords: sub.chords.map((c) => ({
        ...c,
        bars: c.bars * repeat,
      })),
      ...(secDuration != null && { duration_seconds: secDuration }),
      loop_description:
        repeat > 1
          ? `${sub.loop_description} Section repeat: ${repeat}×.`
          : sub.loop_description,
    });
  }

  const approximate_duration_seconds = Math.round(
    sectionsOut.reduce((acc, sec) => acc + sec.bars * sec.bar_duration_seconds, 0) * 100,
  ) / 100;

  return {
    key: keyStr,
    scale: scaleStr,
    sections: sectionsOut,
    full_progression: fullProgression,
    total_bars: totalBars,
    approximate_duration_seconds,
  };
}
