/** Effective theme right now: explicit user choice wins, else system preference. */
export function effectiveTheme(): 'light' | 'dark' {
	if (typeof document === 'undefined') return 'light';
	const chosen = document.documentElement.dataset.theme;
	if (chosen === 'light' || chosen === 'dark') return chosen;
	return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
