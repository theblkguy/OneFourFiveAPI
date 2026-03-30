/**
 * Progression templates: genre, style/mood, romanPattern, defaultBpm.
 * Maximum coverage: common, jazz/avant-garde, anime, ambient/cinematic.
 */

import type { Template } from '../types';

export const TEMPLATES: Template[] = [
  // --- Common (pop, rock) ---
  { genre: 'pop', style: 'upbeat', mood: 'upbeat', romanPattern: ['I', 'V', 'vi', 'IV'], defaultBpm: 120, family: 'four_chord' },
  { genre: 'pop', style: 'calm', mood: 'calm', romanPattern: ['I', 'IV', 'vi', 'V'], defaultBpm: 90, family: 'four_chord' },
  { genre: 'pop', style: 'sad', mood: 'dark', romanPattern: ['vi', 'IV', 'I', 'V'], defaultBpm: 82, family: 'four_chord' },
  { genre: 'rock', style: 'rock', mood: 'upbeat', romanPattern: ['I', 'V', 'IV', 'IV'], defaultBpm: 120, family: 'four_chord' },
  { genre: 'rock', style: 'mixolydian', mood: 'neutral', romanPattern: ['I', 'bVII', 'IV', 'I'], defaultBpm: 115, family: 'mixolydian' },
  { genre: 'pop', style: '50s', mood: 'upbeat', romanPattern: ['I', 'vi', 'IV', 'V'], defaultBpm: 105, family: 'four_chord' },
  { genre: 'pop', style: 'ballad', mood: 'calm', romanPattern: ['I', 'IV', 'V', 'IV'], defaultBpm: 72, family: 'four_chord' },
  { genre: 'pop', style: 'ballad2', mood: 'calm', romanPattern: ['I', 'IV', 'I', 'V'], defaultBpm: 75, family: 'four_chord' },
  { genre: 'pop', style: 'simple', mood: 'neutral', romanPattern: ['I', 'V', 'I', 'IV'], defaultBpm: 100, family: 'four_chord' },
  { genre: 'pop', style: 'simple2', mood: 'neutral', romanPattern: ['I', 'IV', 'V', 'I'], defaultBpm: 105, family: 'four_chord' },
  { genre: 'pop', style: 'emotional', mood: 'upbeat', romanPattern: ['I', 'vi', 'iii', 'IV'], defaultBpm: 95, family: 'four_chord' },
  { genre: 'pop', style: 'andalusian', mood: 'dark', romanPattern: ['i', 'bVII', 'bVI', 'V'], defaultBpm: 85, scaleRequired: 'minor', family: 'minor_sequence' },
  { genre: 'pop', style: 'creep', mood: 'dark', romanPattern: ['I', 'III', 'IV', 'iv'], defaultBpm: 72, family: 'modal_mix' },
  { genre: 'rock', style: 'epic', mood: 'upbeat', romanPattern: ['I', 'bVI', 'bVII', 'I'], defaultBpm: 100, family: 'epic_borrow' },
  { genre: 'rock', style: 'darkResolve', mood: 'dark', romanPattern: ['I', 'iv', 'IV', 'I'], defaultBpm: 80, family: 'modal_mix' },
  { genre: 'cinematic', style: 'epic', mood: 'upbeat', romanPattern: ['bVI', 'bVII', 'I'], defaultBpm: 90, family: 'epic_borrow' },
  { genre: 'pop', style: 'neapolitan', mood: 'neutral', romanPattern: ['I', 'bII', 'V', 'I'], defaultBpm: 85, family: 'classical_tint' },

  // --- Jazz / avant-garde ---
  { genre: 'jazz', style: 'basic', mood: 'neutral', romanPattern: ['ii', 'V', 'I'], defaultBpm: 115, family: 'ii_V_I' },
  { genre: 'jazz', style: 'turnaround', mood: 'neutral', romanPattern: ['I', 'vi', 'ii', 'V'], defaultBpm: 120, family: 'turnaround' },
  { genre: 'jazz', style: 'extended', mood: 'neutral', romanPattern: ['iii', 'vi', 'ii', 'V'], defaultBpm: 120, family: 'turnaround' },
  { genre: 'jazz', style: 'long', mood: 'neutral', romanPattern: ['iii', 'vi', 'ii', 'V', 'I'], defaultBpm: 110, family: 'turnaround' },
  { genre: 'jazz', style: 'vi-ii-V-I', mood: 'neutral', romanPattern: ['vi', 'ii', 'V', 'I'], defaultBpm: 112, family: 'ii_V_I' },
  { genre: 'jazz', style: 'turnaround2', mood: 'neutral', romanPattern: ['ii', 'V', 'I', 'vi'], defaultBpm: 110, family: 'turnaround' },
  { genre: 'avantGarde', style: 'avant-garde', mood: 'calm', romanPattern: ['I', 'IV', 'iii', 'vi'], defaultBpm: 85, family: 'chromatic' },
  { genre: 'avantGarde', style: 'borrowed', mood: 'neutral', romanPattern: ['I', 'bVII', 'IV', 'I'], defaultBpm: 95, family: 'borrowed' },

  // --- Anime (J-pop / anime OP/ED; royal road IV–V–iii–vi and variants) ---
  { genre: 'anime', style: 'royalRoad', mood: 'upbeat', romanPattern: ['IV', 'V', 'iii', 'vi'], defaultBpm: 98, family: 'royal_road' },
  { genre: 'anime', style: 'royalRoad7', mood: 'calm', romanPattern: ['IVmaj7', 'V7', 'iii7', 'vi7'], defaultBpm: 90, family: 'royal_road' },
  { genre: 'anime', style: 'ghibli', mood: 'calm', romanPattern: ['IVmaj7', 'V7', 'iii7', 'vi7'], defaultBpm: 82, voicing: 'quartal', family: 'royal_road' },
  { genre: 'anime', style: 'resolve7', mood: 'calm', romanPattern: ['IVmaj7', 'V7', 'iii7', 'vi7', 'Imaj7'], defaultBpm: 88, family: 'royal_road' },
  { genre: 'anime', style: 'nostalgic7', mood: 'calm', romanPattern: ['vi7', 'IVmaj7', 'Imaj7', 'V7'], defaultBpm: 78, family: 'royal_road' },
  { genre: 'anime', style: 'whimsical9', mood: 'upbeat', romanPattern: ['Imaj9', 'V7', 'vim7', 'IVmaj7'], defaultBpm: 95, family: 'royal_road' },
  { genre: 'anime', style: 'short', mood: 'upbeat', romanPattern: ['IV', 'V', 'vi'], defaultBpm: 102, family: 'royal_road' },
  { genre: 'anime', style: 'resolve', mood: 'calm', romanPattern: ['IV', 'V', 'iii', 'vi', 'I'], defaultBpm: 95, family: 'royal_road' },
  { genre: 'anime', style: 'resolveDirect', mood: 'calm', romanPattern: ['IV', 'V', 'vi', 'I'], defaultBpm: 92, family: 'royal_road' },
  { genre: 'anime', style: 'reverseResolve', mood: 'calm', romanPattern: ['vi', 'V', 'IV', 'I'], defaultBpm: 88, family: 'royal_road' },
  { genre: 'anime', style: 'emotional', mood: 'dark', romanPattern: ['vi', 'IV', 'I', 'V'], defaultBpm: 87, family: 'four_chord' },
  { genre: 'anime', style: 'nostalgic', mood: 'calm', romanPattern: ['vi', 'IV', 'I', 'V'], defaultBpm: 80, family: 'four_chord' },
  { genre: 'anime', style: 'whimsical', mood: 'upbeat', romanPattern: ['I', 'V', 'vi', 'IV'], defaultBpm: 100, family: 'four_chord' },
  { genre: 'anime', style: 'ascending', mood: 'upbeat', romanPattern: ['I', 'iii', 'IV', 'V'], defaultBpm: 102, family: 'four_chord' },
  { genre: 'anime', style: 'rotated', mood: 'upbeat', romanPattern: ['IV', 'I', 'V', 'vi'], defaultBpm: 98, family: 'four_chord' },
  { genre: 'anime', style: 'epic', mood: 'upbeat', romanPattern: ['I', 'IV', 'V', 'IV'], defaultBpm: 108, family: 'four_chord' },
  { genre: 'anime', style: 'ballad', mood: 'calm', romanPattern: ['I', 'IV', 'vi', 'V'], defaultBpm: 82, family: 'four_chord' },
  { genre: 'anime', style: 'opEd', mood: 'upbeat', romanPattern: ['I', 'V', 'IV', 'vi'], defaultBpm: 108, family: 'four_chord' },
  { genre: 'anime', style: 'anime', mood: 'neutral', romanPattern: ['IV', 'V', 'vi', 'I'], defaultBpm: 95, family: 'royal_road' },

  // --- Ambient / cinematic ---
  { genre: 'ambient', style: 'ambient', mood: 'calm', romanPattern: ['I', 'IV', 'I'], defaultBpm: 72, family: 'ambient' },
  { genre: 'ambient', style: 'ambient2', mood: 'calm', romanPattern: ['I', 'vi', 'I'], defaultBpm: 68, family: 'ambient' },
  { genre: 'cinematic', style: 'cinematic', mood: 'neutral', romanPattern: ['I', 'V', 'vi', 'IV'], defaultBpm: 90, family: 'four_chord' },
  { genre: 'cinematic', style: 'minor', mood: 'dark', romanPattern: ['i', 'VI', 'III', 'VII'], defaultBpm: 82, scaleRequired: 'minor', family: 'minor_sequence' },
  { genre: 'ambient', style: 'minimal', mood: 'calm', romanPattern: ['I', 'IV'], defaultBpm: 70, family: 'ambient' },
];

const GENRE_ALIASES: Record<string, string> = {
  pop: 'pop',
  rock: 'rock',
  jazz: 'jazz',
  'avant-garde': 'avantGarde',
  avantGarde: 'avantGarde',
  anime: 'anime',
  ambient: 'ambient',
  cinematic: 'cinematic',
};

export function getTemplatesByGenre(genre: string | null | undefined): Template[] {
  const normalized =
    genre == null ? null : (GENRE_ALIASES[genre.toLowerCase()] ?? genre);
  return TEMPLATES.filter((t) => t.genre === normalized);
}

/** Valid (style, mood) pairs for a genre — use when disambiguating templates. */
export function getStyleMoodPairs(genre: string | null | undefined): { style: string; mood: string }[] {
  return getTemplatesByGenre(genre).map((t) => ({ style: t.style, mood: t.mood }));
}

/** Pre–strict-matching behavior: style OR mood string, style wins; else first template. */
export function getTemplateLegacy(
  genre: string | null | undefined,
  moodOrStyle: string | null | undefined,
): Template | null {
  const candidates = getTemplatesByGenre(genre);
  if (candidates.length === 0) return null;
  if (moodOrStyle) {
    const m = (moodOrStyle || '').toLowerCase();
    const byStyle = candidates.find((t) => (t.style || '').toLowerCase() === m);
    if (byStyle) return byStyle;
    const byMood = candidates.find((t) => (t.mood || '').toLowerCase() === m);
    if (byMood) return byMood;
  }
  return candidates[0];
}

export type ResolveTemplateResult =
  | { ok: true; template: Template; legacy?: boolean }
  | {
      ok: false;
      error: string;
      message: string;
      validPairs?: { style: string; mood: string }[];
      stylesForMood?: string[];
    };

export function resolveTemplate(
  genre: string,
  options: {
    style?: string | null;
    mood?: string | null;
    variation?: number | null;
    legacy?: boolean;
    family?: string | null;
  },
): ResolveTemplateResult {
  const { style, mood, variation, legacy, family } = options;
  let candidates = getTemplatesByGenre(genre);
  if (family?.trim()) {
    const fam = family.trim().toLowerCase();
    const filtered = candidates.filter((t) => (t.family || '').toLowerCase() === fam);
    if (filtered.length === 0) {
      return {
        ok: false,
        error: 'no_template_found',
        message: `No progression templates for genre="${genre}" and family="${family.trim()}". See GET /progressions/options families.`,
      };
    }
    candidates = filtered;
  }
  if (candidates.length === 0) {
    return {
      ok: false,
      error: 'no_template_found',
      message: `No progression templates for genre="${genre}". Try genre=pop|rock|jazz|anime|ambient|cinematic`,
    };
  }

  if (legacy) {
    const moodOrStyle = style?.trim() || mood?.trim() || undefined;
    let template: Template | null = null;
    if (moodOrStyle) {
      const m = moodOrStyle.toLowerCase();
      template =
        candidates.find((t) => (t.style || '').toLowerCase() === m) ||
        candidates.find((t) => (t.mood || '').toLowerCase() === m) ||
        null;
    }
    if (!template) template = candidates[0] || null;
    if (!template) {
      return {
        ok: false,
        error: 'no_template_found',
        message: `No progression template for genre="${genre}".`,
      };
    }
    return { ok: true, template, legacy: true };
  }

  const styleNorm = style?.trim() ? style.trim().toLowerCase() : null;
  const moodNorm = mood?.trim() ? mood.trim().toLowerCase() : null;

  if (styleNorm && moodNorm) {
    const template = candidates.find(
      (t) =>
        (t.style || '').toLowerCase() === styleNorm && (t.mood || '').toLowerCase() === moodNorm,
    );
    if (template) return { ok: true, template };
    return {
      ok: false,
      error: 'style_mood_mismatch',
      message: `No template for genre="${genre}" with style="${style}" and mood="${mood}". Use matching pairs from GET /progressions/options?genre=${encodeURIComponent(genre)} (style_mood_pairs).`,
      validPairs: getStyleMoodPairs(genre),
    };
  }

  if (styleNorm && !moodNorm) {
    const template = candidates.find((t) => (t.style || '').toLowerCase() === styleNorm);
    if (template) return { ok: true, template };
    return {
      ok: false,
      error: 'unknown_style',
      message: `No template with style="${style}" for genre="${genre}". See GET /progressions/options?genre=...`,
      validPairs: getStyleMoodPairs(genre),
    };
  }

  if (!styleNorm && moodNorm) {
    const moodMatches = candidates.filter((t) => (t.mood || '').toLowerCase() === moodNorm);
    if (moodMatches.length === 0) {
      return {
        ok: false,
        error: 'unknown_mood',
        message: `No template with mood="${mood}" for genre="${genre}".`,
        validPairs: getStyleMoodPairs(genre),
      };
    }
    if (moodMatches.length === 1) return { ok: true, template: moodMatches[0] };

    const v = variation != null && !Number.isNaN(Number(variation)) ? Math.floor(Number(variation)) : null;
    if (v != null && v >= 0 && v < moodMatches.length) {
      return { ok: true, template: moodMatches[v] };
    }

    const stylesForMood = moodMatches.map((t) => t.style);
    return {
      ok: false,
      error: 'ambiguous_mood',
      message: `Multiple templates for genre="${genre}" and mood="${mood}". Pass style=... or variation=0..${moodMatches.length - 1} (index into styles: ${stylesForMood.join(', ')}).`,
      stylesForMood,
      validPairs: getStyleMoodPairs(genre),
    };
  }

  return { ok: true, template: candidates[0] };
}

/** @deprecated Use resolveTemplate — kept for any external imports */
export function getTemplate(genre: string | null | undefined, moodOrStyle: string | null | undefined): Template | null {
  return getTemplateLegacy(genre, moodOrStyle);
}

export function getAllTemplates(): Template[] {
  return TEMPLATES;
}
