/**
 * Shared word-source loading for the data pipeline.
 *
 * The pool builder and the TDK verifier must agree exactly on which words
 * are candidates, or the verifier would check a different set than the one
 * that ships. So the candidate rules live here, once.
 *
 * Inputs (data/raw/, see scripts/fetch-data.sh):
 *   - master-dictionary.dict  Zemberek-NLP master lexicon (Apache-2.0), TDK-aligned headwords
 *   - non-tdk.dict            Zemberek-NLP extra common words not in TDK
 *   - tr_freq.txt             hermitdave/FrequencyWords (MIT), reduced to dictionary rows
 *   - first-10K               Zemberek-NLP 10k most frequent Turkish surface forms
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeWord, isPlayableWord } from '../src/lib/words/normalize.ts';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'data', 'raw');

export const TARGET_MIN = 4;
export const TARGET_MAX = 9;
export const VALIDATION_MIN = 3;
export const VALIDATION_MAX = 10;

/**
 * Minimum corpus count for a lemma to qualify as a daily target.
 *
 * This runs against the full frequency list. The old 50k-row list bottomed
 * out at a count of ~248, which silently made every threshold below that
 * identical and capped the 9-letter pool at 350 words -- barely four months
 * of puzzles. Chosen so the hardest round stays solvable in thirty seconds.
 */
export const FREQ_THRESHOLD = 50;

interface Entry {
	lemma: string;
	tags: Set<string>;
}

function parseDict(file: string): Entry[] {
	const entries: Entry[] = [];
	for (const line of readFileSync(join(RAW, file), 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const bracket = trimmed.indexOf('[');
		const lemma = (bracket === -1 ? trimmed : trimmed.slice(0, bracket)).trim();
		const tags = new Set<string>();
		if (bracket !== -1) {
			const posMatch = trimmed.slice(bracket).match(/P:([A-Za-z, ]+)/);
			if (posMatch) {
				for (const t of posMatch[1].split(',')) tags.add(t.trim());
			}
		}
		if (!lemma) continue;
		// Proper nouns and abbreviations start uppercase in Zemberek lexicons; skip.
		if (lemma[0] !== lemma[0].toLocaleLowerCase('tr-TR')) continue;
		entries.push({ lemma, tags });
	}
	return entries;
}

function loadFrequency(): Map<string, number> {
	const freq = new Map<string, number>();
	for (const line of readFileSync(join(RAW, 'tr_freq.txt'), 'utf8').split('\n')) {
		const [word, count] = line.trim().split(' ');
		if (!word || !count) continue;
		const norm = normalizeWord(word);
		freq.set(norm, (freq.get(norm) ?? 0) + Number(count));
	}
	return freq;
}

function loadFirst10k(): Set<string> {
	const set = new Set<string>();
	for (const line of readFileSync(join(RAW, 'first-10K'), 'utf8').split('\n')) {
		const norm = normalizeWord(line.trim());
		if (norm) set.add(norm);
	}
	return set;
}

export function loadBlocklist(): Set<string> {
	const set = new Set<string>();
	for (const line of readFileSync(join(ROOT, 'data', 'blocklist.txt'), 'utf8').split('\n')) {
		const t = line.trim();
		if (t && !t.startsWith('#')) set.add(normalizeWord(t));
	}
	return set;
}

export interface Sources {
	/** Every playable headword; what the game accepts as an answer. */
	validation: string[];
	/** Candidate daily targets by length, sorted for a stable starting order. */
	eligible: Record<number, string[]>;
	master: number;
	nonTdk: number;
}

export function loadSources(): Sources {
	const master = parseDict('master-dictionary.dict');
	const nonTdk = parseDict('non-tdk.dict');
	const freq = loadFrequency();
	const first10k = loadFirst10k();
	const blocklist = loadBlocklist();

	// Validation set: every playable headword from master + non-tdk. Answers
	// are judged generously; only the questions we ask are held to TDK.
	const validation = new Set<string>();
	for (const { lemma } of [...master, ...nonTdk]) {
		const norm = normalizeWord(lemma);
		if (isPlayableWord(norm, VALIDATION_MIN, VALIDATION_MAX)) validation.add(norm);
	}

	// Targets come from master only. It is the TDK-aligned lexicon, and every
	// word we ask about is linked to sozluk.gov.tr on the result screen, so a
	// target without an entry there is a dead link for a language learner.
	const EXCLUDED_POS = new Set(['Punc', 'Dup', 'Interj']);
	const lemmaTags = new Map<string, Set<string>>();
	for (const { lemma, tags } of master) {
		const norm = normalizeWord(lemma);
		const bucket = lemmaTags.get(norm) ?? new Set<string>();
		if (tags.size === 0) bucket.add('Noun');
		for (const t of tags) bucket.add(t);
		lemmaTags.set(norm, bucket);
	}

	/** Commonness score: corpus count of the bare lemma; verbs also try their stem. */
	const scoreOf = (lemma: string): number => {
		let score = freq.get(lemma) ?? 0;
		if (lemma.length > 4 && (lemma.endsWith('mek') || lemma.endsWith('mak'))) {
			score = Math.max(score, freq.get(lemma.slice(0, -3)) ?? 0);
		}
		return score;
	};

	const eligible: Record<number, string[]> = {};
	for (let len = TARGET_MIN; len <= TARGET_MAX; len++) eligible[len] = [];

	for (const [lemma, tags] of lemmaTags) {
		if (!isPlayableWord(lemma, TARGET_MIN, TARGET_MAX)) continue;
		if (blocklist.has(lemma)) continue;
		if ([...tags].every((t) => EXCLUDED_POS.has(t))) continue;
		if (scoreOf(lemma) >= FREQ_THRESHOLD || first10k.has(lemma)) {
			eligible[[...lemma].length].push(lemma);
		}
	}
	for (let len = TARGET_MIN; len <= TARGET_MAX; len++) eligible[len].sort();

	return {
		validation: [...validation].sort(),
		eligible,
		master: master.length,
		nonTdk: nonTdk.length
	};
}
