import { expect, it } from "vitest";
import type { ScannerReadModel } from "./contracts";
import { initialScannerConnection, isScannerModel, scannerConnection } from "./connection-state";
import { memberScannerStatus, SCANNER_TRANSIENT_FAILURE_GRACE_MS as GRACE, SCANNER_UNAVAILABLE_MESSAGE } from "./member-status";

const now = Date.parse("2026-11-19T16:30:00Z"), empty = { rows: [], focus: [], total: 0 };
const good: ScannerReadModel = { provider: "alpaca", sourceContext: "a".repeat(64), status: "ready", tradingDate: "2026-11-19", session: "regular",
  updatedAtUtc: new Date(now - 60_000).toISOString(), universeCount: 2, receivedCount: 2, missingSymbols: [], missingFloatCount: 0,
  gainers: { rows: [{ symbol: "TEST" } as ScannerReadModel["gainers"]["rows"][number]], focus: [], total: 1 }, momentum: empty, issues: [] };
const notice = (s: ReturnType<typeof initialScannerConnection>) => memberScannerStatus(s.model, s.failedAt !== null, s.checkedAt, s.failedAt);

it.each([good, { ...good, updatedAtUtc: null }, { ...good, gainers: empty }])("times a brief outage from its first failure, including old or empty valid snapshots", model => {
  const start = initialScannerConnection(model, now);
  const brief = scannerConnection(start, { type: "failure", now });
  expect(notice(brief)).toBeNull(); expect(brief.model).toBe(model);
  const repeat = scannerConnection(brief, { type: "failure", now: now + GRACE - 1 });
  expect(repeat.failedAt).toBe(now); expect(notice(repeat)).toBeNull();
  expect(notice(scannerConnection(repeat, { type: "expire", now: now + GRACE + 1 }))).toBe(SCANNER_UNAVAILABLE_MESSAGE);
});
it("keeps all last results through a brief unavailable event, including a partial Gainers fallback, then expires", () => {
  const previous = { ...good, momentum: good.gainers };
  const failed = { ...good, refreshAfterMs: 1000, status: "unavailable" as const, momentum: empty };
  let state = scannerConnection(initialScannerConnection(previous, now), { type: "model", model: failed, now });
  expect(state.model).toBe(previous); expect(notice(state)).toBeNull();
  state = scannerConnection(state, { type: "model", model: failed, now: now + 5000 });
  expect(state.failedAt).toBe(now);
  state = scannerConnection(state, { type: "expire", now: now + GRACE + 1 });
  expect(state.model).toBe(failed); expect(notice(state)).toBe(SCANNER_UNAVAILABLE_MESSAGE);
});
it("does not restart the fault window when transport errors become unavailable publications", () => {
  const start = scannerConnection(initialScannerConnection(good, now), { type: "failure", now });
  const next = scannerConnection(start, { type: "model", model: { ...good, status: "unavailable" }, now: now + GRACE + 1 });
  expect(next.failedAt).toBe(now); expect(notice(next)).toBe(SCANNER_UNAVAILABLE_MESSAGE);
});
it.each([good, { ...good, gainers: empty }])("accepts healthy recovery immediately, including genuinely empty results", recovered => {
  const failed = scannerConnection(initialScannerConnection(good, now), { type: "failure", now });
  const result = scannerConnection(failed, { type: "model", model: recovered, now: now + 5000 });
  expect(result.model).toBe(recovered); expect(result.failedAt).toBeNull(); expect(result.continuity.emptySince).toBeNull(); expect(notice(result)).toBeNull();
});
it.each([
  { ...good, status: "closed" as const, session: null }, { ...good, status: "disabled" as const },
  { ...good, status: "universe_missing" as const }, { ...good, tradingDate: "2026-11-20", status: "unavailable" as const },
  { ...good, provider: "moomoo" as const, status: "unavailable" as const },
  { ...good, session: "after_hours" as const, status: "unavailable" as const },
  { ...good, sourceContext: "b".repeat(64), status: "unavailable" as const },
])("never carries results across a terminal state or data context change", model => {
  const previous = { ...good, sourceContext: "a".repeat(64) };
  expect(scannerConnection(initialScannerConnection(previous, now), { type: "model", model, now }).model).toBe(model);
});
it("clears results after confirmed access denial and never holds yesterday after a failure", () => {
  const failed = scannerConnection(initialScannerConnection(good, now), { type: "failure", permanent: true, now });
  expect(failed.model).toBeNull(); expect(notice(failed)).toBeNull();
  const yesterday = { ...good, tradingDate: "2026-11-18" };
  expect(notice(scannerConnection(initialScannerConnection(yesterday, now), { type: "failure", now }))).toBe(SCANNER_UNAVAILABLE_MESSAGE);
});
it("does not invent ready data before any successful model", () => {
  const failed = scannerConnection(initialScannerConnection(null, now), { type: "failure", now });
  expect(notice(failed)).toBeNull();
  expect(isScannerModel(good)).toBe(true); expect(isScannerModel({ status: "ready" })).toBe(false); expect(isScannerModel(null)).toBe(false);
});

 it("retains the same-context snapshot beyond the old thirty-second window, but not indefinitely", () => {
  const failed = { ...good, status: "unavailable" as const };
  let state = scannerConnection(initialScannerConnection(good, now), {type:"model",model:failed,now});
  state = scannerConnection(state, {type:"model",model:failed,now:now+90_000});
  expect(state.model).toBe(good); expect(notice(state)).toBeNull();
  state = scannerConnection(state, {type:"model",model:failed,now:now+GRACE+1});
  expect(state.model).toBe(failed); expect(notice(state)).toBe(SCANNER_UNAVAILABLE_MESSAGE);
});
