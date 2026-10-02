/** Read an owner submission without buffering an unbounded request body. */
export class SwingPlanInputError extends Error {}
export async function readSwingPlanRequest(request: Request, limit: number): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new SwingPlanInputError('Empty request.');
  const decoder = new TextDecoder();
  let size = 0, text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new SwingPlanInputError('This submission is too large. Shorten it before saving.');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
    return value as Record<string, unknown>;
  } catch { throw new SwingPlanInputError('Invalid submission. Your edits have not been changed.'); }
}
