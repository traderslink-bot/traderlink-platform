import { runJournalDemoSetup } from "@/src/modules/journal/server/demo/journal-demo-setup";
import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
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
    const activation = await runJournalDemoSetup({ operation: "activate", scope, activeAccountId });
    if (!activation) {
      return Response.json({ status: "pending" }, {
        status: 503, headers: { "cache-control": "no-store", "retry-after": "3" },
      });
    }
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
