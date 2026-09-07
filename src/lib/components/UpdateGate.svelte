<script lang="ts">
	// Blocks play when the installed app is older than the minimum the site
	// still supports. Inert unless minVersion is set in data-version.json.
	import { updateRequired, openStoreListing } from '$lib/native';

	let required = $state<string | null>(null);

	$effect(() => {
		if (__MOBILE__) void updateRequired().then((v) => (required = v));
	});
</script>

{#if required}
	<div class="gate" role="alertdialog" aria-modal="true" aria-labelledby="gate-title">
		<div class="card">
			<h2 id="gate-title">Güncelleme gerekli</h2>
			<p>
				21kelime'nin bu sürümü artık desteklenmiyor. Oynamaya devam etmek için mağazadan son sürüme
				geç.
			</p>
			<button class="btn btn-primary" onclick={() => openStoreListing()}>Güncelle</button>
		</div>
	</div>
{/if}

<style>
	.gate {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background: var(--bg);
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		text-align: center;
		max-width: 22rem;
	}

	h2 {
		margin: 0;
		font-size: var(--fs-title);
	}

	p {
		margin: 0;
		color: var(--ink-soft);
	}
</style>
