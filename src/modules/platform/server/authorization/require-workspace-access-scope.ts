import type { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";
import type { PlatformUserRepository } from "../identity/platform-user-repository";
import type { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";

export type AuthenticatedPlatformIdentity = Readonly<{
  authProvider: string;
  authSubject: string;
}>;

export async function requireWorkspaceAccessScope(
  selectors: Readonly<{
    requestedWorkspaceId?: string;
    requestedActiveAccountId?: string;
  }>,
  dependencies: Readonly<{
    authenticate: () =>
      | AuthenticatedPlatformIdentity
      | null
      | Promise<AuthenticatedPlatformIdentity | null>;
    users: PlatformUserRepository;
    workspaces: PlatformWorkspaceRepository;
    journalAccounts: JournalAccountService;
  }>,
): Promise<WorkspaceAccessScope> {
  const identity = await dependencies.authenticate();
  if (!identity) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  const user = dependencies.users.findActiveByAuthIdentity(
    identity.authProvider,
    identity.authSubject,
  );
  if (!user) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");

  const memberships = dependencies.workspaces.listActiveMembershipsForUser(user.userId);
  let membership;
  if (selectors.requestedWorkspaceId) {
    assertCanonicalUuidV4(selectors.requestedWorkspaceId, "requestedWorkspaceId");
    membership = memberships.find(
      (candidate) => candidate.workspaceId === selectors.requestedWorkspaceId,
    );
  } else if (memberships.length === 1) {
    membership = memberships[0];
  }
  if (!membership) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");

  const allowedAccountIds =
    membership.role === "member"
      ? []
      : [
          ...dependencies.journalAccounts.listActiveAccountIdsForWorkspace(
            membership.workspaceId,
          ),
        ].sort();
  let activeAccountId: string | null = null;
  if (selectors.requestedActiveAccountId) {
    assertCanonicalUuidV4(
      selectors.requestedActiveAccountId,
      "requestedActiveAccountId",
    );
    if (!allowedAccountIds.includes(selectors.requestedActiveAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    activeAccountId = selectors.requestedActiveAccountId;
  }

  return Object.freeze({
    userId: user.userId,
    workspaceId: membership.workspaceId,
    workspaceRole: membership.role,
    allowedAccountIds: Object.freeze(allowedAccountIds),
    activeAccountId,
  });
}
