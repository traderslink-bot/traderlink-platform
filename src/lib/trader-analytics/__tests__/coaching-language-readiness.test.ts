import { describe, expect, it } from "vitest";
import {
  buildCoachingLanguageReadinessReport,
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
} from "../index";

describe("coaching language readiness", () => {
  it("audits sample coach copy for empty text and unsupported market-context claims", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const readiness = buildCoachingLanguageReadinessReport({
      analytics,
      generatedAt: "2026-05-06T18:00:00.000Z",
    });

    expect(readiness.checkedTextCount).toBeGreaterThan(20);
    expect(readiness.status).toBe("pass");
    expect(readiness.marketContextUsedForCoachConclusions).toBe(false);
    expect(readiness.failureCount).toBe(0);
    expect(readiness.warningCount).toBe(0);
    expect(
      readiness.violations.filter(
        (item) => item.kind === "unsupported_market_context_claim",
      ),
    ).toEqual([]);
    expect(
      readiness.textSamples.some(
        (item) =>
          item.source === "daily_coach_report" &&
          item.field === "sessionTimeInsight" &&
          item.text.includes("Best entry session"),
      ),
    ).toBe(true);
  });
});
