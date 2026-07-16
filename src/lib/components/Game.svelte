<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { GameEngine, type GameMode } from '$lib/game/engine.svelte';
	import { fromWire } from '$lib/game/wire';
	import { istanbulToday, dayNumberOf } from '$lib/game/daily';
	import {
		loadDayState,
		saveDayState,
		loadStats,
		saveStats,
		applyGameToStats
	} from '$lib/game/storage';
	import { dateOfDay } from '$lib/game/daily';
	import { trUpper } from '$lib/words/normalize';
	import type { WirePuzzle } from '$lib/game/types';
	import RoundBoard from './RoundBoard.svelte';
	import ResultScreen from './ResultScreen.svelte';
	import Icon from './Icon.svelte';

	let {
		wire,
		mode,
		onNewPractice
	}: { wire: WirePuzzle; mode: GameMode; onNewPractice?: () => void } = $props();

	// The component is recreated via {#key} when the puzzle changes, so
	// capturing the initial prop values here is intentional.
	// svelte-ignore state_referenced_locally
	const puzzle = fromWire(wire);
	// svelte-ignore state_referenced_locally
	const persist = mode !== 'practice';

	// Completing a round clears any pendingRound clock; a mid-round tick
	// records it so a refresh resumes with the remaining time, not a full 30s.
	function saveProgress(done: boolean, pendingRound?: { index: number; secondsLeft: number }) {
		if (!persist) return;
		const prev = loadDayState(puzzle.date);
		saveDayState(puzzle.date, {
			results: engine.results,
			revealsLeft: engine.revealsLeft,
			relax: engine.relax,
			done,
			statsCounted: prev?.statsCounted ?? false,
			...(pendingRound ? { pendingRound } : {})
		});
	}

	// svelte-ignore state_referenced_locally
	const engine = new GameEngine(puzzle, mode, {
		onRoundDone: () => saveProgress(false),
		onTick: (index, secondsLeft) => saveProgress(false, { index, secondsLeft }),
		onFinish: () => {
			saveProgress(true);
			// Streaks/stats count once, for the daily puzzle only. A game
			// started before midnight and finished just after still counts:
			// accept today's date or yesterday's (the session's own date).
			const today = istanbulToday();
			const startedRecently = puzzle.date === today || dayNumberOf(today) - puzzle.day === 1;
			if (mode === 'daily' && startedRecently) {
				const state = loadDayState(puzzle.date);
				if (state && !state.statsCounted) {
					const yesterday = dateOfDay(puzzle.day - 1);
					saveStats(
						applyGameToStats(
							loadStats(),
							puzzle.date,
							yesterday,
							engine.score,
							puzzle.rounds.length
						)
					);
					saveDayState(puzzle.date, { ...state, statsCounted: true });
				}
			}
		}
	});

	onDestroy(() => engine.destroy());

	// Restore any saved progress for this date (runs client-side after mount).
	let restored = $state(false);
	let hasPendingClock = $state(false);
	$effect(() => {
		if (restored) return;
		restored = true;
		if (!persist) return;
		const saved = loadDayState(puzzle.date);
		if (saved && (saved.results.length > 0 || saved.pendingRound)) {
			const pending =
				!saved.relax && saved.pendingRound?.index === saved.results.length
					? saved.pendingRound.secondsLeft
					: null;
			hasPendingClock = pending !== null;
			engine.resume(saved.results, saved.revealsLeft, saved.relax, pending);
		}
	});

	let relaxChoice = $state(false);

	const dateLabel = $derived(
		mode === 'practice'
			? 'Antrenman'
			: new Intl.DateTimeFormat('tr-TR', {
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					timeZone: 'UTC'
				}).format(new Date(`${puzzle.date}T00:00:00Z`))
	);

	const resuming = $derived(
		(engine.results.length > 0 || hasPendingClock) && engine.phase === 'start'
	);

	// Returning players see their numbers on the start screen. Read after
	// mount so server-rendered HTML stays identical for everyone.
	let quickStats = $state<ReturnType<typeof loadStats> | null>(null);
	$effect(() => {
		if (mode === 'daily') quickStats = loadStats();
	});
	const lastRound = $derived(engine.roundIndex === engine.puzzle.rounds.length - 1);

	// A friend's challenge link (?s=<day>.<score>) shows their score on the
	// start screen when it points at this exact puzzle.
	const challengeScore = $derived.by(() => {
		if (mode !== 'daily') return null;
		const param = page.url.searchParams.get('s');
		const match = param?.match(/^(\d+)\.(\d+)$/);
		if (!match) return null;
		const [, day, score] = match;
		if (Number(day) !== puzzle.day) return null;
		const n = Number(score);
		return n >= 0 && n <= puzzle.rounds.length ? n : null;
	});

	// Enter starts the game and skips the between-rounds wait. Playing-phase
	// keys live in RoundBoard; advance() and start() are phase-guarded, so a
	// focused button firing the same action twice is harmless.
	function onKeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		// Keys belong to an open dialog (help/stats), not to the game.
		if (document.querySelector('dialog[open]')) return;
		if (engine.phase === 'between' && (e.key === 'Enter' || e.key === ' ')) {
			engine.advance();
			e.preventDefault();
		} else if (engine.phase === 'start' && e.key === 'Enter') {
			engine.start(resuming ? engine.relax : relaxChoice);
			e.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} onpagehide={() => engine.persistClock()} />

<div class="game">
	{#if engine.phase === 'start'}
		<div class="start">
			{#if mode === 'practice'}
				<h1>Antrenman</h1>
				<p class="sub">Sınırsız pratik. İstatistiklere işlenmez.</p>
			{:else}
				<h1>#{puzzle.day} · {dateLabel}</h1>
				<p class="sub">21 tur, her turda tüm harflerden bir kelime.</p>
			{/if}

			{#if challengeScore != null && !resuming}
				<p class="challenge-note">
					Arkadaşın bu bulmacada <strong>{challengeScore}/21</strong> yaptı. Geçebilir misin?
				</p>
			{/if}

			{#if quickStats && quickStats.gamesPlayed > 0}
				<div class="quick-stats">
					<div class="qstat">
						<strong>{quickStats.currentStreak}</strong>
						<span>gün seri</span>
					</div>
					<div class="qstat">
						<strong>{quickStats.bestScore}<em>/21</em></strong>
						<span>en iyi skor</span>
					</div>
					<div class="qstat">
						<strong>{quickStats.gamesPlayed}</strong>
						<span>oyun</span>
					</div>
				</div>
			{/if}

			{#if resuming}
				<p class="resume-note">
					{#if engine.results.length > 0}
						Şu ana kadar <strong>{engine.results.length}/21</strong> tur oynadın.
					{:else}
						Yarım kalan turdan devam edeceksin.
					{/if}
				</p>
				<button class="btn btn-primary big" onclick={() => engine.start(engine.relax)}>
					Devam et
				</button>
			{:else}
				<label class="relax-toggle">
					<input type="checkbox" bind:checked={relaxChoice} />
					<span><Icon name="no-timer" size={15} /> Rahat mod <em>(süre yok)</em></span>
				</label>
				<button class="btn btn-primary big" onclick={() => engine.start(relaxChoice)}>Başla</button>
			{/if}
		</div>
	{:else if engine.phase === 'playing'}
		<RoundBoard {engine} />
	{:else if engine.phase === 'between'}
		<div class="between {engine.lastOutcome}" role="status" aria-live="polite">
			{#if engine.lastOutcome === 'failed'}
				<p class="between-title">{engine.relax ? 'Olmadı, cevap:' : 'Süre doldu!'}</p>
				<p class="between-word bad-word">{trUpper(engine.round.canonical)}</p>
				{#if engine.round.answers.length > 1}
					<p class="between-alts">
						Diğer cevaplar: {engine.round.answers
							.filter((a) => a !== engine.round.canonical)
							.map(trUpper)
							.join(', ')}
					</p>
				{/if}
			{:else}
				<p class="between-title good-title">
					<Icon name="check" size={18} />
					{engine.lastOutcome === 'revealed' ? 'İpucuyla çözdün' : 'Doğru!'}
				</p>
				<p class="between-word good-word">{trUpper(engine.results.at(-1)?.word ?? '')}</p>
			{/if}
			<button class="btn" onclick={() => engine.advance()} title="Enter ile de geçebilirsin">
				{lastRound ? 'Sonuçlar' : 'Devam'}
				<Icon name="arrow-right" size={16} />
			</button>
		</div>
	{:else}
		<ResultScreen {engine} {onNewPractice} />
	{/if}
</div>

<style>
	.game {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		padding-top: 0.6rem;
	}

	.start {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
		/* Center in the free space, nudged up so it never hugs the footer. */
		margin: auto 0;
		padding: 1.2rem 0 10vh;
	}

	.quick-stats {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.2rem;
	}

	.qstat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		min-width: 5.2rem;
		padding: 0.6rem 0.9rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--bg-raised);
	}

	.qstat strong {
		font-size: 1.25rem;
		font-weight: 800;
		line-height: 1.1;
	}

	.qstat strong em {
		font-style: normal;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink-soft);
	}

	.qstat span {
		font-size: 0.72rem;
		color: var(--ink-soft);
	}

	h1 {
		margin: 0;
		font-size: 1.45rem;
		letter-spacing: -0.01em;
	}

	.sub {
		margin: 0;
		color: var(--ink-soft);
	}

	.relax-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		color: var(--ink-soft);
	}

	.relax-toggle input {
		accent-color: var(--accent);
		width: 1.1rem;
		height: 1.1rem;
	}

	.relax-toggle em {
		font-style: normal;
		font-weight: 400;
		font-size: 0.85rem;
	}

	.relax-toggle span {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.big {
		font-size: 1.15rem;
		padding: 0.85rem 2.6rem;
	}

	.resume-note {
		margin: 0;
		color: var(--ink-soft);
	}

	.challenge-note {
		margin: 0;
		padding: 0.5rem 1rem;
		border: 1px solid var(--warn);
		border-radius: var(--radius);
		background: var(--warn-soft);
		font-size: 0.92rem;
	}

	.between {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.7rem;
		text-align: center;
		/* Transient screen: center it in the free space like the start view. */
		margin: auto 0;
		padding: 1rem 0 12vh;
	}

	.between-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
	}

	.good-title {
		color: var(--good);
	}

	.between-word {
		margin: 0;
		font-size: 2.3rem;
		font-weight: 800;
		letter-spacing: 0.06em;
	}

	.good-word {
		color: var(--good);
	}

	.bad-word {
		color: var(--bad);
	}

	.between-alts {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}
</style>
