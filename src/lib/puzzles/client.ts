/**
 * Client-side puzzle access. The web build calls the API so the
 * dictionary stays on the server; the mobile build (__MOBILE__, set by
 * Vite define) computes puzzles on the device from the embedded word
 * data and works fully offline. The mobile branch is dead code in web
 * builds, so the dynamic imports below never enter the web client graph.
 */
import { istanbulToday } from '$lib/game/daily';
import type { WirePuzzle } from '$lib/game/types';
import type { createPuzzleSource } from './core';

type PuzzleSource = ReturnType<typeof createPuzzleSource>;
let localSource: Promise<PuzzleSource> | null = null;

function getLocalSource(): Promise<PuzzleSource> {
	localSource ??= Promise.all([import('./core'), import('./data/words.json')]).then(
		([core, data]) => core.createPuzzleSource(data.default as never)
	);
	return localSource;
}

type Fetcher = typeof globalThis.fetch;

/** Daily puzzle for a date, or for 'today' resolved in Istanbul time. */
export async function loadDaily(fetch: Fetcher, date: string): Promise<WirePuzzle | null> {
	if (__MOBILE__) {
		const source = await getLocalSource();
		return source.puzzleForDate(date === 'today' ? istanbulToday() : date);
	}
	const res = await fetch(`/api/puzzle/${date}`);
	if (!res.ok) return null;
	return (await res.json()) as WirePuzzle;
}

/** Fresh practice puzzle; each call produces a new random set. */
export async function loadPractice(fetch: Fetcher): Promise<WirePuzzle | null> {
	if (__MOBILE__) {
		const source = await getLocalSource();
		return source.practicePuzzle(Math.floor(Math.random() * 2 ** 31));
	}
	const res = await fetch('/api/practice');
	if (!res.ok) return null;
	return (await res.json()) as WirePuzzle;
}
