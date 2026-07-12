<script lang="ts">
	import { resolve } from '$app/paths';
	import { istanbulToday, dayNumberOf, dateOfDay } from '$lib/game/daily';
	import { loadDayState } from '$lib/game/storage';
	import { scoreOf } from '$lib/game/share';

	interface Entry {
		day: number;
		date: string;
		label: string;
		status: string;
	}

	// Newest days first, loaded in batches so the page stays fast even
	// after years of puzzles (day 1000 would otherwise mean a thousand
	// rows and a thousand localStorage reads on open).
	const BATCH = 30;

	let todayNum = $state(0);
	let shown = $state(BATCH);
	let entries = $state<Entry[]>([]);

	const fmt = new Intl.DateTimeFormat('tr-TR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});

	// Built client-side: played-status lives in localStorage.
	$effect(() => {
		todayNum = dayNumberOf(istanbulToday());
		const first = todayNum;
		const last = Math.max(1, todayNum - shown + 1);
		const list: Entry[] = [];
		for (let day = first; day >= last; day--) {
			const date = dateOfDay(day);
			const saved = loadDayState(date);
			let status = '';
			if (saved?.done) status = `${scoreOf(saved.results)}/21`;
			else if (saved && saved.results.length > 0)
				status = `devam ediyor (${saved.results.length}/21)`;
			list.push({ day, date, label: fmt.format(new Date(`${date}T00:00:00Z`)), status });
		}
		entries = list;
	});

	const remaining = $derived(Math.max(0, todayNum - shown));
</script>

<svelte:head>
	<title>Arşiv | 21kelime</title>
</svelte:head>

<h1>Arşiv</h1>
<p class="sub">
	Geçmiş bulmacaları oynayabilirsin. Seri ve istatistikler yalnızca günün bulmacasında işlenir.
</p>

<ul class="list">
	{#each entries as e (e.day)}
		<li>
			<a href={e.day === todayNum ? resolve('/') : resolve('/arsiv/[date]', { date: e.date })}>
				<span class="day">#{e.day}</span>
				<span class="date">{e.label}</span>
				<span class="status" class:done={e.status.includes('/21') && !e.status.includes('devam')}>
					{e.status || 'oynanmadı'}
				</span>
			</a>
		</li>
	{/each}
</ul>

{#if remaining > 0}
	<button class="btn more" onclick={() => (shown += BATCH)}>
		Daha eski günleri göster ({remaining} gün kaldı)
	</button>
{/if}

<style>
	h1 {
		font-size: 1.4rem;
		margin: 0.4rem 0 0.2rem;
	}

	.sub {
		color: var(--ink-soft);
		font-size: 0.9rem;
		margin-top: 0;
	}

	.list {
		list-style: none;
		padding: 0;
		margin: 0.6rem 0 0;
		display: grid;
		gap: 0.5rem;
	}

	.list a {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--bg-raised);
		color: var(--ink);
	}

	@media (hover: hover) {
		.list a:hover {
			border-color: var(--accent);
		}
	}

	.day {
		font-weight: 800;
		color: var(--accent);
		min-width: 3rem;
	}

	.date {
		flex: 1;
	}

	.status {
		font-size: 0.85rem;
		color: var(--ink-soft);
	}

	.status.done {
		color: var(--good);
		font-weight: 700;
	}

	.more {
		display: block;
		margin: 1rem auto 0;
	}
</style>
