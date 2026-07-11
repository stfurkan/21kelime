import { describe, expect, it } from 'vitest';
import wordData from '../server/data/words.json';
import { buildSignatureIndex, signatureOf } from '../words/signature.ts';
import { ROUND_PLAN, ROUNDS_PER_DAY, generatePuzzle, toWire } from './generate.ts';
import { fromWire } from './wire.ts';

const pools = wordData.pools as unknown as Record<number, string[]>;
const index = buildSignatureIndex(wordData.validation);

describe('generatePuzzle', () => {
	it('is deterministic', () => {
		const a = generatePuzzle(7, pools, index);
		const b = generatePuzzle(7, pools, index);
		expect(JSON.stringify(a)).toBe(JSON.stringify(b));
	});

	it('follows the 21-round length ramp', () => {
		const puzzle = generatePuzzle(3, pools, index);
		expect(puzzle.rounds).toHaveLength(ROUNDS_PER_DAY);
		puzzle.rounds.forEach((round, i) => {
			expect(round.canonical.length).toBe(ROUND_PLAN[i]);
			expect(round.letters).toHaveLength(ROUND_PLAN[i]);
		});
	});

	it('letters are an anagram of the canonical word, and never spell an answer', () => {
		for (const day of [1, 50, 200]) {
			for (const round of generatePuzzle(day, pools, index).rounds) {
				expect(signatureOf(round.letters.join(''))).toBe(signatureOf(round.canonical));
				expect(round.answers).not.toContain(round.letters.join(''));
				expect(round.answers).toContain(round.canonical);
			}
		}
	});

	it('accepts every dictionary anagram as an answer', () => {
		for (const round of generatePuzzle(1, pools, index).rounds) {
			const expected = index.get(signatureOf(round.canonical));
			expect(round.answers).toEqual(expected);
		}
	});

	it('never repeats a word on consecutive days', () => {
		const seen = new Set(generatePuzzle(10, pools, index).rounds.map((r) => r.canonical));
		for (const round of generatePuzzle(11, pools, index).rounds) {
			expect(seen.has(round.canonical)).toBe(false);
		}
	});
});

describe('wire format', () => {
	it('roundtrips through obfuscation', () => {
		const puzzle = generatePuzzle(42, pools, index);
		expect(fromWire(toWire(puzzle))).toEqual(puzzle);
	});

	it('does not contain answers in plaintext', () => {
		const puzzle = generatePuzzle(42, pools, index);
		const raw = JSON.stringify(toWire(puzzle));
		for (const round of puzzle.rounds) {
			expect(raw).not.toContain(`"${round.canonical}"`);
		}
	});
});
