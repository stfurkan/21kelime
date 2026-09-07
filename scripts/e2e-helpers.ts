/**
 * Shared helpers for the end-to-end scripts.
 */
import type { Page } from 'playwright-core';
import { trUpper } from '../src/lib/words/normalize.ts';

const ASCII_LETTER = /^[a-z]$/;

/**
 * Tap the first free rack tile showing this letter.
 *
 * Picking by index rather than by `.first()` matters: used tiles stay in
 * the DOM (dimmed and disabled), so a word with a repeated letter would
 * otherwise aim at a tile that can no longer be clicked.
 */
export async function tapLetter(page: Page, ch: string): Promise<void> {
	const target = trUpper(ch);
	const tiles = page.locator('.rack .tile');
	const index = await tiles.evaluateAll(
		(els, t) =>
			els.findIndex((el) => !(el as HTMLButtonElement).disabled && el.textContent?.trim() === t),
		target
	);
	if (index === -1) throw new Error(`boşta "${target}" harfi kalmadı`);
	await tiles.nth(index).click();
}

/**
 * Enter a word on the board, letter by letter.
 *
 * Playwright cannot type ç/ğ/ı/ö/ş/ü: for characters outside the US layout
 * keyboard.type() falls back to Input.insertText, which fires no keydown,
 * so the game never sees them. Around 43% of days have a Turkish-only
 * letter in the last round, and the suite failed on every one of them for
 * reasons that had nothing to do with the game. Those letters are tapped;
 * the rest still go through the keyboard, keeping that path covered.
 */
export async function enterWord(page: Page, word: string): Promise<void> {
	for (const ch of word) {
		if (ASCII_LETTER.test(ch)) await page.keyboard.type(ch);
		else await tapLetter(page, ch);
	}
}
