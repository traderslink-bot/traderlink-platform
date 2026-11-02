import type { ScannerReadModel } from "./contracts";

export const SCANNER_ACTIVE_HOURS_MESSAGE = "Active 4:00am - 8:00pm est";
export const SCANNER_UNAVAILABLE_MESSAGE = "Temporarily unavailable.";
const easternHour = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23",
});

/** Member-facing presentation only; keep provider/coverage diagnostics in Admin. */
export function memberScannerStatus(model: ScannerReadModel | null, loadError: boolean, checkedAt: number | null): string | null {
  if (model?.status === "disabled") return "Disabled";
  if (checkedAt !== null && Number.isFinite(checkedAt)) {
    const hour = Number(easternHour.format(checkedAt));
    if (hour >= 20 || hour < 4) return SCANNER_ACTIVE_HOURS_MESSAGE;
  }
  if (loadError || model?.status === "unavailable" || model?.status === "universe_missing") return SCANNER_UNAVAILABLE_MESSAGE;
  return null;
}
