<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import AppBadges from '$lib/components/AppBadges.svelte';

	const APP_STORE = 'https://apps.apple.com/tr/app/id6791340807';
	const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.kelime21.app';

	let redirecting = $state(false);

	onMount(() => {
		const ua = navigator.userAgent;
		// iPadOS 13+ presents itself as a Mac; the touch points give it away.
		const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
		const target = /Android/i.test(ua)
			? PLAY_STORE
			: /iPhone|iPad|iPod/i.test(ua) || iPadOS
				? APP_STORE
				: null;
		if (!target) return;
		redirecting = true;
		// replace(), not assign(): Back should return where they came from,
		// not bounce them into the store again.
		location.replace(target);
	});
</script>

<svelte:head>
	<title>21kelime'yi indir</title>
	<meta name="description" content="21kelime'yi App Store veya Google Play'den indir." />
	<!-- A redirect target for links and ads, not a page worth indexing. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="indir">
	<h1>21kelime'yi indir</h1>
	{#if redirecting}
		<p class="sub">Mağazaya yönlendiriliyorsun…</p>
	{:else}
		<p class="sub">Günlük Türkçe kelime oyunu. Telefonun için ücretsiz.</p>
	{/if}

	<AppBadges />

	<p class="web">
		Uygulama istemiyorsan
		<a href={resolve('/')}>tarayıcıdan da oynayabilirsin</a>.
	</p>
</div>

<style>
	.indir {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		text-align: center;
		margin: auto 0;
		padding: 2rem 0;
	}

	h1 {
		margin: 0;
		font-size: var(--fs-title);
		letter-spacing: -0.01em;
	}

	.sub {
		margin: 0;
		color: var(--ink-soft);
	}

	.web {
		margin: 0.4rem 0 0;
		font-size: 0.85rem;
		color: var(--ink-soft);
	}

	.web a {
		color: var(--accent);
		font-weight: 600;
	}
</style>
