import { resolveTemplate, getStyleMoodPairs } from './templates';

describe('resolveTemplate', () => {
  it('matches style and mood together (strict)', () => {
    const r = resolveTemplate('pop', { style: 'calm', mood: 'calm', legacy: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.template.style).toBe('calm');
  });

  it('fails when style and mood do not match any row', () => {
    const r = resolveTemplate('pop', { style: 'calm', mood: 'upbeat', legacy: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('style_mood_mismatch');
  });

  it('requires variation or style when mood-only is ambiguous (jazz neutral)', () => {
    const r = resolveTemplate('jazz', { mood: 'neutral', legacy: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('ambiguous_mood');
  });

  it('selects by variation index when mood-only is ambiguous', () => {
    const r0 = resolveTemplate('jazz', { mood: 'neutral', variation: 0, legacy: false });
    const r1 = resolveTemplate('jazz', { mood: 'neutral', variation: 1, legacy: false });
    expect(r0.ok && r1.ok).toBe(true);
    if (r0.ok && r1.ok) expect(r0.template.style).not.toBe(r1.template.style);
  });

  it('legacy mode matches old style-or-mood behavior', () => {
    const r = resolveTemplate('pop', { style: 'upbeat', mood: 'wrong', legacy: true });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.legacy).toBe(true);
  });

  it('getStyleMoodPairs lists pairs for a genre', () => {
    const pairs = getStyleMoodPairs('pop');
    expect(pairs.some((p) => p.style === 'calm' && p.mood === 'calm')).toBe(true);
  });

  it('filters by family', () => {
    const r = resolveTemplate('pop', { style: 'upbeat', mood: 'upbeat', legacy: false, family: 'four_chord' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.template.family).toBe('four_chord');

    const bad = resolveTemplate('pop', { style: 'upbeat', mood: 'upbeat', legacy: false, family: 'royal_road' });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBe('no_template_found');
  });
});
