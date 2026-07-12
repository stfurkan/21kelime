/** localStorage persistence. All access is guarded for SSR. */
import { browser } from '$app/environment';
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
	return read<DayState>(`${PREFIX}:day:${date}`);
}

export function saveDayState(date: string, state: DayState): void {
	write(`${PREFIX}:day:${date}`, state);
}

export function loadStats(): Stats {
	return read<Stats>(`${PREFIX}:stats`) ?? { ...EMPTY_STATS };
}

export function saveStats(stats: Stats): void {
	write(`${PREFIX}:stats`, stats);
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
