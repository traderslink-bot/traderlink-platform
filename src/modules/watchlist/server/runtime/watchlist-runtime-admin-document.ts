import "server-only";

import {
  requestWatchlistRuntimeRaw,
  type RuntimeRawResponse,
} from "./watchlist-runtime-admin-client";

const CONSOLE_PATHS = Object.freeze({
  "ai-clean-read": "/ai-clean-read",
  "trade-plan-review": "/trade-plan-review",
});

export type WatchlistRuntimeConsoleView = keyof typeof CONSOLE_PATHS | "manual-watchlist";

function runtimePath(view: WatchlistRuntimeConsoleView): string {
  return view === "manual-watchlist" ? "/" : CONSOLE_PATHS[view];
}

export function rewriteWatchlistRuntimeDocument(document: string): string {
  return document
    .replaceAll('"/api/', '"/api/admin/watchlist/runtime/')
    .replaceAll(
      '"/ai-clean-read"',
      '"/api/admin/watchlist/console/ai-clean-read"',
    )
    .replaceAll(
      '"/trade-plan-review"',
      '"/api/admin/watchlist/console/trade-plan-review"',
    );
}

export async function readWatchlistRuntimeConsoleDocument(
  view: WatchlistRuntimeConsoleView,
): Promise<RuntimeRawResponse> {
  const response = await requestWatchlistRuntimeRaw({
    method: "GET",
    path: runtimePath(view),
  });
  if (!response.ok) return response;
  return Object.freeze({
    ...response,
    body: rewriteWatchlistRuntimeDocument(response.body),
    contentType: "text/html; charset=utf-8",
  });
}
