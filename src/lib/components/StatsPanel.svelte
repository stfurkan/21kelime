<script lang="ts">
	import type { Stats } from '$lib/game/storage';

	let { stats }: { stats: Stats } = $props();

	const pct = $derived(
		stats.roundsPlayed > 0 ? Math.round((stats.roundsSolved / stats.roundsPlayed) * 100) : 0
	);
</script>

<div class="grid">
	<div class="stat">
		<div class="num">{stats.gamesPlayed}</div>
		<div class="label">Oyun</div>
	</div>
	<div class="stat">
		<div class="num">{pct}<span class="unit">%</span></div>
		<div class="label">Çözüm oranı</div>
	</div>
	<div class="stat">
		<div class="num">{stats.currentStreak}</div>
		<div class="label">Güncel seri</div>
	</div>
	<div class="stat">
		<div class="num">{stats.maxStreak}</div>
		<div class="label">En uzun seri</div>
	</div>
	<div class="stat wide">
		<div class="num">{stats.bestScore}<span class="unit">/21</span></div>
		<div class="label">En iyi skor</div>
	</div>
</div>
<p class="note">İstatistikler yalnızca günün bulmacası için sayılır ve bu cihazda saklanır.</p>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
		margin-top: 0.6rem;
	}

	.stat {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 0.8rem;
		text-align: center;
	}

	.wide {
		grid-column: span 2;
	}

	.num {
		font-size: 1.7rem;
		font-weight: 800;
		color: var(--accent);
	}

	.unit {
		font-size: 1rem;
		color: var(--ink-soft);
	}

	.label {
		font-size: 0.8rem;
		color: var(--ink-soft);
	}

	.note {
		font-size: 0.78rem;
		color: var(--ink-soft);
		margin-bottom: 0;
	}
</style>
