/**
 * Spoiler-free share text. Rows follow the game's length ramp (4 to 9
 * letter words), so the format reads as 21kelime, not as a Wordle clone:
 *
 *   21kelime #12 16/21
 *   🟩🟩🟩 4
 *   🟩🟨🟩🟩 5
 *   ...
 *   Seri: 5 gün 🔥
 *   https://21kelime.com
 */
import { ROUND_PLAN } from './generate.ts';
import type { RoundResult } from './types.ts';

const EMOJI: Record<string, string> = {
	solved: '🟩',
	revealed: '🟨',
	failed: '⬛'
};

export function scoreOf(results: RoundResult[]): number {
	return results.filter((r) => r.outcome !== 'failed').length;
}

export function shareText(day: number, results: RoundResult[], relax: boolean, streak = 0): string {
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
		rows.push(len ? `${cells} ${len}` : cells);
		i = j;
	}
	const mode = relax ? ' 🌙' : '';
	const lines = [`21kelime #${day} ${score}/${results.length}${mode}`, ...rows];
	if (streak >= 2) lines.push(`Seri: ${streak} gün 🔥`);
	lines.push('https://21kelime.com');
	return lines.join('\n');
}

export async function share(text: string): Promise<'shared' | 'copied' | 'failed'> {
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
