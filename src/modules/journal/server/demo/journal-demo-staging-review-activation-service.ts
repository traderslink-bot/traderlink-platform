import type Database from "better-sqlite3";

import {
  deriveJournalAccountSelectionRef,
  type JournalAccountSelectionRef,
} from "@/src/modules/platform/contracts/journal-account-selection";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import { JournalDemoAccountActivationService } from "./journal-demo-account-activation-service";

type ActiveOwnerMembershipRow = Readonly<{ role: "owner" | "admin" | "member" }>;
type ActiveWorkspaceRow = Readonly<{ default_trading_timezone: string }>;

export type JournalDemoStagingReviewActivationResult = Readonly<{
  selectionRef: JournalAccountSelectionRef | null;
  state: "materialized" | "unavailable";
}>;

/**
 * This adapter is limited to the authenticated owner's current workspace. It
 * delegates every write to the normal checksum-gated demo materializer.
 */
export class JournalDemoStagingReviewActivationService {
  constructor(private readonly database: Database.Database) {}

  activateForCurrentOwner(input: Readonly<{
    administratorUserId: string;
    scope: WorkspaceAccessScope;
  }>): JournalDemoStagingReviewActivationResult {
    if (
      input.administratorUserId !== input.scope.userId ||
      input.scope.workspaceRole !== "owner"
    ) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    }

    const membership = this.database.prepare<[string, string], ActiveOwnerMembershipRow>(`SELECT role
FROM platform_workspace_memberships
WHERE workspace_id = ? AND user_id = ? AND status = 'active'`)
      .get(input.scope.workspaceId, input.scope.userId);
    if (membership?.role !== "owner") {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    }

    const workspace = this.database.prepare<[string], ActiveWorkspaceRow>(`SELECT default_trading_timezone
FROM platform_workspaces
WHERE workspace_id = ? AND status = 'active'`)
      .get(input.scope.workspaceId);
    if (
      !workspace ||
      workspace.default_trading_timezone.trim() !== workspace.default_trading_timezone ||
      workspace.default_trading_timezone.length < 1 ||
      workspace.default_trading_timezone.length > 64
    ) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    }

    const activation = new JournalDemoAccountActivationService(this.database)
      .activateForNewWorkspace({
        baseCurrency: "USD",
        tradingTimezone: workspace.default_trading_timezone,
        userId: input.scope.userId,
        workspaceId: input.scope.workspaceId,
      });
    if (!activation.accountId) {
      return Object.freeze({ selectionRef: null, state: "unavailable" });
    }
    return Object.freeze({
      selectionRef: deriveJournalAccountSelectionRef(
        input.scope.workspaceId,
        activation.accountId,
      ),
      state: "materialized",
    });
  }
}
