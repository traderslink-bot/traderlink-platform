import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { openPlatformDatabase } from "../database/open-platform-database";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformAuthenticationRepository } from "./platform-authentication-repository";

const roots: string[] = [];
const USER_ID = "10000000-0000-4000-8000-000000000001";
const OTHER_USER_ID = "10000000-0000-4000-8000-000000000002";
const NOW = "2026-08-02T12:00:00.000Z";

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function pathForTest(): string {
  const root = mkdtempSync(join(tmpdir(), "traderlink-auth-identity-"));
  roots.push(root);
  return join(root, "test.sqlite");
}

describe("PlatformAuthenticationRepository", () => {
  it("backfills the stable development identity and links Discord exactly", () => {
    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath: pathForTest(),
      forbiddenRepositoryRoots: [],
    });
    try {
      runPlatformMigrations(database, {
        manifest: platformMigrationManifest.slice(0, 11),
        now: () => new Date(NOW),
      });
      new PlatformUserRepository(database, {
        allowedAuthProviders: ["development_local"],
      }).createUser({
        userId: USER_ID,
        authProvider: "development_local",
        authSubject: "initial_owner",
        displayName: "Owner",
        createdAtUtc: NOW,
        updatedAtUtc: NOW,
      });
      runPlatformMigrations(database, { now: () => new Date(NOW) });
      const repository = new PlatformAuthenticationRepository(database);
      expect(
        repository.findActiveIdentity("development_local", "initial_owner"),
      ).toMatchObject({ userId: USER_ID, authProvider: "development_local" });
      expect(repository.findActiveIdentity("discord", "123456789")).toBeNull();
      expect(
        repository.linkIdentity({
          userId: USER_ID,
          authProvider: "discord",
          authSubject: "123456789",
          linkedByUserId: USER_ID,
          timestamp: NOW,
        }),
      ).toMatchObject({ userId: USER_ID, authProvider: "discord" });
      expect(repository.findActiveIdentity("discord", "123456789")?.userId)
        .toBe(USER_ID);
    } finally {
      database.close();
    }
  });

  it("rejects duplicate provider ownership without changing the original link", () => {
    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath: pathForTest(),
      forbiddenRepositoryRoots: [],
    });
    try {
      runPlatformMigrations(database, { now: () => new Date(NOW) });
      const users = new PlatformUserRepository(database, {
        allowedAuthProviders: ["development_local"],
      });
      for (const [userId, subject] of [
        [USER_ID, "first_owner"],
        [OTHER_USER_ID, "second_owner"],
      ] as const) {
        users.createUser({
          userId,
          authProvider: "development_local",
          authSubject: subject,
          displayName: subject,
          createdAtUtc: NOW,
          updatedAtUtc: NOW,
        });
      }
      const repository = new PlatformAuthenticationRepository(database);
      repository.linkIdentity({
        userId: USER_ID,
        authProvider: "discord",
        authSubject: "123456789",
        linkedByUserId: USER_ID,
        timestamp: NOW,
      });
      expect(() => repository.linkIdentity({
        userId: OTHER_USER_ID,
        authProvider: "discord",
        authSubject: "123456789",
        linkedByUserId: OTHER_USER_ID,
        timestamp: NOW,
      })).toThrowError("TRADERLINK_AUTH_IDENTITY_CONFLICT");
      expect(repository.findActiveIdentity("discord", "123456789")?.userId)
        .toBe(USER_ID);
    } finally {
      database.close();
    }
  });
});
