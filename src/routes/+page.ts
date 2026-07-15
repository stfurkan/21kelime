import { loadDaily } from '$lib/puzzles/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const wire = await loadDaily(fetch, 'today');
	if (!wire) throw new Error('Bulmaca yüklenemedi');
	return { wire };
};
