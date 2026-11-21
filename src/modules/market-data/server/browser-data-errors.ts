import "server-only";

/** Never serialize thrown messages, upstream response bodies or upstream headers. */
export function browserDataRead<Args extends unknown[]>(code: string, read: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try { return await read(...args); }
    catch {
      return Response.json({ error: code }, { status: 503, headers: {
        "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      } });
    }
  };
}
