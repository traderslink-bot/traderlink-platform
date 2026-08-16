import { describe, expect, it } from "vitest";

import type {
  JournalAnalyticsExactValue,
  JournalAnalyticsMetricResult,
} from "../contracts/analytics-result";
import {
  formatJournalAnalyticsDuration,
  formatJournalAnalyticsMetric,
} from "./journal-analytics-formatters";

function durationMetric(value: JournalAnalyticsExactValue): JournalAnalyticsMetricResult {
  return {
    value,
    valueKind: "duration",
  } as JournalAnalyticsMetricResult;
}

describe("Journal Analytics duration formatting", () => {
  it("formats exact and averaged holding durations as readable time", () => {
    expect(formatJournalAnalyticsDuration(90_000)).toBe("1.5 min");
    expect(formatJournalAnalyticsDuration(5_400_000)).toBe("1.5 hr");
    expect(formatJournalAnalyticsMetric(durationMetric({
      kind: "rational",
      numeratorDecimal: "5400000",
      denominatorInteger: "3",
      roundedDecimal: "1800000",
      roundingPolicy: "half_up_2dp",
    }))).toBe("30 min");
    expect(formatJournalAnalyticsMetric(durationMetric({
      kind: "duration",
      milliseconds: 7_200_000,
    }))).toBe("2 hr");
  });
});
