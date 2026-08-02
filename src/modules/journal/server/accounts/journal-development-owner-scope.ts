import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
  DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
} from "@/src/modules/platform/server/bootstrap/development-owner-seed-authorization";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAccountRepository } from "./journal-account-repository";

type DevelopmentOwnerRow = Readonly<{
  user_id: string;
  workspace_id: string;
}>;

type CountRow = Readonly<{ count: number }>;

export type DevelopmentOwnerJournalScope = Readonly<{
  scope: WorkspaceAccessScope;
  accountId: string;
}>;

export function requireSingleActivePlatformWorkspace(
  database: Database.Database,
): void {
  const row = database
    .prepare<[], CountRow>(`SELECT COUNT(*) AS count
FROM platform_workspaces
WHERE status = 'active'`)
    .get();
  if (row?.count !== 1) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED", {
      check: "active_workspace_cardinality",
    });
  }
}

export function deriveDevelopmentOwnerJournalScope(
  database: Database.Database,
  accounts = new JournalAccountRepository(database),
): DevelopmentOwnerJournalScope {
  requireSingleActivePlatformWorkspace(database);
  const owners = database
    .prepare<[string, string], DevelopmentOwnerRow>(`SELECT
  user.user_id, membership.workspace_id
FROM platform_users AS user
JOIN platform_workspace_memberships AS membership
  ON membership.user_id = user.user_id
JOIN platform_workspaces AS workspace
  ON workspace.workspace_id = membership.workspace_id
WHERE user.auth_provider = ? AND user.auth_subject = ?
  AND user.status = 'active'
  AND membership.role = 'owner' AND membership.status = 'active'
  AND workspace.status = 'active'
ORDER BY membership.workspace_id, user.user_id`)
    .all(
      DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
      DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
    );
  if (owners.length !== 1 || !owners[0]) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED", {
      check: "development_owner_cardinality",
    });
  }
  const owner = owners[0];
  const activeAccounts = accounts.listActiveAccounts(owner.workspace_id);
  if (activeAccounts.length !== 1 || !activeAccounts[0]) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED", {
      check: "active_journal_account_cardinality",
    });
  }
  const account = activeAccounts[0];
  return Object.freeze({
    accountId: account.accountId,
    scope: Object.freeze({
      userId: owner.user_id,
      workspaceId: owner.workspace_id,
      workspaceRole: "owner" as const,
      allowedAccountIds: Object.freeze([account.accountId]),
      activeAccountId: account.accountId,
    }),
  });
}
