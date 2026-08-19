import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadEnvConfig } from "@next/env";
import Database from "better-sqlite3";

import type { CoachAiReviewProviderPlanPackage } from
  "@/src/modules/coach/contracts/coach-ai-review-plan-selection-contracts";
import type { DailyTradeAnalyzerResult } from
  "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import type {
  AccountScope,
  WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import { deriveJournalAccountSelectionRef } from
  "@/src/modules/platform/contracts/journal-account-selection";
import { CoachAiChatProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-chat-provider-controls-repository";
import { CoachAiProviderSettingsRepository } from
  "@/src/modules/coach/server/coach-ai-provider-settings-repository";
import { CoachAiReviewGenerationCompatibilityRepository } from
  "@/src/modules/coach/server/coach-ai-review-generation-compatibility";
import { CoachAiReviewGenerationContractRepository } from
  "@/src/modules/coach/server/coach-ai-review-generation-contract-repository";
import { CoachAiReviewGenerationCoordinatorV2 } from
  "@/src/modules/coach/server/coach-ai-review-generation-coordinator-v2";
import { CoachAiReviewInsightPersistenceRepository } from
  "@/src/modules/coach/server/coach-ai-review-insight-persistence-repository";
import { CoachAiReviewRepository } from
  "@/src/modules/coach/server/coach-ai-review-repository";
import { CoachReviewDeliveryScheduleRepository } from
  "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { JournalAccountRepository } from
  "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "@/src/modules/journal/server/accounts/journal-account-service";
import {
  ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
  DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "@/src/modules/journal/server/accounts/journal-source-account-canonicalizers";
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
import type { JournalManualTradeEntry } from
  "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
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
import { JournalSwingNoteRepository } from
  "@/src/modules/journal/server/swing-notes/journal-swing-note-repository";
import { JournalTradeStyleRepository } from
  "@/src/modules/journal/server/trade-style/journal-trade-style-repository";
import { DailyTradeAnalyzerRepository } from
  "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { createWhopPrivacyReference } from
  "@/src/modules/platform/server/billing/whop-ai-review-identity";
import { createCanonicalUuidV4 } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from
  "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from
  "@/src/modules/platform/server/database/run-platform-migrations";

const CAPTURED_CONFIRMATION = "--confirm-disposable-insight-true-month";
const LIVE_CONFIRMATION = "--confirm-disposable-insight-true-month-provider-call";
const MODEL_ID = "gpt-5.6-luna";
const MONTH_START = "2026-07-01";
const MONTH_END = "2026-07-31";
const FIXTURE_KEY_VERSION = "true_month_fixture_v1";
const FIXTURE_KEY_BASE64 = Buffer.alloc(32, 17).toString("base64");
const WHOP_KEY = "true-month-fixture-whop-identity-key-at-least-32-characters";

const WEEK_FIXTURES = Object.freeze([
  Object.freeze({
    label: "week_1",
    startDate: "2026-07-06",
    endDate: "2026-07-10",
    counts: Object.freeze([4, 3, 3, 3, 3]),
    issueAt: new Date("2026-07-11T16:00:00.000Z"),
  }),
  Object.freeze({
    label: "week_2",
    startDate: "2026-07-13",
    endDate: "2026-07-17",
    counts: Object.freeze([5, 4, 4, 4, 4]),
    issueAt: new Date("2026-07-18T16:00:00.000Z"),
  }),
  Object.freeze({
    label: "week_3",
    startDate: "2026-07-20",
    endDate: "2026-07-24",
    counts: Object.freeze([4, 4, 4, 3, 3]),
    issueAt: new Date("2026-07-25T16:00:00.000Z"),
  }),
  Object.freeze({
    label: "week_4",
    startDate: "2026-07-27",
    endDate: "2026-07-31",
    counts: Object.freeze([5, 5, 5, 5, 5]),
    issueAt: new Date("2026-08-01T16:00:00.000Z"),
  }),
]);

const TRADING_DATES = Object.freeze([
  Object.freeze(["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"]),
  Object.freeze(["2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"]),
  Object.freeze(["2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24"]),
  Object.freeze(["2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31"]),
]);

type FixtureTrade = Readonly<{
  globalIndex: number;
  weekIndex: number;
  weekTradeIndex: number;
  tradingDate: string;
  symbol: string;
  brokeExitRule: boolean;
  lateEntry: boolean;
  pnlDecimal: string;
}>;

type FixtureRules = Readonly<{
  exit: ReturnType<JournalAnnotationService["createRule"]>;
  entry: ReturnType<JournalAnnotationService["createRule"]>;
  day: ReturnType<JournalAnnotationService["createRule"]>;
  maximumTrades: ReturnType<JournalAnnotationService["createRule"]>;
}>;

type CapturedProviderCall = Readonly<{
  period: CoachAiReviewProviderPlanPackage["period"];
  choiceCount: number;
  requestBodyBytes: number;
}>;

type ProviderHttpDiagnostic = Readonly<{
  status: number | null;
  errorType: string | null;
  errorCode: string | null;
  errorParam: string | null;
  errorMessage: string | null;
}>;

type ReceiptRow = Readonly<{
  input_tokens: number | null;
  cached_input_tokens: number | null;
  cache_write_input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_usd: string | null;
}>;

function fail(check: string): never {
  throw new Error(`TRADERLINK_TRUE_MONTH_ACCEPTANCE_FAILED:${check}`);
}

function configureEnvironment(live: boolean): void {
  if (live) loadEnvConfig(process.cwd(), true);
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (live && !openAiKey) fail("provider_key_missing");
  Object.assign(process.env, {
    NODE_ENV: "test",
    OPENAI_API_KEY: live ? openAiKey : "fixture-openai-key",
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION: FIXTURE_KEY_VERSION,
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON: JSON.stringify({
      [FIXTURE_KEY_VERSION]: FIXTURE_KEY_BASE64,
    }),
    TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION: FIXTURE_KEY_VERSION,
    TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON: JSON.stringify({
      [FIXTURE_KEY_VERSION]: FIXTURE_KEY_BASE64,
    }),
    WHOP_WEBHOOK_SECRET: "true-month-fixture-webhook-secret",
    WHOP_OAUTH_CLIENT_ID: "true-month-fixture-oauth-client",
    WHOP_OAUTH_REDIRECT_URI: "https://fixture.invalid/whop/callback",
    TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY: WHOP_KEY,
    WHOP_COMPANY_ID: "biz_true_month_fixture",
    WHOP_AI_REVIEWS_PRODUCT_IDS: "prod_true_month_fixture",
    WHOP_API_VERSION_DATE: "2026-07-01",
  });
}

function createScope(database: Database.Database): Readonly<{
  workspace: WorkspaceAccessScope;
  account: AccountScope;
}> {
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const at = "2026-06-30T12:00:00.000Z";
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, 'True month fixture', 'active', ?, ?)`).run(
    userId,
    `true-month-${userId}`,
    at,
    at,
  );
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'True month fixture', 'America/New_York', 'active', ?, ?)`).run(
    workspaceId,
    at,
    at,
  );
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(
    workspaceId,
    userId,
    userId,
    at,
    at,
  );
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'True month fixture', 'USD', 'America/New_York',
  'active', ?, ?, ?)`).run(accountId, workspaceId, userId, at, at);
  return Object.freeze({
    workspace: Object.freeze({
      userId,
      workspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: Object.freeze([accountId]),
      activeAccountId: accountId,
    }),
    account: Object.freeze({
      userId,
      workspaceId,
      workspaceRole: "owner" as const,
      accountId,
    }),
  });
}

function configurePaidAccess(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): void {
  const userRef = createWhopPrivacyReference("true_month_user", "user", WHOP_KEY);
  const repository = new WhopAiReviewEntitlementRepository(database);
  repository.linkUser(scope.userId, userRef, new Date("2026-07-01T00:00:00.000Z"));
  repository.applyMembershipEvent(Object.freeze({
    webhookIdSha256: createHash("sha256").update("true-month-webhook").digest("hex"),
    payloadSha256: createHash("sha256").update("true-month-payload").digest("hex"),
    eventType: "membership.activated" as const,
    eventAtUtc: "2026-07-01T00:00:00.000Z",
    membershipRefHmac: createWhopPrivacyReference(
      "true_month_membership",
      "membership",
      WHOP_KEY,
    ),
    whopUserRefHmac: userRef,
    companyRefHmac: createWhopPrivacyReference(
      "biz_true_month_fixture",
      "company",
      WHOP_KEY,
    ),
    productRefHmac: createWhopPrivacyReference(
      "prod_true_month_fixture",
      "product",
      WHOP_KEY,
    ),
    membershipState: "active" as const,
    cancelAtPeriodEnd: false,
    renewalPeriodStartUtc: "2026-07-01T00:00:00.000Z",
    renewalPeriodEndUtc: "2026-08-15T00:00:00.000Z",
  }), new Date("2026-07-01T00:00:00.000Z"));
}

function configureReviewInfrastructure(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): void {
  new CoachAiProviderSettingsRepository(database).save({
    modelId: MODEL_ID,
    inputCostUsdPerMillionTokens: "0.20",
    cachedInputCostUsdPerMillionTokens: "0.02",
    cacheWriteInputCostUsdPerMillionTokens: "0.25",
    outputCostUsdPerMillionTokens: "1.20",
  }, new Date("2026-07-01T00:00:01.000Z"));
  new CoachReviewDeliveryScheduleRepository(database).saveV2(scope, {
    isEnabled: true,
    currentFrequency: "weekly",
    timingMode: "automatic_after_12_hours",
    twoWeekAnchorMondayDate: null,
    pendingFrequency: null,
    pendingEffectiveMondayDate: null,
    pendingTwoWeekAnchorMondayDate: null,
    expectedRevision: null,
  }, new Date("2026-07-01T12:00:00.000Z"));
  database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '10',
  per_subscriber_paid_cycle_estimated_spend_cap_usd = '10',
  emergency_trailing_30_day_estimated_spend_cap_usd = NULL,
  updated_at_utc = '2026-08-10T12:00:01.000Z'
WHERE control_key = 'ai_reviews'`).run();
  const contracts = new CoachAiReviewGenerationContractRepository(database);
  if (!contracts.readCutoverReadiness().ready) fail("cutover_not_ready");
  contracts.activateV3({
    requestIntakeStopped: true,
    verifiedBackupCompleted: true,
    oldProcessesStopped: true,
    v2ReadReconciliationCompleted: true,
    now: new Date("2026-07-01T12:00:02.000Z"),
  });
  const controls = new CoachAiChatProviderControlsRepository(database);
  for (const featureKey of ["weekly_reviews", "monthly_reviews"] as const) {
    controls.savePlatformFeatureControl({
      featureKey,
      enabled: true,
      dailyRequestCap: 20,
      dailyTokenCap: 2_000_000,
      dailyEstimatedSpendCapUsd: "10",
    }, new Date("2026-08-10T12:00:03.000Z"));
  }
}

function createJournalServices(
  database: Database.Database,
  journalClock: () => Date,
): Readonly<{
  manualCommand: JournalManualTradeCommandService;
  manualPreview: JournalManualTradePreviewService;
  annotations: JournalAnnotationService;
  styles: JournalTradeStyleRepository;
  swingNotes: JournalSwingNoteRepository;
  dayReviews: JournalTradingDayReviewService;
  analyzer: DailyTradeAnalyzerRepository;
}> {
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
  const privacy = loadJournalPrivacyHmacConfiguration(process.env);
  const manualPreview = new JournalManualTradePreviewService(
    new JournalManualTradePreviewRepository(database),
    accounts,
    createJournalManualTradePreviewAuthority(privacy),
    journalClock,
  );
  return Object.freeze({
    manualCommand: new JournalManualTradeCommandService(
      new JournalManualTradeCommandRepository(database),
      importService,
      decisions,
      roundTrips,
      manualPreview,
    ),
    manualPreview,
    annotations: new JournalAnnotationService(
      new JournalAnnotationRepository(database),
      new JournalRuleRepository(database),
    ),
    styles: new JournalTradeStyleRepository(database),
    swingNotes: new JournalSwingNoteRepository(database),
    dayReviews: new JournalTradingDayReviewService(database),
    analyzer: new DailyTradeAnalyzerRepository(database),
  });
}

function createRules(
  annotations: JournalAnnotationService,
  scope: AccountScope,
): FixtureRules {
  const now = new Date("2026-07-01T12:05:00.000Z");
  return Object.freeze({
    exit: annotations.createRule(scope, {
      sourceKind: "custom",
      title: "Exit at planned risk",
      statement: "Exit when the planned stop is reached.",
      category: "risk",
      reviewScope: "trade",
      isFocus: true,
      configuration: {},
      now,
    }),
    entry: annotations.createRule(scope, {
      sourceKind: "custom",
      title: "Wait for the first pullback",
      statement: "Wait for a confirmed first pullback before entering.",
      category: "entry",
      reviewScope: "trade",
      isFocus: false,
      configuration: {},
      now: new Date(now.getTime() + 1_000),
    }),
    day: annotations.createRule(scope, {
      sourceKind: "custom",
      title: "Stop after two broken-risk trades",
      statement: "Stop trading after two trades break the planned-risk rule.",
      category: "discipline",
      reviewScope: "day",
      isFocus: false,
      configuration: {},
      now: new Date(now.getTime() + 2_000),
    }),
    maximumTrades: annotations.createRule(scope, {
      sourceKind: "template",
      templateKey: "maximum_trades_per_day",
      title: "Maximum four completed trades",
      statement: "Take no more than four completed trades in one trading day.",
      category: "frequency",
      reviewScope: "day",
      isFocus: false,
      configuration: { maximumTrades: "4" },
      now: new Date(now.getTime() + 3_000),
    }),
  });
}

function weekTrades(weekIndex: number): readonly FixtureTrade[] {
  const fixture = WEEK_FIXTURES[weekIndex];
  const dates = TRADING_DATES[weekIndex];
  if (!fixture || !dates) fail("week_fixture_missing");
  const priorCount = WEEK_FIXTURES.slice(0, weekIndex)
    .reduce((sum, week) => sum + week.counts.reduce((total, count) => total + count, 0), 0);
  const trades: FixtureTrade[] = [];
  let weekTradeIndex = 0;
  for (let dayIndex = 0; dayIndex < dates.length; dayIndex += 1) {
    const tradingDate = dates[dayIndex];
    const count = fixture.counts[dayIndex];
    if (!tradingDate || count === undefined) fail("week_day_fixture_missing");
    for (let dayTradeIndex = 0; dayTradeIndex < count; dayTradeIndex += 1) {
      const globalIndex = priorCount + weekTradeIndex;
      const brokeExitRule = weekIndex === 0
        ? weekTradeIndex % 2 === 0
        : weekIndex === 1
          ? weekTradeIndex % 3 === 0
          : weekIndex === 2
            ? weekTradeIndex % 5 === 0
            : weekTradeIndex % 6 === 0;
      trades.push(Object.freeze({
        globalIndex,
        weekIndex,
        weekTradeIndex,
        tradingDate,
        symbol: `TM${String(globalIndex + 1).padStart(3, "0")}`,
        brokeExitRule,
        lateEntry: globalIndex % 7 === 0,
        // Both executions carry a reported USD 1 fee, so these values match
        // the exact net result materialized by the Journal round trip.
        pnlDecimal: brokeExitRule ? "-62" : "38",
      }));
      weekTradeIndex += 1;
    }
  }
  return Object.freeze(trades);
}

function reflectionForWeek(weekIndex: number): Readonly<{
  whatWorked: string;
  whatNeedsWork: string;
  technicalRecap: string;
  focus: string;
}> {
  const reflections = [
    Object.freeze({
      whatWorked: "My first-pullback entries with strong volume were usually profitable.",
      whatNeedsWork: "I ignored planned stops after trades went green and let too many finish red.",
      technicalRecap: "The better trades held above the entry area; the worst losses reversed after an early favorable move.",
      focus: "Exit when the planned stop is reached and do not let a green trade finish red.",
    }),
    Object.freeze({
      whatWorked: "I followed the stop more often and kept using first-pullback entries.",
      whatNeedsWork: "I still gave back open profit on several trades instead of taking the planned exit.",
      technicalRecap: "Risk control improved, but the remaining stop breaks were still the largest losses.",
      focus: "Keep reducing the number of planned-stop breaks on trades that were already green.",
    }),
    Object.freeze({
      whatWorked: "Most trades followed the planned stop and profitable pullback entries stayed consistent.",
      whatNeedsWork: "A smaller group of trades still turned from green to red before the final exit.",
      technicalRecap: "The stop-break rate was lower and the week stayed profitable despite the remaining reversals.",
      focus: "Repeat the stop discipline and review every remaining green-to-red loss.",
    }),
    Object.freeze({
      whatWorked: "I maintained patient pullback entries and usually exited at the planned risk.",
      whatNeedsWork: "The few remaining ignored stops still produced losses that were larger than the winners.",
      technicalRecap: "The process improved materially, while the remaining exceptions still had a clear financial cost.",
      focus: "Make planned-stop compliance consistent on every trade next month.",
    }),
  ] as const;
  return reflections[weekIndex] ?? fail("reflection_fixture_missing");
}

function manualEntries(trades: readonly FixtureTrade[]): readonly JournalManualTradeEntry[] {
  return Object.freeze(trades.flatMap((trade, index) => {
    const entryDate = trade.tradingDate;
    const entryMinute = 35 + (index % 10);
    const exitMinute = 5 + (index % 10);
    const exitPrice = trade.brokeExitRule ? "9.4" : "10.4";
    return [
      Object.freeze({
        clientRowRef: `true-month-${trade.globalIndex + 1}-entry`,
        localDate: entryDate,
        localTime: `09:${String(entryMinute).padStart(2, "0")}:00`,
        sourceTimezone: "America/New_York",
        normalizedSymbol: trade.symbol,
        tradeCurrency: "USD",
        side: "buy" as const,
        quantityDecimal: "100",
        priceDecimal: "10",
        feesDecimal: "1",
      }),
      Object.freeze({
        clientRowRef: `true-month-${trade.globalIndex + 1}-exit`,
        localDate: trade.tradingDate,
        localTime: `10:${String(exitMinute).padStart(2, "0")}:00`,
        sourceTimezone: "America/New_York",
        normalizedSymbol: trade.symbol,
        tradeCurrency: "USD",
        side: "sell" as const,
        quantityDecimal: "100",
        priceDecimal: exitPrice,
        feesDecimal: "1",
      }),
    ];
  }));
}

function referenceDistance(anchor: string, distance: string, percent: number) {
  return Object.freeze({
    anchorDecimal: anchor,
    signedDistanceDecimal: distance,
    signedDistancePercent: percent,
  });
}

function analyzerResult(
  target: NonNullable<ReturnType<DailyTradeAnalyzerRepository["findEligibleTarget"]>>,
  trade: FixtureTrade,
): DailyTradeAnalyzerResult {
  const entrySeconds = Math.floor(Date.parse(target.openedAtUtc) / 1_000);
  const exitSeconds = Math.floor(Date.parse(target.finalExitAtUtc) / 1_000);
  const paths = Object.freeze([5, 15, 30, 60].map((minutes) => Object.freeze({
    minutesAfterEvent: minutes as 5 | 15 | 30 | 60,
    observedAtCandleTime: exitSeconds + minutes * 60,
    oppositeDirectionMoveDecimal: "0.05",
    tradeDirectionMoveDecimal: trade.brokeExitRule ? "0.20" : "0.10",
  })));
  const eventSnapshots = Object.freeze(target.events.map((event) => {
    const eventSeconds = Math.floor(Date.parse(event.executedAtUtc) / 1_000);
    const minuteCandle = Math.floor(eventSeconds / 60) * 60;
    const fiveMinuteCandle = Math.floor(eventSeconds / 300) * 300;
    const isEntry = event.kind === "entry";
    return Object.freeze({
      candleTime: minuteCandle,
      event,
      fiveMinuteContext: Object.freeze({
        completedBeforeExecution: Object.freeze({
          candleTime: fiveMinuteCandle - 300,
          ema9Distance: referenceDistance("9.95", "0.05", 0.5),
          relativeVolume: 2.1,
          turnoverDecimal: "245000",
          volumeDecimal: "25000",
        }),
        containingCandle: Object.freeze({
          candleLocationRatio: isEntry ? 0.72 : 0.38,
          candleTime: fiveMinuteCandle,
          ema9Distance: referenceDistance("9.96", isEntry ? "0.04" : "-0.02", isEntry ? 0.4 : -0.2),
          executionEdgeDistanceDecimal: isEntry ? "0.03" : "0.08",
          relativeVolume: 2.3,
          turnoverDecimal: "128000",
          volumeDecimal: "13000",
        }),
        preExecutionPartial: Object.freeze({
          completedMinuteCount: 2,
          turnoverDecimal: "51000",
          volumeDecimal: "5200",
        }),
      }),
      indicators: Object.freeze({
        adr20: 1.8,
        atr14: 0.24,
        ema9: 9.95,
        ema20: 9.82,
        macd: 0.08,
        macdHistogram: 0.03,
        macdSignal: 0.05,
        relativeVolume: 2.2,
        rsi14: isEntry ? 61 : 48,
        rsi14CalculationVersion: "wilder_rsi_14_v1" as const,
        vwap: 9.90,
      }),
      metrics: Object.freeze({
        averageEntryPriceAfterDecimal: isEntry ? "10" : null,
        candleLocationRatio: isEntry ? 0.72 : 0.38,
        candleTurnoverDecimal: "64000",
        candleVolumeDecimal: "6500",
        cumulativeSessionTurnoverDecimal: "750000",
        cumulativeSessionVolumeDecimal: "76000",
        ema9Distance: referenceDistance("9.95", isEntry ? "0.05" : "-0.05", isEntry ? 0.5 : -0.5),
        executionEdgeDistanceDecimal: isEntry ? "0.03" : "0.08",
        excursionUntilFlat: isEntry ? Object.freeze({
          adverseMoveDecimal: trade.brokeExitRule ? "0.60" : "0.15",
          favorableMoveDecimal: trade.brokeExitRule ? "0.80" : "0.50",
          minutesUntilFlat: Math.max(1, Math.round((exitSeconds - entrySeconds) / 60)),
          observedThroughCandleTime: exitSeconds,
        }) : null,
        positionQuantityAfterDecimal: isEntry ? "100" : "0",
        positionQuantityBeforeDecimal: isEntry ? "0" : "100",
        postEventPaths: paths,
        priorFavorableExtremePriceDecimal: isEntry ? null : trade.brokeExitRule ? "10.80" : "10.50",
        givebackFromPriorFavorableExtremeDecimal: isEntry ? null : trade.brokeExitRule ? "1.40" : "0.10",
        vwapDistance: referenceDistance("9.90", isEntry ? "0.10" : "-0.10", isEntry ? 1.01 : -1.01),
      }),
      patterns: Object.freeze([
        Object.freeze({
          availableAtExecution: true,
          candlesBeforeExecution: 1 as const,
          kind: isEntry ? "bullish_engulfing" : "bearish_reversal",
          knownAtTime: minuteCandle,
          score: 0.81,
          time: minuteCandle - 60,
          timeframe: "1m" as const,
        }),
        Object.freeze({
          availableAtExecution: true,
          candlesBeforeExecution: 1 as const,
          kind: "trend_continuation",
          knownAtTime: fiveMinuteCandle,
          score: 0.74,
          time: fiveMinuteCandle - 300,
          timeframe: "5m" as const,
        }),
      ]),
    });
  }));
  const peakSeconds = entrySeconds + 120;
  const firstRedSeconds = trade.brokeExitRule ? entrySeconds + 240 : null;
  return Object.freeze({
    eventSnapshots,
    finalExitPaths: Object.freeze([5, 15, 30, 60].map((minutes) => Object.freeze({
      minutesAfterExit: minutes as 5 | 15 | 30 | 60,
      favorableMoveDecimal: trade.brokeExitRule ? "0.25" : "0.12",
      observedAtCandleTime: exitSeconds + minutes * 60,
    }))),
    greenToRed: Object.freeze({
      addedAfterPeakCount: 0,
      bestProfitOpportunityIndex: trade.brokeExitRule ? 0 : null,
      completedClosePeakAtUtcSeconds: peakSeconds,
      completedClosePeakPnlDecimal: trade.brokeExitRule ? "80" : "50",
      feesComplete: true,
      finalPnlDecimal: trade.pnlDecimal,
      firstGreenAtUtcSeconds: entrySeconds + 60,
      firstRedAtUtcSeconds: firstRedSeconds,
      firstRedPnlDecimal: trade.brokeExitRule ? "-5" : null,
      firstRecoveryAtUtcSeconds: null,
      minutesFromPeakToRed: trade.brokeExitRule ? 2 : null,
      partialExitBeforeRedCount: 0,
      peakAtUtcSeconds: peakSeconds,
      peakPnlDecimal: trade.brokeExitRule ? "80" : "50",
      peakToFinalReversalDecimal: trade.brokeExitRule ? "140" : "10",
      peakToRedReversalDecimal: trade.brokeExitRule ? "85" : null,
      positionQuantityAtPeakDecimal: "100",
      positionQuantityAtRedDecimal: trade.brokeExitRule ? "100" : null,
      profitOpportunities: trade.brokeExitRule ? Object.freeze([Object.freeze({
        closesAtOrAboveStrongThresholdCount: 2,
        completedCloseCount: 3,
        durationMinutes: 3,
        endedAtUtcSeconds: firstRedSeconds!,
        lowestPnlDecimal: "25",
        peakAtUtcSeconds: peakSeconds,
        peakPnlDecimal: "80",
        peakToFinalReversalDecimal: "140",
        startedAtUtcSeconds: entrySeconds + 60,
      })]) : Object.freeze([]),
      profitOpportunityThresholdDecimal: "20",
      status: trade.brokeExitRule ? "green_to_red_ended_red" as const : "green_no_red" as const,
      strongOpportunityThresholdDecimal: "50",
    }),
  });
}

function seedWeek(input: Readonly<{
  database: Database.Database;
  services: ReturnType<typeof createJournalServices>;
  rules: FixtureRules;
  scope: Readonly<{ workspace: WorkspaceAccessScope; account: AccountScope }>;
  weekIndex: number;
  setJournalTime: (value: Date) => void;
}>): readonly FixtureTrade[] {
  const fixture = WEEK_FIXTURES[input.weekIndex];
  const dates = TRADING_DATES[input.weekIndex];
  if (!fixture || !dates || !input.scope.workspace.activeAccountId) fail("seed_week_missing");
  const trades = weekTrades(input.weekIndex);
  const accountSelectionRef = deriveJournalAccountSelectionRef(
    input.scope.workspace.workspaceId,
    input.scope.workspace.activeAccountId,
  );
  const tradeBySymbol = new Map(trades.map((trade) => [trade.symbol, trade] as const));
  let createdExecutionCount = 0;
  for (const tradingDate of dates) {
    const dayTrades = trades.filter((trade) => trade.tradingDate === tradingDate);
    const entries = manualEntries(dayTrades);
    const committedAt = new Date(`${tradingDate}T23:00:00.000Z`);
    input.setJournalTime(committedAt);
    const preview = input.services.manualPreview.preview(input.scope.workspace, {
      accountSelectionRef,
      tracker: "day",
      entries,
    });
    if (preview.groups.length !== dayTrades.length || preview.groups.some((group) =>
      group.existingPosition !== null || group.state !== "complete_trade" ||
        !group.allowedRelationships.includes("start_new_trade"))) {
      fail(`manual_preview_${tradingDate}`);
    }
    const committed = input.services.manualCommand.commit(
      input.scope.workspace,
      accountSelectionRef,
      {
        tracker: "day",
        entries,
        previewRef: preview.previewRef,
        expectedAccountSelectionRef: accountSelectionRef,
        idempotencyKey: `true-month-manual-day-${tradingDate.replaceAll("-", "")}-v1`,
        confirmations: preview.groups.map((group) => {
          const trade = tradeBySymbol.get(group.symbol);
          if (!trade) fail(`manual_preview_symbol_${group.symbol}`);
          const style = trade.globalIndex < 4
            ? "swing" as const
            : trade.globalIndex < 8 ? "other" as const : "day_trade" as const;
          return Object.freeze({
            groupRef: group.groupRef,
            relationship: "start_new_trade" as const,
            style,
            existingPositionRef: null,
            completeExecutionSetConfirmed: true,
          });
        }),
      },
      committedAt,
    );
    if (committed.status !== "committed" ||
        committed.createdExecutionCount !== dayTrades.length * 2 ||
        committed.relatedDecisionIds.length !== 0) {
      fail(`manual_commit_${tradingDate}`);
    }
    createdExecutionCount += committed.createdExecutionCount;
  }
  if (createdExecutionCount !== trades.length * 2) fail(`manual_commit_${fixture.label}`);
  const positions = new Map(input.services.styles.listCurrentPositions(input.scope.account)
    .map((position) => [position.symbol, position] as const));
  const reflection = reflectionForWeek(input.weekIndex);
  for (let dayIndex = 0; dayIndex < dates.length; dayIndex += 1) {
    const tradingDate = dates[dayIndex];
    if (!tradingDate) fail("trading_date_missing");
    const noteAt = new Date(`${tradingDate}T21:30:00.000Z`);
    input.services.annotations.saveDailyNote(input.scope.account, {
      tradingDate,
      expectedRevision: null,
      whatWorked: reflection.whatWorked,
      whatNeedsWork: reflection.whatNeedsWork,
      technicalRecap: reflection.technicalRecap,
      tomorrowsFocus: reflection.focus,
      anythingElse: dayIndex === 4 ? "Review the full week before the next session." : "",
      now: noteAt,
    });
  }
  for (const trade of trades) {
    const position = positions.get(trade.symbol);
    if (!position || position.projectionState !== "ready_closed") {
      const issues = input.database.prepare<[], Readonly<{ issue_code: string }>>(
        "SELECT DISTINCT issue_code FROM journal_data_decisions WHERE state = 'pending' ORDER BY issue_code",
      ).all().map((row) => row.issue_code).join("+");
      fail(`round_trip_${trade.symbol}_${position?.projectionState ?? "missing"}_${issues}`);
    }
    const annotatedAt = new Date(`${trade.tradingDate}T22:00:00.000Z`);
    const tradeStyle = trade.globalIndex < 4
      ? "swing" as const
      : trade.globalIndex < 8
        ? "other" as const
        : "day_trade" as const;
    if (position.tradeStyle !== tradeStyle) fail(`trade_style_${trade.symbol}`);
    const tagKeys = [
      "setup_first_pullback",
      "market_strong_trend",
      ...(trade.brokeExitRule ? ["mistake_ignored_stop"] : ["process_followed_plan"]),
      ...(trade.lateEntry ? ["entry_late"] : []),
    ];
    input.services.annotations.replaceRoundTripTagsWithPresets(input.scope.account, {
      roundTripId: position.roundTripId,
      tagIds: Object.freeze([]),
      presetKeys: Object.freeze(tagKeys),
      now: annotatedAt,
    });
    if (trade.globalIndex % 7 !== 6) {
      input.services.annotations.saveRoundTripNote(input.scope.account, {
        roundTripId: position.roundTripId,
        expectedRevision: null,
        technicalNote: trade.brokeExitRule
          ? "The trade moved in my favor before reversing through the planned stop."
          : "The first pullback held and the exit stayed within the plan.",
        tradeNote: trade.brokeExitRule
          ? "I held after the stop instead of exiting."
          : "Patient entry and controlled exit.",
        now: annotatedAt,
      });
    }
    input.services.annotations.saveRuleReview(input.scope.account, {
      ruleId: input.rules.exit.ruleId,
      ruleVersionId: input.rules.exit.versionId,
      targetKind: "round_trip",
      targetId: position.roundTripId,
      status: trade.brokeExitRule ? "broken" : "followed",
      note: trade.brokeExitRule ? "Held beyond the planned stop." : "Exited within planned risk.",
      expectedRevision: null,
      now: new Date(annotatedAt.getTime() + 1_000),
    });
    input.services.annotations.saveRuleReview(input.scope.account, {
      ruleId: input.rules.entry.ruleId,
      ruleVersionId: input.rules.entry.versionId,
      targetKind: "round_trip",
      targetId: position.roundTripId,
      status: trade.lateEntry ? "broken" : "followed",
      note: trade.lateEntry ? "Entered after the pullback had already extended." : "Waited for the pullback.",
      expectedRevision: null,
      now: new Date(annotatedAt.getTime() + 2_000),
    });
    if (tradeStyle === "swing") {
      input.services.swingNotes.immediate(() => input.services.swingNotes.save({
          scope: input.scope.account,
          roundTripId: position.roundTripId,
          reviewDate: trade.tradingDate,
          note: "Reviewed the swing position against the original entry plan.",
          nextSessionPlan: "Respect the planned risk and reassess after the open.",
          expectedRevision: null,
          idempotencyKey: `true-month-swing-note-${trade.globalIndex + 1}-v1`,
          timestamp: new Date(annotatedAt.getTime() + 3_000).toISOString(),
        }));
    }
    if (tradeStyle === "day_trade" && trade.globalIndex % 4 !== 3) {
      const target = input.services.analyzer.findEligibleTarget(
        input.scope.account,
        position.roundTripId,
      );
      if (!target) fail(`analyzer_target_${trade.symbol}`);
      input.services.analyzer.persistAnalysis({
        analyzed: analyzerResult(target, trade),
        marketSessionSetVersionId: null,
        scope: input.scope.account,
        status: "ready",
        target,
        now: new Date(annotatedAt.getTime() + 4_000),
      });
    }
  }
  for (let dayIndex = 0; dayIndex < dates.length; dayIndex += 1) {
    const tradingDate = dates[dayIndex];
    if (!tradingDate) fail("day_review_date_missing");
    const tradingDayId = input.services.annotations.resolveTradingDayId(
      input.scope.account,
      tradingDate,
    );
    if (!tradingDayId) fail(`trading_day_${tradingDate}`);
    const dayTrades = trades.filter((trade) => trade.tradingDate === tradingDate);
    const brokenCount = dayTrades.filter((trade) => trade.brokeExitRule).length;
    const daySequence = input.weekIndex * 5 + dayIndex;
    input.services.annotations.saveRuleReview(input.scope.account, {
      ruleId: input.rules.day.ruleId,
      ruleVersionId: input.rules.day.versionId,
      targetKind: "trading_day",
      targetId: tradingDayId,
      status: daySequence % 7 === 3
        ? "not_reviewed"
        : brokenCount >= 2 ? "broken" : "followed",
      note: brokenCount >= 2 ? "Two trades broke the planned-risk rule." : "Stopped before a second risk break.",
      expectedRevision: null,
      now: new Date(`${tradingDate}T22:30:00.000Z`),
    });
    input.services.dayReviews.save(input.scope.account, {
      expectedRevision: null,
      idempotencyKey: `true-month-day-review-${tradingDate.replaceAll("-", "")}`,
      status: [3, 10, 17].includes(daySequence) ? "incomplete" : "reviewed",
      tradingDate,
      userId: input.scope.account.userId,
      now: new Date(`${tradingDate}T22:45:00.000Z`),
    });
  }
  return trades;
}

function capturedProviderFetch(
  captured: CapturedProviderCall[],
  responseTime: () => Date,
): typeof globalThis.fetch {
  let responseSequence = 0;
  return async (_resource, init) => {
    if (typeof init?.body !== "string") fail("captured_provider_body");
    const body = JSON.parse(init.body) as Readonly<{
      model: string;
      input: readonly [unknown, Readonly<{
        content: readonly Readonly<{ type: string; text: string }>[];
      }>];
    }>;
    const prompt = body.input[1]?.content[0]?.text;
    if (body.model !== MODEL_ID || typeof prompt !== "string") {
      fail("captured_provider_request_shape");
    }
    const providerPackage = JSON.parse(prompt) as CoachAiReviewProviderPlanPackage;
    const choice = providerPackage.choices[0];
    if (!choice) fail("captured_provider_choice_missing");
    captured.push(Object.freeze({
      period: providerPackage.period,
      choiceCount: providerPackage.choices.length,
      requestBodyBytes: Buffer.byteLength(init.body, "utf8"),
    }));
    responseSequence += 1;
    const selection = Object.freeze({
      contractVersion: providerPackage.selectionContractVersion,
      packageKey: providerPackage.packageKey,
      choiceKey: choice.choiceKey,
    });
    const responseId = `resp_true_month_fixture_${responseSequence}`;
    return new Response(JSON.stringify({
      id: responseId,
      object: "response",
      created_at: Math.floor(responseTime().getTime() / 1_000),
      status: "completed",
      model: MODEL_ID,
      output: [{
        type: "message",
        id: `msg_true_month_fixture_${responseSequence}`,
        status: "completed",
        role: "assistant",
        content: [{
          type: "output_text",
          text: JSON.stringify(selection),
          annotations: [],
        }],
      }],
      service_tier: "default",
      usage: {
        input_tokens: 1_200,
        input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
        output_tokens: 40,
        output_tokens_details: { reasoning_tokens: 0 },
        total_tokens: 1_240,
      },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

function diagnosticText(value: unknown, maximumLength = 400): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u001f\u007f]+/gu, " ").trim();
  return normalized.length === 0 ? null : normalized.slice(0, maximumLength);
}

function liveDiagnosticFetch(
  diagnostics: ProviderHttpDiagnostic[],
): typeof globalThis.fetch {
  return async (resource, init) => {
    try {
      const response = await globalThis.fetch(resource, init);
      let providerError: Record<string, unknown> | null = null;
      if (!response.ok) {
        try {
          const body = await response.clone().json() as unknown;
          if (body !== null && typeof body === "object" && !Array.isArray(body)) {
            const error = (body as Record<string, unknown>).error;
            if (error !== null && typeof error === "object" && !Array.isArray(error)) {
              providerError = error as Record<string, unknown>;
            }
          }
        } catch {
          providerError = null;
        }
      }
      diagnostics.push(Object.freeze({
        status: response.status,
        errorType: diagnosticText(providerError?.type),
        errorCode: diagnosticText(providerError?.code),
        errorParam: diagnosticText(providerError?.param),
        errorMessage: diagnosticText(providerError?.message),
      }));
      return response;
    } catch (error) {
      diagnostics.push(Object.freeze({
        status: null,
        errorType: error instanceof Error ? diagnosticText(error.name) : null,
        errorCode: null,
        errorParam: null,
        errorMessage: error instanceof Error ? diagnosticText(error.message) : null,
      }));
      throw error;
    }
  };
}

function receipt(database: Database.Database, requestId: string): ReceiptRow {
  return database.prepare<[string], ReceiptRow>(`SELECT
  MAX(receipt.input_tokens) AS input_tokens,
  MAX(receipt.cached_input_tokens) AS cached_input_tokens,
  MAX(receipt.cache_write_input_tokens) AS cache_write_input_tokens,
  MAX(receipt.output_tokens) AS output_tokens,
  MAX(receipt.total_tokens) AS total_tokens,
  MAX(receipt.estimated_cost_usd) AS estimated_cost_usd
FROM coach_ai_review_generation_attempts_v2 attempt
LEFT JOIN coach_ai_review_generation_attempt_receipts_v2 receipt
  ON receipt.coach_ai_review_generation_attempt_id =
    attempt.coach_ai_review_generation_attempt_id
WHERE attempt.coach_ai_review_period_request_id = ?`).get(requestId)!;
}

async function issueReview(input: Readonly<{
  coordinator: CoachAiReviewGenerationCoordinatorV2;
  scope: WorkspaceAccessScope;
  reviewKind: "weekly" | "monthly";
  startDate: string;
  endDate: string;
  now: Date;
}>): Promise<string> {
  const result = await input.coordinator.generateNow(input.scope, {
    reviewKind: input.reviewKind,
    periodStartDate: input.startDate,
    periodEndDate: input.endDate,
  }, input.now);
  if (result.state !== "issued") {
    fail(`review_not_issued_${input.reviewKind}_${input.startDate}_${result.state}`);
  }
  return result.requestId;
}

async function main(): Promise<void> {
  const confirmation = process.argv[2];
  const live = confirmation === LIVE_CONFIRMATION;
  if (process.argv.length !== 3 ||
      (confirmation !== CAPTURED_CONFIRMATION && confirmation !== LIVE_CONFIRMATION)) {
    fail("confirmation_required");
  }
  configureEnvironment(live);
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-true-month-"));
  const databasePath = join(temporaryRoot, "true-month.sqlite");
  const database = new Database(databasePath);
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    runPlatformMigrations(database, {
      manifest: platformMigrationManifest,
      now: () => new Date("2026-06-30T10:00:00.000Z"),
    });
    const scope = createScope(database);
    configurePaidAccess(database, scope.workspace);
    configureReviewInfrastructure(database, scope.workspace);
    let journalTime = new Date("2026-07-10T23:00:00.000Z");
    const services = createJournalServices(database, () => journalTime);
    const rules = createRules(services.annotations, scope.account);
    const capturedCalls: CapturedProviderCall[] = [];
    const providerHttpDiagnostics: ProviderHttpDiagnostic[] = [];
    let operationBase = new Date("2026-07-01T12:10:00.000Z").getTime();
    let operationTick = 0;
    const operationClock = () => new Date(operationBase + (++operationTick * 1_000));
    const coordinator = new CoachAiReviewGenerationCoordinatorV2(
      database,
      undefined,
      {
        operationClock,
        capturedTestFetch: live
          ? liveDiagnosticFetch(providerHttpDiagnostics)
          : capturedProviderFetch(capturedCalls, operationClock),
      },
    );
    const mutableRequests: {
      label: string;
      requestId: string;
      reviewKind: "weekly" | "monthly";
    }[] = [];
    const allTrades: FixtureTrade[] = [];
    for (let weekIndex = 0; weekIndex < WEEK_FIXTURES.length; weekIndex += 1) {
      const fixture = WEEK_FIXTURES[weekIndex];
      if (!fixture) fail("issue_week_fixture_missing");
      allTrades.push(...seedWeek({
        database,
        services,
        rules,
        scope,
        weekIndex,
        setJournalTime: (value) => { journalTime = value; },
      }));
      operationBase = fixture.issueAt.getTime();
      operationTick = 0;
      mutableRequests.push(Object.freeze({
        label: fixture.label,
        requestId: await issueReview({
          coordinator,
          scope: scope.workspace,
          reviewKind: "weekly",
          startDate: fixture.startDate,
          endDate: fixture.endDate,
          now: fixture.issueAt,
        }),
        reviewKind: "weekly" as const,
      }));
    }
    const monthlyIssueAt = new Date("2026-08-02T16:00:00.000Z");
    operationBase = monthlyIssueAt.getTime();
    operationTick = 0;
    mutableRequests.push(Object.freeze({
      label: "month",
      requestId: await issueReview({
        coordinator,
        scope: scope.workspace,
        reviewKind: "monthly",
        startDate: MONTH_START,
        endDate: MONTH_END,
        now: monthlyIssueAt,
      }),
      reviewKind: "monthly" as const,
    }));
    const compatibility = new CoachAiReviewGenerationCompatibilityRepository(database);
    const persistence = new CoachAiReviewInsightPersistenceRepository(database);
    const requestRepository = new CoachAiReviewRepository(database);
    const issued = compatibility.listIssuedReviews(scope.workspace, { limit: 20 });
    const monthlyRequest = mutableRequests.find((request) => request.reviewKind === "monthly");
    if (!monthlyRequest) fail("monthly_request_missing");
    const storedMonthlyRequest = requestRepository.readPeriodRequestV2(
      scope.workspace,
      monthlyRequest.requestId,
    );
    if (storedMonthlyRequest.state !== "issued" || !storedMonthlyRequest.issuedReviewId) {
      fail("monthly_issued_row_missing");
    }
    const monthlyReview = compatibility.readIssuedReview(
      scope.workspace,
      storedMonthlyRequest.issuedReviewId,
    );
    const monthlyPresentation = compatibility.readIssuedReviewOutput(
      scope.workspace,
      storedMonthlyRequest.issuedReviewId,
    );
    const monthlyArtifact = persistence.read(
      scope.workspace,
      monthlyRequest.requestId,
    ).artifact;
    const monthlySource = monthlyArtifact.sourceSnapshot.source;
    const styleCounts = Object.fromEntries([
      "day_trade",
      "swing",
      "other",
      "unclassified",
    ].map((style) => [style, monthlySource.trades.filter((trade) =>
      (trade.tradeStyle?.tradeStyle ?? "unclassified") === style).length]));
    const sourceReadyAnalyzerCount = monthlySource.trades.filter((trade) =>
      trade.analyzer.analysis.availability === "ready").length;
    const databaseReadyAnalyzerCount = database.prepare<[], Readonly<{ count: number }>>(
      `SELECT COUNT(*) AS count FROM journal_round_trip_daily_trade_analyses
WHERE status = 'ready'`,
    ).get()!.count;
    const currentPeriodWeeklyContexts = monthlySource.issuedNarrativeContext.filter((context) =>
      context.contextKind === "current_period" && context.reviewKind === "weekly");
    const focusCandidateCount = monthlyArtifact.candidates.filter((candidate) =>
      candidate.family === "focus_follow_through").length;
    const namedRuleCandidateCount = monthlyArtifact.candidates.filter((candidate) =>
      candidate.family === "named_rule_association").length;
    const monthlyCapturedCalls = capturedCalls.filter((call) =>
      call.period.cadence === "monthly" && call.period.startDate === MONTH_START &&
        call.period.endDate === MONTH_END);
    const monthlyReceipt = receipt(database, monthlyRequest.requestId);
    const monthlySelectionAudit = database.prepare<[string], Readonly<{
      selection_source: string;
      selection_reason_code: string;
      validation_state: string;
      failure_code: string | null;
      provider_choice_key: string | null;
    }>>(`SELECT selection_source, selection_reason_code, validation_state,
  failure_code, provider_choice_key
FROM coach_ai_review_insight_selection_audits
WHERE coach_ai_review_period_request_id = ?
ORDER BY recorded_at_utc DESC LIMIT 1`).get(monthlyRequest.requestId) ?? null;
    const weeklyRecords = mutableRequests.filter((request) => request.reviewKind === "weekly")
      .map((request) => {
        const stored = requestRepository.readPeriodRequestV2(scope.workspace, request.requestId);
        if (stored.state !== "issued" || !stored.issuedReviewId) {
          fail(`weekly_issued_row_${request.label}`);
        }
        const reopened = compatibility.readIssuedReview(scope.workspace, stored.issuedReviewId);
        const snapshot = persistence.read(scope.workspace, request.requestId).artifact;
        return Object.freeze({
          label: request.label,
          periodStartDate: reopened.periodStartDate,
          periodEndDate: reopened.periodEndDate,
          sourceTradeCount: snapshot.sourceSnapshot.source.trades.length,
          completePlanCount: snapshot.catalog.completePlans.length,
          generationSource: reopened.generationSource,
          output: reopened.output,
          receipt: receipt(database, request.requestId),
        });
      });
    const foreignKeyFailures = database.pragma("foreign_key_check") as readonly unknown[];
    const quickCheck = database.pragma("quick_check", { simple: true });
    const valid = allTrades.length === 80 &&
      monthlySource.trades.length === 80 &&
      issued.length === 5 &&
      issued.every((review) => review.generationContractVersion === "insight_selection_v3") &&
      weeklyRecords.length === 4 &&
      currentPeriodWeeklyContexts.length === 4 &&
      new Set(currentPeriodWeeklyContexts.map((context) => context.periodEndDate)).size === 4 &&
      styleCounts.day_trade === 72 && styleCounts.swing === 4 &&
      styleCounts.other === 4 && styleCounts.unclassified === 0 &&
      sourceReadyAnalyzerCount === 54 && databaseReadyAnalyzerCount === 54 &&
      monthlyArtifact.catalog.completePlans.length > 1 &&
      focusCandidateCount > 0 && namedRuleCandidateCount > 0 &&
      monthlyReview.generationContractVersion === "insight_selection_v3" &&
      monthlyPresentation.output.contractVersion === monthlyReview.output.contractVersion &&
      (live
        ? monthlyReview.generationSource === "provider_selected" &&
          monthlyReceipt.input_tokens !== null && monthlyReceipt.output_tokens !== null
        : monthlyCapturedCalls.length === 1) &&
      foreignKeyFailures.length === 0 && quickCheck === "ok";
    const resultArtifact = Object.freeze({
      fixtureOnly: true,
      liveProvider: live,
      liveDatabaseMutated: false,
      trueMonthlySequence: Object.freeze({
        weeklyReviewsIssuedFirst: weeklyRecords.length,
        monthlyReviewIssuedAfter: true,
        monthlyCurrentPeriodWeeklyContextCount: currentPeriodWeeklyContexts.length,
      }),
      sourceCoverage: Object.freeze({
        tradeCount: monthlySource.trades.length,
        tradingDayCount: monthlySource.days.length,
        moneyCompleteTradeCount: monthlySource.coverage.moneyCompleteTradeCount,
        styleCounts,
        sourceReadyAnalyzerCount,
        databaseReadyAnalyzerCount,
        ruleCount: monthlySource.rules.length,
        ruleReviewCount: monthlySource.ruleReviews.length,
        presetEvaluationCount: monthlySource.presetEvaluations.length,
      }),
      selection: Object.freeze({
        monthlyCompletePlanCount: monthlyArtifact.catalog.completePlans.length,
        monthlyCandidateCount: monthlyArtifact.candidates.length,
        focusCandidateCount,
        namedRuleCandidateCount,
        capturedProviderCalls: capturedCalls,
        providerHttpDiagnostics,
        monthlySelectionAudit,
      }),
      weeklyReviews: weeklyRecords,
      monthlyReview: Object.freeze({
        periodStartDate: monthlyReview.periodStartDate,
        periodEndDate: monthlyReview.periodEndDate,
        generationSource: monthlyReview.generationSource,
        output: monthlyReview.output,
        receipt: monthlyReceipt,
      }),
      database: Object.freeze({
        foreignKeyFailures: foreignKeyFailures.length,
        quickCheck,
      }),
      valid,
    });
    const artifactName = `insight-true-month-${live ? "live" : "captured"}-${new Date()
      .toISOString().replaceAll(":", "-")}.json`;
    writeFileSync(
      join(process.cwd(), ".local-logs", artifactName),
      `${JSON.stringify(resultArtifact, null, 2)}\n`,
      "utf8",
    );
    process.stdout.write(`${JSON.stringify({
      status: valid ? "passed" : "failed",
      artifactName,
      liveProvider: live,
      reviewCount: issued.length,
      monthlyTradeCount: monthlySource.trades.length,
      monthlyWeeklyContextCount: currentPeriodWeeklyContexts.length,
      styleCounts,
      analyzerCoverage: `${sourceReadyAnalyzerCount}/${monthlySource.trades.length}`,
      monthlyCompletePlanCount: monthlyArtifact.catalog.completePlans.length,
      monthlyCandidateCount: monthlyArtifact.candidates.length,
      focusCandidateCount,
      namedRuleCandidateCount,
      monthlyGenerationSource: monthlyReview.generationSource,
      monthlySelectionAudit,
      providerHttpDiagnostics,
      monthlyReceipt,
      output: monthlyReview.output,
      foreignKeyFailures: foreignKeyFailures.length,
      quickCheck,
      liveDatabaseMutated: false,
    }, null, 2)}\n`);
    if (!valid) process.exitCode = 1;
  } finally {
    database.close();
    const expectedPrefix = join(tmpdir(), "traderlink-true-month-");
    if (!temporaryRoot.startsWith(expectedPrefix)) fail("temporary_cleanup_boundary");
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

void main();
