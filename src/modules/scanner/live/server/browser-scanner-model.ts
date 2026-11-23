import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import type { LiveScreenResults, ScannerReadModel } from "../contracts";

// JSON and stream responses use the same opaque halt IDs for the lifetime of the server process.
const application = globalThis as typeof globalThis & { traderlinkBrowserHaltIdKey?: Buffer };

const publicIssues = new Set(["invalid_row", "unexpected_symbol", "duplicate_symbol", "stale_or_invalid_provider_time",
  "session_timestamp_unverified", "provider_time_outside_session", "session_price_unavailable", "session_baseline_unavailable",
  "session_counters_unverified", "listing_eligibility_unavailable", "snapshot_pass_unavailable", "snapshot_batch_unavailable",
  "news_unavailable", "live_feed_unavailable", "session_warming"]);
function browserIssues(issues: readonly string[] | undefined): string[] {
  return [...new Set((issues ?? []).map(issue => issue === "alpaca_session_warming" ? "session_warming"
    : publicIssues.has(issue) ? issue : "market_data_unavailable"))];
}

function facts<T extends { provider?: unknown }>(value: T): Omit<T, "provider"> {
  const copy = { ...value };
  delete copy.provider;
  return copy;
}
function screen(value: LiveScreenResults): LiveScreenResults {
  return { ...value, rows: value.rows.map(facts), focus: value.focus.map(facts),
    ...(value.momentumSections ? { momentumSections: { ...value.momentumSections,
      confirmed: value.momentumSections.confirmed.map(facts), early: value.momentumSections.early.map(facts),
    } } : {}),
  };
}

/** Preserve the scanner's facts and ranking; supplier routing remains internal. */
export function browserScannerModel(value: ScannerReadModel): ScannerReadModel {
  return { ...facts(value), issues: browserIssues(value.issues), gainers: screen(value.gainers), momentum: screen(value.momentum),
    ...(value.dayGainers ? { dayGainers: screen(value.dayGainers) } : {}),
    ...(value.breakouts ? { breakouts: value.breakouts.map(facts) } : {}),
    ...(value.activeHalts ? { activeHalts: value.activeHalts.map(halt => {
      const key = application.traderlinkBrowserHaltIdKey ??= randomBytes(32);
      const copy = { ...halt, id: createHmac("sha256", key).update(halt.id).digest("hex") };
      delete copy.source;
      return copy;
    }) } : {}),
  };
}
