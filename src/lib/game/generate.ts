/**
 * Deterministic puzzle assembly. The build pipeline emits one seeded-
 * shuffled target pool per word length; day N slices those pools, so the
 * schedule never repeats a word until a pool wraps around.
 */
import { hashSeed, mulberry32, shuffleInPlace } from './rng.ts';
import { signatureOf } from '../words/signature.ts';
import { dateOfDay } from './daily.ts';
import { obfuscate } from './obfuscate.ts';
import type { Puzzle, Round, WirePuzzle } from './types.ts';

/** Length of each round's word, in play order: a difficulty ramp over 21 rounds. */
export const ROUND_PLAN: readonly number[] = [
	4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9
];
export const ROUNDS_PER_DAY = ROUND_PLAN.length;
export const SECONDS_PER_ROUND = 30;
export const REVEALS_PER_DAY = 3;

const COUNT_BY_LEN: ReadonlyMap<number, number> = (() => {
	const m = new Map<number, number>();
	for (const len of ROUND_PLAN) m.set(len, (m.get(len) ?? 0) + 1);
	return m;
})();

/**
 * Scramble a word's letters deterministically, avoiding arrangements that
 * already spell a valid answer (no freebies on screen).
 */
export function scrambleWord(word: string, seedKey: string, forbidden: ReadonlySet<string>): string[] {
	const rand = mulberry32(hashSeed(`21kelime:scramble:${seedKey}`));
	const letters = [...word];
	for (let attempt = 0; attempt < 20; attempt++) {
		shuffleInPlace(letters, rand);
		if (!forbidden.has(letters.join(''))) return letters;
	}
	// Pathological case (every permutation is a word) — extremely unlikely
	// beyond 3 letters; return the last arrangement rather than loop forever.
	return letters;
}

export function generatePuzzle(
	day: number,
	pools: Record<number, string[]>,
	signatureIndex: ReadonlyMap<string, string[]>
): Puzzle {
	// Pick this day's words per length by slicing the precomputed pool order.
	const picked = new Map<number, string[]>();
	for (const [len, count] of COUNT_BY_LEN) {
		const pool = pools[len];
		if (!pool?.length) throw new Error(`empty target pool for length ${len}`);
		const words: string[] = [];
		for (let i = 0; i < count; i++) {
			words.push(pool[((day - 1) * count + i) % pool.length]);
		}
		picked.set(len, words);
	}

	const cursors = new Map<number, number>();
	const rounds: Round[] = ROUND_PLAN.map((len, roundIndex) => {
		const cursor = cursors.get(len) ?? 0;
		cursors.set(len, cursor + 1);
		const canonical = picked.get(len)![cursor];
		// Every dictionary word with the same letters is an accepted answer.
		const answers = signatureIndex.get(signatureOf(canonical)) ?? [canonical];
		const letters = scrambleWord(canonical, `${day}:${roundIndex}:${canonical}`, new Set(answers));
		return { letters, answers, canonical };
	});

	return { day, date: dateOfDay(day), rounds };
}

/** Obfuscate answers for transport; key is derived from day + round index. */
export function toWire(puzzle: Puzzle): WirePuzzle {
	return {
		day: puzzle.day,
		date: puzzle.date,
		rounds: puzzle.rounds.map((r, i) => ({
			letters: r.letters,
			a: r.answers.map((w) => obfuscate(w, `${puzzle.day}:${i}`)),
			c: obfuscate(r.canonical, `${puzzle.day}:${i}:c`)
		}))
	};
}
