const express = require('express');
const router = express.Router();
const { getProgressions, getProgressionsSimple, getOptions } = require('../services/progressionService');

router.get('/', (req, res) => {
  const { key, scale, mood, style, genre, bpm, duration_seconds, bars, simple } = req.query;
  if (!key || !scale) {
    return res.status(400).json({
      error: 'key and scale are required',
      message: 'Provide key (e.g. C, G) and scale (major or minor) as query parameters.',
    });
  }
  const params = {
    key,
    scale,
    mood,
    style,
    genre,
    bpm: bpm != null ? Number(bpm) : undefined,
    duration_seconds: duration_seconds != null ? Number(duration_seconds) : undefined,
    bars: bars != null ? Number(bars) : undefined,
  };
  const getResult = simple === 'true' || simple === '1' ? getProgressionsSimple : getProgressions;
  const result = getResult(params);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.get('/options', (req, res) => {
  res.json(getOptions());
});

module.exports = router;
