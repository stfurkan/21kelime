/**
 * Turkish text normalization for game words.
 *
 * All case operations MUST go through tr-TR locale functions:
 * default toUpperCase() maps i -> I (wrong; Turkish is i -> İ) and
 * toLowerCase() maps I -> i (wrong; Turkish is I -> ı).
 */

/** The 29 letters of the Turkish alphabet, in alphabetical order. */
export const TURKISH_ALPHABET = 'abcçdefgğhıijklmnoöprsştuüvyz';

const LETTER_SET = new Set(TURKISH_ALPHABET);

/** Circumflexed vowels (kâr, askerî, sükût) fold to their plain forms for gameplay. */
const CIRCUMFLEX_FOLD: Record<string, string> = {
	â: 'a',
	î: 'i',
	û: 'u'
};

export function trLower(s: string): string {
	return s.toLocaleLowerCase('tr-TR');
}

export function trUpper(s: string): string {
	return s.toLocaleUpperCase('tr-TR');
}

/**
 * Canonical in-game form of a word: trimmed, tr-TR lowercased,
 * circumflex vowels folded (kâr -> kar).
 */
export function normalizeWord(raw: string): string {
	let out = '';
	for (const ch of trLower(raw.trim())) {
		out += CIRCUMFLEX_FOLD[ch] ?? ch;
	}
	return out;
}

/**
 * True if the (already normalized) word consists solely of Turkish
 * alphabet letters and its length is within [minLen, maxLen].
 */
export function isPlayableWord(word: string, minLen = 3, maxLen = 10): boolean {
	const chars = [...word];
	if (chars.length < minLen || chars.length > maxLen) return false;
	return chars.every((ch) => LETTER_SET.has(ch));
}
