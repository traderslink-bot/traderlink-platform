import type Database from "better-sqlite3";

import { analyzeDailyTrade } from "@/src/modules/level-analysis/server/daily-trade-analyzer";
import { DailyTradeAnalyzerRepository } from "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "@/src/modules/journal/server/accounts/journal-account-service";
import {
  ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
  DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "@/src/modules/journal/server/accounts/journal-source-account-canonicalizers";
import { JournalDataDecisionRepository } from "@/src/modules/journal/server/decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "@/src/modules/journal/server/decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "@/src/modules/journal/server/executions/journal-execution-repository";
import { JournalExecutionService } from "@/src/modules/journal/server/executions/journal-execution-service";
import type { JournalManualTradeEntry } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import {
  createJournalPrivacyDigester,
  JournalImportService,
  loadJournalPrivacyHmacConfiguration,
} from "@/src/modules/journal/server/imports/journal-import-service";
import { JournalImportRepository } from "@/src/modules/journal/server/imports/journal-import-repository";
import { createJournalManualTradePreviewAuthority } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-authority";
import { JournalManualTradeCommandRepository } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-repository";
import { JournalManualTradeCommandService } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-service";
import { JournalManualTradePreviewRepository } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-repository";
import { JournalManualTradePreviewService } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-service";
import { JournalExecutionReconciliationRepository } from "@/src/modules/journal/server/reconciliation/journal-execution-reconciliation-repository";
import { JournalRoundTripRepository } from "@/src/modules/journal/server/round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "@/src/modules/journal/server/round-trips/journal-round-trip-service";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

const TARGET_DATE = "2026-08-07";
const CONFIRMATION = "--confirm-local-multi-trade-review";
const SOURCE_TIMEZONE = "America/New_York";
const FIXTURE = Object.freeze([
  { symbol: "MB", time: "10:15:00", side: "buy", quantity: "100", price: "12.35" },
  { symbol: "MB", time: "10:20:00", side: "buy", quantity: "100", price: "13.49" },
  { symbol: "MB", time: "10:38:00", side: "sell", quantity: "100", price: "11.6325" },
  { symbol: "MB", time: "10:45:00", side: "sell", quantity: "100", price: "13.35" },
  { symbol: "MB", time: "11:10:00", side: "sell", quantity: "150", price: "12.39" },
  { symbol: "MB", time: "11:15:00", side: "sell", quantity: "50", price: "11.32" },
  { symbol: "MB", time: "11:34:00", side: "buy", quantity: "100", price: "9.29" },
  { symbol: "MB", time: "11:40:00", side: "buy", quantity: "100", price: "8.39" },
  { symbol: "NAMI", time: "11:00:00", side: "buy", quantity: "200", price: "4.83" },
  { symbol: "NAMI", time: "11:05:00", side: "buy", quantity: "100", price: "4.825" },
  { symbol: "NAMI", time: "11:24:00", side: "sell", quantity: "150", price: "5.02" },
  { symbol: "NAMI", time: "11:30:00", side: "sell", quantity: "150", price: "5.34" },
  { symbol: "NAMI", time: "12:00:00", side: "buy", quantity: "125", price: "5.26" },
  { symbol: "NAMI", time: "12:06:00", side: "buy", quantity: "125", price: "5.08" },
  { symbol: "NAMI", time: "12:28:00", side: "sell", quantity: "100", price: "4.61" },
  { symbol: "NAMI", time: "12:35:00", side: "sell", quantity: "150", price: "4.2507" },
  { symbol: "DSY", time: "12:00:00", side: "buy", quantity: "120", price: "4.84" },
  { symbol: "DSY", time: "12:04:00", side: "buy", quantity: "80", price: "4.9965" },
  { symbol: "DSY", time: "12:28:00", side: "sell", quantity: "100", price: "4.78" },
  { symbol: "DSY", time: "12:40:00", side: "sell", quantity: "100", price: "4.75" },
  { symbol: "DSY", time: "13:15:00", side: "sell", quantity: "150", price: "4.99" },
  { symbol: "DSY", time: "13:20:00", side: "sell", quantity: "50", price: "4.65" },
  { symbol: "DSY", time: "13:43:00", side: "buy", quantity: "100", price: "4.46" },
  { symbol: "DSY", time: "13:50:00", side: "buy", quantity: "100", price: "4.58" },
] as const);

type CandidateRow = Readonly<{
  account_id: string;
  current_version_id: string;
  market_session_set_version_id: string;
  round_trip_id: string;
  user_id: string;
  workspace_id: string;
}>;

type CandleRow = Readonly<{
  candle_time_utc_seconds: number;
  close_decimal: string;
  high_decimal: string;
  low_decimal: string;
  open_decimal: string;
  turnover_decimal: string | null;
  volume_decimal: string;
}>;

function manualExecution(
  entry: (typeof FIXTURE)[number],
  index: number,
): JournalManualTradeEntry {
  return Object.freeze({
    clientRowRef: `multi-trade-${TARGET_DATE.replaceAll("-", "")}-${index + 1}`,
    localDate: TARGET_DATE,
    localTime: entry.time,
    sourceTimezone: SOURCE_TIMEZONE,
    normalizedSymbol: entry.symbol,
    tradeCurrency: "USD",
    side: entry.side,
    quantityDecimal: entry.quantity,
    priceDecimal: entry.price,
    feesDecimal: null,
  });
}

function createManualTradeServices(database: Database.Database): Readonly<{
  command: JournalManualTradeCommandService;
  previews: JournalManualTradePreviewService;
}> {
  const accounts = new JournalAccountService(
    new JournalAccountRepository(database),
    loadAccountIdentityConfiguration(
      process.env,
      ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
      DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    ),
  );
  const importsRepository = new JournalImportRepository(database);
  const executions = new JournalExecutionRepository(database);
  const reconciliations = new JournalExecutionReconciliationRepository(database);
  const imports = new JournalImportService(
    importsRepository,
    executions,
    accounts,
    createJournalPrivacyDigester(loadJournalPrivacyHmacConfiguration(process.env)),
    reconciliations,
  );
  const roundTrips = new JournalRoundTripService(new JournalRoundTripRepository(database));
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    importsRepository,
    imports,
    executions,
    new JournalExecutionService(executions),
    roundTrips,
    reconciliations,
  );
  const privacyConfiguration = loadJournalPrivacyHmacConfiguration(process.env);
  const previews = new JournalManualTradePreviewService(
    new JournalManualTradePreviewRepository(database),
    accounts,
    createJournalManualTradePreviewAuthority(privacyConfiguration),
  );
  return Object.freeze({
    command: new JournalManualTradeCommandService(
      new JournalManualTradeCommandRepository(database),
      imports,
      decisions,
      roundTrips,
      previews,
    ),
    previews,
  });
}

function rebuildCachedAnalyses(database: Database.Database): Readonly<{ rebuilt: number }> {
  const candidates = database.prepare<[string], CandidateRow>(`SELECT
  round_trip.round_trip_id,
  round_trip.workspace_id,
  round_trip.account_id,
  owner.user_id,
  round_trip.current_version_id,
  session.current_version_id AS market_session_set_version_id
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
  AND instrument.instrument_id = version.instrument_id
JOIN platform_workspace_memberships owner
  ON owner.workspace_id = round_trip.workspace_id
  AND owner.role = 'owner'
  AND owner.status = 'active'
JOIN level_analysis_market_session_sets session
  ON session.provider_symbol = instrument.normalized_symbol
  AND session.trading_date_new_york = ?
  AND session.provider_key = 'moomoo_history_kline'
  AND session.current_status = 'ready'
LEFT JOIN journal_round_trip_daily_trade_analyses analysis
  ON analysis.workspace_id = round_trip.workspace_id
  AND analysis.account_id = round_trip.account_id
  AND analysis.round_trip_id = round_trip.round_trip_id
WHERE round_trip.lifecycle_state = 'active'
  AND version.projection_state = 'ready_closed'
  AND instrument.normalized_symbol IN ('MB', 'NAMI', 'DSY')
  AND version.opened_at_utc >= '2026-08-07T04:00:00.000Z'
  AND version.opened_at_utc < '2026-08-08T04:00:00.000Z'
  AND session.current_version_id IS NOT NULL
  AND (analysis.daily_trade_analysis_id IS NULL
    OR analysis.round_trip_version_id <> round_trip.current_version_id)
ORDER BY instrument.normalized_symbol, version.opened_at_utc`).all(TARGET_DATE);
  const candleStatement = database.prepare<[string], CandleRow>(`SELECT
  candle_time_utc_seconds, open_decimal, high_decimal, low_decimal, close_decimal,
  volume_decimal, turnover_decimal
FROM level_analysis_market_session_candles
WHERE market_session_set_version_id = ?
ORDER BY candle_time_utc_seconds`);
  const repository = new DailyTradeAnalyzerRepository(database);
  let rebuilt = 0;
  for (const candidate of candidates) {
    const scope: AccountScope = Object.freeze({
      accountId: candidate.account_id,
      userId: candidate.user_id,
      workspaceId: candidate.workspace_id,
      workspaceRole: "owner",
    });
    const target = repository.findEligibleTarget(scope, candidate.round_trip_id);
    if (!target || target.roundTripVersionId !== candidate.current_version_id) {
      throw new Error("multi_trade_review_target_changed");
    }
    const candles: readonly NormalizedMarketCandle[] = Object.freeze(
      candleStatement.all(candidate.market_session_set_version_id).map((candle) => Object.freeze({
        closeDecimal: candle.close_decimal,
        highDecimal: candle.high_decimal,
        lowDecimal: candle.low_decimal,
        openDecimal: candle.open_decimal,
        time: candle.candle_time_utc_seconds,
        turnoverDecimal: candle.turnover_decimal,
        volumeDecimal: candle.volume_decimal,
      })),
    );
    repository.persistAnalysis({
      analyzed: analyzeDailyTrade({
        candles,
        dailyRanges: [],
        direction: target.direction,
        events: target.events,
      }),
      marketSessionSetVersionId: candidate.market_session_set_version_id,
      now: new Date(),
      scope,
      status: "ready",
      target,
    });
    rebuilt += 1;
  }
  return Object.freeze({ rebuilt });
}

if (process.argv.slice(2).length !== 1 || process.argv[2] !== CONFIRMATION) {
  throw new Error("multi_trade_review_confirmation_required");
}
if (process.env.NODE_ENV === "production") {
  throw new Error("multi_trade_review_development_only");
}
Object.assign(process.env, { NODE_ENV: "development" });
const local = loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
if (!local.databasePath.endsWith("\\traderlink-platform\\development.sqlite")) {
  throw new Error("multi_trade_review_database_not_development");
}

const database = openPlatformDatabase({ mode: "runtime" });
try {
  const owner = deriveDevelopmentOwnerJournalScope(database);
  const services = createManualTradeServices(database);
  const entries = FIXTURE.map(manualExecution);
  const preview = services.previews.preview(owner.scope, {
    accountSelectionRef: owner.accountSelectionRef,
    entries,
    tracker: "day",
  });
  if (preview.groups.length !== 6 || preview.groups.some((group) =>
    group.existingPosition !== null || !group.allowedRelationships.includes("start_new_trade"))) {
    throw new Error("multi_trade_review_preview_unexpected");
  }
  const committed = services.command.commit(
    owner.scope,
    owner.accountSelectionRef,
    {
      confirmations: preview.groups.map((group) => Object.freeze({
        completeExecutionSetConfirmed: true,
        existingPositionRef: null,
        groupRef: group.groupRef,
        relationship: "start_new_trade" as const,
        style: "day_trade" as const,
      })),
      entries,
      expectedAccountSelectionRef: owner.accountSelectionRef,
      idempotencyKey: "daily-trade-multi-trade-review-20260807-v2",
      previewRef: preview.previewRef,
      tracker: "day",
    },
  );
  if (committed.relatedDecisionIds.length !== 0) {
    throw new Error("multi_trade_review_created_data_decision");
  }
  const analyses = rebuildCachedAnalyses(database);
  process.stdout.write(`${JSON.stringify({
    acceptedExecutions: committed.executionIds.length,
    analysisRebuilds: analyses.rebuilt,
    createdExecutions: committed.createdExecutionCount,
    matchedExecutions: committed.matchedExecutionCount,
    status: committed.status,
  })}\n`);
} finally {
  database.close();
}
