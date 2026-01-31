/**
 * Progression templates: genre, style/mood, romanPattern, defaultBpm.
 * Maximum coverage: common, jazz/avant-garde, anime, ambient/cinematic.
 */

const TEMPLATES = [
  // --- Common (pop, rock) ---
  { genre: 'pop', style: 'upbeat', mood: 'upbeat', romanPattern: ['I', 'V', 'vi', 'IV'], defaultBpm: 120 },
  { genre: 'pop', style: 'calm', mood: 'calm', romanPattern: ['I', 'IV', 'vi', 'V'], defaultBpm: 90 },
  { genre: 'pop', style: 'sad', mood: 'dark', romanPattern: ['vi', 'IV', 'I', 'V'], defaultBpm: 82 },
  { genre: 'rock', style: 'rock', mood: 'upbeat', romanPattern: ['I', 'V', 'IV', 'IV'], defaultBpm: 120 },
  { genre: 'rock', style: 'mixolydian', mood: 'neutral', romanPattern: ['I', 'bVII', 'IV', 'I'], defaultBpm: 115 },
  { genre: 'pop', style: '50s', mood: 'upbeat', romanPattern: ['I', 'vi', 'IV', 'V'], defaultBpm: 105 },
  { genre: 'pop', style: 'ballad', mood: 'calm', romanPattern: ['I', 'IV', 'V', 'IV'], defaultBpm: 72 },
  { genre: 'pop', style: 'ballad2', mood: 'calm', romanPattern: ['I', 'IV', 'I', 'V'], defaultBpm: 75 },
  { genre: 'pop', style: 'simple', mood: 'neutral', romanPattern: ['I', 'V', 'I', 'IV'], defaultBpm: 100 },
  { genre: 'pop', style: 'simple2', mood: 'neutral', romanPattern: ['I', 'IV', 'V', 'I'], defaultBpm: 105 },
  { genre: 'pop', style: 'emotional', mood: 'upbeat', romanPattern: ['I', 'V', 'vi', 'IV'], defaultBpm: 95 },
  { genre: 'pop', style: 'andalusian', mood: 'dark', romanPattern: ['i', 'bVII', 'bVI', 'V'], defaultBpm: 85, scaleRequired: 'minor' },
  { genre: 'pop', style: 'creep', mood: 'dark', romanPattern: ['I', 'III', 'IV', 'iv'], defaultBpm: 72 },
  { genre: 'rock', style: 'epic', mood: 'upbeat', romanPattern: ['I', 'bVI', 'bVII', 'I'], defaultBpm: 100 },
  { genre: 'rock', style: 'darkResolve', mood: 'dark', romanPattern: ['I', 'iv', 'IV', 'I'], defaultBpm: 80 },
  { genre: 'cinematic', style: 'epic', mood: 'upbeat', romanPattern: ['bVI', 'bVII', 'I'], defaultBpm: 90 },
  { genre: 'pop', style: 'neapolitan', mood: 'neutral', romanPattern: ['I', 'bII', 'V', 'I'], defaultBpm: 85 },

  // --- Jazz / avant-garde ---
  { genre: 'jazz', style: 'basic', mood: 'neutral', romanPattern: ['ii', 'V', 'I'], defaultBpm: 115 },
  { genre: 'jazz', style: 'turnaround', mood: 'neutral', romanPattern: ['I', 'vi', 'ii', 'V'], defaultBpm: 120 },
  { genre: 'jazz', style: 'extended', mood: 'neutral', romanPattern: ['iii', 'vi', 'ii', 'V'], defaultBpm: 120 },
  { genre: 'jazz', style: 'long', mood: 'neutral', romanPattern: ['iii', 'vi', 'ii', 'V', 'I'], defaultBpm: 110 },
  { genre: 'jazz', style: 'vi-ii-V-I', mood: 'neutral', romanPattern: ['vi', 'ii', 'V', 'I'], defaultBpm: 112 },
  { genre: 'jazz', style: 'turnaround2', mood: 'neutral', romanPattern: ['ii', 'V', 'I', 'vi'], defaultBpm: 110 },
  { genre: 'avantGarde', style: 'avant-garde', mood: 'calm', romanPattern: ['I', 'IV', 'iii', 'vi'], defaultBpm: 85 },
  { genre: 'avantGarde', style: 'borrowed', mood: 'neutral', romanPattern: ['I', 'bVII', 'IV', 'I'], defaultBpm: 95 },

  // --- Anime ---
  { genre: 'anime', style: 'royalRoad', mood: 'upbeat', romanPattern: ['IV', 'V', 'iii', 'vi'], defaultBpm: 98 },
  { genre: 'anime', style: 'short', mood: 'upbeat', romanPattern: ['IV', 'V', 'vi'], defaultBpm: 102 },
  { genre: 'anime', style: 'resolve', mood: 'calm', romanPattern: ['IV', 'V', 'iii', 'vi', 'I'], defaultBpm: 95 },
  { genre: 'anime', style: 'emotional', mood: 'dark', romanPattern: ['vi', 'IV', 'I', 'V'], defaultBpm: 87 },
  { genre: 'anime', style: 'epic', mood: 'upbeat', romanPattern: ['I', 'IV', 'V', 'IV'], defaultBpm: 108 },
  { genre: 'anime', style: 'ballad', mood: 'calm', romanPattern: ['I', 'IV', 'vi', 'V'], defaultBpm: 82 },
  { genre: 'anime', style: 'opEd', mood: 'upbeat', romanPattern: ['I', 'V', 'vi', 'IV'], defaultBpm: 108 },
  { genre: 'anime', style: 'anime', mood: 'neutral', romanPattern: ['IV', 'V', 'vi', 'I'], defaultBpm: 95 },

  // --- Ambient / cinematic ---
  { genre: 'ambient', style: 'ambient', mood: 'calm', romanPattern: ['I', 'IV', 'I'], defaultBpm: 72 },
  { genre: 'ambient', style: 'ambient2', mood: 'calm', romanPattern: ['I', 'vi', 'I'], defaultBpm: 68 },
  { genre: 'cinematic', style: 'cinematic', mood: 'neutral', romanPattern: ['I', 'V', 'vi', 'IV'], defaultBpm: 90 },
  { genre: 'cinematic', style: 'minor', mood: 'dark', romanPattern: ['i', 'VI', 'III', 'VII'], defaultBpm: 82, scaleRequired: 'minor' },
  { genre: 'ambient', style: 'minimal', mood: 'calm', romanPattern: ['I', 'IV'], defaultBpm: 70 },
];

/**
 * Normalize genre for lookup (e.g. "avant-garde" -> "avantGarde").
 */
const GENRE_ALIASES = {
  pop: 'pop',
  rock: 'rock',
  jazz: 'jazz',
  'avant-garde': 'avantGarde',
  avantGarde: 'avantGarde',
  anime: 'anime',
  ambient: 'ambient',
  cinematic: 'cinematic',
};

function getTemplatesByGenre(genre) {
  const normalized = GENRE_ALIASES[genre && genre.toLowerCase()] || genre;
  return TEMPLATES.filter((t) => t.genre === normalized);
}

function getTemplate(genre, moodOrStyle) {
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

function getAllTemplates() {
  return TEMPLATES;
}

module.exports = {
  TEMPLATES,
  getTemplatesByGenre,
  getTemplate,
  getAllTemplates,
};
