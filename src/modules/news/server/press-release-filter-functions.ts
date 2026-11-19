import type Database from "better-sqlite3";
import { marketCapUsd } from "../contracts/press-release-filters";
import { newsSummaryUnavailable } from "../contracts/news-outbound-link";

export function registerPressReleaseFilterFunctions(database: Database.Database): void {
  database.function("traderlink_news_cap", { deterministic: true }, (value, recordedUsd) => marketCapUsd(value, recordedUsd));
  database.function("traderlink_news_unavailable", { deterministic: true }, (summary, eventType, metadata) => {
    let record: Record<string, unknown> = {};
    try { const parsed: unknown = JSON.parse(String(metadata ?? "{}")); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) record = parsed as Record<string, unknown>; } catch { /* Keep invalid metadata unavailable to the parser. */ }
    return newsSummaryUnavailable(typeof summary === "string" ? summary : null, typeof eventType === "string" ? eventType : null, record) ? 1 : 0;
  });
}
