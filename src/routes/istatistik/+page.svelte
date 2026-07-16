<script lang="ts">
	import { resolve } from '$app/paths';
	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import { loadStats, EMPTY_STATS, type Stats } from '$lib/game/storage';
	import { remindersEnabled, setRemindersEnabled } from '$lib/native';

	// Client-only data, read after mount so server HTML stays stable.
	// eslint-disable-next-line svelte/prefer-writable-derived -- deliberate mount-time read of localStorage
	let stats: Stats = $state({ ...EMPTY_STATS });
	let reminderOn = $state(false);
	let permissionDenied = $state(false);

	$effect(() => {
		stats = loadStats();
		reminderOn = remindersEnabled();
	});

	async function toggleReminder(e: Event) {
		const wanted = (e.currentTarget as HTMLInputElement).checked;
		const result = await setRemindersEnabled(wanted);
		reminderOn = result;
		permissionDenied = wanted && !result;
	}
</script>

<svelte:head>
	<title>İstatistikler | 21kelime</title>
</svelte:head>

<h1>İstatistikler</h1>
<StatsPanel {stats} />

{#if __MOBILE__}
	<section class="reminder">
		<label>
			<input type="checkbox" checked={reminderOn} onchange={toggleReminder} />
			<span>Günlük hatırlatıcı <em>(10:00)</em></span>
		</label>
		<p class="reminder-note">
			{#if permissionDenied}
				Bildirim izni kapalı. Telefonun ayarlarından 21kelime için bildirimleri açman gerekiyor.
			{:else}
				Günün bulmacasını çözmediysen sabah 10'da kısa bir hatırlatma gönderir.
			{/if}
		</p>
	</section>
{/if}

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

	.reminder {
		margin-top: 1.4rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--bg-raised);
		padding: 0.9rem 1rem;
	}

	.reminder label {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-weight: 700;
	}

	.reminder input {
		width: 1.15rem;
		height: 1.15rem;
		accent-color: var(--accent);
	}

	.reminder em {
		font-style: normal;
		font-weight: 600;
		color: var(--ink-soft);
	}

	.reminder-note {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		color: var(--ink-soft);
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
