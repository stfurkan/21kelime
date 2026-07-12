<script lang="ts">
	import { resolve } from '$app/paths';
	import type { GameEngine } from '$lib/game/engine.svelte';
	import { shareText, challengeText, share, scoreOf } from '$lib/game/share';
	import { shareResultImage } from '$lib/game/resultImage';
	import { ROUND_PLAN } from '$lib/game/generate';
	import { loadStats } from '$lib/game/storage';
	import { msUntilNextPuzzle, istanbulToday } from '$lib/game/daily';
	import { trUpper } from '$lib/words/normalize';
	import { effectiveTheme } from '$lib/theme';
	import Icon from './Icon.svelte';

	let { engine, onNewPractice }: { engine: GameEngine; onNewPractice?: () => void } = $props();

	const score = $derived(scoreOf(engine.results));
	const isDaily = $derived(engine.mode === 'daily');
	const isPractice = $derived(engine.mode === 'practice');
	const isToday = $derived(isDaily && engine.puzzle.date === istanbulToday());

	const streak = $derived(isDaily ? loadStats().currentStreak : 0);
	const text = $derived(
		shareText(engine.puzzle.day, engine.results, { relax: engine.relax, streak })
	);

	// Rows grouped by word length, same shape as the share text and image.
	const gridRows = $derived.by(() => {
		const rows: { len: number; outcomes: string[] }[] = [];
		for (let i = 0; i < engine.results.length;) {
			const len = ROUND_PLAN[i];
			const outcomes: string[] = [];
			while (i < engine.results.length && ROUND_PLAN[i] === len) {
				outcomes.push(engine.results[i].outcome);
				i++;
			}
			rows.push({ len, outcomes });
		}
		return rows;
	});

	// Spoken description of the grid for screen readers.
	const gridSummary = $derived(
		gridRows
			.map((row) => {
				const solved = row.outcomes.filter((o) => o !== 'failed').length;
				return `${row.len} harfli kelimelerde ${solved}/${row.outcomes.length}`;
			})
			.join(', ')
	);

	const dateLabel = $derived(
		isPractice
			? 'antrenman'
			: new Intl.DateTimeFormat('tr-TR', {
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					timeZone: 'UTC'
				}).format(new Date(`${engine.puzzle.date}T00:00:00Z`))
	);

	let shareState = $state<'idle' | 'copied' | 'challenge-copied' | 'image-downloaded'>('idle');
	let countdown = $state('');
	let newPuzzleReady = $state(false);

	$effect(() => {
		if (!isDaily) return;
		let lastMs = Infinity;
		const update = () => {
			const ms = msUntilNextPuzzle();
			// The countdown jumping up means Istanbul midnight passed while
			// this screen was open: the next puzzle is live right now.
			if (ms > lastMs) {
				newPuzzleReady = true;
				clearInterval(handle);
				return;
			}
			lastMs = ms;
			const h = Math.floor(ms / 3_600_000);
			const m = Math.floor((ms % 3_600_000) / 60_000);
			const s = Math.floor((ms % 60_000) / 1000);
			countdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		};
		update();
		const handle = setInterval(update, 1000);
		return () => clearInterval(handle);
	});

	function flash(state: typeof shareState, ms = 2400) {
		shareState = state;
		setTimeout(() => (shareState = 'idle'), ms);
	}

	async function doShare() {
		const result = await share(text);
		if (result === 'copied') flash('copied');
	}

	async function doCopy() {
		try {
			await navigator.clipboard.writeText(text);
			flash('copied');
		} catch {
			// Clipboard blocked: the native share button still works.
		}
	}

	async function doChallenge() {
		const challenge = challengeText(engine.puzzle.day, engine.results);
		if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && 'share' in navigator) {
			try {
				await navigator.share({ text: challenge });
				return;
			} catch {
				// fall through to clipboard
			}
		}
		try {
			await navigator.clipboard.writeText(challenge);
			flash('challenge-copied');
		} catch {
			// ignore
		}
	}

	// Instagram ve benzeri uygulamalara web'den doğrudan gönderim yok;
	// görsel, telefonda paylaşım menüsüne gider, masaüstünde indirilir.
	async function doImageShare() {
		const outcome = await shareResultImage({
			day: engine.puzzle.day,
			dateLabel,
			results: engine.results,
			relax: engine.relax,
			streak,
			theme: effectiveTheme()
		});
		if (outcome === 'downloaded') flash('image-downloaded', 3200);
	}

	const verdict = $derived(
		score === 21
			? 'Kusursuz!'
			: score >= 17
				? 'Harika!'
				: score >= 12
					? 'Güzel oyun!'
					: score >= 7
						? 'Fena değil!'
						: 'Olsun, yarın yenisi var'
	);
</script>

<div class="result">
	<p class="verdict">{verdict}</p>
	<p class="score">
		<strong>{score}</strong><span class="denom">/<em>{engine.results.length}</em></span>
	</p>
	{#if engine.relax}
		<p class="mode-tag"><Icon name="no-timer" size={13} /> rahat modda oynandı</p>
	{/if}

	<div class="grid" role="img" aria-label={gridSummary}>
		{#each gridRows as row (row.len)}
			<div class="grid-row" aria-hidden="true">
				<span class="len">{row.len}</span>
				{#each row.outcomes as outcome, k (k)}
					<span class="cell {outcome}"></span>
				{/each}
			</div>
		{/each}
	</div>

	{#if !isPractice}
		<button class="btn btn-primary sharebtn" onclick={doShare}>
			{#if shareState === 'copied'}
				<Icon name="check" size={17} /> Kopyalandı
			{:else}
				<Icon name="share" size={17} /> Sonucu paylaş
			{/if}
		</button>
		<div class="pills">
			{#if isToday}
				<button class="social-btn" onclick={doChallenge}>
					{shareState === 'challenge-copied' ? 'Kopyalandı, gönder!' : 'Arkadaşına meydan oku'}
				</button>
			{/if}
			<button class="social-btn" onclick={doCopy}>
				{shareState === 'copied' ? 'Kopyalandı' : 'Sonucu kopyala'}
			</button>
			<button class="social-btn" onclick={doImageShare}>
				{shareState === 'image-downloaded' ? 'Görsel indirildi' : 'Görseli paylaş'}
			</button>
		</div>
		<p class="share-hint">
			Görsel telefonda paylaşım menüsünü açar, bilgisayarda indirilir. Instagram hikayesi için
			birebir.
		</p>
	{/if}

	{#if isDaily}
		{#if newPuzzleReady}
			<button class="btn btn-primary" onclick={() => location.reload()}>
				Yeni bulmaca hazır, oyna
			</button>
		{:else}
			<p class="next">Yeni bulmaca: <strong>{countdown}</strong></p>
		{/if}
	{/if}

	<details class="answers">
		<summary>Cevaplar</summary>
		<ol>
			{#each engine.puzzle.rounds as round, i (i)}
				{@const r = engine.results[i]}
				<li>
					<span class="mark {r.outcome}">
						<Icon name={r.outcome === 'failed' ? 'close' : 'check'} size={14} />
					</span>
					<a
						href="https://sozluk.gov.tr/?ara={round.canonical}"
						target="_blank"
						rel="noopener noreferrer">{trUpper(round.canonical)}</a
					>
					{#if round.answers.length > 1}
						<span class="alts"
							>({round.answers
								.filter((a) => a !== round.canonical)
								.map(trUpper)
								.join(', ')})</span
						>
					{/if}
				</li>
			{/each}
		</ol>
		<p class="report">
			Bir kelimeye itirazın mı var?
			<a
				href="mailto:iletisim@21kelime.com?subject=Kelime%20itiraz%C4%B1%20%2321kelime%20{engine
					.puzzle.day}">Bize yaz</a
			>
		</p>
	</details>

	<div class="links">
		{#if isPractice}
			<button class="btn" onclick={() => onNewPractice?.()}>Yeni antrenman</button>
		{:else}
			<a class="btn" href={resolve('/arsiv')}>Arşiv</a>
			<a class="btn" href={resolve('/antrenman')}>Antrenman</a>
		{/if}
	</div>
</div>

<style>
	.result {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		text-align: center;
		padding-top: 1rem;
	}

	.verdict {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
	}

	.score {
		margin: 0;
		font-size: 3.2rem;
		font-weight: 800;
		line-height: 1;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 0.1rem;
	}

	.score strong {
		color: var(--accent);
	}

	.denom {
		font-size: 1.6rem;
		line-height: 1.05;
		color: var(--ink-soft);
		font-weight: 600;
	}

	/* Sit the denominator digits on the slash's bottom tip. */
	.denom em {
		font-style: normal;
		display: inline-block;
		transform: translateY(0.09em);
	}

	.mode-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		margin: -0.3rem 0 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-soft);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.15rem 0.7rem;
	}

	.grid {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.grid-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.len {
		width: 1.05rem;
		margin-right: 0.15rem;
		text-align: center;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--ink-soft);
	}

	.cell {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 5px;
	}

	.cell.solved {
		background: var(--good);
	}

	.cell.revealed {
		background: var(--warn);
	}

	.cell.failed {
		background: var(--line);
	}

	.sharebtn {
		min-width: 12rem;
	}

	.pills {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.social-btn {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink-soft);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.35rem 0.9rem;
		background: var(--bg-raised);
	}

	.social-btn:hover {
		color: var(--accent);
		border-color: var(--accent);
	}

	.share-hint {
		margin: 0;
		font-size: 0.78rem;
		color: var(--ink-soft);
	}

	.next {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.92rem;
	}

	.next strong {
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}

	.answers {
		width: 100%;
		text-align: left;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 0.7rem 1rem;
		background: var(--bg-raised);
	}

	summary {
		cursor: pointer;
		font-weight: 700;
	}

	ol {
		margin: 0.6rem 0 0.2rem;
		padding-left: 1.6rem;
		display: grid;
		gap: 0.25rem;
		font-size: 0.95rem;
	}

	.mark {
		display: inline-flex;
		vertical-align: middle;
		margin-right: 0.3rem;
	}

	.mark.solved {
		color: var(--good);
	}

	.mark.revealed {
		color: var(--warn);
	}

	.mark.failed {
		color: var(--bad);
	}

	.alts {
		color: var(--ink-soft);
		font-size: 0.85rem;
	}

	.report {
		margin: 0.7rem 0 0.1rem;
		font-size: 0.82rem;
		color: var(--ink-soft);
	}

	.links {
		display: flex;
		gap: 0.7rem;
		margin-top: 0.4rem;
	}
</style>
