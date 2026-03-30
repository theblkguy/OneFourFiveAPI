import express, { Response } from 'express';
import { parseTransformNamesFromQuery } from '../lib/progressionTransforms';
import { getProgressions, getProgressionsSimple, getOptions, getSong } from '../services/progressionService';
import { resolveProgressions, completeProgressions } from '../services/resolutionService';
import { AuthenticatedRequest } from '../middleware';

const router = express.Router();

// Note: requireAuth and progressionRateLimiter are applied in index.ts
// This ensures per-user rate limiting since all requests are authenticated

/** Undefined = omit (server may use PROGRESSION_LEGACY_MATCH env). */
function parseLegacyQuery(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v).toLowerCase().trim();
  if (s === 'false' || s === '0' || s === 'no') return false;
  if (s === 'true' || s === '1' || s === 'yes') return true;
  return undefined;
}

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const {
    key,
    scale,
    mood,
    style,
    genre,
    bpm,
    duration_seconds,
    bars,
    simple,
    variation,
    legacy,
    transforms: transformsQ,
    transform,
    transform_rotate_steps,
    seed,
    family,
  } = req.query;
  if (!key || !scale) {
    return res.status(400).json({
      error: 'key and scale are required',
      message: 'Provide key (e.g. C, G) and scale (major or minor) as query parameters.',
    });
  }
  const transformsList =
    parseTransformNamesFromQuery(transformsQ) ?? parseTransformNamesFromQuery(transform);
  const params = {
    key: key as string,
    scale: scale as string,
    mood: mood as string | undefined,
    style: style as string | undefined,
    genre: genre as string | undefined,
    bpm: bpm != null ? Number(bpm) : undefined,
    duration_seconds: duration_seconds != null ? Number(duration_seconds) : undefined,
    bars: bars != null ? Number(bars) : undefined,
    variation: variation != null && variation !== '' ? Number(variation) : undefined,
    legacy: parseLegacyQuery(legacy),
    ...(transformsList?.length && { transforms: transformsList }),
    ...(transform_rotate_steps != null && transform_rotate_steps !== ''
      ? { transform_rotate_steps: Number(transform_rotate_steps) }
      : {}),
    ...(seed != null && seed !== '' ? { seed: Number(seed) } : {}),
    ...(family != null && String(family).trim() ? { family: String(family).trim() } : {}),
  };
  const getResult = simple === 'true' || simple === '1' ? getProgressionsSimple : getProgressions;
  const result = getResult(params);
  if ('error' in result) {
    return res.status(400).json(result);
  }
  if ('warnings' in result && result.warnings?.some((w) => w.code === 'legacy_match')) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('X-Legacy-Template-Match', 'true');
  }
  res.json(result);
});

router.get('/options', (req: AuthenticatedRequest, res: Response) => {
  const genre = req.query.genre as string | undefined;
  res.json(getOptions(genre || undefined));
});

router.post('/resolve', (req: AuthenticatedRequest, res: Response) => {
  const { chords, key, scale, genre, mood, style, match, limit } = req.body || {};
  const result = resolveProgressions({ chords, key, scale, genre, mood, style, match, limit });
  if ('error' in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/complete', (req: AuthenticatedRequest, res: Response) => {
  const { chords, key, scale, genre, mood, style, match, limit } = req.body || {};
  const result = completeProgressions({ chords, key, scale, genre, mood, style, match, limit });
  if ('error' in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/song', (req: AuthenticatedRequest, res: Response) => {
  const { key, scale, sections } = req.body || {};
  const result = getSong({ key, scale, sections });
  if ('error' in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

export default router;
