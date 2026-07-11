import { describe, expect, it } from 'vitest';
import { buildSignatureIndex, signatureOf } from './signature.ts';

describe('signatureOf', () => {
	it('is identical for full anagrams', () => {
		expect(signatureOf('eczane')).toBe(signatureOf('cenaze'));
		expect(signatureOf('hayır')).toBe(signatureOf('hıyar'));
	});

	it('distinguishes dotted/dotless i', () => {
		expect(signatureOf('sıra')).not.toBe(signatureOf('sira'));
	});
});

describe('buildSignatureIndex', () => {
	it('groups anagrams under one signature', () => {
		const index = buildSignatureIndex(['eczane', 'cenaze', 'kitap']);
		expect(index.get(signatureOf('cenaze'))).toEqual(['eczane', 'cenaze']);
		expect(index.get(signatureOf('kitap'))).toEqual(['kitap']);
	});
});
