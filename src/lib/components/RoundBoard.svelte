<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { GameEngine } from '$lib/game/engine.svelte';
	import { SECONDS_PER_ROUND } from '$lib/game/generate';
	import { trUpper } from '$lib/words/normalize';
	import { hapticTap, hapticOutcome } from '$lib/native';
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

	// A wrong full word shakes the board and buzzes in the app. This must
	// react to an *increase* only: the board remounts on every round and on
	// unpause, and a plain `wrongShake > 0` test fired again on each mount,
	// so a fresh round opened mid-shake with a failure buzz.
	let shaking = $state(false);
	// Read once, on purpose: this is the baseline a remount compares against.
	// svelte-ignore state_referenced_locally
	let seenShake = engine.wrongShake;
	let shakeTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const n = engine.wrongShake;
		if (n === seenShake) return;
		seenShake = n;
		if (n === 0) return; // a new round reset the counter
		shaking = true;
		hapticOutcome('error');
		if (shakeTimer) clearTimeout(shakeTimer);
		shakeTimer = setTimeout(() => (shaking = false), 400);
	});

	onDestroy(() => {
		if (shakeTimer) clearTimeout(shakeTimer);
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
				onclick={() => {
					hapticTap();
					engine.reveal();
				}}
				disabled={engine.revealsLeft <= 0 || engine.revealedCount >= engine.wordLength - 1}
				title="İpucu: sıradaki harfi açar"
			>
				<Icon name="bulb" size={17} /> İpucu <strong>{engine.revealsLeft}</strong>
			</button>
			<button
				class="chip icon-chip"
				onclick={() => {
					hapticTap();
					engine.shuffleRack();
				}}
				title="Harfleri karıştır (boşluk tuşu)"
				aria-label="Harfleri karıştır"
			>
				<Icon name="shuffle" size={17} />
			</button>
			{#if !engine.relax}
				<button
					class="chip icon-chip"
					onclick={() => {
						hapticTap();
						engine.togglePause();
					}}
					title={engine.paused ? 'Devam et' : 'Duraklat (Esc)'}
					aria-label={engine.paused ? 'Devam et' : 'Duraklat'}
				>
					<Icon name={engine.paused ? 'play' : 'pause'} size={17} />
				</button>
			{:else}
				<button
					class="chip"
					onclick={() => {
						hapticTap();
						engine.skip();
					}}
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
			<button
				class="btn btn-primary"
				onclick={() => {
					hapticTap();
					engine.togglePause();
				}}>Devam et</button
			>
		</div>
	{:else}
		<!-- Screen readers hear the word as it is built; sighted players see the slots. -->
		<p class="sr-only" aria-live="polite">
			{engine.currentWord ? trUpper(engine.currentWord) : ''}
		</p>

		<div class="play">
			{#key engine.wrongShake}
				<div class="slots" class:shake={shaking} style="--n: {engine.wordLength}">
					{#each slots as slot, i (i)}
						{#if slot.kind === 'typed'}
							<!-- Tapping a typed letter takes it and everything after it back. -->
							<button
								class="slot typed"
								onclick={() => {
									hapticTap();
									engine.eraseFrom(i - engine.revealedCount);
								}}
								title="Bu harfi ve sonrasını geri al"
								aria-label={`${trUpper(slot.letter)} harfini ve sonrasını geri al`}
							>
								{trUpper(slot.letter)}
							</button>
						{:else}
							<div class="slot {slot.kind}" aria-hidden="true">
								{slot.letter ? trUpper(slot.letter) : ''}
							</div>
						{/if}
					{/each}
				</div>
			{/key}

			<div class="rack" style="--n: {engine.tiles.length}">
				{#each engine.tiles as tile, i (i)}
					<button
						class="tile"
						class:used={tile.used}
						onclick={() => {
							hapticTap();
							engine.pickTile(i);
						}}
						disabled={tile.used}
						aria-label={`Harf ${trUpper(tile.letter)}`}
					>
						{trUpper(tile.letter)}
					</button>
				{/each}
			</div>

			<button
				class="erase"
				onclick={() => {
					hapticTap();
					engine.backspace();
				}}
				disabled={engine.inputTileIndices.length === 0}
			>
				<Icon name="backspace" size={17} /> Sil
			</button>
		</div>
	{/if}
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		/* The board is a fixed geometry surface: opt it out of automatic
		   text inflation. The rest of the app still scales with the reader's
		   preference. */
		text-size-adjust: 100%;
		-webkit-text-size-adjust: 100%;
		gap: 1rem;
		/* Status (counter, timer, controls) stays pinned at the top where
		   it is glanceable; the play surface centers in the rest. */
		flex: 1;
		position: relative;
	}

	/* Dead center of the play area, independent of the status bar above. */
	.play {
		display: flex;
		flex-direction: column;
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		transform: translateY(-50%);
	}

	/* Short viewports (landscape phones, small windows): flow normally so
	   the play surface can never slide under the status row. */
	@media (max-height: 560px) {
		.play {
			position: static;
			transform: none;
			margin: auto 0;
		}
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.counter {
		font-size: var(--fs-lead);
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
		font-size: calc(var(--fs-lead) * 0.85);
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
		margin: auto 0;
	}

	/* Touch devices: comfortable 44px-class targets for the round
	   controls; desktop keeps the compact chips. */
	@media (pointer: coarse) {
		.chip {
			padding: 0.6rem 0.95rem;
			font-size: 0.95rem;
		}

		.icon-chip {
			padding: 0.6rem 0.75rem;
		}

		.erase {
			padding: 0.55rem 1.2rem;
			font-size: 0.95rem;
		}
	}

	/* Slots and rack always stay on one row; sizes derive from letter count.
	   Box geometry is px, not rem, on purpose: an OS "larger text" setting
	   scales rem and inflates the glyph, but a box capped by the available
	   room cannot grow to match, so the letter spilled outside it. Geometry
	   holds still and the glyph is sized from the box instead. */
	.slots {
		--gap: 5px;
		--slot-cap: 50px;
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		gap: var(--gap);
		min-height: 3.2rem;
		margin-top: 0.6rem;
	}

	.slot {
		width: min(var(--slot-cap), calc((100% - (var(--n) - 1) * var(--gap)) / var(--n)));
		aspect-ratio: 0.86;
		border-bottom: 3px solid var(--line);
		display: grid;
		place-items: center;
		font-size: min(26px, calc(40vw / var(--n)));
		/* Turkish capitals carry marks above (Ğ Ü Ö İ) and cedillas below
		   (Ş Ç); keep them on one tight line and clip rather than reflow. */
		line-height: 1;
		overflow: hidden;
		font-weight: 800;
	}

	.slot.revealed {
		color: var(--warn);
		border-bottom-color: var(--warn);
	}

	.slot.typed {
		border-bottom-color: var(--accent);
	}

	/* Signal that typed letters are tappable: they take themselves back. */
	@media (hover: hover) {
		.slot.typed:hover {
			color: var(--bad);
			border-bottom-color: var(--bad);
		}
	}

	.slot.typed:active {
		transform: scale(0.92);
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
		--gap: 6px;
		--tile-cap: 58px;
		--tile-min-h: 44px;
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		gap: var(--gap);
		margin-top: 1.2rem;
	}

	.tile {
		width: min(var(--tile-cap), calc((100% - (var(--n) - 1) * var(--gap)) / var(--n)));
		aspect-ratio: 1;
		/* On narrow screens 8-9 tiles get thin; keep a comfortable tap height. */
		min-height: var(--tile-min-h);
		user-select: none;
		-webkit-user-select: none;
		border-radius: 12px;
		background: var(--tile-bg);
		color: var(--tile-ink);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		font-size: min(27px, calc(44vw / var(--n)));
		line-height: 1;
		overflow: hidden;
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

	/* Tall screens: scale the board up so it uses the room instead of
	   hugging the top. Sizes only; the layout stays anchored so tiles
	   never shift position between rounds. */
	@media (min-height: 640px) {
		.board {
			gap: 1.4rem;
			padding-top: 0.8rem;
		}

		.slots {
			--slot-cap: 58px;
			margin-top: 1.4rem;
			min-height: 3.8rem;
		}

		.slot {
			font-size: min(30px, calc(44vw / var(--n)));
		}

		.rack {
			--gap: 8px;
			--tile-cap: 67px;
			--tile-min-h: 50px;
			margin-top: 2.2rem;
		}

		.tile {
			font-size: min(32px, calc(46vw / var(--n)));
		}

		.erase {
			margin-top: 1.4rem;
		}
	}

	/* Tablets: scale the board with the wider container from the layout, so
	   an iPad gets a real board instead of phone-sized tiles floating in the
	   middle of the screen. Must stay above the @supports block below, which
	   reads these caps to size the glyph. */
	@media (min-width: 700px) and (min-height: 700px) {
		.slots {
			--slot-cap: 72px;
			--gap: 7px;
			margin-top: 1.8rem;
			min-height: 4.6rem;
		}

		.slot {
			font-size: min(38px, calc(44vw / var(--n)));
		}

		.rack {
			--gap: 10px;
			--tile-cap: 82px;
			--tile-min-h: 60px;
			margin-top: 2.6rem;
		}

		.tile {
			font-size: min(40px, calc(46vw / var(--n)));
		}

		.erase {
			margin-top: 1.8rem;
		}
	}

	/* Derive the glyph from the box it sits in rather than from the root
	   font size, so the two can never drift apart. The px cap keeps short
	   words looking exactly as before; the container term takes over on the
	   crowded 8- and 9-letter rounds, which is where letters overflowed. */
	@supports (font-size: 1cqi) {
		.slots,
		.rack {
			container-type: inline-size;
		}

		.slot {
			font-size: min(
				calc(var(--slot-cap) * 0.52),
				calc((100cqi - (var(--n) - 1) * var(--gap)) * 0.52 / var(--n))
			);
		}

		.tile {
			font-size: min(
				calc(var(--tile-cap) * 0.52),
				calc((100cqi - (var(--n) - 1) * var(--gap)) * 0.52 / var(--n))
			);
		}
	}
</style>
