<script lang="ts">
	import Game from '$lib/components/Game.svelte';
	import type { WirePuzzle } from '$lib/game/types';

	let wire = $state<WirePuzzle | null>(null);
	let generation = $state(0);
	let failed = $state(false);

	async function fetchPractice() {
		wire = null;
		failed = false;
		try {
			const res = await fetch('/api/practice');
			if (!res.ok) throw new Error();
			wire = await res.json();
			generation += 1;
		} catch {
			failed = true;
		}
	}

	$effect(() => {
		fetchPractice();
	});
</script>

<svelte:head>
	<title>Antrenman | 21kelime</title>
</svelte:head>

{#if failed}
	<div class="fallback">
		<p>Antrenman yüklenemedi.</p>
		<button class="btn" onclick={fetchPractice}>Tekrar dene</button>
	</div>
{:else if wire}
	{#key generation}
		<Game {wire} mode="practice" onNewPractice={fetchPractice} />
	{/key}
{:else}
	<div class="fallback"><p>Yükleniyor…</p></div>
{/if}

<style>
	.fallback {
		text-align: center;
		padding-top: 3rem;
		color: var(--ink-soft);
	}
</style>
