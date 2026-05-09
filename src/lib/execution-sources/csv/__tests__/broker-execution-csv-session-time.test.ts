import { describe, expect, it } from "vitest";
import { parseBrokerExecutionCsv } from "../broker-execution-csv-import";

describe("broker execution CSV session time intelligence", () => {
  it("derives entry session, Eastern session date, hour, and held-through exposure", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-06,09:15:00,ABCD,Buy,100,10",
      "2026-05-06,10:45:00,ABCD,Sell,50,11",
      "2026-05-06,11:10:00,ABCD,Sell,50,12",
    ].join("\n");

    const result = parseBrokerExecutionCsv({
      csvText: csv,
      broker: "generic_execution_csv",
      timestampTimezone: "America/New_York",
    });

    expect(result.requestCount).toBe(1);
    expect(result.requests[0].sessionContext).toMatchObject({
      sessionDate: "2026-05-06",
      sessionBucket: "pre_market",
      entryHourEt: 9,
      entryHourLabelEt: "09:00-09:59 ET",
      heldPremarketIntoOpen: true,
      heldOpenIntoMidday: true,
    });
    expect(result.requests[0].sessionContext.heldSessionBuckets).toEqual([
      "pre_market",
      "market_open",
      "midday",
    ]);
  });

  it("keeps source timestamp timezone distinct from Eastern session classification", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-06,06:30:00,ABCD,Buy,100,10",
      "2026-05-06,07:00:00,ABCD,Sell,100,11",
    ].join("\n");

    const result = parseBrokerExecutionCsv({
      csvText: csv,
      broker: "generic_execution_csv",
      timestampTimezone: "America/Los_Angeles",
    });

    expect(result.diagnostics.timestampTimezone).toBe("America/Los_Angeles");
    expect(result.requests[0].sessionContext).toMatchObject({
      sessionBucket: "market_open",
      entryHourEt: 9,
      entryHourLabelEt: "09:00-09:59 ET",
    });
  });
});
