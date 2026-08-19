import "server-only";

import { loadEnvConfig } from "@next/env";
import Database from "better-sqlite3";

import type { DailyTradeAnalyzerResult } from
  "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import type { JournalManualTradeEntry } from
  "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import type { AccountScope, WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { deriveJournalAccountSelectionRef } from
  "@/src/modules/platform/contracts/journal-account-selection";
import { CoachAiReviewGenerationCoordinatorV2, type CoachAiReviewPaidAccessPolicyV2 } from
  "@/src/modules/coach/server/coach-ai-review-generation-coordinator-v2";
import { CoachAiReviewAuthoredPersistenceRepository } from
  "@/src/modules/coach/server/coach-ai-review-authored-persistence-repository";
import { CoachMonthlyAiReviewRunner } from
  "@/src/modules/coach/server/coach-monthly-ai-review-runner";
import { CoachReviewDeliveryScheduleRepository } from
  "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { JournalAccountRepository } from
  "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
  DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "@/src/modules/journal/server/accounts/journal-source-account-canonicalizers";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "@/src/modules/journal/server/accounts/journal-account-service";
import { JournalAnnotationRepository } from
  "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from
  "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from
  "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalDataDecisionRepository } from
  "@/src/modules/journal/server/decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from
  "@/src/modules/journal/server/decisions/journal-data-decision-service";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { JournalExecutionRepository } from
  "@/src/modules/journal/server/executions/journal-execution-repository";
import { JournalExecutionService } from
  "@/src/modules/journal/server/executions/journal-execution-service";
import {
  createJournalPrivacyDigester,
  JournalImportService,
  loadJournalPrivacyHmacConfiguration,
} from "@/src/modules/journal/server/imports/journal-import-service";
import { JournalImportRepository } from
  "@/src/modules/journal/server/imports/journal-import-repository";
import { createJournalManualTradePreviewAuthority } from
  "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-authority";
import { JournalManualTradeCommandRepository } from
  "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-repository";
import { JournalManualTradeCommandService } from
  "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-service";
import { JournalManualTradePreviewRepository } from
  "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-repository";
import { JournalManualTradePreviewService } from
  "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-service";
import { JournalExecutionReconciliationRepository } from
  "@/src/modules/journal/server/reconciliation/journal-execution-reconciliation-repository";
import { JournalTradingDayReviewService } from
  "@/src/modules/journal/server/reviews/journal-trading-day-review-service";
import { JournalRoundTripRepository } from
  "@/src/modules/journal/server/round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from
  "@/src/modules/journal/server/round-trips/journal-round-trip-service";
import { JournalTradeStyleRepository } from
  "@/src/modules/journal/server/trade-style/journal-trade-style-repository";
import { DailyTradeAnalyzerRepository } from
  "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";

const CONFIRMATION = "--confirm-live-v4-high-volume-four-week-plus-month";
const FIXTURE_PREFIX = "HVM";
const FIXTURE_ACCOUNT_NAME = "AI Review high-volume March test";
const FIXTURE_FIRST_ENABLED_AT = "2026-03-02T12:00:00.000Z";
const MONTHLY_ISSUED_AT = new Date("2026-04-01T16:00:00.000Z");

const FEBRUARY_DATES = Object.freeze([
  "2026-02-02", "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06",
  "2026-02-09", "2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13",
  "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20",
  "2026-02-23", "2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27",
] as const);

const MARCH_WEEKS = Object.freeze([
  Object.freeze({
    label: "week_1",
    dates: Object.freeze(["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06"]),
    issuedAt: new Date("2026-03-09T16:00:00.000Z"),
  }),
  Object.freeze({
    label: "week_2",
    dates: Object.freeze(["2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"]),
    issuedAt: new Date("2026-03-16T16:00:00.000Z"),
  }),
  Object.freeze({
    label: "week_3",
    dates: Object.freeze(["2026-03-16", "2026-03-17", "2026-03-18", "2026-03-19", "2026-03-20"]),
    issuedAt: new Date("2026-03-23T16:00:00.000Z"),
  }),
  Object.freeze({
    label: "week_4",
    dates: Object.freeze(["2026-03-23", "2026-03-24", "2026-03-25", "2026-03-26", "2026-03-27"]),
    issuedAt: new Date("2026-03-30T16:00:00.000Z"),
  }),
] as const);

const MARCH_MONTH_END_DATES = Object.freeze(["2026-03-30", "2026-03-31"] as const);

type FixtureTrade = Readonly<{
  globalIndex: number;
  tradingDate: string;
  symbol: string;
  pnlDecimal: string;
  brokeExitRule: boolean;
  lateEntry: boolean;
  greenToRed: boolean;
  strongEntry: boolean;
  period: "baseline" | "current";
}>;

type FixtureRules = Readonly<{
  exit: ReturnType<JournalAnnotationService["createRule"]>;
  entry: ReturnType<JournalAnnotationService["createRule"]>;
  day: ReturnType<JournalAnnotationService["createRule"]>;
}>;

type ProviderCallRow = Readonly<{
  request_id: string;
  review_kind: "weekly" | "monthly";
  period_start_date: string;
  period_end_date: string;
  call_count: number;
  completed_call_count: number;
  input_tokens: number;
  cached_input_tokens: number;
  cache_write_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_cents: number;
}>;

function fail(code: string): never {
  throw new Error(code);
}

function fixtureScope(
  database: Database.Database,
  owner: WorkspaceAccessScope,
): WorkspaceAccessScope {
  const accounts = new JournalAccountRepository(database);
  const matches = accounts.listActiveAccounts(owner.workspaceId)
    .filter((account) => account.displayName === FIXTURE_ACCOUNT_NAME);
  if (matches.length > 1) fail("high_volume_fixture_account_ambiguous");
  const account = matches[0] ?? new JournalAccountService(accounts).createAccount(owner, {
    workspaceId: owner.workspaceId,
    displayName: FIXTURE_ACCOUNT_NAME,
    baseCurrency: "USD",
    tradingTimezone: "America/New_York",
    now: new Date(FIXTURE_FIRST_ENABLED_AT),
  });
  return Object.freeze({
    userId: owner.userId,
    workspaceId: owner.workspaceId,
    workspaceRole: owner.workspaceRole,
    allowedAccountIds: Object.freeze([account.accountId]),
    activeAccountId: account.accountId,
  });
}

function setFixtureFirstEnabledAt(
  database: Database.Database,
  accountId: string,
  value: string,
): void {
  const trigger = database.prepare<[], Readonly<{ sql: string }>>(`SELECT sql
FROM sqlite_schema
WHERE type = 'trigger' AND name = 'coach_ai_review_account_settings_v2_update_guard'`).get();
  if (!trigger?.sql) fail("high_volume_fixture_settings_guard_missing");
  database.transaction(() => {
    database.exec("DROP TRIGGER coach_ai_review_account_settings_v2_update_guard");
    const result = database.prepare(`UPDATE coach_ai_review_account_settings_v2
SET first_enabled_at_utc = ? WHERE account_id = ?`).run(value, accountId);
    if (result.changes !== 1) fail("high_volume_fixture_settings_scope_mismatch");
    database.exec(trigger.sql);
  }).immediate();
}

function ensureFixtureReviewSettings(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): void {
  const schedules = new CoachReviewDeliveryScheduleRepository(database);
  const existing = schedules.readV2(scope);
  if (!existing) {
    schedules.saveV2(scope, {
      isEnabled: true,
      currentFrequency: "weekly",
      timingMode: "automatic_after_12_hours",
      twoWeekAnchorMondayDate: null,
      pendingFrequency: null,
      pendingEffectiveMondayDate: null,
      pendingTwoWeekAnchorMondayDate: null,
      expectedRevision: null,
    }, new Date(FIXTURE_FIRST_ENABLED_AT));
    return;
  }
  if (existing.firstEnabledAtUtc !== FIXTURE_FIRST_ENABLED_AT) {
    if (!scope.activeAccountId) fail("high_volume_account_missing");
    setFixtureFirstEnabledAt(database, scope.activeAccountId, FIXTURE_FIRST_ENABLED_AT);
  }
}

function createServices(database: Database.Database, clock: () => Date) {
  const accounts = new JournalAccountService(
    new JournalAccountRepository(database),
    loadAccountIdentityConfiguration(
      process.env,
      ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
      DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    ),
  );
  const imports = new JournalImportRepository(database);
  const executions = new JournalExecutionRepository(database);
  const reconciliations = new JournalExecutionReconciliationRepository(database);
  const importService = new JournalImportService(
    imports,
    executions,
    accounts,
    createJournalPrivacyDigester(loadJournalPrivacyHmacConfiguration(process.env)),
    reconciliations,
  );
  const roundTrips = new JournalRoundTripService(new JournalRoundTripRepository(database));
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    imports,
    importService,
    executions,
    new JournalExecutionService(executions),
    roundTrips,
    reconciliations,
  );
  const preview = new JournalManualTradePreviewService(
    new JournalManualTradePreviewRepository(database),
    accounts,
    createJournalManualTradePreviewAuthority(loadJournalPrivacyHmacConfiguration(process.env)),
    clock,
  );
  return Object.freeze({
    annotations: new JournalAnnotationService(
      new JournalAnnotationRepository(database), new JournalRuleRepository(database),
    ),
    analyzer: new DailyTradeAnalyzerRepository(database),
    command: new JournalManualTradeCommandService(
      new JournalManualTradeCommandRepository(database), importService, decisions, roundTrips, preview,
    ),
    dayReviews: new JournalTradingDayReviewService(database),
    positions: new JournalTradeStyleRepository(database),
    preview,
  });
}

function createRules(annotations: JournalAnnotationService, scope: AccountScope): FixtureRules {
  const at = new Date("2026-02-01T14:00:00.000Z");
  const existing = new Map(annotations.listRules(scope).map((rule) => [rule.title, rule] as const));
  return Object.freeze({
    exit: existing.get("Exit when your stop is hit") ?? annotations.createRule(scope, {
      sourceKind: "custom", title: "Exit when your stop is hit",
      statement: "Exit when the stop you set for the trade is hit.",
      category: "risk", reviewScope: "trade", isFocus: true, configuration: {}, now: at,
    }),
    entry: existing.get("Wait for the first pullback") ?? annotations.createRule(scope, {
      sourceKind: "custom", title: "Wait for the first pullback",
      statement: "Wait for the first pullback before entering.",
      category: "entry", reviewScope: "trade", isFocus: false, configuration: {},
      now: new Date(at.getTime() + 1_000),
    }),
    day: existing.get("Stop after your second loss") ?? annotations.createRule(scope, {
      sourceKind: "custom", title: "Stop after your second loss",
      statement: "After a second loss, stop taking new trades for the day.",
      category: "discipline", reviewScope: "day", isFocus: false, configuration: {},
      now: new Date(at.getTime() + 2_000),
    }),
  });
}

function profile(period: "baseline" | "current", weekIndex: number, index: number) {
  if (period === "baseline") {
    const greenToRed = index % 14 === 0;
    const brokeExitRule = greenToRed || index % 17 === 0;
    return Object.freeze({
      pnlDecimal: greenToRed ? "-92" : index % 4 === 0 ? "-38" : String(48 + (index % 5) * 13),
      greenToRed, brokeExitRule, lateEntry: index % 12 === 0,
      strongEntry: !greenToRed && index % 3 !== 0,
    });
  }
  const difficultWeek = weekIndex === 2;
  const greenToRed = difficultWeek ? index % 3 === 0 : index % (weekIndex === 1 ? 18 : 12) === 0;
  const brokeExitRule = greenToRed || (difficultWeek ? index % 5 === 0 : index % 14 === 0);
  const lateEntry = difficultWeek ? index % 4 === 0 : index % (weekIndex === 3 ? 9 : 15) === 0;
  const pnlDecimal = greenToRed
    ? String(difficultWeek ? -145 - (index % 4) * 20 : -95 - (index % 3) * 15)
    : difficultWeek
      ? index % 5 === 0 ? "78" : "-62"
      : index % 5 === 0 ? "-44" : String(58 + (index % 6) * 12);
  return Object.freeze({ pnlDecimal, greenToRed, brokeExitRule, lateEntry, strongEntry: !lateEntry && Number(pnlDecimal) > 0 });
}

function makeTrades(
  dates: readonly string[],
  startIndex: number,
  period: "baseline" | "current",
  weekIndex: number,
): readonly FixtureTrade[] {
  const trades: FixtureTrade[] = [];
  for (let dayIndex = 0; dayIndex < dates.length; dayIndex += 1) {
    const date = dates[dayIndex];
    if (!date) fail("high_volume_fixture_date_missing");
    for (let tradeIndex = 0; tradeIndex < 20; tradeIndex += 1) {
      const globalIndex = startIndex + dayIndex * 20 + tradeIndex;
      const detail = profile(period, weekIndex, dayIndex * 20 + tradeIndex);
      trades.push(Object.freeze({
        ...detail, globalIndex, period, tradingDate: date,
        symbol: `${FIXTURE_PREFIX}${String(globalIndex + 1).padStart(4, "0")}`,
      }));
    }
  }
  return Object.freeze(trades);
}

function manualEntries(trades: readonly FixtureTrade[]): readonly JournalManualTradeEntry[] {
  return Object.freeze(trades.flatMap((trade, index) => {
    const openMinute = 30 + index;
    const exitMinute = openMinute + 1;
    const exitPrice = (10 + ((Number(trade.pnlDecimal) + 2) / 100)).toFixed(2)
      .replace(/\.0+$/u, "")
      .replace(/(\.\d*[1-9])0+$/u, "$1");
    return [
      Object.freeze({
        clientRowRef: `high-volume-${trade.globalIndex + 1}-entry`, localDate: trade.tradingDate,
        localTime: `09:${String(openMinute).padStart(2, "0")}:00`, sourceTimezone: "America/New_York",
        normalizedSymbol: trade.symbol, tradeCurrency: "USD", side: "buy" as const,
        quantityDecimal: "100", priceDecimal: "10", feesDecimal: "1",
      }),
      Object.freeze({
        clientRowRef: `high-volume-${trade.globalIndex + 1}-exit`, localDate: trade.tradingDate,
        localTime: `09:${String(exitMinute).padStart(2, "0")}:00`, sourceTimezone: "America/New_York",
        normalizedSymbol: trade.symbol, tradeCurrency: "USD", side: "sell" as const,
        quantityDecimal: "100", priceDecimal: exitPrice, feesDecimal: "1",
      }),
    ];
  }));
}

function referenceDistance(anchor: string, distance: string, percent: number) {
  return Object.freeze({ anchorDecimal: anchor, signedDistanceDecimal: distance, signedDistancePercent: percent });
}

function analyzerResult(
  target: NonNullable<ReturnType<DailyTradeAnalyzerRepository["findEligibleTarget"]>>,
  trade: FixtureTrade,
): DailyTradeAnalyzerResult {
  const entrySeconds = Math.floor(Date.parse(target.openedAtUtc) / 1_000);
  const exitSeconds = Math.floor(Date.parse(target.finalExitAtUtc) / 1_000);
  const peakPnl = trade.greenToRed ? "125" : Number(trade.pnlDecimal) > 0 ? String(Number(trade.pnlDecimal) + 28) : null;
  const snapshots = target.events.map((event) => {
    const at = Math.floor(Date.parse(event.executedAtUtc) / 60_000) * 60;
    const isEntry = event.kind === "entry";
    return Object.freeze({
      candleTime: at, event,
      fiveMinuteContext: Object.freeze({
        completedBeforeExecution: Object.freeze({ candleTime: at - 300, ema9Distance: referenceDistance("9.95", "0.05", 0.5), relativeVolume: 2.1, turnoverDecimal: "245000", volumeDecimal: "25000" }),
        containingCandle: Object.freeze({ candleLocationRatio: isEntry ? 0.72 : 0.38, candleTime: at, ema9Distance: referenceDistance("9.96", isEntry ? "0.04" : "-0.02", isEntry ? 0.4 : -0.2), executionEdgeDistanceDecimal: isEntry ? "0.03" : "0.08", relativeVolume: 2.3, turnoverDecimal: "128000", volumeDecimal: "13000" }),
        preExecutionPartial: Object.freeze({ completedMinuteCount: 2, turnoverDecimal: "51000", volumeDecimal: "5200" }),
      }),
      indicators: Object.freeze({ adr20: 1.8, atr14: 0.24, ema9: 9.95, ema20: 9.82, macd: 0.08, macdHistogram: 0.03, macdSignal: 0.05, relativeVolume: 2.2, rsi14: isEntry ? 61 : 48, rsi14CalculationVersion: "wilder_rsi_14_v1" as const, vwap: 9.9 }),
      metrics: Object.freeze({
        averageEntryPriceAfterDecimal: isEntry ? "10" : null, candleLocationRatio: isEntry ? 0.72 : 0.38,
        candleTurnoverDecimal: "64000", candleVolumeDecimal: "6500", cumulativeSessionTurnoverDecimal: "750000", cumulativeSessionVolumeDecimal: "76000",
        ema9Distance: referenceDistance("9.95", isEntry ? "0.05" : "-0.05", isEntry ? 0.5 : -0.5), executionEdgeDistanceDecimal: isEntry ? "0.03" : "0.08",
        excursionUntilFlat: isEntry ? Object.freeze({ adverseMoveDecimal: trade.greenToRed ? "0.95" : "0.18", favorableMoveDecimal: trade.greenToRed ? "1.25" : "0.72", minutesUntilFlat: Math.max(1, Math.round((exitSeconds - entrySeconds) / 60)), observedThroughCandleTime: exitSeconds }) : null,
        positionQuantityAfterDecimal: isEntry ? "100" : "0", positionQuantityBeforeDecimal: isEntry ? "0" : "100",
        postEventPaths: Object.freeze([5, 15, 30, 60].map((minutes) => Object.freeze({ minutesAfterEvent: minutes as 5 | 15 | 30 | 60, observedAtCandleTime: exitSeconds + minutes * 60, oppositeDirectionMoveDecimal: "0.05", tradeDirectionMoveDecimal: trade.greenToRed ? "0.30" : "0.10" }))),
        priorFavorableExtremePriceDecimal: isEntry ? null : trade.greenToRed ? "11.25" : "10.65",
        givebackFromPriorFavorableExtremeDecimal: isEntry ? null : trade.greenToRed ? "1.45" : "0.10",
        vwapDistance: referenceDistance("9.90", isEntry ? "0.10" : "-0.10", isEntry ? 1.01 : -1.01),
      }),
      patterns: Object.freeze([]),
    });
  });
  return Object.freeze({
    eventSnapshots: Object.freeze(snapshots),
    finalExitPaths: Object.freeze([5, 15, 30, 60].map((minutes) => Object.freeze({ minutesAfterExit: minutes as 5 | 15 | 30 | 60, favorableMoveDecimal: trade.greenToRed ? "0.25" : "0.12", observedAtCandleTime: exitSeconds + minutes * 60 }))),
    greenToRed: Object.freeze({
      addedAfterPeakCount: 0, bestProfitOpportunityIndex: trade.greenToRed ? 0 : null,
      completedClosePeakAtUtcSeconds: peakPnl === null ? null : entrySeconds + 120,
      completedClosePeakPnlDecimal: peakPnl, feesComplete: true, finalPnlDecimal: trade.pnlDecimal,
      firstGreenAtUtcSeconds: peakPnl === null ? null : entrySeconds + 60,
      firstRedAtUtcSeconds: trade.greenToRed ? entrySeconds + 240 : null,
      firstRedPnlDecimal: trade.greenToRed ? "-5" : null, firstRecoveryAtUtcSeconds: null,
      minutesFromPeakToRed: trade.greenToRed ? 2 : null, partialExitBeforeRedCount: 0,
      peakAtUtcSeconds: peakPnl === null ? null : entrySeconds + 120, peakPnlDecimal: peakPnl,
      peakToFinalReversalDecimal: peakPnl === null ? null : String(Math.max(0, Number(peakPnl) - Number(trade.pnlDecimal))),
      peakToRedReversalDecimal: trade.greenToRed ? "130" : null,
      positionQuantityAtPeakDecimal: peakPnl === null ? null : "100", positionQuantityAtRedDecimal: trade.greenToRed ? "100" : null,
      profitOpportunities: trade.greenToRed ? Object.freeze([Object.freeze({ closesAtOrAboveStrongThresholdCount: 2, completedCloseCount: 3, durationMinutes: 3, endedAtUtcSeconds: entrySeconds + 240, lowestPnlDecimal: "25", peakAtUtcSeconds: entrySeconds + 120, peakPnlDecimal: peakPnl!, peakToFinalReversalDecimal: String(Math.max(0, Number(peakPnl) - Number(trade.pnlDecimal))), startedAtUtcSeconds: entrySeconds + 60 })]) : Object.freeze([]),
      profitOpportunityThresholdDecimal: peakPnl === null ? null : "20", status: trade.greenToRed ? "green_to_red_ended_red" as const : Number(trade.pnlDecimal) > 0 ? "green_no_red" as const : "never_green" as const,
      strongOpportunityThresholdDecimal: peakPnl === null ? null : "50",
    }),
  });
}

function noteFor(trade: FixtureTrade): string {
  const outcome = trade.greenToRed
    ? "The trade had a clear favorable move, crossed back through breakeven, and then closed red without a partial exit."
    : trade.strongEntry
      ? "The first pullback entry held above the entry area and the exit followed the prepared profit-taking plan."
      : "The setup was reviewed against the opening plan and the final exit was recorded with the actual result.";
  return `${outcome} I recorded the execution sequence, the reason for the entry, and the adjustment I would make before taking a similar setup again. The trade was part of a high-volume review scenario with full notes so the weekly and monthly reviews must work from real Journal facts rather than a short fixture. ${trade.lateEntry ? "The entry was later than the intended pullback and needs to be compared with the clean entries, not judged from one result alone." : "The entry timing was within the intended window and should be compared with the other completed trades from the same session."}`;
}

function seedDate(input: Readonly<{
  scope: Readonly<{ workspace: WorkspaceAccessScope; account: AccountScope }>;
  services: ReturnType<typeof createServices>;
  rules: FixtureRules;
  trades: readonly FixtureTrade[];
  tradingDate: string;
  database: Database.Database;
  daySequence: number;
}>): void {
  const dateTrades = input.trades.filter((trade) => trade.tradingDate === input.tradingDate);
  if (dateTrades.length !== 20 || !input.scope.workspace.activeAccountId) fail("high_volume_fixture_day_count_invalid");
  const accountSelectionRef = deriveJournalAccountSelectionRef(
    input.scope.workspace.workspaceId, input.scope.workspace.activeAccountId,
  );
  const entries = manualEntries(dateTrades);
  const committedAt = new Date(`${input.tradingDate}T23:00:00.000Z`);
  const preview = input.services.preview.preview(input.scope.workspace, { accountSelectionRef, tracker: "day", entries });
  if (preview.groups.length !== 20 || preview.groups.some((group) => group.state !== "complete_trade" || group.existingPosition !== null)) {
    fail(`high_volume_fixture_preview_${input.tradingDate}`);
  }
  const committed = input.services.command.commit(input.scope.workspace, accountSelectionRef, {
    tracker: "day", entries, previewRef: preview.previewRef, expectedAccountSelectionRef: accountSelectionRef,
    idempotencyKey: `high-volume-v4-${input.tradingDate.replaceAll("-", "")}`,
    confirmations: preview.groups.map((group) => Object.freeze({
      groupRef: group.groupRef, relationship: "start_new_trade" as const, style: "day_trade" as const,
      existingPositionRef: null, completeExecutionSetConfirmed: true,
    })),
  }, committedAt);
  if (committed.status !== "committed" || committed.createdExecutionCount !== 40 || committed.relatedDecisionIds.length !== 0) {
    fail(`high_volume_fixture_commit_${input.tradingDate}`);
  }
  const positions = new Map(input.services.positions.listCurrentPositions(input.scope.account)
    .map((position) => [position.symbol, position] as const));
  for (const trade of dateTrades) {
    const position = positions.get(trade.symbol);
    if (!position || position.projectionState !== "ready_closed") fail(`high_volume_fixture_round_trip_${trade.symbol}`);
    const at = new Date(`${trade.tradingDate}T22:00:00.000Z`);
    input.services.annotations.replaceRoundTripTagsWithPresets(input.scope.account, {
      roundTripId: position.roundTripId, tagIds: [],
      presetKeys: trade.greenToRed
        ? ["setup_first_pullback", "mistake_ignored_stop"]
        : trade.strongEntry ? ["setup_first_pullback", "market_strong_trend", "process_followed_plan"] : ["setup_first_pullback"],
      now: at,
    });
    input.services.annotations.saveRoundTripNote(input.scope.account, {
      roundTripId: position.roundTripId, expectedRevision: null,
      technicalNote: trade.greenToRed ? "A favorable move reversed through breakeven before the final exit." : trade.strongEntry ? "The entry had more favorable than adverse movement before the exit." : "The entry and exit were recorded against the intended setup.",
      tradeNote: noteFor(trade), now: at,
    });
    input.services.annotations.saveRuleReview(input.scope.account, {
      ruleId: input.rules.exit.ruleId, ruleVersionId: input.rules.exit.versionId, targetKind: "round_trip", targetId: position.roundTripId,
      status: trade.brokeExitRule ? "broken" : "followed", note: trade.brokeExitRule ? "The exit did not follow the stop set for this trade." : "The exit followed the stop set for this trade.", expectedRevision: null, now: new Date(at.getTime() + 1_000),
    });
    input.services.annotations.saveRuleReview(input.scope.account, {
      ruleId: input.rules.entry.ruleId, ruleVersionId: input.rules.entry.versionId, targetKind: "round_trip", targetId: position.roundTripId,
      status: trade.lateEntry ? "broken" : "followed", note: trade.lateEntry ? "The entry came after the first pullback had extended." : "The entry was taken on the intended first pullback.", expectedRevision: null, now: new Date(at.getTime() + 2_000),
    });
    const target = input.services.analyzer.findEligibleTarget(input.scope.account, position.roundTripId);
    if (!target) fail(`high_volume_fixture_analyzer_target_${trade.symbol}`);
    input.services.analyzer.persistAnalysis({
      analyzed: analyzerResult(target, trade), marketSessionSetVersionId: null, scope: input.scope.account,
      status: "ready", target, now: new Date(at.getTime() + 3_000),
    });
  }
  input.services.annotations.saveDailyNote(input.scope.account, {
    tradingDate: input.tradingDate, expectedRevision: null,
    whatWorked: "Clean first-pullback entries produced the most controlled trades during the morning session.",
    whatNeedsWork: dateTrades.some((trade) => trade.greenToRed) ? "Several trades gave back a favorable move before the final exit." : "Keep the same stop and entry process as trade volume increases.",
    technicalRecap: "The day includes saved notes, rule reviews, setup tags, and linked one-minute and five-minute execution evidence.",
    tomorrowsFocus: "Review each trade that changed from green to red separately from trades that respected the exit plan.",
    anythingElse: "", now: new Date(`${input.tradingDate}T22:30:00.000Z`),
  });
  const dayId = input.services.annotations.resolveTradingDayId(input.scope.account, input.tradingDate);
  if (!dayId) fail(`high_volume_fixture_day_missing_${input.tradingDate}`);
  input.services.annotations.saveRuleReview(input.scope.account, {
    ruleId: input.rules.day.ruleId, ruleVersionId: input.rules.day.versionId, targetKind: "trading_day", targetId: dayId,
    status: dateTrades.filter((trade) => Number(trade.pnlDecimal) < 0).length > 7 ? "broken" : "followed",
    note: "The full trading day was reviewed after all closed trades were recorded.", expectedRevision: null,
    now: new Date(`${input.tradingDate}T22:40:00.000Z`),
  });
  input.services.dayReviews.save(input.scope.account, {
    expectedRevision: null, idempotencyKey: `high-volume-day-review-${input.tradingDate.replaceAll("-", "")}`,
    status: "reviewed", tradingDate: input.tradingDate, userId: input.scope.account.userId,
    now: new Date(`${input.tradingDate}T22:45:00.000Z`),
  });
}

function readExistingFixtureSymbols(database: Database.Database, scope: AccountScope): ReadonlySet<string> {
  const rows = database.prepare<[string, string], Readonly<{ normalized_symbol: string }>>(`SELECT normalized_symbol
FROM journal_instruments WHERE workspace_id = ? AND normalized_symbol LIKE ? ORDER BY normalized_symbol`)
    .all(scope.workspaceId, `${FIXTURE_PREFIX}%`);
  return new Set(rows.map((row) => row.normalized_symbol));
}

function dateWasSeeded(
  existingSymbols: ReadonlySet<string>,
  trades: readonly FixtureTrade[],
  tradingDate: string,
): boolean {
  const dateTrades = trades.filter((trade) => trade.tradingDate === tradingDate);
  const present = dateTrades.filter((trade) => existingSymbols.has(trade.symbol));
  if (present.length !== 0 && present.length !== dateTrades.length) {
    fail(`high_volume_fixture_date_partially_seeded_${tradingDate}`);
  }
  return present.length === dateTrades.length;
}

async function issue(
  coordinator: CoachAiReviewGenerationCoordinatorV2,
  scope: WorkspaceAccessScope,
  period: Readonly<{ reviewKind: "weekly" | "monthly"; periodStartDate: string; periodEndDate: string }>,
  now: Date,
): Promise<string> {
  let result = await coordinator.generateNow(scope, period, now);
  for (let attempt = 0; result.state === "retrying" && attempt < 2; attempt += 1) {
    result = await coordinator.generateNow(scope, period, new Date(now.getTime() + attempt + 1));
  }
  if (result.state !== "issued") fail(`high_volume_review_not_issued_${period.reviewKind}_${result.state}`);
  return result.requestId;
}

function providerCalls(database: Database.Database, requestIds: readonly string[]): readonly ProviderCallRow[] {
  const read = database.prepare<[string], ProviderCallRow>(`SELECT request.coach_ai_review_period_request_id AS request_id,
  request.review_kind, request.period_start_date, request.period_end_date,
  COUNT(call.coach_ai_review_authored_provider_call_id) AS call_count,
  COALESCE(SUM(CASE WHEN call.state = 'completed' THEN 1 ELSE 0 END), 0) AS completed_call_count,
  COALESCE(SUM(call.input_tokens), 0) AS input_tokens,
  COALESCE(SUM(call.cached_input_tokens), 0) AS cached_input_tokens,
  COALESCE(SUM(call.cache_write_input_tokens), 0) AS cache_write_input_tokens,
  COALESCE(SUM(call.output_tokens), 0) AS output_tokens,
  COALESCE(SUM(call.total_tokens), 0) AS total_tokens,
  COALESCE(SUM(((call.input_tokens - call.cached_input_tokens - call.cache_write_input_tokens) * 5.0 + call.cached_input_tokens * 0.5 + call.cache_write_input_tokens * 6.25 + call.output_tokens * 30.0) / 10000.0), 0) AS estimated_cost_cents
FROM coach_ai_review_period_requests_v2 request
LEFT JOIN coach_ai_review_authored_provider_calls_v4 call
  ON call.coach_ai_review_period_request_id = request.coach_ai_review_period_request_id
WHERE request.coach_ai_review_period_request_id = ?
GROUP BY request.coach_ai_review_period_request_id`);
  return Object.freeze(requestIds.map((requestId) => read.get(requestId) ?? fail("high_volume_receipt_missing")));
}

async function main(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== CONFIRMATION) fail("high_volume_confirmation_required");
  loadEnvConfig(process.cwd(), true);
  if (!process.env.OPENAI_API_KEY?.trim()) fail("high_volume_provider_key_missing");
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const database = new Database(configuration.databasePath, { fileMustExist: true });
  let originalSubscriberCap: string | null = null;
  let accountId: string | null = null;
  try {
    database.pragma("foreign_keys = ON");
    const owner = deriveDevelopmentOwnerJournalScope(database).scope;
    const scope = fixtureScope(database, owner);
    if (!scope.activeAccountId) fail("high_volume_account_missing");
    accountId = scope.activeAccountId;
    const account: AccountScope = Object.freeze({ userId: scope.userId, workspaceId: scope.workspaceId, workspaceRole: scope.workspaceRole, accountId });
    const caps = database.prepare<[], Readonly<{ per_subscriber_paid_cycle_estimated_spend_cap_usd: string }>>(`SELECT per_subscriber_paid_cycle_estimated_spend_cap_usd FROM coach_ai_review_budget_controls WHERE control_key = 'ai_reviews'`).get();
    if (!caps) fail("high_volume_controls_missing");
    originalSubscriberCap = caps.per_subscriber_paid_cycle_estimated_spend_cap_usd;
    ensureFixtureReviewSettings(database, scope);
    database.prepare(`UPDATE coach_ai_review_budget_controls SET per_subscriber_paid_cycle_estimated_spend_cap_usd = '10', updated_at_utc = ? WHERE control_key = 'ai_reviews'`).run(new Date().toISOString());
    let journalNow = new Date("2026-02-02T23:00:00.000Z");
    const services = createServices(database, () => journalNow);
    const rules = createRules(services.annotations, account);
    const baselineTrades = makeTrades(FEBRUARY_DATES, 0, "baseline", 0);
    const currentTrades = Object.freeze([
      ...MARCH_WEEKS.flatMap((week, weekIndex) => makeTrades(week.dates, 400 + weekIndex * 100, "current", weekIndex)),
      ...makeTrades(MARCH_MONTH_END_DATES, 800, "current", 4),
    ]);
    const allTrades = Object.freeze([...baselineTrades, ...currentTrades]);
    const existingSymbols = readExistingFixtureSymbols(database, account);
    if ([...existingSymbols].some((symbol) => !allTrades.some((trade) => trade.symbol === symbol))) {
      fail("high_volume_fixture_unrecognized_existing_symbol");
    }
    for (let index = 0; index < FEBRUARY_DATES.length; index += 1) {
      const date = FEBRUARY_DATES[index];
      if (!date) fail("high_volume_baseline_date_missing");
      if (dateWasSeeded(existingSymbols, allTrades, date)) continue;
      journalNow = new Date(`${date}T23:00:00.000Z`);
      seedDate({ scope: { workspace: scope, account }, services, rules, trades: allTrades, tradingDate: date, database, daySequence: index });
    }
    const paidAccess: CoachAiReviewPaidAccessPolicyV2 = Object.freeze({ read: () => "available" as const });
    const coordinator = new CoachAiReviewGenerationCoordinatorV2(database, paidAccess);
    const requestIds: string[] = [];
    for (let index = 0; index < MARCH_WEEKS.length; index += 1) {
      const week = MARCH_WEEKS[index];
      if (!week) fail("high_volume_current_week_missing");
      for (const date of week.dates) {
        if (dateWasSeeded(existingSymbols, allTrades, date)) continue;
        journalNow = new Date(`${date}T23:00:00.000Z`);
        seedDate({ scope: { workspace: scope, account }, services, rules, trades: allTrades, tradingDate: date, database, daySequence: 20 + index });
      }
      const first = week.dates[0];
      const last = week.dates[4];
      if (!first || !last) fail("high_volume_week_period_missing");
      requestIds.push(await issue(coordinator, scope, {
        reviewKind: "weekly", periodStartDate: first, periodEndDate: last,
      }, week.issuedAt));
    }
    for (const date of MARCH_MONTH_END_DATES) {
      if (dateWasSeeded(existingSymbols, allTrades, date)) continue;
      journalNow = new Date(`${date}T23:00:00.000Z`);
      seedDate({ scope: { workspace: scope, account }, services, rules, trades: allTrades, tradingDate: date, database, daySequence: 24 });
    }
    const count = database.prepare<[string, string, string], Readonly<{ count: number }>>(`SELECT COUNT(*) AS count
FROM journal_round_trips trip
JOIN journal_round_trip_versions version ON version.round_trip_version_id = trip.current_version_id
JOIN journal_instruments instrument ON instrument.instrument_id = version.instrument_id
WHERE trip.workspace_id = ? AND trip.account_id = ? AND instrument.normalized_symbol LIKE ? AND version.projection_state = 'ready_closed'`)
      .get(scope.workspaceId, accountId, `${FIXTURE_PREFIX}%`);
    if (count?.count !== 820) fail(`high_volume_closed_trade_count_${count?.count ?? 0}`);
    const monthlyPlan = new CoachMonthlyAiReviewRunner(database).planAccountV2(scope, MONTHLY_ISSUED_AT)
      .find((candidate) => candidate.state === "manual_available" || candidate.state === "automatic_ready");
    if (!monthlyPlan) fail("high_volume_monthly_plan_unavailable");
    requestIds.push(await issue(coordinator, scope, {
      reviewKind: "monthly", periodStartDate: monthlyPlan.period.calendarMonthStartDate, periodEndDate: monthlyPlan.period.calendarMonthEndDate,
    }, MONTHLY_ISSUED_AT));
    const authored = new CoachAiReviewAuthoredPersistenceRepository(database);
    const reviews = requestIds.map((requestId) => authored.listIssued(scope).find((review) => review.requestId === requestId) ?? fail("high_volume_output_missing"));
    const snapshots = requestIds.map((requestId) => authored.readSnapshot(scope, requestId));
    const receipts = providerCalls(database, requestIds);
    if (receipts.some((receipt) => receipt.call_count < 1 || receipt.completed_call_count !== receipt.call_count || receipt.total_tokens < 1)) fail("high_volume_receipt_incomplete");
    const monthly = snapshots.at(-1);
    if (!monthly || monthly.packet.packetVersion !== "traderlink_coach_monthly_ai_review_evidence_packet_v1" || monthly.packet.coverage.completeTradeCount !== 440) fail("high_volume_monthly_coverage_invalid");
    const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
    if (foreignKeyFailures.length !== 0) fail("high_volume_foreign_key_failure");
    process.stdout.write(`${JSON.stringify({
      status: "issued", model: reviews[0]?.modelId ?? null, fixture: { accountName: FIXTURE_ACCOUNT_NAME, baselineTrades: 380, currentTrades: 440, weeklyTrades: 100, analyzerRows: 820, notes: 820 },
      reviews: reviews.map((review) => ({ reviewKind: review.reviewKind, periodStartDate: review.periodStartDate, periodEndDate: review.periodEndDate, issuedReviewId: review.issuedReviewId, output: review.output })),
      receipts, totalCostCents: receipts.reduce((sum, receipt) => sum + receipt.estimated_cost_cents, 0), foreignKeyFailures: foreignKeyFailures.length,
    }, null, 2)}\n`);
  } finally {
    if (originalSubscriberCap !== null) database.prepare(`UPDATE coach_ai_review_budget_controls SET per_subscriber_paid_cycle_estimated_spend_cap_usd = ?, updated_at_utc = ? WHERE control_key = 'ai_reviews'`).run(originalSubscriberCap, new Date().toISOString());
    database.close();
  }
}

void main();
