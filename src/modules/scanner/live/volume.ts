import type { NormalizedSnapshot, ScannerVolumeBreakdown } from "./contracts";

export const SCANNER_SESSION_VOLUME_COLUMNS = ["premarketVolume", "regularVolume", "postMarketVolume"] as const;

export const SCANNER_VOLUME_LABELS = {
  dayVolume: "Day Vol",
  premarketVolume: "Pre Vol",
  regularVolume: "Regular Vol",
  postMarketVolume: "After-hours Vol",
} as const;

export function scannerVolumeLabel(column: keyof typeof SCANNER_VOLUME_LABELS): string {
  return column === "dayVolume" ? "Vol" : SCANNER_VOLUME_LABELS[column];
}

export type ScannerPrimaryVolumeField = "dayVolume" | "postMarketVolume";

export function scannerPrimaryVolumeField(afterHours: boolean): ScannerPrimaryVolumeField {
  return afterHours ? "postMarketVolume" : "dayVolume";
}

const turnoverPercent = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatScannerFloatTurnover(
  row: ScannerVolumeBreakdown & { float: number | null },
  field: ScannerPrimaryVolumeField,
): string {
  const volume = row[field];
  const float = row.float;
  if (volume == null || !Number.isFinite(volume) || volume < 0 ||
      float == null || !Number.isFinite(float) || float <= 0) return "—";
  return `${turnoverPercent.format(100 * volume / float)}%`;
}

export function scannerFloatTurnoverTitle(field: ScannerPrimaryVolumeField): string {
  return field === "postMarketVolume"
    ? "After-hours volume divided by float"
    : "Premarket and regular-session volume divided by float";
}

export function scannerVolumeBreakdown(snapshot: Pick<NormalizedSnapshot,
  "session" | "premarketVolume" | "regularVolume" | "postMarketVolume"
>): Required<ScannerVolumeBreakdown> {
  const { session, premarketVolume = null, regularVolume = null, postMarketVolume = null } = snapshot;
  return {
    dayVolume: session === "premarket" ? premarketVolume
      : premarketVolume !== null && regularVolume !== null ? premarketVolume + regularVolume : null,
    premarketVolume,
    regularVolume: session === "premarket" ? null : regularVolume,
    postMarketVolume: session === "after_hours" ? postMarketVolume : null,
  };
}
