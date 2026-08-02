import { resolveJournalAccountSelection } from "@/src/modules/platform/contracts/journal-account-selection";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { serializeJournalAccountSelectionCookie } from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "accountSelection",
      });
    }
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    const selected = resolveJournalAccountSelection(
      scope.workspaceId,
      body.accountSelectionRef,
      scope.allowedAccountIds.map((accountId) => Object.freeze({ accountId })),
    );
    return Response.json(
      { status: "ready" },
      {
        headers: {
          "cache-control": "no-store",
          "set-cookie": serializeJournalAccountSelectionCookie(
            selected.selectionRef,
          ),
        },
      },
    );
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_ACCOUNT_ACCESS_DENIED";
    return Response.json(
      { status: "unavailable", code },
      { status: code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT" ? 409 : 403 },
    );
  }
}
