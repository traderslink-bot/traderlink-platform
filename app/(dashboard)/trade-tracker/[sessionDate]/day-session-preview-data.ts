import type {
  DaySessionData,
  DaySessionOpenPosition,
  DaySessionRule,
  DaySessionRoundTrip,
  DaySessionTicker,
  DaySessionTradeTag,
} from "./day-session-types";
import type { ExecutionDraft } from "../execution-entry-card";

export type WorkingDayReviewConfiguration = {
  availableTags: DaySessionTradeTag[];
  rules: Array<
    Omit<DaySessionRule, "targetLabel" | "targetRoundTripKey">
  >;
};

const DESIGN_TAGS = [
  { assignmentCount: 1, name: "A setup", revision: "preview-1", tagId: "preview-a-setup" },
  { assignmentCount: 1, name: "Clean exit", revision: "preview-2", tagId: "preview-clean-exit" },
  { assignmentCount: 1, name: "Early entry", revision: "preview-3", tagId: "preview-early-entry" },
  { assignmentCount: 1, name: "Failed breakout", revision: "preview-4", tagId: "preview-failed-breakout" },
  { assignmentCount: 1, name: "First pullback", revision: "preview-5", tagId: "preview-first-pullback" },
  { assignmentCount: 1, name: "Late trade", revision: "preview-6", tagId: "preview-late-trade" },
  { assignmentCount: 1, name: "Opening range", revision: "preview-7", tagId: "preview-opening-range" },
  { assignmentCount: 1, name: "Patient entry", revision: "preview-8", tagId: "preview-patient-entry" },
  { assignmentCount: 1, name: "Rule break", revision: "preview-9", tagId: "preview-rule-break" },
] as const;

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function rounded(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function executionTime(date: string, time: string): string {
  return `${date}T${time.length === 5 ? `${time}:00` : time}-04:00`;
}

function previewFromExecutions(
  date: string,
  executions: ExecutionDraft[],
  reviewConfiguration?: WorkingDayReviewConfiguration,
): DaySessionData {
  const bySymbol = new Map<string, ExecutionDraft[]>();
  for (const execution of executions) {
    const symbol = execution.symbol.trim().toUpperCase();
    bySymbol.set(symbol, [...(bySymbol.get(symbol) ?? []), execution]);
  }

  const tickers: DaySessionTicker[] = [];
  const openPositions: DaySessionOpenPosition[] = [];
  for (const [symbol, unorderedRows] of bySymbol.entries()) {
    const rows = [...unorderedRows].sort((left, right) =>
      left.time.localeCompare(right.time),
    );
    const lots: Array<{
      direction: "long" | "short";
      price: number;
      quantity: number;
    }> = [];
    const roundTrips: DaySessionRoundTrip[] = [];
    let tickerEntryCapital = 0;
    let cycle: {
      direction: "long" | "short";
      entryAt: string;
      entryNotional: number;
      entryQuantity: number;
      exitAt: string;
      exitNotional: number;
      exitQuantity: number;
      fees: number;
      gross: number;
    } | null = null;

    for (const row of rows) {
      const direction = row.side === "BUY" ? "long" : "short";
      const quantity = Number(row.quantity);
      const price = Number(row.price);
      const occurredAt = executionTime(date, row.time);
      let remaining = quantity;

      if (lots.length === 0) {
        cycle = {
          direction,
          entryAt: occurredAt,
          entryNotional: 0,
          entryQuantity: 0,
          exitAt: occurredAt,
          exitNotional: 0,
          exitQuantity: 0,
          fees: 0,
          gross: 0,
        };
      }
      if (lots.length === 0 || lots[0].direction === direction) {
        cycle!.entryNotional += price * remaining;
        cycle!.entryQuantity += remaining;
        cycle!.fees += Number(row.fees || 0);
        lots.push({ direction, price, quantity: remaining });
        continue;
      }

      cycle!.fees += Number(row.fees || 0);
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const matched = Math.min(remaining, lot.quantity);
        cycle!.exitAt = occurredAt;
        cycle!.exitNotional += price * matched;
        cycle!.exitQuantity += matched;
        cycle!.gross +=
          (lot.direction === "long" ? price - lot.price : lot.price - price) *
          matched;
        remaining -= matched;
        lot.quantity -= matched;
        if (lot.quantity === 0) lots.shift();
      }

      if (lots.length === 0 && cycle !== null) {
        const netPnl = cycle.gross - cycle.fees;
        const entryPrice = cycle.entryNotional / cycle.entryQuantity;
        tickerEntryCapital += cycle.entryNotional;
        roundTrips.push({
          direction: cycle.direction,
          entryAt: cycle.entryAt,
          entryPrice: rounded(entryPrice),
          exitAt: cycle.exitAt,
          exitPrice: rounded(cycle.exitNotional / cycle.exitQuantity),
          gainLossPercent:
            cycle.entryNotional > 0
              ? rounded((netPnl / cycle.entryNotional) * 100)
              : null,
          journal: {
            noteRevision: null,
            ruleStatus: "not-reviewed",
            ruleSummary: "Automatic rule evaluation pending",
            tags: [],
            technicalNote: "",
            tradeNote: "",
          },
          netPnl: rounded(netPnl),
          roundTripKey: `design-${symbol.toLowerCase()}-${roundTrips.length + 1}`,
          timezone: "America/New_York",
        });
        cycle = null;
      }

      if (remaining > 0) {
        cycle = {
          direction,
          entryAt: occurredAt,
          entryNotional: price * remaining,
          entryQuantity: remaining,
          exitAt: occurredAt,
          exitNotional: 0,
          exitQuantity: 0,
          fees: 0,
          gross: 0,
        };
        lots.push({ direction, price, quantity: remaining });
      }
    }

    if (roundTrips.length > 0) {
      const tickerPnl = roundTrips.reduce(
        (total, trade) => total + Number(trade.netPnl),
        0,
      );
      tickers.push({
        gainLossPercent:
          tickerEntryCapital > 0
            ? rounded((tickerPnl / tickerEntryCapital) * 100)
            : null,
        netPnl: rounded(tickerPnl),
        roundTrips,
        stableInstrumentKey: `design-${symbol.toLowerCase()}`,
        symbol,
      });
    }

    if (lots.length > 0 && cycle !== null) {
      const remainingQuantity = lots.reduce(
        (total, lot) => total + lot.quantity,
        0,
      );
      const remainingNotional = lots.reduce(
        (total, lot) => total + lot.quantity * lot.price,
        0,
      );
      openPositions.push({
        averageEntryPrice: rounded(remainingNotional / remainingQuantity),
        direction: lots[0].direction,
        openedAt: cycle.entryAt,
        positionKey: `design-open-${symbol.toLowerCase()}`,
        remainingQuantity: rounded(remainingQuantity),
        stableInstrumentKey: `design-${symbol.toLowerCase()}`,
        symbol,
        timezone: "America/New_York",
      });
    }
  }
  const netPnl = rounded(
    tickers.reduce((total, ticker) => total + Number(ticker.netPnl), 0),
  );
  const tradeCount = tickers.reduce(
    (total, ticker) => total + ticker.roundTrips.length,
    0,
  );
  const configuredRules = reviewConfiguration?.rules ?? [];
  const rules: DaySessionRule[] = [
    ...configuredRules
      .filter((rule) => rule.applicability === "day")
      .map((rule) => ({
        ...rule,
        targetLabel: null,
        targetRoundTripKey: null,
      })),
    ...configuredRules
      .filter((rule) => rule.applicability === "trade")
      .flatMap((rule) =>
        tickers.flatMap((ticker) =>
          ticker.roundTrips.map((roundTrip, index) => ({
            ...rule,
            targetLabel: `${ticker.symbol} trade ${index + 1}`,
            targetRoundTripKey: roundTrip.roundTripKey,
          })),
        ),
      ),
  ];

  return {
    availableTags:
      reviewConfiguration?.availableTags ??
      DESIGN_TAGS.map((tag) => ({ ...tag })),
    currency: "USD",
    date,
    decisionActivity: [],
    executionActivity: [],
    dailyNote: {
      anythingElse: "",
      revision: null,
      technicalRecap: "",
      tomorrowsFocus: "",
      whatNeedsWork: "",
      whatWorked: "",
    },
    expectedAccountSelectionRef: "design-preview",
    netPnl,
    needsDecisionCount: 0,
    nextSessionDate: null,
    openPositions,
    positionSnapshots: [],
    previousSessionDate: null,
    rules,
    tickers,
    timezone: "America/New_York",
    week: {
      currentSessionDate: date,
      days: [
        {
          date,
          dailyNote: {
            anythingElse: "",
            revision: null,
            technicalRecap: "",
            tomorrowsFocus: "",
            whatNeedsWork: "",
            whatWorked: "",
          },
          netPnl,
          tickerCount: new Set([
            ...tickers.map((ticker) => ticker.stableInstrumentKey),
            ...openPositions.map((position) => position.stableInstrumentKey),
          ]).size,
          tradeCount,
        },
      ],
      netPnl,
      tickerCount: new Set([
        ...tickers.map((ticker) => ticker.stableInstrumentKey),
        ...openPositions.map((position) => position.stableInstrumentKey),
      ]).size,
      tradeCount,
    },
  };
}

export function getDaySessionDesignPreview(
  date: string,
  executions: ExecutionDraft[] = [],
  reviewConfiguration?: WorkingDayReviewConfiguration,
): DaySessionData {
  if (executions.length > 0) {
    return previewFromExecutions(date, executions, reviewConfiguration);
  }
  const previousTradeDate = shiftDate(date, -1);
  const currentSessionDate = shiftDate(date, 1);

  return {
    availableTags: DESIGN_TAGS.map((tag) => ({ ...tag })),
    currency: "USD",
    date,
    decisionActivity: [],
    executionActivity: [],
    dailyNote: {
      anythingElse: "",
      revision: null,
      technicalRecap: "",
      tomorrowsFocus: "",
      whatNeedsWork: "",
      whatWorked: "",
    },
    expectedAccountSelectionRef: "design-preview",
    netPnl: "842.5",
    needsDecisionCount: 0,
    nextSessionDate: currentSessionDate,
    openPositions: [
      {
        averageEntryPrice: "62.40",
        direction: "long",
        openedAt: `${date}T18:12:00-04:00`,
        positionKey: "preview-open-amd",
        remainingQuantity: "75",
        stableInstrumentKey: "preview_amd",
        symbol: "AMD",
        timezone: "America/New_York",
      },
    ],
    positionSnapshots: [],
    previousSessionDate: previousTradeDate,
    rules: [
      {
        applicability: "day",
        custom: false,
        label: "Maximum daily loss respected",
        revision: null,
        ruleId: "preview-maximum-daily-loss",
        ruleVersion: "preview-1",
        status: "followed",
        targetLabel: null,
        targetRoundTripKey: null,
      },
      {
        applicability: "day",
        custom: true,
        label: "Do not trade after 11:30 AM",
        revision: null,
        ruleId: "preview-cutoff",
        ruleVersion: "preview-1",
        status: "broken",
        targetLabel: null,
        targetRoundTripKey: null,
      },
      {
        applicability: "trade",
        custom: false,
        label: "Wait for entry confirmation",
        revision: null,
        ruleId: "preview-preset-confirmation-followed",
        ruleVersion: "preview-1",
        status: "followed",
        targetLabel: "NVDA 9:42 AM",
        targetRoundTripKey: "preview_nvda_1",
      },
      {
        applicability: "trade",
        custom: false,
        label: "Respect the trading cutoff",
        revision: null,
        ruleId: "preview-preset-cutoff-broken",
        ruleVersion: "preview-1",
        status: "broken",
        targetLabel: "NVDA 1:26 PM",
        targetRoundTripKey: "preview_nvda_3",
      },
      {
        applicability: "trade",
        custom: true,
        label: "Wait for entry confirmation",
        revision: null,
        ruleId: "preview-entry-confirmation",
        ruleVersion: "preview-1",
        status: "broken",
        targetLabel: "NVDA 1:26 PM",
        targetRoundTripKey: "preview_nvda_3",
      },
    ],
    tickers: [
      {
        gainLossPercent: "2.41",
        netPnl: "610",
        stableInstrumentKey: "preview_nvda",
        symbol: "NVDA",
        roundTrips: [
          {
            direction: "long",
            entryAt: `${date}T13:42:00.000Z`,
            entryPrice: "142.20",
            exitAt: `${date}T13:58:00.000Z`,
            exitPrice: "144.04",
            gainLossPercent: "1.29",
            journal: {
              noteRevision: null,
              ruleStatus: "followed",
              ruleSummary: "Waited for confirmation",
              tags: [
                { assignmentCount: 1, name: "Opening range", revision: "preview-7", tagId: "preview-opening-range" },
                { assignmentCount: 1, name: "A setup", revision: "preview-1", tagId: "preview-a-setup" },
              ],
              technicalNote:
                "Entered after the reclaim held. Stop stayed below the failed breakdown.",
              tradeNote: "Stayed patient and followed the planned entry.",
            },
            netPnl: "184",
            roundTripKey: "preview_nvda_1",
            timezone: "America/New_York",
          },
          {
            direction: "long",
            entryAt: `${date}T14:18:00.000Z`,
            entryPrice: "143.10",
            exitAt: `${date}T14:46:00.000Z`,
            exitPrice: "145.72",
            gainLossPercent: "1.83",
            journal: {
              noteRevision: null,
              ruleStatus: "followed",
              ruleSummary: "Position size within plan",
              tags: [
                { assignmentCount: 1, name: "First pullback", revision: "preview-5", tagId: "preview-first-pullback" },
                { assignmentCount: 1, name: "Patient entry", revision: "preview-8", tagId: "preview-patient-entry" },
              ],
              technicalNote:
                "Added only after the higher low formed and reduced into strength.",
              tradeNote: "Good continuation trade with controlled adds.",
            },
            netPnl: "348",
            roundTripKey: "preview_nvda_2",
            timezone: "America/New_York",
          },
          {
            direction: "long",
            entryAt: `${date}T17:26:00.000Z`,
            entryPrice: "145.60",
            exitAt: `${date}T17:39:00.000Z`,
            exitPrice: "146.41",
            gainLossPercent: "0.56",
            journal: {
              noteRevision: null,
              ruleStatus: "broken",
              ruleSummary: "Traded after the personal cutoff",
              tags: [
                { assignmentCount: 1, name: "Late trade", revision: "preview-6", tagId: "preview-late-trade" },
              ],
              technicalNote:
                "The setup worked, but this trade was outside the planned trading window.",
              tradeNote: "The late entry was outside the intended daily process.",
            },
            netPnl: "78",
            roundTripKey: "preview_nvda_3",
            timezone: "America/New_York",
          },
        ],
      },
      {
        gainLossPercent: "1.18",
        netPnl: "232.5",
        stableInstrumentKey: "preview_tsla",
        symbol: "TSLA",
        roundTrips: [
          {
            direction: "short",
            entryAt: `${date}T14:06:00.000Z`,
            entryPrice: "318.40",
            exitAt: `${date}T14:24:00.000Z`,
            exitPrice: "314.82",
            gainLossPercent: "1.12",
            journal: {
              noteRevision: null,
              ruleStatus: "followed",
              ruleSummary: "Risk defined before entry",
              tags: [
                { assignmentCount: 1, name: "Failed breakout", revision: "preview-4", tagId: "preview-failed-breakout" },
                { assignmentCount: 1, name: "Clean exit", revision: "preview-2", tagId: "preview-clean-exit" },
              ],
              technicalNote:
                "Entry followed the failed push. Covered at the planned support area.",
              tradeNote: "Clear thesis and disciplined cover.",
            },
            netPnl: "286.5",
            roundTripKey: "preview_tsla_1",
            timezone: "America/New_York",
          },
          {
            direction: "short",
            entryAt: `${date}T15:51:00.000Z`,
            entryPrice: "316.20",
            exitAt: `${date}T16:09:00.000Z`,
            exitPrice: "316.88",
            gainLossPercent: "-0.22",
            journal: {
              noteRevision: null,
              ruleStatus: "broken",
              ruleSummary: "Entered before confirmation",
              tags: [
                { assignmentCount: 1, name: "Early entry", revision: "preview-3", tagId: "preview-early-entry" },
                { assignmentCount: 1, name: "Rule break", revision: "preview-9", tagId: "preview-rule-break" },
              ],
              technicalNote:
                "Anticipated the rejection instead of waiting for price to confirm it.",
              tradeNote: "Entered too early and did not wait for confirmation.",
            },
            netPnl: "-54",
            roundTripKey: "preview_tsla_2",
            timezone: "America/New_York",
          },
        ],
      },
    ],
    timezone: "America/New_York",
    week: {
      currentSessionDate,
      days: [
        {
          date: previousTradeDate,
          dailyNote: {
            anythingElse: "",
            revision: null,
            technicalRecap: "",
            tomorrowsFocus: "",
            whatNeedsWork: "",
            whatWorked: "",
          },
          netPnl: "-126",
          tickerCount: 1,
          tradeCount: 2,
        },
        {
          date,
          dailyNote: {
            anythingElse: "",
            revision: null,
            technicalRecap: "",
            tomorrowsFocus: "",
            whatNeedsWork: "",
            whatWorked: "",
          },
          netPnl: "842.5",
          tickerCount: 3,
          tradeCount: 5,
        },
        {
          date: currentSessionDate,
          dailyNote: {
            anythingElse: "",
            revision: null,
            technicalRecap: "",
            tomorrowsFocus: "",
            whatNeedsWork: "",
            whatWorked: "",
          },
          netPnl: "318",
          tickerCount: 2,
          tradeCount: 3,
        },
      ],
      netPnl: "1034.5",
      tickerCount: 6,
      tradeCount: 10,
    },
  };
}
