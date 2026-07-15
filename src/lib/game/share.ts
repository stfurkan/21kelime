/**
 * Spoiler-free share text. Rows follow the game's length ramp (4 to 9
 * letter words), so the format reads as 21kelime, not as a Wordle clone.
 * Keycap digits render at the same cell width as the squares, so the
 * grid stays perfectly aligned in every chat app:
 *
 *   21kelime #12 16/21
 *
 *   4️⃣🟩🟩🟩
 *   5️⃣🟩🟨🟩🟩
 *   ...
 *   9️⃣⬛⬛⬛
 *   Seri: 5 gün 🔥
 *
 *   https://21kelime.com
 */
import { ROUND_PLAN } from './generate.ts';
import type { RoundResult } from './types.ts';

const EMOJI: Record<string, string> = {
	solved: '🟩',
	revealed: '🟨',
	failed: '⬛'
};

/** Word length as a keycap emoji (same rendered width as the squares). */
function keycap(n: number): string {
	return `${n}️⃣`;
}

export function scoreOf(results: RoundResult[]): number {
	return results.filter((r) => r.outcome !== 'failed').length;
}

export interface ShareOptions {
	relax?: boolean;
	streak?: number;
}

export function shareText(day: number, results: RoundResult[], opts: ShareOptions = {}): string {
	const score = scoreOf(results);
	const rows: string[] = [];
	let i = 0;
	while (i < results.length) {
		const len = ROUND_PLAN[i];
		let cells = '';
		let j = i;
		while (j < results.length && ROUND_PLAN[j] === len) {
			cells += EMOJI[results[j].outcome];
			j++;
		}
		rows.push(len ? `${keycap(len)}${cells}` : cells);
		i = j;
	}
	const mode = opts.relax ? ' (rahat mod)' : '';
	const lines = [`21kelime #${day} ${score}/${results.length}${mode}`, '', ...rows];
	if ((opts.streak ?? 0) >= 2) lines.push(`Seri: ${opts.streak} gün 🔥`);
	lines.push('', 'https://21kelime.com');
	return lines.join('\n');
}

/** Text for the "challenge a friend" button. */
export function challengeText(day: number, results: RoundResult[]): string {
	const score = scoreOf(results);
	return `Bugünkü 21kelime bulmacasında ${score}/${results.length} yaptım. Sen kaç yaparsın?\nhttps://21kelime.com/?s=${day}.${score}`;
}

export async function share(text: string): Promise<'shared' | 'copied' | 'failed'> {
	if (__MOBILE__) {
		// The Capacitor WebView has no navigator.share; use the native sheet.
		try {
			const { nativeShareText } = await import('$lib/native');
			await nativeShareText(text);
			return 'shared';
		} catch {
			return 'failed'; // sheet dismissed
		}
	}
	if (typeof navigator !== 'undefined' && 'share' in navigator) {
		try {
			await navigator.share({ text });
			return 'shared';
		} catch (err) {
			// User cancelled or share failed: fall back to clipboard.
			if ((err as DOMException)?.name === 'AbortError') return 'failed';
		}
	}
	try {
		await navigator.clipboard.writeText(text);
		return 'copied';
	} catch {
		return 'failed';
	}
}
