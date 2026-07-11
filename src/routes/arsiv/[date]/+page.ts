import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { WirePuzzle } from '$lib/game/types';

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(`/api/puzzle/${params.date}`);
	if (!res.ok) throw error(404, 'Bu tarih için bulmaca yok');
	const wire = (await res.json()) as WirePuzzle;
	return { wire };
};
