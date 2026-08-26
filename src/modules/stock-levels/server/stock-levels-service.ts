import "server-only";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { StockLevelsResult } from "../stock-levels-contract";
import { requestStockLevels } from "./stock-levels-runtime-client";

const HOUR_MS = 60 * 60 * 1000;
const NEW_YORK = "America/New_York";

function symbolFrom(input: unknown): string | null {
  const symbol = typeof input === "string" ? input.trim().toUpperCase() : "";
  return /^[A-Z][A-Z0-9.-]{0,9}$/u.test(symbol) ? symbol : null;
}

function newYorkDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NEW_YORK, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp));
}

function nextNewYorkDay(timestamp: number): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: NEW_YORK, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(timestamp));
  const value = (kind: string) => Number(parts.find((part) => part.type === kind)?.value ?? 0);
  const nextUtcGuess = Date.UTC(value("year"), value("month") - 1, value("day") + 1, 5);
  return nextUtcGuess;
}

function quota(scope: WorkspaceAccessScope, now: number) {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return readQuota(database, scope, now);
  } finally { database.close(); }
}

function readQuota(database: ReturnType<typeof openPlatformDatabase>, scope: WorkspaceAccessScope, now: number) {
  const hourly = database.prepare<[string, number], { count: number }>("SELECT COUNT(*) AS count FROM platform_stock_levels_usage WHERE user_id = ? AND requested_at_ms > ?").get(scope.userId, now - HOUR_MS)?.count ?? 0;
  const day = database.prepare<[string, string], { count: number }>("SELECT COUNT(*) AS count FROM platform_stock_levels_usage WHERE user_id = ? AND new_york_date = ?").get(scope.userId, newYorkDate(now))?.count ?? 0;
  return { hourly, day };
}

function feedback(scope: WorkspaceAccessScope, now: number) {
  const used = quota(scope, now);
  return { remainingHourly: Math.max(0, 10 - used.hourly), remainingNewYorkDay: Math.max(0, 30 - used.day), resetAt: Math.min(now + HOUR_MS, nextNewYorkDay(now)) };
}

function recordFreshCalculation(scope: WorkspaceAccessScope, symbol: string, now: number): boolean {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const transaction = database.transaction(() => {
      const used = readQuota(database, scope, now);
      if (used.hourly >= 10 || used.day >= 30) return false;
      database.prepare("INSERT INTO platform_stock_levels_usage (user_id, symbol, requested_at_ms, new_york_date) VALUES (?, ?, ?, ?)").run(scope.userId, symbol, now, newYorkDate(now));
      return true;
    });
    return transaction();
  } finally { database.close(); }
}

export async function getStockLevels(scope: WorkspaceAccessScope, input: unknown): Promise<StockLevelsResult> {
  const now = Date.now();
  const feedbackBefore = feedback(scope, now);
  const symbol = symbolFrom(input);
  if (!symbol) return { state: "unavailable", code: "invalid_symbol", message: "Enter a Nasdaq or NYSE stock ticker.", ...feedbackBefore };
  if (feedbackBefore.remainingHourly === 0 || feedbackBefore.remainingNewYorkDay === 0) return { state: "unavailable", code: "limit_reached", message: "The Stock Levels request limit has been reached. Use the reset time shown here.", ...feedbackBefore };
  const runtimeReply = await requestStockLevels(symbol);
  if (!runtimeReply) return { state: "unavailable", code: "runtime_unavailable", message: "A reliable Stock Levels map is unavailable right now. Try again later.", ...feedbackBefore };
  if (!("map" in runtimeReply)) return { state: "unavailable", code: runtimeReply.code, message: runtimeReply.message, ...feedbackBefore };
  const { map } = runtimeReply;
  if (map.cacheStatus === "fresh" && !recordFreshCalculation(scope, symbol, now)) {
    const feedbackAfterLimit = feedback(scope, now);
    return { state: "unavailable", code: "limit_reached", message: "The Stock Levels request limit has been reached. Use the reset time shown here.", ...feedbackAfterLimit };
  }
  return { state: "ready", map, ...feedback(scope, now) };
}
