import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { serializeJournalAccountSelectionCookie } from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  value: Record<string, unknown>,
  field: string,
): string {
  const candidate = value[field];
  if (typeof candidate !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return candidate;
}

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body: unknown = await request.json();
    if (!isRecord(body) || scope.allowedAccountIds.length >= 25) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "journalAccount",
      });
    }
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    const account = withWritableJournalIntegrityRuntime(scope, (runtime) =>
      runtime.accounts.createAccount(scope, {
        workspaceId: scope.workspaceId,
        displayName: requiredString(body, "displayName"),
        baseCurrency: requiredString(body, "baseCurrency").toUpperCase(),
        tradingTimezone: requiredString(body, "tradingTimezone"),
      }));
    const selectionRef = deriveJournalAccountSelectionRef(
      scope.workspaceId,
      account.accountId,
    );
    return Response.json(
      {
        status: "ready",
        account: {
          selectionRef,
          displayName: account.displayName,
          baseCurrency: account.baseCurrency,
          tradingTimezone: account.tradingTimezone,
          active: true,
        },
      },
      {
        status: 201,
        headers: {
          "cache-control": "no-store",
          "set-cookie": serializeJournalAccountSelectionCookie(selectionRef),
        },
      },
    );
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_ACCOUNT_ACCESS_DENIED";
    const status = code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT"
      ? 409
      : code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED"
        ? 400
        : 403;
    return Response.json({ status: "unavailable", code }, { status });
  }
}
