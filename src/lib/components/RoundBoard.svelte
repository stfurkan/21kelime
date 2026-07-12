<script lang="ts">
	import type { GameEngine } from '$lib/game/engine.svelte';
	import { SECONDS_PER_ROUND } from '$lib/game/generate';
	import { trUpper } from '$lib/words/normalize';
	import Icon from './Icon.svelte';

	let { engine }: { engine: GameEngine } = $props();

	const timerPct = $derived((engine.secondsLeft / SECONDS_PER_ROUND) * 100);
	const timerClass = $derived(
		engine.secondsLeft <= 5 ? 'danger' : engine.secondsLeft <= 10 ? 'warn' : ''
	);

	const slots = $derived.by(() => {
		const canonical = [...engine.round.canonical];
		const out: { letter: string; kind: 'revealed' | 'typed' | 'empty' }[] = [];
		for (let i = 0; i < engine.wordLength; i++) {
			if (i < engine.revealedCount) {
				out.push({ letter: canonical[i], kind: 'revealed' });
			} else {
				const typedIdx = i - engine.revealedCount;
				const tileIdx = engine.inputTileIndices[typedIdx];
				out.push(
					tileIdx !== undefined
						? { letter: engine.tiles[tileIdx].letter, kind: 'typed' }
						: { letter: '', kind: 'empty' }
				);
			}
		}
		return out;
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		// Keys belong to an open dialog (help/stats), not to the board.
		if (document.querySelector('dialog[open]')) return;
		if (e.key === 'Backspace' || e.key === 'Delete') {
			engine.backspace();
			e.preventDefault();
		} else if (e.key === ' ') {
			engine.shuffleRack();
			e.preventDefault();
		} else if (e.key === 'Enter') {
			engine.submit();
			e.preventDefault();
		} else if (e.key === 'Escape') {
			engine.togglePause();
			e.preventDefault();
		} else if (e.key.length === 1) {
			engine.typeLetter(e.key);
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="board">
	<div class="topbar">
		<span class="counter"
			>{engine.roundIndex + 1}<span class="soft">/{engine.puzzle.rounds.length}</span></span
		>
		<div class="actions">
			<button
				class="chip"
				onclick={() => engine.reveal()}
				disabled={engine.revealsLeft <= 0 || engine.revealedCount >= engine.wordLength - 1}
				title="İpucu: sıradaki harfi açar"
			>
				<Icon name="bulb" size={17} /> İpucu <strong>{engine.revealsLeft}</strong>
			</button>
			<button
				class="chip icon-chip"
				onclick={() => engine.shuffleRack()}
				title="Harfleri karıştır (boşluk tuşu)"
				aria-label="Harfleri karıştır"
			>
				<Icon name="shuffle" size={17} />
			</button>
			{#if !engine.relax}
				<button
					class="chip icon-chip"
					onclick={() => engine.togglePause()}
					title={engine.paused ? 'Devam et' : 'Duraklat (Esc)'}
					aria-label={engine.paused ? 'Devam et' : 'Duraklat'}
				>
					<Icon name={engine.paused ? 'play' : 'pause'} size={17} />
				</button>
			{:else}
				<button
					class="chip"
					onclick={() => engine.skip()}
					aria-label="Bu turu geç, çözülmemiş sayılır"
					title="Bu turu geç: çözülmemiş sayılır, cevabı gösterir"
				>
					<Icon name="skip" size={15} /> Geç
				</button>
			{/if}
		</div>
	</div>

	{#if !engine.relax}
		<div class="timer-row" role="timer" aria-label="Kalan süre">
			<div class="timer">
				<div class="timer-fill {timerClass}" style="width: {timerPct}%"></div>
			</div>
			<span class="timer-secs {timerClass}">{Math.ceil(engine.secondsLeft)}</span>
		</div>
	{:else}
		<div class="relax-tag"><Icon name="no-timer" size={14} /> rahat mod</div>
	{/if}

	{#if engine.paused}
		<div class="paused">
			<p>Oyun duraklatıldı, harfler gizlendi.</p>
			<button class="btn btn-primary" onclick={() => engine.togglePause()}>Devam et</button>
		</div>
	{:else}
		<!-- Screen readers hear the word as it is built; sighted players see the slots. -->
		<p class="sr-only" aria-live="polite">
			{engine.currentWord ? trUpper(engine.currentWord) : ''}
		</p>

		{#key engine.wrongShake}
			<div
				class="slots"
				class:shake={engine.wrongShake > 0}
				style="--n: {engine.wordLength}"
				aria-hidden="true"
			>
				{#each slots as slot, i (i)}
					<div class="slot {slot.kind}">{slot.letter ? trUpper(slot.letter) : ''}</div>
				{/each}
			</div>
		{/key}

		<div class="rack" style="--n: {engine.tiles.length}">
			{#each engine.tiles as tile, i (i)}
				<button
					class="tile"
					class:used={tile.used}
					onclick={() => engine.pickTile(i)}
					disabled={tile.used}
					aria-label={`Harf ${trUpper(tile.letter)}`}
				>
					{trUpper(tile.letter)}
				</button>
			{/each}
		</div>

		<button
			class="erase"
			onclick={() => engine.backspace()}
			disabled={engine.inputTileIndices.length === 0}
		>
			<Icon name="backspace" size={17} /> Sil
		</button>
	{/if}
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.counter {
		font-size: 1.15rem;
		font-weight: 800;
	}

	.soft {
		color: var(--ink-soft);
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 0.45rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid var(--line);
		background: var(--bg-raised);
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
		font-size: 0.88rem;
	}

	.icon-chip {
		padding: 0.35rem 0.6rem;
	}

	.chip:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.timer-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.timer {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: var(--line);
		overflow: hidden;
	}

	.timer-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 3px;
		transition: width 0.1s linear;
	}

	.timer-fill.warn {
		background: var(--warn);
	}

	.timer-fill.danger {
		background: var(--bad);
	}

	.timer-secs {
		min-width: 2ch;
		text-align: right;
		font-size: 0.95rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		color: var(--ink-soft);
	}

	.timer-secs.warn {
		color: var(--warn);
	}

	.timer-secs.danger {
		color: var(--bad);
	}

	.relax-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.82rem;
		color: var(--ink-soft);
	}

	.paused {
		text-align: center;
		padding: 3rem 0;
	}

	/* Slots and rack always stay on one row; sizes derive from letter count. */
	.slots {
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		gap: 0.3rem;
		min-height: 3.2rem;
		margin-top: 0.6rem;
	}

	.slot {
		width: min(3.1rem, calc((100% - (var(--n) - 1) * 0.3rem) / var(--n)));
		aspect-ratio: 0.86;
		border-bottom: 3px solid var(--line);
		display: grid;
		place-items: center;
		font-size: min(1.6rem, calc(40vw / var(--n)));
		font-weight: 800;
	}

	.slot.revealed {
		color: var(--warn);
		border-bottom-color: var(--warn);
	}

	.slot.typed {
		border-bottom-color: var(--accent);
	}

	.shake {
		animation: shake 0.35s;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-7px);
		}
		40% {
			transform: translateX(7px);
		}
		60% {
			transform: translateX(-5px);
		}
		80% {
			transform: translateX(5px);
		}
	}

	.rack {
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		gap: 0.4rem;
		margin-top: 1.2rem;
	}

	.tile {
		width: min(3.6rem, calc((100% - (var(--n) - 1) * 0.4rem) / var(--n)));
		aspect-ratio: 1;
		/* On narrow screens 8-9 tiles get thin; keep a comfortable tap height. */
		min-height: 2.75rem;
		user-select: none;
		-webkit-user-select: none;
		border-radius: 12px;
		background: var(--tile-bg);
		color: var(--tile-ink);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		font-size: min(1.7rem, calc(44vw / var(--n)));
		font-weight: 800;
		transition:
			transform 0.08s ease,
			opacity 0.15s ease;
	}

	/* Touch browsers keep :hover stuck on the last tapped element, so the
	   lift only applies where a real pointer can hover. */
	@media (hover: hover) {
		.tile:not(.used):hover {
			transform: translateY(-2px);
		}
	}

	.tile:active {
		transform: scale(0.94);
	}

	.tile.used {
		opacity: 0.18;
		box-shadow: none;
		cursor: default;
	}

	.erase {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		align-self: center;
		margin-top: 0.4rem;
		color: var(--ink-soft);
		font-weight: 600;
		padding: 0.4rem 1rem;
		border-radius: 999px;
		border: 1px solid var(--line);
	}

	.erase:disabled {
		opacity: 0.35;
	}
</style>
