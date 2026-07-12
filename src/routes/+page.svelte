<script lang="ts">
	import Game from '$lib/components/Game.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<link rel="canonical" href="https://21kelime.com/" />
</svelte:head>

{#key data.wire.date}
	<Game wire={data.wire} mode="daily" />
{/key}
