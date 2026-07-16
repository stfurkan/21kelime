<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { ui } from '$lib/ui.svelte';
	import HelpModal from '$lib/components/HelpModal.svelte';
	import StatsModal from '$lib/components/StatsModal.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { pruneOldDayStates } from '$lib/game/storage';
	import { initNative } from '$lib/native';

	let { children } = $props();

	// Housekeeping: cap localStorage growth from years of daily play.
	$effect(() => pruneOldDayStates());
	// No-op on the web; wires back button, status bar and haptics in the app.
	$effect(() => void initNative());

	const jsonLd =
		'<script type="application/ld+json">' +
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: '21kelime',
			url: 'https://21kelime.com',
			applicationCategory: 'GameApplication',
			operatingSystem: 'Web',
			inLanguage: 'tr',
			description:
				'Her gün 21 tur: süre dolmadan, karışık harflerin hepsini kullanıp geçerli bir kelime bulmalısın.',
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }
		}) +
		'<' +
		'/script>';
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="32x32" />
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<title>21kelime | Günlük Türkçe Kelime Oyunu</title>
	<meta
		name="description"
		content="Günlük Türkçe kelime oyunu. Her gün 21 tur: süre dolmadan, karışık harflerin hepsini kullanıp geçerli bir kelime bulmalısın."
	/>
	<meta property="og:title" content="21kelime | Günlük Türkçe Kelime Oyunu" />
	<meta
		property="og:description"
		content="Her gün 21 tur: süre dolmadan, karışık harflerin hepsini kullanıp geçerli bir kelime bulmalısın."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://21kelime.com" />
	<meta property="og:image" content="https://21kelime.com/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="21kelime: günlük Türkçe kelime oyunu" />
	<meta property="og:locale" content="tr_TR" />
	<meta name="twitter:card" content="summary_large_image" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD built from constants, no user input -->
	{@html jsonLd}
</svelte:head>

<div class="app">
	<header>
		<a class="logo" href={resolve('/')} aria-label="21kelime ana sayfa">
			<span class="logo-num">21</span><span class="logo-word">kelime</span>
		</a>
		<nav>
			{#if !__MOBILE__}
				<a href={resolve('/arsiv')}>Arşiv</a>
				<a href={resolve('/antrenman')}>Antrenman</a>
				<button
					onclick={() => (ui.statsOpen = true)}
					title="İstatistikler"
					aria-label="İstatistikler"
				>
					<Icon name="stats" />
				</button>
			{/if}
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

	<main class:with-tabbar={__MOBILE__}>
		{@render children()}
	</main>

	{#if !__MOBILE__}
		<footer>
			<span>Her gece yarısı yeni bulmaca (TSİ)</span>
			<nav class="legal-links">
				<a href={resolve('/gizlilik')}>Gizlilik</a>
				<a href={resolve('/kullanim-kosullari')}>Koşullar</a>
			</nav>
		</footer>
	{:else}
		<TabBar />
	{/if}
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

	/* Narrow phones (360dp Androids): tighten the header so all controls
	   stay on screen. */
	@media (max-width: 400px) {
		.app {
			padding: 0 0.75rem;
		}

		header {
			gap: 0.7rem;
		}

		.logo {
			font-size: 1.1rem;
		}

		nav {
			gap: 0.5rem;
		}

		nav a {
			font-size: 0.84rem;
		}
	}

	nav a {
		font-weight: 600;
		font-size: 0.92rem;
		color: var(--ink-soft);
	}

	@media (hover: hover) {
		nav a:hover {
			color: var(--accent);
		}
	}

	nav button {
		display: grid;
		place-items: center;
		color: var(--ink-soft);
		padding: 0.2rem;
	}

	@media (hover: hover) {
		nav button:hover {
			color: var(--accent);
		}
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem 0 2rem;
	}

	/* App builds: keep content clear of the fixed bottom tab bar. */
	main.with-tabbar {
		padding-bottom: calc(4.4rem + env(safe-area-inset-bottom));
	}

	footer {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 1rem 0 1.4rem;
		text-align: center;
		font-size: 0.78rem;
		color: var(--ink-soft);
	}

	.legal-links {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.legal-links a {
		color: var(--ink-soft);
	}

	@media (hover: hover) {
		.legal-links a:hover {
			color: var(--accent);
		}
	}
</style>
