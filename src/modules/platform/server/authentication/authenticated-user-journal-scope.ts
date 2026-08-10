import type Database from "better-sqlite3";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  resolveJournalAccountSelection,
  type JournalAccountSelectionRef,
} from "../../contracts/journal-account-selection";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { platformFailure } from "../database/platform-migration-contract";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";

type WorkspaceStatusRow = Readonly<{ status: "active" | "archived" }>;

export function deriveAuthenticatedUserJournalScope(
  database: Database.Database,
  userId: string,
  suppliedSelectionRef: JournalAccountSelectionRef | null = null,
): WorkspaceAccessScope {
  const memberships = new PlatformWorkspaceRepository(database)
    .listActiveMembershipsForUser(userId);
  if (memberships.length !== 1 || !memberships[0]) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED", {
      check: "active_workspace_membership_cardinality",
    });
  }
  const membership = memberships[0];
  const workspace = database.prepare<[string], WorkspaceStatusRow>(`SELECT status
FROM platform_workspaces WHERE workspace_id = ?`)
    .get(membership.workspaceId);
  if (workspace?.status !== "active") {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED", {
      check: "active_workspace",
    });
  }
  const accounts = new JournalAccountRepository(database)
    .listActiveAccounts(membership.workspaceId);
  if (accounts.length === 0) {
    return Object.freeze({
      userId,
      workspaceId: membership.workspaceId,
      workspaceRole: membership.role,
      allowedAccountIds: Object.freeze([]),
      activeAccountId: null,
    });
  }
  const selection = resolveJournalAccountSelection(membership.workspaceId, suppliedSelectionRef, accounts);
  return Object.freeze({
    userId,
    workspaceId: membership.workspaceId,
    workspaceRole: membership.role,
    allowedAccountIds: Object.freeze(accounts.map((account) => account.accountId)),
    activeAccountId: selection.accountId,
  });
}
