/**
 * Page background per theme. Must track --bg in app.css; the status bar
 * and the browser chrome are painted from here.
 */
export const THEME_BG = { light: '#faf7f2', dark: '#14110e' } as const;

/** Effective theme right now: explicit user choice wins, else light. */
export function effectiveTheme(): 'light' | 'dark' {
	if (typeof document === 'undefined') return 'light';
	const chosen = document.documentElement.dataset.theme;
	return chosen === 'dark' ? 'dark' : 'light';
}

/**
 * Point the browser chrome at the page background.
 *
 * A single fixed theme-color left the Android address bar and the iOS
 * standalone status bar teal, against a page that is cream or near-black.
 */
export function syncThemeColor(): void {
	if (typeof document === 'undefined') return;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute('content', THEME_BG[effectiveTheme()]);
}
