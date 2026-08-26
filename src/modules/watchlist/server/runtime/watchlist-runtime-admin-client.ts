import "server-only";

type RuntimeMethod = "GET" | "POST";

type RuntimeRawRequest = Readonly<{
  body?: string;
  contentType?: string;
  method: RuntimeMethod;
  path: string;
}>;

export type RuntimeRawResponse = Readonly<{
  body: string;
  contentType: string;
  ok: boolean;
  status: number;
}>;

const RUNTIME_URL_ENV = "TRADERLINK_WATCHLIST_RUNTIME_URL" as const;
const RUNTIME_TOKEN_ENV = "TRADERLINK_WATCHLIST_RUNTIME_ACCESS_TOKEN" as const;

function runtimeConfiguration(): Readonly<{ token: string; url: URL }> | null {
  const configuredUrl = process.env[RUNTIME_URL_ENV]?.trim();
  const token = process.env[RUNTIME_TOKEN_ENV]?.trim();
  if (!configuredUrl || !token) return null;
  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return Object.freeze({ token, url });
  } catch {
    return null;
  }
}

export async function requestWatchlistRuntimeRaw(
  request: RuntimeRawRequest,
): Promise<RuntimeRawResponse> {
  const configuration = runtimeConfiguration();
  if (!configuration) {
    return Object.freeze({
      body: JSON.stringify({ error: "The private Watchlist runtime connection is not configured." }),
      contentType: "application/json; charset=utf-8",
      ok: false,
      status: 503,
    });
  }

  const url = new URL(request.path, configuration.url);
  try {
    const response = await fetch(url, {
      body: request.body,
      cache: "no-store",
      headers: {
        authorization: `Bearer ${configuration.token}`,
        ...(request.body
          ? { "content-type": request.contentType ?? "application/json" }
          : {}),
      },
      method: request.method,
      signal: AbortSignal.timeout(180_000),
    });
    return Object.freeze({
      body: await response.text(),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      ok: response.ok,
      status: response.status,
    });
  } catch {
    return Object.freeze({
      body: JSON.stringify({ error: "The private Watchlist runtime is unavailable." }),
      contentType: "application/json; charset=utf-8",
      ok: false,
      status: 503,
    });
  }
}
