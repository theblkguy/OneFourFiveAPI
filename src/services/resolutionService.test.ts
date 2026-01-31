import { resolveProgressions } from './resolutionService';

describe('resolutionService', () => {
  it('returns error when chords missing', () => {
    const result = resolveProgressions({ key: 'C', scale: 'major' });
    expect('error' in result ? result.error : undefined).toBe('chords required');
  });

  it('returns error when key or scale missing', () => {
    const result = resolveProgressions({ chords: ['C', 'G', 'Am'] });
    expect('error' in result ? result.error : null).toBe('key and scale required');
  });

  it('returns error for invalid key or scale', () => {
    expect(resolveProgressions({ chords: ['C'], key: 'X', scale: 'major' })).toMatchObject({ error: 'invalid key' });
    expect(resolveProgressions({ chords: ['C'], key: 'C', scale: 'dorian' })).toMatchObject({ error: 'invalid scale' });
  });

  it('returns error for chords not in key', () => {
    const result = resolveProgressions({ chords: ['C', 'G', 'Am', 'F#'], key: 'C', scale: 'major' });
    expect('error' in result ? result.error : undefined).toBe('invalid chords');
    expect('invalid_chords' in result ? result.invalid_chords : []).toContain('F#');
  });

  it('resolves C, G, Am in C major to matches', () => {
    const result = resolveProgressions({ chords: ['C', 'G', 'Am'], key: 'C', scale: 'major' });
    expect('error' in result ? result.error : undefined).toBeUndefined();
    expect('input_chords' in result ? result.input_chords : []).toEqual(['C', 'G', 'Am']);
    expect('input_romans' in result ? result.input_romans : []).toContain('I');
    expect('input_romans' in result ? result.input_romans : []).toContain('V');
    expect('input_romans' in result ? result.input_romans : []).toContain('vi');
    expect('key' in result ? result.key : null).toBe('C');
    expect('scale' in result ? result.scale : null).toBe('major');
    expect('matches' in result ? result.matches : []).toBeInstanceOf(Array);
    expect('matches' in result ? result.matches.length : 0).toBeGreaterThan(0);
    const first = 'matches' in result ? result.matches[0] : null;
    expect(first?.progression).toBeInstanceOf(Array);
    expect(first?.roman_pattern).toBeInstanceOf(Array);
    expect(first?.default_bpm).toBeDefined();
  });

  it('filters by genre when provided', () => {
    const result = resolveProgressions({ chords: ['C', 'G', 'Am'], key: 'C', scale: 'major', genre: 'pop' });
    expect('error' in result ? result.error : undefined).toBeUndefined();
    ('matches' in result ? result.matches : []).forEach((m) => expect(m.genre).toBe('pop'));
  });

  it('returns empty matches and message when no template contains all chords', () => {
    const result = resolveProgressions({ chords: ['C', 'Db', 'Eb'], key: 'C', scale: 'major' });
    expect('error' in result ? result.error : undefined).toBeUndefined();
    expect('matches' in result ? result.matches : []).toEqual([]);
    expect('message' in result ? result.message : '').toContain('No templates');
  });
});
