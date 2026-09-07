/**
 * Reduces the full Turkish frequency list to the rows the pool builder can
 * actually use.
 *
 * hermitdave's tr_full.txt is 2 million surface forms and 28 MB. Committing
 * that would weigh down every clone and every deploy build, and the builder
 * only ever looks up dictionary headwords (plus the bare stem of -mek/-mak
 * verbs). Keeping just those rows turns it into a file worth versioning,
 * and the counts stay exactly as published, so pool order is unaffected.
 *
 * Run via scripts/fetch-data.sh; writes data/raw/tr_freq.txt.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeWord, isPlayableWord } from '../src/lib/words/normalize.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'data', 'raw');

function lemmasOf(file: string): string[] {
	const out: string[] = [];
	for (const line of readFileSync(join(RAW, file), 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const bracket = trimmed.indexOf('[');
		const lemma = (bracket === -1 ? trimmed : trimmed.slice(0, bracket)).trim();
		if (lemma) out.push(normalizeWord(lemma));
	}
	return out;
}

const wanted = new Set<string>();
for (const lemma of [...lemmasOf('master-dictionary.dict'), ...lemmasOf('non-tdk.dict')]) {
	wanted.add(lemma);
	// Verbs are listed as infinitives but counted in the corpus as stems.
	if (lemma.length > 4 && (lemma.endsWith('mek') || lemma.endsWith('mak'))) {
		wanted.add(lemma.slice(0, -3));
	}
}

const kept: string[] = [];
let scanned = 0;
for (const line of readFileSync(join(RAW, 'tr_full.txt'), 'utf8').split('\n')) {
	const [word, count] = line.trim().split(' ');
	if (!word || !count) continue;
	scanned++;
	const norm = normalizeWord(word);
	if (!isPlayableWord(norm, 3, 10)) continue;
	if (!wanted.has(norm)) continue;
	kept.push(`${word} ${count}`);
}

writeFileSync(join(RAW, 'tr_freq.txt'), kept.join('\n') + '\n');
console.log(`scanned ${scanned} rows, kept ${kept.length} dictionary rows -> data/raw/tr_freq.txt`);
