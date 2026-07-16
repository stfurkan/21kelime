<script lang="ts">
	import { resolve } from '$app/paths';
	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import { loadStats, EMPTY_STATS, type Stats } from '$lib/game/storage';

	// Client-only data, read after mount so server HTML stays stable.
	// eslint-disable-next-line svelte/prefer-writable-derived -- deliberate mount-time read of localStorage
	let stats: Stats = $state({ ...EMPTY_STATS });

	$effect(() => {
		stats = loadStats();
	});
</script>

<svelte:head>
	<title>İstatistikler | 21kelime</title>
</svelte:head>

<h1>İstatistikler</h1>
<StatsPanel {stats} />

<div class="about">
	<p>21kelime · günlük Türkçe kelime oyunu</p>
	<nav>
		<a href={resolve('/gizlilik')}>Gizlilik</a>
		<a href={resolve('/kullanim-kosullari')}>Koşullar</a>
	</nav>
</div>

<style>
	h1 {
		font-size: 1.4rem;
		margin: 0.4rem 0 0.2rem;
	}

	.about {
		margin-top: 2.2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
		text-align: center;
		font-size: 0.8rem;
		color: var(--ink-soft);
	}

	.about p {
		margin: 0 0 0.3rem;
	}

	.about nav {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.about a {
		color: var(--ink-soft);
		text-decoration: underline;
	}
</style>
