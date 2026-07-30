import "server-only";

import type { ConfiguredDashboardAnalytics } from "@/src/lib/trader-intelligence-v3/analytics/dashboard/configured-dashboard-analytics";

import type { CandleAnalysisTrade } from "./candle-analysis";

export type CompletedCandleReviewTrade = CandleAnalysisTrade & {
  accountKey: string;
  currency: string;
  ownerKey: string;
  rowDigest: string;
  semanticRoundTripKey: string;
  symbol: string;
};

function parsePrice(value: string): number | null {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function unixTime(value: string): number | null {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || milliseconds % 1000 !== 0) return null;
  return milliseconds / 1000;
}

/**
 * Resolves one eligible completed round trip from the fixed V3 authority.
 * The browser supplies only the durable round-trip key; it cannot substitute
 * a symbol, timestamps, prices, or an execution identifier.
 */
export function resolveCompletedCandleReviewTrade(args: {
  analytics: ConfiguredDashboardAnalytics;
  semanticRoundTripKey: string;
}): CompletedCandleReviewTrade | null {
  const verified = args.analytics.source.readVerifiedDataset();
  if (!verified.ok) return null;
  const row = verified.value.datasetReceipt.rows.find(
    (candidate) => candidate.semanticRoundTripKey === args.semanticRoundTripKey,
  );
  if (!row || row.lifecycleState !== "closed_flat_to_flat") return null;

  const activityByDigest = new Map(
    args.analytics.executionActivity.map((activity) => [activity.executionDigest, activity]),
  );
  const orderedExecutions = row.supportingExecutionDigests.map((digest) =>
    activityByDigest.get(digest),
  );
  if (orderedExecutions.some((execution) => execution === undefined)) return null;

  const entrySide = row.direction === "long" ? "buy" : "sell";
  const exitSide = row.direction === "long" ? "sell" : "buy";
  const entry = orderedExecutions.find((execution) => execution?.side === entrySide);
  const exit = [...orderedExecutions].reverse().find(
    (execution) => execution?.side === exitSide,
  );
  if (!entry || !exit) return null;

  const entryPrice = parsePrice(entry.price);
  const exitPrice = parsePrice(exit.price);
  const entryTime = unixTime(entry.executedAt);
  const exitTime = unixTime(exit.executedAt);
  if (
    entryPrice === null ||
    exitPrice === null ||
    entryTime === null ||
    exitTime === null ||
    entryTime > exitTime
  ) {
    return null;
  }

  return Object.freeze({
    accountKey: row.canonicalAccountKey,
    currency: row.currency,
    direction: row.direction,
    entryPrice,
    entryTime,
    exitPrice,
    exitTime,
    ownerKey: row.canonicalOwnerKey,
    rowDigest: row.rowDigest,
    semanticRoundTripKey: row.semanticRoundTripKey,
    symbol: row.displayedSymbol,
  });
}
