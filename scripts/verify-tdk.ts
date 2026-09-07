/**
 * Verifies candidate daily targets against TDK's Güncel Türkçe Sözlük.
 *
 * Every word the game asks about is linked to sozluk.gov.tr on the result
 * screen, which is where players -- language learners especially -- go to
 * find out what they just solved. A target with no entry there is a dead
 * link, so no word joins a pool until it has been checked once.
 *
 * Results are cached in data/tdk-verified.json and committed, so the build
 * stays offline and deterministic. Only words missing from the cache are
 * fetched, and the cache is flushed as it goes, so an interrupted run
 * resumes where it stopped. Words already published in a pool are skipped:
 * pools are append-only, so they cannot be withdrawn anyway.
 *
 * Run: node scripts/verify-tdk.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSources, ROOT, TARGET_MIN, TARGET_MAX } from './word-sources.ts';

const CACHE_PATH = join(ROOT, 'data', 'tdk-verified.json');
const PUBLISHED_PATH = join(ROOT, 'src', 'lib', 'puzzles', 'data', 'words.json');
const API = 'https://sozluk.gov.tr/gts?ara=';
/** Deliberately unhurried: this is someone else's public dictionary. */
const DELAY_MS = 250;
const FLUSH_EVERY = 50;

type Cache = Record<string, 0 | 1>;

const cache: Cache = existsSync(CACHE_PATH)
	? (JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as Cache)
	: {};

const published = new Set<string>();
if (existsSync(PUBLISHED_PATH)) {
	const data = JSON.parse(readFileSync(PUBLISHED_PATH, 'utf8')) as {
		pools: Record<string, string[]>;
	};
	for (const list of Object.values(data.pools)) for (const w of list) published.add(w);
}

// --all also checks words already published in a pool. They cannot be
// withdrawn (pools are append-only), but knowing whether any of them is
// missing from TDK tells us if a future day will show a dead dictionary
// link, which is worth knowing even when the fix has to be indirect.
const checkPublished = process.argv.includes('--all');

const todo: string[] = [];
const { eligible } = loadSources();
for (let len = TARGET_MIN; len <= TARGET_MAX; len++) {
	for (const word of eligible[len]) {
		if (word in cache) continue;
		if (published.has(word) && !checkPublished) continue;
		todo.push(word);
	}
}
if (checkPublished) {
	// Published words that no longer qualify as candidates still need checking.
	for (const word of published) {
		if (!(word in cache) && !todo.includes(word)) todo.push(word);
	}
}

function flush(): void {
	// Sorted keys keep the committed diff readable between runs.
	const sorted: Cache = {};
	for (const k of Object.keys(cache).sort()) sorted[k] = cache[k];
	writeFileSync(CACHE_PATH, JSON.stringify(sorted, null, 0) + '\n');
}

/** True when TDK has a headword; null when the lookup itself failed. */
async function hasEntry(word: string): Promise<boolean | null> {
	try {
		const res = await fetch(API + encodeURIComponent(word), {
			signal: AbortSignal.timeout(15000)
		});
		if (!res.ok) return null;
		const body = (await res.text()).trim();
		// A hit is a JSON array of entries; a miss is {"error":"Sonuç bulunamadı"}.
		if (body.startsWith('[')) return true;
		if (body.startsWith('{')) return false;
		return null;
	} catch {
		return null;
	}
}

console.log(`${todo.length} yeni aday doğrulanacak (önbellekte ${Object.keys(cache).length})`);
let checked = 0;
let missing = 0;
let failed = 0;

for (const word of todo) {
	let result = await hasEntry(word);
	if (result === null) {
		// One retry, a little slower, before giving up for this run.
		await new Promise((r) => setTimeout(r, 1500));
		result = await hasEntry(word);
	}
	if (result === null) {
		// Leave it uncached so the next run tries again.
		failed++;
	} else {
		cache[word] = result ? 1 : 0;
		if (!result) missing++;
	}
	checked++;
	if (checked % FLUSH_EVERY === 0) {
		flush();
		console.log(`  ${checked}/${todo.length} (TDK'de yok: ${missing}, ulaşılamadı: ${failed})`);
	}
	await new Promise((r) => setTimeout(r, DELAY_MS));
}

flush();
console.log(`bitti: ${checked} kontrol, ${missing} TDK'de yok, ${failed} ulaşılamadı`);
console.log(`önbellek: ${CACHE_PATH} (${Object.keys(cache).length} kelime)`);
