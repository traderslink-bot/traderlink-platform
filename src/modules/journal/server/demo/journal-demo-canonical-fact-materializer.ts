import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAnnotationRepository } from "../annotations/journal-annotation-repository";
import { JournalAnnotationService } from "../annotations/journal-annotation-service";
import { JournalRuleRepository } from "../annotations/journal-rule-repository";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { JournalImportRepository } from "../imports/journal-import-repository";
import { JournalRoundTripRepository } from "../round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import { materializeJournalDemoAnalyzerFacts } from "./journal-demo-analyzer-materializer";
import type { JournalDemoDerivedTradeFact, JournalDemoFinancialPackSource } from "./journal-demo-financial-pack-source";
import type { JournalDemoVerifiedMarketDaysInput } from "./journal-demo-financial-pack-source";
import type { JournalDemoExecutionProvenanceFact, JournalDemoFinancialPack } from "./journal-demo-pack-contract";

const DEMO_PACK_VERSION_ID = "750b9d83-d7de-49a0-ae89-0383ad20f21b";
const MATERIALIZER_VERSION = "demo_canonical_journal_v1";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalJson(value: unknown): string {
  const normalize = (candidate: unknown): unknown => Array.isArray(candidate)
    ? candidate.map(normalize)
    : candidate && typeof candidate === "object"
      ? Object.fromEntries(Object.entries(candidate as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, normalize(child)]))
      : candidate;
  return `${JSON.stringify(normalize(value))}\n`;
}

function scopeFor(input: Readonly<{ accountId: string; createdForUserId: string; workspaceId: string }>): AccountScope {
  return Object.freeze({ accountId: input.accountId, userId: input.createdForUserId,
    workspaceId: input.workspaceId, workspaceRole: "owner" });
}

function sourceTimestampText(executedAtUtc: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", second: "2-digit",
    month: "2-digit", timeZone: "America/New_York", year: "numeric",
  }).formatToParts(new Date(executedAtUtc));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  if (!value.year || !value.month || !value.day || !value.hour || !value.minute || !value.second) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoExecutionTimestamp" });
  }
  return `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}:${value.second}`;
}

function currentRoundTripId(database: Database.Database, scope: AccountScope, openedAtUtc: string): string {
  const rows = database.prepare<[string, string, string], { round_trip_id: string }>(`SELECT round_trip.round_trip_id
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version ON version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ? AND version.opened_at_utc = ?
  AND version.projection_state = 'ready_closed'
ORDER BY round_trip.round_trip_id`).all(scope.workspaceId, scope.accountId, openedAtUtc);
  if (rows.length !== 1 || !rows[0]) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoRoundTripProjection" });
  }
  return rows[0].round_trip_id;
}

function materializeAnnotations(input: Readonly<{
  database: Database.Database;
  scope: AccountScope;
  timestamp: Date;
  trades: readonly JournalDemoDerivedTradeFact[];
}>): void {
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(input.database), new JournalRuleRepository(input.database),
  );
  const entryRule = annotations.createRule(input.scope, {
    sourceKind: "custom", title: "Wait for confirmation", statement: "Enter only after the planned confirmation.",
    category: "entry_process", reviewScope: "both", isFocus: true, configuration: {}, now: input.timestamp,
  });
  const riskRule = annotations.createRule(input.scope, {
    sourceKind: "custom", title: "Respect planned risk", statement: "Keep size and exits inside the trade plan.",
    category: "risk_process", reviewScope: "both", isFocus: true, configuration: {}, now: input.timestamp,
  });
  for (const [index, trade] of input.trades.entries()) {
    const roundTripId = currentRoundTripId(input.database, input.scope, trade.executions[0]!.executedAtUtc);
    const broken = index % 4 === 1 || index % 5 === 0;
    annotations.saveTradeReview(input.scope, {
      roundTripId,
      note: { expectedRevision: null,
        tradeNote: broken ? "Demo review: the plan was broken; size or timing needs tighter discipline." : "Demo review: followed the planned process and documented the management decision." },
      tags: { expectedTagIds: [], tagIds: [], presetKeys: broken
        ? ["setup_breakout", "process_broke_rule", "entry_early"]
        : ["setup_pullback", "process_followed_plan", "exit_scaled_out"] },
      ruleReviews: [
        { ruleId: entryRule.ruleId, ruleVersionId: entryRule.versionId, expectedRevision: null, status: broken ? "broken" : "followed" },
        { ruleId: riskRule.ruleId, ruleVersionId: riskRule.versionId, expectedRevision: null, status: index % 3 === 0 ? "broken" : "followed" },
      ],
      now: input.timestamp,
    });
  }
  for (const date of ["2026-08-26", "2026-08-27"]) {
    const tradingDayId = annotations.ensureTradingDayId(input.scope, date, input.timestamp);
    annotations.saveDailyNote(input.scope, {
      tradingDate: date, expectedRevision: null,
      whatWorked: "Demo day: reviewed confirmations, planned entries, and scale-out decisions.",
      whatNeedsWork: "Demo day rule was broken: slow down after an early entry and re-check planned risk.",
      technicalRecap: "These are synthetic demo trades priced from verified one-minute market candles.",
      tomorrowsFocus: "Wait for confirmation and keep size inside the plan.",
      anythingElse: "Demo data remains read-only until it is cleared.", now: input.timestamp,
    });
    annotations.saveRuleReview(input.scope, {
      ruleId: entryRule.ruleId, ruleVersionId: entryRule.versionId, targetKind: "trading_day",
      targetId: tradingDayId, status: "broken", note: "Demo day rule intentionally marked broken for review.",
      expectedRevision: null, now: input.timestamp,
    });
  }
}

/** Writes only canonical Journal facts; it makes no provider or Analyzer job call. */
export function materializeJournalDemoFinancialFacts(input: Readonly<{
  accountId: string; createdForUserId: string; database: Database.Database;
  source: JournalDemoFinancialPackSource; workspaceId: string;
}>): Readonly<{ executionProvenance: readonly JournalDemoExecutionProvenanceFact[] }> {
  const scope = scopeFor(input);
  const timestamp = createCanonicalUtcTimestamp();
  const createdAt = new Date(timestamp);
  const instruments = new JournalImportRepository(input.database);
  const executions = new JournalExecutionRepository(input.database);
  const provenance: JournalDemoExecutionProvenanceFact[] = [];
  const createdExecutionIds: string[] = [];
  for (const trade of input.source.trades) {
    const instrumentId = instruments.findOrCreateInstrument({
      instrumentId: createCanonicalUuidV4(), workspaceId: input.workspaceId, assetClass: "stock",
      normalizedSymbol: trade.symbol, quoteCurrency: "USD", timestamp,
    });
    for (const fact of trade.executions) {
      const executionId = createCanonicalUuidV4();
      const executionVersionId = createCanonicalUuidV4();
      const executionFact = Object.freeze({
        instrumentId, tradeCurrency: "USD", sourceTimestampText: sourceTimestampText(fact.executedAtUtc),
        sourceTimezone: "America/New_York", timeParserVersion: "demo_market_candle_v1",
        executedAtUtc: fact.executedAtUtc, sourceOrderKey: `demo_pack_${fact.packExecutionKey}`,
        side: fact.side, quantityDecimal: fact.quantityDecimal, priceDecimal: fact.priceDecimal,
        feesDecimal: fact.executionFeeDecimal, feeCurrency: "USD", feeSignConvention: "cash_effect" as const,
        factCompleteness: "complete" as const,
      });
      executions.createExecution({ executionId, executionVersionId, workspaceId: input.workspaceId,
        accountId: input.accountId, state: "accepted", facts: executionFact, actorKind: "system",
        actorUserId: null, changeReasonCode: "demo_pack_materialization", timestamp });
      provenance.push(Object.freeze({ executionId, executionVersionId, packExecutionKey: fact.packExecutionKey,
        executionFactSha256: sha256(canonicalJson({ ...executionFact, marketCandleTimeUtcSeconds: fact.marketCandleTimeUtcSeconds, source: fact.source })) }));
      createdExecutionIds.push(executionId);
    }
  }
  const roundTrips = new JournalRoundTripService(new JournalRoundTripRepository(input.database));
  const rebuilds = roundTrips.rebuildAffectedExecutionChains(scope, createdExecutionIds, {
    kind: "maintenance", maintenanceReasonCode: "demo_pack_materialization", now: createdAt,
  });
  if (rebuilds.some((rebuild) => rebuild.needsDecisionCount !== 0 || rebuild.readyClosedCount === 0)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoRoundTripRebuild" });
  }
  materializeAnnotations({ database: input.database, scope, timestamp: createdAt, trades: input.source.trades });
  return Object.freeze({ executionProvenance: Object.freeze(provenance) });
}

export function createJournalDemoFinancialPack(
  source: JournalDemoFinancialPackSource,
  verifiedMarketDays: JournalDemoVerifiedMarketDaysInput,
): JournalDemoFinancialPack {
  if (source.corporateActionReview !== "required_before_materialization") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoCorporateActionReview" });
  }
  return Object.freeze({
    manifest: Object.freeze({ demoPackVersionId: DEMO_PACK_VERSION_ID, manifestSha256: source.derivedFactManifestSha256,
      marketDataManifestSha256: source.marketDataManifestSha256, materializerVersion: MATERIALIZER_VERSION,
      packKey: source.packKey, packVersion: source.packVersion }),
    materializeCanonicalFacts: ({ accountId, createdForUserId, database, workspaceId }) => {
      const materialized = materializeJournalDemoFinancialFacts({ accountId, createdForUserId, database, source, workspaceId });
      materializeJournalDemoAnalyzerFacts({ accountId, createdForUserId, database, source, verifiedMarketDays, workspaceId });
      return Object.freeze({ executionProvenance: materialized.executionProvenance,
        materializedFactManifestSha256: source.derivedFactManifestSha256,
        materializedMarketDataManifestSha256: source.marketDataManifestSha256 });
    },
  });
}
