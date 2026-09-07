/**
 * Client-side puzzle access. The web build calls the API so the
 * dictionary stays on the server; the mobile build (__MOBILE__, set by
 * Vite define) computes puzzles on the device from the embedded word
 * data and works fully offline. The mobile branch is dead code in web
 * builds, so the dynamic imports below never enter the web client graph.
 */
import { dayNumberOf, istanbulToday } from '$lib/game/daily';
import { COUNT_BY_LEN } from '$lib/game/generate';
import type { WirePuzzle } from '$lib/game/types';
import type { createPuzzleSource } from './core';

type PuzzleSource = ReturnType<typeof createPuzzleSource> & {
	dataVersion: number;
	pools: Record<number, string[]>;
};
let localSource: Promise<PuzzleSource> | null = null;

function getLocalSource(): Promise<PuzzleSource> {
	localSource ??= Promise.all([import('./core'), import('./data/words.json')]).then(
		([core, data]) => ({
			...core.createPuzzleSource(data.default as never),
			dataVersion: (data.default as { version?: number }).version ?? 1,
			pools: (data.default as { pools: Record<number, string[]> }).pools
		})
	);
	return localSource;
}

/**
 * True while this day still falls inside the first pass of every local pool.
 *
 * Pools only ever grow at the end -- scripts/build-words.ts refuses to build
 * otherwise -- so while every index a day needs is below the local pool
 * length, an older copy of the data picks exactly the words a newer, longer
 * one would. Divergence begins only where an old pool wraps and starts
 * repeating, while the server has fresh words to hand out.
 */
function withinFirstPass(day: number, pools: Record<number, string[]>): boolean {
	for (const [len, count] of COUNT_BY_LEN) {
		const pool = pools[len];
		if (!pool?.length) return false;
		// Highest pool index this day reads for this word length.
		if ((day - 1) * count + count - 1 >= pool.length) return false;
	}
	return true;
}

/**
 * The app computes puzzles from its embedded word data. If the site has
 * newer word data (a rare, deliberate event), same-day players on older
 * app versions could see different words, so when online we compare a tiny
 * static version file (free: it never invokes the Worker) and prefer the
 * server's puzzle. Offline always computes locally.
 *
 * A version mismatch alone is not enough to give up the local copy though:
 * appended words change nothing until a pool wraps, so withinFirstPass
 * keeps an app that is one data release behind computing offline, for
 * free, rather than asking the server for months about a difference that
 * does not exist yet.
 */
const SITE = 'https://21kelime.com';
let remoteVersion: Promise<number | null> | null = null;

function getRemoteVersion(): Promise<number | null> {
	remoteVersion ??= fetch(`${SITE}/data-version.json`, { signal: AbortSignal.timeout(2500) })
		.then((res) => (res.ok ? res.json() : null))
		.then((body) => (body as { version: number } | null)?.version ?? null)
		.catch(() => null);
	return remoteVersion;
}

type Fetcher = typeof globalThis.fetch;

/** Daily puzzle for a date, or for 'today' resolved in Istanbul time. */
export async function loadDaily(fetch: Fetcher, date: string): Promise<WirePuzzle | null> {
	if (__MOBILE__) {
		const resolved = date === 'today' ? istanbulToday() : date;
		const source = await getLocalSource();
		const remote = await getRemoteVersion();
		if (
			remote !== null &&
			remote !== source.dataVersion &&
			!withinFirstPass(dayNumberOf(resolved), source.pools)
		) {
			try {
				const res = await fetch(`${SITE}/api/puzzle/${resolved}`, {
					signal: AbortSignal.timeout(5000)
				});
				if (res.ok) return (await res.json()) as WirePuzzle;
			} catch {
				// Server unreachable mid-flight: local data is the best we have.
			}
		}
		return source.puzzleForDate(resolved);
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
