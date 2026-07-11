import { describe, expect, it } from 'vitest';
import {
	EPOCH_DATE,
	dateOfDay,
	dayNumberOf,
	isValidDateString,
	istanbulToday,
	msUntilNextPuzzle
} from './daily.ts';

describe('day numbering', () => {
	it('epoch date is day 1', () => {
		expect(dayNumberOf(EPOCH_DATE)).toBe(1);
		expect(dateOfDay(1)).toBe(EPOCH_DATE);
	});

	it('roundtrips across month/year boundaries', () => {
		for (const day of [2, 30, 173, 366, 1000]) {
			expect(dayNumberOf(dateOfDay(day))).toBe(day);
		}
	});
});

describe('istanbulToday', () => {
	it('rolls over at 21:00 UTC (midnight TSİ)', () => {
		expect(istanbulToday(new Date('2026-07-12T20:59:59Z'))).toBe('2026-07-12');
		expect(istanbulToday(new Date('2026-07-12T21:00:00Z'))).toBe('2026-07-13');
	});

	it('is stable across a UTC date boundary', () => {
		// 23:30 UTC on the 12th is 02:30 TSİ on the 13th.
		expect(istanbulToday(new Date('2026-07-12T23:30:00Z'))).toBe('2026-07-13');
	});
});

describe('isValidDateString', () => {
	it('accepts real dates, rejects malformed or impossible ones', () => {
		expect(isValidDateString('2026-07-12')).toBe(true);
		expect(isValidDateString('2026-02-30')).toBe(false);
		expect(isValidDateString('12-07-2026')).toBe(false);
		expect(isValidDateString('bugün')).toBe(false);
	});
});

describe('msUntilNextPuzzle', () => {
	it('counts down to Istanbul midnight', () => {
		expect(msUntilNextPuzzle(new Date('2026-07-12T20:59:00Z'))).toBe(60_000);
		expect(msUntilNextPuzzle(new Date('2026-07-12T21:00:00Z'))).toBe(86_400_000);
	});
});
