<script lang="ts">
	import Game from '$lib/components/Game.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>#{data.wire.day} — 21kelime arşiv</title>
</svelte:head>

{#key data.wire.date}
	<Game wire={data.wire} mode="archive" />
{/key}
