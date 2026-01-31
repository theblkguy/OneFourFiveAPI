import { getProgressions, getProgressionsSimple, getOptions } from './progressionService';

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
      expect('error' in result ? result.error : undefined).toBeUndefined();
      expect('key' in result && result.key).toBe('C');
      expect('scale' in result && result.scale).toBe('major');
      expect('progression' in result && result.progression).toBeInstanceOf(Array);
      expect('progression' in result && result.progression.length).toBeGreaterThan(0);
      expect('bars' in result && result.bars).toBeGreaterThanOrEqual(4);
      expect('chords' in result && result.chords).toBeInstanceOf(Array);
      expect('summary' in result && result.summary).toContain('C');
    });

    it('returns I–V–vi–IV for pop upbeat', () => {
      const result = getProgressions({ key: 'C', scale: 'major', genre: 'pop', style: 'upbeat' });
      expect('error' in result ? result.error : undefined).toBeUndefined();
      expect('progression' in result && result.progression).toEqual(['C', 'G', 'Am', 'F']);
    });

    it('honors duration_seconds and returns duration_seconds', () => {
      const result = getProgressions({ key: 'C', scale: 'major', duration_seconds: 60 });
      expect('error' in result ? result.error : undefined).toBeUndefined();
      expect('duration_seconds' in result && result.duration_seconds).toBeGreaterThanOrEqual(60);
    });

    it('honors bars parameter', () => {
      const result = getProgressions({ key: 'C', scale: 'major', bars: 16 });
      expect('error' in result ? result.error : undefined).toBeUndefined();
      expect('bars' in result && result.bars).toBe(16);
    });

    it('returns scale mismatch for andalusian in major', () => {
      const result = getProgressions({ key: 'C', scale: 'major', style: 'andalusian' });
      expect('error' in result ? result.error : undefined).toBe('scale mismatch');
    });

    it('returns andalusian in A minor', () => {
      const result = getProgressions({ key: 'A', scale: 'minor', style: 'andalusian' });
      expect('error' in result ? result.error : undefined).toBeUndefined();
      expect('progression' in result && result.progression).toEqual(['Am', 'G', 'F', 'E']);
    });

    it('returns anime royalRoad7 with 7ths and optional voicing', () => {
      const result = getProgressions({ key: 'C', scale: 'major', genre: 'anime', style: 'royalRoad7' });
      expect('error' in result ? result.error : undefined).toBeUndefined();
      expect('progression' in result && result.progression).toEqual(['Fmaj7', 'G7', 'Em7', 'Am7']);
    });
    it('returns anime ghibli with voicing quartal', () => {
      const result = getProgressions({ key: 'C', scale: 'major', genre: 'anime', style: 'ghibli' });
      expect('error' in result ? result.error : undefined).toBeUndefined();
      expect('progression' in result && result.progression).toEqual(['Fmaj7', 'G7', 'Em7', 'Am7']);
      expect('voicing' in result && result.voicing).toBe('quartal');
    });
  });

  describe('getProgressionsSimple', () => {
    it('returns minimal shape when successful', () => {
      const result = getProgressionsSimple({ key: 'C', scale: 'major' });
      expect('error' in result ? result.error : undefined).toBeUndefined();
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
      expect('error' in result && result.error).toBeDefined();
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
