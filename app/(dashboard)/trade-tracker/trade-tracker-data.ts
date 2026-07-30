import "server-only";

import { resolveAnalyticsLabRuntime } from "../analytics/lab/lab-runtime";
import type { AnalyticalRow } from "../../../src/lib/trader-intelligence-v3/analytics/dataset/analytical-row";
import { sumExactDecimals } from "../../../src/lib/trader-intelligence-v3/analytics/tools/weekday";

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

async function readGovernedTradeRows(): Promise<GovernedTradeRows | null> {
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
): Promise<DaySessionData | null> {
  const governed = await readGovernedTradeRows();
  if (!governed) return null;

  const allDates = sortedTradedDates(governed.rows);
  const selectedIndex = allDates.indexOf(sessionDate);
  if (selectedIndex === -1) return null;

  const dayRows = governed.rows.filter(
    (row) => row.sessionDate === sessionDate,
  );
  const byTicker = new Map<string, AnalyticalRow[]>();
  for (const row of dayRows) {
    const current = byTicker.get(row.stableInstrumentKey) ?? [];
    current.push(row);
    byTicker.set(row.stableInstrumentKey, current);
  }
  const tickers: DaySessionTicker[] = [...byTicker.entries()]
    .map(([stableInstrumentKey, rows]) => ({
      stableInstrumentKey,
      symbol: rows[0].displayedSymbol,
      netPnl: exactSum(rows.map((row) => row.netPnl)),
      roundTrips: [...rows]
        .sort((left, right) => left.firstEntryAt.localeCompare(right.firstEntryAt))
        .map((row) => ({
          direction: row.direction,
          entryAt: row.firstEntryAt,
          exitAt: row.finalExitAt,
          journal: {
            ruleStatus: "not-reviewed" as const,
            ruleSummary: "No rule review recorded",
            tags: [],
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

  return {
    currency: governed.currency,
    date: sessionDate,
    netPnl: exactSum(dayRows.map((row) => row.netPnl)),
    nextSessionDate: allDates[selectedIndex + 1] ?? null,
    previousSessionDate: allDates[selectedIndex - 1] ?? null,
    rules: [],
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
