import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import { PlatformUserRepository } from "../identity/platform-user-repository";
import {
  assertCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "./platform-migration-contract";
import { openPlatformDatabase } from "./open-platform-database";
import { runPlatformMigrations } from "./run-platform-migrations";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function database(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-storage-validation-"));
  roots.push(root);
  const db = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "storage.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(db);
  return db;
}

describe("platform storage validation", () => {
  it.each([
    "550E8400-E29B-41D4-A716-446655440000",
    "550e8400e29b-41d4-a716-446655440000",
    "550e8400-e29b-11d4-a716-446655440000",
    "550e8400-e29b-41d4-c716-446655440000",
    "550e8400-e29b-41d4-a716-446655440000-extra",
  ])("rejects malformed UUID-v4 value %s", (userId) => {
    const db = database();
    try {
      expect(() =>
        db
          .prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'test', 'subject', 'User', 'active', ?, ?)`)
          .run(userId, "2026-08-01T12:00:00.000Z", "2026-08-01T12:00:00.000Z"),
      ).toThrow();
    } finally {
      db.close();
    }
  });

  it.each([
    "202X-08-01T12:00:00.000Z",
    "2026-08-01T12:00:00Z",
    "2026-08-01T12:00:00.000+00:00",
    "2026-02-30T12:00:00.000Z",
  ])("rejects noncanonical or impossible UTC timestamp %s", (timestamp) => {
    expect(() => assertCanonicalUtcTimestamp(timestamp, "timestamp")).toThrowError(
      "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",
    );
  });

  it("keeps auth provider server-controlled and auth subject provider-exact", () => {
    const db = database();
    try {
      const users = new PlatformUserRepository(db, { allowedAuthProviders: ["discord"] });
      const userId = createCanonicalUuidV4();
      users.createUser({
        userId,
        authProvider: "discord",
        authSubject: " Exact Subject ",
        displayName: "Owner",
        createdAtUtc: "2026-08-01T12:00:00.000Z",
        updatedAtUtc: "2026-08-01T12:00:00.000Z",
      });
      expect(users.findActiveByAuthIdentity("discord", " Exact Subject ")?.userId).toBe(
        userId,
      );
      expect(users.findActiveByAuthIdentity("discord", "exact subject")).toBeNull();
      expect(() => users.findActiveByAuthIdentity("client_supplied", "subject")).toThrowError(
        "TRADERLINK_WORKSPACE_ACCESS_DENIED",
      );
    } finally {
      db.close();
    }
  });
});
