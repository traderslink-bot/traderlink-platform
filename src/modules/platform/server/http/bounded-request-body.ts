/** Bound bytes before decoding, JSON parsing or multipart materialization. */
export class RequestBodyLimitError extends Error {
  readonly status = 413;
  constructor() { super("request_body_limit_exceeded"); }
}

export async function readBoundedRequestBytes(request: Pick<Request, "headers" | "body">, maximumBytes: number): Promise<Uint8Array> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) throw new RangeError("Invalid body limit");
  const length = request.headers.get("content-length");
  if (length !== null && (!/^(?:0|[1-9][0-9]*)$/u.test(length) || Number(length) > maximumBytes)) {
    throw new RequestBodyLimitError();
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  let bytes = new Uint8Array(Math.min(maximumBytes, 16 * 1024));
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > maximumBytes - size) throw new RequestBodyLimitError();
      if (size + value.byteLength > bytes.byteLength) {
        const expanded = new Uint8Array(Math.min(maximumBytes, Math.max(bytes.byteLength * 2, size + value.byteLength)));
        expanded.set(bytes.subarray(0, size)); bytes = expanded;
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
    return bytes.subarray(0, size);
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export async function readBoundedRequestText(request: Pick<Request, "headers" | "body">, maximumBytes: number): Promise<string> {
  return new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBytes(request, maximumBytes));
}

export async function readBoundedRequestJson(request: Request, maximumBytes: number): Promise<unknown> {
  return JSON.parse(await readBoundedRequestText(request, maximumBytes)) as unknown;
}

export const JOURNAL_STATEMENT_MAX_BYTES = 25 * 1024 * 1024;
export async function readBoundedJournalFormData(request: Request): Promise<FormData> {
  // Keep the existing statement limit, with a bounded allowance for multipart
  // framing and mapping/selection fields. Never trust Content-Length alone.
  const bytes = await readBoundedRequestBytes(request, JOURNAL_STATEMENT_MAX_BYTES + 256 * 1024);
  return new Response(bytes as BodyInit, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
}

export async function readBoundedStatementFile(file: File): Promise<Uint8Array> {
  if (file.size < 1 || file.size > JOURNAL_STATEMENT_MAX_BYTES) throw new RequestBodyLimitError();
  return new Uint8Array(await file.arrayBuffer());
}
