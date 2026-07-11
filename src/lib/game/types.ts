/** A single round: find a word using ALL the given letters. */
export interface Round {
	/** Scrambled letters shown to the player. */
	letters: string[];
	/** Every dictionary word that is a full anagram of the letters. */
	answers: string[];
	/** The curated target word (used for letter reveals). */
	canonical: string;
}

export interface Puzzle {
	/** 1-based day number since EPOCH_DATE. */
	day: number;
	/** Istanbul-local date, YYYY-MM-DD. */
	date: string;
	rounds: Round[];
}

/** Wire format: answers are obfuscated to prevent casual devtools spoilers. */
export interface WirePuzzle {
	day: number;
	date: string;
	rounds: { letters: string[]; a: string[]; c: string }[];
}

export type RoundOutcome = 'solved' | 'revealed' | 'failed';

export interface RoundResult {
	outcome: RoundOutcome;
	/** The accepted word, if solved. */
	word?: string;
	/** Seconds left on the clock when solved (0 for failed). */
	secondsLeft: number;
	/** Number of reveal hints used in this round. */
	revealsUsed: number;
}
