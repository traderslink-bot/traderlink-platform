import { calculateCoachMonthlyReviewDueTime } from "./coach-monthly-review-due-time";

const BASE = Object.freeze({
  accountTradingTimezone: "America/New_York",
  deliveryTimeEastern: "20:00",
  monthlyEnabledAtUtc: "2026-01-15T15:00:00.000Z",
});

describe("calculateCoachMonthlyReviewDueTime", () => {
  it("makes the prior calendar month due on the first day of the next month", () => {
    expect(calculateCoachMonthlyReviewDueTime({
      ...BASE,
      now: new Date("2026-08-02T00:00:00.000Z"),
    })).toEqual({
      state: "due",
      period: {
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        periodCoverage: "complete_month",
        timezone: "America/New_York",
      },
      scheduledAtUtc: "2026-08-02T00:00:00.000Z",
    });
  });

  it("waits until the selected Eastern delivery time", () => {
    expect(calculateCoachMonthlyReviewDueTime({
      ...BASE,
      now: new Date("2026-08-01T23:59:59.999Z"),
    })).toMatchObject({ state: "not_due", reason: "delivery_not_reached" });
  });

  it("uses the account-local enablement date for the first partial month", () => {
    const result = calculateCoachMonthlyReviewDueTime({
      ...BASE,
      monthlyEnabledAtUtc: "2026-07-20T02:30:00.000Z",
      now: new Date("2026-08-02T00:00:00.000Z"),
    });
    expect(result).toMatchObject({
      state: "due",
      period: {
        startDate: "2026-07-19",
        endDate: "2026-07-31",
        periodCoverage: "partial_month",
      },
    });
  });

  it("does not create a review for a period before enablement", () => {
    expect(calculateCoachMonthlyReviewDueTime({
      ...BASE,
      monthlyEnabledAtUtc: "2026-08-03T00:00:00.000Z",
      now: new Date("2026-08-04T00:00:00.000Z"),
    })).toMatchObject({ state: "not_due", reason: "enabled_after_period" });
  });

  it("can resolve the previous closed month for missed-run recovery", () => {
    expect(calculateCoachMonthlyReviewDueTime({
      ...BASE,
      now: new Date("2026-08-01T18:00:00.000Z"),
      periodOffsetMonths: -1,
    })).toMatchObject({
      state: "due",
      period: { startDate: "2026-06-01", endDate: "2026-06-30" },
      scheduledAtUtc: "2026-07-02T00:00:00.000Z",
    });
  });

  it("applies Eastern daylight-saving offsets to the delivery instant", () => {
    expect(calculateCoachMonthlyReviewDueTime({
      ...BASE,
      now: new Date("2026-04-02T00:00:00.000Z"),
    }).scheduledAtUtc).toBe("2026-04-02T00:00:00.000Z");
    expect(calculateCoachMonthlyReviewDueTime({
      ...BASE,
      now: new Date("2026-12-02T01:00:00.000Z"),
    }).scheduledAtUtc).toBe("2026-12-02T01:00:00.000Z");
  });
});
