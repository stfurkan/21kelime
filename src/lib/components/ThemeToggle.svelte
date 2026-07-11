<script lang="ts">
	import { browser } from '$app/environment';
	import Icon from './Icon.svelte';

	// Effective theme right now (explicit choice wins, else system preference).
	let effective = $state<'light' | 'dark'>('light');

	function compute(): 'light' | 'dark' {
		const chosen = document.documentElement.dataset.theme;
		if (chosen === 'light' || chosen === 'dark') return chosen;
		return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	$effect(() => {
		effective = compute();
		const mq = matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => (effective = compute());
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
		aria-label={effective === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
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
