import { reharmonizeChord, reharmonizeProgression } from './reharmonizeService';

describe('reharmonizeChord', () => {
  it('returns alternatives for G7 in C major including tritone sub', () => {
    const r = reharmonizeChord({ chord: 'G7', key: 'C', scale: 'major' });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.roman).toBe('V');
      const syms = r.alternatives.map((a) => a.symbol);
      expect(syms.some((s) => s === 'C#7' || s === 'Db7')).toBe(true);
    }
  });

  it('returns 400 shape for missing key', () => {
    const r = reharmonizeChord({ chord: 'C', key: '', scale: 'major' });
    expect('error' in r).toBe(true);
  });
});

describe('reharmonizeProgression', () => {
  it('extends triads with extensions_only', () => {
    const r = reharmonizeProgression({
      chords: ['C', 'G'],
      key: 'C',
      scale: 'major',
      strategy: 'extensions_only',
      max_altered_slots: 2,
    });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.progression.length).toBe(2);
      expect(r.slots.filter((s) => s.altered).length).toBeLessThanOrEqual(2);
    }
  });

  it('respects max_altered_slots 0', () => {
    const r = reharmonizeProgression({
      chords: ['C', 'G7'],
      key: 'C',
      scale: 'major',
      strategy: 'light_jazz',
      max_altered_slots: 0,
    });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.slots.every((s) => !s.altered)).toBe(true);
    }
  });
});
