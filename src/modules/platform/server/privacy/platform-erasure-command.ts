import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { resolveJournalAccountSelection, type JournalAccountSelectionRef } from "../../contracts/journal-account-selection";
import { requireExpectedJournalAccountSelection } from "../authentication/journal-account-selection-authorization";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { platformFailure } from "../database/platform-migration-contract";
import { PlatformErasureService } from "./platform-erasure-service";
import { erasureTargetBinding, PlatformErasureRecovery, type ErasureAction, type ErasureObjectStore } from "./platform-erasure-recovery";
import { observeErasurePhase } from "./platform-erasure-observability";
import { PlatformErasureHistory } from "./platform-erasure-history";

export type ErasureCommand = Readonly<{
  action: ErasureAction;
  scope: WorkspaceAccessScope;
  sessionId: string | null;
  mode: "platform_session" | "local_development";
  expectedAccountSelectionRef: unknown;
  demoReturnSelection: JournalAccountSelectionRef | null;
}>;
export type ErasureCompletion = Readonly<{ nextSelectionRef: JournalAccountSelectionRef | null; historyBatchFull?: boolean }>;

function requireAdmittedMember(database: Database.Database, command: ErasureCommand): string {
  const scope = command.scope;
  const membership = database.prepare<[string, string], { display_name: string }>(`SELECT user.display_name FROM platform_workspace_memberships member
    JOIN platform_users user ON user.user_id=member.user_id
    JOIN platform_workspaces workspace ON workspace.workspace_id=member.workspace_id
    WHERE member.workspace_id=? AND member.user_id=? AND member.role='owner'
      AND member.status='active' AND user.status='active' AND workspace.status='active'`)
    .get(scope.workspaceId, scope.userId);
  if (!membership || scope.workspaceRole !== "owner") platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  if (command.mode === "platform_session") {
    const session = database.prepare(`SELECT 1 FROM platform_auth_sessions session
      JOIN platform_auth_identities identity ON identity.user_id=session.user_id
        AND identity.auth_provider=session.auth_provider AND identity.auth_subject=session.auth_subject
      WHERE session.session_id=? AND session.user_id=? AND session.revoked_at_utc IS NULL
        AND session.expires_at_utc>? AND identity.status='active'
        AND session.auth_provider IN ('discord','google','email')`)
      .get(command.sessionId, scope.userId, new Date().toISOString());
    if (!session) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  } else if (command.mode !== "local_development" || command.sessionId !== null || process.env.NODE_ENV === "production") {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  if (command.action === "traderlink_account") {
    const userMembers = database.prepare("SELECT COUNT(*) AS n FROM platform_workspace_memberships WHERE user_id=?").get(scope.userId) as { n: number };
    const workspaceMembers = database.prepare("SELECT COUNT(*) AS n FROM platform_workspace_memberships WHERE workspace_id=?").get(scope.workspaceId) as { n: number };
    if (userMembers.n !== 1 || workspaceMembers.n !== 1) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  } else {
    const accounts = new JournalAccountRepository(database).listActiveAccounts(scope.workspaceId);
    const freshScope = { ...scope, allowedAccountIds: accounts.map((account) => account.accountId) };
    requireExpectedJournalAccountSelection(freshScope, command.expectedAccountSelectionRef);
    if (!accounts.some((account) => account.accountId === scope.activeAccountId)) platformFailure("TRADERLINK_ACCOUNT_SELECTION_CONFLICT");
    if (command.action === "demo_trade_tracker_account" && new JournalDemoAccountRepository(database).findActiveAccount(freshScope)?.accountId !== scope.activeAccountId) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
  }
  return membership.display_name;
}

/** Server-only command: the HTTP boundary never accepts scope/session fields
 * from JSON. Revalidate the authenticated snapshot under the writer lock.
 */
export function executeErasureCommand(
  database: Database.Database,
  store: ErasureObjectStore,
  command: ErasureCommand,
): ErasureCompletion {
  const recovery = new PlatformErasureRecovery(database, store);
  if (recovery.pending()) platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
  const history = new PlatformErasureHistory(database);
  const receiptId = randomUUID();
  database.transaction(() => {
    const displayName = requireAdmittedMember(database, command);
    history.accept({ receiptId, memberUserId: command.scope.userId, displayName, action: command.action });
  }).immediate();
  let operationId: string | null = null;
  try {
    const result = observeErasurePhase("logical_delete_and_commit", () => database.transaction(() => {
      const outcome = (() => {
        const scope = command.scope;
        requireAdmittedMember(database, command);
        const service = new PlatformErasureService(database);
        const options = { recordPrivateArtifactObligations: (artifacts: Parameters<PlatformErasureRecovery["record"]>[2]) => {
          operationId = recovery.record(command.action, erasureTargetBinding([
            scope.userId, scope.workspaceId, scope.activeAccountId ?? "", command.action,
          ]), artifacts, receiptId);
        } };
        if (command.action === "traderlink_account") {
          service.eraseTraderLinkAccount(scope, options);
          return { nextSelectionRef: null };
        }
        const accounts = new JournalAccountRepository(database);
        const activeAccounts = accounts.listActiveAccounts(scope.workspaceId);
        const freshScope = { ...scope, allowedAccountIds: activeAccounts.map((account) => account.accountId) };
        requireExpectedJournalAccountSelection(freshScope, command.expectedAccountSelectionRef);
        const accountId = scope.activeAccountId;
        if (!accountId) platformFailure("TRADERLINK_ACCOUNT_SELECTION_CONFLICT");
        const account = accounts.findActiveAccount(scope.workspaceId, accountId);
        if (!account) platformFailure("TRADERLINK_ACCOUNT_SELECTION_CONFLICT");
        const accountScope = { ...scope, accountId };
        const remaining = activeAccounts.filter((candidate) => candidate.accountId !== accountId);
        if (command.action === "demo_trade_tracker_account") {
          const demo = new JournalDemoAccountRepository(database).findActiveAccount(freshScope);
          if (demo?.accountId !== accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
          if (!remaining.length) {
            const replacement = service.eraseDemoTradeTrackerAccountAndCreatePrimaryJournal(accountScope, {
              baseCurrency: account.baseCurrency, tradingTimezone: account.tradingTimezone,
            }, options).replacementAccount;
            return { nextSelectionRef: resolveJournalAccountSelection(scope.workspaceId, undefined, [replacement]).selectionRef };
          }
          service.eraseDemoTradeTrackerAccount(accountScope, options);
          return { nextSelectionRef: resolveJournalAccountSelection(scope.workspaceId, command.demoReturnSelection, remaining).selectionRef };
        }
        service.eraseTradeTrackerAccount(accountScope, options);
        return { nextSelectionRef: null };
      })();
      if (!operationId) throw new Error("erasure_missing_obligation_record");
      return outcome;
    }).immediate());
    observeErasurePhase("private_file_cleanup", () => recovery.finish(operationId!));
    return result;
  } catch (error) {
    try { history.failed(receiptId); }
    catch { /* Keep the last durable phase if an outcome cannot be recorded. */ }
    throw error;
  }
}
