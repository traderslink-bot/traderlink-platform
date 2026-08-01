import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";

import { JournalAccountRepository } from "./journal-account-repository";
import { JournalAccountService } from "./journal-account-service";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): {
  database: Database.Database;
  repository: JournalAccountRepository;
  service: JournalAccountService;
  scopes: [WorkspaceAccessScope, WorkspaceAccessScope];
} {
  const root = mkdtempSync(join(tmpdir(), "traderlink-account-boundary-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "accounts.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database);
  const users = new PlatformUserRepository(database, { allowedAuthProviders: ["test"] });
  const workspaces = new PlatformWorkspaceRepository(database);
  const repository = new JournalAccountRepository(database);
  const service = new JournalAccountService(repository);
  const now = "2026-08-01T12:00:00.000Z";
  const scopes = [0, 1].map((index) => {
    const userId = createCanonicalUuidV4();
    const workspaceId = createCanonicalUuidV4();
    users.createUser({
      userId,
      authProvider: "test",
      authSubject: `owner-${index}`,
      displayName: `Owner ${index}`,
      createdAtUtc: now,
      updatedAtUtc: now,
    });
    workspaces.createWorkspaceWithOwner({
      workspaceId,
      ownerUserId: userId,
      displayName: `Workspace ${index}`,
      defaultTradingTimezone: "America/Toronto",
      createdAtUtc: now,
    });
    return {
      userId,
      workspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: [] as readonly string[],
      activeAccountId: null,
    };
  }) as [WorkspaceAccessScope, WorkspaceAccessScope];
  for (const [index, scope] of scopes.entries()) {
    const account = service.createAccount(scope, {
      workspaceId: scope.workspaceId,
      displayName: `Account ${index}`,
      baseCurrency: "USD",
      tradingTimezone: "America/Toronto",
    });
    scopes[index] = { ...scope, allowedAccountIds: [account.accountId] };
  }
  return { database, repository, service, scopes };
}

describe("Journal account workspace boundary", () => {
  it("binds both workspace and account on every account lookup", () => {
    const context = setup();
    try {
      const [first, second] = context.scopes;
      expect(
        context.repository.findActiveAccount(
          first.workspaceId,
          first.allowedAccountIds[0],
        )?.accountId,
      ).toBe(first.allowedAccountIds[0]);
      expect(
        context.repository.findActiveAccount(
          first.workspaceId,
          second.allowedAccountIds[0],
        ),
      ).toBeNull();
    } finally {
      context.database.close();
    }
  });

  it("denies cross-workspace account creation and narrowing", () => {
    const context = setup();
    try {
      const [first, second] = context.scopes;
      expect(() =>
        context.service.createAccount(first, {
          workspaceId: second.workspaceId,
          displayName: "Forbidden",
          baseCurrency: "USD",
          tradingTimezone: "America/Toronto",
        }),
      ).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      expect(() =>
        context.service.requireAccountScope(first, second.allowedAccountIds[0]),
      ).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    } finally {
      context.database.close();
    }
  });
});
