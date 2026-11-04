import { describe, expect, it } from "vitest";
import type { ScannerReadModel } from "./contracts";
import { memberScannerStatus, SCANNER_ACTIVE_HOURS_MESSAGE, SCANNER_TRANSIENT_FAILURE_GRACE_MS, SCANNER_UNAVAILABLE_MESSAGE } from "./member-status";

const results = { rows: [], focus: [], total: 0 };
const base: ScannerReadModel = { status: "ready", tradingDate: "2026-11-02", session: "regular",
  updatedAtUtc: null, universeCount: 1251, receivedCount: 100, missingSymbols: ["TEST"], missingFloatCount: 1,
  gainers: results, momentum: results, issues: ["missing_quote"] };
const at = (text: string) => Date.parse(text);
describe("member scanner notices", () => {
  it.each(["ready", "partial", "warming", "closed"] as const)("keeps %s diagnostics quiet during the operating window", status => {
    expect(memberScannerStatus({ ...base, status },false,at("2026-11-02T20:30:00Z"))).toBeNull();
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
    expect(memberScannerStatus(populated,true,updatedAt + 5_000)).toBeNull();
    expect(memberScannerStatus(populated,true,updatedAt + SCANNER_TRANSIENT_FAILURE_GRACE_MS)).toBeNull();
    expect(memberScannerStatus(populated,true,updatedAt + SCANNER_TRANSIENT_FAILURE_GRACE_MS + 1)).toBe(SCANNER_UNAVAILABLE_MESSAGE);
  });
  it("shows operating hours overnight rather than a universe/provider error", () => {
    expect(memberScannerStatus({ ...base, status: "universe_missing" },true,at("2026-11-03T01:00:00Z")))
      .toBe(SCANNER_ACTIVE_HOURS_MESSAGE);
  });
  it("does not invent a notice during the initial client load", () => {
    expect(memberScannerStatus(null,false,null)).toBeNull();
  });
});
