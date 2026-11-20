import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { ERASURE_STATUS_PROTOCOL, isErasureBody, type ErasureBody } from "@/src/modules/platform/contracts/account-erasure-status";

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
import { assertErasureWorkerIdle, runErasureWorker } from "@/src/modules/platform/server/privacy/platform-erasure-worker-supervisor";
import { prepareAuthenticatedErasureRequest } from "@/src/modules/platform/server/privacy/platform-erasure-request-preparation";
import type { ErasureCommand } from "@/src/modules/platform/server/privacy/platform-erasure-command";
import type { ErasureAction } from "@/src/modules/platform/server/privacy/platform-erasure-recovery";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { erasureViewerRef, readAccountErasureStatus } from "@/src/modules/platform/server/privacy/platform-erasure-status-read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers);
    const result = withReadonlyPlatformDatabase({}, database =>
      readAccountErasureStatus(database, identity.scope, request.nextUrl.searchParams.get("receipt")));
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store", vary: "Cookie" } });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 403, headers: { "cache-control": "private, no-store", vary: "Cookie" } });
  }
}

const DELETE_TRADE_TRACKER_ACCOUNT = "DELETE ACCOUNT";
const DELETE_TRADERLINK_ACCOUNT = "DELETE MY TRADERLINK ACCOUNT";


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

async function boundedBody(request: NextRequest): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID");
  // Preserve byte identity: do not silently strip an input BOM before hashing.
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  let bytes = 0, text = "";
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) return text + decoder.decode();
      bytes += next.value.byteLength;
      if (bytes > 8192) { await reader.cancel(); platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID"); }
      text += decoder.decode(next.value, { stream: true });
    }
  } finally { reader.releaseLock(); }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: ErasureBody | null = null, rawBody = "", authenticated = false, possibleEffect = false;
  const boundResult = (status: "deleted" | "known_not_submitted", reason?: "viewer_changed" | "selection_changed" | "reconciliation_required") => ({ protocol: ERASURE_STATUS_PROTOCOL,
    status, action: body!.action, expectedViewerRef: body!.expectedViewerRef,
    bodySha256: createHash("sha256").update(rawBody).digest("hex"), ...(reason ? { reason } : {}) });
  try {
    requireJournalMutationRequest(request);
    rawBody = await boundedBody(request);
    const parsed: unknown = JSON.parse(rawBody);
    if (!isErasureBody(parsed)) platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID");
    body = parsed;
    // Resolve AFTER awaited input. A mounted A confirmation cannot target B
    // merely because another tab replaced its authentication cookie.
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers);
    authenticated = true;
    if (body.expectedViewerRef !== erasureViewerRef(identity.scope.userId)) {
      return NextResponse.json(boundResult("known_not_submitted", "viewer_changed"), { status: 409, headers: { "cache-control": "no-store" } });
    }
    const action = requiredAction(body);
    requireConfirmation(body, action === "traderlink_account" ? DELETE_TRADERLINK_ACCOUNT : DELETE_TRADE_TRACKER_ACCOUNT);
    if (action !== "traderlink_account") {
      requireExpectedJournalAccountSelection(identity.scope, body.expectedAccountSelectionRef);
    }
    const command: ErasureCommand = {
      action, scope: identity.scope, sessionId: identity.sessionId, mode: identity.mode,
      expectedAccountSelectionRef: body.expectedAccountSelectionRef,
      demoReturnSelection: action === "demo_trade_tracker_account"
        && identity.scope.allowedAccountIds.some((accountId) => accountId !== identity.scope.activeAccountId)
        ? readJournalDemoReturnAccountSelectionCookie(request.headers) : null,
    };
    const databasePath = resolvePlatformDatabaseConfig({}).databasePath;
    assertErasureWorkerIdle();
    if (action === "traderlink_account") {
      possibleEffect = true;
      prepareAuthenticatedErasureRequest(request, identity, command, databasePath);
    }
    possibleEffect = true;
    const result = await runErasureWorker(databasePath, command);
    const response = NextResponse.json(boundResult("deleted"), {
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
    if (authenticated && body && !possibleEffect) {
      // Proof concerns THIS invocation only; never a retry of an earlier UNKNOWN.
      const reason = isTraderLinkPlatformError(error) && error.code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT"
        ? "selection_changed" : "reconciliation_required";
      return NextResponse.json(boundResult("known_not_submitted", reason), { status: 409, headers: { "cache-control": "no-store" } });
    }
    return unavailableResponse(error);
  }
}
