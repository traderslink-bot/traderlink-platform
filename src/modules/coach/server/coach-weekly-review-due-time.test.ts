import { calculateCoachWeeklyReviewDueTime } from "./coach-weekly-review-due-time";

const BASE_INPUT = Object.freeze({
  accountTradingTimezone: "America/New_York",
  deliveryTimeEastern: "20:00",
});

function calculate(
  now: string,
  weeklyDeliveryDay: "friday" | "saturday" | "sunday",
) {
  return calculateCoachWeeklyReviewDueTime({
    ...BASE_INPUT,
    now: new Date(now),
    weeklyDeliveryDay,
  });
}

describe("calculateCoachWeeklyReviewDueTime", () => {
  it.each([
    ["friday", "2026-08-08T00:00:00.000Z", "2026-08-08T00:00:00.000Z"],
    ["saturday", "2026-08-09T00:00:00.000Z", "2026-08-09T00:00:00.000Z"],
    ["sunday", "2026-08-10T00:00:00.000Z", "2026-08-10T00:00:00.000Z"],
  ] as const)("handles %s delivery before, at, and after the selected instant", (day, at, scheduledAtUtc) => {
    const before = calculate(new Date(new Date(at).getTime() - 1).toISOString(), day);
    expect(before).toMatchObject({
      state: "not_due",
      reason: "delivery_not_reached",
      scheduledAtUtc,
      period: { startDate: "2026-08-03", endDate: "2026-08-09" },
    });
    expect(calculate(at, day)).toMatchObject({
      state: "due",
      scheduledAtUtc,
      period: { startDate: "2026-08-03", endDate: "2026-08-09" },
    });
    expect(calculate(new Date(new Date(at).getTime() + 60_000).toISOString(), day)).toMatchObject({
      state: "due",
      scheduledAtUtc,
      period: { startDate: "2026-08-03", endDate: "2026-08-09" },
    });
  });

  it("keeps the current incomplete Monday-Sunday label not due before its delivery", () => {
    const result = calculate("2026-08-05T16:00:00.000Z", "friday");
    expect(result).toEqual({
      state: "not_due",
      reason: "delivery_not_reached",
      period: {
        startDate: "2026-08-03",
        endDate: "2026-08-09",
        timezone: "America/New_York",
      },
      scheduledAtUtc: "2026-08-08T00:00:00.000Z",
    });
  });

  it("returns the immediately prior period as due for missed-run recovery", () => {
    const result = calculateCoachWeeklyReviewDueTime({
      ...BASE_INPUT,
      now: new Date("2026-08-05T16:00:00.000Z"),
      weeklyDeliveryDay: "friday",
      periodOffsetWeeks: -1,
    });
    expect(result).toMatchObject({
      state: "due",
      period: { startDate: "2026-07-27", endDate: "2026-08-02" },
      scheduledAtUtc: "2026-08-01T00:00:00.000Z",
    });
  });

  it.each([
    ["2026-03-02T16:00:00.000Z", "2026-03-07T01:00:00.000Z"],
    ["2026-11-02T16:00:00.000Z", "2026-11-07T01:00:00.000Z"],
  ] as const)("uses the Eastern DST rule for a %s same-week schedule", (now, scheduledAtUtc) => {
    const result = calculate(now, "friday");
    expect(result.scheduledAtUtc).toBe(scheduledAtUtc);
    expect(result.period.timezone).toBe("America/New_York");
  });

  it("rejects an invalid delivery day or timezone", () => {
    expect(() => calculateCoachWeeklyReviewDueTime({
      ...BASE_INPUT,
      now: new Date("2026-08-05T16:00:00.000Z"),
      weeklyDeliveryDay: "monday" as "friday",
    })).toThrow("Invalid weekly delivery day");
    expect(() => calculateCoachWeeklyReviewDueTime({
      ...BASE_INPUT,
      accountTradingTimezone: "Not/A_Timezone",
      now: new Date("2026-08-05T16:00:00.000Z"),
      weeklyDeliveryDay: "friday",
    })).toThrow("Invalid IANA timezone");
  });
});
