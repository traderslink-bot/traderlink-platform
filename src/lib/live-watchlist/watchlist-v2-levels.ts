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
    })),
  };
}
