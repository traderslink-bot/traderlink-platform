import { describe, expect, it } from "vitest";

import type { ScannerReadModel } from "./contracts";
import { applyScannerDisplayContinuity, EMPTY_SCANNER_CONTINUITY_MS } from "./display-continuity";

const emptyResults = { rows: [], focus: [], total: 0 } as const;

function model(overrides: Partial<ScannerReadModel> = {}): ScannerReadModel {
  return {
    status: "ready",
    tradingDate: "2026-11-03",
    session: "after_hours",
    updatedAtUtc: "2026-11-04T00:52:00Z",
    universeCount: 2,
    receivedCount: 2,
    missingSymbols: [],
    missingFloatCount: 0,
    gainers: emptyResults,
    dayGainers: emptyResults,
    momentum: emptyResults,
    issues: [],
    ...overrides,
  };
}

function populated(): ScannerReadModel {
  return model({
    momentum: {
      rows: [{ symbol: "TEST" } as ScannerReadModel["momentum"]["rows"][number]],
      focus: [],
      total: 1,
    },
  });
}

describe("scanner display continuity", () => {
  it("retains populated rows through a continuous 30-second whole-screen empty response", () => {
    const previous = populated();
    const started = applyScannerDisplayContinuity(previous, model(), { emptySince: null }, 1_000);
    expect(started.model).toBe(previous);

    const atThirtySeconds = applyScannerDisplayContinuity(previous, model(), started.continuity, 1_000 + EMPTY_SCANNER_CONTINUITY_MS);
    expect(atThirtySeconds.model).toBe(previous);

    const expired = applyScannerDisplayContinuity(previous, model(), atThirtySeconds.continuity, 1_001 + EMPTY_SCANNER_CONTINUITY_MS);
    expect(expired.model).not.toBe(previous);
    expect(expired.model.momentum.rows).toHaveLength(0);
  });

  it("accepts the next populated response immediately and resets the empty interval", () => {
    const previous = populated();
    const held = applyScannerDisplayContinuity(previous, model(), { emptySince: null }, 1_000);
    const recovered = model({ gainers: previous.momentum });
    const result = applyScannerDisplayContinuity(previous, recovered, held.continuity, 6_000);
    expect(result.model).toBe(recovered);
    expect(result.continuity.emptySince).toBeNull();
  });

  it("holds rows during a brief unavailable response that has no session context", () => {
    const previous = populated();
    const incoming = model({ status: "unavailable", session: null });
    const result = applyScannerDisplayContinuity(previous, incoming, { emptySince: null }, 1_000);
    expect(result.model).toBe(previous);
    expect(result.continuity.emptySince).toBe(1_000);
  });

  it.each([
    model({ status: "closed", session: null }),
    model({ status: "disabled" }),
    model({ tradingDate: "2026-11-04" }),
    model({ session: "regular" }),
  ])("does not retain rows across a terminal state or market context change", incoming => {
    const previous = populated();
    const result = applyScannerDisplayContinuity(previous, incoming, { emptySince: null }, 1_000);
    expect(result.model).toBe(incoming);
    expect(result.continuity.emptySince).toBeNull();
  });
});
