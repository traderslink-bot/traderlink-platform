import type { ScannerReadModel } from "./contracts";
import { scannerModelHasRows } from "./display-continuity";
import { easternClock } from "./sessions";

export const SCANNER_ACTIVE_HOURS_MESSAGE = "Scanners run from premarket open to post-market close (4 AM–8 PM ET).";
export const SCANNER_UNAVAILABLE_MESSAGE = "Temporarily unavailable.";
export const SCANNER_TRANSIENT_FAILURE_GRACE_MS = 120_000;
const easternHour = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23",
});

export function scannerOutsideActiveHours(model: ScannerReadModel | null, checkedAt: number | null): boolean {
  if (model?.status === "closed") return true;
  if (checkedAt === null || !Number.isFinite(checkedAt)) return false;
  const hour = Number(easternHour.format(checkedAt));
  return hour >= 20 || hour < 4;
}

/** Member-facing presentation only; keep provider/coverage diagnostics in Admin. */
export function canRetainScannerSnapshot(model: ScannerReadModel | null, now: number): boolean {
  return Boolean(model && model.tradingDate === easternClock(now).date &&
    (model.status === "ready" || model.status === "partial" || model.status === "warming" && scannerModelHasRows(model)));
}

export function memberScannerStatus(model: ScannerReadModel | null, loadError: boolean, checkedAt: number | null, failedAt: number | null = null): string | null {
  if (model?.status === "disabled") return "Disabled";
  if (scannerOutsideActiveHours(model, checkedAt)) return SCANNER_ACTIVE_HOURS_MESSAGE;
  if (loadError) {
    if (checkedAt === null || failedAt === null || !Number.isFinite(failedAt) ||
      checkedAt < failedAt || checkedAt - failedAt > SCANNER_TRANSIENT_FAILURE_GRACE_MS) {
      return SCANNER_UNAVAILABLE_MESSAGE;
    }
    // A new connection may not have a snapshot yet. Keep the loading state during
    // recovery; never present yesterday's results as today's live results.
    if (model && !canRetainScannerSnapshot(model, checkedAt)) return SCANNER_UNAVAILABLE_MESSAGE;
  }
  if (model?.status === "unavailable" || model?.status === "universe_missing") return SCANNER_UNAVAILABLE_MESSAGE;
  return null;
}
