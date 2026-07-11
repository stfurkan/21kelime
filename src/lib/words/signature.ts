/**
 * Anagram signature: the word's letters sorted by code point.
 * Two words are full anagrams of each other iff signatures match.
 * Words must already be normalized (see normalize.ts).
 */
export function signatureOf(word: string): string {
	return [...word].sort().join('');
}

/** Build signature -> words index for a word list. */
export function buildSignatureIndex(words: Iterable<string>): Map<string, string[]> {
	const index = new Map<string, string[]>();
	for (const w of words) {
		const sig = signatureOf(w);
		const bucket = index.get(sig);
		if (bucket) bucket.push(w);
		else index.set(sig, [w]);
	}
	return index;
}
