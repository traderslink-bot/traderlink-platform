import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";
import { JournalLogicalTradeRepository } from "../../journal/server/logical-trades/journal-logical-trade-repository";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import { readSavedTradeMovement } from "./trend-momentum-movement-service";

afterEach(() => vi.restoreAllMocks());

type Input = Parameters<typeof readSavedTradeMovement>[0];
const at = "2026-09-11T14:00:10Z";
const trade = { logicalTradeId: "group", tradeStyle: "day", lifecycleState: "active", direction: "long", members: [{ roundTripId: "one" }, { roundTripId: "two" }] };
const row = (id: string, closeLocalDate: string, pnl: string | null) => ({ roundTripId: id, closeLocalDate, selectedPnlDecimal: pnl, displayedSymbol: "TEST", entryLocalDate: "2026-09-10" });
const input = () => ({ database: {}, scope: { activeAccountId: "account", allowedAccountIds: ["account"], userId: "user", workspaceId: "workspace", workspaceRole: "owner" },
  journalRows: [row("one", "2026-09-10", "3"), row("two", "2026-09-11", "4")],
  legacy: { timezone: "America/New_York", trades: [{ roundTripId: "one", executionCount: 2 }], excursions: [{ roundTripId: "one" }], eventPaths: [] },
  multipliers: new Map(), startDate: "2026-09-11", endDate: "2026-09-11" } as unknown as Input);
const saved = { status: "ready", candles: [], analyzed: { eventSnapshots: [
  { event: { kind: "entry", eventId: "entry", sequence: 1, executedAtUtc: at, priceDecimal: "10" }, metrics: { excursionUntilFlat: { favorableMoveDecimal: "1", adverseMoveDecimal: "0", minutesUntilFlat: 0 } } },
  { event: { kind: "final_exit", eventId: "exit", sequence: 2, executedAtUtc: "2026-09-11T14:00:40Z", priceDecimal: "11" }, metrics: {} },
] } };

test("saved grouped trade is counted once with complete members across the date boundary", () => {
  vi.spyOn(JournalLogicalTradeRepository.prototype, "list").mockImplementation(() => ([trade]) as unknown as ReturnType<typeof JournalLogicalTradeRepository.prototype.list>);
  vi.spyOn(LogicalTradeAnalyzerRepository.prototype, "readCurrentByRoundTrip").mockImplementation(() => (saved) as unknown as ReturnType<typeof LogicalTradeAnalyzerRepository.prototype.readCurrentByRoundTrip>);
  const result = readSavedTradeMovement(input());
  assert.equal(result.analyzedTradeCount, 1);
  assert.equal(result.eligibleDayTradeCount, 1);
  assert.equal(result.directionTradeCounts.long, 1);
  assert.equal(result.excursions[0]!.roundTripId, "group");
  assert.equal(result.excursions[0]!.actualPnlDecimal, "7");
  assert.equal(result.entryOpportunityRisk.measuredExecutionCount, 1);
  assert.equal(readSavedTradeMovement({ ...input(), endDate: "2026-09-10" }).eligibleDayTradeCount, 0);
  assert.equal(readSavedTradeMovement({ ...input(), journalRows: input().journalRows.slice(1) }).eligibleDayTradeCount, 0);
});

test("missing P/L keeps movement and unavailable grouped analysis never uses independent member results", () => {
  vi.spyOn(JournalLogicalTradeRepository.prototype, "list").mockImplementation(() => ([trade]) as unknown as ReturnType<typeof JournalLogicalTradeRepository.prototype.list>);
  const read = vi.spyOn(LogicalTradeAnalyzerRepository.prototype, "readCurrentByRoundTrip").mockImplementation(() => (saved) as unknown as ReturnType<typeof LogicalTradeAnalyzerRepository.prototype.readCurrentByRoundTrip>);
  const result = readSavedTradeMovement({ ...input(), journalRows: [row("one", "2026-09-10", null), row("two", "2026-09-11", "4")] as unknown as Input["journalRows"] });
  assert.equal(result.excursions.length, 1);
  assert.equal(result.excursions[0]!.actualPnlDecimal, null);
  read.mockImplementation(() => null);
  const unavailable = readSavedTradeMovement(input());
  assert.equal(unavailable.eligibleDayTradeCount, 1);
  assert.equal(unavailable.analyzedTradeCount, 0);
  assert.deepEqual(unavailable.excursions, []);
});

test("account authorization is required before any trade lookup", () => {
  const source = input();
  assert.throws(() => readSavedTradeMovement({ ...source, scope: { ...source.scope, allowedAccountIds: [] } }), /account is unavailable/);
});
