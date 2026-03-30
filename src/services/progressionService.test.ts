import { getProgressions, getSong } from './progressionService';

describe('getProgressions', () => {
  it('returns emotional pop with distinct pattern from upbeat', () => {
    const em = getProgressions({
      key: 'C',
      scale: 'major',
      genre: 'pop',
      style: 'emotional',
      mood: 'upbeat',
    });
    const up = getProgressions({
      key: 'C',
      scale: 'major',
      genre: 'pop',
      style: 'upbeat',
      mood: 'upbeat',
    });
    expect('error' in em).toBe(false);
    expect('error' in up).toBe(false);
    if (!('error' in em) && !('error' in up)) {
      expect(em.progression.join(',')).not.toBe(up.progression.join(','));
    }
  });

  it('returns legacy warning when legacy=true', () => {
    const r = getProgressions({
      key: 'C',
      scale: 'major',
      genre: 'pop',
      style: 'upbeat',
      mood: 'calm',
      legacy: true,
    });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.warnings?.some((w) => w.code === 'legacy_match')).toBe(true);
    }
  });

  it('includes roman_pattern and applies transforms', () => {
    const r = getProgressions({
      key: 'C',
      scale: 'major',
      genre: 'pop',
      style: 'upbeat',
      mood: 'upbeat',
      transforms: ['dominant_extensions', 'borrowed_iv'],
    });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.roman_pattern).toEqual(['I', 'V7', 'vi', 'iv']);
      expect(r.roman_pattern_template).toEqual(['I', 'V', 'vi', 'IV']);
      expect(r.transforms_applied).toEqual(['dominant_extensions', 'borrowed_iv']);
      expect(r.progression.some((c) => c.includes('m') || c.includes('7'))).toBe(true);
    }
  });

  it('same seed yields same transform order for multiple transforms', () => {
    const a = getProgressions({
      key: 'C',
      scale: 'major',
      genre: 'pop',
      style: 'upbeat',
      mood: 'upbeat',
      transforms: ['rotate', 'borrowed_iv'],
      seed: 12345,
    });
    const b = getProgressions({
      key: 'C',
      scale: 'major',
      genre: 'pop',
      style: 'upbeat',
      mood: 'upbeat',
      transforms: ['rotate', 'borrowed_iv'],
      seed: 12345,
    });
    expect('error' in a && 'error' in b).toBe(false);
    if (!('error' in a) && !('error' in b)) {
      expect(a.roman_pattern.join(',')).toBe(b.roman_pattern.join(','));
    }
  });

  it('filters by family when provided', () => {
    const r = getProgressions({
      key: 'C',
      scale: 'major',
      genre: 'anime',
      mood: 'upbeat',
      style: 'royalRoad',
      family: 'royal_road',
    });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.roman_pattern[0]).toBe('IV');
      expect(r.progression[0]).toBe('F');
    }
  });
});

describe('getSong', () => {
  it('composes multiple sections', () => {
    const r = getSong({
      key: 'C',
      scale: 'major',
      sections: [
        { label: 'A', genre: 'pop', style: 'upbeat', mood: 'upbeat', bars: 8 },
        { label: 'B', genre: 'pop', style: 'ballad', mood: 'calm', bars: 8 },
      ],
    });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.sections).toHaveLength(2);
      expect(r.full_progression.length).toBeGreaterThan(4);
      expect(r.total_bars).toBe(16);
    }
  });
});
