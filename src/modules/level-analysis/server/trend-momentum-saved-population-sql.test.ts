import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import { readSavedPatternPopulation } from "./trend-momentum-pattern-service";

type Input = Parameters<typeof readSavedPatternPopulation>[0];

// Query-contract integration only: real SQLite and repository methods, not a
// replacement for migration constraint acceptance. Never opens an on-disk DB.
function fixture() {
  const database = new Database(":memory:");
  database.exec(`
CREATE TABLE journal_round_trips(workspace_id, account_id, round_trip_id, current_version_id, lifecycle_state);
CREATE TABLE journal_round_trip_versions(workspace_id, account_id, round_trip_version_id, instrument_id, trade_currency, direction, opened_at_utc, closed_at_utc, projection_state);
CREATE TABLE journal_instruments(workspace_id, instrument_id, normalized_symbol);
CREATE TABLE journal_trade_style_plans(workspace_id, account_id, round_trip_id, trade_style);
CREATE TABLE journal_active_logical_trade_memberships(workspace_id, account_id, round_trip_id, logical_trade_id, logical_trade_version_id, member_sequence);
CREATE TABLE journal_logical_trades(workspace_id, account_id, logical_trade_id, revision, lifecycle_state);
CREATE TABLE journal_logical_trade_versions(workspace_id, account_id, logical_trade_version_id, trade_style);
CREATE TABLE journal_logical_trade_daily_analyses(workspace_id, account_id, logical_trade_id, logical_trade_version_id, logical_trade_analysis_id, current_revision, status);
CREATE TABLE journal_logical_trade_daily_analysis_versions(logical_trade_analysis_id, revision_number, logical_trade_analysis_version_id, result_json, evidence_candles_json, execution_mismatches_json);
CREATE TABLE level_analysis_logical_trade_jobs(workspace_id, account_id, logical_trade_id, logical_trade_version_id, status, created_at_utc, desired_coverage_end_utc);
CREATE TABLE journal_round_trip_daily_trade_analyses(workspace_id, account_id, round_trip_id, round_trip_version_id, daily_trade_analysis_id, current_revision, status);
CREATE TABLE journal_round_trip_daily_trade_analysis_versions(daily_trade_analysis_id, revision_number, daily_trade_analysis_version_id, status);
CREATE TABLE journal_round_trip_daily_trade_analysis_event_snapshots(daily_trade_analysis_version_id, snapshot_json);
INSERT INTO journal_instruments VALUES ('workspace', 'instrument', 'TEST');
INSERT INTO journal_logical_trades VALUES ('workspace', 'account', 'group', 1, 'active');
INSERT INTO journal_logical_trade_versions VALUES ('workspace', 'account', 'group-v1', 'day');
INSERT INTO journal_logical_trade_daily_analyses VALUES ('workspace', 'account', 'group', 'group-v1', 'analysis', 2, 'ready');
`);
  const snapshot = { event: { eventId: "event", sequence: 1, kind: "entry", executedAtUtc: "2026-09-10T14:00:30Z" }, patterns: [] };
  for (const [index, id] of ["one", "two"].entries()) {
    const date = index === 0 ? "2026-09-10" : "2026-09-11";
    database.prepare("INSERT INTO journal_round_trips VALUES ('workspace', 'account', ?, ?, 'active')").run(id, `${id}-v1`);
    database.prepare("INSERT INTO journal_round_trip_versions VALUES ('workspace', 'account', ?, 'instrument', 'USD', 'long', ?, ?, 'ready_closed')")
      .run(`${id}-v1`, `${date}T14:00:30Z`, `${date}T15:00:00Z`);
    database.prepare("INSERT INTO journal_active_logical_trade_memberships VALUES ('workspace', 'account', ?, 'group', 'group-v1', ?)").run(id, index + 1);
    database.prepare("INSERT INTO journal_round_trip_daily_trade_analyses VALUES ('workspace', 'account', ?, ?, ?, 1, 'ready')").run(id, `${id}-v1`, `legacy-${id}`);
    database.prepare("INSERT INTO journal_round_trip_daily_trade_analysis_versions VALUES (?, 1, ?, 'ready')").run(`legacy-${id}`, `legacy-${id}-v1`);
    database.prepare("INSERT INTO journal_round_trip_daily_trade_analysis_event_snapshots VALUES (?, ?)").run(`legacy-${id}-v1`, JSON.stringify(snapshot));
  }
  for (const revision of [1, 2]) database.prepare("INSERT INTO journal_logical_trade_daily_analysis_versions VALUES ('analysis', ?, ?, ?, '[]', '[]')")
    .run(revision, `analysis-v${revision}`, JSON.stringify({ eventSnapshots: [snapshot] }));
  const input = { database,
    scope: { activeAccountId: "account", allowedAccountIds: ["account", "other"], workspaceId: "workspace", userId: "user", workspaceRole: "owner" },
    startDate: "2026-09-11", endDate: "2026-09-11", includePatterns: false,
    journalRows: ["one", "two"].map((id, index) => ({ roundTripId: id, closeLocalDate: index ? "2026-09-11" : "2026-09-10",
      entryLocalDate: index ? "2026-09-11" : "2026-09-10", selectedPnlDecimal: index ? "3" : "2", entryNotionalDecimal: "10", displayedSymbol: "TEST" })),
  } as unknown as Input;
  return { database, input, read: (overrides: Partial<Input> = {}) => readSavedPatternPopulation({ ...input, ...overrides }) };
}

test("SQL saved population counts grouped members once and reads only the current analysis revision", () => {
  const f = fixture();
  try {
    const result = f.read();
    assert.equal(result.eligibleDayTradeCount, 1);
    assert.equal(result.analyzedTradeCount, 1);
    assert.equal(result.trades[0].tradeId, "group");
    assert.equal(result.trades[0].analysisVersionId, "analysis-v2");
    assert.equal(result.trades[0].pnlDecimal, "5");
    assert.equal(result.trades[0].returnPercentDecimal, "25");
    assert.equal(result.trades[0].openedAtUtc, "2026-09-10T14:00:30Z");
    assert.equal(result.trades[0].closedAtUtc, "2026-09-11T15:00:00Z");
    assert.equal(f.read({ endDate: "2026-09-10", startDate: "2026-09-10" }).eligibleDayTradeCount, 0);
    assert.equal(f.read({ journalRows: f.input.journalRows.slice(1) }).eligibleDayTradeCount, 0);
    assert.equal(f.read({ scope: { ...f.input.scope, activeAccountId: "other" } }).eligibleDayTradeCount, 0);
    assert.equal(f.read({ scope: { ...f.input.scope, workspaceId: "other" } }).eligibleDayTradeCount, 0);
  } finally { f.database.close(); }
});

test("SQL grouped stale and pending results never fall back to ready member analyses", () => {
  const f = fixture();
  try {
    f.database.exec("UPDATE journal_logical_trade_daily_analyses SET status='pending'");
    assert.equal(f.read().analyzedTradeCount, 0);
    f.database.exec("UPDATE journal_logical_trade_daily_analyses SET status='ready'; UPDATE journal_active_logical_trade_memberships SET logical_trade_version_id='group-v2'; INSERT INTO journal_logical_trade_versions VALUES ('workspace', 'account', 'group-v2', 'day')");
    assert.equal(f.read().eligibleDayTradeCount, 1);
    assert.equal(f.read().analyzedTradeCount, 0);
    f.database.exec("DELETE FROM journal_logical_trade_daily_analyses");
    assert.equal(f.read().analyzedTradeCount, 0);
  } finally { f.database.close(); }
});

test("SQL standalone legacy fallback requires the current round-trip version and ready analysis revision", () => {
  const f = fixture();
  try {
    f.database.exec("DELETE FROM journal_active_logical_trade_memberships");
    const result = f.read();
    assert.equal(result.analyzedTradeCount, 1);
    assert.equal(result.trades[0].tradeId, "two");
    assert.equal(result.trades[0].analysisVersionId, "legacy-two-v1");
    f.database.exec("UPDATE journal_round_trip_daily_trade_analysis_versions SET status='failed' WHERE daily_trade_analysis_id='legacy-two'");
    assert.equal(f.read().analyzedTradeCount, 0);
    f.database.exec("UPDATE journal_round_trip_daily_trade_analysis_versions SET status='ready'; UPDATE journal_round_trip_daily_trade_analyses SET round_trip_version_id='obsolete' WHERE round_trip_id='two'");
    assert.equal(f.read().analyzedTradeCount, 0);
  } finally { f.database.close(); }
});

test("SQL saved population retains missing P/L without manufacturing a zero result", () => {
  const f = fixture();
  try {
    const result = f.read({ journalRows: f.input.journalRows.map((row, index) => index ? { ...row, selectedPnlDecimal: null } : row) });
    assert.equal(result.analyzedTradeCount, 1);
    assert.equal(result.trades[0].pnlDecimal, null);
    assert.equal(result.trades[0].returnPercentDecimal, null);
  } finally { f.database.close(); }
});
