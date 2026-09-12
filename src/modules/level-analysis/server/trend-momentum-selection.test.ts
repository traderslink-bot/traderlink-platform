import assert from "node:assert/strict";
import { test } from "node:test";
import { LogicalTradeAnalyzerSelectionService } from "./logical-trade-analyzer-selection-service";

for (const fixture of [
  { name: "complete cache stays free", core: true, indicators: true, remaining: 5, reservations: 0, outcome: "queued" },
  { name: "missing history reserves one unit on explicit Analyze", core: true, indicators: false, remaining: 5, reservations: 1, outcome: "queued" },
  { name: "cached core remains usable with exhausted allowance", core: true, indicators: false, remaining: 0, reservations: 0, outcome: "queued" },
  { name: "uncached analysis retains allowance gate", core: false, indicators: false, remaining: 0, reservations: 0, outcome: "usage_exhausted" },
]) {
  test(fixture.name, () => {
    let reservations = 0;
    const target = { logicalTradeVersionId: "version", providerSymbol: "TEST", tradingDateNewYork: "2026-09-11",
      finalExitAtUtc: "2026-09-11T15:00:00.000Z", events: [{ executedAtUtc: "2026-09-11T14:00:00.000Z" }] };
    const logical = { ensureMaterialized: () => ({}) };
    const analyzer = { target: () => target, alreadyRequested: () => false,
      hasSavedCoverage: () => fixture.core, queue: () => ({ created: true, jobId: "job" }) };
    const allowances = { isDemo: () => false, immediate: (fn: () => unknown) => fn(),
      availability: () => ({ enabled: true, selectableAvailable: fixture.remaining }),
      reserve: () => { reservations++; return "reservation"; } };
    const history = { hasSufficientEvidence: () => fixture.indicators };
    type Args = ConstructorParameters<typeof LogicalTradeAnalyzerSelectionService>;
    const service = new LogicalTradeAnalyzerSelectionService(
      logical as unknown as Args[0], analyzer as unknown as Args[1],
      allowances as unknown as Args[2], history as unknown as Args[3]);
    assert.equal(service.select({ userId: "u", workspaceId: "w", accountId: "a", workspaceRole: "owner" }, "member"),
      fixture.outcome);
    assert.equal(reservations, fixture.reservations);
  });
}
