<script lang="ts">
	import { browser } from '$app/environment';
	import { effectiveTheme } from '$lib/theme';
	import Icon from './Icon.svelte';

	let effective = $state<'light' | 'dark'>('light');

	$effect(() => {
		effective = effectiveTheme();
		const mq = matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => (effective = effectiveTheme());
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	function toggle() {
		const next = effective === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem('21kelime:theme', next);
		} catch {
			// storage blocked: theme still applies for this visit
		}
		effective = next;
	}
</script>

{#if browser}
	<button
		onclick={toggle}
		title={effective === 'dark' ? 'Açık tema' : 'Koyu tema'}
		aria-label={effective === 'dark' ? 'Açık temayı kullan' : 'Koyu temayı kullan'}
	>
		<Icon name={effective === 'dark' ? 'sun' : 'moon'} />
	</button>
{/if}

<style>
	button {
		display: grid;
		place-items: center;
		color: var(--ink-soft);
		padding: 0.2rem;
	}

	button:hover {
		color: var(--accent);
	}
</style>
