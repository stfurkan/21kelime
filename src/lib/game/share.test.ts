import { describe, expect, it } from 'vitest';
import type { RoundResult } from './types.ts';
import { scoreOf, shareText } from './share.ts';

function results(outcomes: string): RoundResult[] {
	return [...outcomes].map((c) => ({
		outcome: c === 'g' ? 'solved' : c === 'y' ? 'revealed' : 'failed',
		secondsLeft: 0,
		revealsUsed: 0
	}));
}

describe('shareText', () => {
	it('renders 3 rows of 7 with the right emoji', () => {
		const text = shareText(5, results('gggggggyyyyyyybbbbbbb'), false);
		const lines = text.split('\n');
		expect(lines[0]).toBe('21kelime #5 — 14/21');
		expect(lines[1]).toBe('🟩🟩🟩🟩🟩🟩🟩');
		expect(lines[2]).toBe('🟨🟨🟨🟨🟨🟨🟨');
		expect(lines[3]).toBe('⬛⬛⬛⬛⬛⬛⬛');
		expect(lines[4]).toBe('https://21kelime.com');
	});

	it('marks relax mode', () => {
		expect(shareText(1, results('ggggggggggggggggggggg'), true)).toContain('21/21 🌙');
	});
});

describe('scoreOf', () => {
	it('counts solved and revealed, not failed', () => {
		expect(scoreOf(results('gybgyb'))).toBe(4);
	});
});
