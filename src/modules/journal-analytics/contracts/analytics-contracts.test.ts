import {
  JOURNAL_ANALYTICS_MAX_GROUP_ROWS,
  JOURNAL_ANALYTICS_MAX_METRICS_PER_QUERY,
  JOURNAL_ANALYTICS_MAX_SYMBOLS_PER_QUERY,
  JOURNAL_ANALYTICS_MAX_TABLE_PAGE_SIZE,
  JOURNAL_ANALYTICS_QUERY_VERSION,
  JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES,
} from "./analytics-query";
import { JOURNAL_ANALYTICS_RESULT_VERSION } from "./analytics-result";
import { JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION } from "./metric-registry";

describe("Journal Analytics contracts", () => {
  it("freezes the accepted versions and bounded query limits", () => {
    expect(JOURNAL_ANALYTICS_QUERY_VERSION).toBe("journal_analytics_query_v1");
    expect(JOURNAL_ANALYTICS_RESULT_VERSION).toBe("journal_analytics_result_v1");
    expect(JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION).toBe(
      "journal_analytics_metrics_v1",
    );
    expect(JOURNAL_ANALYTICS_MAX_METRICS_PER_QUERY).toBe(256);
    expect(JOURNAL_ANALYTICS_MAX_SYMBOLS_PER_QUERY).toBe(100);
    expect(JOURNAL_ANALYTICS_MAX_GROUP_ROWS).toBe(500);
    expect(JOURNAL_ANALYTICS_MAX_TABLE_PAGE_SIZE).toBe(200);
    expect(JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES).toEqual([5, 15, 30, 60]);
    expect(Object.isFrozen(JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES)).toBe(true);
  });
});
