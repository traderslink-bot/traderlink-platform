import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import {
  DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
  DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
} from "@/src/modules/platform/server/bootstrap/development-owner-seed-authorization";
import { JournalAccountRepository } from "./journal-account-repository";
import { JournalAccountService } from "./journal-account-service";
import {
  deriveAllDevelopmentOwnerJournalScopes,
  deriveDevelopmentOwnerJournalScope,
  deriveDevelopmentOwnerJournalScopeForAccount,
  deriveSoleDevelopmentOwnerJournalScope,
} from "./journal-development-owner-scope";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
const ACCOUNT_A_ID = "33333333-3333-4333-8333-333333333333";
const ACCOUNT_B_ID = "44444444-4444-4444-8444-444444444444";

describe("development owner Journal scope", () => {
  it("authorizes all active accounts and resolves only an allowed opaque selection", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-development-scope-"));
    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath: join(root, "scope.sqlite"),
      forbiddenRepositoryRoots: [],
    });
    try {
      runPlatformMigrations(database);
      const timestamp = "2026-08-02T12:00:00.000Z";
      new PlatformUserRepository(database, {
        allowedAuthProviders: [DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER],
      }).createUser({
        userId: USER_ID,
        authProvider: DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
        authSubject: DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
        displayName: "Local owner",
        createdAtUtc: timestamp,
        updatedAtUtc: timestamp,
      });
      new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
        workspaceId: WORKSPACE_ID,
        ownerUserId: USER_ID,
        displayName: "Workspace",
        defaultTradingTimezone: "America/New_York",
        createdAtUtc: timestamp,
      });
      const accounts = new JournalAccountService(new JournalAccountRepository(database));
      const creationScope = {
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        workspaceRole: "owner" as const,
        allowedAccountIds: [] as readonly string[],
        activeAccountId: null,
      };
      for (const [accountId, displayName] of [
        [ACCOUNT_B_ID, "Second"],
        [ACCOUNT_A_ID, "First"],
      ] as const) {
        accounts.createAccount(creationScope, {
          workspaceId: WORKSPACE_ID,
          accountId,
          displayName,
          baseCurrency: "USD",
          tradingTimezone: "America/New_York",
        });
      }

      const fallback = deriveDevelopmentOwnerJournalScope(database);
      expect(fallback).toMatchObject({
        accountId: ACCOUNT_A_ID,
        scope: {
          allowedAccountIds: [ACCOUNT_A_ID, ACCOUNT_B_ID],
          activeAccountId: ACCOUNT_A_ID,
        },
      });
      const selected = deriveDevelopmentOwnerJournalScope(
        database,
        undefined,
        deriveJournalAccountSelectionRef(WORKSPACE_ID, ACCOUNT_B_ID),
      );
      expect(selected.accountId).toBe(ACCOUNT_B_ID);
      expect(selected.scope.activeAccountId).toBe(ACCOUNT_B_ID);
      expect(deriveDevelopmentOwnerJournalScopeForAccount(database, ACCOUNT_B_ID))
        .toMatchObject({ accountId: ACCOUNT_B_ID });
      expect(deriveAllDevelopmentOwnerJournalScopes(database).map((entry) =>
        entry.accountId)).toEqual([ACCOUNT_A_ID, ACCOUNT_B_ID]);
      expect(() => deriveDevelopmentOwnerJournalScope(
        database,
        undefined,
        "f".repeat(64),
      )).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      expect(() => deriveSoleDevelopmentOwnerJournalScope(database))
        .toThrowError("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED");

      database.prepare(`UPDATE journal_accounts
SET status = 'archived', updated_at_utc = ?
WHERE account_id = ?`).run("2099-08-02T13:00:00.000Z", ACCOUNT_B_ID);
      expect(() => deriveDevelopmentOwnerJournalScope(
        database,
        undefined,
        deriveJournalAccountSelectionRef(WORKSPACE_ID, ACCOUNT_B_ID),
      )).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    } finally {
      database.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
