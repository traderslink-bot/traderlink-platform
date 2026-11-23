import { isSessionHighReference } from "./watchlist-v2-levels";
import type { LiveWatchlistLevelMap, LiveWatchlistLevelMapLevel } from "./live-watchlist-types";

/** Public level descriptors only: never prices, distances, dates, free-form labels or evidence. */
export type PremiumLevelPreviewRow = {
  strength?: LiveWatchlistLevelMapLevel["strengthLabel"];
  source: string;
  nearest: boolean;
  sessionHighReference?: boolean;
  provenance: Array<"Formed" | "Confirmed" | "Tested">;
};
export type PremiumLevelsPreview = Record<"support" | "resistance", PremiumLevelPreviewRow[]>;

const SOURCES = new Set(["daily confluence", "daily structure", "4h confluence", "4h structure", "intraday", "fresh intraday", "intraday structure", "continuation map", "extension", "daily", "4h", "5m"]);
const STRENGTHS = new Set(["weak", "moderate", "strong", "major"]);

export function buildPremiumLevelsPreview(map: LiveWatchlistLevelMap | null | undefined): PremiumLevelsPreview | null {
  if (!map) return null;
  const rows = (levels: LiveWatchlistLevelMapLevel[], nearest: LiveWatchlistLevelMapLevel | null) => levels.map(level => {
    const source = level.sourceLabel?.trim().toLowerCase() ?? "";
    const fallback = (level.timeframes ?? []).filter(frame => ["daily", "4h", "5m"].includes(frame)).join(" / ");
    const provenance = level.marketDataProvenance;
    const valid = (n: number | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
    const dates: PremiumLevelPreviewRow["provenance"] = [];
    if (valid(provenance?.formedAt)) {
      if (valid(provenance?.lastConfirmedAt) && valid(provenance?.lastTestedAt) && provenance.lastTestedAt > provenance.lastConfirmedAt) dates.push("Confirmed", "Tested");
      else {
        dates.push("Formed");
        if (valid(provenance?.lastConfirmedAt)) dates.push("Confirmed");
        else if (valid(provenance?.lastTestedAt)) dates.push("Tested");
      }
    }
    return {
      strength: level.strengthLabel && STRENGTHS.has(level.strengthLabel) ? level.strengthLabel : undefined,
      source: SOURCES.has(source) ? source : fallback,
      nearest: Boolean(nearest && nearest.price === level.price && nearest.side === level.side && nearest.label === level.label && nearest.distancePct === level.distancePct),
      provenance: dates,
      ...(isSessionHighReference(level, map) ? { sessionHighReference: true } : {}),
    };
  });
  return { support: rows(map.supportLevels, map.nearestSupport), resistance: rows(map.resistanceLevels, map.nearestResistance) };
}
