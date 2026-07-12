import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameEngine } from './engine.svelte';
import type { Puzzle } from './types.ts';

const puzzle: Puzzle = {
	day: 1,
	date: '2026-07-12',
	rounds: [
		{ letters: ['t', 'e', 'v', 'e'], answers: ['evet'], canonical: 'evet' },
		{ letters: ['z', 'e', 'n', 'a', 'c', 'e'], answers: ['eczane', 'cenaze'], canonical: 'eczane' }
	]
};

function freshEngine() {
	return new GameEngine(structuredClone(puzzle), 'daily');
}

function typeWord(engine: GameEngine, word: string) {
	for (const ch of word) engine.typeLetter(ch);
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('GameEngine', () => {
	it('solves a round by typing and auto-advances', () => {
		const engine = freshEngine();
		engine.start(false);
		expect(engine.phase).toBe('playing');
		typeWord(engine, 'evet');
		expect(engine.phase).toBe('between');
		expect(engine.results[0].outcome).toBe('solved');
		vi.advanceTimersByTime(1500);
		expect(engine.phase).toBe('playing');
		expect(engine.roundIndex).toBe(1);
	});

	it('accepts any dictionary anagram, not just the canonical word', () => {
		const engine = freshEngine();
		engine.start(false);
		typeWord(engine, 'evet');
		engine.advance();
		typeWord(engine, 'cenaze');
		expect(engine.results[1].outcome).toBe('solved');
		expect(engine.results[1].word).toBe('cenaze');
	});

	it('shakes and clears on a wrong full word', () => {
		const engine = freshEngine();
		engine.start(false);
		typeWord(engine, 'teve');
		expect(engine.phase).toBe('playing');
		expect(engine.wrongShake).toBe(1);
		vi.advanceTimersByTime(500);
		expect(engine.currentWord).toBe('');
	});

	it('fails the round when the timer runs out', () => {
		const engine = freshEngine();
		engine.start(false);
		vi.advanceTimersByTime(30_000);
		expect(engine.phase).toBe('between');
		expect(engine.results[0].outcome).toBe('failed');
		expect(engine.results[0].secondsLeft).toBe(0);
	});

	it('does not tick in relax mode', () => {
		const engine = freshEngine();
		engine.start(true);
		vi.advanceTimersByTime(120_000);
		expect(engine.phase).toBe('playing');
	});

	it('relax mode can skip a round; it counts as failed and moves on', () => {
		const engine = freshEngine();
		engine.start(true);
		engine.skip();
		expect(engine.phase).toBe('between');
		expect(engine.results[0].outcome).toBe('failed');
		engine.advance();
		expect(engine.roundIndex).toBe(1);
	});

	it('skip is a no-op in timed mode', () => {
		const engine = freshEngine();
		engine.start(false);
		engine.skip();
		expect(engine.phase).toBe('playing');
		expect(engine.results).toHaveLength(0);
	});

	it('pause stops the clock', () => {
		const engine = freshEngine();
		engine.start(false);
		engine.togglePause();
		vi.advanceTimersByTime(60_000);
		expect(engine.phase).toBe('playing');
		engine.togglePause();
		vi.advanceTimersByTime(30_000);
		expect(engine.results[0].outcome).toBe('failed');
	});

	it('reveal locks canonical letters, marks the round as revealed, and is capped', () => {
		const engine = freshEngine();
		engine.start(false);
		engine.reveal();
		expect(engine.revealsLeft).toBe(2);
		expect(engine.revealedCount).toBe(1);
		expect(engine.currentWord).toBe('e');
		// Cap: with a 4-letter word, at most 3 letters can ever be revealed.
		engine.reveal();
		engine.reveal();
		expect(engine.revealedCount).toBe(3);
		engine.reveal();
		expect(engine.revealedCount).toBe(3);
		expect(engine.revealsLeft).toBe(0);
		// Finish with the last tile.
		engine.typeLetter('t');
		expect(engine.results[0].outcome).toBe('revealed');
	});

	it('finishes the game and reports results', () => {
		const finished = vi.fn();
		const engine = new GameEngine(structuredClone(puzzle), 'daily', { onFinish: finished });
		engine.start(false);
		typeWord(engine, 'evet');
		engine.advance();
		vi.advanceTimersByTime(30_000); // fail round 2
		engine.advance();
		expect(engine.phase).toBe('done');
		expect(engine.score).toBe(1);
		expect(finished).toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ outcome: 'failed' })])
		);
	});

	it('resumes mid-game from saved results', () => {
		const engine = freshEngine();
		engine.resume([{ outcome: 'solved', word: 'evet', secondsLeft: 12, revealsUsed: 0 }], 2, false);
		engine.start(false);
		expect(engine.roundIndex).toBe(1);
		expect(engine.revealsLeft).toBe(2);
	});

	it('resumes an interrupted round with the remaining clock, not a fresh 30s', () => {
		const engine = freshEngine();
		engine.resume([], 3, false, 7.5);
		engine.start(false);
		expect(engine.secondsLeft).toBe(7.5);
		vi.advanceTimersByTime(7600);
		expect(engine.results[0].outcome).toBe('failed');
	});

	it('reports the clock periodically so a refresh can restore it', () => {
		const ticks: number[] = [];
		const engine = new GameEngine(structuredClone(puzzle), 'daily', {
			onTick: (_, secondsLeft) => ticks.push(secondsLeft)
		});
		engine.start(false);
		vi.advanceTimersByTime(3000);
		expect(ticks).toHaveLength(3);
		expect(ticks[0]).toBeCloseTo(29, 0);
	});
});
