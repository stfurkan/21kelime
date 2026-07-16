<script lang="ts">
	import Modal from './Modal.svelte';
	import StatsPanel from './StatsPanel.svelte';
	import { ui } from '$lib/ui.svelte';
	import { loadStats, EMPTY_STATS, type Stats } from '$lib/game/storage';

	let stats: Stats = $state({ ...EMPTY_STATS });

	// Re-read whenever the modal opens (stats may have changed after a game).
	$effect(() => {
		if (ui.statsOpen) stats = loadStats();
	});
</script>

<Modal bind:open={ui.statsOpen} title="İstatistikler">
	<StatsPanel {stats} />
</Modal>
