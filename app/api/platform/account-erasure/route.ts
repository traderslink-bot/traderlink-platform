import { NextResponse, type NextRequest } from "next/server";

import {
  deletePlatformAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { LEGACY_ACADEMY_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-discord-oauth-cookies";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformAuthenticatedRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE,
  TRADERLINK_JOURNAL_DEMO_RETURN_ACCOUNT_SELECTION_COOKIE,
  readJournalDemoReturnAccountSelectionCookie,
  serializeJournalAccountSelectionCookie,
} from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-session-service";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { runErasureWorker } from "@/src/modules/platform/server/privacy/platform-erasure-worker-supervisor";
import type { ErasureAction } from "@/src/modules/platform/server/privacy/platform-erasure-recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DELETE_TRADE_TRACKER_ACCOUNT = "DELETE ACCOUNT";
const DELETE_TRADERLINK_ACCOUNT = "DELETE MY TRADERLINK ACCOUNT";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredAction(value: Record<string, unknown>): ErasureAction {
  const action = value.action;
  if (
    action === "demo_trade_tracker_account" ||
    action === "trade_tracker_account" ||
    action === "traderlink_account"
  ) return action;
  platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID");
}

function requireConfirmation(
  body: Record<string, unknown>,
  expected: string,
): void {
  if (body.confirmation !== expected) {
    platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID");
  }
}

function unavailableResponse(error: unknown): NextResponse {
  const code = isTraderLinkPlatformError(error)
    ? error.code
    : "TRADERLINK_ACCOUNT_ERASURE_FAILED";
  console.error("[account-erasure] request failed", { code });
  const status = code === "TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID"
    ? 400
    : code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT" || code === "TRADERLINK_ACCOUNT_NOT_FOUND" || code === "TRADERLINK_ACCOUNT_ERASURE_CONFLICT"
      ? 409
      : code === "TRADERLINK_ACCOUNT_ERASURE_FAILED"
        ? 500
        : 403;
  return NextResponse.json({ status: "unavailable", code }, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    requireJournalMutationRequest(request);
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers);
    const body: unknown = await request.json();
    if (!isRecord(body)) platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID");
    const action = requiredAction(body);
    requireConfirmation(body, action === "traderlink_account" ? DELETE_TRADERLINK_ACCOUNT : DELETE_TRADE_TRACKER_ACCOUNT);
    if (action !== "traderlink_account") {
      requireExpectedJournalAccountSelection(identity.scope, body.expectedAccountSelectionRef);
    }
    const result = await runErasureWorker(resolvePlatformDatabaseConfig({}).databasePath, {
      action, scope: identity.scope, sessionId: identity.sessionId, mode: identity.mode,
      expectedAccountSelectionRef: body.expectedAccountSelectionRef,
      demoReturnSelection: action === "demo_trade_tracker_account"
        && identity.scope.allowedAccountIds.some((accountId) => accountId !== identity.scope.activeAccountId)
        ? readJournalDemoReturnAccountSelectionCookie(request.headers) : null,
    });
    const response = NextResponse.json({ status: "deleted", action }, {
      headers: { "cache-control": "no-store" },
    });
    if (action === "traderlink_account") {
      deletePlatformAuthCookie(response, request, TRADERLINK_PLATFORM_SESSION_COOKIE);
      deletePlatformAuthCookie(response, request, LEGACY_ACADEMY_SESSION_COOKIE);
      deletePlatformAuthCookie(response, request, TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE);
    } else {
      if (result.nextSelectionRef) {
        response.headers.set("set-cookie", serializeJournalAccountSelectionCookie(result.nextSelectionRef));
      } else {
        deletePlatformAuthCookie(response, request, TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE);
      }
      if (action === "demo_trade_tracker_account") {
        deletePlatformAuthCookie(response, request, TRADERLINK_JOURNAL_DEMO_RETURN_ACCOUNT_SELECTION_COOKIE);
      }
    }
    return response;
  } catch (error) {
    return unavailableResponse(error);
  }
}
