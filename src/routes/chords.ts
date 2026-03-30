import express, { Response } from 'express';
import { reharmonizeChord, reharmonizeProgression } from '../services/reharmonizeService';
import { AuthenticatedRequest } from '../middleware';

const router = express.Router();

router.post('/reharmonize', (req: AuthenticatedRequest, res: Response) => {
  const { chord, key, scale, kinds, limit } = req.body || {};
  const result = reharmonizeChord({ chord, key, scale, kinds, limit });
  if ('error' in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/reharmonize-progression', (req: AuthenticatedRequest, res: Response) => {
  const { chords, key, scale, strategy, max_altered_slots } = req.body || {};
  const result = reharmonizeProgression({ chords, key, scale, strategy, max_altered_slots });
  if ('error' in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

export default router;
