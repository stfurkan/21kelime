/**
 * Anonymous daily score histogram (powers "Bugün ilk %N"). No identity is
 * stored: one counter per (day, score) pair. When the D1 binding is absent
 * (local dev, missing setup) the endpoint reports unavailable and the UI
 * hides the percentile.
 */
import { error, json } from '@sveltejs/kit';
import { currentDay } from '$lib/server/puzzles';
import { ROUNDS_PER_DAY } from '$lib/game/generate';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) return json({ available: false, histogram: null });

	const body = (await request.json().catch(() => null)) as { day?: number; score?: number } | null;
	const day = currentDay();
	const score = Number(body?.score);
	// Only today's puzzle feeds the histogram; the day check also stops replays.
	if (body?.day !== day || !Number.isInteger(score) || score < 0 || score > ROUNDS_PER_DAY) {
		throw error(400, 'Geçersiz skor');
	}

	try {
		await db
			.prepare(
				'INSERT INTO scores (day, score, count) VALUES (?1, ?2, 1) ON CONFLICT(day, score) DO UPDATE SET count = count + 1'
			)
			.bind(day, score)
			.run();
		const { results } = await db
			.prepare('SELECT score, count FROM scores WHERE day = ?1')
			.bind(day)
			.all<{ score: number; count: number }>();
		return json({ available: true, histogram: results });
	} catch {
		// Missing table or transient D1 failure: degrade to "no rank" rather
		// than surfacing an error for a purely decorative feature.
		return json({ available: false, histogram: null });
	}
};
