/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * Caches this build's own assets, and nothing else.
 *
 * The scope is deliberately narrow. HTML and /api/puzzle are never cached
 * and never intercepted: the puzzle rolls over at Istanbul midnight, and a
 * worker holding either could hand a returning player yesterday's game
 * with no way for them to force a refresh. Sticky staleness is the one
 * failure mode a service worker makes genuinely hard to recover from, so
 * this one stays out of that business entirely.
 *
 * What it does cover is the build output, whose filenames carry a content
 * hash, plus the static icons. Both are keyed by the build version, and
 * older caches are dropped on activate, so an old asset can never outlive
 * the deploy that produced it.
 */
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `21kelime-${version}`;

const ASSETS = [
	...build,
	// data-version.json is what an out-of-date app compares itself against;
	// it must always come from the network.
	...files.filter((f) => f !== '/data-version.json')
];

const ASSET_PATHS = new Set(ASSETS);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== sw.location.origin) return;
	// Anything that is not a build asset goes straight to the network,
	// untouched, with no cache fallback. See the note at the top.
	if (!ASSET_PATHS.has(url.pathname)) return;

	event.respondWith(
		caches.open(CACHE).then(async (cache) => {
			const hit = await cache.match(url.pathname);
			if (hit) return hit;
			// Missing from the cache (a partial install, or storage evicted):
			// fetch it and top the cache back up.
			const response = await fetch(event.request);
			if (response.ok) cache.put(url.pathname, response.clone());
			return response;
		})
	);
});
