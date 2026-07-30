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
    availableTags: [
      { assignmentCount: 1, name: "A setup", revision: "preview-1", tagId: "preview-a-setup" },
      { assignmentCount: 1, name: "Clean exit", revision: "preview-2", tagId: "preview-clean-exit" },
      { assignmentCount: 1, name: "Early entry", revision: "preview-3", tagId: "preview-early-entry" },
      { assignmentCount: 1, name: "Failed breakout", revision: "preview-4", tagId: "preview-failed-breakout" },
      { assignmentCount: 1, name: "First pullback", revision: "preview-5", tagId: "preview-first-pullback" },
      { assignmentCount: 1, name: "Late trade", revision: "preview-6", tagId: "preview-late-trade" },
      { assignmentCount: 1, name: "Opening range", revision: "preview-7", tagId: "preview-opening-range" },
      { assignmentCount: 1, name: "Patient entry", revision: "preview-8", tagId: "preview-patient-entry" },
      { assignmentCount: 1, name: "Rule break", revision: "preview-9", tagId: "preview-rule-break" },
    ],
    currency: "USD",
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
    nextSessionDate: currentSessionDate,
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
              ruleStatus: "followed",
              ruleSummary: "Waited for confirmation",
              tags: [
                { assignmentCount: 1, name: "Opening range", revision: "preview-7", tagId: "preview-opening-range" },
                { assignmentCount: 1, name: "A setup", revision: "preview-1", tagId: "preview-a-setup" },
              ],
              technicalNote:
                "Entered after the reclaim held. Stop stayed below the failed breakdown.",
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
              ruleStatus: "followed",
              ruleSummary: "Position size within plan",
              tags: [
                { assignmentCount: 1, name: "First pullback", revision: "preview-5", tagId: "preview-first-pullback" },
                { assignmentCount: 1, name: "Patient entry", revision: "preview-8", tagId: "preview-patient-entry" },
              ],
              technicalNote:
                "Added only after the higher low formed and reduced into strength.",
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
              ruleStatus: "broken",
              ruleSummary: "Traded after the personal cutoff",
              tags: [
                { assignmentCount: 1, name: "Late trade", revision: "preview-6", tagId: "preview-late-trade" },
              ],
              technicalNote:
                "The setup worked, but this trade was outside the planned trading window.",
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
              ruleStatus: "followed",
              ruleSummary: "Risk defined before entry",
              tags: [
                { assignmentCount: 1, name: "Failed breakout", revision: "preview-4", tagId: "preview-failed-breakout" },
                { assignmentCount: 1, name: "Clean exit", revision: "preview-2", tagId: "preview-clean-exit" },
              ],
              technicalNote:
                "Entry followed the failed push. Covered at the planned support area.",
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
              ruleStatus: "broken",
              ruleSummary: "Entered before confirmation",
              tags: [
                { assignmentCount: 1, name: "Early entry", revision: "preview-3", tagId: "preview-early-entry" },
                { assignmentCount: 1, name: "Rule break", revision: "preview-9", tagId: "preview-rule-break" },
              ],
              technicalNote:
                "Anticipated the rejection instead of waiting for price to confirm it.",
            },
            netPnl: "-54",
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
          netPnl: "-126",
          tickerCount: 1,
          tradeCount: 2,
        },
        {
          date,
          netPnl: "842.5",
          tickerCount: 2,
          tradeCount: 5,
        },
        {
          date: currentSessionDate,
          netPnl: "318",
          tickerCount: 2,
          tradeCount: 3,
        },
      ],
      netPnl: "1034.5",
      tickerCount: 5,
      tradeCount: 10,
    },
  };
}
