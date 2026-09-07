/** localStorage persistence. All access is guarded for SSR. */
import { browser } from '$app/environment';
import { dayNumberOf } from './daily.ts';
import type { RoundResult } from './types.ts';

const PREFIX = '21kelime';

export interface DayState {
	/** Results for completed rounds so far. */
	results: RoundResult[];
	/** Reveals remaining for this day. */
	revealsLeft: number;
	/** Whether relax (untimed) mode was chosen. */
	relax: boolean;
	/** All 21 rounds finished. */
	done: boolean;
	/** Stats were already updated for this day (guards double counting). */
	statsCounted: boolean;
	/**
	 * Clock of a round that was interrupted mid-play (refresh, closed tab).
	 * Restored on resume so reloading never grants a fresh 30 seconds.
	 */
	pendingRound?: { index: number; secondsLeft: number };
}

export interface Stats {
	gamesPlayed: number;
	roundsSolved: number;
	roundsPlayed: number;
	bestScore: number;
	currentStreak: number;
	maxStreak: number;
	/** Last daily date (YYYY-MM-DD) counted into the streak. */
	lastCountedDate: string | null;
}

export const EMPTY_STATS: Stats = {
	gamesPlayed: 0,
	roundsSolved: 0,
	roundsPlayed: 0,
	bestScore: 0,
	currentStreak: 0,
	maxStreak: 0,
	lastCountedDate: null
};

function read<T>(key: string): T | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

function write(key: string, value: unknown): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage full or blocked — the game still works, it just won't persist.
	}
}

export function loadDayState(date: string): DayState | null {
	const state = read<DayState>(`${PREFIX}:day:${date}`);
	// A corrupted or legacy-shaped entry must degrade to "no save", never
	// crash the app at load.
	return state && Array.isArray(state.results) ? state : null;
}

export function saveDayState(date: string, state: DayState): void {
	write(`${PREFIX}:day:${date}`, state);
}

export function loadStats(): Stats {
	return read<Stats>(`${PREFIX}:stats`) ?? { ...EMPTY_STATS };
}

/**
 * Drop day states older than `keepDays` so storage never grows unbounded
 * over years of play. Stats, streaks and the theme choice are untouched;
 * only the per-day replay/"played" records beyond the window are lost.
 */
export function pruneOldDayStates(keepDays = 60): void {
	if (!browser) return;
	try {
		// YYYY-MM-DD compares correctly as a string.
		const cutoff = new Date(Date.now() - keepDays * 86_400_000).toISOString().slice(0, 10);
		const prefix = `${PREFIX}:day:`;
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key?.startsWith(prefix) && key.slice(prefix.length) < cutoff) {
				localStorage.removeItem(key);
			}
		}
	} catch {
		// Storage blocked: nothing to prune.
	}
}

export function saveStats(stats: Stats): void {
	write(`${PREFIX}:stats`, stats);
}

// ---- Played-day history ----

/**
 * Every finished day as `day number -> score`, and nothing else.
 *
 * Day states hold all 21 rounds and are pruned after 60 days so storage
 * cannot grow without bound (a finished day is about 1.6 KB, so a decade
 * of them would be 5.6 MB and blow the quota). Losing them also lost the
 * archive's record that the day was ever played, which read as data loss
 * to anyone who had been playing since day one. This costs roughly six
 * bytes per day -- a decade fits in 20 KB -- so it is never pruned.
 */
const HISTORY_KEY = `${PREFIX}:history`;

/** Keys are day numbers as strings; values are that day's score. */
export type History = Record<string, number>;

export function loadHistory(): History {
	const raw = read<History>(HISTORY_KEY);
	return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

export function recordHistory(day: number, score: number): void {
	const history = loadHistory();
	if (history[day] === score) return;
	history[day] = score;
	write(HISTORY_KEY, history);
}

/**
 * Backfill history from day states that predate this record, so players
 * who have been here since day one keep their earliest results. Must run
 * before pruning, which is what would otherwise drop them.
 */
export function seedHistoryFromDayStates(): void {
	if (!browser) return;
	try {
		const history = loadHistory();
		const prefix = `${PREFIX}:day:`;
		let changed = false;
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key?.startsWith(prefix)) continue;
			const state = loadDayState(key.slice(prefix.length));
			if (!state?.done) continue;
			const day = dayNumberOf(key.slice(prefix.length));
			if (history[day] !== undefined) continue;
			history[day] = state.results.filter((r) => r.outcome !== 'failed').length;
			changed = true;
		}
		if (changed) write(HISTORY_KEY, history);
	} catch {
		// Storage blocked: nothing to seed.
	}
}

/** Pure streak/stats update, exported for tests. */
export function applyGameToStats(
	stats: Stats,
	date: string,
	previousDate: string,
	score: number,
	roundCount: number
): Stats {
	const next: Stats = { ...stats };
	next.gamesPlayed += 1;
	next.roundsSolved += score;
	next.roundsPlayed += roundCount;
	next.bestScore = Math.max(next.bestScore, score);
	next.currentStreak = stats.lastCountedDate === previousDate ? stats.currentStreak + 1 : 1;
	next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
	next.lastCountedDate = date;
	return next;
}
