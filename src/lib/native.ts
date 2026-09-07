/**
 * Native (Capacitor) integrations for the mobile build. Every export is
 * a no-op in web builds: the __MOBILE__ guard turns the Capacitor
 * imports into dead code there, so none of this reaches the web bundle.
 */
import { effectiveTheme, THEME_BG } from '$lib/theme';

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
	// Keep the reminder queue topped up (no-op unless the user opted in).
	void refreshReminders();
}

// ---- Daily reminder (opt-in, local notifications, no server) ----

const REMINDER_KEY = '21kelime:reminder';
const REMINDER_HOUR = 10;
/**
 * How many days of reminders to keep queued.
 *
 * The queue is only ever topped up when the app is opened, so its depth is
 * exactly how long a lapsed player keeps hearing from us -- and a lapsed
 * player is the whole point of the reminder. A week meant the nudge went
 * quiet after six missed days, on precisely the people it was meant to
 * reach. iOS caps pending local notifications at 64, so a month fits.
 */
const REMINDER_DAYS = 30;
const REMINDER_ID_BASE = 8100;
const REMINDER_IDS = Array.from({ length: REMINDER_DAYS }, (_, i) => REMINDER_ID_BASE + 1 + i);

export function remindersEnabled(): boolean {
	try {
		return localStorage.getItem(REMINDER_KEY) === '1';
	} catch {
		return false;
	}
}

/** Turn the daily reminder on or off. Returns the resulting state
 *  (false when the OS notification permission was declined). */
export async function setRemindersEnabled(on: boolean): Promise<boolean> {
	if (!__MOBILE__) return false;
	const { LocalNotifications } = await import('@capacitor/local-notifications');
	if (!on) {
		try {
			localStorage.removeItem(REMINDER_KEY);
		} catch {
			/* ignore */
		}
		await LocalNotifications.cancel({ notifications: REMINDER_IDS.map((id) => ({ id })) });
		return false;
	}
	const perm = await LocalNotifications.requestPermissions();
	if (perm.display !== 'granted') return false;
	try {
		localStorage.setItem(REMINDER_KEY, '1');
	} catch {
		/* ignore */
	}
	await refreshReminders();
	return true;
}

/**
 * Reschedule the coming month of 10:00 reminders, skipping today when the
 * daily puzzle is already done. Called on app start and after finishing a
 * game, so an active player is never nudged about a puzzle they already
 * solved, and the queue stays topped up.
 */
export async function refreshReminders(): Promise<void> {
	if (!__MOBILE__ || !remindersEnabled()) return;
	try {
		const [{ LocalNotifications }, { loadDayState }, { istanbulToday }] = await Promise.all([
			import('@capacitor/local-notifications'),
			import('$lib/game/storage'),
			import('$lib/game/daily')
		]);
		await LocalNotifications.cancel({ notifications: REMINDER_IDS.map((id) => ({ id })) });
		const doneToday = loadDayState(istanbulToday())?.done === true;
		const now = new Date();
		const notifications = [];
		for (let d = 0; d < REMINDER_DAYS; d++) {
			const at = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() + d,
				REMINDER_HOUR,
				0,
				0
			);
			if (at <= now) continue;
			if (d === 0 && doneToday) continue;
			notifications.push({
				id: REMINDER_IDS[d],
				title: '21kelime',
				body: 'Günün bulmacası hazır. Serini korumayı unutma!',
				schedule: { at }
			});
		}
		if (notifications.length) await LocalNotifications.schedule({ notifications });
	} catch {
		// Notifications unavailable: the game works fine without them.
	}
}

// ---- Forced update ----

const SITE = 'https://21kelime.com';
const STORE_URL = {
	ios: 'https://apps.apple.com/tr/app/id6791340807',
	android: 'https://play.google.com/store/apps/details?id=com.kelime21.app'
};

/** Compare dotted numeric versions: -1, 0 or 1. Missing parts count as 0. */
function compareVersions(a: string, b: string): number {
	const pa = a.split('.').map(Number);
	const pb = b.split('.').map(Number);
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const d = (pa[i] || 0) - (pb[i] || 0);
		if (d !== 0) return d < 0 ? -1 : 1;
	}
	return 0;
}

/**
 * Whether this build is older than the minimum the site still supports.
 *
 * `minVersion` in data-version.json is null today, so this always answers
 * false and nothing is blocked. It ships now because a gate like this can
 * only ever be added ahead of time: an app already in someone's pocket
 * cannot be taught to check for one. Setting the field later is then a
 * one-line edit that reaches every install from 1.2 onward.
 *
 * Failures are silent and permissive on purpose. Being unable to reach the
 * site must never lock a player out of a game that works offline.
 */
export async function updateRequired(): Promise<string | null> {
	if (!__MOBILE__) return null;
	try {
		const res = await fetch(`${SITE}/data-version.json`, { signal: AbortSignal.timeout(4000) });
		if (!res.ok) return null;
		const min = ((await res.json()) as { minVersion?: string | null }).minVersion;
		if (!min) return null;
		const { App } = await import('@capacitor/app');
		const { version } = await App.getInfo();
		return compareVersions(version, min) < 0 ? min : null;
	} catch {
		return null;
	}
}

/** Open this platform's store listing for the app. */
export async function openStoreListing(): Promise<void> {
	if (!__MOBILE__) return;
	try {
		const { Capacitor } = await import('@capacitor/core');
		const platform = Capacitor.getPlatform();
		const url = platform === 'ios' ? STORE_URL.ios : STORE_URL.android;
		const { Browser } = await import('@capacitor/browser');
		await Browser.open({ url });
	} catch {
		// Store unreachable: nothing useful to fall back to.
	}
}

// ---- Store review prompt ----

const REVIEW_KEY = '21kelime:reviewAsked';
/** Days finished before it is fair to ask for anything. */
const REVIEW_MIN_GAMES = 3;
/** Only ask off the back of a day that went well. */
const REVIEW_MIN_SCORE = 15;
/** Let the score land before the sheet slides up. */
const REVIEW_DELAY_MS = 2200;

/**
 * Ask for a store review after a good day, at most once per install.
 *
 * Both stores throttle the native sheet themselves and neither tells us
 * whether it actually appeared, so there is no retry to build on: the
 * rule is simply a player who has stuck around for a few days and just
 * had a good one, asked a single time, at the natural pause after a
 * finished puzzle.
 */
export async function maybeAskForReview(score: number, gamesPlayed: number): Promise<void> {
	if (!__MOBILE__) return;
	if (score < REVIEW_MIN_SCORE || gamesPlayed < REVIEW_MIN_GAMES) return;
	try {
		if (localStorage.getItem(REVIEW_KEY)) return;
		localStorage.setItem(REVIEW_KEY, '1');
	} catch {
		return; // storage blocked: never risk asking on every single game
	}
	await new Promise((resolve) => setTimeout(resolve, REVIEW_DELAY_MS));
	try {
		const { InAppReview } = await import('@capacitor-community/in-app-review');
		await InAppReview.requestReview();
	} catch {
		// Plugin or store services unavailable: nothing worth surfacing.
	}
}

async function syncStatusBar(): Promise<void> {
	if (!__MOBILE__) return;
	try {
		const { StatusBar, Style } = await import('@capacitor/status-bar');
		const theme = effectiveTheme();
		await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
		// Android only; throws on iOS, where the style alone is enough.
		await StatusBar.setBackgroundColor({ color: THEME_BG[theme] });
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
