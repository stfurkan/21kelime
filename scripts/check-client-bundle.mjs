/**
 * Guards the web build: the dictionary must never reach browser code.
 * words.json moved out of $lib/server (the mobile build embeds it), so
 * this check replaces the framework's illegal-import guarantee for the
 * web target. It scans every client asset for a sample of rare pool
 * words and fails the build on any hit.
 *
 * Run automatically as part of `npm run build`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, '.svelte-kit', 'cloudflare', '_app');

const words = JSON.parse(
	readFileSync(join(ROOT, 'src', 'lib', 'puzzles', 'data', 'words.json'), 'utf8')
);
const pool9 = words.pools['9'];
// Spread samples across the pool; 9-letter lemmas never appear in UI copy.
const sentinels = [0, 0.25, 0.5, 0.75, 0.99].map((p) => pool9[Math.floor(p * (pool9.length - 1))]);

function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) yield* walk(path);
		else yield path;
	}
}

let scanned = 0;
for (const file of walk(CLIENT_DIR)) {
	const content = readFileSync(file, 'utf8');
	scanned++;
	for (const word of sentinels) {
		if (content.includes(`"${word}"`)) {
			console.error(`LEAK: dictionary word "${word}" found in client asset ${file}`);
			process.exit(1);
		}
	}
}
console.log(`client bundle clean: ${scanned} assets scanned, no dictionary words found`);
