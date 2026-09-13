import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";
import { JournalLogicalTradeRepository } from "../../journal/server/logical-trades/journal-logical-trade-repository";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import { readSavedPatternPopulation } from "./trend-momentum-pattern-service";

afterEach(() => vi.restoreAllMocks());

type Input = Parameters<typeof readSavedPatternPopulation>[0];
const source = () => ({ database: { prepare: () => { throw new Error("group_must_not_read_legacy"); } },
  scope: { activeAccountId: "account", allowedAccountIds: ["account"], workspaceId: "workspace", userId: "user", workspaceRole: "owner" },
  startDate: "2026-09-11", endDate: "2026-09-11",
  journalRows: [{ roundTripId: "one", closeLocalDate: "2026-09-10", entryLocalDate: "2026-09-10", selectedPnlDecimal: "2", entryNotionalDecimal: "10", displayedSymbol: "TEST" },
    { roundTripId: "two", closeLocalDate: "2026-09-11", entryLocalDate: "2026-09-11", selectedPnlDecimal: "3", entryNotionalDecimal: "10", displayedSymbol: "TEST" }] } as unknown as Input);
const trade = { logicalTradeId: "group", tradeStyle: "day", lifecycleState: "active", direction: "long", members: [{ roundTripId: "one" }, { roundTripId: "two" }] };
const event = { eventId: "event", sequence: 1, kind: "entry", executedAtUtc: "2026-09-11T14:00:30Z" };
const at = Date.parse(event.executedAtUtc) / 1000;
const ready = { status: "ready", candles: [{ time: at - 30 }], analysisVersionId: "revision-2", analyzed: { eventSnapshots: [{ event, patterns: [{ availableAtExecution: true, timeframe: "1m", candlesBeforeExecution: 1, kind: "hammer", knownAtTime: at - 30, time: at - 90 }] }] } };

test("pattern population binds current grouped result revision and whole-trade P/L after final-close selection", () => {
  vi.spyOn(JournalLogicalTradeRepository.prototype, "list").mockImplementation(() => ([trade]) as unknown as ReturnType<typeof JournalLogicalTradeRepository.prototype.list>);
  vi.spyOn(LogicalTradeAnalyzerRepository.prototype, "readCurrentByRoundTrip").mockImplementation(() => (ready) as unknown as ReturnType<typeof LogicalTradeAnalyzerRepository.prototype.readCurrentByRoundTrip>);
  const result = readSavedPatternPopulation(source());
  assert.equal(result.eligibleDayTradeCount, 1);
  assert.equal(result.analyzedTradeCount, 1);
  assert.equal(result.observations[0]!.tradeId, "group");
  assert.equal(result.observations[0]!.analysisVersionId, "revision-2");
  assert.equal(result.observations[0]!.pnlDecimal, "5");
  assert.equal(result.observations[0]!.returnPercentDecimal, "25");
  assert.equal(readSavedPatternPopulation({ ...source(), journalRows: source().journalRows.slice(1) }).eligibleDayTradeCount, 0);
});

test("pending grouped analysis cannot be replaced by member snapshots and cross-account reads are rejected", () => {
  vi.spyOn(JournalLogicalTradeRepository.prototype, "list").mockImplementation(() => ([trade]) as unknown as ReturnType<typeof JournalLogicalTradeRepository.prototype.list>);
  vi.spyOn(LogicalTradeAnalyzerRepository.prototype, "readCurrentByRoundTrip").mockImplementation(() => (({ status: "pending", analyzed: null })) as unknown as ReturnType<typeof LogicalTradeAnalyzerRepository.prototype.readCurrentByRoundTrip>);
  assert.equal(readSavedPatternPopulation(source()).analyzedTradeCount, 0);
  assert.throws(() => readSavedPatternPopulation({ ...source(), scope: { ...source().scope, allowedAccountIds: [] } }), /account is unavailable/);
});
