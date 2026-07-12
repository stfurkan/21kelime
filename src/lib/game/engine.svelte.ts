/**
 * Game engine as a Svelte 5 runes class. Owns all round/timer/input state;
 * components render it and forward user intents.
 */
import { normalizeWord, trLower } from '../words/normalize.ts';
import { SECONDS_PER_ROUND, REVEALS_PER_DAY } from './generate.ts';
import type { Puzzle, Round, RoundOutcome, RoundResult } from './types.ts';

export type GamePhase = 'start' | 'playing' | 'between' | 'done';
export type GameMode = 'daily' | 'archive' | 'practice';

const WRONG_CLEAR_MS = 350;
const BETWEEN_SOLVED_MS = 1000;
const BETWEEN_FAILED_MS = 2600;
const TICK_MS = 100;

export interface TileState {
	letter: string;
	/** Consumed by input or by a reveal. */
	used: boolean;
}

export class GameEngine {
	readonly puzzle: Puzzle;
	readonly mode: GameMode;

	phase = $state<GamePhase>('start');
	relax = $state(false);
	roundIndex = $state(0);
	tiles = $state<TileState[]>([]);
	/** Letters currently typed (after the revealed prefix). Parallel array of rack indices. */
	inputTileIndices = $state<number[]>([]);
	revealedCount = $state(0);
	revealsLeft = $state(REVEALS_PER_DAY);
	revealsUsedThisRound = $state(0);
	secondsLeft = $state(SECONDS_PER_ROUND);
	paused = $state(false);
	/** Bumped to retrigger the shake animation on wrong guesses. */
	wrongShake = $state(0);
	results = $state<RoundResult[]>([]);
	lastOutcome = $state<RoundOutcome | null>(null);

	private timerHandle: ReturnType<typeof setInterval> | null = null;
	private betweenHandle: ReturnType<typeof setTimeout> | null = null;
	private wrongHandle: ReturnType<typeof setTimeout> | null = null;
	private tickCount = 0;
	private onFinish: (results: RoundResult[]) => void;
	private onRoundDone: () => void;
	private onTick: (roundIndex: number, secondsLeft: number) => void;

	constructor(
		puzzle: Puzzle,
		mode: GameMode,
		hooks: {
			onFinish?: (results: RoundResult[]) => void;
			onRoundDone?: () => void;
			onTick?: (roundIndex: number, secondsLeft: number) => void;
		} = {}
	) {
		this.puzzle = puzzle;
		this.mode = mode;
		this.onFinish = hooks.onFinish ?? (() => {});
		this.onRoundDone = hooks.onRoundDone ?? (() => {});
		this.onTick = hooks.onTick ?? (() => {});
	}

	get round(): Round {
		return this.puzzle.rounds[this.roundIndex];
	}

	get wordLength(): number {
		return this.round.canonical.length;
	}

	/** The word as currently assembled: revealed prefix + typed letters. */
	get currentWord(): string {
		const prefix = [...this.round.canonical].slice(0, this.revealedCount).join('');
		const typed = this.inputTileIndices.map((i) => this.tiles[i].letter).join('');
		return prefix + typed;
	}

	get score(): number {
		return this.results.filter((r) => r.outcome !== 'failed').length;
	}

	/** Timer to restore for the next round start (refresh mid-round). */
	private resumeSecondsLeft: number | null = null;

	/** Restore a partially played day (refresh mid-game). */
	resume(
		results: RoundResult[],
		revealsLeft: number,
		relax: boolean,
		secondsLeft: number | null = null
	): void {
		this.results = [...results];
		this.revealsLeft = revealsLeft;
		this.relax = relax;
		this.roundIndex = results.length;
		this.resumeSecondsLeft = secondsLeft;
		if (this.roundIndex >= this.puzzle.rounds.length) {
			this.phase = 'done';
		}
	}

	start(relax: boolean): void {
		if (this.phase !== 'start') return;
		this.relax = relax;
		this.beginRound(this.results.length);
	}

	private beginRound(index: number): void {
		this.clearTimers();
		this.roundIndex = index;
		this.tiles = this.round.letters.map((letter) => ({ letter, used: false }));
		this.inputTileIndices = [];
		this.revealedCount = 0;
		this.revealsUsedThisRound = 0;
		// A refresh mid-round must not grant a fresh clock: the interrupted
		// round restarts with exactly the time it had left.
		this.secondsLeft = this.resumeSecondsLeft ?? SECONDS_PER_ROUND;
		this.resumeSecondsLeft = null;
		this.paused = false;
		this.lastOutcome = null;
		this.phase = 'playing';
		if (!this.relax) this.startTimer();
	}

	private startTimer(): void {
		this.timerHandle = setInterval(() => {
			if (this.paused) return;
			this.secondsLeft = Math.max(0, this.secondsLeft - TICK_MS / 1000);
			// Throttled persistence hook so a refresh can restore the clock.
			this.tickCount = (this.tickCount + 1) % 10;
			if (this.tickCount === 0) this.onTick(this.roundIndex, this.secondsLeft);
			if (this.secondsLeft <= 0) this.finishRound('failed');
		}, TICK_MS);
	}

	/** Persist the exact clock right now (used on pagehide). */
	persistClock(): void {
		if (this.phase === 'playing' && !this.relax) {
			this.onTick(this.roundIndex, this.secondsLeft);
		}
	}

	togglePause(): void {
		if (this.phase !== 'playing' || this.relax) return;
		this.paused = !this.paused;
	}

	/**
	 * Relax mode has no timer to end a hopeless round, so the player can
	 * skip it explicitly. Counts as not solved; there is no going back.
	 */
	skip(): void {
		if (this.phase !== 'playing' || !this.relax) return;
		this.finishRound('failed');
	}

	/** Tap a specific rack tile. */
	pickTile(index: number): void {
		if (this.phase !== 'playing' || this.paused) return;
		this.flushPendingWrong();
		const tile = this.tiles[index];
		if (!tile || tile.used) return;
		if (this.currentWord.length >= this.wordLength) return;
		tile.used = true;
		this.inputTileIndices.push(index);
		if (this.currentWord.length === this.wordLength) this.submit();
	}

	/** Type a letter on a physical keyboard: consume the first free tile with it. */
	typeLetter(rawKey: string): void {
		if (this.phase !== 'playing' || this.paused) return;
		const letter = normalizeWord(trLower(rawKey));
		const index = this.tiles.findIndex((t) => !t.used && t.letter === letter);
		if (index !== -1) this.pickTile(index);
	}

	backspace(): void {
		if (this.phase !== 'playing' || this.paused) return;
		this.flushPendingWrong();
		const last = this.inputTileIndices.pop();
		if (last !== undefined) this.tiles[last].used = false;
	}

	/**
	 * If a wrong guess is waiting for its delayed clear, run the clear now so
	 * the very next tap/keystroke acts on an empty word instead of being
	 * swallowed by a full board.
	 */
	private flushPendingWrong(): void {
		if (this.wrongHandle) {
			clearTimeout(this.wrongHandle);
			this.wrongHandle = null;
			while (this.inputTileIndices.length > 0) {
				const last = this.inputTileIndices.pop();
				if (last !== undefined) this.tiles[last].used = false;
			}
		}
	}

	clearInput(): void {
		while (this.inputTileIndices.length > 0) this.backspace();
	}

	shuffleRack(): void {
		if (this.phase !== 'playing' || this.paused) return;
		this.flushPendingWrong();
		// Only shuffle presentation order; used flags travel with their tiles.
		for (let i = this.tiles.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
		}
		// Typed input refers to rack positions, which just moved: clear it
		// and re-consume only the tiles locked by reveals.
		if (this.inputTileIndices.length > 0) {
			for (const t of this.tiles) t.used = false;
			this.inputTileIndices = [];
			this.consumeRevealTiles();
		}
	}

	private consumeRevealTiles(): void {
		const prefix = [...this.round.canonical].slice(0, this.revealedCount);
		for (const letter of prefix) {
			const i = this.tiles.findIndex((t) => !t.used && t.letter === letter);
			if (i !== -1) this.tiles[i].used = true;
		}
	}

	/** Spend one reveal: lock the next letter of the canonical answer. */
	reveal(): void {
		if (this.phase !== 'playing' || this.paused) return;
		this.flushPendingWrong();
		if (this.revealsLeft <= 0) return;
		if (this.revealedCount >= this.wordLength - 1) return; // never auto-complete
		this.revealsLeft -= 1;
		this.revealsUsedThisRound += 1;
		this.revealedCount += 1;
		// Reset typed input and re-derive tile usage from the revealed prefix.
		for (const t of this.tiles) t.used = false;
		this.inputTileIndices = [];
		this.consumeRevealTiles();
		if (this.revealedCount === this.wordLength) this.submit();
	}

	submit(): void {
		if (this.phase !== 'playing') return;
		const word = this.currentWord;
		if (word.length !== this.wordLength) return;
		if (this.round.answers.includes(word)) {
			this.finishRound(this.revealsUsedThisRound > 0 ? 'revealed' : 'solved', word);
		} else {
			this.wrongShake += 1;
			this.wrongHandle = setTimeout(() => this.clearInput(), WRONG_CLEAR_MS);
		}
	}

	private finishRound(outcome: RoundOutcome, word?: string): void {
		this.clearTimers();
		this.lastOutcome = outcome;
		this.results.push({
			outcome,
			word,
			secondsLeft: outcome === 'failed' ? 0 : Math.round(this.secondsLeft),
			revealsUsed: this.revealsUsedThisRound
		});
		this.phase = 'between';
		this.onRoundDone();
		const isLast = this.roundIndex === this.puzzle.rounds.length - 1;
		const delay = outcome === 'failed' ? BETWEEN_FAILED_MS : BETWEEN_SOLVED_MS;
		this.betweenHandle = setTimeout(() => this.advance(), isLast ? delay + 400 : delay);
	}

	/** Move on from the between-rounds screen (auto or via button). */
	advance(): void {
		if (this.phase !== 'between') return;
		this.clearTimers();
		const next = this.roundIndex + 1;
		if (next >= this.puzzle.rounds.length) {
			this.phase = 'done';
			this.onFinish([...this.results]);
		} else {
			this.beginRound(next);
		}
	}

	destroy(): void {
		this.clearTimers();
	}

	private clearTimers(): void {
		if (this.timerHandle) clearInterval(this.timerHandle);
		if (this.betweenHandle) clearTimeout(this.betweenHandle);
		if (this.wrongHandle) clearTimeout(this.wrongHandle);
		this.timerHandle = this.betweenHandle = this.wrongHandle = null;
	}
}
