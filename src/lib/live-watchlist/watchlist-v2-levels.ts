import type {
  LiveWatchlistLevelMap,
  LiveWatchlistLevelMapLevel,
} from "./live-watchlist-types";

export type WatchlistV2LevelRow = LiveWatchlistLevelMapLevel & {
  isNearest: boolean;
  isSessionHighReference?: boolean;
};

export const SESSION_HIGH_NOTICE = "The high of day is a session reference. A new high alone does not establish resistance; watch how price reacts on a retest.";

export function isSessionHighReference(level: LiveWatchlistLevelMapLevel, levelMap: LiveWatchlistLevelMap): boolean {
  const high = levelMap.referenceLevels?.find(reference => reference.key === "hod")?.price;
  return level.side === "resistance" && typeof high === "number" && Number.isFinite(high) &&
    Math.abs(level.price - high) <= Math.max(high * 1e-8, 1e-8) &&
    /intraday|session high|high of day/i.test(level.sourceLabel ?? "") &&
    !level.timeframes?.some(timeframe => timeframe === "daily" || timeframe === "4h");
}

export function labelSessionHighInLadder(body: string, levelMap: LiveWatchlistLevelMap): string {
  const highPrices = levelMap.resistanceLevels.filter(level => isSessionHighReference(level, levelMap)).map(level => level.price);
  return body.split("\n").map(line => {
    const match = line.match(/^\s*(?:-\s*)?\$?(\d+(?:\.\d+)?)\s*(?:\(|$)/);
    if (!match || !highPrices.some(price => Math.abs(price - Number(match[1])) < 0.000051)) return line;
    return `${line} — High of day (session reference)`;
  }).join("\n");
}

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
  return formatLevelPrice(level.price);
}

export function formatWatchlistV2LevelDistance(level: LiveWatchlistLevelMapLevel): string {
  return formatSignedPercent(level.distancePct);
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
      isSessionHighReference: isSessionHighReference(level, levelMap),
    })),
  };
}
