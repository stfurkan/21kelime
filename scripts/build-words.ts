/**
 * Word data pipeline for 21kelime.
 *
 * Inputs (data/raw/, see scripts/fetch-data.sh):
 *   - master-dictionary.dict  Zemberek-NLP master lexicon (Apache-2.0), TDK-aligned headwords
 *   - non-tdk.dict            Zemberek-NLP extra common words not in TDK
 *   - tr_50k.txt              hermitdave/FrequencyWords Turkish OpenSubtitles frequency (MIT)
 *   - first-10K               Zemberek-NLP 10k most frequent Turkish surface forms
 *
 * Outputs:
 *   - src/lib/server/data/words.json  { validation: string[], pools: Record<len, string[]> }
 *
 * Run: node scripts/build-words.ts [--report]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeWord, isPlayableWord } from '../src/lib/words/normalize.ts';
import { hashSeed, mulberry32, shuffleInPlace } from '../src/lib/game/rng.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'data', 'raw');
const OUT_DIR = join(ROOT, 'src', 'lib', 'server', 'data');

const TARGET_MIN = 4;
const TARGET_MAX = 9;
const VALIDATION_MIN = 3;
const VALIDATION_MAX = 10;
/** Minimum OpenSubtitles corpus count for a lemma to qualify as a daily target. */
const FREQ_THRESHOLD = 25;
const POOL_SHUFFLE_SEED = '21kelime-pools-v1';

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
	for (const line of readFileSync(join(RAW, 'tr_50k.txt'), 'utf8').split('\n')) {
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

function loadBlocklist(): Set<string> {
	const set = new Set<string>();
	for (const line of readFileSync(join(ROOT, 'data', 'blocklist.txt'), 'utf8').split('\n')) {
		const t = line.trim();
		if (t && !t.startsWith('#')) set.add(normalizeWord(t));
	}
	return set;
}

// ---- build ----

const master = parseDict('master-dictionary.dict');
const nonTdk = parseDict('non-tdk.dict');
const freq = loadFrequency();
const first10k = loadFirst10k();
const blocklist = loadBlocklist();

// Validation set: every playable headword from master + non-tdk.
const validation = new Set<string>();
for (const { lemma } of [...master, ...nonTdk]) {
	const norm = normalizeWord(lemma);
	if (isPlayableWord(norm, VALIDATION_MIN, VALIDATION_MAX)) validation.add(norm);
}

// Target eligibility: master-only, POS not exclusively Punc/Dup/Interj, not blocklisted.
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
function scoreOf(lemma: string): number {
	let score = freq.get(lemma) ?? 0;
	if (lemma.length > 4 && (lemma.endsWith('mek') || lemma.endsWith('mak'))) {
		score = Math.max(score, freq.get(lemma.slice(0, -3)) ?? 0);
	}
	return score;
}

const pools: Record<number, string[]> = {};
for (let len = TARGET_MIN; len <= TARGET_MAX; len++) pools[len] = [];

for (const [lemma, tags] of lemmaTags) {
	if (!isPlayableWord(lemma, TARGET_MIN, TARGET_MAX)) continue;
	if (blocklist.has(lemma)) continue;
	if ([...tags].every((t) => EXCLUDED_POS.has(t))) continue;
	const score = scoreOf(lemma);
	if (score >= FREQ_THRESHOLD || first10k.has(lemma)) {
		pools[[...lemma].length].push(lemma);
	}
}

// Deterministic order: sort for stability, then one seeded shuffle per bucket.
// Daily generation slices these arrays, so this order IS the puzzle schedule.
for (let len = TARGET_MIN; len <= TARGET_MAX; len++) {
	pools[len].sort();
	shuffleInPlace(pools[len], mulberry32(hashSeed(`${POOL_SHUFFLE_SEED}:${len}`)));
}

if (process.argv.includes('--report')) {
	console.log(`master entries:      ${master.length}`);
	console.log(`non-tdk entries:     ${nonTdk.length}`);
	console.log(`validation words:    ${validation.size}`);
	for (let len = TARGET_MIN; len <= TARGET_MAX; len++) {
		console.log(`target pool len=${len}:  ${pools[len].length}`);
	}
	for (let len = TARGET_MIN; len <= TARGET_MAX; len++) {
		console.log(`  sample len=${len}: ${pools[len].slice(0, 10).join(', ')}`);
	}
}

mkdirSync(OUT_DIR, { recursive: true });
const out = {
	version: 1,
	sources: 'zemberek-nlp (Apache-2.0) master+non-tdk; hermitdave/FrequencyWords (MIT)',
	validation: [...validation].sort(),
	pools
};
writeFileSync(join(OUT_DIR, 'words.json'), JSON.stringify(out));
console.log(`wrote ${join(OUT_DIR, 'words.json')} (${validation.size} validation words)`);
