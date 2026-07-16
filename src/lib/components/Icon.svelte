<script lang="ts" module>
	export type IconName =
		| 'bulb'
		| 'shuffle'
		| 'pause'
		| 'play'
		| 'backspace'
		| 'moon'
		| 'sun'
		| 'stats'
		| 'help'
		| 'close'
		| 'share'
		| 'check'
		| 'clock'
		| 'no-timer'
		| 'arrow-right'
		| 'skip'
		| 'today'
		| 'archive'
		| 'target';

	// Stroke-based, lucide-style paths on a 24x24 grid.
	const PATHS: Record<IconName, string> = {
		bulb: '<path d="M9 18h6M10 21.5h4M12 3a6 6 0 0 0-3.9 10.6c.6.5.9 1.2.9 2v.4h6v-.4c0-.8.3-1.5.9-2A6 6 0 0 0 12 3Z"/>',
		shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
		pause: '<path d="M9.5 5v14M14.5 5v14"/>',
		play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke-linejoin="round"/>',
		backspace:
			'<path d="M20 6H9.4a1 1 0 0 0-.8.4L4 12l4.6 5.6a1 1 0 0 0 .8.4H20a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z"/><path d="m11.5 9.5 5 5M16.5 9.5l-5 5"/>',
		moon: '<path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a7 7 0 0 0 9.7 9.7Z"/>',
		sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
		stats: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
		help: '<circle cx="12" cy="12" r="9.2"/><path d="M9.6 9.2a2.6 2.6 0 1 1 3.6 2.4c-.9.4-1.2 1-1.2 1.9"/><circle cx="12" cy="16.8" r="0.4" fill="currentColor"/>',
		close: '<path d="M18 6 6 18M6 6l12 12"/>',
		share: '<path d="M4 12.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6.5M16 7l-4-4-4 4M12 3v12"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
		clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 3.2"/>',
		'no-timer':
			'<circle cx="12" cy="13" r="8.2"/><path d="M9.5 2.2h5M12 9.5V13"/><path d="m4 5.5 15.5 15"/>',
		'arrow-right': '<path d="M4 12h16M13 5l7 7-7 7"/>',
		skip: '<path d="M5 5.5v13l9-6.5z" fill="currentColor" stroke-linejoin="round"/><path d="M18 5.5v13"/>',
		today:
			'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M8 3v4M16 3v4M3.5 10.5h17"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none"/>',
		archive:
			'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13.5h4"/>',
		target:
			'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>'
	};
</script>

<script lang="ts">
	let { name, size = 20 }: { name: IconName; size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2.1"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static icon paths, no user input -->
	{@html PATHS[name]}
</svg>

<style>
	svg {
		display: block;
		flex-shrink: 0;
	}
</style>
