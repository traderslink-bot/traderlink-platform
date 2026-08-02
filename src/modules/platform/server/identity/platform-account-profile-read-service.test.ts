import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import { openPlatformDatabase } from "../database/open-platform-database";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformUserRepository } from "./platform-user-repository";
import { PlatformWorkspaceRepository } from "./platform-workspace-repository";
import { PlatformAccountProfileReadService } from "./platform-account-profile-read-service";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Platform account profile read service", () => {
  it("returns only privacy-safe profile and allowed Journal account facts", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-account-profile-"));
    roots.push(root);
    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath: join(root, "profile.sqlite"),
      forbiddenRepositoryRoots: [],
    });
    try {
      runPlatformMigrations(database);
      const userId = createCanonicalUuidV4();
      const workspaceId = createCanonicalUuidV4();
      const now = "2026-08-02T12:00:00.000Z";
      new PlatformUserRepository(database, {
        allowedAuthProviders: ["development_local"],
      }).createUser({
        userId,
        authProvider: "development_local",
        authSubject: "private-local-subject",
        displayName: "TraderLink Owner",
        createdAtUtc: now,
        updatedAtUtc: now,
      });
      new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
        workspaceId,
        ownerUserId: userId,
        displayName: "Trading Workspace",
        defaultTradingTimezone: "America/New_York",
        createdAtUtc: now,
      });
      const account = new JournalAccountService(
        new JournalAccountRepository(database),
      ).createAccount({
        userId,
        workspaceId,
        workspaceRole: "owner",
        allowedAccountIds: [],
        activeAccountId: null,
      }, {
        workspaceId,
        displayName: "Primary Journal",
        baseCurrency: "USD",
        tradingTimezone: "America/New_York",
      });
      const profile = new PlatformAccountProfileReadService(database).get({
        userId,
        workspaceId,
        workspaceRole: "owner",
        allowedAccountIds: [account.accountId],
        activeAccountId: account.accountId,
      });
      expect(profile).toEqual({
        displayName: "TraderLink Owner",
        accessMode: "local_development",
        authenticationLabel: "Local development owner",
        workspace: {
          displayName: "Trading Workspace",
          role: "owner",
          defaultTradingTimezone: "America/New_York",
        },
        journalAccounts: [{
          selectionRef: expect.stringMatching(/^[0-9a-f]{64}$/u),
          displayName: "Primary Journal",
          baseCurrency: "USD",
          tradingTimezone: "America/New_York",
          active: true,
        }],
      });
      expect(JSON.stringify(profile)).not.toContain("private-local-subject");
      expect(JSON.stringify(profile)).not.toContain(userId);
      expect(JSON.stringify(profile)).not.toContain(account.accountId);
    } finally {
      database.close();
    }
  });
});
