import express, { Response } from 'express';
import { getProgressions, getProgressionsSimple, getOptions } from '../services/progressionService';
import { resolveProgressions, completeProgressions } from '../services/resolutionService';
import { AuthenticatedRequest } from '../middleware';

const router = express.Router();

// Note: requireAuth and progressionRateLimiter are applied in index.ts
// This ensures per-user rate limiting since all requests are authenticated

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { key, scale, mood, style, genre, bpm, duration_seconds, bars, simple } = req.query;
  if (!key || !scale) {
    return res.status(400).json({
      error: 'key and scale are required',
      message: 'Provide key (e.g. C, G) and scale (major or minor) as query parameters.',
    });
  }
  const params = {
    key: key as string,
    scale: scale as string,
    mood: mood as string | undefined,
    style: style as string | undefined,
    genre: genre as string | undefined,
    bpm: bpm != null ? Number(bpm) : undefined,
    duration_seconds: duration_seconds != null ? Number(duration_seconds) : undefined,
    bars: bars != null ? Number(bars) : undefined,
  };
  const getResult = simple === 'true' || simple === '1' ? getProgressionsSimple : getProgressions;
  const result = getResult(params);
  if ('error' in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.get('/options', (req: AuthenticatedRequest, res: Response) => {
  const genre = req.query.genre as string | undefined;
  res.json(getOptions(genre || undefined));
});

router.post('/resolve', (req: AuthenticatedRequest, res: Response) => {
  const { chords, key, scale, genre, mood, style } = req.body || {};
  const result = resolveProgressions({ chords, key, scale, genre, mood, style });
  if ('error' in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/complete', (req: AuthenticatedRequest, res: Response) => {
  const { chords, key, scale, genre, mood, style } = req.body || {};
  const result = completeProgressions({ chords, key, scale, genre, mood, style });
  if ('error' in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

export default router;
