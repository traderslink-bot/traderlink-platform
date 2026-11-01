export const WATCHLIST_RUNTIME_GET_PATHS = new Set([
  "/api/watchlist/analysis-review/discord-text",
  "/api/watchlist/analysis-review/category-move",
  "/api/watchlist/analysis-review/x-post",
  "/api/watchlist/analysis-review/free-chat",
  "/api/watchlist/analysis-review/discord-mentions",
  "/api/watchlist/analysis-review/export",
  "/api/watchlist/analysis-review/history",
  "/api/watchlist/analysis-review/queue",
  "/api/watchlist/analysis-review/settings",
  "/api/watchlist/analysis-review",
  "/api/watchlist/analysis-review/preview",
  "/api/ai-clean-read",
  "/api/runtime/ai-read-audit",
  "/api/runtime/day-trade-adapter",
  "/api/runtime/status",
  "/api/trade-plan-review",
  "/api/watchlist",
]);

export const WATCHLIST_RUNTIME_POST_PATHS = new Set([
  "/api/watchlist/analysis-review/discord-text",
  "/api/watchlist/analysis-review/category-move",
  "/api/watchlist/analysis-review/x-post",
  "/api/watchlist/analysis-review/cancel-generation",
  "/api/watchlist/analysis-review/free-chat",
  "/api/watchlist/analysis-review/discord-mentions",
  "/api/watchlist/analysis-review/settings",
  "/api/watchlist/analysis-review/save-notes",
  "/api/watchlist/analysis-review/save",
  "/api/watchlist/analysis-review/approve",
  "/api/watchlist/analysis-review/publish-without-analysis",
  "/api/watchlist/analysis-review/retry-discord",
  "/api/watchlist/analysis-review/verify-discord",
  "/api/ai-clean-read/comments",
  "/api/ai-clean-read/generate",
  "/api/discord/clear-watchlist-channel",
  "/api/runtime/ai-read-boundary-refreshes",
  "/api/runtime/ai-read-cost-budget",
  "/api/runtime/ai-read-external-research",
  "/api/runtime/ai-read-generation",
  "/api/runtime/ai-read-model",
  "/api/runtime/auto-watchlist-selector",
  "/api/runtime/auto-watchlist-selector/preview",
  "/api/runtime/day-trade-adapter",
  "/api/runtime/day-trade-adapter/refresh",
  "/api/runtime/historical-provider",
  "/api/runtime/live-provider",
  "/api/runtime/same-day-candle-provider",
  "/api/runtime/live-trader-read-card",
  "/api/runtime/potential-gain-card",
  "/api/runtime/reversal-watchlist",
  "/api/runtime/top-regular-watchlist",
  "/api/runtime/watchlist-lifecycle-labels",
  "/api/trade-plan-review/notes",
  "/api/watchlist/activate",
  "/api/watchlist/ai-read-dip-buy-visibility",
  "/api/watchlist/ai-read-refresh",
  "/api/watchlist/ai-read-visibility",
  "/api/watchlist/indicator-visibility",
  "/api/watchlist/deactivate",
  "/api/watchlist/deactivate-bulk",
  "/api/watchlist/move-to-list",
  "/api/watchlist/refresh-levels",
  "/api/watchlist/remove-from-list",
  "/api/watchlist/repost-snapshot",
]);

export const WATCHLIST_CONSOLE_RESPONSE_MAX_BYTES = 4 * 1024 * 1024;
export const WATCHLIST_CONSOLE_REQUEST_MAX_BYTES = 1024 * 1024;
export function allowedWatchlistConsoleRequest(url: URL, method: string, origin: string): boolean {
  if (url.origin !== origin || url.username || url.password || url.hash || url.search.length > 4096) return false;
  if (url.pathname === "/api/admin/watchlist/analysis-visibility") return method === "GET" || method === "POST";
  const prefix = "/api/admin/watchlist/runtime";
  if (!url.pathname.startsWith(prefix + "/")) return false;
  const runtimePath = "/api" + url.pathname.slice(prefix.length);
  return method === "GET" ? WATCHLIST_RUNTIME_GET_PATHS.has(runtimePath) : method === "POST" && WATCHLIST_RUNTIME_POST_PATHS.has(runtimePath);
}
