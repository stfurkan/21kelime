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
	it('groups rows by word length with a keycap label and breathing room', () => {
		const text = shareText(5, results('gggggggyyyyyyybbbbbbb'));
		const lines = text.split('\n');
		expect(lines[0]).toBe('21kelime #5 14/21');
		expect(lines[1]).toBe('');
		expect(lines[2]).toBe('4️⃣🟩🟩🟩');
		expect(lines[3]).toBe('5️⃣🟩🟩🟩🟩');
		expect(lines[4]).toBe('6️⃣🟨🟨🟨🟨');
		expect(lines[5]).toBe('7️⃣🟨🟨🟨⬛');
		expect(lines[6]).toBe('8️⃣⬛⬛⬛');
		expect(lines[7]).toBe('9️⃣⬛⬛⬛');
		expect(lines[8]).toBe('');
		expect(lines[9]).toBe('https://21kelime.com');
		expect(lines).toHaveLength(10);
	});

	it('marks relax mode and includes streaks of 2 or more', () => {
		const text = shareText(1, results('ggggggggggggggggggggg'), { relax: true, streak: 5 });
		expect(text).toContain('21/21 (rahat mod)');
		expect(text).toContain('Seri: 5 gün 🔥');
	});

	it('omits the streak line for streaks under 2', () => {
		expect(shareText(1, results('ggggggggggggggggggggg'), { streak: 1 })).not.toContain('Seri');
	});
});

describe('scoreOf', () => {
	it('counts solved and revealed, not failed', () => {
		expect(scoreOf(results('gybgyb'))).toBe(4);
	});
});
