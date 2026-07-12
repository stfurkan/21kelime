import { chromium } from 'playwright-core';
import { fromWire } from '../src/lib/game/wire.ts';

const BASE = 'http://localhost:4173';
const SCRATCH = process.env.SHOT_DIR ?? '/tmp';

const wire = await (await fetch(`${BASE}/api/puzzle/today`)).json();
const puzzle = fromWire(wire);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

// Seed: 20 rounds already played (14 solved, 3 revealed, 3 failed), 1 left.
const results = [
	...Array(14).fill({ outcome: 'solved', word: 'x', secondsLeft: 10, revealsUsed: 0 }),
	...Array(3).fill({ outcome: 'revealed', word: 'x', secondsLeft: 5, revealsUsed: 1 }),
	...Array(3).fill({ outcome: 'failed', secondsLeft: 0, revealsUsed: 0 })
];
await page.goto(BASE);
await page.evaluate(
	([date, res]) => {
		localStorage.setItem(
			`21kelime:day:${date}`,
			JSON.stringify({
				results: res,
				revealsLeft: 0,
				relax: false,
				done: false,
				statsCounted: false
			})
		);
		localStorage.removeItem('21kelime:stats');
	},
	[puzzle.date, results] as const
);
await page.reload();
await page.getByText(/Şu ana kadar/).waitFor({ timeout: 4000 });
await page.getByRole('button', { name: 'Devam et' }).click();
await page.getByText('21/21').waitFor({ timeout: 3000 });
console.log('PASS: resumed at final round 21');

// Solve the last round (9 letters) via keyboard.
for (const ch of puzzle.rounds[20].canonical) await page.keyboard.type(ch);
await page.getByText('Sonuçlar').click();
await page.getByText('18/21', { exact: false }).first().waitFor({ timeout: 4000 });
console.log('PASS: result screen shows 18/21');
await page.screenshot({ path: `${SCRATCH}/result.png`, fullPage: true });

// Stats must be counted exactly once.
const stats = await page.evaluate(() =>
	JSON.parse(localStorage.getItem('21kelime:stats') ?? 'null')
);
console.log('stats:', stats);
if (stats?.gamesPlayed === 1 && stats?.currentStreak === 1 && stats?.bestScore === 18) {
	console.log('PASS: stats and streak recorded');
} else {
	console.error('FAIL: unexpected stats');
	process.exitCode = 1;
}

// Reload result page: still done, stats not double counted.
await page.reload();
await page.getByText('18/21', { exact: false }).first().waitFor({ timeout: 4000 });
const stats2 = await page.evaluate(() =>
	JSON.parse(localStorage.getItem('21kelime:stats') ?? 'null')
);
if (stats2?.gamesPlayed === 1) console.log('PASS: no double counting after reload');
else {
	console.error('FAIL: stats double counted', stats2);
	process.exitCode = 1;
}

// Practice page smoke test.
await page.goto(`${BASE}/antrenman`);
await page.getByRole('button', { name: 'Başla' }).click();
await page.getByText('1/21').waitFor({ timeout: 4000 });
console.log('PASS: practice mode starts');

await browser.close();
console.log(process.exitCode ? 'E2E: FAILURES' : 'E2E RESULT: ALL PASS');
