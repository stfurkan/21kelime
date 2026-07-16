<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Icon, { type IconName } from './Icon.svelte';

	const tabs: { href: string; label: string; icon: IconName; isActive: (p: string) => boolean }[] =
		[
			{ href: resolve('/'), label: 'Bugün', icon: 'today', isActive: (p) => p === '/' },
			{
				href: resolve('/arsiv'),
				label: 'Arşiv',
				icon: 'archive',
				isActive: (p) => p.startsWith('/arsiv')
			},
			{
				href: resolve('/antrenman'),
				label: 'Antrenman',
				icon: 'target',
				isActive: (p) => p.startsWith('/antrenman')
			},
			{
				href: resolve('/istatistik'),
				label: 'İstatistik',
				icon: 'stats',
				isActive: (p) => p.startsWith('/istatistik')
			}
		];
</script>

<nav class="tabbar" aria-label="Ana gezinme">
	{#each tabs as tab (tab.href)}
		{@const active = tab.isActive(page.url.pathname)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefs are resolve()d in the tabs array above -->
		<a href={tab.href} class:active aria-current={active ? 'page' : undefined}>
			<Icon name={tab.icon} size={23} />
			<span>{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.tabbar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		display: flex;
		background: var(--bg-raised);
		border-top: 1px solid var(--line);
		padding-bottom: env(safe-area-inset-bottom);
	}

	a {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.5rem 0 0.55rem;
		color: var(--ink-soft);
		font-size: 0.66rem;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
	}

	a.active {
		color: var(--accent);
	}

	a:active {
		opacity: 0.7;
	}
</style>
