import { chromium } from 'playwright-core';
import { fromWire } from '../src/lib/game/wire.ts';
import { trUpper } from '../src/lib/words/normalize.ts';

const BASE = 'http://localhost:4173';
const SCRATCH = process.env.SHOT_DIR ?? '/tmp';

const wire = await (await fetch(`${BASE}/api/puzzle/today`)).json();
const puzzle = fromWire(wire);
console.log('round 1 canonical:', puzzle.rounds[0].canonical);
console.log('round 2 canonical:', puzzle.rounds[1].canonical);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const fail = (msg: string) => {
	console.error('FAIL:', msg);
	process.exitCode = 1;
};

await page.goto(BASE);
await page.getByRole('button', { name: 'Başla' }).click();

// Round 1: solve by clicking tiles in canonical order.
for (const ch of puzzle.rounds[0].canonical) {
	await page
		.getByRole('button', { name: `Harf ${trUpper(ch)}`, exact: true })
		.locator('visible=true')
		.first()
		.click();
}
await page.getByText('Doğru!').waitFor({ timeout: 3000 });
console.log('PASS: round 1 solved by tile clicks');
await page.screenshot({ path: `${SCRATCH}/between.png` });

// Auto-advance to round 2.
await page.getByText('2/21').waitFor({ timeout: 5000 });
console.log('PASS: auto-advanced to round 2');

// Round 2: use a reveal, then type the rest via keyboard.
await page.getByRole('button', { name: /İpucu/ }).click();
const word2 = puzzle.rounds[1].canonical;
await page.getByText(trUpper(word2[0]), { exact: true }).first().waitFor({ timeout: 2000 });
console.log('PASS: reveal placed first letter');
for (const ch of word2.slice(1)) await page.keyboard.type(ch);
await page.getByText(/İpucuyla çözdün/).waitFor({ timeout: 3000 });
console.log('PASS: round 2 solved via keyboard after reveal (outcome: revealed)');

// Round 3: type a WRONG arrangement, expect shake + no advance, then let timer run out.
await page.getByText('3/21').waitFor({ timeout: 5000 });
await page.screenshot({ path: `${SCRATCH}/round3.png` });
const letters3 = puzzle.rounds[2].letters.join('');
// letters as scrambled are guaranteed not to be an answer
for (const ch of letters3) await page.keyboard.type(ch);
await page.waitForTimeout(700);
const still3 = await page.getByText('3/21').isVisible();
if (!still3) fail('wrong word should not advance the round');
else console.log('PASS: wrong word rejected (round did not advance)');

// Timer: wait for timeout -> failed screen shows the canonical answer.
await page.getByText('Süre doldu!', { exact: false }).waitFor({ timeout: 32000 });
console.log('PASS: timer expiry shows "Süre doldu!"');
await page.screenshot({ path: `${SCRATCH}/failed.png` });

// Reload mid-game: should offer to continue from round 4.
await page.getByText('4/21').waitFor({ timeout: 5000 });
await page.reload();
await page.getByText(/Kaldığın yerden/).waitFor({ timeout: 5000 });
console.log('PASS: mid-game state persisted; resume offered after reload');
await page.getByRole('button', { name: 'Devam et' }).click();
await page.getByText('4/21').waitFor({ timeout: 3000 });
console.log('PASS: resumed at round 4');

await browser.close();
console.log(process.exitCode ? 'E2E: FAILURES' : 'E2E: ALL PASS');
