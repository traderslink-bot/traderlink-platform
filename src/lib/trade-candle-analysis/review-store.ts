import "server-only";

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { TradeCandleAnalysis } from "./candle-analysis";
import type { RelevantCandleObservation } from "./execution-relevance";
import type { CompletedCandleReviewTrade } from "./completed-trade";
import type { IndicatorSnapshot } from "./indicator-context";

export const TRADE_CANDLE_REVIEW_VERSION =
  "ti_v3_trade_candle_review_v1" as const;

export type StoredTradeCandleReview = Readonly<{
  analysis: TradeCandleAnalysis;
  analysisVersion: typeof TRADE_CANDLE_REVIEW_VERSION;
  analyzedAt: string;
  indicators: readonly IndicatorSnapshot[];
  refreshAvailableAt: string;
  status: "no_coverage" | "ready";
  trade: CompletedCandleReviewTrade;
  observations: readonly RelevantCandleObservation[];
}>;

function recordPath(parentPath: string, trade: CompletedCandleReviewTrade): string {
  const identity = [
    trade.ownerKey,
    trade.accountKey,
    trade.semanticRoundTripKey,
    TRADE_CANDLE_REVIEW_VERSION,
  ].join(":");
  const file = createHash("sha256").update(identity).digest("hex");
  return join(parentPath, "trader-intelligence-v3-trade-candle-reviews", `${file}.json`);
}

function isStoredTradeCandleReview(value: unknown): value is StoredTradeCandleReview {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const trade = record.trade as Record<string, unknown> | undefined;
  const analysis = record.analysis as Record<string, unknown> | undefined;
  return (
    record.analysisVersion === TRADE_CANDLE_REVIEW_VERSION &&
    (record.status === "ready" || record.status === "no_coverage")
  ) && Boolean(
    trade &&
      typeof trade.semanticRoundTripKey === "string" &&
      typeof trade.rowDigest === "string" &&
      typeof trade.ownerKey === "string" &&
      typeof trade.accountKey === "string" &&
      typeof trade.symbol === "string" &&
      typeof trade.entryTime === "number" &&
      typeof trade.exitTime === "number" &&
      typeof trade.entryPrice === "number" &&
      typeof trade.exitPrice === "number" &&
      (trade.direction === "long" || trade.direction === "short") &&
      analysis &&
      typeof analysis.entryTiming === "object" &&
      typeof analysis.exitTiming === "object" &&
      typeof analysis.profitGiveback === "object" &&
      Array.isArray(record.observations) &&
      Array.isArray(record.indicators) &&
      typeof record.analyzedAt === "string" &&
      typeof record.refreshAvailableAt === "string",
  );
}

export function readStoredTradeCandleReview(args: {
  parentPath: string;
  trade: CompletedCandleReviewTrade;
}): StoredTradeCandleReview | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(recordPath(args.parentPath, args.trade), "utf8"));
    if (!isStoredTradeCandleReview(parsed)) return null;
    if (
      parsed.trade.ownerKey !== args.trade.ownerKey ||
      parsed.trade.accountKey !== args.trade.accountKey ||
      parsed.trade.semanticRoundTripKey !== args.trade.semanticRoundTripKey ||
      parsed.trade.rowDigest !== args.trade.rowDigest
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredTradeCandleReview(args: {
  parentPath: string;
  record: StoredTradeCandleReview;
}): boolean {
  try {
    const directory = join(args.parentPath, "trader-intelligence-v3-trade-candle-reviews");
    mkdirSync(directory, { recursive: true });
    writeFileSync(recordPath(args.parentPath, args.record.trade), JSON.stringify(args.record), "utf8");
    return true;
  } catch {
    return false;
  }
}

export function reviewRefreshAvailable(record: StoredTradeCandleReview, now = Date.now()): boolean {
  const refreshAt = Date.parse(record.refreshAvailableAt);
  return Number.isFinite(refreshAt) && now >= refreshAt;
}
