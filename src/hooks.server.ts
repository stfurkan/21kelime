import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	// The mobile apps (capacitor://localhost origin) fetch puzzles here
	// when their embedded word data is older than the site's. Public,
	// read-only data; open CORS is safe.
	if (event.url.pathname.startsWith('/api/puzzle/')) {
		response.headers.set('Access-Control-Allow-Origin', '*');
	}
	return response;
};
