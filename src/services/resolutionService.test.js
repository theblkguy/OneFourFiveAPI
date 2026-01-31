const { resolveProgressions } = require('./resolutionService');

describe('resolutionService', () => {
  it('returns error when chords missing', () => {
    const result = resolveProgressions({ key: 'C', scale: 'major' });
    expect(result.error).toBe('chords required');
  });

  it('returns error when key or scale missing', () => {
    const result = resolveProgressions({ chords: ['C', 'G', 'Am'] });
    expect(result.error).toBe('key and scale required');
  });

  it('returns error for invalid key or scale', () => {
    expect(resolveProgressions({ chords: ['C'], key: 'X', scale: 'major' })).toMatchObject({ error: 'invalid key' });
    expect(resolveProgressions({ chords: ['C'], key: 'C', scale: 'dorian' })).toMatchObject({ error: 'invalid scale' });
  });

  it('returns error for chords not in key', () => {
    const result = resolveProgressions({ chords: ['C', 'G', 'Am', 'F#'], key: 'C', scale: 'major' });
    expect(result.error).toBe('invalid chords');
    expect(result.invalid_chords).toContain('F#');
  });

  it('resolves C, G, Am in C major to matches', () => {
    const result = resolveProgressions({ chords: ['C', 'G', 'Am'], key: 'C', scale: 'major' });
    expect(result.error).toBeUndefined();
    expect(result.input_chords).toEqual(['C', 'G', 'Am']);
    expect(result.input_romans).toContain('I');
    expect(result.input_romans).toContain('V');
    expect(result.input_romans).toContain('vi');
    expect(result.key).toBe('C');
    expect(result.scale).toBe('major');
    expect(result.matches).toBeInstanceOf(Array);
    expect(result.matches.length).toBeGreaterThan(0);
    const first = result.matches[0];
    expect(first.progression).toBeInstanceOf(Array);
    expect(first.roman_pattern).toBeInstanceOf(Array);
    expect(first.default_bpm).toBeDefined();
  });

  it('filters by genre when provided', () => {
    const result = resolveProgressions({ chords: ['C', 'G', 'Am'], key: 'C', scale: 'major', genre: 'pop' });
    expect(result.error).toBeUndefined();
    result.matches.forEach((m) => expect(m.genre).toBe('pop'));
  });

  it('returns empty matches and message when no template contains all chords', () => {
    // I, bII, bIII in C major — no template has all three
    const result = resolveProgressions({ chords: ['C', 'Db', 'Eb'], key: 'C', scale: 'major' });
    expect(result.error).toBeUndefined();
    expect(result.matches).toEqual([]);
    expect(result.message).toContain('No templates');
  });
});
