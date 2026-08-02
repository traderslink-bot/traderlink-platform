import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformAuthenticationRepository } from "./platform-authentication-repository";
import { PlatformSessionRepository } from "./platform-session-repository";
import { PlatformSessionService } from "./platform-session-service";

const roots: string[] = [];
const USER_ID = "10000000-0000-4000-8000-000000000001";
const SESSION_ID = "10000000-0000-4000-8000-000000000002";
const TOKEN = "C".repeat(43);

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("PlatformSessionService", () => {
  it("resolves, expires and revokes only hashed server-side sessions", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-platform-session-"));
    roots.push(root);
    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath: join(root, "test.sqlite"),
      forbiddenRepositoryRoots: [],
    });
    try {
      runPlatformMigrations(database, {
        now: () => new Date("2026-08-02T12:00:00.000Z"),
      });
      new PlatformUserRepository(database, { allowedAuthProviders: ["discord"] })
        .createUser({
          userId: USER_ID,
          authProvider: "discord",
          authSubject: "123456789012345678",
          displayName: "Trader",
          createdAtUtc: "2026-08-02T12:00:00.000Z",
          updatedAtUtc: "2026-08-02T12:00:00.000Z",
        });
      new PlatformAuthenticationRepository(database).linkIdentity({
        userId: USER_ID,
        authProvider: "discord",
        authSubject: "123456789012345678",
        linkedByUserId: USER_ID,
        timestamp: "2026-08-02T12:00:00.000Z",
      });
      let now = new Date("2026-08-02T12:00:00.000Z");
      const service = new PlatformSessionService(
        new PlatformSessionRepository(database),
        {
          now: () => now,
          createId: () => SESSION_ID,
          createToken: () => TOKEN,
          ttlMs: 60_000,
        },
      );
      expect(service.createForIdentity({
        userId: USER_ID,
        authProvider: "discord",
        authSubject: "123456789012345678",
      }).token).toBe(TOKEN);
      expect(service.resolve(TOKEN)).toMatchObject({
        userId: USER_ID,
        displayName: "Trader",
      });
      expect(service.resolve("invalid")).toBeNull();

      now = new Date("2026-08-02T12:01:00.000Z");
      expect(service.resolve(TOKEN)).toBeNull();
      now = new Date("2026-08-02T12:00:30.000Z");
      expect(service.revoke(TOKEN)).toBe(true);
      expect(service.resolve(TOKEN)).toBeNull();
      expect(service.revoke(TOKEN)).toBe(false);
    } finally {
      database.close();
    }
  });
});
