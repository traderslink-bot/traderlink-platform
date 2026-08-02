import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { deriveJournalAccountSelectionRef } from "../../contracts/journal-account-selection";
import { platformFailure } from "../database/platform-migration-contract";

export type PlatformAccountProfile = Readonly<{
  displayName: string;
  accessMode: "local_development" | "authenticated";
  authenticationLabel: string;
  workspace: Readonly<{
    displayName: string;
    role: "owner" | "admin" | "member";
    defaultTradingTimezone: string;
  }>;
  journalAccounts: readonly Readonly<{
    selectionRef: string;
    displayName: string;
    baseCurrency: string;
    tradingTimezone: string;
    active: boolean;
  }>[];
}>;

type ProfileRow = Readonly<{
  display_name: string;
  auth_provider: string;
  workspace_display_name: string;
  default_trading_timezone: string;
  role: "owner" | "admin" | "member";
}>;

type AccountRow = Readonly<{
  account_id: string;
  display_name: string;
  base_currency: string;
  trading_timezone: string;
}>;

function authenticationLabel(provider: string): string {
  if (provider === "development_local") return "Local development owner";
  if (provider === "discord") return "Discord";
  return "Authenticated account";
}

export class PlatformAccountProfileReadService {
  constructor(private readonly database: Database.Database) {}

  get(scope: WorkspaceAccessScope): PlatformAccountProfile {
    const profile = this.database.prepare<[string, string], ProfileRow>(`SELECT
  user.display_name,
  user.auth_provider,
  workspace.display_name AS workspace_display_name,
  workspace.default_trading_timezone,
  membership.role
FROM platform_users user
JOIN platform_workspace_memberships membership
  ON membership.user_id = user.user_id
JOIN platform_workspaces workspace
  ON workspace.workspace_id = membership.workspace_id
WHERE user.user_id = ? AND membership.workspace_id = ?
  AND user.status = 'active'
  AND membership.status = 'active'
  AND workspace.status = 'active'`).get(scope.userId, scope.workspaceId);
    if (!profile || profile.role !== scope.workspaceRole) {
      platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
    const allowed = new Set(scope.allowedAccountIds);
    const accounts = this.database.prepare<[string], AccountRow>(`SELECT
  account_id, display_name, base_currency, trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND status = 'active'
ORDER BY display_name, account_id`).all(scope.workspaceId)
      .filter((account) => allowed.has(account.account_id))
      .map((account) => Object.freeze({
        selectionRef: deriveJournalAccountSelectionRef(
          scope.workspaceId,
          account.account_id,
        ),
        displayName: account.display_name,
        baseCurrency: account.base_currency,
        tradingTimezone: account.trading_timezone,
        active: account.account_id === scope.activeAccountId,
      }));
    return Object.freeze({
      displayName: profile.display_name,
      accessMode: profile.auth_provider === "development_local"
        ? "local_development" as const
        : "authenticated" as const,
      authenticationLabel: authenticationLabel(profile.auth_provider),
      workspace: Object.freeze({
        displayName: profile.workspace_display_name,
        role: profile.role,
        defaultTradingTimezone: profile.default_trading_timezone,
      }),
      journalAccounts: Object.freeze(accounts),
    });
  }
}
