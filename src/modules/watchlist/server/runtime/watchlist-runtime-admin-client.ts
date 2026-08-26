import "server-only";

type RuntimeMethod = "GET" | "POST";

type RuntimeRequest = Readonly<{
  body?: Readonly<Record<string, unknown>>;
  method: RuntimeMethod;
  path: string;
}>;

type RuntimeResponse = Readonly<{
  body: unknown;
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

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown;
  } catch {
    return Object.freeze({ error: "The Watchlist runtime returned an unreadable response." });
  }
}

export async function requestWatchlistRuntime(
  request: RuntimeRequest,
): Promise<RuntimeResponse> {
  const configuration = runtimeConfiguration();
  if (!configuration) {
    return Object.freeze({
      body: Object.freeze({ error: "The private Watchlist runtime connection is not configured." }),
      ok: false,
      status: 503,
    });
  }
  const url = new URL(request.path, configuration.url);
  try {
    const response = await fetch(url, {
      body: request.body ? JSON.stringify(request.body) : undefined,
      cache: "no-store",
      headers: {
        authorization: `Bearer ${configuration.token}`,
        ...(request.body ? { "content-type": "application/json" } : {}),
      },
      method: request.method,
      signal: AbortSignal.timeout(8_000),
    });
    return Object.freeze({
      body: await readResponse(response),
      ok: response.ok,
      status: response.status,
    });
  } catch {
    return Object.freeze({
      body: Object.freeze({ error: "The private Watchlist runtime is unavailable." }),
      ok: false,
      status: 503,
    });
  }
}

export async function readWatchlistRuntimeAdminSnapshot(): Promise<Readonly<{
  audit: RuntimeResponse;
  runtime: RuntimeResponse;
  watchlist: RuntimeResponse;
}>> {
  const [runtime, watchlist, audit] = await Promise.all([
    requestWatchlistRuntime({ method: "GET", path: "/api/runtime/status" }),
    requestWatchlistRuntime({ method: "GET", path: "/api/watchlist" }),
    requestWatchlistRuntime({ method: "GET", path: "/api/runtime/ai-read-audit?limit=100" }),
  ]);
  return Object.freeze({ audit, runtime, watchlist });
}
