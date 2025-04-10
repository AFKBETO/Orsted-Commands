import { Buffer } from 'node:buffer';

/**
 * Fetches a file from a given URL and returns its content as a Buffer.
 * This is a temporary utils until when Deno fixes the fetch API with undici
 * (Discord.js uses undici for fetch)
 */

export async function fetchFile(url: string): Promise<Buffer> {
    if (/^https?:\/\//.test(url)) {
        const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer());
    }

    throw new Error('Only HTTP(S) URLs are supported');
}
