import type {
  DaySessionData,
  DaySessionDailyNote,
  DaySessionExecutionActivity,
  DaySessionTradeJournal,
  DaySessionTradeTag,
} from "@/app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";
import type { PlatformOfflineCoverageFact } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

export const JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION =
  "journal-daily-tracker-v1" as const;

export function journalDailyTrackerOfflineViewKey(date: string): string {
  return `journal:daily-tracker:${date}`;
}

export type JournalDailyTrackerOfflineViewModel = Readonly<{
  data: DaySessionData;
  version: 1;
}>;

function localKey(kind: string, index: number): string {
  return `offline-${kind}-${index}`;
}

function sanitizeTag(
  tag: DaySessionTradeTag,
  tagIndex: number,
): DaySessionTradeTag {
  return {
    assignmentCount: tag.assignmentCount,
    category: tag.category,
    name: tag.name,
    presetKey: tag.presetKey,
    revision: "offline",
    tagId: localKey("tag", tagIndex),
  };
}

function sanitizeJournal(
  journal: DaySessionTradeJournal,
  journalIndex: number,
): DaySessionTradeJournal {
  return {
    noteRevision: null,
    ruleStatus: journal.ruleStatus,
    ruleSummary: journal.ruleSummary,
    tags: journal.tags.map((tag, tagIndex) =>
      sanitizeTag(tag, journalIndex * 1_000 + tagIndex)),
    technicalNote: journal.technicalNote,
    tradeNote: journal.tradeNote,
  };
}

function sanitizeDailyNote(note: DaySessionDailyNote): DaySessionDailyNote {
  return {
    anythingElse: note.anythingElse,
    revision: null,
    technicalRecap: note.technicalRecap,
    tomorrowsFocus: note.tomorrowsFocus,
    whatNeedsWork: note.whatNeedsWork,
    whatWorked: note.whatWorked,
  };
}

function sanitizeExecution(
  execution: DaySessionExecutionActivity,
  executionIndex: number,
  roundTripKeys: ReadonlyMap<string, string>,
): DaySessionExecutionActivity {
  return {
    executedAt: execution.executedAt,
    executionKey: localKey("execution", executionIndex),
    manualEdit: null,
    needsDecision: execution.needsDecision,
    price: execution.price,
    quantity: execution.quantity,
    roundTripKeys: execution.roundTripKeys.flatMap((key) => {
      const local = roundTripKeys.get(key);
      return local ? [local] : [];
    }),
    side: execution.side,
    symbol: execution.symbol,
  };
}

export function createJournalDailyTrackerOfflineViewModel(
  source: DaySessionData,
): JournalDailyTrackerOfflineViewModel {
  const roundTripKeys = new Map<string, string>();
  let roundTripIndex = 0;
  for (const ticker of source.tickers) {
    for (const roundTrip of ticker.roundTrips) {
      roundTripKeys.set(roundTrip.roundTripKey, localKey("trade", roundTripIndex));
      roundTripIndex += 1;
    }
  }
  for (const position of source.openPositions) {
    roundTripKeys.set(position.positionKey, localKey("open-position", roundTripIndex));
    roundTripIndex += 1;
  }

  const tickers = source.tickers.map((ticker, tickerIndex) => ({
    gainLossPercent: ticker.gainLossPercent,
    netPnl: ticker.netPnl,
    roundTrips: ticker.roundTrips.map((roundTrip, index) => ({
      analyzer: null,
      direction: roundTrip.direction,
      entryAt: roundTrip.entryAt,
      entryPrice: roundTrip.entryPrice,
      exitAt: roundTrip.exitAt,
      exitPrice: roundTrip.exitPrice,
      gainLossPercent: roundTrip.gainLossPercent,
      journal: sanitizeJournal(roundTrip.journal, tickerIndex * 1_000 + index),
      netPnl: roundTrip.netPnl,
      roundTripKey: roundTripKeys.get(roundTrip.roundTripKey)!,
      timezone: roundTrip.timezone,
    })),
    stableInstrumentKey: localKey("instrument", tickerIndex),
    symbol: ticker.symbol,
  }));

  const executionActivity = source.executionActivity.map((execution, index) =>
    sanitizeExecution(execution, index, roundTripKeys));
  const rules = source.rules.map((rule, index) => ({
    applicability: rule.applicability,
    custom: rule.custom,
    evidence: rule.evidence ? {
      feeCoverage: rule.evidence.feeCoverage,
      limitation: rule.evidence.limitation,
      trigger: rule.evidence.trigger ? {
        ...rule.evidence.trigger,
        roundTripKey: roundTripKeys.get(rule.evidence.trigger.roundTripKey) ?? "offline-trade",
      } : null,
      violations: rule.evidence.violations.map((violation) => ({
        ...violation,
        roundTripKey: roundTripKeys.get(violation.roundTripKey) ?? "offline-trade",
      })),
    } : null,
    label: rule.label,
    note: rule.note,
    revision: null,
    ruleId: localKey("rule", index),
    ruleVersion: "offline",
    status: rule.status,
    targetLabel: rule.targetLabel,
    targetRoundTripKey: rule.targetRoundTripKey
      ? roundTripKeys.get(rule.targetRoundTripKey) ?? null
      : null,
  }));

  const data: DaySessionData = {
    availableSessionDates: [...source.availableSessionDates],
    availableTags: [],
    currency: source.currency,
    dailyNote: sanitizeDailyNote(source.dailyNote),
    date: source.date,
    decisionActivity: source.decisionActivity.map((decision, index) => ({
      direction: decision.direction,
      executionCount: decision.executionCount,
      openedAt: decision.openedAt,
      reasonCodes: [],
      roundTripKey: roundTripKeys.get(decision.roundTripKey) ?? localKey("decision", index),
      symbol: decision.symbol,
    })),
    executionActivity,
    expectedAccountSelectionRef: "",
    factSetRevisionSha256: "offline-saved-view-v1",
    needsDecisionCount: source.needsDecisionCount,
    netPnl: source.netPnl,
    nextSessionDate: source.nextSessionDate,
    openPositions: source.openPositions.map((position, index) => {
      const positionKey = roundTripKeys.get(position.positionKey) ?? localKey("open-position", index);
      return {
        averageEntryPrice: position.averageEntryPrice,
        direction: position.direction,
        executions: position.executions.map((execution, executionIndex) =>
          sanitizeExecution(execution, executionActivity.length + index * 1_000 + executionIndex, roundTripKeys)),
        journal: sanitizeJournal(position.journal, 100_000 + index),
        openedAt: position.openedAt,
        positionKey,
        positionRef: null,
        remainingQuantity: position.remainingQuantity,
        stableInstrumentKey: localKey("open-instrument", index),
        style: position.style ? {
          ...position.style,
          positionRef: positionKey,
          revision: 0,
        } : null,
        symbol: position.symbol,
        timezone: position.timezone,
      };
    }),
    positionSnapshots: source.positionSnapshots.map((position, index) => ({
      ...position,
      positionKey: roundTripKeys.get(position.positionKey) ?? localKey("snapshot", index),
    })),
    previousSessionDate: source.previousSessionDate,
    review: {
      revision: null,
      status: source.review.status,
      unclassifiedOpenPositionCount: source.review.unclassifiedOpenPositionCount,
      updatedAtUtc: source.review.updatedAtUtc,
    },
    rules,
    tickers,
    timezone: source.timezone,
    week: {
      currentSessionDate: source.week.currentSessionDate,
      days: source.week.days.map((day) => ({
        ...day,
        dailyNote: sanitizeDailyNote(day.dailyNote),
      })),
      netPnl: source.week.netPnl,
      tickerCount: source.week.tickerCount,
      tradeCount: source.week.tradeCount,
    },
  };
  return Object.freeze({ data: Object.freeze(data), version: 1 });
}

export function journalDailyTrackerOfflineCoverage(): readonly PlatformOfflineCoverageFact[] {
  return Object.freeze([Object.freeze({
    key: "daily_tracker",
    label: "Daily Trade Tracker",
    reason: null,
    status: "available",
  }), Object.freeze({
    key: "daily_notes_rules_review",
    label: "Saved Daily notes, rules and review",
    reason: null,
    status: "available",
  }), Object.freeze({
    key: "daily_analyzer",
    label: "Trade Analyzer candles",
    reason: "Reconnect to load Trade Analyzer charts and market data.",
    status: "unavailable",
  }), Object.freeze({
    key: "daily_mutations",
    label: "Daily Tracker changes",
    reason: "Offline trade entry is available. Reconnect to change saved notes, rules, tags, reviews or executions.",
    status: "unavailable",
  })]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDailyNote(value: unknown): boolean {
  return isRecord(value) &&
    ["anythingElse", "technicalRecap", "tomorrowsFocus", "whatNeedsWork", "whatWorked"]
      .every((key) => typeof value[key] === "string");
}

function isJournal(value: unknown): boolean {
  return isRecord(value) && typeof value.tradeNote === "string" &&
    typeof value.technicalNote === "string" && Array.isArray(value.tags) &&
    value.tags.length <= 500 && value.tags.every((tag) =>
      isRecord(tag) && typeof tag.name === "string" && typeof tag.tagId === "string");
}

export function isJournalDailyTrackerOfflineViewModel(
  value: unknown,
): value is JournalDailyTrackerOfflineViewModel {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.data)) return false;
  const data = value.data;
  return /^\d{4}-\d{2}-\d{2}$/u.test(String(data.date)) &&
    /^[A-Z]{3}$/u.test(String(data.currency)) && typeof data.timezone === "string" &&
    isDailyNote(data.dailyNote) && Array.isArray(data.tickers) && data.tickers.length <= 1_000 &&
    data.tickers.every((ticker) => isRecord(ticker) && typeof ticker.symbol === "string" &&
      Array.isArray(ticker.roundTrips) && ticker.roundTrips.length <= 5_000 &&
      ticker.roundTrips.every((trade) => isRecord(trade) && typeof trade.roundTripKey === "string" &&
        trade.analyzer === null && isJournal(trade.journal))) &&
    Array.isArray(data.executionActivity) && data.executionActivity.length <= 10_000 &&
    Array.isArray(data.openPositions) && data.openPositions.length <= 5_000 &&
    data.openPositions.every((position) => isRecord(position) &&
      typeof position.positionKey === "string" && position.positionRef === null &&
      Array.isArray(position.executions) && isJournal(position.journal)) &&
    Array.isArray(data.rules) && data.rules.length <= 5_000 &&
    Array.isArray(data.availableSessionDates) && data.availableSessionDates.length <= 10_000 &&
    isRecord(data.week) && Array.isArray(data.week.days) && data.week.days.length <= 31 &&
    isRecord(data.review);
}
