<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { ui } from '$lib/ui.svelte';
	import HelpModal from '$lib/components/HelpModal.svelte';
	import StatsModal from '$lib/components/StatsModal.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>21kelime | Günlük Türkçe Kelime Oyunu</title>
	<meta
		name="description"
		content="Her gün 21 kelime: karışık harflerden kelimeyi bul! Türkçe günlük kelime bulmaca oyunu."
	/>
	<meta property="og:title" content="21kelime | Günlük Türkçe Kelime Oyunu" />
	<meta
		property="og:description"
		content="Her gün 21 tur: karışık harflerden, tüm harfleri kullanarak kelimeyi bul. Süreye karşı!"
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://21kelime.com" />
	<meta property="og:image" content="https://21kelime.com/icon-512.png" />
	<meta property="og:locale" content="tr_TR" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="app">
	<header>
		<a class="logo" href={resolve('/')} aria-label="21kelime ana sayfa">
			<span class="logo-num">21</span><span class="logo-word">kelime</span>
		</a>
		<nav>
			<a href={resolve('/arsiv')}>Arşiv</a>
			<a href={resolve('/antrenman')}>Antrenman</a>
			<button
				onclick={() => (ui.statsOpen = true)}
				title="İstatistikler"
				aria-label="İstatistikler"
			>
				<Icon name="stats" />
			</button>
			<button
				onclick={() => (ui.helpOpen = true)}
				title="Nasıl oynanır?"
				aria-label="Nasıl oynanır?"
			>
				<Icon name="help" />
			</button>
			<ThemeToggle />
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<span>Her gece yarısı yeni bulmaca (TSİ)</span>
	</footer>
</div>

<HelpModal />
<StatsModal />

<style>
	.app {
		max-width: 32rem;
		margin: 0 auto;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: 0 1rem;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.2rem;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--line);
	}

	.logo {
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--ink);
	}

	.logo-num {
		color: var(--accent);
	}

	nav {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}

	nav a {
		font-weight: 600;
		font-size: 0.92rem;
		color: var(--ink-soft);
	}

	nav a:hover {
		color: var(--accent);
	}

	nav button {
		display: grid;
		place-items: center;
		color: var(--ink-soft);
		padding: 0.2rem;
	}

	nav button:hover {
		color: var(--accent);
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem 0 2rem;
	}

	footer {
		padding: 1rem 0 1.4rem;
		text-align: center;
		font-size: 0.78rem;
		color: var(--ink-soft);
	}
</style>
