import { error, redirect } from '@sveltejs/kit';
import { istanbulToday } from '$lib/game/daily';
import { loadDaily } from '$lib/puzzles/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	// Today's puzzle belongs on the home page, where streaks and stats count.
	if (params.date === istanbulToday()) redirect(307, '/');
	const wire = await loadDaily(fetch, params.date);
	if (!wire) error(404, 'Bu tarih için bulmaca yok');
	return { wire };
};
