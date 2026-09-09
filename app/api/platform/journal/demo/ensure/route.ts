import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalDemoAccountActivationService } from "@/src/modules/journal/server/demo/journal-demo-account-activation-service";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { JOURNAL_DEMO_CURRENT_VERSION_ID } from "@/src/modules/journal/server/demo/journal-demo-current-version";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Provision the separate demo without changing the selected real account. */
export async function POST(request: Request): Promise<Response> {
  const headers = { "cache-control": "no-store" };
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (scope.workspaceRole !== "owner" || !scope.activeAccountId) {
      return Response.json({ status: "unavailable" }, { status: 403, headers });
    }
    const result = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const demos = new JournalDemoAccountRepository(database);
      if (demos.findLifecycleForUser(scope)?.state === "cleared") return { status: "cleared", changed: false };
      const existing = demos.findAccountForUser(scope);
      if (existing && (existing.demoPackVersionId === JOURNAL_DEMO_CURRENT_VERSION_ID || demos.findPackApplication({
        accountId: existing.accountId, workspaceId: scope.workspaceId,
        demoPackVersionId: JOURNAL_DEMO_CURRENT_VERSION_ID,
      }))) return { status: "ready", changed: false };
      const account = new JournalAccountRepository(database).findActiveAccount(scope.workspaceId, scope.activeAccountId!);
      if (!account) return { status: "unavailable", changed: false };
      const activation = new JournalDemoAccountActivationService(database).activateForWorkspace({
        baseCurrency: account.baseCurrency, tradingTimezone: account.tradingTimezone,
        userId: scope.userId, workspaceId: scope.workspaceId,
      });
      return { status: activation.state === "materialized" ? "ready" : activation.state,
        changed: activation.state === "materialized" };
    });
    return Response.json(result, { status: result.status === "unavailable" ? 503 : 200, headers });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 403, headers });
  }
}
