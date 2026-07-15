import type {
  LiveWatchlistLevelMap,
  LiveWatchlistLevelMapLevel,
} from "./live-watchlist-types";

export type WatchlistV2LevelRow = LiveWatchlistLevelMapLevel & {
  isNearest: boolean;
};

export type WatchlistV2LevelRows = {
  support: WatchlistV2LevelRow[];
  resistance: WatchlistV2LevelRow[];
};

function formatLevelPrice(value: number): string {
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function formatWatchlistV2LevelPrice(level: LiveWatchlistLevelMapLevel): string {
  const lowPrice = level.lowPrice ?? level.price;
  const highPrice = level.highPrice ?? level.price;
  const low = formatLevelPrice(Math.min(lowPrice, level.price));
  const high = formatLevelPrice(Math.max(highPrice, level.price));
  return low === high ? formatLevelPrice(level.price) : `${low}–${high}`;
}

export function formatWatchlistV2LevelDistance(level: LiveWatchlistLevelMapLevel): string {
  const low = formatSignedPercent(level.lowDistancePct ?? level.distancePct);
  const high = formatSignedPercent(level.highDistancePct ?? level.distancePct);
  return low === high ? formatSignedPercent(level.distancePct) : `${low} to ${high}`;
}

export function formatWatchlistV2EvidenceStatus(level: LiveWatchlistLevelMapLevel): string {
  if (level.roleFlipState === "confirmed") {
    return "Confirmed role flip";
  }
  switch (level.evidenceStatus) {
    case "synthetic_planning":
      return "Synthetic planning level";
    case "historically_tested":
      return level.isClustered ? "Historically tested cluster" : "Historically tested";
    case "detected_structure":
      return level.isClustered ? "Clustered historical structure" : "Detected structure";
    default:
      return level.isClustered ? "Clustered historical evidence" : "Historical level";
  }
}

export function formatWatchlistV2EvidenceCount(level: LiveWatchlistLevelMapLevel): string | null {
  if (typeof level.evidenceCount !== "number" || level.evidenceCount <= 0) {
    return null;
  }
  return `${level.evidenceCount} structural candidate${level.evidenceCount === 1 ? "" : "s"}`;
}

function isSameLevel(
  left: LiveWatchlistLevelMapLevel,
  right: LiveWatchlistLevelMapLevel | null,
): boolean {
  return Boolean(
    right &&
      left.side === right.side &&
      left.price === right.price &&
      left.distancePct === right.distancePct &&
      left.label === right.label,
  );
}

export function buildWatchlistV2LevelRows(
  levelMap: LiveWatchlistLevelMap | null | undefined,
): WatchlistV2LevelRows {
  if (!levelMap) {
    return { support: [], resistance: [] };
  }

  return {
    support: levelMap.supportLevels.map((level) => ({
      ...level,
      isNearest: isSameLevel(level, levelMap.nearestSupport),
    })),
    resistance: levelMap.resistanceLevels.map((level) => ({
      ...level,
      isNearest: isSameLevel(level, levelMap.nearestResistance),
    })),
  };
}
