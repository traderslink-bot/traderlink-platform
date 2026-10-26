// @vitest-environment node
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import { PlatformSessionRepository } from "../authentication/platform-session-repository";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { deriveJournalAccountSelectionRef } from "../../contracts/journal-account-selection";
import { executeErasureCommand, type ErasureCommand } from "./platform-erasure-command";
import { platformErasureRecoverySchemaStatements } from "./platform-erasure-recovery-schema";
import type { ErasureObjectStore } from "./platform-erasure-recovery";

const timestamp = "2026-10-26T12:00:00.000Z";
const noObjects: ErasureObjectStore = {
  identity() { throw new Error("unexpected_artifact"); }, verify() { throw new Error("unexpected_artifact"); },
  exists() { throw new Error("unexpected_artifact"); }, purge() { throw new Error("unexpected_artifact"); }, syncDirectory() {},
};
const templates = new Map<boolean, Buffer>();
function fixture(combined = false, sibling = false) {
  if (!templates.has(combined)) {
    const template = new Database(":memory:");
    try {
      template.pragma("foreign_keys=ON");
      const migrationResult = runPlatformMigrations(template, { manifest: combined ? platformMigrationManifest : platformMigrationManifest.filter((m) => m.executionOrder <= 189) });
      if (!combined) {
        expect(migrationResult.appliedMigrationIds.length).toBe(146);
        // Reproduced independently from immutable production760 source on the
        // VPS native driver. This is not a claim about the hosted DB's digest.
        expect(migrationResult.finalSchemaSha256).toBe("45e694d19e9349c2f92bf7f70c19804d3c4216373c0ee3e7179ac439a846165d");
      }
      for (const sql of platformErasureRecoverySchemaStatements) template.exec(sql);
      templates.set(combined, template.serialize());
    } finally { template.close(); }
  }
  const db = new Database(templates.get(combined)!);
  db.pragma("foreign_keys=ON");
  const users = new PlatformUserRepository(db, { allowedAuthProviders: ["development_local"] });
  const workspaces = new PlatformWorkspaceRepository(db);
  const accounts = new JournalAccountRepository(db);
  const addOwner = (name: string) => {
    const userId = randomUUID(), workspaceId = randomUUID(), accountId = randomUUID();
    users.createUser({ userId, authProvider: "development_local", authSubject: name,
      displayName: name, createdAtUtc: timestamp, updatedAtUtc: timestamp });
    workspaces.createWorkspaceWithOwner({ workspaceId, ownerUserId: userId,
      displayName: name, defaultTradingTimezone: "America/Toronto", createdAtUtc: timestamp });
    accounts.createAccount({ accountId, workspaceId, displayName: "Synthetic Journal", baseCurrency: "CAD",
      tradingTimezone: "America/Toronto", status: "active", createdByUserId: userId,
      createdAtUtc: timestamp, updatedAtUtc: timestamp });
    return { userId, workspaceId, accountId };
  };
  const owner = addOwner("synthetic_target"), other = addOwner("synthetic_other");
  const siblingId = randomUUID();
  if (sibling) accounts.createAccount({ accountId: siblingId, workspaceId: owner.workspaceId,
    displayName: "Synthetic sibling", baseCurrency: "CAD", tradingTimezone: "America/Toronto",
    status: "active", createdByUserId: owner.userId, createdAtUtc: timestamp, updatedAtUtc: timestamp });
  const command: ErasureCommand = {
    action: "trade_tracker_account", sessionId: null, mode: "local_development", demoReturnSelection: null,
    expectedAccountSelectionRef: deriveJournalAccountSelectionRef(owner.workspaceId, owner.accountId),
    scope: { userId: owner.userId, workspaceId: owner.workspaceId, workspaceRole: "owner",
      activeAccountId: owner.accountId, allowedAccountIds: sibling ? [owner.accountId, siblingId] : [owner.accountId] },
  };
  const demo = () => {
    const packId = randomUUID();
    db.prepare("INSERT INTO journal_demo_pack_versions VALUES(?,?,?,?,?,?,?)")
      .run(packId, "synthetic_pack", 1, "a".repeat(64), "b".repeat(64), "synthetic_v1", timestamp);
    db.prepare("INSERT INTO journal_demo_accounts VALUES(?,?,?,?,?)")
      .run(owner.workspaceId, owner.accountId, packId, owner.userId, timestamp);
  };
  const invariant = () => {
    expect(Boolean(accounts.findActiveAccount(other.workspaceId, other.accountId))).toBe(true);
    expect(db.pragma("foreign_key_check")).toEqual([]);
    expect(db.prepare("SELECT 1 FROM platform_erasure_operations WHERE active_slot=1").get()).toBeUndefined();
  };
  const completedHistory = (action: string) => {
    const row = db.prepare("SELECT member_user_id,member_display_name,action,phase FROM platform_erasure_history").get() as
      { member_user_id: string; member_display_name: string; action: string; phase: string };
    expect(row.member_user_id === owner.userId).toBe(true);
    expect(row.member_display_name).toBe("synthetic_target");
    expect(row.action).toBe(action); expect(row.phase).toBe("complete");
  };
  const googleSession = (expired = false) => {
    const sessionId = randomUUID();
    const created = new Date(Date.now() - (expired ? 2 * 60 * 60_000 : 1000)).toISOString();
    db.prepare(`INSERT INTO platform_auth_identities(user_id,auth_provider,auth_subject,status,linked_by_user_id,
      created_at_utc,updated_at_utc,last_authenticated_at_utc) VALUES(?,'google','synthetic_google','active',?,?,?,?)`)
      .run(owner.userId, owner.userId, created, created, created);
    new PlatformSessionRepository(db).createSession({ sessionId, userId: owner.userId, authProvider: "google",
      authSubject: "synthetic_google", clientLabel: null, tokenSha256: "c".repeat(64), createdAtUtc: created,
      expiresAtUtc: new Date(Date.now() + (expired ? -60 * 60_000 : 60 * 60_000)).toISOString() });
    return sessionId;
  };
  return { db, command, owner, other, accounts, siblingId, demo, invariant, completedHistory, googleSession };
}

describe.each([false, true])("all erasure actions, combined manifest=%s", (combined) => {
  beforeAll(() => { const f = fixture(combined); f.db.close(); }, 20_000);
  it("deletes the selected account and preserves sibling and unrelated owner", () => {
    const f = fixture(combined, true);
    try {
      const result = executeErasureCommand(f.db, noObjects, f.command);
      expect(result.nextSelectionRef).toBeNull();
      expect(Boolean(f.accounts.findActiveAccount(f.owner.workspaceId, f.owner.accountId))).toBe(false);
      expect(Boolean(f.accounts.findActiveAccount(f.owner.workspaceId, f.siblingId))).toBe(true);
      f.completedHistory("trade_tracker_account");
      f.invariant();
    } finally { f.db.close(); }
  });
  it("clears demo lifecycle and creates one replacement with preserved currency/timezone", () => {
    const f = fixture(combined); f.demo();
    try {
      const command = { ...f.command, action: "demo_trade_tracker_account" as const };
      const result = executeErasureCommand(f.db, noObjects, command);
      const accounts = f.accounts.listActiveAccounts(f.owner.workspaceId);
      expect(accounts.length).toBe(1);
      expect(accounts[0]?.displayName).toBe("Primary Journal");
      expect(accounts[0]?.baseCurrency).toBe("CAD");
      expect(accounts[0]?.tradingTimezone).toBe("America/Toronto");
      expect(Boolean(result.nextSelectionRef)).toBe(true);
      expect(() => executeErasureCommand(f.db, noObjects, command)).toThrow();
      expect(f.accounts.listActiveAccounts(f.owner.workspaceId).length).toBe(1);
      expect(f.db.prepare("SELECT lifecycle_state FROM journal_demo_lifecycle").get()).toEqual({ lifecycle_state: "cleared" });
      f.completedHistory("demo_trade_tracker_account");
      f.invariant();
    } finally { f.db.close(); }
  });
  it("returns to the sibling after demo erasure without creating another account", () => {
    const f = fixture(combined, true); f.demo();
    try {
      const selection = deriveJournalAccountSelectionRef(f.owner.workspaceId, f.siblingId);
      const result = executeErasureCommand(f.db, noObjects, { ...f.command,
        action: "demo_trade_tracker_account", demoReturnSelection: selection });
      expect(result.nextSelectionRef === selection).toBe(true);
      expect(f.accounts.listActiveAccounts(f.owner.workspaceId).length).toBe(1);
      f.completedHistory("demo_trade_tracker_account");
      f.invariant();
    } finally { f.db.close(); }
  });
  it("erases the whole authorized user/workspace without erasing the unrelated owner", () => {
    const f = fixture(combined, true);
    try {
      executeErasureCommand(f.db, noObjects, { ...f.command, action: "traderlink_account" });
      expect(f.db.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(f.owner.userId)).toBeUndefined();
      expect(f.db.prepare("SELECT 1 FROM platform_workspaces WHERE workspace_id=?").get(f.owner.workspaceId)).toBeUndefined();
      f.completedHistory("traderlink_account");
      f.invariant();
    } finally { f.db.close(); }
  });
  it("refuses stale selection, stale session and forged workspace before deleting anything", () => {
    const f = fixture(combined);
    try {
      expect(() => executeErasureCommand(f.db, noObjects, { ...f.command, expectedAccountSelectionRef: "f".repeat(64) })).toThrow();
      expect(() => executeErasureCommand(f.db, noObjects, { ...f.command, mode: "platform_session", sessionId: randomUUID() })).toThrow();
      expect(() => executeErasureCommand(f.db, noObjects, { ...f.command, scope: { ...f.command.scope, workspaceId: f.other.workspaceId } })).toThrow();
      expect(Boolean(f.accounts.findActiveAccount(f.owner.workspaceId, f.owner.accountId))).toBe(true);
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM platform_erasure_history").get()).toEqual({ n: 0 });
      f.invariant();
    } finally { f.db.close(); }
  });
  it("revalidates a real synthetic public-provider session and records its admitted deletion", () => {
    const f = fixture(combined);
    try {
      const sessionId = f.googleSession();
      executeErasureCommand(f.db, noObjects, { ...f.command, mode: "platform_session", sessionId });
      f.completedHistory("trade_tracker_account"); f.invariant();
    } finally { f.db.close(); }
  });
  it.each(["expired", "revoked", "identity_revoked"])("rejects a real %s session/identity without admitted history", (state) => {
    const f = fixture(combined);
    try {
      const sessionId = f.googleSession(state === "expired");
      if (state === "revoked") f.db.prepare("UPDATE platform_auth_sessions SET revoked_at_utc=? WHERE session_id=?").run(new Date().toISOString(), sessionId);
      if (state === "identity_revoked") f.db.prepare("UPDATE platform_auth_identities SET status='revoked',updated_at_utc=? WHERE auth_provider='google'").run(new Date().toISOString());
      expect(() => executeErasureCommand(f.db, noObjects, { ...f.command, mode: "platform_session", sessionId })).toThrow();
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM platform_erasure_history").get()).toEqual({ n: 0 });
      expect(Boolean(f.accounts.findActiveAccount(f.owner.workspaceId, f.owner.accountId))).toBe(true);
    } finally { f.db.close(); }
  });
  it("rolls back roots, job rows and delete guards on an unrelated integrity failure", () => {
    const f = fixture(combined);
    try {
      const guards = () => f.db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='trigger' AND sql LIKE '%BEFORE DELETE%' ORDER BY name").all();
      const originalGuards = guards();
      f.db.pragma("foreign_keys=OFF");
      f.db.exec("CREATE TABLE synthetic_unrelated_orphan(id INTEGER PRIMARY KEY,missing_root TEXT REFERENCES journal_accounts(account_id)); INSERT INTO synthetic_unrelated_orphan VALUES(1,'missing');");
      f.db.pragma("foreign_keys=ON");
      expect(() => executeErasureCommand(f.db, noObjects, f.command)).toThrow();
      expect(Boolean(f.accounts.findActiveAccount(f.owner.workspaceId, f.owner.accountId))).toBe(true);
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM synthetic_unrelated_orphan").get()).toEqual({ n: 1 });
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM platform_erasure_operations").get()).toEqual({ n: 0 });
      expect(f.db.prepare("SELECT phase FROM platform_erasure_history").get()).toEqual({ phase: "not_deleted" });
      expect(guards()).toEqual(originalGuards);
    } finally { f.db.close(); }
  });
});
