import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import {
  ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
  DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "@/src/modules/journal/server/accounts/journal-source-account-canonicalizers";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "@/src/modules/journal/server/accounts/journal-account-service";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalDataDecisionRepository } from "@/src/modules/journal/server/decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "@/src/modules/journal/server/decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "@/src/modules/journal/server/executions/journal-execution-repository";
import { JournalExecutionService } from "@/src/modules/journal/server/executions/journal-execution-service";
import {
  createJournalPrivacyDigester,
  JournalImportService,
  loadJournalPrivacyHmacConfiguration,
} from "@/src/modules/journal/server/imports/journal-import-service";
import { JournalImportRepository } from "@/src/modules/journal/server/imports/journal-import-repository";
import type { JournalManualTradeEntry } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { createJournalManualTradePreviewAuthority } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-authority";
import { JournalManualTradeCommandRepository } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-repository";
import { JournalManualTradeCommandService } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-service";
import { JournalManualTradePreviewRepository } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-repository";
import { JournalManualTradePreviewService } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-service";
import { JournalExecutionReconciliationRepository } from "@/src/modules/journal/server/reconciliation/journal-execution-reconciliation-repository";
import { JournalRoundTripRepository } from "@/src/modules/journal/server/round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "@/src/modules/journal/server/round-trips/journal-round-trip-service";
import { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

function createFixtureRuntime(database: ReturnType<typeof openPlatformDatabase>) {
  const accountRepository = new JournalAccountRepository(database);
  const accounts = new JournalAccountService(
    accountRepository,
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
  const privacyConfiguration = loadJournalPrivacyHmacConfiguration(process.env);
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    importsRepository,
    imports,
    executions,
    new JournalExecutionService(executions),
    roundTrips,
    reconciliations,
  );
  const previews = new JournalManualTradePreviewService(
    new JournalManualTradePreviewRepository(database),
    accounts,
    createJournalManualTradePreviewAuthority(privacyConfiguration, {
      now: () => new Date("2026-08-05T20:00:00.000Z"),
    }),
    () => new Date("2026-08-05T20:00:00.000Z"),
  );
  return Object.freeze({
    annotations: new JournalAnnotationService(
      new JournalAnnotationRepository(database),
      new JournalRuleRepository(database),
    ),
    manualTrades: new JournalManualTradeCommandService(
      new JournalManualTradeCommandRepository(database),
      imports,
      decisions,
      roundTrips,
      previews,
    ),
    previews,
    tradingDayReviews: new JournalTradingDayReviewService(database),
  });
}

type TradeFixture = Readonly<{
  date: string;
  symbol: string;
  entries: readonly Readonly<{
    time: string;
    side: "buy" | "sell";
    quantity: string;
    price: string;
  }>[];
  note: string;
}>;

type DayFixture = Readonly<{
  date: string;
  reviewed: boolean;
  note: Readonly<{
    whatWorked: string;
    whatNeedsWork: string;
    technicalRecap: string;
    currentFocuses: string;
    anythingElse: string;
  }>;
  revisedCurrentFocuses?: string;
  trades: readonly TradeFixture[];
}>;

const SOURCE_TIMEZONE = "America/New_York";

const WEEKS: readonly DayFixture[] = [
  {
    date: "2026-07-20",
    reviewed: true,
    note: {
      whatWorked: "I waited for the first pullback instead of buying the first extension. The entry was planned and I took profit into the push.",
      whatNeedsWork: "I still watched too many names before the open. I need to narrow the list before the first trade.",
      technicalRecap: "The cleanest trade was the first pullback after volume held above VWAP.",
      currentFocuses: "Wait for clean first pullbacks. Take fewer names. Do not re-enter after a stop unless a genuinely new setup forms.",
      anythingElse: "I was calmer once I stopped chasing the opening spike.",
    },
    trades: [
      { date: "2026-07-20", symbol: "AIR10", note: "Waited for the pullback instead of chasing the first push. Took the planned entry and sold into strength.", entries: [
        { time: "09:42:00", side: "buy", quantity: "100", price: "2" },
        { time: "10:05:00", side: "sell", quantity: "100", price: "2.35" },
      ] },
    ],
  },
  {
    date: "2026-07-21",
    reviewed: true,
    note: {
      whatWorked: "I respected the stop once the setup failed and did not turn the loss into a larger problem.",
      whatNeedsWork: "The entry was late. I bought after the move was already extended instead of waiting for a reset.",
      technicalRecap: "The entry was too far from the pullback area and did not have room above it.",
      currentFocuses: "Wait for clean first pullbacks. Take fewer names. Do not re-enter after a stop unless a genuinely new setup forms.",
      anythingElse: "A small planned loss is still better than trying to force a recovery.",
    },
    trades: [
      { date: "2026-07-21", symbol: "AIR11", note: "Chased the third push after the move was extended. I did stop out quickly, but the entry should not have been taken.", entries: [
        { time: "09:58:00", side: "buy", quantity: "100", price: "5" },
        { time: "10:03:00", side: "sell", quantity: "100", price: "4.6" },
      ] },
    ],
  },
  {
    date: "2026-07-22",
    reviewed: true,
    note: {
      whatWorked: "The second entry was smaller and only taken after the chart reset. I did not average into the first losing entry.",
      whatNeedsWork: "I did not need the first attempt. I entered before volume confirmed the move.",
      technicalRecap: "The second setup had a cleaner base and held its level before the entry.",
      currentFocuses: "Wait for clean first pullbacks. Take fewer names. Do not re-enter after a stop unless a genuinely new setup forms.",
      anythingElse: "The re-entry was better because it was a new setup, not an emotional attempt to get the loss back.",
    },
    trades: [
      { date: "2026-07-22", symbol: "AIR12", note: "Entered before the level proved itself and took the stop. This was an early attempt, not the clean pullback I wanted.", entries: [
        { time: "09:38:00", side: "buy", quantity: "100", price: "1.5" },
        { time: "09:42:00", side: "sell", quantity: "100", price: "1.35" },
      ] },
      { date: "2026-07-22", symbol: "AIR12", note: "Waited for a fresh base after the first stop. Kept size controlled and took the planned exit.", entries: [
        { time: "10:18:00", side: "buy", quantity: "50", price: "1.6" },
        { time: "10:31:00", side: "sell", quantity: "50", price: "2" },
      ] },
    ],
  },
  {
    date: "2026-07-23",
    reviewed: true,
    note: {
      whatWorked: "I took the clean setup and locked profit instead of giving it all back. I also stopped after the second trade rather than forcing more.",
      whatNeedsWork: "The second trade was still lower quality than the first. I need to be more selective after an early winner.",
      technicalRecap: "The first chart held its opening level. The second trade did not have the same clean volume confirmation.",
      currentFocuses: "Wait for clean first pullbacks. Take fewer names. Do not re-enter after a stop unless a genuinely new setup forms.",
      anythingElse: "The first trade set the tone; I need to avoid letting an early win make me less selective.",
    },
    trades: [
      { date: "2026-07-23", symbol: "AIR13", note: "Clean first pullback with volume. I stayed patient, then sold into the next push instead of holding for more.", entries: [
        { time: "09:47:00", side: "buy", quantity: "100", price: "1.2" },
        { time: "10:06:00", side: "sell", quantity: "100", price: "1.5" },
      ] },
      { date: "2026-07-23", symbol: "AIR14", note: "This was a lower-quality second idea. I cut it when it did not hold the level rather than adding to it.", entries: [
        { time: "10:32:00", side: "buy", quantity: "100", price: "2" },
        { time: "10:39:00", side: "sell", quantity: "100", price: "1.8" },
      ] },
    ],
  },
  {
    date: "2026-07-24",
    reviewed: true,
    note: {
      whatWorked: "I did not average down. I followed the stop and kept the loss manageable.",
      whatNeedsWork: "I took the trade without enough confirmation because I wanted to finish the week green.",
      technicalRecap: "The entry did not have the clean reclaim or volume confirmation required by my plan.",
      currentFocuses: "Wait for clean first pullbacks. Take fewer names. Do not re-enter after a stop unless a genuinely new setup forms.",
      anythingElse: "The urge to make the week green affected the quality of the decision.",
    },
    trades: [
      { date: "2026-07-24", symbol: "AIR15", note: "Took a weak entry because I wanted one more winner for the week. The stop was controlled, but the setup was not there.", entries: [
        { time: "10:12:00", side: "buy", quantity: "100", price: "4" },
        { time: "10:21:00", side: "sell", quantity: "100", price: "3.55" },
      ] },
    ],
  },
  {
    date: "2026-07-27",
    reviewed: true,
    note: {
      whatWorked: "I took one clean setup early and did not keep looking for another trade after the plan was complete.",
      whatNeedsWork: "The late trade was unnecessary. I ignored the time cutoff because I thought the ticker still looked active.",
      technicalRecap: "The first setup was a clean pullback. The later one was after the momentum had already faded.",
      currentFocuses: "Wait for clean first pullbacks. Take fewer names. Do not re-enter after a stop unless a genuinely new setup forms.",
      anythingElse: "The early winner did not justify taking a lower-quality afternoon trade.",
    },
    trades: [
      { date: "2026-07-27", symbol: "AIR20", note: "Waited for the first pullback and took the entry when volume returned. This was the type of trade I want more of.", entries: [
        { time: "09:44:00", side: "buy", quantity: "100", price: "1.5" },
        { time: "10:02:00", side: "sell", quantity: "100", price: "1.9" },
      ] },
      { date: "2026-07-27", symbol: "AIR21", note: "Entered after my stated cutoff because I did not want to miss a move. The trade failed quickly and should have been skipped.", entries: [
        { time: "13:15:00", side: "buy", quantity: "100", price: "2" },
        { time: "13:22:00", side: "sell", quantity: "100", price: "1.75" },
      ] },
    ],
  },
  {
    date: "2026-07-28",
    reviewed: true,
    note: {
      whatWorked: "After the first loss I reduced size and waited for a new setup rather than trying to win it back immediately.",
      whatNeedsWork: "I still took a second attempt on the same ticker. The chart had improved, but I need to be honest about whether it was necessary.",
      technicalRecap: "The second entry had a better base and was smaller, but it was still a repeat attempt on the same name.",
      currentFocuses: "Keep waiting for the first pullback. Stop after one failed attempt unless the setup clearly resets.",
      anythingElse: "Reducing size helped me stay objective after the first loss.",
    },
    trades: [
      { date: "2026-07-28", symbol: "AIR22", note: "The first attempt failed. I followed the stop and did not add to the losing position.", entries: [
        { time: "09:40:00", side: "buy", quantity: "100", price: "1.4" },
        { time: "09:47:00", side: "sell", quantity: "100", price: "1.2" },
      ] },
      { date: "2026-07-28", symbol: "AIR22", note: "Waited for a reset and used half size. The setup was better, but this was still a second attempt that needs review.", entries: [
        { time: "10:20:00", side: "buy", quantity: "50", price: "1.25" },
        { time: "10:32:00", side: "sell", quantity: "50", price: "1.5" },
      ] },
    ],
  },
  {
    date: "2026-07-29",
    reviewed: true,
    note: {
      whatWorked: "The first trade was planned and I took the profit cleanly. I recognized the daily goal was reached.",
      whatNeedsWork: "I still took more trades after reaching the daily gain limit. The extra trades were not needed and made the day less disciplined.",
      technicalRecap: "The first setup had the best volume and structure. The later trades were weaker and became more impulsive.",
      currentFocuses: "Keep waiting for first pullbacks. Respect the 11:00 cutoff and stop after the daily goal.",
      anythingElse: "A green day does not mean the process was good if I ignored the plan after reaching the goal.",
    },
    revisedCurrentFocuses: "Keep waiting for first pullbacks. Respect the 11:00 cutoff and stop after the daily goal. One high-quality trade is enough when the plan is complete.",
    trades: [
      { date: "2026-07-29", symbol: "AIR23", note: "Clean planned winner. I took the move into strength and reached the daily goal without forcing size.", entries: [
        { time: "09:36:00", side: "buy", quantity: "100", price: "5" },
        { time: "10:30:00", side: "sell", quantity: "100", price: "7.5" },
      ] },
      { date: "2026-07-29", symbol: "AIR24", note: "Took another trade after reaching the daily goal. It worked, but it was not necessary and did not follow the stop-after-goal plan.", entries: [
        { time: "10:45:00", side: "buy", quantity: "50", price: "2" },
        { time: "10:52:00", side: "sell", quantity: "50", price: "2.2" },
      ] },
      { date: "2026-07-29", symbol: "AIR25", note: "Another unnecessary trade after the goal. I entered late and cut it quickly.", entries: [
        { time: "11:20:00", side: "buy", quantity: "100", price: "1.2" },
        { time: "11:26:00", side: "sell", quantity: "100", price: "1.12" },
      ] },
      { date: "2026-07-29", symbol: "AIR26", note: "Fourth completed trade of the day. This was pure overtrading after the plan had already worked.", entries: [
        { time: "12:00:00", side: "buy", quantity: "50", price: "2" },
        { time: "12:07:00", side: "sell", quantity: "50", price: "2.1" },
      ] },
    ],
  },
  {
    date: "2026-07-30",
    reviewed: true,
    note: {
      whatWorked: "I kept the loss small and did not chase a recovery trade. The decision was disciplined even though the result was red.",
      whatNeedsWork: "I can still wait a little longer for volume confirmation before the first entry.",
      technicalRecap: "The setup did not follow through. The exit was according to the planned risk rather than hope.",
      currentFocuses: "Keep waiting for first pullbacks. Respect the 11:00 cutoff and stop after the daily goal. One high-quality trade is enough when the plan is complete.",
      anythingElse: "This was a better red day than some of my earlier green days because I followed the process.",
    },
    trades: [
      { date: "2026-07-30", symbol: "AIR27", note: "The entry did not hold, so I took the planned stop. I did not average down or take a revenge trade afterward.", entries: [
        { time: "09:51:00", side: "buy", quantity: "100", price: "3" },
        { time: "09:57:00", side: "sell", quantity: "100", price: "2.8" },
      ] },
    ],
  },
  {
    date: "2026-07-31",
    reviewed: false,
    note: {
      whatWorked: "The trade was patient and I sold into the planned move.",
      whatNeedsWork: "I have not completed the full daily review yet.",
      technicalRecap: "The chart held the planned level and volume expanded after entry.",
      currentFocuses: "Keep waiting for first pullbacks. Respect the 11:00 cutoff and stop after the daily goal. One high-quality trade is enough when the plan is complete.",
      anythingElse: "This day intentionally remains unreviewed for weekly-review coverage testing.",
    },
    trades: [
      { date: "2026-07-31", symbol: "AIR28", note: "Patient entry and planned exit. This note is present, but the day is intentionally not marked reviewed.", entries: [
        { time: "09:45:00", side: "buy", quantity: "100", price: "2.1" },
        { time: "10:04:00", side: "sell", quantity: "100", price: "2.5" },
      ] },
    ],
  },
];

function fixtureEntries(
  date: string,
  symbol: string,
  entries: TradeFixture["entries"],
  tradeIndex: number,
): readonly JournalManualTradeEntry[] {
  return Object.freeze(entries.map((entry, index) => Object.freeze({
    clientRowRef: `ai-${date.replaceAll("-", "")}-${symbol}-${tradeIndex}-${index + 1}`,
    localDate: date,
    localTime: entry.time,
    sourceTimezone: SOURCE_TIMEZONE,
    normalizedSymbol: symbol,
    tradeCurrency: "USD",
    side: entry.side,
    quantityDecimal: entry.quantity,
    priceDecimal: entry.price,
    feesDecimal: null,
  })));
}

function fixtureRoundTripId(
  database: ReturnType<typeof openPlatformDatabase>,
  scope: ReturnType<typeof deriveDevelopmentOwnerJournalScope>["scope"],
  executionIds: readonly string[],
): string {
  const placeholders = executionIds.map(() => "?").join(", ");
  const rows = database.prepare<[string, string, ...string[]], Readonly<{ round_trip_id: string }>>(`SELECT DISTINCT trip.round_trip_id
FROM journal_round_trips AS trip
JOIN journal_round_trip_versions AS version
  ON version.workspace_id = trip.workspace_id
 AND version.account_id = trip.account_id
 AND version.round_trip_version_id = trip.current_version_id
JOIN journal_round_trip_execution_allocations AS allocation
  ON allocation.workspace_id = version.workspace_id
 AND allocation.account_id = version.account_id
 AND allocation.round_trip_version_id = version.round_trip_version_id
JOIN journal_execution_versions AS execution
  ON execution.workspace_id = allocation.workspace_id
 AND execution.account_id = allocation.account_id
 AND execution.execution_version_id = allocation.execution_version_id
WHERE trip.workspace_id = ? AND trip.account_id = ?
  AND execution.execution_id IN (${placeholders})
  AND version.projection_state = 'ready_closed'
ORDER BY trip.round_trip_id`).all(scope.workspaceId, scope.activeAccountId!, ...executionIds);
  if (rows.length !== 1 || !rows[0]) {
    throw new Error("ai_review_fixture_round_trip_resolution_failed");
  }
  return rows[0].round_trip_id;
}

function assertArguments(arguments_: readonly string[]): void {
  if (arguments_.length !== 1 || arguments_[0] !== "--confirm-local-ai-review-fixture") {
    throw new Error("ai_review_fixture_confirmation_required");
  }
  if (process.env.NODE_ENV !== "development") {
    throw new Error("ai_review_fixture_development_only");
  }
}

export function seedAiWeeklyReviewTestFixture(
  arguments_: readonly string[] = process.argv.slice(2),
): Readonly<Record<string, number>> {
  assertArguments(arguments_);
  const repositoryRoot = resolve(fileURLToPath(import.meta.url), "..", "..", "..");
  const local = loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot });
  if (!local.databasePath.endsWith("\\traderlink-platform\\development.sqlite")) {
    throw new Error("ai_review_fixture_database_not_development");
  }

  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const owner = deriveDevelopmentOwnerJournalScope(database);
    const scope = owner.scope;
    const accountScope = narrowWorkspaceAccessToAccount(scope, owner.accountId);
    const journal = createFixtureRuntime(database);
    const annotations = journal.annotations;
    let createdOrMatchedExecutionCount = 0;
    let roundTripNoteCount = 0;
    let dailyNoteCount = 0;
    let currentFocusRevisionCount = 0;
    let reviewedDayCount = 0;
    const fixtureRoundTripIds = new Set<string>();

    const fixtureTrades = WEEKS.flatMap((day) => day.trades.map((trade) => ({ day, trade })));
    const preparedTrades = fixtureTrades.map(({ day, trade }, index) => Object.freeze({
      day,
      trade,
      entries: fixtureEntries(day.date, trade.symbol, trade.entries, index + 1),
    }));
    const entries = preparedTrades.flatMap((item) => item.entries);
    const preview = journal.previews.preview(scope, {
      accountSelectionRef: owner.accountSelectionRef,
      tracker: "quick",
      entries,
    });
    const commit = journal.manualTrades.commit(scope, owner.accountSelectionRef, {
      tracker: "quick",
      expectedAccountSelectionRef: owner.accountSelectionRef,
      idempotencyKey: "ai-review-fixture-two-week-v1",
      entries,
      previewRef: preview.previewRef,
      confirmations: preview.groups.map((group) => Object.freeze({
        groupRef: group.groupRef,
        relationship: group.existingPosition ? "close_tracked_position" as const : "start_new_trade" as const,
        style: "day_trade" as const,
        existingPositionRef: group.existingPosition?.positionRef ?? null,
        completeExecutionSetConfirmed: true,
      })),
    });
    createdOrMatchedExecutionCount += commit.executionIds.length;
    let executionOffset = 0;
    for (const item of preparedTrades) {
      const ids = commit.executionIds.slice(executionOffset, executionOffset + item.entries.length);
      executionOffset += item.entries.length;
      const roundTripId = fixtureRoundTripId(database, scope, ids);
      fixtureRoundTripIds.add(roundTripId);
      if (!annotations.readRoundTripNotes(accountScope, [roundTripId])[roundTripId]) {
        annotations.saveRoundTripNote(accountScope, { roundTripId, expectedRevision: null, technicalNote: "", tradeNote: item.trade.note });
        roundTripNoteCount += 1;
      }
    }

    for (const day of WEEKS) {

      const existingDailyNote = annotations.readDailyNote(accountScope, day.date);
      if (!existingDailyNote) {
        const saved = annotations.saveDailyNote(accountScope, {
          tradingDate: day.date,
          expectedRevision: null,
          whatWorked: day.note.whatWorked,
          whatNeedsWork: day.note.whatNeedsWork,
          technicalRecap: day.note.technicalRecap,
          tomorrowsFocus: day.note.currentFocuses,
          anythingElse: day.note.anythingElse,
        });
        dailyNoteCount += 1;
        if (day.revisedCurrentFocuses) {
          annotations.saveDailyNote(accountScope, {
            tradingDate: day.date,
            expectedRevision: saved.revision,
            whatWorked: day.note.whatWorked,
            whatNeedsWork: day.note.whatNeedsWork,
            technicalRecap: day.note.technicalRecap,
            tomorrowsFocus: day.revisedCurrentFocuses,
            anythingElse: day.note.anythingElse,
          });
          currentFocusRevisionCount += 1;
        }
      }

      if (day.reviewed && !journal.tradingDayReviews.read(accountScope, day.date)) {
        journal.tradingDayReviews.save(accountScope, {
          expectedRevision: null,
          idempotencyKey: `ai-review-fixture-review-${day.date.replaceAll("-", "")}`,
          status: "reviewed",
          tradingDate: day.date,
          userId: scope.userId,
        });
        reviewedDayCount += 1;
      }
    }

    const fixtureRoundTripIdValues = [...fixtureRoundTripIds];
    const placeholders = fixtureRoundTripIdValues.map(() => "?").join(", ");
    const openFixturePositions = database.prepare<[string, string, ...string[]], Readonly<{ count: number }>>(`SELECT COUNT(DISTINCT trip.round_trip_id) AS count
FROM journal_round_trips AS trip
JOIN journal_round_trip_versions AS version
  ON version.workspace_id = trip.workspace_id
 AND version.account_id = trip.account_id
 AND version.round_trip_version_id = trip.current_version_id
WHERE trip.workspace_id = ? AND trip.account_id = ?
  AND trip.round_trip_id IN (${placeholders})
  AND version.projection_state <> 'ready_closed'`).get(
      scope.workspaceId,
      owner.accountId,
      ...fixtureRoundTripIdValues,
    )?.count ?? 0;
    if (openFixturePositions !== 0) {
      throw new Error("ai_review_fixture_open_position_created");
    }

    return Object.freeze({
      days: WEEKS.length,
      executions: createdOrMatchedExecutionCount,
      createdDailyNotes: dailyNoteCount,
      createdFocusRevisions: currentFocusRevisionCount,
      createdReviewedDays: reviewedDayCount,
      createdTradeNotes: roundTripNoteCount,
    });
  } finally {
    database.close();
  }
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  return Boolean(invokedPath) && resolve(invokedPath!).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (isDirectExecution()) {
  try {
    console.info(JSON.stringify(seedAiWeeklyReviewTestFixture()));
  } catch (error) {
    console.error(JSON.stringify({ code: error instanceof Error ? error.message : "ai_review_fixture_failed" }));
    process.exitCode = 1;
  }
}
