// @vitest-environment node
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { PlatformSessionRepository } from "./platform-session-repository";
import { PlatformSessionService } from "./platform-session-service";

it("resolves an already valid session without waiting for activity housekeeping, then retries the touch", () => {
  const root = mkdtempSync(join(tmpdir(), "traderlink-session-contention-"));
  const db = new Database(join(root, "synthetic.sqlite"));
  db.pragma("journal_mode=WAL"); db.pragma("busy_timeout=5000");
  db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,display_name TEXT,status TEXT);
    CREATE TABLE platform_auth_identities(auth_provider TEXT,auth_subject TEXT,user_id TEXT,status TEXT);
    CREATE TABLE platform_auth_sessions(session_id TEXT PRIMARY KEY,user_id TEXT,auth_provider TEXT,auth_subject TEXT,
      client_label TEXT,token_sha256 TEXT,created_at_utc TEXT,expires_at_utc TEXT,last_seen_at_utc TEXT,revoked_at_utc TEXT);
    INSERT INTO platform_users VALUES('10000000-0000-4000-8000-000000000001','Synthetic','active');
    INSERT INTO platform_auth_identities VALUES('discord','synthetic_subject','10000000-0000-4000-8000-000000000001','active');`);
  const writer = new Database(db.name);
  try {
    let now = new Date("2026-11-19T10:00:00.000Z");
    const repository = new PlatformSessionRepository(db);
    const service = new PlatformSessionService(repository, {
      now: () => now, createId: () => "10000000-0000-4000-8000-000000000002",
      createToken: () => "C".repeat(43), ttlMs: 60 * 60 * 1000,
    });
    const { token, session } = service.createForIdentity({
      userId: "10000000-0000-4000-8000-000000000001", authProvider: "discord", authSubject: "synthetic_subject",
    });
    now = new Date("2026-11-19T10:06:00.000Z");
    writer.exec("BEGIN IMMEDIATE");
    const started = performance.now();
    expect(service.resolve(token)).toMatchObject({ lastSeenAtUtc: session.lastSeenAtUtc, expiresAtUtc: session.expiresAtUtc });
    expect(performance.now() - started).toBeLessThan(1000);
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);
    writer.exec("ROLLBACK");
    expect(service.resolve(token)).toMatchObject({ lastSeenAtUtc: now.toISOString(), expiresAtUtc: session.expiresAtUtc });
    expect(db.prepare("SELECT last_seen_at_utc FROM platform_auth_sessions").get()).toEqual({ last_seen_at_utc: now.toISOString() });
    now = new Date("2026-11-19T10:12:00.000Z");
    db.transaction(() => {
      // Existing identity mutation transactions must not acquire a nested writer.
      expect(service.resolve(token)?.lastSeenAtUtc).toBe("2026-11-19T10:06:00.000Z");
    }).immediate();
    writer.prepare("UPDATE platform_auth_identities SET status='revoked'").run();
    expect(service.resolve(token)).toBeNull();
    writer.prepare("UPDATE platform_auth_identities SET status='active'").run();
    expect(service.revoke(token)).toBe(true);
    expect(service.resolve(token)).toBeNull();
    expect(() => repository.tryTouchActiveSession({ sessionId: session.sessionId, timestamp: now.toISOString() })).toThrow("TRADERLINK_AUTH_SESSION_INVALID");
    writer.exec("UPDATE platform_auth_sessions SET revoked_at_utc=NULL; UPDATE platform_users SET status='disabled'");
    expect(service.resolve(token)).toBeNull();
    writer.exec("UPDATE platform_users SET status='active'");
    now = new Date(session.expiresAtUtc);
    expect(service.resolve(token)).toBeNull();
  } finally {
    if (writer.inTransaction) writer.exec("ROLLBACK");
    writer.close(); db.close(); rmSync(root, { recursive: true, force: true });
  }
});
