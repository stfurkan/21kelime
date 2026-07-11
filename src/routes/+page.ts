import type { PageLoad } from './$types';
import type { WirePuzzle } from '$lib/game/types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/puzzle/today');
	if (!res.ok) throw new Error('Bulmaca yüklenemedi');
	const wire = (await res.json()) as WirePuzzle;
	return { wire };
};
