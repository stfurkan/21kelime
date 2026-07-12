import { json } from '@sveltejs/kit';
import { practicePuzzle } from '$lib/server/puzzles';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, setHeaders }) => {
	// Careful: Number(null) is 0, which is finite. Only honor a seed that
	// was actually provided; otherwise every practice would be identical.
	const raw = url.searchParams.get('seed');
	const parsed = raw === null ? NaN : Number(raw);
	const seed = Number.isFinite(parsed) ? parsed : Math.floor(Math.random() * 2 ** 31);
	setHeaders({ 'cache-control': 'no-store' });
	return json(practicePuzzle(seed));
};
