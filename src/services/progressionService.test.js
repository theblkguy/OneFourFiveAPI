const { getProgressions, getProgressionsSimple, getOptions } = require('./progressionService');

describe('progressionService', () => {
  describe('getProgressions', () => {
    it('returns error when key or scale missing', () => {
      expect(getProgressions({})).toMatchObject({ error: 'key and scale are required' });
      expect(getProgressions({ key: 'C' })).toMatchObject({ error: 'key and scale are required' });
      expect(getProgressions({ scale: 'major' })).toMatchObject({ error: 'key and scale are required' });
    });

    it('returns error for invalid key or scale', () => {
      expect(getProgressions({ key: 'X', scale: 'major' })).toMatchObject({ error: 'invalid key' });
      expect(getProgressions({ key: 'C', scale: 'dorian' })).toMatchObject({ error: 'invalid scale' });
    });

    it('returns progression for C major pop default', () => {
      const result = getProgressions({ key: 'C', scale: 'major' });
      expect(result.error).toBeUndefined();
      expect(result.key).toBe('C');
      expect(result.scale).toBe('major');
      expect(result.progression).toBeInstanceOf(Array);
      expect(result.progression.length).toBeGreaterThan(0);
      expect(result.bars).toBeGreaterThanOrEqual(4);
      expect(result.chords).toBeInstanceOf(Array);
      expect(result.summary).toContain('C');
    });

    it('returns I–V–vi–IV for pop upbeat', () => {
      const result = getProgressions({ key: 'C', scale: 'major', genre: 'pop', style: 'upbeat' });
      expect(result.error).toBeUndefined();
      expect(result.progression).toEqual(['C', 'G', 'Am', 'F']);
    });

    it('honors duration_seconds and returns duration_seconds', () => {
      const result = getProgressions({ key: 'C', scale: 'major', duration_seconds: 60 });
      expect(result.error).toBeUndefined();
      expect(result.duration_seconds).toBeGreaterThanOrEqual(60);
    });

    it('honors bars parameter', () => {
      const result = getProgressions({ key: 'C', scale: 'major', bars: 16 });
      expect(result.error).toBeUndefined();
      expect(result.bars).toBe(16);
    });

    it('returns scale mismatch for andalusian in major', () => {
      const result = getProgressions({ key: 'C', scale: 'major', style: 'andalusian' });
      expect(result.error).toBe('scale mismatch');
    });

    it('returns andalusian in A minor', () => {
      const result = getProgressions({ key: 'A', scale: 'minor', style: 'andalusian' });
      expect(result.error).toBeUndefined();
      expect(result.progression).toEqual(['Am', 'G', 'F', 'E']);
    });

    it('returns anime royalRoad7 with 7ths and optional voicing', () => {
      const result = getProgressions({ key: 'C', scale: 'major', genre: 'anime', style: 'royalRoad7' });
      expect(result.error).toBeUndefined();
      expect(result.progression).toEqual(['Fmaj7', 'G7', 'Em7', 'Am7']);
    });
    it('returns anime ghibli with voicing quartal', () => {
      const result = getProgressions({ key: 'C', scale: 'major', genre: 'anime', style: 'ghibli' });
      expect(result.error).toBeUndefined();
      expect(result.progression).toEqual(['Fmaj7', 'G7', 'Em7', 'Am7']);
      expect(result.voicing).toBe('quartal');
    });
  });

  describe('getProgressionsSimple', () => {
    it('returns minimal shape when successful', () => {
      const result = getProgressionsSimple({ key: 'C', scale: 'major' });
      expect(result.error).toBeUndefined();
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('key', 'C');
      expect(result).toHaveProperty('scale', 'major');
      expect(result).toHaveProperty('bpm');
      expect(result).toHaveProperty('progression');
      expect(result).toHaveProperty('bars');
      expect(result).not.toHaveProperty('chords');
      expect(result).not.toHaveProperty('loop_description');
    });

    it('returns error object when getProgressions fails', () => {
      const result = getProgressionsSimple({});
      expect(result.error).toBeDefined();
    });
  });

  describe('getOptions', () => {
    it('returns keys, scales, moods, genres, styles', () => {
      const opts = getOptions();
      expect(opts.keys).toContain('C');
      expect(opts.keys.length).toBe(17);
      expect(opts.scales).toEqual(['major', 'minor']);
      expect(opts.genres).toContain('pop');
      expect(opts.moods).toBeInstanceOf(Array);
      expect(opts.styles).toBeInstanceOf(Array);
    });
  });
});
