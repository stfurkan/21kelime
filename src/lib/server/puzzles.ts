/**
 * Server-side puzzle access for the web build. The full word data
 * (validation set + target pools) is only ever bundled here — web clients
 * receive a single day's rounds with obfuscated answers over the API,
 * never the pools or future days.
 */
import wordData from '$lib/puzzles/data/words.json';
import { createPuzzleSource, type WordData } from '$lib/puzzles/core';

const source = createPuzzleSource(wordData as unknown as WordData);

export const puzzleForDate = source.puzzleForDate;
export const practicePuzzle = source.practicePuzzle;
