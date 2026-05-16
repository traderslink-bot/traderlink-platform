import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCsvDryRunPrototypeAnalysisPanel } from "../product/functional-readiness";
import { buildCsvDryRunImportExperience } from "../product/csv-dry-run-workflow";

const repoRoot = process.cwd();

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("CSV dry-run decision-review boundary", () => {
  it("keeps the import dry-run client out of server market-analysis modules", () => {
    const clientSource = readRepoFile(
      "app/import-dry-run/import-dry-run-client.tsx",
    );

    expect(clientSource).not.toContain("levels-system-phase1");
    expect(clientSource).not.toContain("runTradeAnalysis");
    expect(clientSource).not.toContain("buildTradeAnalysisSummary");
    expect(clientSource).not.toContain("support-resistance");
    expect(clientSource).toContain("/api/import-dry-run/decision-review");
  });

  it("requires precomputed daily/4h source before market context counts as used", () => {
    const experience = buildCsvDryRunImportExperience({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
        "2026-05-01,10:00:00,ABCD,Sell,100,10.50",
      ].join("\n"),
    });
    const withoutReview = buildCsvDryRunPrototypeAnalysisPanel({ experience });
    const withReview = buildCsvDryRunPrototypeAnalysisPanel({
      experience,
      decisionReviews: [
        {
          tradeId: "dry-run-trade-1-abcd",
          coachingHeadline:
            "Entry started just below higher-timeframe resistance.",
          fixFirstBehaviorId: "chasing",
          marketContextSource: "levels_system_daily_4h",
          tradeWindowEvidenceSource: "execution_only_fallback",
          candleQualityNotes: [
            "levels-system trade-window warning: Trade-window candles were ignored because their prices were disconnected from execution prices by more than 60%.",
          ],
          insights: [
            {
              id: "entry_near_daily_4h_resistance",
              tone: "risk",
              category: "market_context",
              title: "Entry started just below daily/4h resistance",
              summary:
                "The first entry started just below a higher-timeframe resistance area.",
            },
          ],
        },
      ],
    });

    expect(withoutReview.marketContextUsed).toBe(false);
    expect(withoutReview.marketContextSource).toBe("none");
    expect(withReview.marketContextUsed).toBe(true);
    expect(withReview.marketContextSource).toBe("levels_system_daily_4h");
    expect(withReview.topDecisionReviewInsights[0]?.evidence).toContain(
      "levels-system trade-window warning: Trade-window candles were ignored because their prices were disconnected from execution prices by more than 60%.",
    );
    expect(withReview.limitations.join(" ")).toContain(
      "VWAP/EMA feedback remains disabled",
    );
  });
});
