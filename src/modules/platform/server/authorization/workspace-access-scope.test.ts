import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import { openPlatformDatabase } from "../database/open-platform-database";
import {
  createCanonicalUuidV4,
} from "../database/platform-migration-contract";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import { requireWorkspaceAccessScope } from "./require-workspace-access-scope";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): {
  database: Database.Database;
  users: PlatformUserRepository;
  workspaces: PlatformWorkspaceRepository;
  accounts: JournalAccountService;
  workspaceId: string;
  accountId: string;
  subjects: Record<"owner" | "admin" | "member", string>;
} {
  const root = mkdtempSync(join(tmpdir(), "traderlink-workspace-scope-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "scope.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database);
  const users = new PlatformUserRepository(database, { allowedAuthProviders: ["test"] });
  const workspaces = new PlatformWorkspaceRepository(database);
  const accounts = new JournalAccountService(new JournalAccountRepository(database));
  const now = "2026-08-01T12:00:00.000Z";
  const userIds = {
    owner: createCanonicalUuidV4(),
    admin: createCanonicalUuidV4(),
    member: createCanonicalUuidV4(),
  };
  const subjects = { owner: "owner-subject", admin: "admin-subject", member: "member-subject" };
  for (const role of ["owner", "admin", "member"] as const) {
    users.createUser({
      userId: userIds[role],
      authProvider: "test",
      authSubject: subjects[role],
      displayName: role,
      createdAtUtc: now,
      updatedAtUtc: now,
    });
  }
  const workspaceId = createCanonicalUuidV4();
  workspaces.createWorkspaceWithOwner({
    workspaceId,
    ownerUserId: userIds.owner,
    displayName: "Workspace",
    defaultTradingTimezone: "America/Toronto",
    createdAtUtc: now,
  });
  workspaces.insertMembership({
    workspaceId,
    userId: userIds.admin,
    role: "admin",
    createdByUserId: userIds.owner,
    createdAtUtc: now,
  });
  workspaces.insertMembership({
    workspaceId,
    userId: userIds.member,
    role: "member",
    createdByUserId: userIds.owner,
    createdAtUtc: now,
  });
  const account = accounts.createAccount(
    {
      userId: userIds.owner,
      workspaceId,
      workspaceRole: "owner",
      allowedAccountIds: [],
      activeAccountId: null,
    },
    {
      workspaceId,
      displayName: "Journal",
      baseCurrency: "USD",
      tradingTimezone: "America/Toronto",
    },
  );
  return { database, users, workspaces, accounts, workspaceId, accountId: account.accountId, subjects };
}

describe("requireWorkspaceAccessScope", () => {
  it.each(["owner", "admin"] as const)(
    "derives all active workspace accounts for an active %s",
    async (role) => {
      const context = setup();
      try {
        const scope = await requireWorkspaceAccessScope(
          {
            requestedWorkspaceId: context.workspaceId,
            requestedActiveAccountId: context.accountId,
          },
          {
            authenticate: () => ({ authProvider: "test", authSubject: context.subjects[role] }),
            users: context.users,
            workspaces: context.workspaces,
            journalAccounts: context.accounts,
          },
        );
        expect(scope.workspaceRole).toBe(role);
        expect(scope.allowedAccountIds).toEqual([context.accountId]);
        expect(scope.activeAccountId).toBe(context.accountId);
      } finally {
        context.database.close();
      }
    },
  );

  it("returns no accounts for members and denies their account selector", async () => {
    const context = setup();
    try {
      const dependencies = {
        authenticate: () => ({
          authProvider: "test",
          authSubject: context.subjects.member,
        }),
        users: context.users,
        workspaces: context.workspaces,
        journalAccounts: context.accounts,
      };
      const scope = await requireWorkspaceAccessScope(
        { requestedWorkspaceId: context.workspaceId },
        dependencies,
      );
      expect(scope.allowedAccountIds).toEqual([]);
      await expect(
        requireWorkspaceAccessScope(
          {
            requestedWorkspaceId: context.workspaceId,
            requestedActiveAccountId: context.accountId,
          },
          dependencies,
        ),
      ).rejects.toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    } finally {
      context.database.close();
    }
  });

  it("treats client workspace IDs only as selectors and denies non-members", async () => {
    const context = setup();
    try {
      await expect(
        requireWorkspaceAccessScope(
          { requestedWorkspaceId: createCanonicalUuidV4() },
          {
            authenticate: () => ({
              authProvider: "test",
              authSubject: context.subjects.owner,
            }),
            users: context.users,
            workspaces: context.workspaces,
            journalAccounts: context.accounts,
          },
        ),
      ).rejects.toThrowError("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    } finally {
      context.database.close();
    }
  });
});
