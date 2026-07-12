/**
 * Daily puzzle scheduling. The puzzle day rolls over at midnight
 * Europe/Istanbul (UTC+3, no DST), for every player worldwide.
 */

/** Day 1 of 21kelime. */
export const EPOCH_DATE = '2026-07-13';
export const TIME_ZONE = 'Europe/Istanbul';

const DAY_MS = 86_400_000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function utcMidnight(dateStr: string): number {
	const [y, m, d] = dateStr.split('-').map(Number);
	return Date.UTC(y, m - 1, d);
}

/** Current date in Istanbul as YYYY-MM-DD. */
export function istanbulToday(now: Date = new Date()): string {
	// en-CA locale formats as YYYY-MM-DD.
	return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);
}

export function isValidDateString(s: string): boolean {
	if (!DATE_RE.test(s)) return false;
	const [y, m, d] = s.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** 1-based day number for a YYYY-MM-DD date (EPOCH_DATE -> 1). */
export function dayNumberOf(dateStr: string): number {
	return Math.round((utcMidnight(dateStr) - utcMidnight(EPOCH_DATE)) / DAY_MS) + 1;
}

/** Inverse of dayNumberOf. */
export function dateOfDay(day: number): string {
	return new Date(utcMidnight(EPOCH_DATE) + (day - 1) * DAY_MS).toISOString().slice(0, 10);
}

/** Milliseconds until the next Istanbul midnight (for countdown UI). */
export function msUntilNextPuzzle(now: Date = new Date()): number {
	// Istanbul is fixed UTC+3 (Turkey abolished DST in 2016).
	const utc3 = now.getTime() + 3 * 3_600_000;
	const sinceMidnight = utc3 % DAY_MS;
	return DAY_MS - sinceMidnight;
}
