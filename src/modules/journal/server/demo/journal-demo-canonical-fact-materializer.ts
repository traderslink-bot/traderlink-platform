import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import { JournalAnalyticsFactSetRepository } from "../analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "../analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from "../annotations/journal-annotation-repository";
import { JournalAnnotationService } from "../annotations/journal-annotation-service";
import { evaluateJournalPresetRules } from "../annotations/journal-preset-rule-evaluator";
import { JournalRuleRepository } from "../annotations/journal-rule-repository";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { JournalImportRepository } from "../imports/journal-import-repository";
import { JournalManualTradeCommandRepository } from "../manual-trades/journal-manual-trade-command-repository";
import { JournalRoundTripRepository } from "../round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import { materializeJournalDemoAnalyzerFacts } from "./journal-demo-analyzer-materializer";
import type { JournalDemoDerivedTradeFact, JournalDemoFinancialPackSource } from "./journal-demo-financial-pack-source";
import type { JournalDemoVerifiedMarketDaysInput } from "./journal-demo-financial-pack-source";
import type { JournalDemoExecutionProvenanceFact, JournalDemoFinancialPack } from "./journal-demo-pack-contract";

const DEMO_PACK_VERSION_IDS = Object.freeze({
  1: "750b9d83-d7de-49a0-ae89-0383ad20f21b",
  2: "927f9d3e-bc33-4b20-8e31-bb1e62597354",
  3: "5ae7f0b8-ae5c-4a9c-8548-737ba4b4b559",
  4: "cb0483be-7e57-4a08-832e-93ad3b279b9c",
  5: "e6101465-c643-4993-94d0-1f0c7bc5570d",
  6: "c1231afb-0850-4e4c-8a6f-24429ddaf1f9",
  7: "d2aef844-a400-4339-925d-9ce7a41f0cad",
  8: "6c34a046-7fd9-4e61-a34d-7af0eb0c83f6",
});
const DEMO_PRESET_RULE_EFFECTIVE_AT = new Date("2026-08-16T00:00:00.000Z");
const DEMO_TRADE_NOTE = "Took the first entry after the pullback held above VWAP and volume started coming back in. I liked the setup but entered a little earlier than I should have instead of waiting for the break over the previous candle high. Sold part into the first push and held the rest looking for a move through HOD. When momentum stalled I gave back more than necessary before exiting. Good idea overall, but I could have managed the second half better.";
const DEMO_DAILY_NOTE = Object.freeze({
  anythingElse: "Overall I felt more in control today even though I left some money on the table. I wasn't as reactive to every price move and did a better job waiting for setups I understood. The biggest mistake was the late chase, which was completely avoidable. Energy and focus were good through the morning, but I noticed myself getting less patient later in the session. Something to watch because that's usually when I start taking lower-quality trades.",
  technicalRecap: "The strongest setups today were stocks holding VWAP with rising volume after the opening pullback. Breakouts worked better when there was a clear consolidation under resistance instead of a straight move into the level. I noticed several failed pushes where volume dropped off near HOD and the next candles couldn't make new highs. EMA9 was useful for judging momentum, but VWAP and the previous resistance levels were more important for my entries and exits today.",
  tomorrowsFocus: "Your Current Focuses note is captured on every Daily Trade Tracker so you can review it alongside your trading results. Write down the habits, rules, or areas of your trading you are actively working on. Because your focuses carry beyond a single trading day, seeing them during each daily review helps keep them front and center and lets you judge whether your actual decisions are improving in the areas you chose to work on.",
  whatNeedsWork: "I still need to stop adding risk when a trade isn't doing what I expected. On two trades I stayed in too long after momentum started fading because I was focused on where I wanted the stock to go instead of what price was actually doing. I also chased one entry near the high after missing the original move. That trade never gave me a good risk/reward setup. I need to be okay with missing a trade instead of forcing a late entry.",
  whatWorked: "I was more selective today and didn't jump into every stock that started moving. My best trades came when I waited for a clean pullback and confirmation instead of buying the first spike. I also did a better job taking partial profits into strength instead of holding the entire position for a bigger move. After my first loss I stayed patient and waited for another setup instead of immediately trying to make the money back.",
});

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

function demoSourceRowFields(fact: JournalDemoDerivedTradeFact["executions"][number]): string {
  return JSON.stringify([
    fact.source === "synthetic_demo_derived_from_verified_moomoo_1m"
      ? "synthetic_demo_market_candle_v1"
      : fact.source === "synthetic_demo_invented_journal_only_v2"
        ? "synthetic_demo_journal_only_v2"
        : "synthetic_demo_journal_only_v4",
    fact.packExecutionKey,
    fact.analysisPolicy,
    fact.executedAtUtc,
    fact.marketCandleTimeUtcSeconds,
    fact.side,
    fact.quantityDecimal,
    fact.priceDecimal,
    fact.executionFeeDecimal,
    fact.source,
  ]);
}

function currentRoundTripId(
  database: Database.Database,
  scope: AccountScope,
  executionVersionId: string,
): string {
  const rows = database.prepare<[string, string, string], { round_trip_id: string }>(`SELECT round_trip.round_trip_id
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version ON version.round_trip_version_id = round_trip.current_version_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = version.workspace_id
 AND allocation.account_id = version.account_id
 AND allocation.round_trip_version_id = version.round_trip_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND allocation.execution_version_id = ? AND version.projection_state = 'ready_closed'
ORDER BY round_trip.round_trip_id`).all(scope.workspaceId, scope.accountId, executionVersionId);
  if (rows.length !== 1 || !rows[0]) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoRoundTripProjection" });
  }
  return rows[0].round_trip_id;
}

function firstExecutionVersionId(input: Readonly<{
  database: Database.Database;
  executionProvenance: readonly JournalDemoExecutionProvenanceFact[];
  scope: AccountScope;
  trade: JournalDemoDerivedTradeFact;
}>): string {
  const packExecutionKey = input.trade.executions[0]?.packExecutionKey;
  if (!packExecutionKey) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoTradeExecution" });
  }
  const newlyCreated = input.executionProvenance.find((fact) => fact.packExecutionKey === packExecutionKey);
  if (newlyCreated) return newlyCreated.executionVersionId;
  const existing = input.database.prepare<[string, string, string], { execution_version_id: string }>(`SELECT execution_version_id
FROM journal_demo_execution_provenance
WHERE workspace_id = ? AND account_id = ? AND pack_execution_key = ?`).get(
    input.scope.workspaceId,
    input.scope.accountId,
    packExecutionKey,
  );
  if (!existing) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoExecutionProvenance" });
  }
  return existing.execution_version_id;
}

function materializeAnnotations(input: Readonly<{
  database: Database.Database;
  executionProvenance: readonly JournalDemoExecutionProvenanceFact[];
  scope: AccountScope;
  timestamp: Date;
  trades: readonly JournalDemoDerivedTradeFact[];
}>): void {
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(input.database), new JournalRuleRepository(input.database),
  );
  const existingRules = annotations.listRules(input.scope);
  const entryRule = existingRules.find((rule) => rule.sourceKind === "custom" && rule.title === "Wait for confirmation") ?? annotations.createRule(input.scope, {
    sourceKind: "custom", title: "Wait for confirmation", statement: "Enter only after the planned confirmation.",
    category: "entry_process", reviewScope: "both", isFocus: true, configuration: {}, now: input.timestamp,
  });
  const riskRule = existingRules.find((rule) => rule.sourceKind === "custom" && rule.title === "Respect planned risk") ?? annotations.createRule(input.scope, {
    sourceKind: "custom", title: "Respect planned risk", statement: "Keep size and exits inside the trade plan.",
    category: "risk_process", reviewScope: "both", isFocus: true, configuration: {}, now: input.timestamp,
  });
  const maximumTradesRule = existingRules.find((rule) => rule.templateKey === "maximum_trades_per_day") ?? annotations.createRule(input.scope, {
    sourceKind: "template", templateKey: "maximum_trades_per_day",
    title: "Maximum completed trades per day",
    statement: "Review completed trades after the selected daily trade limit.",
    category: "day", reviewScope: "day", isFocus: false,
    configuration: { maximumTrades: "6" }, now: DEMO_PRESET_RULE_EFFECTIVE_AT,
  });
  const cutoffRule = existingRules.find((rule) => rule.templateKey === "no_new_trades_after_time") ?? annotations.createRule(input.scope, {
    sourceKind: "template", templateKey: "no_new_trades_after_time",
    title: "No new trades after a selected time",
    statement: "Review trades whose factual entry begins at or after the selected cutoff.",
    category: "trade", reviewScope: "trade", isFocus: false,
    configuration: { cutoffTime: "10:00:00" }, now: DEMO_PRESET_RULE_EFFECTIVE_AT,
  });
  const maximumAttemptsRule = existingRules.find((rule) => rule.templateKey === "maximum_attempts_per_ticker") ?? annotations.createRule(input.scope, {
    sourceKind: "template", templateKey: "maximum_attempts_per_ticker",
    title: "Maximum ticker attempts per day",
    statement: "Review flat-to-flat attempts after the selected per-ticker limit.",
    category: "trade_day", reviewScope: "both", isFocus: false,
    configuration: { maximumAttempts: "2" }, now: DEMO_PRESET_RULE_EFFECTIVE_AT,
  });
  for (const [index, trade] of input.trades.entries()) {
    const roundTripId = currentRoundTripId(
      input.database,
      input.scope,
      firstExecutionVersionId({ ...input, trade }),
    );
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
  for (const date of [...new Set(input.trades.map((trade) => trade.tradingDateNewYork))].sort()) {
    const tradingDayId = annotations.ensureTradingDayId(input.scope, date, input.timestamp);
    const roundTripIds = new Set(input.trades
      .filter((trade) => trade.tradingDateNewYork === date)
      .map((trade) => currentRoundTripId(
        input.database,
        input.scope,
        firstExecutionVersionId({ ...input, trade }),
      )));
    if (!annotations.readDailyNote(input.scope, date)) {
      annotations.saveDailyNote(input.scope, {
        tradingDate: date, expectedRevision: null,
        whatWorked: "Demo day: reviewed confirmations, planned entries, and scale-out decisions.",
        whatNeedsWork: "Demo day rule was broken: slow down after an early entry and re-check planned risk.",
        technicalRecap: "The Analyzer-backed demo trades use verified one-minute candles; the Journal-only demo trades are clearly synthetic examples.",
        tomorrowsFocus: "Wait for confirmation and keep size inside the plan.",
        anythingElse: "Demo data remains read-only until it is cleared.", now: input.timestamp,
      });
    }
    const existingDayReviews = annotations.listRuleReviews(input.scope, {
      tradingDayId,
      roundTripIds: [...roundTripIds],
    });
    if (!existingDayReviews.some((review) => review.ruleId === entryRule.ruleId && review.targetKind === "trading_day")) {
      annotations.saveRuleReview(input.scope, {
        ruleId: entryRule.ruleId, ruleVersionId: entryRule.versionId, targetKind: "trading_day",
        targetId: tradingDayId, status: "broken", note: "Demo day rule intentionally marked broken for review.",
        expectedRevision: null, now: input.timestamp,
      });
    }
    const workspaceScope = Object.freeze({
      activeAccountId: input.scope.accountId,
      allowedAccountIds: Object.freeze([input.scope.accountId]),
      userId: input.scope.userId,
      workspaceId: input.scope.workspaceId,
      workspaceRole: input.scope.workspaceRole,
    });
    const dashboard = new JournalDashboardReadModelService(
      new JournalAnalyticsFactSetService(new JournalAnalyticsFactSetRepository(input.database)),
    );
    const model = dashboard.getTradingDay(workspaceScope, {
      requestedDate: date,
      currency: "USD",
      asOfUtc: input.timestamp.toISOString(),
    });
    for (const result of evaluateJournalPresetRules(
      [maximumTradesRule, cutoffRule, maximumAttemptsRule],
      model,
      new Set(),
    )) {
      if (result.status === "n/a") continue;
      if (result.targetKind === "round_trip" &&
        (!result.targetRoundTripId || !roundTripIds.has(result.targetRoundTripId))) {
        continue;
      }
      const targetId = result.targetKind === "trading_day" ? tradingDayId : result.targetRoundTripId!;
      if (!existingDayReviews.some((review) => review.ruleId === result.ruleId &&
        review.targetKind === result.targetKind &&
        (result.targetKind === "trading_day"
          ? review.tradingDayId === targetId
          : review.roundTripId === targetId))) {
        annotations.saveRuleReview(input.scope, {
          ruleId: result.ruleId,
          ruleVersionId: result.ruleVersionId,
          targetKind: result.targetKind,
          targetId,
          status: result.status,
          note: "Automatically evaluated from the immutable synthetic-demo Journal facts.",
          expectedRevision: null,
          now: input.timestamp,
        });
      }
    }
  }
}

function materializeDemoNotes(input: Readonly<{
  database: Database.Database;
  executionProvenance: readonly JournalDemoExecutionProvenanceFact[];
  scope: AccountScope;
  timestamp: Date;
  trades: readonly JournalDemoDerivedTradeFact[];
}>): void {
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(input.database), new JournalRuleRepository(input.database),
  );
  const roundTripIds = input.trades.map((trade) => currentRoundTripId(
    input.database, input.scope, firstExecutionVersionId({ ...input, trade }),
  ));
  const currentNotes = annotations.readRoundTripNotes(input.scope, roundTripIds);
  for (const roundTripId of roundTripIds) {
    const current = currentNotes[roundTripId] ?? null;
    if (current?.tradeNote === DEMO_TRADE_NOTE) continue;
    annotations.saveRoundTripNote(input.scope, {
      expectedRevision: current?.revision ?? null,
      technicalNote: current?.technicalNote ?? "",
      tradeNote: DEMO_TRADE_NOTE,
      now: input.timestamp,
      roundTripId,
    });
  }
  for (const date of [...new Set(input.trades.map((trade) => trade.tradingDateNewYork))]) {
    const current = annotations.readDailyNote(input.scope, date);
    if (current && current.whatWorked === DEMO_DAILY_NOTE.whatWorked &&
      current.whatNeedsWork === DEMO_DAILY_NOTE.whatNeedsWork &&
      current.technicalRecap === DEMO_DAILY_NOTE.technicalRecap &&
      current.tomorrowsFocus === DEMO_DAILY_NOTE.tomorrowsFocus &&
      current.anythingElse === DEMO_DAILY_NOTE.anythingElse) continue;
    annotations.saveDailyNote(input.scope, {
      expectedRevision: current?.revision ?? null,
      now: input.timestamp,
      tradingDate: date,
      ...DEMO_DAILY_NOTE,
    });
  }
}

/** Writes only canonical Journal facts; it makes no provider or Analyzer job call. */
export function materializeJournalDemoFinancialFacts(input: Readonly<{
  accountId: string; createdForUserId: string; database: Database.Database;
  annotationSource?: JournalDemoFinancialPackSource; source: JournalDemoFinancialPackSource; workspaceId: string;
}>): Readonly<{ executionProvenance: readonly JournalDemoExecutionProvenanceFact[] }> {
  const scope = scopeFor(input);
  const timestamp = createCanonicalUtcTimestamp();
  const createdAt = new Date(timestamp);
  if (input.source.trades.length === 0) {
    materializeDemoNotes({ database: input.database, scope, timestamp: createdAt,
      executionProvenance: Object.freeze([]),
      trades: input.annotationSource?.trades ?? input.source.trades });
    return Object.freeze({ executionProvenance: Object.freeze([]) });
  }
  const instruments = new JournalImportRepository(input.database);
  const executions = new JournalExecutionRepository(input.database);
  const boundaries = new JournalManualTradeCommandRepository(input.database);
  const provenance: JournalDemoExecutionProvenanceFact[] = [];
  const createdExecutionIds: string[] = [];
  const importBatchId = createCanonicalUuidV4();
  const importEventId = createCanonicalUuidV4();
  const manualIdempotencyKey = sha256(canonicalJson({
    kind: "synthetic_demo_market_candle_batch_v1",
    packKey: input.source.packKey,
    packVersion: input.source.packVersion,
  }));
  instruments.insertImportBatch({
    importBatchId,
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    sourceIdentityId: null,
    sourceKind: "manual_batch",
    sourceSystem: "demo_market_pack",
    sourceFileSha256: null,
    sourceFileSizeBytes: null,
    sourceMimeType: null,
    sourceEncoding: null,
    sourceDisplayLabel: "Demo Trade Tracker synthetic data",
    evidenceObjectKey: null,
    manualIdempotencyKey,
    adapterId: "demo_market_pack",
    adapterVersion: "demo_market_pack_v1",
    parserVersion: "demo_market_candle_v1",
    mappingVersion: "demo_market_pack_v1",
    mappingContractJson: JSON.stringify({
      contractVersion: "demo_market_pack_v1",
      source: "mixed_synthetic_demo_analyzer_and_journal_only",
    }),
    statementPeriodStartDate: input.source.trades.map((trade) => trade.tradingDateNewYork).sort()[0]!,
    statementPeriodEndDate: input.source.trades.map((trade) => trade.tradingDateNewYork).sort().at(-1)!,
    sourceTimezone: "America/New_York",
    currentState: "accepted",
    currentEventId: importEventId,
    preservedRowCount: input.source.trades.reduce(
      (count, trade) => count + trade.executions.length,
      0,
    ),
    mappedExecutionCount: input.source.trades.reduce(
      (count, trade) => count + trade.executions.length,
      0,
    ),
    unsupportedRowCount: 0,
    issueCount: 0,
    pendingDecisionCount: 0,
    createdByUserId: input.createdForUserId,
    timestamp,
  });
  instruments.insertAcceptedEvent({
    importEventId,
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    importBatchId,
    eventType: "accepted",
    actorUserId: input.createdForUserId,
    timestamp,
    reasonCode: "demo_pack_materialization",
  });
  let recordOrdinal = 0;
  for (const trade of input.source.trades) {
    const instrumentId = instruments.findOrCreateInstrument({
      instrumentId: createCanonicalUuidV4(), workspaceId: input.workspaceId, assetClass: "stock",
      normalizedSymbol: trade.symbol, quoteCurrency: "USD", timestamp,
    });
    for (const fact of trade.executions) {
      recordOrdinal += 1;
      const sourceRowId = createCanonicalUuidV4();
      const rawFieldsJson = demoSourceRowFields(fact);
      const rawRecordSha256 = sha256(rawFieldsJson);
      instruments.insertSourceRow({
        sourceRowId,
        workspaceId: input.workspaceId,
        accountId: input.accountId,
        importBatchId,
        recordOrdinal,
        sourceRecordIdentitySha256: sha256(canonicalJson([
        fact.source === "synthetic_demo_derived_from_verified_moomoo_1m"
          ? "demo_market_source_row_v1"
          : fact.source === "synthetic_demo_invented_journal_only_v2"
            ? "demo_journal_only_source_row_v2"
            : "demo_journal_only_source_row_v4",
          input.source.packKey,
          fact.packExecutionKey,
        ])),
        rawRecordSha256,
        rawFieldsJson,
        sectionName: "Synthetic demo market data",
        recordType: "Execution",
        assetCategory: "Stocks",
        contentFingerprintSha256: rawRecordSha256,
        occurrenceOrdinal: 1,
        initialClassification: "mapped_execution",
        mappingVersion: "demo_market_pack_v1",
        timestamp,
      });
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
      executions.insertProvenance({
        executionProvenanceId: createCanonicalUuidV4(),
        workspaceId: input.workspaceId,
        accountId: input.accountId,
        executionId,
        executionVersionId,
        importBatchId,
        sourceRowId,
        provenanceKind: "manual",
        providerIdentitySchemeVersion: null,
        providerIdentitySha256: null,
        timestamp,
      });
      provenance.push(Object.freeze({ analysisPolicy: fact.analysisPolicy, executionId, executionVersionId, packExecutionKey: fact.packExecutionKey,
        executionFactSha256: sha256(canonicalJson({ ...executionFact, analysisPolicy: fact.analysisPolicy,
          marketCandleTimeUtcSeconds: fact.marketCandleTimeUtcSeconds, source: fact.source })) }));
      createdExecutionIds.push(executionId);
    }
  }
  for (const trade of input.source.trades) {
    boundaries.insertBoundaryAssertion({
      scope,
      userId: input.createdForUserId,
      importBatchId,
      relationship: "start_new_trade",
      groupRef: sha256(canonicalJson([
        "demo_market_trade_boundary_v1",
        input.source.packKey,
        trade.packTradeKey,
      ])),
      payloadSha256: sha256(canonicalJson({
        executions: trade.executions.map((fact) => fact.packExecutionKey),
        trade: trade.packTradeKey,
      })),
      roundTripId: null,
      roundTripVersionId: null,
      expectedExistingVersion: null,
      sourceUi: "day_trade_tracker",
      idempotencyKey: manualIdempotencyKey,
      timestamp,
    });
  }
  const roundTrips = new JournalRoundTripService(new JournalRoundTripRepository(input.database));
  const rebuilds = roundTrips.rebuildAffectedExecutionChains(scope, createdExecutionIds, {
    kind: "maintenance", maintenanceReasonCode: "demo_pack_materialization", now: createdAt,
  });
  if (rebuilds.some((rebuild) => rebuild.needsDecisionCount !== 0 || rebuild.readyClosedCount === 0)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoRoundTripRebuild" });
  }
  materializeAnnotations({ database: input.database, executionProvenance: provenance,
    scope, timestamp: createdAt, trades: input.source.trades });
  materializeDemoNotes({ database: input.database, scope, timestamp: createdAt,
    executionProvenance: provenance,
    trades: input.annotationSource?.trades ?? input.source.trades });
  return Object.freeze({ executionProvenance: Object.freeze(provenance) });
}

export function createJournalDemoFinancialPack(
  source: JournalDemoFinancialPackSource,
  verifiedMarketDays: JournalDemoVerifiedMarketDaysInput,
  analyzerSource: JournalDemoFinancialPackSource | null = source,
  manifestSource: JournalDemoFinancialPackSource = source,
  annotationSource: JournalDemoFinancialPackSource = source,
): JournalDemoFinancialPack {
  if (source.corporateActionReview !== "required_before_materialization" &&
    source.corporateActionReview !== "not_applicable_synthetic_journal_only") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoCorporateActionReview" });
  }
  const demoPackVersionId = DEMO_PACK_VERSION_IDS[manifestSource.packVersion as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8];
  if (!demoPackVersionId) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoPackVersion" });
  }
  return Object.freeze({
    manifest: Object.freeze({ demoPackVersionId, manifestSha256: manifestSource.derivedFactManifestSha256,
      marketDataManifestSha256: manifestSource.marketDataManifestSha256,
      materializerVersion: `demo_canonical_journal_v${manifestSource.packVersion}`,
      packKey: manifestSource.packKey, packVersion: manifestSource.packVersion }),
    materializeCanonicalFacts: ({ accountId, createdForUserId, database, workspaceId }) => {
      const materialized = materializeJournalDemoFinancialFacts({ accountId, annotationSource, createdForUserId, database, source, workspaceId });
      if (analyzerSource) {
        materializeJournalDemoAnalyzerFacts({ accountId, createdForUserId, database,
          executionProvenance: materialized.executionProvenance, source: analyzerSource,
          verifiedMarketDays, workspaceId });
      }
      return Object.freeze({ executionProvenance: materialized.executionProvenance,
        materializedFactManifestSha256: manifestSource.derivedFactManifestSha256,
        materializedMarketDataManifestSha256: manifestSource.marketDataManifestSha256 });
    },
  });
}
