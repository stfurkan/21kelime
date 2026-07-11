import { json, error } from '@sveltejs/kit';
import { puzzleForDate } from '$lib/server/puzzles';
import { istanbulToday } from '$lib/game/daily';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, setHeaders }) => {
	const today = istanbulToday();
	const date = params.date === 'today' ? today : params.date;
	const puzzle = puzzleForDate(date);
	if (!puzzle) throw error(404, 'Bulmaca bulunamadı');

	setHeaders({
		// Past days never change; today's payload is stable too but the
		// "today" alias must roll over at Istanbul midnight.
		'cache-control': params.date === 'today' ? 'public, max-age=60' : 'public, max-age=86400'
	});
	return json(puzzle);
};
