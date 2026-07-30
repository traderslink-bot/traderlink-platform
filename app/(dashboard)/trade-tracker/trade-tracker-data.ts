import "server-only";

import { resolveAnalyticsLabRuntime } from "../analytics/lab/lab-runtime";
import type { AnalyticalRow } from "../../../src/lib/trader-intelligence-v3/analytics/dataset/analytical-row";
import { sumExactDecimals } from "../../../src/lib/trader-intelligence-v3/analytics/tools/weekday";
import type { TraderIntelligenceOwnerContext } from "../../../src/lib/trader-intelligence-v3/domain";
import {
  EXACT_RATIO_ROUNDING_POLICY_VERSION,
  GENERAL_EXACT_DECIMAL_BOUNDS,
  addExactDecimals,
  createExactRatio,
  ratioToExactDecimal,
  subtractExactDecimals,
  validateExactDecimal,
} from "../../../src/lib/trader-intelligence-v3/domain/exact";
import { SqliteDaySessionJournalRepository } from "../../../src/lib/trader-intelligence-day-session-journal";
import { readTradingRulesDashboard } from "../../../src/lib/trader-intelligence-rules";
import {
  readTradeTagCatalog,
  readTradeTagsByRoundTripKeys,
} from "../../../src/lib/trader-intelligence-tags";

import type {
  DaySessionData,
  DaySessionTicker,
  DaySessionWeekDay,
} from "./[sessionDate]/day-session-types";

type GovernedTradeRows = {
  currency: string;
  rows: readonly AnalyticalRow[];
};

function exactSum(values: readonly string[]): string {
  const result = sumExactDecimals(values);
  if (!result.ok) {
    throw new Error("Trade Tracker received an invalid exact-decimal value.");
  }
  return result.value;
}

function exactArithmetic(
  left: string,
  right: string,
  operation: "add" | "subtract",
): string | null {
  const parsedLeft = validateExactDecimal(left, GENERAL_EXACT_DECIMAL_BOUNDS);
  const parsedRight = validateExactDecimal(right, GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!parsedLeft.ok || !parsedRight.ok) return null;
  const result =
    operation === "add"
      ? addExactDecimals(parsedLeft.value, parsedRight.value)
      : subtractExactDecimals(parsedLeft.value, parsedRight.value);
  return result.ok ? result.value : null;
}

function exactDivision(
  numerator: string,
  denominator: string,
  scale: number,
  percentage = false,
): string | null {
  const ratio = createExactRatio(numerator, denominator);
  if (!ratio.ok || ratio.value.numerator === "0" && denominator === "0") {
    return null;
  }
  if (BigInt(ratio.value.denominator) === BigInt(0)) return null;
  const scaled = percentage
    ? createExactRatio(
        (BigInt(ratio.value.numerator) * BigInt(100)).toString(),
        ratio.value.denominator,
      )
    : ratio;
  if (!scaled.ok) return null;
  const decimal = ratioToExactDecimal(scaled.value, {
    bounds: GENERAL_EXACT_DECIMAL_BOUNDS,
    scale,
    version: EXACT_RATIO_ROUNDING_POLICY_VERSION,
  });
  return decimal.ok ? decimal.value : null;
}

function roundTripPrices(row: AnalyticalRow): {
  entryPrice: string | null;
  exitPrice: string | null;
  gainLossPercent: string | null;
} {
  if (
    row.entryNotional.state !== "available" ||
    row.shareQuantity.state !== "available"
  ) {
    return { entryPrice: null, exitPrice: null, gainLossPercent: null };
  }
  const exitNotional = exactArithmetic(
    row.entryNotional.amount,
    row.grossPnl,
    row.direction === "long" ? "add" : "subtract",
  );
  return {
    entryPrice: exactDivision(
      row.entryNotional.amount,
      row.shareQuantity.quantity,
      4,
    ),
    exitPrice:
      exitNotional === null
        ? null
        : exactDivision(exitNotional, row.shareQuantity.quantity, 4),
    gainLossPercent: exactDivision(
      row.netPnl,
      row.entryNotional.amount,
      2,
      true,
    ),
  };
}

function weekBounds(sessionDate: string): { end: string; start: string } {
  const selected = new Date(`${sessionDate}T12:00:00.000Z`);
  const weekday = selected.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const start = new Date(selected);
  start.setUTCDate(selected.getUTCDate() - daysFromMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    end: end.toISOString().slice(0, 10),
    start: start.toISOString().slice(0, 10),
  };
}

export async function readGovernedTradeRows(): Promise<GovernedTradeRows | null> {
  try {
    const runtime = await resolveAnalyticsLabRuntime();
    if (runtime.dataMode !== "persisted") return null;
    const verified = runtime.source.readVerifiedDataset();
    if (!verified.ok) return null;
    const rows = verified.value.datasetReceipt.rows;
    if (rows.length === 0) return null;
    const currencies = [...new Set(rows.map((row) => row.currency))];
    if (currencies.length !== 1 || currencies[0] !== runtime.currency) {
      return null;
    }
    return { currency: runtime.currency, rows };
  } catch {
    return null;
  }
}

function sortedTradedDates(rows: readonly AnalyticalRow[]): string[] {
  return [...new Set(rows.map((row) => row.sessionDate))].sort();
}

export async function getLatestGovernedSessionDate(): Promise<string | null> {
  const governed = await readGovernedTradeRows();
  return governed ? (sortedTradedDates(governed.rows).at(-1) ?? null) : null;
}

export async function getGovernedDaySession(
  sessionDate: string,
  owner?: TraderIntelligenceOwnerContext,
): Promise<DaySessionData | null> {
  const governed = await readGovernedTradeRows();
  if (!governed) return null;

  const allDates = sortedTradedDates(governed.rows);
  const selectedIndex = allDates.indexOf(sessionDate);
  if (selectedIndex === -1) return null;

  const dayRows = governed.rows.filter(
    (row) => row.sessionDate === sessionDate,
  );
  const tagsByRoundTrip = owner
    ? readTradeTagsByRoundTripKeys(owner, dayRows)
    : {};
  const availableTags = owner ? readTradeTagCatalog(owner) : [];
  const journalOwner = owner
    ? {
        userId: owner.identity.ownerId,
        workspaceId: "primary-workspace",
      }
    : null;
  const journal = journalOwner
    ? new SqliteDaySessionJournalRepository()
    : null;
  const savedNote = journal?.readNote(journalOwner!, sessionDate) ?? null;
  const savedReviews =
    journal?.readRuleReviews(journalOwner!, sessionDate) ?? [];
  journal?.close();
  const byTicker = new Map<string, AnalyticalRow[]>();
  for (const row of dayRows) {
    const current = byTicker.get(row.stableInstrumentKey) ?? [];
    current.push(row);
    byTicker.set(row.stableInstrumentKey, current);
  }
  const tickers: DaySessionTicker[] = [...byTicker.entries()]
    .map(([stableInstrumentKey, rows]) => ({
      gainLossPercent: rows.every(
        (row) => row.entryNotional.state === "available",
      )
        ? exactDivision(
            exactSum(rows.map((row) => row.netPnl)),
            exactSum(
              rows.map((row) =>
                row.entryNotional.state === "available"
                  ? row.entryNotional.amount
                  : "0",
              ),
            ),
            2,
            true,
          )
        : null,
      stableInstrumentKey,
      symbol: rows[0].displayedSymbol,
      netPnl: exactSum(rows.map((row) => row.netPnl)),
      roundTrips: [...rows]
        .sort((left, right) => left.firstEntryAt.localeCompare(right.firstEntryAt))
        .map((row) => ({
          direction: row.direction,
          entryAt: row.firstEntryAt,
          ...roundTripPrices(row),
          exitAt: row.finalExitAt,
          journal: {
            ruleStatus: "not-reviewed" as const,
            ruleSummary: "No rule review recorded",
            tags: (tagsByRoundTrip[row.semanticRoundTripKey] ?? []).map((tag) => ({
              assignmentCount: tag.assignmentCount,
              name: tag.name,
              revision: tag.revision,
              tagId: tag.tagId,
            })),
            technicalNote: "No technical note added.",
          },
          netPnl: row.netPnl,
          roundTripKey: row.semanticRoundTripKey,
          timezone: row.timezone,
        })),
    }))
    .sort((left, right) => left.symbol.localeCompare(right.symbol));

  const bounds = weekBounds(sessionDate);
  const weekRows = governed.rows.filter(
    (row) =>
      row.sessionDate >= bounds.start && row.sessionDate <= bounds.end,
  );
  const weekDates = sortedTradedDates(weekRows);
  const weekDays: DaySessionWeekDay[] = weekDates.map((date) => {
    const rows = weekRows.filter((row) => row.sessionDate === date);
    return {
      date,
      netPnl: exactSum(rows.map((row) => row.netPnl)),
      tickerCount: new Set(rows.map((row) => row.stableInstrumentKey)).size,
      tradeCount: rows.length,
    };
  });
  const ruleDefinitions = owner ? readTradingRulesDashboard(owner) : null;
  const reviewMap = new Map(
    savedReviews.map((review) => [
      `${review.ruleId}:${review.targetRoundTripKey ?? ""}`,
      review,
    ]),
  );
  const dayRules = [
    ...(ruleDefinitions?.packet.rules
      .filter((rule) => rule.status === "active")
      .map((rule) => ({
        applicability: "day" as const,
        custom: false,
        label: rule.template.label,
        ruleId: rule.ruleInstanceId,
        ruleVersion: rule.currentVersion.versionOrdinal,
        targetLabel: null,
        targetRoundTripKey: null,
      })) ?? []),
    ...(ruleDefinitions?.manualRules
      .filter(
        (rule) =>
          rule.status === "active" &&
          (rule.reviewScope === "day_session" || rule.reviewScope === "both"),
      )
      .map((rule) => ({
        applicability: "day" as const,
        custom: true,
        label: rule.title,
        ruleId: rule.ruleId,
        ruleVersion: rule.versionOrdinal,
        targetLabel: null,
        targetRoundTripKey: null,
      })) ?? []),
  ];
  const tradeRules =
    ruleDefinitions?.manualRules
      .filter(
        (rule) =>
          rule.status === "active" &&
          (rule.reviewScope === "trade" || rule.reviewScope === "both"),
      )
      .flatMap((rule) =>
        dayRows.map((row) => ({
          applicability: "trade" as const,
          custom: true,
          label: rule.title,
          ruleId: rule.ruleId,
          ruleVersion: rule.versionOrdinal,
          targetLabel: `${row.displayedSymbol} completed trade`,
          targetRoundTripKey: row.semanticRoundTripKey,
        })),
      ) ?? [];
  const rules = [...dayRules, ...tradeRules].map((definition) => {
    const review = reviewMap.get(
      `${definition.ruleId}:${definition.targetRoundTripKey ?? ""}`,
    );
    return {
      ...definition,
      revision: review?.revision ?? null,
      status: review?.status ?? ("not-reviewed" as const),
    };
  });

  return {
    availableTags: availableTags.map((tag) => ({
      assignmentCount: tag.assignmentCount,
      name: tag.name,
      revision: tag.revision,
      tagId: tag.tagId,
    })),
    currency: governed.currency,
    date: sessionDate,
    dailyNote: savedNote
      ? {
          anythingElse: savedNote.anythingElse,
          revision: savedNote.revision,
          technicalRecap: savedNote.technicalRecap,
          tomorrowsFocus: savedNote.tomorrowsFocus,
          whatNeedsWork: savedNote.whatNeedsWork,
          whatWorked: savedNote.whatWorked,
        }
      : {
          anythingElse: "",
          revision: null,
          technicalRecap: "",
          tomorrowsFocus: "",
          whatNeedsWork: "",
          whatWorked: "",
        },
    netPnl: exactSum(dayRows.map((row) => row.netPnl)),
    nextSessionDate: allDates[selectedIndex + 1] ?? null,
    previousSessionDate: allDates[selectedIndex - 1] ?? null,
    rules,
    tickers,
    week: {
      currentSessionDate: allDates.at(-1) ?? sessionDate,
      days: weekDays,
      netPnl: exactSum(weekRows.map((row) => row.netPnl)),
      tickerCount: new Set(
        weekRows.map((row) => row.stableInstrumentKey),
      ).size,
      tradeCount: weekRows.length,
    },
  };
}

export async function getGovernedTradeTagTarget(
  sessionDate: string,
  semanticRoundTripKey: string,
): Promise<Pick<
  AnalyticalRow,
  "canonicalAccountKey" | "semanticRoundTripKey" | "sessionDate"
> | null> {
  const governed = await readGovernedTradeRows();
  if (!governed) return null;
  const row = governed.rows.find(
    (candidate) =>
      candidate.sessionDate === sessionDate &&
      candidate.semanticRoundTripKey === semanticRoundTripKey,
  );
  return row
    ? {
        canonicalAccountKey: row.canonicalAccountKey,
        semanticRoundTripKey: row.semanticRoundTripKey,
        sessionDate: row.sessionDate,
      }
    : null;
}
