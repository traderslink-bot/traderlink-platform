import { describe, expect, it } from "vitest";
import type { ScannerReadModel } from "./contracts";
import { memberScannerStatus, scannerOutsideActiveHours, SCANNER_ACTIVE_HOURS_MESSAGE, SCANNER_TRANSIENT_FAILURE_GRACE_MS, SCANNER_UNAVAILABLE_MESSAGE } from "./member-status";

const results = { rows: [], focus: [], total: 0 };
const base: ScannerReadModel = { status: "ready", tradingDate: "2026-11-02", session: "regular",
  updatedAtUtc: null, universeCount: 1251, receivedCount: 100, missingSymbols: ["TEST"], missingFloatCount: 1,
  gainers: results, momentum: results, issues: ["missing_quote"] };
const at = (text: string) => Date.parse(text);
describe("member scanner notices", () => {
  it.each(["ready", "partial", "warming"] as const)("keeps %s diagnostics quiet during the operating window", status => {
    expect(memberScannerStatus({ ...base, status },false,at("2026-11-02T20:30:00Z"))).toBeNull();
  });
  it.each([
    ["weekend", "2026-11-15", "2026-11-15T19:00:00Z"],
    ["market holiday", "2026-11-26", "2026-11-26T19:00:00Z"],
    ["after an early close", "2026-11-27", "2026-11-27T22:00:00Z"],
  ])("uses the schedule when the feed is closed on a %s during normal hours", (_reason, tradingDate, now) => {
    const closed: ScannerReadModel = { ...base, status: "closed", session: null, tradingDate };
    expect(memberScannerStatus(closed,false,at(now))).toBe(SCANNER_ACTIVE_HOURS_MESSAGE);
  });
  it("uses the exact overnight boundary in winter Eastern time", () => {
    expect(memberScannerStatus(base,false,at("2026-11-03T00:59:59Z"))).toBeNull();
    expect(memberScannerStatus(base,false,at("2026-11-03T01:00:00Z"))).toBe(SCANNER_ACTIVE_HOURS_MESSAGE);
    expect(memberScannerStatus(base,false,at("2026-11-03T08:59:59Z"))).toBe(SCANNER_ACTIVE_HOURS_MESSAGE);
    expect(memberScannerStatus(base,false,at("2026-11-03T09:00:00Z"))).toBeNull();
  });
  it("follows daylight saving rather than a fixed UTC offset", () => {
    expect(memberScannerStatus(base,false,at("2026-06-02T00:00:00Z"))).toBe(SCANNER_ACTIVE_HOURS_MESSAGE);
    expect(memberScannerStatus(base,false,at("2026-06-02T07:59:59Z"))).toBe(SCANNER_ACTIVE_HOURS_MESSAGE);
    expect(memberScannerStatus(base,false,at("2026-06-02T08:00:00Z"))).toBeNull();
  });
  it("shows Disabled even overnight, without exposing configuration diagnostics", () => {
    expect(memberScannerStatus({ ...base, status: "disabled" },false,at("2026-11-03T01:00:00Z"))).toBe("Disabled");
  });
  it("still identifies the off-hours chart default while scanner rows are stale, disabled, or unavailable", () => {
    const afterClose = at("2026-11-03T01:00:00Z");
    for (const model of [base, { ...base, status: "disabled" } as const, null]) {
      expect(scannerOutsideActiveHours(model, afterClose)).toBe(true);
      expect(scannerOutsideActiveHours(model, at("2026-11-03T09:00:00Z"))).toBe(false);
    }
  });
  it.each(["unavailable", "universe_missing"] as const)("uses only the generic notice for %s during operating hours", status => {
    expect(memberScannerStatus({ ...base, status },false,at("2026-11-02T20:30:00Z"))).toBe(SCANNER_UNAVAILABLE_MESSAGE);
  });
  it("handles a failed client request without revealing provider details", () => {
    expect(memberScannerStatus(base,true,at("2026-11-02T20:30:00Z"))).toBe(SCANNER_UNAVAILABLE_MESSAGE);
    expect(memberScannerStatus(null,true,at("2026-11-02T20:30:00Z"))).toBe(SCANNER_UNAVAILABLE_MESSAGE);
  });
  it("keeps populated rows visible through one brief failed poll, then reports a sustained outage", () => {
    const updatedAt = at("2026-11-02T20:30:00Z");
    const populated = { ...base, updatedAtUtc: new Date(updatedAt).toISOString(), momentum: {
      rows: [{ symbol: "TEST" } as ScannerReadModel["momentum"]["rows"][number]], focus: [], total: 1,
    } };
    expect(memberScannerStatus(populated,true,updatedAt + 5_000,updatedAt)).toBeNull();
    expect(memberScannerStatus(populated,true,updatedAt + SCANNER_TRANSIENT_FAILURE_GRACE_MS,updatedAt)).toBeNull();
    expect(memberScannerStatus(populated,true,updatedAt + SCANNER_TRANSIENT_FAILURE_GRACE_MS + 1,updatedAt)).toBe(SCANNER_UNAVAILABLE_MESSAGE);
  });
  it("shows operating hours overnight rather than a universe/provider error", () => {
    expect(memberScannerStatus({ ...base, status: "universe_missing" },true,at("2026-11-03T01:00:00Z")))
      .toBe(SCANNER_ACTIVE_HOURS_MESSAGE);
  });
  it("does not invent a notice during the initial client load", () => {
    expect(memberScannerStatus(null,false,null)).toBeNull();
  });
});

it("uses loading during a brief first connection failure and reports a prolonged outage", () => {
  const now = Date.parse("2026-11-02T20:30:00Z");
  expect(memberScannerStatus(null,true,now+5000,now)).toBeNull();
  expect(memberScannerStatus(null,true,now+SCANNER_TRANSIENT_FAILURE_GRACE_MS+1,now)).toBe(SCANNER_UNAVAILABLE_MESSAGE);
});
