<script lang="ts">
	import { resolve } from '$app/paths';
	import type { GameEngine } from '$lib/game/engine.svelte';
	import { shareText, share, scoreOf } from '$lib/game/share';
	import { msUntilNextPuzzle } from '$lib/game/daily';
	import { trUpper } from '$lib/words/normalize';
	import Icon from './Icon.svelte';

	let { engine, onNewPractice }: { engine: GameEngine; onNewPractice?: () => void } = $props();

	const text = $derived(shareText(engine.puzzle.day, engine.results, engine.relax));
	const encoded = $derived(encodeURIComponent(text));

	const score = $derived(scoreOf(engine.results));
	const isDaily = $derived(engine.mode === 'daily');
	const isPractice = $derived(engine.mode === 'practice');

	let shareState = $state<'idle' | 'copied' | 'shared'>('idle');
	let countdown = $state('');

	$effect(() => {
		if (!isDaily) return;
		const update = () => {
			const ms = msUntilNextPuzzle();
			const h = Math.floor(ms / 3_600_000);
			const m = Math.floor((ms % 3_600_000) / 60_000);
			const s = Math.floor((ms % 60_000) / 1000);
			countdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		};
		update();
		const handle = setInterval(update, 1000);
		return () => clearInterval(handle);
	});

	async function doShare() {
		const result = await share(text);
		if (result === 'copied') {
			shareState = 'copied';
			setTimeout(() => (shareState = 'idle'), 2200);
		} else if (result === 'shared') {
			shareState = 'shared';
		}
	}

	async function doCopy() {
		try {
			await navigator.clipboard.writeText(text);
			shareState = 'copied';
			setTimeout(() => (shareState = 'idle'), 2200);
		} catch {
			// Clipboard blocked: the native share button still works.
		}
	}

	const verdict = $derived(
		score === 21
			? 'Kusursuz!'
			: score >= 17
				? 'Harika!'
				: score >= 12
					? 'Güzel oyun!'
					: score >= 7
						? 'Fena değil'
						: 'Yarın yeni şans'
	);
</script>

<div class="result">
	<p class="verdict">{verdict}</p>
	<p class="score"><strong>{score}</strong><span>/{engine.results.length}</span></p>

	<div class="grid" aria-label="Sonuç tablosu">
		{#each engine.results as r, i (i)}
			<span class="cell {r.outcome}" title="Tur {i + 1}"></span>
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
		<div class="social" aria-label="Sosyal medyada paylaş">
			<a
				class="social-btn"
				href="https://wa.me/?text={encoded}"
				target="_blank"
				rel="noopener noreferrer">WhatsApp</a
			>
			<a
				class="social-btn"
				href="https://x.com/intent/post?text={encoded}"
				target="_blank"
				rel="noopener noreferrer">X</a
			>
			<a
				class="social-btn"
				href="https://t.me/share/url?url=https%3A%2F%2F21kelime.com&text={encoded}"
				target="_blank"
				rel="noopener noreferrer">Telegram</a
			>
			<button class="social-btn" onclick={doCopy}>Kopyala</button>
		</div>
	{/if}

	{#if isDaily}
		<p class="next">Yeni bulmaca: <strong>{countdown}</strong></p>
	{/if}

	<details class="answers">
		<summary>Cevaplar</summary>
		<ol>
			{#each engine.puzzle.rounds as round, i (i)}
				{@const r = engine.results[i]}
				<li>
					<span class="mark {r.outcome}">
						<Icon name={r.outcome === 'failed' ? 'cross' : 'check'} size={14} />
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
	}

	.score strong {
		color: var(--accent);
	}

	.score span {
		font-size: 1.6rem;
		color: var(--ink-soft);
		font-weight: 600;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1.35rem);
		gap: 0.3rem;
	}

	.cell {
		width: 1.35rem;
		height: 1.35rem;
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

	.social {
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

	.links {
		display: flex;
		gap: 0.7rem;
		margin-top: 0.4rem;
	}
</style>
