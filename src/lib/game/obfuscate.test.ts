import { describe, expect, it } from 'vitest';
import { deobfuscate, obfuscate } from './obfuscate.ts';

describe('obfuscate/deobfuscate', () => {
	it('roundtrips Turkish words', () => {
		for (const word of ['eczane', 'çiğdem', 'ışıltı', 'gökkuşağı', 'sükût']) {
			expect(deobfuscate(obfuscate(word, '5:12'), '5:12')).toBe(word);
		}
	});

	it('does not leak the plaintext', () => {
		const hex = obfuscate('eczane', '1:0');
		expect(hex).toMatch(/^[0-9a-f]+$/);
		expect(hex).not.toContain('eczane');
	});

	it('is key-dependent', () => {
		expect(obfuscate('eczane', '1:0')).not.toBe(obfuscate('eczane', '1:1'));
	});
});
