import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type {
  JournalSwingPositionDetail,
  JournalTrackedPositionDetail,
  JournalTrackedPosition,
} from "@/src/modules/journal/contracts/journal-trade-tracker-contracts";
import type { JournalTradeStyleRecord } from "@/src/modules/journal/contracts/journal-trade-style-contracts";
import type { JournalEditableManualExecution } from "@/src/modules/journal/server/manual-trades/journal-manual-execution-edit-service";
import type { JournalTradingDayReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { withJournalAnalyticsDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import type {
  JournalDailyNoteRecord,
  JournalRoundTripNoteRecord,
  JournalRuleRecord,
  JournalRuleReviewRecord,
  JournalTagRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { withReadonlyJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { evaluateJournalPresetRules } from "@/src/modules/journal/server/annotations/journal-preset-rule-evaluator";
import { currentJournalAccountSelectionRef } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { dailyTradeYahooAnalyzerEnabled } from "@/src/modules/level-analysis/server/daily-trade-analyzer-feature";

import type {
  DaySessionDailyNote,
  DaySessionData,
  DaySessionRule,
  DaySessionTradeAnalyzer,
  DaySessionTradeTag,
} from "./[sessionDate]/day-session-types";

export type ReplacementSwingPositionDetail = Omit<JournalSwingPositionDetail, "executions"> & Readonly<{
  availableTags: readonly DaySessionTradeTag[];
  executions: readonly (Omit<JournalSwingPositionDetail["executions"][number], "executionId"> & Readonly<{
    manualEdit: {
      editRef: string;
      fees: string | null;
      localDate: string;
      localTime: string;
      sourceTimezone: string;
      tradeCurrency: string;
    } | null;
  }>)[];
  rules: readonly DaySessionRule[];
  tags: readonly DaySessionTradeTag[];
}>;

function emptyNote(): DaySessionDailyNote {
  return {
    anythingElse: "",
    revision: null,
    technicalRecap: "",
    tomorrowsFocus: "",
    whatNeedsWork: "",
    whatWorked: "",
  };
}

function noteView(note: JournalDailyNoteRecord | null): DaySessionDailyNote {
  return note
    ? {
        anythingElse: note.anythingElse,
        revision: String(note.revision),
        technicalRecap: note.technicalRecap,
        tomorrowsFocus: note.tomorrowsFocus,
        whatNeedsWork: note.whatNeedsWork,
        whatWorked: note.whatWorked,
      }
    : emptyNote();
}

function tagView(tag: JournalTagRecord): DaySessionTradeTag {
  return {
    assignmentCount: tag.assignmentCount,
    name: tag.name,
    revision: String(tag.revision),
    tagId: tag.tagId,
  };
}

function reviewStatus(
  review: JournalRuleReviewRecord | undefined,
): DaySessionRule["status"] {
  return review?.status === "not_reviewed"
    ? "not-reviewed"
    : review?.status ?? "not-reviewed";
}

type AnnotationSnapshot = Readonly<{
  dailyNote: JournalDailyNoteRecord | null;
  roundTripNotes: Readonly<Record<string, JournalRoundTripNoteRecord>>;
  rules: readonly DaySessionRule[];
  tags: readonly JournalTagRecord[];
  tagsByRoundTrip: Readonly<Record<string, readonly JournalTagRecord[]>>;
  weekNotes: Readonly<Record<string, JournalDailyNoteRecord | null>>;
}>;

type AnalyzerRow = Readonly<{
  daily_trade_analysis_version_id: string;
  market_session_set_version_id: string | null;
  round_trip_id: string;
  status: DaySessionTradeAnalyzer["status"];
}>;

type AnalyzerSnapshotRow = Readonly<{
  candle_time_utc_seconds: number | null;
  event_kind: DaySessionTradeAnalyzer["events"][number]["kind"];
  snapshot_json: string;
}>;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function analyzerSnapshotView(row: AnalyzerSnapshotRow): DaySessionTradeAnalyzer["events"][number] | null {
  try {
    const snapshot = JSON.parse(row.snapshot_json) as {
      event?: { executedAtUtc?: unknown; priceDecimal?: unknown; quantityDecimal?: unknown };
      indicators?: Record<string, unknown> | null;
      patterns?: Array<{ kind?: unknown; score?: unknown; time?: unknown }>;
    };
    if (!snapshot.event || typeof snapshot.event.executedAtUtc !== "string" ||
        typeof snapshot.event.priceDecimal !== "string" || typeof snapshot.event.quantityDecimal !== "string") {
      return null;
    }
    const indicators = snapshot.indicators && typeof snapshot.indicators === "object"
      ? {
          adr20: numberOrNull(snapshot.indicators.adr20),
          atr14: numberOrNull(snapshot.indicators.atr14),
          ema9: numberOrNull(snapshot.indicators.ema9),
          ema20: numberOrNull(snapshot.indicators.ema20),
          macd: numberOrNull(snapshot.indicators.macd),
          macdHistogram: numberOrNull(snapshot.indicators.macdHistogram),
          macdSignal: numberOrNull(snapshot.indicators.macdSignal),
          relativeVolume: numberOrNull(snapshot.indicators.relativeVolume),
          rsi14: numberOrNull(snapshot.indicators.rsi14),
          vwap: numberOrNull(snapshot.indicators.vwap),
        }
      : null;
    return {
      candleTime: row.candle_time_utc_seconds,
      executedAt: snapshot.event.executedAtUtc,
      indicators,
      kind: row.event_kind,
      patterns: (snapshot.patterns ?? []).flatMap((pattern) =>
        typeof pattern.kind === "string" && numberOrNull(pattern.score) !== null && numberOrNull(pattern.time) !== null
          ? [{ kind: pattern.kind, score: pattern.score as number, time: pattern.time as number }]
          : []),
      price: snapshot.event.priceDecimal,
      quantity: snapshot.event.quantityDecimal,
    };
  } catch {
    return null;
  }
}

function readDailyTradeAnalyzers(
  scope: WorkspaceAccessScope,
  roundTripIds: readonly string[],
): ReadonlyMap<string, DaySessionTradeAnalyzer> {
  if (roundTripIds.length === 0 || !scope.activeAccountId) return new Map();
  return withReadonlyPlatformDatabase({}, (database) => {
    const analysisForRoundTrip = database.prepare<[string, string, string], AnalyzerRow>(`SELECT
  analysis.round_trip_id,
  analysis.status,
  version.daily_trade_analysis_version_id,
  version.market_session_set_version_id
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
WHERE analysis.workspace_id = ? AND analysis.account_id = ? AND analysis.round_trip_id = ?`);
    const snapshots = database.prepare<[string], AnalyzerSnapshotRow>(`SELECT
  event_kind, candle_time_utc_seconds, snapshot_json
FROM journal_round_trip_daily_trade_analysis_event_snapshots
WHERE daily_trade_analysis_version_id = ?
ORDER BY CASE event_kind WHEN 'entry' THEN 1 WHEN 'add' THEN 2 WHEN 'partial_exit' THEN 3 ELSE 4 END, candle_time_utc_seconds`);
    const paths = database.prepare<[string], {
      favorable_move_decimal: string | null;
      minutes_after_exit: 5 | 15 | 30 | 60;
      observed_at_candle_time_utc_seconds: number | null;
    }>(`SELECT minutes_after_exit, favorable_move_decimal, observed_at_candle_time_utc_seconds
FROM journal_round_trip_daily_trade_analysis_post_exit_paths
WHERE daily_trade_analysis_version_id = ?
ORDER BY minutes_after_exit`);
    const candles = database.prepare<[string], {
      candle_time_utc_seconds: number;
      close_decimal: string;
      high_decimal: string;
      low_decimal: string;
      open_decimal: string;
      volume_decimal: string;
    }>(`SELECT candle_time_utc_seconds, open_decimal, high_decimal, low_decimal, close_decimal, volume_decimal
FROM level_analysis_market_session_candles
WHERE market_session_set_version_id = ?
ORDER BY candle_time_utc_seconds`);
    const result = new Map<string, DaySessionTradeAnalyzer>();
    for (const roundTripId of roundTripIds) {
      const analysis = analysisForRoundTrip.get(scope.workspaceId, scope.activeAccountId, roundTripId);
      if (!analysis) continue;
      const eventViews = snapshots.all(analysis.daily_trade_analysis_version_id)
        .map(analyzerSnapshotView)
        .filter((snapshot): snapshot is DaySessionTradeAnalyzer["events"][number] => snapshot !== null);
      const hasCompleteExecutionCoverage = eventViews.length > 0 &&
        eventViews.every((event) => event.candleTime !== null && event.indicators !== null);
      result.set(roundTripId, {
        candles: analysis.market_session_set_version_id
          ? candles.all(analysis.market_session_set_version_id).map((candle) => ({
              close: candle.close_decimal,
              high: candle.high_decimal,
              low: candle.low_decimal,
              open: candle.open_decimal,
              time: candle.candle_time_utc_seconds,
              volume: candle.volume_decimal,
            }))
          : [],
        events: eventViews,
        finalExitPaths: paths.all(analysis.daily_trade_analysis_version_id).map((path) => ({
          favorableMove: path.favorable_move_decimal,
          minutesAfterExit: path.minutes_after_exit,
          observedAt: path.observed_at_candle_time_utc_seconds,
        })),
        status: analysis.status === "ready" && !hasCompleteExecutionCoverage
          ? "no_coverage"
          : analysis.status,
      });
    }
    return result;
  });
}

function annotationSnapshot(
  service: JournalAnnotationService,
  account: Parameters<JournalAnnotationService["listTags"]>[0],
  model: JournalTradingDayReadModel,
  swingRoundTripIds: ReadonlySet<string>,
): AnnotationSnapshot {
  const roundTripsById = new Map(model.tickers.flatMap((ticker) =>
    ticker.roundTrips.map((roundTrip, index) => [
      roundTrip.roundTripId,
      { id: roundTrip.roundTripId, label: `${ticker.symbol} trade ${index + 1}` },
    ] as const)));
  for (const position of model.openPositions) {
    if (!roundTripsById.has(position.roundTripId)) {
      roundTripsById.set(position.roundTripId, {
        id: position.roundTripId,
        label: `${position.symbol} open position`,
      });
    }
  }
  const roundTrips = [...roundTripsById.values()];
  const roundTripIds = roundTrips.map((roundTrip) => roundTrip.id);
  const tradingDayId = service.resolveTradingDayId(account, model.date);
  const reviews = tradingDayId
    ? service.listRuleReviews(account, { tradingDayId, roundTripIds })
    : [];
  const byReviewTarget = new Map(reviews.map((review) => [
    `${review.ruleId}:${review.targetKind}:${review.tradingDayId ?? review.roundTripId}`,
    review,
  ]));
  const rules = service.listRules(account).filter(
    (rule) => rule.lifecycleState === "active",
  );
  const automaticResults = evaluateJournalPresetRules(
    rules,
    model,
    swingRoundTripIds,
  );
  const toRule = (
    rule: JournalRuleRecord,
    applicability: "day" | "trade",
    targetRoundTripKey: string | null,
    targetLabel: string | null,
    automaticStatus?: Extract<DaySessionRule["status"], "followed" | "broken" | "n/a">,
  ): DaySessionRule => {
    const targetKind = applicability === "day" ? "trading_day" : "round_trip";
    const targetId = applicability === "day" ? tradingDayId : targetRoundTripKey;
    const review = targetId
      ? byReviewTarget.get(`${rule.ruleId}:${targetKind}:${targetId}`)
      : undefined;
    return {
      applicability,
      custom: rule.sourceKind === "custom",
      label: rule.title,
      revision: review ? String(review.revision) : null,
      ruleId: rule.ruleId,
      ruleVersion: rule.versionId,
      status: automaticStatus ?? reviewStatus(review),
      targetLabel,
      targetRoundTripKey,
    };
  };
  const customRules = rules.filter((rule) => rule.sourceKind === "custom");
  const rulesById = new Map(rules.map((rule) => [rule.ruleId, rule]));
  const dayRules = customRules
    .filter((rule) => rule.reviewScope === "day" || rule.reviewScope === "both")
    .map((rule) => toRule(rule, "day", null, null));
  const tradeRules = customRules
    .filter((rule) => rule.reviewScope === "trade" || rule.reviewScope === "both")
    .flatMap((rule) => roundTrips.map((roundTrip) =>
      toRule(rule, "trade", roundTrip.id, roundTrip.label)));
  for (const result of automaticResults) {
    const rule = rulesById.get(result.ruleId);
    if (!rule) continue;
    if (result.targetKind === "trading_day") {
      dayRules.push(toRule(rule, "day", null, null, result.status));
      continue;
    }
    const target = roundTripsById.get(result.targetRoundTripId ?? "");
    if (target) {
      tradeRules.push(toRule(rule, "trade", target.id, target.label, result.status));
    }
  }
  return Object.freeze({
    dailyNote: service.readDailyNote(account, model.date),
    roundTripNotes: service.readRoundTripNotes(account, roundTripIds),
    rules: Object.freeze([...dayRules, ...tradeRules]),
    tags: service.listTags(account),
    tagsByRoundTrip: service.listTagsForRoundTrips(account, roundTripIds),
    weekNotes: Object.freeze(Object.fromEntries(model.week.days.map((day) => [
      day.date,
      service.readDailyNote(account, day.date),
    ]))),
  });
}

function toDaySessionData(
  model: JournalTradingDayReadModel,
  annotations: AnnotationSnapshot,
  expectedAccountSelectionRef: string,
  trackedPositions: ReadonlyMap<string, Readonly<{
    positionRef: string;
    style: import("@/src/modules/journal/contracts/journal-trade-style-contracts").JournalTradeStyleRecord | null;
  }>>,
  openPositionDetails: ReadonlyMap<string, JournalTrackedPositionDetail>,
  editableManualExecutions: ReadonlyMap<string, JournalEditableManualExecution>,
  analyzers: ReadonlyMap<string, DaySessionTradeAnalyzer>,
  review: Readonly<{
    revision: number | null;
    status: "reviewed" | "incomplete" | null;
    unclassifiedOpenPositionCount: number;
    updatedAtUtc: string | null;
  }>,
): DaySessionData | null {
  if (model.currency === null) return null;
  const rulesByRoundTrip = new Map<string, DaySessionRule[]>();
  for (const rule of annotations.rules) {
    if (!rule.targetRoundTripKey) continue;
    rulesByRoundTrip.set(rule.targetRoundTripKey, [
      ...(rulesByRoundTrip.get(rule.targetRoundTripKey) ?? []),
      rule,
    ]);
  }
  return {
    availableTags: annotations.tags.map(tagView),
    availableSessionDates: [...model.availableTradingDates],
    currency: model.currency,
    dailyNote: noteView(annotations.dailyNote),
    date: model.date,
    decisionActivity: model.decisionActivity.map((item) => ({
      direction: item.direction,
      executionCount: item.executionCountOnDate,
      openedAt: item.openedAtUtc,
      reasonCodes: item.reasonCodes,
      roundTripKey: item.roundTripId,
      symbol: item.symbol,
    })),
    executionActivity: model.executionActivity.map((execution) => ({
      executedAt: execution.executedAtUtc,
      executionKey: execution.executionVersionId,
      manualEdit: (() => {
        const editable = editableManualExecutions.get(execution.executionId);
        return editable
          ? {
              editRef: editable.editRef,
              fees: editable.feesDecimal,
              localDate: editable.localDate,
              localTime: editable.localTime,
              sourceTimezone: editable.sourceTimezone,
              tradeCurrency: editable.tradeCurrency,
            }
          : null;
      })(),
      needsDecision: execution.needsDecision,
      price: execution.priceDecimal,
      quantity: execution.quantityDecimal,
      roundTripKeys: execution.roundTripIds,
      side: execution.side,
      symbol: execution.symbol,
    })),
    expectedAccountSelectionRef,
    netPnl: model.netPnlDecimal,
    needsDecisionCount: model.coverage.needsDecisionCount,
    nextSessionDate: model.nextTradingDate,
    openPositions: model.openPositions.map((position) => {
      const tracked = trackedPositions.get(position.roundTripId) ?? null;
      const detail = openPositionDetails.get(position.roundTripId) ?? null;
      const note = annotations.roundTripNotes[position.roundTripId] ?? null;
      const positionRules = rulesByRoundTrip.get(position.roundTripId) ?? [];
      return {
        averageEntryPrice: position.averageEntryPriceDecimal,
        direction: position.direction,
        executions: (detail?.executions ?? []).map((execution) => {
          const editable = editableManualExecutions.get(execution.executionId);
          return {
            executedAt: execution.executedAtUtc,
            executionKey: execution.executionId,
            manualEdit: editable
              ? {
                  editRef: editable.editRef,
                  fees: editable.feesDecimal,
                  localDate: editable.localDate,
                  localTime: editable.localTime,
                  sourceTimezone: editable.sourceTimezone,
                  tradeCurrency: editable.tradeCurrency,
                }
              : null,
            needsDecision: false,
            price: execution.priceDecimal,
            quantity: execution.quantityDecimal,
            roundTripKeys: [position.roundTripId],
            side: execution.side,
            symbol: position.symbol,
          };
        }),
        journal: {
          noteRevision: note ? String(note.revision) : null,
          ruleStatus: positionRules.some((rule) => rule.status === "broken")
            ? "broken"
            : positionRules.some((rule) => rule.status === "followed")
              ? "followed"
              : "not-reviewed",
          ruleSummary: positionRules.length === 0
            ? "No active trade rules"
            : `${positionRules.length} trader review${positionRules.length === 1 ? "" : "s"}`,
          tags: (annotations.tagsByRoundTrip[position.roundTripId] ?? []).map(tagView),
          technicalNote: "",
          tradeNote: note?.tradeNote ?? "",
        },
        openedAt: position.openedAtUtc,
        positionKey: position.roundTripId,
        positionRef: tracked?.positionRef ?? null,
        remainingQuantity: position.remainingQuantityDecimal,
        stableInstrumentKey: position.instrumentId,
        style: tracked?.style ?? null,
        symbol: position.symbol,
        timezone: position.timezone,
      };
    }),
    positionSnapshots: model.positionSnapshots.map((position) => ({
      averageEntryPrice: position.averageEntryPriceDecimal,
      closingQuantity: position.closingQuantityDecimal,
      direction: position.direction,
      openingQuantity: position.openingQuantityDecimal,
      positionKey: position.roundTripId,
      state: position.state,
      symbol: position.symbol,
    })),
    previousSessionDate: model.previousTradingDate,
    review,
    rules: [...annotations.rules],
    tickers: model.tickers.map((ticker) => ({
      gainLossPercent: ticker.gainLossPercentDecimal,
      netPnl: ticker.netPnlDecimal,
      roundTrips: ticker.roundTrips.map((roundTrip) => {
        const note = annotations.roundTripNotes[roundTrip.roundTripId] ?? null;
        const tradeRules = rulesByRoundTrip.get(roundTrip.roundTripId) ?? [];
        const aggregateStatus = tradeRules.some((rule) => rule.status === "broken")
          ? "broken"
          : tradeRules.some((rule) => rule.status === "followed")
            ? "followed"
            : "not-reviewed";
        return {
          analyzer: analyzers.get(roundTrip.roundTripId) ?? null,
          direction: roundTrip.direction,
          entryAt: roundTrip.entryAtUtc,
          entryPrice: roundTrip.entryPriceDecimal,
          exitAt: roundTrip.exitAtUtc,
          exitPrice: roundTrip.exitPriceDecimal,
          gainLossPercent: roundTrip.gainLossPercentDecimal,
          journal: {
            noteRevision: note ? String(note.revision) : null,
            ruleStatus: aggregateStatus,
            ruleSummary: tradeRules.length === 0
              ? "No active trade rules"
              : `${tradeRules.length} trader review${tradeRules.length === 1 ? "" : "s"}`,
            tags: (annotations.tagsByRoundTrip[roundTrip.roundTripId] ?? []).map(tagView),
            technicalNote: note?.technicalNote ?? "",
            tradeNote: note?.tradeNote ?? "",
          },
          netPnl: roundTrip.netPnlDecimal,
          roundTripKey: roundTrip.roundTripId,
          timezone: roundTrip.timezone,
        };
      }),
      stableInstrumentKey: ticker.instrumentId,
      symbol: ticker.symbol,
    })),
    timezone: model.timezone ?? "America/New_York",
    week: {
      currentSessionDate: model.latestTradingDate ?? model.date,
      days: model.week.days.map((day) => ({
        date: day.date,
        dailyNote: noteView(annotations.weekNotes[day.date] ?? null),
        netPnl: day.netPnlDecimal,
        tickerCount: day.tickerCount,
        tradeCount: day.tradeCount,
      })),
      netPnl: model.week.netPnlDecimal,
      tickerCount: model.week.tickerCount,
      tradeCount: model.week.tradeCount,
    },
  };
}

export function getReplacementDaySession(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    date: string | null;
    currency: string | null;
  }>,
): DaySessionData | null {
  const model = withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) =>
    dashboard.getTradingDay(scope, {
      requestedDate: input.date,
      currency: input.currency,
    }));
  if (model.currency === null) return null;
  const trackerState = withReadonlyJournalIntegrityRuntime(scope, (journal) => {
    const account = journal.tradeStyles.accountScope(scope);
    const trackedPositions = new Map(journal.tradeStyles.listPositionRows(account).map((position) => {
      const positionRef = journal.tradeStyles.positionRef(account, position.roundTripId);
      return [position.roundTripId, {
        positionRef,
        style: position.tradeStyle && position.openStatus && position.styleRevision &&
            position.plannedFromEntry !== null && position.claimedEffectiveAtUtc &&
            position.declaredAtUtc && position.styleLifecycleState &&
            position.styleUpdatedAtUtc
          ? Object.freeze({
              positionRef,
              revision: position.styleRevision,
              tradeStyle: position.tradeStyle,
              openStatus: position.openStatus,
              plannedFromEntry: position.plannedFromEntry,
              claimedEffectiveAtUtc: position.claimedEffectiveAtUtc,
              declaredAtUtc: position.declaredAtUtc,
              lifecycleState: position.styleLifecycleState,
              updatedAtUtc: position.styleUpdatedAtUtc,
            })
          : null,
      }] as const;
    }));
    const editableManualExecutions = new Map(
      journal.manualExecutionEdits.listEditable(account).map((execution) => [
        execution.executionId,
        execution,
      ] as const),
    );
    const openPositionDetails = new Map(model.openPositions.flatMap((position) => {
      const tracked = trackedPositions.get(position.roundTripId);
      if (!tracked) return [];
      return [[
        position.roundTripId,
        journal.tradeTrackerReads.positionDetail(account, tracked.positionRef, model.date),
      ] as const];
    }));
    const review = journal.tradingDayReviews.read(account, model.date);
    return Object.freeze({
      editableManualExecutions,
      openPositionDetails,
      review: Object.freeze({
        revision: review?.revision ?? null,
        status: review?.status ?? null,
        unclassifiedOpenPositionCount:
          journal.tradingDayReviews.unclassifiedOpenPositionCount(account, model.date),
        updatedAtUtc: review?.updatedAtUtc ?? null,
      }),
      trackedPositions,
    });
  });
  const swingRoundTripIds = new Set(
    [...trackerState.trackedPositions.entries()]
      .filter(([, position]) => position.style?.tradeStyle === "swing")
      .map(([roundTripId]) => roundTripId),
  );
  const annotations = withReadonlyJournalAnnotations(scope, (service, account) =>
    annotationSnapshot(service, account, model, swingRoundTripIds));
  const analyzers = dailyTradeYahooAnalyzerEnabled()
    ? readDailyTradeAnalyzers(
        scope,
        model.tickers.flatMap((ticker) => ticker.roundTrips.map((roundTrip) => roundTrip.roundTripId)),
      )
    : new Map<string, DaySessionTradeAnalyzer>();
  return toDaySessionData(
    model,
    annotations,
    currentJournalAccountSelectionRef(scope),
    trackerState.trackedPositions,
    trackerState.openPositionDetails,
    trackerState.editableManualExecutions,
    analyzers,
    trackerState.review,
  );
}

export function getReplacementTradeTrackerAccount(
  scope: WorkspaceAccessScope,
): Readonly<{
  baseCurrency: string;
  tradingTimezone: string;
}> | null {
  if (!scope.activeAccountId) return null;
  return withReadonlyPlatformDatabase({}, (database) => {
    const account = new JournalAccountService(
      new JournalAccountRepository(database),
    ).requireAccountRecord(scope, scope.activeAccountId!);
    return Object.freeze({
      baseCurrency: account.baseCurrency,
      tradingTimezone: account.tradingTimezone,
    });
  });
}

export function getReplacementSwingTrackerPositions(
  scope: WorkspaceAccessScope,
  reviewDate: string,
): Readonly<{
  active: readonly JournalTrackedPosition[];
  completed: readonly JournalTrackedPosition[];
}> {
  return withReadonlyJournalIntegrityRuntime(scope, (journal) =>
    journal.tradeTrackerReads.listSwings(
      journal.tradeStyles.accountScope(scope),
      reviewDate,
    ));
}

export function getReplacementSwingPositionDetail(
  scope: WorkspaceAccessScope,
  positionRef: string,
  reviewDate: string,
): ReplacementSwingPositionDetail {
  const state = withReadonlyJournalIntegrityRuntime(scope, (journal) => {
    const account = journal.tradeStyles.accountScope(scope);
    const position = journal.tradeStyles.resolvePosition(account, positionRef);
    const detail = journal.tradeTrackerReads.swingDetail(
      account,
      positionRef,
      reviewDate,
    );
    const editableByExecutionId = new Map(
      journal.manualExecutionEdits.listEditable(account).map((execution) => [
        execution.executionId,
        execution,
      ] as const),
    );
    return Object.freeze({
      roundTripId: position.roundTripId,
      publicDetail: Object.freeze({
      ...detail,
      executions: Object.freeze(detail.executions.map((execution) => {
        const editable = editableByExecutionId.get(execution.executionId);
        return Object.freeze({
          allocationRole: execution.allocationRole,
          executedAtUtc: execution.executedAtUtc,
          feesDecimal: execution.feesDecimal,
          manualEdit: editable
            ? Object.freeze({
                editRef: editable.editRef,
                fees: editable.feesDecimal,
                localDate: editable.localDate,
                localTime: editable.localTime,
                sourceTimezone: editable.sourceTimezone,
                tradeCurrency: editable.tradeCurrency,
              })
            : null,
          priceDecimal: execution.priceDecimal,
          quantityDecimal: execution.quantityDecimal,
          side: execution.side,
          sourceTimestampText: execution.sourceTimestampText,
        });
      })),
      }),
    });
  });
  const annotations = withReadonlyJournalAnnotations(scope, (service, account) => {
    const reviews = service.listRuleReviews(account, {
      tradingDayId: "",
      roundTripIds: [state.roundTripId],
    });
    const reviewByRuleId = new Map(reviews.map((review) => [review.ruleId, review]));
    return Object.freeze({
      availableTags: Object.freeze(service.listTags(account).map(tagView)),
      rules: Object.freeze(service.listRules(account)
        .filter((rule) => rule.lifecycleState === "active" &&
          (rule.reviewScope === "trade" || rule.reviewScope === "both"))
        .map((rule): DaySessionRule => {
          const review = reviewByRuleId.get(rule.ruleId);
          return {
            applicability: "trade",
            custom: rule.sourceKind === "custom",
            label: rule.title,
            revision: review ? String(review.revision) : null,
            ruleId: rule.ruleId,
            ruleVersion: rule.versionId,
            status: reviewStatus(review),
            targetLabel: state.publicDetail.symbol,
            targetRoundTripKey: null,
          };
        })),
      tags: Object.freeze((service.listTagsForRoundTrips(account, [state.roundTripId])[
        state.roundTripId
      ] ?? []).map(tagView)),
    });
  });
  return Object.freeze({
    ...state.publicDetail,
    ...annotations,
  });
}

export function getReplacementOpenPositionStyles(
  scope: WorkspaceAccessScope,
): Readonly<Record<string, Readonly<{
  positionRef: string;
  style: JournalTradeStyleRecord | null;
}>>> {
  return withReadonlyJournalIntegrityRuntime(scope, (journal) => {
    const account = journal.tradeStyles.accountScope(scope);
    return Object.freeze(Object.fromEntries(
      journal.tradeStyles.listOpenPositionRows(account).map((position) => {
        const positionRef = journal.tradeStyles.positionRef(account, position.roundTripId);
        const style = position.tradeStyle && position.openStatus &&
            position.styleRevision && position.plannedFromEntry !== null &&
            position.claimedEffectiveAtUtc && position.declaredAtUtc &&
            position.styleLifecycleState && position.styleUpdatedAtUtc
          ? Object.freeze({
              positionRef,
              revision: position.styleRevision,
              tradeStyle: position.tradeStyle,
              openStatus: position.openStatus,
              plannedFromEntry: position.plannedFromEntry,
              claimedEffectiveAtUtc: position.claimedEffectiveAtUtc,
              declaredAtUtc: position.declaredAtUtc,
              lifecycleState: position.styleLifecycleState,
              updatedAtUtc: position.styleUpdatedAtUtc,
            })
          : null;
        return [position.roundTripId, Object.freeze({ positionRef, style })] as const;
      }),
    ));
  });
}
