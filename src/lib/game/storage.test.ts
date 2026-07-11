import { describe, expect, it } from 'vitest';
import { EMPTY_STATS, applyGameToStats } from './storage.ts';

describe('applyGameToStats', () => {
	it('starts a streak on first game', () => {
		const s = applyGameToStats({ ...EMPTY_STATS }, '2026-07-12', '2026-07-11', 15, 21);
		expect(s).toMatchObject({
			gamesPlayed: 1,
			roundsSolved: 15,
			roundsPlayed: 21,
			bestScore: 15,
			currentStreak: 1,
			maxStreak: 1,
			lastCountedDate: '2026-07-12'
		});
	});

	it('extends the streak on consecutive days', () => {
		let s = applyGameToStats({ ...EMPTY_STATS }, '2026-07-12', '2026-07-11', 10, 21);
		s = applyGameToStats(s, '2026-07-13', '2026-07-12', 21, 21);
		expect(s.currentStreak).toBe(2);
		expect(s.maxStreak).toBe(2);
		expect(s.bestScore).toBe(21);
	});

	it('resets the streak after a missed day but keeps the max', () => {
		let s = applyGameToStats({ ...EMPTY_STATS }, '2026-07-12', '2026-07-11', 10, 21);
		s = applyGameToStats(s, '2026-07-13', '2026-07-12', 12, 21);
		s = applyGameToStats(s, '2026-07-20', '2026-07-19', 14, 21);
		expect(s.currentStreak).toBe(1);
		expect(s.maxStreak).toBe(2);
		expect(s.gamesPlayed).toBe(3);
	});
});
