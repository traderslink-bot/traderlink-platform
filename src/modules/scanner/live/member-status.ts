import type { ScannerReadModel } from "./contracts";

export const SCANNER_ACTIVE_HOURS_MESSAGE = "Scanners run from premarket open to post-market close (4 AM–8 PM ET).";
export const SCANNER_UNAVAILABLE_MESSAGE = "Temporarily unavailable.";
export const SCANNER_TRANSIENT_FAILURE_GRACE_MS = 30_000;
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
export function memberScannerStatus(model: ScannerReadModel | null, loadError: boolean, checkedAt: number | null): string | null {
  if (model?.status === "disabled") return "Disabled";
  if (scannerOutsideActiveHours(model, checkedAt)) return SCANNER_ACTIVE_HOURS_MESSAGE;
  if (loadError) {
    const updatedAt = model?.updatedAtUtc ? Date.parse(model.updatedAtUtc) : NaN;
    const hasRows = Boolean(model && (
      model.gainers.rows.length || model.gainers.focus.length ||
      model.dayGainers?.rows.length || model.dayGainers?.focus.length ||
      model.momentum.rows.length || model.momentum.focus.length ||
      model.declines?.rapid.length || model.declines?.losers.length ||
      model.premarketPullbacks?.rows.length
    ));
    if (!hasRows || checkedAt === null || !Number.isFinite(updatedAt) || checkedAt - updatedAt > SCANNER_TRANSIENT_FAILURE_GRACE_MS) {
      return SCANNER_UNAVAILABLE_MESSAGE;
    }
  }
  if (model?.status === "unavailable" || model?.status === "universe_missing") return SCANNER_UNAVAILABLE_MESSAGE;
  return null;
}
