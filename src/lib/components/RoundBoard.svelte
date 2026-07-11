<script lang="ts">
	import type { GameEngine } from '$lib/game/engine.svelte';
	import { SECONDS_PER_ROUND } from '$lib/game/generate';
	import { trUpper } from '$lib/words/normalize';

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
		if (e.key === 'Backspace') {
			engine.backspace();
			e.preventDefault();
		} else if (e.key === ' ') {
			engine.shuffleRack();
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
				title="İpucu: sıradaki harfi aç"
			>
				💡 İpucu <strong>×{engine.revealsLeft}</strong>
			</button>
			<button class="chip" onclick={() => engine.shuffleRack()} title="Harfleri karıştır (boşluk)"
				>🔀</button
			>
			{#if !engine.relax}
				<button
					class="chip"
					onclick={() => engine.togglePause()}
					title={engine.paused ? 'Devam et' : 'Duraklat'}
				>
					{engine.paused ? '▶' : '⏸'}
				</button>
			{/if}
		</div>
	</div>

	{#if !engine.relax}
		<div class="timer" role="timer" aria-label="Kalan süre">
			<div class="timer-fill {timerClass}" style="width: {timerPct}%"></div>
		</div>
	{:else}
		<div class="relax-tag">🌙 rahat mod</div>
	{/if}

	{#if engine.paused}
		<div class="paused">
			<p>Oyun duraklatıldı</p>
			<button class="btn btn-primary" onclick={() => engine.togglePause()}>Devam et</button>
		</div>
	{:else}
		{#key engine.wrongShake}
			<div class="slots" class:shake={engine.wrongShake > 0}>
				{#each slots as slot, i (i)}
					<div class="slot {slot.kind}">{slot.letter ? trUpper(slot.letter) : ''}</div>
				{/each}
			</div>
		{/key}

		<div class="rack">
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
			⌫ Sil
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
		border: 1px solid var(--line);
		background: var(--bg-raised);
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
		font-size: 0.88rem;
	}

	.chip:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.timer {
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

	.relax-tag {
		font-size: 0.82rem;
		color: var(--ink-soft);
	}

	.paused {
		text-align: center;
		padding: 3rem 0;
	}

	.slots {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
		min-height: 3.4rem;
		margin-top: 0.6rem;
	}

	.slot {
		width: clamp(2.2rem, 9vw, 3.1rem);
		height: clamp(2.7rem, 11vw, 3.6rem);
		border-bottom: 3px solid var(--line);
		display: grid;
		place-items: center;
		font-size: clamp(1.3rem, 5.5vw, 1.7rem);
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
		animation: shake 0.4s;
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
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.2rem;
	}

	.tile {
		width: clamp(2.9rem, 12vw, 3.6rem);
		height: clamp(2.9rem, 12vw, 3.6rem);
		border-radius: 12px;
		background: var(--tile-bg);
		color: var(--tile-ink);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		font-size: clamp(1.35rem, 5.5vw, 1.7rem);
		font-weight: 800;
		transition:
			transform 0.08s ease,
			opacity 0.15s ease;
	}

	.tile:not(.used):hover {
		transform: translateY(-2px);
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
