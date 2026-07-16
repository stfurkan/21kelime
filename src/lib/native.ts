/**
 * Native (Capacitor) integrations for the mobile build. Every export is
 * a no-op in web builds: the __MOBILE__ guard turns the Capacitor
 * imports into dead code there, so none of this reaches the web bundle.
 */
import { effectiveTheme } from '$lib/theme';

// Status bar background matches the app background (--bg) per theme.
const BAR_BG = { light: '#faf7f2', dark: '#14110e' } as const;

/** One-time app setup: back button, status bar, theme observer. */
export async function initNative(): Promise<void> {
	if (!__MOBILE__) return;
	// Native feel: no rubber-band overscroll, no long-press text selection.
	document.documentElement.classList.add('native');
	const { App } = await import('@capacitor/app');
	// Android hardware back: navigate back in history; at the root,
	// background the app instead of killing it mid-round.
	App.addListener('backButton', ({ canGoBack }) => {
		if (canGoBack) history.back();
		else App.minimizeApp();
	});
	await syncStatusBar();
	// Follow theme changes (toggle writes data-theme on <html>).
	new MutationObserver(() => void syncStatusBar()).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme']
	});
}

async function syncStatusBar(): Promise<void> {
	if (!__MOBILE__) return;
	try {
		const { StatusBar, Style } = await import('@capacitor/status-bar');
		const theme = effectiveTheme();
		await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
		// Android only; throws on iOS, where the style alone is enough.
		await StatusBar.setBackgroundColor({ color: BAR_BG[theme] });
	} catch {
		// Status bar API unavailable: cosmetic, ignore.
	}
}

let hapticsModule: Promise<typeof import('@capacitor/haptics')> | null = null;

/** Light tap feedback on tile presses; fire and forget. */
export function hapticTap(): void {
	if (!__MOBILE__) return;
	hapticsModule ??= import('@capacitor/haptics');
	hapticsModule
		.then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
		.catch(() => {});
}

/** Success/failure feedback on round outcomes; fire and forget. */
export function hapticOutcome(kind: 'success' | 'error'): void {
	if (!__MOBILE__) return;
	hapticsModule ??= import('@capacitor/haptics');
	hapticsModule
		.then(({ Haptics, NotificationType }) =>
			Haptics.notification({
				type: kind === 'success' ? NotificationType.Success : NotificationType.Error
			})
		)
		.catch(() => {});
}

/**
 * Open an external page in the in-app browser sheet (SFSafariViewController
 * on iOS, Custom Tabs on Android) instead of leaving the app.
 */
export function openExternal(url: string): void {
	if (!__MOBILE__) return;
	import('@capacitor/browser').then(({ Browser }) => Browser.open({ url })).catch(() => {});
}

/** Share plain text through the native sheet. */
export async function nativeShareText(text: string): Promise<boolean> {
	if (!__MOBILE__) return false;
	const { Share } = await import('@capacitor/share');
	await Share.share({ text });
	return true;
}

/** Share a PNG (as a data URL) through the native sheet via a temp file. */
export async function nativeSharePng(dataUrl: string, fileName: string): Promise<boolean> {
	if (!__MOBILE__) return false;
	const [{ Filesystem, Directory }, { Share }] = await Promise.all([
		import('@capacitor/filesystem'),
		import('@capacitor/share')
	]);
	const written = await Filesystem.writeFile({
		path: fileName,
		data: dataUrl.slice(dataUrl.indexOf(',') + 1), // strip data: prefix
		directory: Directory.Cache
	});
	await Share.share({ files: [written.uri] });
	return true;
}
