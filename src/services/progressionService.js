const { getTemplate, getAllTemplates } = require('../data/templates');
const { getRootIndex, romanToChord } = require('../lib/musicTheory');

const VALID_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const VALID_SCALES = ['major', 'minor'];
const MAX_BARS = 10000;
const MAX_DURATION_SECONDS = 86400; // 24 hours

function getProgressions(params) {
  const { key, scale, mood, style, genre, bpm, duration_seconds, bars } = params || {};

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
  const template = getTemplate(genreStr, styleStr || moodStr || undefined);

  if (!template) {
    return { error: 'no template found', message: `No progression template for genre="${genreStr}"${moodStr ? ` mood="${moodStr}"` : ''}. Try genre=pop|rock|jazz|anime|ambient|cinematic` };
  }

  if (template.scaleRequired && template.scaleRequired !== scaleStr) {
    return { error: 'scale mismatch', message: `Template "${template.style || template.genre}" requires scale=${template.scaleRequired}` };
  }

  const bpmNum = bpm != null && !Number.isNaN(Number(bpm)) ? Math.max(1, Math.min(300, Number(bpm))) : template.defaultBpm;
  const pattern = template.romanPattern;
  const patternLen = pattern.length;

  let numBars;
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
  const chords = [];
  const progression = [];
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

  const response = {
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
  };
  if (durationSec != null) {
    response.duration_seconds = durationSec;
  }
  if (template.voicing) {
    response.voicing = template.voicing;
  }
  return response;
}

function getProgressionsSimple(params) {
  const full = getProgressions(params);
  if (full.error) return full;
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

function getOptions() {
  const templates = getAllTemplates();
  const genres = [...new Set(templates.map((t) => t.genre))];
  const moods = [...new Set(templates.flatMap((t) => (t.mood ? [t.mood] : [])))];
  const styles = [...new Set(templates.flatMap((t) => (t.style ? [t.style] : [])))];
  return {
    keys: VALID_KEYS,
    scales: VALID_SCALES,
    moods: [...new Set(moods)].filter(Boolean).sort(),
    genres: genres.sort(),
    styles: [...new Set(styles)].filter(Boolean).sort(),
  };
}

module.exports = { getProgressions, getProgressionsSimple, getOptions };
