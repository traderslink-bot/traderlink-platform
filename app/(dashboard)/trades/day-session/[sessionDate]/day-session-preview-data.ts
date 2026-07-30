import type { DaySessionData } from "./day-session-types";

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function getDaySessionDesignPreview(date: string): DaySessionData {
  const previousTradeDate = shiftDate(date, -1);
  const currentSessionDate = shiftDate(date, 1);

  return {
    currency: "USD",
    date,
    netPnl: 842.5,
    rules: [
      {
        applicability: "day",
        custom: false,
        label: "Maximum daily loss respected",
        status: "followed",
      },
      {
        applicability: "day",
        custom: true,
        label: "Do not trade after 11:30 AM",
        status: "broken",
      },
      {
        applicability: "trade",
        custom: true,
        label: "Wait for entry confirmation",
        status: "broken",
      },
    ],
    tickers: [
      {
        netPnl: 610,
        stableInstrumentKey: "preview_nvda",
        symbol: "NVDA",
        roundTrips: [
          {
            direction: "long",
            entryAt: `${date}T13:42:00.000Z`,
            exitAt: `${date}T13:58:00.000Z`,
            journal: {
              ruleStatus: "followed",
              ruleSummary: "Waited for confirmation",
              tags: ["Opening range", "A setup"],
              technicalNote:
                "Entered after the reclaim held. Stop stayed below the failed breakdown.",
            },
            netPnl: 184,
            roundTripKey: "preview_nvda_1",
            timezone: "America/New_York",
          },
          {
            direction: "long",
            entryAt: `${date}T14:18:00.000Z`,
            exitAt: `${date}T14:46:00.000Z`,
            journal: {
              ruleStatus: "followed",
              ruleSummary: "Position size within plan",
              tags: ["First pullback", "Patient entry"],
              technicalNote:
                "Added only after the higher low formed and reduced into strength.",
            },
            netPnl: 348,
            roundTripKey: "preview_nvda_2",
            timezone: "America/New_York",
          },
          {
            direction: "long",
            entryAt: `${date}T17:26:00.000Z`,
            exitAt: `${date}T17:39:00.000Z`,
            journal: {
              ruleStatus: "broken",
              ruleSummary: "Traded after the personal cutoff",
              tags: ["Late trade"],
              technicalNote:
                "The setup worked, but this trade was outside the planned trading window.",
            },
            netPnl: 78,
            roundTripKey: "preview_nvda_3",
            timezone: "America/New_York",
          },
        ],
      },
      {
        netPnl: 232.5,
        stableInstrumentKey: "preview_tsla",
        symbol: "TSLA",
        roundTrips: [
          {
            direction: "short",
            entryAt: `${date}T14:06:00.000Z`,
            exitAt: `${date}T14:24:00.000Z`,
            journal: {
              ruleStatus: "followed",
              ruleSummary: "Risk defined before entry",
              tags: ["Failed breakout", "Clean exit"],
              technicalNote:
                "Entry followed the failed push. Covered at the planned support area.",
            },
            netPnl: 286.5,
            roundTripKey: "preview_tsla_1",
            timezone: "America/New_York",
          },
          {
            direction: "short",
            entryAt: `${date}T15:51:00.000Z`,
            exitAt: `${date}T16:09:00.000Z`,
            journal: {
              ruleStatus: "broken",
              ruleSummary: "Entered before confirmation",
              tags: ["Early entry", "Rule break"],
              technicalNote:
                "Anticipated the rejection instead of waiting for price to confirm it.",
            },
            netPnl: -54,
            roundTripKey: "preview_tsla_2",
            timezone: "America/New_York",
          },
        ],
      },
    ],
    week: {
      currentSessionDate,
      days: [
        {
          date: previousTradeDate,
          netPnl: -126,
          tickerCount: 1,
          tradeCount: 2,
        },
        {
          date,
          netPnl: 842.5,
          tickerCount: 2,
          tradeCount: 5,
        },
        {
          date: currentSessionDate,
          netPnl: 318,
          tickerCount: 2,
          tradeCount: 3,
        },
      ],
      netPnl: 1034.5,
      tickerCount: 5,
      tradeCount: 10,
    },
  };
}
