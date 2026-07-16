/** Effective theme right now: explicit user choice wins, else light. */
export function effectiveTheme(): 'light' | 'dark' {
	if (typeof document === 'undefined') return 'light';
	const chosen = document.documentElement.dataset.theme;
	return chosen === 'dark' ? 'dark' : 'light';
}
