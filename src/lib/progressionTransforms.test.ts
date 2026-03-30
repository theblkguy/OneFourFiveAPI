import {
  applyTransforms,
  orderTransformsWithSeed,
  parseTransformNamesFromQuery,
  PROGRESSION_TRANSFORM_IDS,
} from './progressionTransforms';

describe('applyTransforms', () => {
  it('returns copy with no transforms when names empty', () => {
    const p = ['I', 'V', 'vi', 'IV'];
    const r = applyTransforms(p, [], { scale: 'major' });
    expect(r.pattern).toEqual(['I', 'V', 'vi', 'IV']);
    expect(r.pattern).not.toBe(p);
    expect(r.applied).toEqual([]);
    expect(r.skipped).toEqual([]);
  });

  it('rotate shifts left by 1 by default', () => {
    const r = applyTransforms(['I', 'V', 'vi', 'IV'], ['rotate'], { scale: 'major' });
    expect(r.pattern).toEqual(['V', 'vi', 'IV', 'I']);
    expect(r.applied).toEqual(['rotate']);
  });

  it('rotate respects rotateSteps in context', () => {
    const r = applyTransforms(['I', 'V', 'vi', 'IV'], ['rotate'], { scale: 'major', rotateSteps: 2 });
    expect(r.pattern).toEqual(['vi', 'IV', 'I', 'V']);
  });

  it('rotate normalizes steps modulo length', () => {
    const r = applyTransforms(['a', 'b'], ['rotate'], { scale: 'major', rotateSteps: 5 });
    expect(r.pattern).toEqual(['b', 'a']);
  });

  it('dominant_extensions adds V7 to plain V in major', () => {
    const r = applyTransforms(['I', 'V', 'vi', 'IV'], ['dominant_extensions'], { scale: 'major' });
    expect(r.pattern).toEqual(['I', 'V7', 'vi', 'IV']);
  });

  it('dominant_extensions no-op in minor', () => {
    const r = applyTransforms(['i', 'V', 'i'], ['dominant_extensions'], { scale: 'minor' });
    expect(r.pattern).toEqual(['i', 'V', 'i']);
  });

  it('dominant_extensions leaves existing V7', () => {
    const r = applyTransforms(['I', 'V7', 'I'], ['dominant_extensions'], { scale: 'major' });
    expect(r.pattern).toEqual(['I', 'V7', 'I']);
  });

  it('borrowed_iv replaces IV with iv in major', () => {
    const r = applyTransforms(['I', 'V', 'vi', 'IV'], ['borrowed_iv'], { scale: 'major' });
    expect(r.pattern).toEqual(['I', 'V', 'vi', 'iv']);
  });

  it('borrowed_iv leaves IVmaj7', () => {
    const r = applyTransforms(['IVmaj7', 'I'], ['borrowed_iv'], { scale: 'major' });
    expect(r.pattern).toEqual(['IVmaj7', 'I']);
  });

  it('borrowed_iv no-op in minor', () => {
    const r = applyTransforms(['i', 'iv'], ['borrowed_iv'], { scale: 'minor' });
    expect(r.pattern).toEqual(['i', 'iv']);
  });

  it('applies transforms in order: borrowed_iv then rotate', () => {
    const r = applyTransforms(['I', 'V', 'vi', 'IV'], ['borrowed_iv', 'rotate'], { scale: 'major' });
    expect(r.pattern).toEqual(['V', 'vi', 'iv', 'I']);
    expect(r.applied).toEqual(['borrowed_iv', 'rotate']);
  });

  it('accepts hyphenated alias dominant-extensions', () => {
    const r = applyTransforms(['I', 'V'], ['dominant-extensions'], { scale: 'major' });
    expect(r.pattern).toEqual(['I', 'V7']);
    expect(r.applied).toEqual(['dominant_extensions']);
  });

  it('collects unknown names in skipped', () => {
    const r = applyTransforms(['I', 'V'], ['nope', 'rotate'], { scale: 'major' });
    expect(r.skipped).toEqual(['nope']);
    expect(r.pattern).toEqual(['V', 'I']);
    expect(r.applied).toEqual(['rotate']);
  });

  it('PROGRESSION_TRANSFORM_IDS lists known ids', () => {
    expect(PROGRESSION_TRANSFORM_IDS).toContain('rotate');
    expect(PROGRESSION_TRANSFORM_IDS).toContain('dominant_extensions');
    expect(PROGRESSION_TRANSFORM_IDS).toContain('borrowed_iv');
  });
});

describe('orderTransformsWithSeed', () => {
  it('is deterministic for same seed', () => {
    const a = orderTransformsWithSeed(['rotate', 'borrowed_iv', 'dominant_extensions'], 42);
    const b = orderTransformsWithSeed(['rotate', 'borrowed_iv', 'dominant_extensions'], 42);
    expect(a).toEqual(b);
  });

  it('may differ across seeds', () => {
    const a = orderTransformsWithSeed(['rotate', 'borrowed_iv', 'dominant_extensions'], 1);
    const b = orderTransformsWithSeed(['rotate', 'borrowed_iv', 'dominant_extensions'], 999);
    expect(a.length).toBe(3);
    expect(b.length).toBe(3);
  });
});

describe('parseTransformNamesFromQuery', () => {
  it('parses comma-separated string', () => {
    expect(parseTransformNamesFromQuery('rotate,borrowed_iv')).toEqual(['rotate', 'borrowed_iv']);
  });

  it('parses array of comma-separated strings', () => {
    expect(parseTransformNamesFromQuery(['rotate', 'dominant_extensions'])).toEqual([
      'rotate',
      'dominant_extensions',
    ]);
  });
});
