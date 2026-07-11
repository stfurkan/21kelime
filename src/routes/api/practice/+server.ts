import { json } from '@sveltejs/kit';
import { practicePuzzle } from '$lib/server/puzzles';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, setHeaders }) => {
	const raw = Number(url.searchParams.get('seed'));
	const seed = Number.isFinite(raw) ? raw : Math.floor(Math.random() * 2 ** 31);
	setHeaders({ 'cache-control': 'no-store' });
	return json(practicePuzzle(seed));
};
