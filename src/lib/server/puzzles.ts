/**
 * Server-side puzzle access. The full word data (validation set + target
 * pools) lives only here — clients receive a single day's rounds with
 * obfuscated answers, never the pools or future days.
 */
import wordData from './data/words.json';
import { buildSignatureIndex } from '$lib/words/signature';
import { generatePuzzle, toWire } from '$lib/game/generate';
import { dayNumberOf, istanbulToday, isValidDateString } from '$lib/game/daily';
import { hashSeed, mulberry32 } from '$lib/game/rng';
import type { WirePuzzle } from '$lib/game/types';

const pools = wordData.pools as unknown as Record<number, string[]>;
const validationWords: string[] = wordData.validation;

const signatureIndex = buildSignatureIndex(validationWords);

/** The playable day range: day 1 up to today (Istanbul). */
function currentDay(): number {
	return dayNumberOf(istanbulToday());
}

export function puzzleForDate(dateStr: string): WirePuzzle | null {
	if (!isValidDateString(dateStr)) return null;
	const day = dayNumberOf(dateStr);
	if (day < 1 || day > currentDay()) return null; // no future leaks
	return toWire(generatePuzzle(day, pools, signatureIndex));
}

/**
 * Practice puzzle: same structure as a daily, but assembled from random
 * pool positions. `seed` lets the client re-fetch the identical practice
 * set (e.g. after a reload) without it being any real day's puzzle.
 */
export function practicePuzzle(seed: number): WirePuzzle {
	const rand = mulberry32(hashSeed(`practice:${seed >>> 0}`));
	// Use a huge virtual day so practice slices never collide with real
	// days in any player's lifetime, then randomize via the seed.
	const virtualDay = 1_000_000 + Math.floor(rand() * 8_000_000);
	const puzzle = generatePuzzle(virtualDay, pools, signatureIndex);
	const wire = toWire(puzzle);
	// Mark as practice: day 0 means "not a calendar day" to the client.
	return { ...wire, day: puzzle.day, date: 'antrenman' };
}
