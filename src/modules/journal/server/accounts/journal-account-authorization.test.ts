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
  scopes: Record<"owner" | "admin" | "member" | "outsider", WorkspaceAccessScope>;
} {
  const root = mkdtempSync(join(tmpdir(), "traderlink-account-auth-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "authorization.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database);
  const users = new PlatformUserRepository(database, { allowedAuthProviders: ["test"] });
  const workspaces = new PlatformWorkspaceRepository(database);
  const repository = new JournalAccountRepository(database);
  const service = new JournalAccountService(repository);
  const now = "2026-08-01T12:00:00.000Z";
  const workspaceId = createCanonicalUuidV4();
  const ids = {
    owner: createCanonicalUuidV4(),
    admin: createCanonicalUuidV4(),
    member: createCanonicalUuidV4(),
    outsider: createCanonicalUuidV4(),
  };
  for (const [role, userId] of Object.entries(ids)) {
    users.createUser({
      userId,
      authProvider: "test",
      authSubject: role,
      displayName: role,
      createdAtUtc: now,
      updatedAtUtc: now,
    });
  }
  workspaces.createWorkspaceWithOwner({
    workspaceId,
    ownerUserId: ids.owner,
    displayName: "Workspace",
    defaultTradingTimezone: "America/Toronto",
    createdAtUtc: now,
  });
  workspaces.insertMembership({
    workspaceId,
    userId: ids.admin,
    role: "admin",
    createdByUserId: ids.owner,
    createdAtUtc: now,
  });
  workspaces.insertMembership({
    workspaceId,
    userId: ids.member,
    role: "member",
    createdByUserId: ids.owner,
    createdAtUtc: now,
  });
  const scopes = {
    owner: { userId: ids.owner, workspaceId, workspaceRole: "owner", allowedAccountIds: [], activeAccountId: null },
    admin: { userId: ids.admin, workspaceId, workspaceRole: "admin", allowedAccountIds: [], activeAccountId: null },
    member: { userId: ids.member, workspaceId, workspaceRole: "member", allowedAccountIds: [], activeAccountId: null },
    outsider: { userId: ids.outsider, workspaceId: createCanonicalUuidV4(), workspaceRole: "admin", allowedAccountIds: [], activeAccountId: null },
  } as const;
  return { database, repository, service, scopes };
}

describe("Journal account authorization", () => {
  it.each(["owner", "admin"] as const)(
    "allows same-workspace %s creation and records the authorized creator",
    (role) => {
      const context = setup();
      try {
        const account = context.service.createAccount(context.scopes[role], {
          workspaceId: context.scopes[role].workspaceId,
          displayName: `${role} account`,
          baseCurrency: "USD",
          tradingTimezone: "America/Toronto",
        });
        expect(account.createdByUserId).toBe(context.scopes[role].userId);
      } finally {
        context.database.close();
      }
    },
  );

  it("denies member and cross-workspace account creation", () => {
    const context = setup();
    try {
      for (const scope of [context.scopes.member, context.scopes.outsider]) {
        expect(() =>
          context.service.createAccount(scope, {
            workspaceId: context.scopes.owner.workspaceId,
            displayName: "Forbidden",
            baseCurrency: "USD",
            tradingTimezone: "America/Toronto",
          }),
        ).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
    } finally {
      context.database.close();
    }
  });

  it("denies members before evaluating any private source identity", () => {
    const context = setup();
    try {
      const account = context.service.createAccount(context.scopes.owner, {
        workspaceId: context.scopes.owner.workspaceId,
        displayName: "Owner account",
        baseCurrency: "USD",
        tradingTimezone: "America/Toronto",
      });
      expect(() =>
        context.service.confirmSourceIdentityLink(context.scopes.member, {
          accountId: account.accountId,
          sourceSystem: "ibkr",
          rawSourceAccountId: "private",
          privacySafeDisplay: "[redacted-account]",
        }),
      ).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    } finally {
      context.database.close();
    }
  });
});
