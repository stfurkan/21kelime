import { describe, expect, it } from 'vitest';
import { isPlayableWord, normalizeWord, trLower, trUpper } from './normalize.ts';

describe('Turkish case mapping', () => {
	it('uppercases i -> İ and ı -> I', () => {
		expect(trUpper('istanbul')).toBe('İSTANBUL');
		expect(trUpper('ılık')).toBe('ILIK');
		expect(trUpper('diri')).toBe('DİRİ');
	});

	it('lowercases İ -> i and I -> ı', () => {
		expect(trLower('İZMİR')).toBe('izmir');
		expect(trLower('KALIN')).toBe('kalın');
	});
});

describe('normalizeWord', () => {
	it('folds circumflex vowels', () => {
		expect(normalizeWord('kâr')).toBe('kar');
		expect(normalizeWord('askerî')).toBe('askeri');
		expect(normalizeWord('sükût')).toBe('sükut');
	});

	it('trims and lowercases with tr-TR', () => {
		expect(normalizeWord('  EVİM ')).toBe('evim');
		expect(normalizeWord('IŞIK')).toBe('ışık');
	});
});

describe('isPlayableWord', () => {
	it('accepts pure Turkish-alphabet words in range', () => {
		expect(isPlayableWord('çiğdem')).toBe(true);
		expect(isPlayableWord('göz')).toBe(true);
	});

	it('rejects q/w/x, punctuation, spaces and out-of-range lengths', () => {
		expect(isPlayableWord('taxi')).toBe(false);
		expect(isPlayableWord('web')).toBe(false);
		expect(isPlayableWord('iki kelime')).toBe(false);
		expect(isPlayableWord('ay')).toBe(false); // too short
		expect(isPlayableWord('onbirharflik', 3, 10)).toBe(false); // too long
	});
});
