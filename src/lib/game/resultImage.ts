/**
 * Renders the day's result as a 1080x1350 branded PNG, sized to look good
 * in Instagram stories and feeds, WhatsApp, and X alike. Web pages cannot
 * post into other apps directly; instead the caller hands this image to
 * the OS share sheet (navigator.share with files) where Instagram, X and
 * the rest appear as targets, or downloads it on desktop.
 */
import { ROUND_PLAN } from './generate.ts';
import { scoreOf } from './share.ts';
import type { RoundResult } from './types.ts';

const W = 1080;
const H = 1350;

const COLORS = {
	bg: '#14110e',
	ink: '#f3ede4',
	soft: '#a89f93',
	accent: '#2dd4bf',
	solved: '#4ade80',
	revealed: '#fbbf24',
	failed: '#332e27'
};

interface ImageOptions {
	day: number;
	dateLabel: string;
	results: RoundResult[];
	relax: boolean;
	streak: number;
}

export async function renderResultImage(opts: ImageOptions): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext('2d')!;
	const font = (size: number, weight = 800) =>
		`${weight} ${size}px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;

	ctx.fillStyle = COLORS.bg;
	ctx.fillRect(0, 0, W, H);
	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';

	// Wordmark
	ctx.font = font(96);
	const numW = ctx.measureText('21').width;
	const wordW = ctx.measureText('kelime').width;
	const startX = W / 2 - (numW + wordW) / 2;
	ctx.textAlign = 'left';
	ctx.fillStyle = COLORS.accent;
	ctx.fillText('21', startX, 170);
	ctx.fillStyle = COLORS.ink;
	ctx.fillText('kelime', startX + numW, 170);

	// Day line
	ctx.textAlign = 'center';
	ctx.fillStyle = COLORS.soft;
	ctx.font = font(42, 600);
	const dayLine = opts.relax
		? `#${opts.day} · ${opts.dateLabel} · rahat mod`
		: `#${opts.day} · ${opts.dateLabel}`;
	ctx.fillText(dayLine, W / 2, 250);

	// Score
	const score = scoreOf(opts.results);
	ctx.font = font(230);
	ctx.fillStyle = COLORS.accent;
	const scoreW = ctx.measureText(String(score)).width;
	ctx.font = font(110);
	const denomW = ctx.measureText('/21').width;
	ctx.textAlign = 'left';
	const sx = W / 2 - (scoreW + denomW + 10) / 2;
	ctx.font = font(230);
	ctx.fillText(String(score), sx, 540);
	ctx.font = font(110);
	ctx.fillStyle = COLORS.soft;
	ctx.fillText('/21', sx + scoreW + 10, 540);

	// Grid rows grouped by word length
	const cell = 62;
	const gap = 14;
	const rowGap = 20;
	let y = 640;
	let i = 0;
	ctx.textAlign = 'left';
	while (i < opts.results.length) {
		const len = ROUND_PLAN[i];
		let count = 0;
		while (i + count < opts.results.length && ROUND_PLAN[i + count] === len) count++;
		const rowW = count * cell + (count - 1) * gap + 60;
		let x = W / 2 - rowW / 2;
		for (let k = 0; k < count; k++) {
			const outcome = opts.results[i + k].outcome;
			ctx.fillStyle =
				outcome === 'solved'
					? COLORS.solved
					: outcome === 'revealed'
						? COLORS.revealed
						: COLORS.failed;
			ctx.beginPath();
			ctx.roundRect(x, y, cell, cell, 14);
			ctx.fill();
			x += cell + gap;
		}
		ctx.fillStyle = COLORS.soft;
		ctx.font = font(40, 700);
		ctx.fillText(String(len), x + 8, y + cell / 2 + 14);
		y += cell + rowGap;
		i += count;
	}

	// Streak
	ctx.textAlign = 'center';
	if (opts.streak >= 2) {
		ctx.fillStyle = COLORS.ink;
		ctx.font = font(44, 700);
		ctx.fillText(`Seri: ${opts.streak} gün`, W / 2, y + 60);
	}

	// Footer
	ctx.fillStyle = COLORS.accent;
	ctx.font = font(52);
	ctx.fillText('21kelime.com', W / 2, H - 80);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('canvas toBlob failed'))),
			'image/png'
		);
	});
}

/**
 * Share the image via the OS sheet on touch devices (where Instagram,
 * WhatsApp and the rest are share targets); download it on desktop.
 */
export async function shareResultImage(opts: ImageOptions): Promise<'shared' | 'downloaded'> {
	const blob = await renderResultImage(opts);
	const file = new File([blob], `21kelime-${opts.day}.png`, { type: 'image/png' });
	const isTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
	if (isTouch && navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file] });
			return 'shared';
		} catch {
			// Cancelled or unsupported mid-flight: fall through to download.
		}
	}
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = file.name;
	a.click();
	URL.revokeObjectURL(url);
	return 'downloaded';
}
