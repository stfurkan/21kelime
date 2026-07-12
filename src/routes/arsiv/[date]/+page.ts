import { error, redirect } from '@sveltejs/kit';
import { istanbulToday } from '$lib/game/daily';
import type { PageLoad } from './$types';
import type { WirePuzzle } from '$lib/game/types';

export const load: PageLoad = async ({ fetch, params }) => {
	// Today's puzzle belongs on the home page, where streaks and stats count.
	if (params.date === istanbulToday()) redirect(307, '/');
	const res = await fetch(`/api/puzzle/${params.date}`);
	if (!res.ok) error(404, 'Bu tarih için bulmaca yok');
	const wire = (await res.json()) as WirePuzzle;
	return { wire };
};
