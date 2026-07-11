/**
 * Lightweight XOR + hex obfuscation for answers sent to the client.
 * NOT encryption — it only prevents casual spoilers when someone opens
 * the network tab. Works identically in Node and browsers.
 */
import { hashSeed, mulberry32 } from './rng.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function keystream(key: string, length: number): Uint8Array {
	const rand = mulberry32(hashSeed(`21kelime:obf:${key}`));
	const bytes = new Uint8Array(length);
	for (let i = 0; i < length; i++) bytes[i] = Math.floor(rand() * 256);
	return bytes;
}

export function obfuscate(plain: string, key: string): string {
	const data = encoder.encode(plain);
	const ks = keystream(key, data.length);
	let hex = '';
	for (let i = 0; i < data.length; i++) {
		hex += (data[i] ^ ks[i]).toString(16).padStart(2, '0');
	}
	return hex;
}

export function deobfuscate(hex: string, key: string): string {
	const data = new Uint8Array(hex.length / 2);
	const ks = keystream(key, data.length);
	for (let i = 0; i < data.length; i++) {
		data[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16) ^ ks[i];
	}
	return decoder.decode(data);
}
