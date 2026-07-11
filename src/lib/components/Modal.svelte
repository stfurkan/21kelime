<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		children
	}: { open?: boolean; title: string; children: Snippet } = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={(e) => {
		if (e.target === dialog) open = false;
	}}
>
	<div class="body">
		<div class="head">
			<h2>{title}</h2>
			<button class="close" onclick={() => (open = false)} aria-label="Kapat">✕</button>
		</div>
		{@render children()}
	</div>
</dialog>

<style>
	dialog {
		margin: auto;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--bg-raised);
		color: var(--ink);
		padding: 0;
		max-width: min(26rem, calc(100vw - 2rem));
		width: 100%;
		box-shadow: var(--shadow);
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
	}

	.body {
		padding: 1.1rem 1.3rem 1.3rem;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.close {
		color: var(--ink-soft);
		font-size: 1rem;
		padding: 0.3rem;
	}
</style>
