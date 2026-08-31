"use server";

import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

import {
  readWorkspaceTradeLibrary,
  type WorkspaceTradeLibraryModel,
  type WorkspaceTradeLibraryQuery,
} from "./workspace-trade-library";

export async function loadWorkspaceTradeLibraryPage(
  input: WorkspaceTradeLibraryQuery,
): Promise<
  | Readonly<{
      accountSelectionRef: string;
      model: WorkspaceTradeLibraryModel;
      ok: true;
    }>
  | Readonly<{ ok: false; message: string; refreshRequired: boolean }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      ok: true as const,
      accountSelectionRef: currentJournalAccountSelectionRef(scope),
      model: withReadonlyPlatformDatabase({}, (database) =>
        readWorkspaceTradeLibrary(database, scope, input)),
    });
  } catch {
    return Object.freeze({
      ok: false as const,
      message: "These trades changed while you were paging. Refresh to load the latest list.",
      refreshRequired: true,
    });
  }
}

export async function loadWorkspaceTradeEntryContext(): Promise<
  | Readonly<{
      accountCurrency: string;
      accountTimezone: string;
      expectedAccountSelectionRef: string;
      offlineScopeRef: string;
      ok: true;
    }>
  | Readonly<{ ok: false }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    if (!scope.activeAccountId) return Object.freeze({ ok: false as const });
    const account = withReadonlyPlatformDatabase({}, (database) => database.prepare(`
SELECT base_currency, trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'
LIMIT 1`).get(scope.workspaceId, scope.activeAccountId) as
      | Readonly<{ base_currency: string; trading_timezone: string }>
      | undefined);
    if (!account) return Object.freeze({ ok: false as const });
    return Object.freeze({
      accountCurrency: account.base_currency,
      accountTimezone: account.trading_timezone,
      expectedAccountSelectionRef: currentJournalAccountSelectionRef(scope),
      offlineScopeRef: currentPlatformOfflineScopeRef(scope),
      ok: true as const,
    });
  } catch {
    return Object.freeze({ ok: false as const });
  }
}
