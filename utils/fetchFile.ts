import { Buffer } from 'node:buffer';

export async function fetchFile(url: string): Promise<Buffer> {
    if (/^https?:\/\//.test(url)) {
        const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer());
    }

    throw new Error('Only HTTP(S) URLs are supported');
}
