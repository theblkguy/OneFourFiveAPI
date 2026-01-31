const {
  getRootIndex,
  getScaleRoots,
  parseRoman,
  romanToChord,
  chordToRoman,
  parseChordSymbol,
  getChordQuality,
  getBaseRoman,
} = require('./musicTheory');

describe('musicTheory', () => {
  describe('getRootIndex', () => {
    it('returns 0 for C', () => {
      expect(getRootIndex('C')).toBe(0);
    });
    it('returns 7 for G', () => {
      expect(getRootIndex('G')).toBe(7);
    });
    it('accepts sharps and flats', () => {
      expect(getRootIndex('C#')).toBe(1);
      expect(getRootIndex('Db')).toBe(1);
      expect(getRootIndex('Bb')).toBe(10);
      expect(getRootIndex('A#')).toBe(10);
    });
    it('returns null for invalid key', () => {
      expect(getRootIndex('H')).toBeNull();
      expect(getRootIndex('')).toBeNull();
      expect(getRootIndex(null)).toBeNull();
    });
  });

  describe('getScaleRoots', () => {
    it('returns major scale for C major', () => {
      const roots = getScaleRoots('C', 'major');
      expect(roots).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    });
    it('returns natural minor for A minor', () => {
      const roots = getScaleRoots('A', 'minor');
      expect(roots).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    });
    it('returns null for invalid key', () => {
      expect(getScaleRoots('X', 'major')).toBeNull();
    });
  });

  describe('parseRoman', () => {
    it('parses diatonic major numerals', () => {
      expect(parseRoman('I')).toMatchObject({ degree: 1, quality: 'major', borrowed: false, baseRoman: 'I' });
      expect(parseRoman('IV')).toMatchObject({ degree: 4, quality: 'major', borrowed: false, baseRoman: 'IV' });
      expect(parseRoman('vi')).toMatchObject({ degree: 6, quality: 'minor', borrowed: false, baseRoman: 'vi' });
    });
    it('parses borrowed chords', () => {
      expect(parseRoman('bVII')).toEqual(expect.objectContaining({ flatDegree: 7, quality: 'major', borrowed: true }));
      expect(parseRoman('iv')).toEqual(expect.objectContaining({ degree: 4, quality: 'minor', borrowed: true }));
    });
    it('returns null for unknown numeral', () => {
      expect(parseRoman('IX')).toBeNull();
    });
    it('parses extended numerals (7ths, 9ths)', () => {
      expect(parseRoman('IVmaj7')).toMatchObject({ degree: 4, quality: 'major', baseRoman: 'IV', extension: 'maj7' });
      expect(parseRoman('V7')).toMatchObject({ degree: 5, quality: 'major', baseRoman: 'V', extension: '7' });
      expect(parseRoman('vi7')).toMatchObject({ degree: 6, quality: 'minor', baseRoman: 'vi', extension: '7' });
      expect(parseRoman('Imaj9')).toMatchObject({ degree: 1, quality: 'major', baseRoman: 'I', extension: 'maj9' });
    });
  });

  describe('getBaseRoman', () => {
    it('returns base roman without extension', () => {
      expect(getBaseRoman('IVmaj7')).toBe('IV');
      expect(getBaseRoman('vi7')).toBe('vi');
      expect(getBaseRoman('I')).toBe('I');
    });
  });

  describe('romanToChord', () => {
    it('converts I–IV–V–I in C major', () => {
      expect(romanToChord('I', 'C', 'major')).toBe('C');
      expect(romanToChord('IV', 'C', 'major')).toBe('F');
      expect(romanToChord('V', 'C', 'major')).toBe('G');
    });
    it('converts vi in C major to Am', () => {
      expect(romanToChord('vi', 'C', 'major')).toBe('Am');
    });
    it('converts borrowed bVII in C major (returns sharp root)', () => {
      expect(romanToChord('bVII', 'C', 'major')).toBe('A#'); // implementation uses ROOTS_SHARP
    });
    it('converts iv in C major to Fm', () => {
      expect(romanToChord('iv', 'C', 'major')).toBe('Fm');
    });
    it('converts Andalusian i–bVII–bVI–V in A minor', () => {
      expect(romanToChord('i', 'A', 'minor')).toBe('Am');
      expect(romanToChord('bVII', 'A', 'minor')).toBe('G');
      expect(romanToChord('bVI', 'A', 'minor')).toBe('F');
      expect(romanToChord('V', 'A', 'minor')).toBe('E');
    });
    it('returns null for invalid key', () => {
      expect(romanToChord('I', 'X', 'major')).toBeNull();
    });
    it('converts extended numerals to 7th/9th symbols', () => {
      expect(romanToChord('IVmaj7', 'C', 'major')).toBe('Fmaj7');
      expect(romanToChord('V7', 'C', 'major')).toBe('G7');
      expect(romanToChord('vi7', 'C', 'major')).toBe('Am7');
      expect(romanToChord('Imaj9', 'C', 'major')).toBe('Cmaj9');
    });
  });

  describe('parseChordSymbol', () => {
    it('parses major chords', () => {
      expect(parseChordSymbol('C')).toEqual({ rootIndex: 0, quality: 'major', rootName: 'C' });
      expect(parseChordSymbol('G')).toEqual({ rootIndex: 7, quality: 'major', rootName: 'G' });
    });
    it('parses minor chords', () => {
      expect(parseChordSymbol('Am')).toEqual({ rootIndex: 9, quality: 'minor', rootName: 'A' });
      expect(parseChordSymbol('F#m')).toEqual({ rootIndex: 6, quality: 'minor', rootName: 'F#' });
    });
    it('parses dim chords', () => {
      expect(parseChordSymbol('Bdim')).toEqual({ rootIndex: 11, quality: 'dim', rootName: 'B' });
    });
    it('returns null for invalid symbol', () => {
      expect(parseChordSymbol('')).toBeNull();
      expect(parseChordSymbol('H')).toBeNull();
    });
    it('parses 7th and 9th chords', () => {
      expect(parseChordSymbol('Cmaj7')).toMatchObject({ rootIndex: 0, quality: 'major', rootName: 'C', extension: 'maj7' });
      expect(parseChordSymbol('G7')).toMatchObject({ rootIndex: 7, quality: 'major', extension: '7' });
      expect(parseChordSymbol('Am7')).toMatchObject({ rootIndex: 9, quality: 'minor', extension: 'm7' });
    });
  });

  describe('chordToRoman', () => {
    it('converts C, F, G in C major to I, IV, V', () => {
      expect(chordToRoman('C', 'C', 'major')).toEqual({ roman: 'I', quality: 'major' });
      expect(chordToRoman('F', 'C', 'major')).toEqual({ roman: 'IV', quality: 'major' });
      expect(chordToRoman('G', 'C', 'major')).toEqual({ roman: 'V', quality: 'major' });
    });
    it('converts Am in C major to vi', () => {
      expect(chordToRoman('Am', 'C', 'major')).toEqual({ roman: 'vi', quality: 'minor' });
    });
    it('converts Bb in C major to bVII', () => {
      expect(chordToRoman('Bb', 'C', 'major')).toEqual({ roman: 'bVII', quality: 'major' });
    });
    it('returns null for chord not in key', () => {
      expect(chordToRoman('F#', 'C', 'major')).toBeNull();
    });
    it('converts extended chords to roman (Cmaj7 -> I)', () => {
      expect(chordToRoman('Cmaj7', 'C', 'major')).toMatchObject({ roman: 'I', quality: 'major', extension: 'maj7' });
      expect(chordToRoman('G7', 'C', 'major')).toMatchObject({ roman: 'V', quality: 'major', extension: '7' });
    });
  });

  describe('getChordQuality', () => {
    it('returns quality for roman numeral', () => {
      expect(getChordQuality('I')).toBe('major');
      expect(getChordQuality('vi')).toBe('minor');
      expect(getChordQuality('vii')).toBe('dim');
    });
  });
});
