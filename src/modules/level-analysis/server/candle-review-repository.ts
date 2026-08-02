import type Database from "better-sqlite3";
import Decimal from "decimal.js";
import { createHash } from "node:crypto";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  CandleReviewAnalysis,
  CandleReviewIndicator,
  CandleReviewObservation,
  CandleReviewRecord,
  CandleReviewStatus,
  CandleReviewTarget,
  LevelAnalysisInterval,
  MarketDataProviderResult,
} from "../contracts/candle-review-contracts";
import {
  JOURNAL_CANDLE_REVIEW_CONTRACT_VERSION,
  YAHOO_CHART_ADAPTER_VERSION,
  YAHOO_CHART_PROVIDER_KEY,
} from "../contracts/candle-review-contracts";
import { assertCanonicalJournalDecimal } from "@/src/modules/journal/contracts/journal-storage-values";

const ExactDecimal = Decimal.clone({ precision: 160, toExpNeg: -1000, toExpPos: 1000 });
const DERIVED_PRICE_DECIMAL_PLACES = 4;

type TargetRow = Readonly<{
  round_trip_id: string;
  round_trip_version_id: string;
  asset_class: string;
  normalized_symbol: string;
  direction: "long" | "short";
  opened_at_utc: string;
  closed_at_utc: string | null;
  allocation_role: "opening" | "adding" | "reducing" | "closing" | "flip_closing" | "flip_opening";
  quantity_decimal: string;
  price_decimal: string | null;
}>;

export type PersistedMarketDataAttempt = Readonly<{
  interval: LevelAnalysisInterval;
  startTime: number;
  endTime: number;
  requestedAtUtc: string;
  completedAtUtc: string;
  result: MarketDataProviderResult;
}>;

export type PersistCandleReviewInput = Readonly<{
  status: CandleReviewStatus;
  analysis: CandleReviewAnalysis;
  observations: readonly CandleReviewObservation[];
  indicators: readonly CandleReviewIndicator[];
  primary: PersistedMarketDataAttempt | null;
  daily: PersistedMarketDataAttempt | null;
  refreshAvailableAtUtc: string;
  analyzedAtUtc: string;
}>;

function canonical(value: Decimal): string {
  const normalized = value.isZero() ? "0" : value.toFixed();
  assertCanonicalJournalDecimal(normalized, "candleReviewDecimal");
  return normalized;
}

function weightedPrice(
  rows: readonly TargetRow[],
  roles: ReadonlySet<TargetRow["allocation_role"]>,
): string | null {
  let totalQuantity = new ExactDecimal(0);
  let totalValue = new ExactDecimal(0);
  for (const row of rows) {
    if (!roles.has(row.allocation_role)) continue;
    if (row.price_decimal === null) return null;
    const quantity = new ExactDecimal(row.quantity_decimal);
    totalQuantity = totalQuantity.plus(quantity);
    totalValue = totalValue.plus(quantity.times(new ExactDecimal(row.price_decimal)));
  }
  return totalQuantity.gt(0)
    ? canonical(totalValue.dividedBy(totalQuantity).toDecimalPlaces(
        DERIVED_PRICE_DECIMAL_PLACES,
        Decimal.ROUND_HALF_UP,
      ))
    : null;
}

function canonicalJson(value: unknown): Readonly<{ json: string; sha256: string }> {
  const json = JSON.stringify(value);
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

function parseVerifiedJson<T>(json: string, digest: string, field: string): T {
  const actual = createHash("sha256").update(`${json}\n`, "utf8").digest("hex");
  if (actual !== digest) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  try {
    return JSON.parse(json) as T;
  } catch {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
}

function utcFromSeconds(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

function requireAcceptedAttemptIntegrity(attempt: PersistedMarketDataAttempt): void {
  if (!attempt.result.ok) return;
  const candles = attempt.result.candles;
  const actualDigest = createHash("sha256")
    .update(`${JSON.stringify(candles)}\n`, "utf8")
    .digest("hex");
  if (candles.length === 0 || actualDigest !== attempt.result.normalizedCandleSha256) {
    platformFailure("TRADERLINK_CANDLE_REVIEW_INVALID", { field: "normalizedCandles" });
  }
  let priorTime = 0;
  for (const candle of candles) {
    if (
      !Number.isSafeInteger(candle.time) || candle.time < attempt.startTime ||
      candle.time > attempt.endTime || candle.time <= priorTime
    ) {
      platformFailure("TRADERLINK_CANDLE_REVIEW_INVALID", { field: "candleTime" });
    }
    assertCanonicalJournalDecimal(candle.openDecimal, "candleOpen", { positive: true });
    assertCanonicalJournalDecimal(candle.highDecimal, "candleHigh", { positive: true });
    assertCanonicalJournalDecimal(candle.lowDecimal, "candleLow", { positive: true });
    assertCanonicalJournalDecimal(candle.closeDecimal, "candleClose", { positive: true });
    assertCanonicalJournalDecimal(candle.volumeDecimal, "candleVolume", { nonNegative: true });
    const high = new ExactDecimal(candle.highDecimal);
    const low = new ExactDecimal(candle.lowDecimal);
    if (
      high.lt(low) || high.lt(candle.openDecimal) || high.lt(candle.closeDecimal) ||
      low.gt(candle.openDecimal) || low.gt(candle.closeDecimal)
    ) {
      platformFailure("TRADERLINK_CANDLE_REVIEW_INVALID", { field: "candleOhlc" });
    }
    priorTime = candle.time;
  }
}

export class CandleReviewRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.transaction(operation).immediate();
  }

  findTarget(scope: AccountScope, roundTripId: string): CandleReviewTarget | null {
    assertCanonicalUuidV4(roundTripId, "roundTripId");
    const rows = this.database.prepare<[string, string, string], TargetRow>(`
SELECT r.round_trip_id, v.round_trip_version_id, instrument.asset_class,
       instrument.normalized_symbol, v.direction, v.opened_at_utc,
       v.closed_at_utc, allocation.allocation_role,
       allocation.quantity_decimal, execution.price_decimal
FROM journal_round_trips r
JOIN journal_round_trip_versions v
  ON v.workspace_id = r.workspace_id AND v.account_id = r.account_id
 AND v.round_trip_id = r.round_trip_id AND v.round_trip_version_id = r.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = v.workspace_id AND instrument.instrument_id = v.instrument_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = v.workspace_id AND allocation.account_id = v.account_id
 AND allocation.round_trip_version_id = v.round_trip_version_id
JOIN journal_execution_versions execution
  ON execution.workspace_id = allocation.workspace_id AND execution.account_id = allocation.account_id
 AND execution.execution_version_id = allocation.execution_version_id
WHERE r.workspace_id = ? AND r.account_id = ? AND r.round_trip_id = ?
  AND r.lifecycle_state = 'active' AND v.projection_state = 'ready_closed'
ORDER BY allocation.allocation_sequence`).all(scope.workspaceId, scope.accountId, roundTripId);
    if (rows.length === 0) return null;
    const first = rows[0]!;
    if (first.closed_at_utc === null) return null;
    const entryPriceDecimal = weightedPrice(
      rows,
      new Set<TargetRow["allocation_role"]>(["opening", "adding", "flip_opening"]),
    );
    const exitPriceDecimal = weightedPrice(
      rows,
      new Set<TargetRow["allocation_role"]>(["reducing", "closing", "flip_closing"]),
    );
    if (entryPriceDecimal === null || exitPriceDecimal === null) return null;
    return Object.freeze({
      roundTripId: first.round_trip_id,
      roundTripVersionId: first.round_trip_version_id,
      assetClass: first.asset_class,
      symbol: first.normalized_symbol,
      direction: first.direction,
      openedAtUtc: first.opened_at_utc,
      closedAtUtc: first.closed_at_utc,
      entryPriceDecimal,
      exitPriceDecimal,
    });
  }

  readCurrent(scope: AccountScope, target: CandleReviewTarget): CandleReviewRecord | null {
    const row = this.database.prepare<[string, string, string, string], {
      candle_review_id: string;
      revision: number;
      round_trip_version_id: string;
      review_status: CandleReviewStatus;
      analysis_json: string;
      analysis_sha256: string;
      observations_json: string;
      observations_sha256: string;
      indicators_json: string;
      indicators_sha256: string;
      primary_request_id: string | null;
      created_at_utc: string;
      refresh_available_at_utc: string;
    }>(`
SELECT root.candle_review_id, root.revision, version.round_trip_version_id,
       version.review_status, version.analysis_json, version.analysis_sha256,
       version.observations_json, version.observations_sha256,
       version.indicators_json, version.indicators_sha256,
       version.primary_request_id, version.created_at_utc,
       version.refresh_available_at_utc
FROM journal_round_trip_candle_reviews root
JOIN journal_round_trip_candle_review_versions version
  ON version.workspace_id = root.workspace_id AND version.account_id = root.account_id
 AND version.candle_review_id = root.candle_review_id
 AND version.candle_review_version_id = root.current_version_id
WHERE root.workspace_id = ? AND root.account_id = ? AND root.round_trip_id = ?
  AND root.analysis_contract_version = ? AND root.lifecycle_state = 'active'`)
      .get(scope.workspaceId, scope.accountId, target.roundTripId, JOURNAL_CANDLE_REVIEW_CONTRACT_VERSION);
    if (!row || row.round_trip_version_id !== target.roundTripVersionId) return null;
    const candles = row.primary_request_id === null
      ? Object.freeze([])
      : Object.freeze(this.database.prepare<[string, string, string], {
          candle_time_utc: number;
          open_decimal: string;
          high_decimal: string;
          low_decimal: string;
          close_decimal: string;
          volume_decimal: string;
        }>(`
SELECT candle.candle_time_utc, candle.open_decimal, candle.high_decimal,
       candle.low_decimal, candle.close_decimal, candle.volume_decimal
FROM level_analysis_market_data_requests request
JOIN level_analysis_normalized_candles candle
  ON candle.workspace_id = request.workspace_id AND candle.account_id = request.account_id
 AND candle.candle_set_id = request.normalized_candle_set_id
WHERE request.workspace_id = ? AND request.account_id = ? AND request.request_id = ?
ORDER BY candle.candle_time_utc`).all(scope.workspaceId, scope.accountId, row.primary_request_id).map((candle) => Object.freeze({
          time: candle.candle_time_utc,
          openDecimal: candle.open_decimal,
          highDecimal: candle.high_decimal,
          lowDecimal: candle.low_decimal,
          closeDecimal: candle.close_decimal,
          volumeDecimal: candle.volume_decimal,
        })));
    return Object.freeze({
      candleReviewId: row.candle_review_id,
      revision: row.revision,
      target,
      status: row.review_status,
      analysis: parseVerifiedJson<CandleReviewAnalysis>(row.analysis_json, row.analysis_sha256, "candleReviewAnalysis"),
      observations: Object.freeze(parseVerifiedJson<CandleReviewObservation[]>(row.observations_json, row.observations_sha256, "candleReviewObservations")),
      indicators: Object.freeze(parseVerifiedJson<CandleReviewIndicator[]>(row.indicators_json, row.indicators_sha256, "candleReviewIndicators")),
      candles,
      analyzedAtUtc: row.created_at_utc,
      refreshAvailableAtUtc: row.refresh_available_at_utc,
    });
  }

  persist(
    scope: AccountScope,
    target: CandleReviewTarget,
    input: PersistCandleReviewInput,
  ): CandleReviewRecord {
    return this.immediate(() => {
      const currentTarget = this.findTarget(scope, target.roundTripId);
      if (!currentTarget || currentTarget.roundTripVersionId !== target.roundTripVersionId) {
        platformFailure("TRADERLINK_CANDLE_REVIEW_CONFLICT");
      }
      const primaryRequestId = input.primary
        ? this.insertAttempt(scope, target, input.primary)
        : null;
      const dailyRequestId = input.daily
        ? this.insertAttempt(scope, target, input.daily)
        : null;
      const current = this.database.prepare<[string, string, string, string], {
        candle_review_id: string;
        revision: number;
        created_at_utc: string;
      }>(`
SELECT candle_review_id, revision, created_at_utc
FROM journal_round_trip_candle_reviews
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?
  AND analysis_contract_version = ?`)
        .get(scope.workspaceId, scope.accountId, target.roundTripId, JOURNAL_CANDLE_REVIEW_CONTRACT_VERSION);
      const candleReviewId = current?.candle_review_id ?? createCanonicalUuidV4();
      const versionId = createCanonicalUuidV4();
      const revision = (current?.revision ?? 0) + 1;
      const analysis = canonicalJson(input.analysis);
      const observations = canonicalJson(input.observations);
      const indicators = canonicalJson(input.indicators);
      this.database.prepare(`
INSERT INTO journal_round_trip_candle_review_versions (
  candle_review_version_id, workspace_id, account_id, candle_review_id,
  version_number, round_trip_id, round_trip_version_id, review_status,
  primary_request_id, daily_request_id, normalized_symbol, direction,
  opened_at_utc, closed_at_utc, entry_price_decimal, exit_price_decimal,
  analysis_json, analysis_sha256, observations_json, observations_sha256,
  indicators_json, indicators_sha256, refresh_available_at_utc,
  requested_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(
          versionId, scope.workspaceId, scope.accountId, candleReviewId,
          revision, target.roundTripId, target.roundTripVersionId, input.status,
          primaryRequestId, dailyRequestId, target.symbol, target.direction,
          target.openedAtUtc, target.closedAtUtc, target.entryPriceDecimal,
          target.exitPriceDecimal, analysis.json, analysis.sha256,
          observations.json, observations.sha256, indicators.json,
          indicators.sha256, input.refreshAvailableAtUtc, scope.userId,
          input.analyzedAtUtc,
        );
      if (current) {
        const changed = this.database.prepare(`
UPDATE journal_round_trip_candle_reviews
SET current_version_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND candle_review_id = ? AND revision = ?`)
          .run(versionId, revision, input.analyzedAtUtc, scope.workspaceId, scope.accountId, candleReviewId, current.revision);
        if (changed.changes !== 1) platformFailure("TRADERLINK_CANDLE_REVIEW_CONFLICT");
      } else {
        this.database.prepare(`
INSERT INTO journal_round_trip_candle_reviews (
  candle_review_id, workspace_id, account_id, round_trip_id,
  analysis_contract_version, current_version_id, lifecycle_state, revision,
  created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?)`)
          .run(candleReviewId, scope.workspaceId, scope.accountId, target.roundTripId,
            JOURNAL_CANDLE_REVIEW_CONTRACT_VERSION, versionId, scope.userId,
            input.analyzedAtUtc, input.analyzedAtUtc);
      }
      const saved = this.readCurrent(scope, target);
      if (!saved) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { check: "candle_review_saved_read" });
      return saved;
    });
  }

  private insertAttempt(
    scope: AccountScope,
    target: CandleReviewTarget,
    attempt: PersistedMarketDataAttempt,
  ): string {
    requireAcceptedAttemptIntegrity(attempt);
    const requestId = createCanonicalUuidV4();
    const candleSetId = attempt.result.ok ? createCanonicalUuidV4() : null;
    const candles = attempt.result.ok ? attempt.result.candles : Object.freeze([]);
    const coverageStart = candles[0]?.time ?? null;
    const coverageEnd = candles.at(-1)?.time ?? null;
    const outcome = attempt.result.ok ? "accepted" : attempt.result.code;
    this.database.prepare(`
INSERT INTO level_analysis_market_data_requests (
  request_id, workspace_id, account_id, round_trip_id, round_trip_version_id,
  provider_key, provider_adapter_version, normalized_symbol, interval,
  requested_start_utc, requested_end_utc, include_extended_hours,
  timestamp_semantics, provider_exchange_timezone, provider_utc_offset_seconds,
  adjustment_policy, requested_at_utc, completed_at_utc, outcome,
  failure_reason_code, normalized_candle_set_id, candle_count,
  coverage_start_utc, coverage_end_utc, normalized_candle_sha256
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'provider_epoch_seconds_utc', ?, ?,
  'provider_quote_unadjusted_v1', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        requestId, scope.workspaceId, scope.accountId, target.roundTripId,
        target.roundTripVersionId, YAHOO_CHART_PROVIDER_KEY,
        YAHOO_CHART_ADAPTER_VERSION, target.symbol, attempt.interval,
        utcFromSeconds(attempt.startTime), utcFromSeconds(attempt.endTime),
        attempt.result.exchangeTimezone, attempt.result.utcOffsetSeconds,
        attempt.requestedAtUtc, attempt.completedAtUtc, outcome,
        attempt.result.ok ? null : attempt.result.failureReasonCode,
        candleSetId, candles.length,
        coverageStart === null ? null : utcFromSeconds(coverageStart),
        coverageEnd === null ? null : utcFromSeconds(coverageEnd),
        attempt.result.ok ? attempt.result.normalizedCandleSha256 : null,
      );
    if (!attempt.result.ok || !candleSetId) return requestId;
    this.database.prepare(`
INSERT INTO level_analysis_normalized_candle_sets (
  candle_set_id, workspace_id, account_id, request_id, provider_key,
  provider_adapter_version, normalized_symbol, interval, include_extended_hours,
  timestamp_semantics, provider_exchange_timezone, provider_utc_offset_seconds,
  adjustment_policy, coverage_start_utc, coverage_end_utc, candle_count,
  normalized_candle_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'provider_epoch_seconds_utc', ?, ?,
  'provider_quote_unadjusted_v1', ?, ?, ?, ?, ?)`)
      .run(
        candleSetId, scope.workspaceId, scope.accountId, requestId,
        YAHOO_CHART_PROVIDER_KEY, YAHOO_CHART_ADAPTER_VERSION, target.symbol,
        attempt.interval, attempt.result.exchangeTimezone,
        attempt.result.utcOffsetSeconds, utcFromSeconds(coverageStart!),
        utcFromSeconds(coverageEnd!), candles.length,
        attempt.result.normalizedCandleSha256, attempt.completedAtUtc,
      );
    const insert = this.database.prepare(`
INSERT INTO level_analysis_normalized_candles (
  candle_set_id, workspace_id, account_id, candle_time_utc, open_decimal,
  high_decimal, low_decimal, close_decimal, volume_decimal
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const candle of candles) {
      insert.run(candleSetId, scope.workspaceId, scope.accountId, candle.time,
        candle.openDecimal, candle.highDecimal, candle.lowDecimal,
        candle.closeDecimal, candle.volumeDecimal);
    }
    return requestId;
  }
}
