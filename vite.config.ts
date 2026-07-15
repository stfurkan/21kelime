import { defineConfig } from 'vitest/config';
import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import adapterStatic from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// BUILD_TARGET=mobile produces the static SPA that Capacitor wraps; the
// default build stays the Cloudflare Workers site.
const mobile = process.env.BUILD_TARGET === 'mobile';

export default defineConfig({
	define: {
		__MOBILE__: JSON.stringify(mobile)
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: mobile
				? adapterStatic({
						pages: 'build-mobile',
						assets: 'build-mobile',
						fallback: 'index.html',
						strict: false
					})
				: adapterCloudflare()
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
