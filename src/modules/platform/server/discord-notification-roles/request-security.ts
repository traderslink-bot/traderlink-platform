import { createPublicKey, verify } from "node:crypto";

const maxBodyBytes = 65_536;

/** Read the exact bytes with a size/time bound; a slow body must not consume the ACK window. */
export async function readDiscordInteractionBody(request: Request): Promise<Buffer | null> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/u.test(length) || Number(length) > maxBodyBytes)) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const read = async () => {
    try {
      while (true) {
        const item = await reader.read();
        if (item.done) return Buffer.concat(chunks);
        size += item.value.byteLength;
        if (size > maxBodyBytes) { await reader.cancel(); return null; }
        chunks.push(item.value);
      }
    } catch { return null; }
  };
  try {
    return await Promise.race([
      read(),
      new Promise<null>(resolve => { timer = setTimeout(() => { void reader.cancel().catch(() => {}); resolve(null); }, 1_500); }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

export function validDiscordInteractionSignature(request: Request, body: Buffer, publicKey: string): boolean {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  if (!signature || !/^[a-f\d]{128}$/iu.test(signature) || !timestamp || !/^\d{10,11}$/u.test(timestamp)
    || Math.abs(Date.now() - Number(timestamp) * 1_000) > 5 * 60_000) return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(publicKey, "hex")]),
      format: "der", type: "spki",
    });
    return verify(null, Buffer.concat([Buffer.from(timestamp, "utf8"), body]), key, Buffer.from(signature, "hex"));
  } catch { return false; }
}
