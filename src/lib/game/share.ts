/** Spoiler-free share text: 3 rows of 7 result emoji. */
import type { RoundResult } from './types.ts';

const EMOJI: Record<string, string> = {
	solved: '🟩',
	revealed: '🟨',
	failed: '⬛'
};

export function scoreOf(results: RoundResult[]): number {
	return results.filter((r) => r.outcome !== 'failed').length;
}

export function shareText(day: number, results: RoundResult[], relax: boolean): string {
	const score = scoreOf(results);
	const grid: string[] = [];
	for (let row = 0; row < results.length; row += 7) {
		grid.push(
			results
				.slice(row, row + 7)
				.map((r) => EMOJI[r.outcome])
				.join('')
		);
	}
	const mode = relax ? ' 🌙' : '';
	return `21kelime #${day} ${score}/${results.length}${mode}\n${grid.join('\n')}\nhttps://21kelime.com`;
}

export async function share(text: string): Promise<'shared' | 'copied' | 'failed'> {
	if (typeof navigator !== 'undefined' && 'share' in navigator) {
		try {
			await navigator.share({ text });
			return 'shared';
		} catch (err) {
			// User cancelled or share failed — fall back to clipboard.
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
