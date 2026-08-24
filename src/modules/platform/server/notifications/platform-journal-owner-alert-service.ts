import type Database from "better-sqlite3";

import type { WorkspaceAccessScope, WorkspaceRole } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformOperatorRepository } from "@/src/modules/platform/server/administration/platform-operator-repository";
import { PlatformNotificationRepository } from "./platform-notification-repository";

function activeOwnerScope(database: Database.Database): WorkspaceAccessScope | null {
  const owner = new PlatformOperatorRepository(database).findActive();
  if (!owner) return null;
  const membership = database.prepare<[string], Readonly<{
    workspace_id: string;
    workspace_role: WorkspaceRole;
  }>>(`SELECT membership.workspace_id, membership.role AS workspace_role
FROM platform_workspace_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
WHERE membership.user_id = ? AND membership.status = 'active'
  AND membership.role = 'owner' AND user.status = 'active'
  AND workspace.status = 'active'
ORDER BY membership.joined_at_utc, membership.workspace_id
LIMIT 1`).get(owner.userId);
  if (!membership) return null;
  return Object.freeze({
    userId: owner.userId,
    workspaceId: membership.workspace_id,
    workspaceRole: membership.workspace_role,
    allowedAccountIds: Object.freeze([]),
    activeAccountId: null,
  });
}

/**
 * Sends an operational alert only after a broker import has reached its final
 * failure state. The standard notification queue provides idempotency and uses
 * the owner's already confirmed email address; this does not expose an address
 * or customer import data to the worker.
 */
export function notifyJournalOwnerOfBrokerImportFailure(input: Readonly<{
  database: Database.Database;
  occurredAt: Date;
  sourceEventKey: string;
}>): void {
  const scope = activeOwnerScope(input.database);
  if (!scope) return;
  const notifications = new PlatformNotificationRepository(input.database);
  const current = notifications.readPreferences(scope);
  if (!current.emailCategories.includes("broker_import")) {
    notifications.replaceEmailCategories({
      categories: Object.freeze([...current.emailCategories, "broker_import"]),
      scope,
      updatedAtUtc: createCanonicalUtcTimestamp(input.occurredAt),
    });
  }
  notifications.create({
    category: "broker_import",
    destinationPath: "/admin/journal/users?view=needs_attention",
    journalAccountId: null,
    kind: "broker_import_failed",
    occurredAtUtc: createCanonicalUtcTimestamp(input.occurredAt),
    scope,
    sourceEventKey: `journal_owner_${input.sourceEventKey}`,
    summary: "A broker import reached a final failure. Review the affected user in Journal Administration.",
    title: "Broker import needs attention",
  });
}
