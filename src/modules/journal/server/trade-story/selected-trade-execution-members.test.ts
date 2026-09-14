import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { selectedTradeExecutionMembers, selectedTradeExecutions } from "./selected-trade-execution-members";

const scope = { workspaceId: "w", accountId: "a", userId: "u", workspaceRole: "owner" as const };
function fixture() {
  const db = new Database(":memory:");
  db.exec(`
CREATE TABLE journal_logical_trades(workspace_id,account_id,logical_trade_id,current_version_id,lifecycle_state);
CREATE TABLE journal_active_logical_trade_memberships(workspace_id,account_id,logical_trade_id,logical_trade_version_id,round_trip_id);
CREATE TABLE journal_logical_trade_version_members(workspace_id,account_id,logical_trade_id,logical_trade_version_id,round_trip_id,round_trip_version_id,member_sequence);
CREATE TABLE journal_round_trips(workspace_id,account_id,round_trip_id,current_version_id,lifecycle_state);
INSERT INTO journal_logical_trades VALUES('w','a','group','gv','active');
INSERT INTO journal_round_trips VALUES('w','a','first','v1','active'),('w','a','second','v2','active'),('w','a','single','v3','active');
INSERT INTO journal_active_logical_trade_memberships VALUES('w','a','group','gv','first'),('w','a','group','gv','second');
INSERT INTO journal_logical_trade_version_members VALUES('w','a','group','gv','first','v1',1),('w','a','group','gv','second','v2',2);
`);
  return db;
}
describe("selected trade execution membership", () => {
  it.each(["group", "first", "second"])("resolves whole current membership from %s", (id) => {
    const db = fixture();
    try { expect(db.transaction(() => selectedTradeExecutionMembers(db, scope, id))()).toEqual({ selectionId: id, memberIds: ["first", "second"] }); }
    finally { db.close(); }
  });
  it("preserves a standalone trade and requires transaction", () => {
    const db = fixture();
    try {
      expect(db.transaction(() => selectedTradeExecutionMembers(db, scope, "single"))().memberIds).toEqual(["single"]);
      expect(() => selectedTradeExecutionMembers(db, scope, "first")).toThrow();
    } finally { db.close(); }
  });
  it.each([
    "DELETE FROM journal_round_trips WHERE round_trip_id='second'",
    "UPDATE journal_round_trips SET current_version_id='changed' WHERE round_trip_id='second'",
    "DELETE FROM journal_active_logical_trade_memberships WHERE round_trip_id='second'",
    "UPDATE journal_active_logical_trade_memberships SET logical_trade_version_id='old' WHERE round_trip_id='second'",
    "UPDATE journal_logical_trades SET lifecycle_state='review_required'",
    "UPDATE journal_round_trips SET lifecycle_state='deleted' WHERE round_trip_id='second'",
    "INSERT INTO journal_active_logical_trade_memberships VALUES('w','a','group','gv','extra')",
  ])("rejects inconsistent selection without falling back to its first member: %s", (sql) => {
    const db = fixture();
    try { db.exec(sql); expect(() => db.transaction(() => selectedTradeExecutionMembers(db, scope, "first"))()).toThrow(); }
    finally { db.close(); }
  });
  it("isolates accounts and workspaces", () => {
    const db = fixture();
    try {
      for (const foreign of [{ ...scope, accountId: "other" }, { ...scope, workspaceId: "other" }]) {
        expect(() => db.transaction(() => selectedTradeExecutionMembers(db, foreign, "group"))()).toThrow();
        expect(() => db.transaction(() => selectedTradeExecutionMembers(db, foreign, "single"))()).toThrow();
      }
    } finally { db.close(); }
  });
  it("uses the revised trade after an intentional membership edit, not its old members", () => {
    const db = fixture();
    try {
      db.exec(`UPDATE journal_logical_trades SET current_version_id='gv2';
INSERT INTO journal_logical_trade_version_members VALUES('w','a','group','gv2','first','v1',1);
UPDATE journal_active_logical_trade_memberships SET logical_trade_version_id='gv2' WHERE round_trip_id='first';
DELETE FROM journal_active_logical_trade_memberships WHERE round_trip_id='second';`);
      expect(db.transaction(() => selectedTradeExecutionMembers(db, scope, "first"))().memberIds).toEqual(["first"]);
      expect(db.transaction(() => selectedTradeExecutionMembers(db, scope, "second"))().memberIds).toEqual(["second"]);
    } finally { db.close(); }
  });
  it("keeps separate fills and split allocations in chronological then member order", () => {
    const selection = { selectionId: "group", memberIds: ["first", "second"] };
    const rows = [
      { round_trip_id: "second", execution_id: "split", quantity: "30", executed_at_utc: "10:02" },
      { round_trip_id: "first", execution_id: "split", quantity: "20", executed_at_utc: "10:02" },
      { round_trip_id: "first", execution_id: "fill1", quantity: "50", executed_at_utc: "10:01" },
      { round_trip_id: "first", execution_id: "fill2", quantity: "50", executed_at_utc: "10:01" },
      { round_trip_id: "unrelated", execution_id: "other", quantity: "9", executed_at_utc: "09:00" },
    ];
    expect(selectedTradeExecutions(selection, rows)).toEqual([rows[2], rows[3], rows[1], rows[0]]);
    expect(rows[0]!.quantity).toBe("30");
  });
});
