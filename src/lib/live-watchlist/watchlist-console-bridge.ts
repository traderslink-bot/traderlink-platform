import { allowedWatchlistConsoleRequest, WATCHLIST_CONSOLE_REQUEST_MAX_BYTES, WATCHLIST_CONSOLE_RESPONSE_MAX_BYTES } from "@/src/modules/watchlist/contracts/watchlist-console-relay";

export type WatchlistConsoleRequest = Readonly<{ id: string; url: string; method: "GET" | "POST"; body?: string }>;
export function readWatchlistConsoleRequest(value: unknown, origin: string): WatchlistConsoleRequest | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.id !== "string" || !/^[a-z0-9-]{1,80}$/u.test(input.id) ||
      typeof input.url !== "string" || input.url.length > 8192 ||
      (input.method !== "GET" && input.method !== "POST") ||
      (input.body !== undefined && typeof input.body !== "string")) return null;
  let url: URL;
  try { url = new URL(input.url, origin); } catch { return null; }
  if (!allowedWatchlistConsoleRequest(url, input.method, origin) ||
      (input.method === "GET" && input.body !== undefined) ||
      (typeof input.body === "string" && new TextEncoder().encode(input.body).byteLength > WATCHLIST_CONSOLE_REQUEST_MAX_BYTES)) return null;
  return Object.freeze({ id: input.id, url: url.pathname + url.search, method: input.method, ...(input.body === undefined ? {} : { body: input.body as string }) });
}

/** Called by the trusted parent only, after explicit confirmation for mutations. */
export async function sendWatchlistConsoleRequest(input: WatchlistConsoleRequest, signal: AbortSignal) {
  const response = await fetch(input.url, {
    method: input.method, body: input.body, signal, credentials: "same-origin", redirect: "error", cache: "no-store",
    headers: { "content-type": "application/json", "x-traderlink-journal-admin-request": "1" },
  });
  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json" && type !== "text/plain") throw new Error("Unsupported console response");
  const reader = response.body?.getReader();
  let text = "", count = 0;
  const decoder = new TextDecoder();
  if (reader) try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      count += value.byteLength;
      if (count > WATCHLIST_CONSOLE_RESPONSE_MAX_BYTES) { void reader.cancel().catch(() => {}); throw new Error("Console response too large"); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  return { status: response.status, contentType: type, body: text };
}

export function watchlistMutationDescription(input: WatchlistConsoleRequest): string {
  const action = input.url.split("?")[0].split("/").at(-1)?.replaceAll("-", " ") ?? "Watchlist change";
  return action.charAt(0).toUpperCase() + action.slice(1);
}
