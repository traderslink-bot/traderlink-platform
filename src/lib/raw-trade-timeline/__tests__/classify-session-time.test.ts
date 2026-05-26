import { describe, expect, it } from "vitest";
import {
  buildSessionTimeContextFromExecutions,
  classifyEasternSessionTime,
} from "../session/classify-session-time";

describe("classifyEasternSessionTime", () => {
  it.each([
    ["2026-05-06T07:59:59.000Z", "overnight"],
    ["2026-05-06T08:00:00.000Z", "pre_market"],
    ["2026-05-06T13:29:59.000Z", "pre_market"],
    ["2026-05-06T13:30:00.000Z", "market_open"],
    ["2026-05-06T14:59:59.000Z", "market_open"],
    ["2026-05-06T15:00:00.000Z", "midday"],
    ["2026-05-06T19:59:59.000Z", "midday"],
    ["2026-05-06T20:00:00.000Z", "post_market"],
    ["2026-05-07T00:00:00.000Z", "overnight"],
  ])("classifies %s as %s Eastern", (timestamp, bucket) => {
    expect(classifyEasternSessionTime(timestamp)?.sessionBucket).toBe(bucket);
  });

  it("keeps DST-aware classification in America/New_York", () => {
    const beforeDst = classifyEasternSessionTime("2026-03-06T14:30:00.000Z");
    const afterDst = classifyEasternSessionTime("2026-03-09T13:30:00.000Z");

    expect(beforeDst?.sessionBucket).toBe("market_open");
    expect(afterDst?.sessionBucket).toBe("market_open");
    expect(beforeDst?.hourLabelEt).toBe("09:00-09:59 ET");
    expect(afterDst?.hourLabelEt).toBe("09:00-09:59 ET");
  });

  it("tracks entry hour plus held-through session exposure", () => {
    const context = buildSessionTimeContextFromExecutions([
      { timestamp: "2026-05-06T13:15:00.000Z" },
      { timestamp: "2026-05-06T14:45:00.000Z" },
      { timestamp: "2026-05-06T15:10:00.000Z" },
    ]);

    expect(context.sessionBucket).toBe("pre_market");
    expect(context.entryHourLabelEt).toBe("09:00-09:59 ET");
    expect(context.heldPremarketIntoOpen).toBe(true);
    expect(context.heldOpenIntoMidday).toBe(true);
    expect(context.heldSessionBuckets).toEqual([
      "pre_market",
      "market_open",
      "midday",
    ]);
  });
});
