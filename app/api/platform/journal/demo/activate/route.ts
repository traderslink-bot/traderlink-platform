import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalDemoAccountActivationService } from "@/src/modules/journal/server/demo/journal-demo-account-activation-service";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  serializeJournalAccountSelectionCookie,
  serializeJournalDemoReturnAccountSelectionCookie,
} from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const activeAccountId = scope.activeAccountId;
    if (scope.workspaceRole !== "owner" || !activeAccountId) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const activation = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const activeDemoAccount = new JournalDemoAccountRepository(database).findActiveAccount(scope);
      const activeAccount = new JournalAccountRepository(database).findActiveAccount(
        scope.workspaceId,
        activeAccountId,
      );
      if (!activeAccount) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      return Object.freeze({
        activeAccountIsDemo: activeDemoAccount !== null,
        result: new JournalDemoAccountActivationService(database).activateForWorkspace({
          baseCurrency: activeAccount.baseCurrency,
          tradingTimezone: activeAccount.tradingTimezone,
          userId: scope.userId,
          workspaceId: scope.workspaceId,
        }),
      });
    });
    const result = activation.result;
    if (result.state !== "materialized" || !result.accountId) {
      return Response.json(
        { status: "unavailable" },
        { status: 409, headers: { "cache-control": "no-store" } },
      );
    }
    const demoSelectionRef = deriveJournalAccountSelectionRef(
      scope.workspaceId,
      result.accountId,
    );
    const response = Response.json(
      { status: "ready" },
      { headers: { "cache-control": "no-store" } },
    );
    response.headers.append(
      "set-cookie",
      serializeJournalAccountSelectionCookie(demoSelectionRef),
    );
    if (!activation.activeAccountIsDemo) {
      response.headers.append(
        "set-cookie",
        serializeJournalDemoReturnAccountSelectionCookie(
          deriveJournalAccountSelectionRef(scope.workspaceId, activeAccountId),
        ),
      );
    }
    return response;
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_ACCOUNT_ACCESS_DENIED";
    return Response.json(
      { status: "unavailable", code },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }
}
