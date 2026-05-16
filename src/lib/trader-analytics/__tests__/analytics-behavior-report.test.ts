import { describe, expect, it } from "vitest";
import { buildAnalyticsBehaviorReport } from "../server/analytics-behavior-report";
import type {
  SavedTradeThread,
  SavedTradeThreadMarketContextFinding,
  SavedTradeThreadReadModel,
  SavedTradeThreadRoundTrip,
} from "../server/saved-trade-threads";

function roundTrip(args: {
  id: string;
  pnl: number;
  symbol: string;
}): SavedTradeThreadRoundTrip {
  return {
    chartContextStatus: "available",
    chartContextSummary: "1 saved chart insight",
    crossedSessionDate: false,
    decisionReviewInsightCount: 1,
    entryHourLabelEt: "09:00-09:59 ET",
    entrySessionDate: "2026-04-01",
    entryTime: "2026-04-01T13:30:00.000Z",
    executionCount: 2,
    exitSessionDate: "2026-04-01",
    exitTime: "2026-04-01T13:45:00.000Z",
    grossRealizedPnl: args.pnl,
    heldOvernight: false,
    href: `/trades/${args.id}#execution`,
    id: `${args.id}:round-trip`,
    lifecycleStatus: "closed",
    minutesSincePreviousExit: null,
    pnlDeltaFromPrevious: null,
    roleLabel: "First push",
    sequence: 1,
    symbol: args.symbol,
    tradeId: args.id,
  };
}

function finding(args: {
  id: string;
  opportunityType: "risk_to_reduce" | "strength_to_repeat" | "review_prompt";
  label: string;
  tradeId: string;
}): SavedTradeThreadMarketContextFinding {
  return {
    canDrivePrimaryConclusion: args.opportunityType !== "review_prompt",
    category: "market_context",
    detail: `${args.label} detail`,
    evidence: ["saved chart evidence"],
    evidenceChannel: "market_context",
    evidenceSource: "levels and chart evidence",
    id: `${args.tradeId}:${args.id}`,
    label: args.label,
    opportunityType: args.opportunityType,
    reviewAction: "Open the trade and write the review rule.",
    sourceInsightId: args.id,
    state:
      args.opportunityType === "review_prompt"
        ? "review_prompt"
        : "certified_detection",
    tone:
      args.opportunityType === "risk_to_reduce"
        ? "danger"
        : args.opportunityType === "strength_to_repeat"
          ? "success"
          : "warning",
    tradeId: args.tradeId,
  };
}

function thread(args: {
  findings: SavedTradeThreadMarketContextFinding[];
  pnl: number;
  symbol: string;
  tradeId: string;
}): SavedTradeThread {
  const trip = roundTrip({
    id: args.tradeId,
    pnl: args.pnl,
    symbol: args.symbol,
  });

  return {
    href: `/trades?thread=${args.symbol}:2026-04-01`,
    marketContextFindings: args.findings,
    roundTrips: [trip],
    symbol: args.symbol,
  } as unknown as SavedTradeThread;
}

describe("analytics behavior report", () => {
  it("groups certified chart behaviors into trader-facing analytics questions", () => {
    const model = {
      threads: [
        thread({
          findings: [
            finding({
              id: "entry_near_daily_4h_resistance",
              label: "Entry started just below resistance",
              opportunityType: "risk_to_reduce",
              tradeId: "loss-1",
            }),
          ],
          pnl: -42,
          symbol: "CYCN",
          tradeId: "loss-1",
        }),
        thread({
          findings: [
            finding({
              id: "entry_near_daily_4h_support",
              label: "Entry started near support below",
              opportunityType: "strength_to_repeat",
              tradeId: "win-1",
            }),
            finding({
              id: "adds_increased_risk_into_weakness",
              label: "Added before the trade repaired",
              opportunityType: "risk_to_reduce",
              tradeId: "win-1",
            }),
            finding({
              id: "protected_profit_before_fade",
              label: "Protected profit before the fade",
              opportunityType: "strength_to_repeat",
              tradeId: "win-1",
            }),
            finding({
              id: "balanced_management_with_constructive_exit",
              label: "Managed the full trade constructively",
              opportunityType: "strength_to_repeat",
              tradeId: "win-1",
            }),
            finding({
              id: "add_into_strength_with_constructive_final_exit",
              label: "Added into strength and exited constructively",
              opportunityType: "strength_to_repeat",
              tradeId: "win-1",
            }),
          ],
          pnl: 117,
          symbol: "AVEX",
          tradeId: "win-1",
        }),
      ],
    } as unknown as SavedTradeThreadReadModel;

    const report = buildAnalyticsBehaviorReport(model);
    const resistance = report.groups.find(
      (group) => group.id === "entry-resistance",
    );
    const support = report.groups.find((group) => group.id === "entry-support");
    const extension = report.groups.find(
      (group) => group.id === "entry-extension",
    );
    const dipAdds = report.groups.find((group) => group.id === "dip-buy-adds");
    const profitProtection = report.groups.find(
      (group) => group.id === "profit-protection",
    );
    const fullTradeManagement = report.groups.find(
      (group) => group.id === "full-trade-management",
    );
    const visibleCopy = JSON.stringify(report).toLowerCase();

    expect(report.contractVersion).toBe("analytics_behavior_report_v1");
    expect(report.riskCount).toBe(2);
    expect(report.strengthCount).toBe(4);
    expect(resistance?.title).toBe("Entries Under Resistance");
    expect(support?.title).toBe("Support-Based Entries");
    expect(extension?.title).toBe("Chase And Extension Review");
    expect(resistance?.evidence[0]?.detail).toContain(
      "Entry started just below overhead resistance and the trade finished red",
    );
    expect(support?.evidence[0]?.detail).toContain(
      "Entry started near support below and the trade later worked",
    );
    expect(dipAdds?.description).toContain("Dip buys");
    expect(dipAdds?.evidence[0]?.detail).toContain(
      "planned dip buy or size added before repair",
    );
    expect(profitProtection?.title).toBe("Profit Protection");
    expect(fullTradeManagement?.title).toBe("Full-Trade Management");
    expect(fullTradeManagement?.count).toBe(2);
    expect(fullTradeManagement?.evidence[0]?.detail).toContain(
      "whole management path repeatable",
    );
    expect(visibleCopy).not.toContain("signals");
    expect(visibleCopy).not.toContain("trade calls");
    expect(visibleCopy).not.toContain("financial advice");
  });
});
