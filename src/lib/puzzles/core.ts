/**
 * Pure puzzle assembly, shared by the web server and the mobile app.
 * The caller supplies the word data; this module never imports it, so
 * each entry point decides where the dictionary lives (server-only on
 * the web, embedded in the binary on mobile).
 */
import { buildSignatureIndex } from '$lib/words/signature';
import { generatePuzzle, toWire } from '$lib/game/generate';
import { dayNumberOf, istanbulToday, isValidDateString } from '$lib/game/daily';
import { hashSeed, mulberry32 } from '$lib/game/rng';
import type { WirePuzzle } from '$lib/game/types';

export interface WordData {
	pools: Record<number, string[]>;
	validation: string[];
}

export function createPuzzleSource(wordData: WordData) {
	const pools = wordData.pools;
	const signatureIndex = buildSignatureIndex(wordData.validation);

	/** The playable day range: day 1 up to today (Istanbul). */
	const currentDay = () => dayNumberOf(istanbulToday());

	function puzzleForDate(dateStr: string): WirePuzzle | null {
		if (!isValidDateString(dateStr)) return null;
		const day = dayNumberOf(dateStr);
		if (day < 1 || day > currentDay()) return null; // no future leaks
		return toWire(generatePuzzle(day, pools, signatureIndex));
	}

	/**
	 * Practice puzzle: same structure as a daily, but assembled from random
	 * pool positions. `seed` lets a caller re-create the identical practice
	 * set without it being any real day's puzzle.
	 */
	function practicePuzzle(seed: number): WirePuzzle {
		const rand = mulberry32(hashSeed(`practice:${seed >>> 0}`));
		// Use a huge virtual day so practice slices never collide with real
		// days in any player's lifetime, then randomize via the seed.
		const virtualDay = 1_000_000 + Math.floor(rand() * 8_000_000);
		const puzzle = generatePuzzle(virtualDay, pools, signatureIndex);
		const wire = toWire(puzzle);
		// Mark as practice: the date tells the client it is not a calendar day.
		return { ...wire, day: puzzle.day, date: 'antrenman' };
	}

	return { puzzleForDate, practicePuzzle };
}
