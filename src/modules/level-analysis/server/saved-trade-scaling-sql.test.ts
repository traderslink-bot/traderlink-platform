import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import { readJournalProfitProtectionOutcome } from "../../journal/server/analytics/journal-profit-protection-outcome-service";
import { wholeTradeProfitProtection } from "./saved-trade-scaling";

type Scope = Parameters<typeof readJournalProfitProtectionOutcome>[1];
const scope = { workspaceId: "workspace", activeAccountId: "account", allowedAccountIds: ["account"], userId: "user", workspaceRole: "owner" } as unknown as Scope;

// Real allocation joins in disposable SQLite; not full schema/migration acceptance.
function fixture(short = false) {
  const db = new Database(":memory:");
  db.exec(`
CREATE TABLE journal_round_trips(workspace_id, account_id, round_trip_id, current_version_id, lifecycle_state);
CREATE TABLE journal_round_trip_versions(workspace_id, account_id, round_trip_version_id, projection_state, final_position_decimal, direction);
CREATE TABLE journal_round_trip_execution_allocations(workspace_id, account_id, round_trip_version_id, allocation_sequence, allocation_role, quantity_decimal, execution_version_id, allocation_id);
CREATE TABLE journal_execution_versions(workspace_id, account_id, execution_version_id, execution_id, quantity_decimal, price_decimal, side);
CREATE TABLE journal_executions(workspace_id, account_id, execution_id, current_version_id, current_state);
`);
  for (const member of ["one", "two"]) {
    db.prepare("INSERT INTO journal_round_trips VALUES ('workspace', 'account', ?, ?, 'active')").run(member, `${member}-v1`);
    db.prepare("INSERT INTO journal_round_trip_versions VALUES ('workspace', 'account', ?, 'ready_closed', '0', ?)").run(`${member}-v1`, short ? "short" : "long");
  }
  const fill = (member: string, sequence: number, role: string, quantity: string, price: string) => {
    const id = `${member}-${sequence}`, version = `${id}-v1`;
    db.prepare("INSERT INTO journal_round_trip_execution_allocations VALUES ('workspace', 'account', ?, ?, ?, ?, ?, ?)").run(`${member}-v1`, sequence, role, quantity, version, id);
    db.prepare("INSERT INTO journal_execution_versions VALUES ('workspace', 'account', ?, ?, ?, ?, ?)").run(version, id, quantity, price,
      role === "opening" || role === "adding" ? (short ? "sell" : "buy") : (short ? "buy" : "sell"));
    db.prepare("INSERT INTO journal_executions VALUES ('workspace', 'account', ?, ?, 'accepted')").run(id, version);
  };
  fill("one", 1, "opening", "10", short ? "2" : "1");
  fill("one", 2, "reducing", "5", short ? "1.6" : "1.4");
  fill("one", 3, "closing", "5", short ? "2.2" : "0.8");
  fill("two", 1, "opening", "10", "1");
  fill("two", 2, "closing", "10", short ? "0.5" : "1.5");
  const partial = { eventId: "one-2", executedAt: "2026-09-11T14:01:00Z", kind: "partial_exit" as const,
    metrics: { positionQuantityBefore: "10", positionQuantityAfter: "5" }, price: short ? "1.6" : "1.4", quantity: "5" };
  const read = (member: string, selectedScope = scope) => readJournalProfitProtectionOutcome(db, selectedScope, { events: [partial], roundTripId: member });
  return { db, read, partial };
}

for (const short of [false, true]) test(`SQL ${short ? "short" : "long"} member allocations support the exact whole saved-trade comparison`, () => {
  const f = fixture(short);
  try {
    const one = f.read("one"), two = f.read("two");
    assert.equal(one.status, "avoided_additional_loss");
    assert.ok("actualGrossResultDecimal" in one && one.actualGrossResultDecimal === "1");
    assert.equal(two.status, "comparison_unavailable");
    const whole = wholeTradeProfitProtection([one, two], "6");
    assert.deepEqual(whole, { status: "avoided_additional_loss", actualGrossResultDecimal: "6", counterfactualGrossResultDecimal: "3",
      avoidedAdditionalLossDecimal: "3", reductionPercentDecimal: "50", moneyBasis: "gross" });
  } finally { f.db.close(); }
});

test("SQL comparison rejects other accounts/workspaces, changed executions and mismatched snapshot facts", () => {
  const f = fixture();
  try {
    assert.equal(f.read("one", { ...scope, activeAccountId: "other", allowedAccountIds: ["other"] }).status, "comparison_unavailable");
    assert.equal(f.read("one", { ...scope, workspaceId: "other" }).status, "comparison_unavailable");
    assert.equal(readJournalProfitProtectionOutcome(f.db, scope, { roundTripId: "one", events: [{ ...f.partial, price: "1.5" }] }).status, "comparison_unavailable");
    f.db.exec("UPDATE journal_executions SET current_version_id='changed' WHERE execution_id='one-2'");
    assert.equal(f.read("one").status, "comparison_unavailable");
  } finally { f.db.close(); }
});

test("SQL comparison does not invent an allocation across later adds or incomplete quantities", () => {
  const f = fixture();
  try {
    f.db.exec("UPDATE journal_round_trip_execution_allocations SET allocation_role='adding' WHERE allocation_id='one-3'");
    assert.equal(f.read("one").status, "comparison_unavailable");
    f.db.exec("UPDATE journal_round_trip_execution_allocations SET allocation_role='closing', quantity_decimal='4' WHERE allocation_id='one-3'");
    assert.equal(f.read("one").status, "comparison_unavailable");
  } finally { f.db.close(); }
});
