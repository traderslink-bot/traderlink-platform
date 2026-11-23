import type { NormalizedSnapshot, ScannerVolumeBreakdown } from "./contracts";

export const SCANNER_SESSION_VOLUME_COLUMNS = ["premarketVolume", "regularVolume", "postMarketVolume"] as const;

export const SCANNER_VOLUME_LABELS = {
  dayVolume: "Day Vol",
  premarketVolume: "Pre Vol",
  regularVolume: "Regular Vol",
  postMarketVolume: "After-hours Vol",
} as const;

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
