/** Client-side decoding of the wire puzzle format. */
import { deobfuscate } from './obfuscate.ts';
import type { Puzzle, WirePuzzle } from './types.ts';

export function fromWire(wire: WirePuzzle): Puzzle {
	return {
		day: wire.day,
		date: wire.date,
		rounds: wire.rounds.map((r, i) => ({
			letters: r.letters,
			answers: r.a.map((h) => deobfuscate(h, `${wire.day}:${i}`)),
			canonical: deobfuscate(r.c, `${wire.day}:${i}:c`)
		}))
	};
}
