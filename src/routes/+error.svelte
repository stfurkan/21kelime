<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>{page.status} | 21kelime</title>
</svelte:head>

<div class="error">
	<p class="code">{page.status}</p>
	<p class="msg">
		{page.status === 404
			? 'Aradığın sayfa yok. Belki de harfleri karıştırdın?'
			: 'Bir şeyler ters gitti.'}
	</p>
	<a class="btn btn-primary" href={resolve('/')}>Günün bulmacasına dön</a>
</div>

<style>
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
		padding-top: 4rem;
		text-align: center;
	}

	.code {
		margin: 0;
		font-size: 4rem;
		font-weight: 800;
		color: var(--accent);
		line-height: 1;
	}

	.msg {
		margin: 0;
		color: var(--ink-soft);
	}
</style>
