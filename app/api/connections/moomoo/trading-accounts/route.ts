import { NextResponse } from "next/server";

import { MoomooExecutionImportAccountService } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-account-service";
import { recordMoomooImportFailure } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-observability";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeFailure(
  database: ReturnType<typeof openPlatformDatabase>,
  error: unknown,
  stage: "account_discovery" | "account_link",
): NextResponse {
  const code = isTraderLinkPlatformError(error)
    ? error.code
    : "TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED";
  const status = code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT"
    ? 409
    : code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED"
      ? 400
      : 403;
  recordMoomooImportFailure({ database, error, stage });
  return NextResponse.json(
    {
      status: "unavailable",
      message: stage === "account_discovery"
        ? "Moomoo trading accounts could not be checked. Try again."
        : "The Moomoo trading account could not be linked. Confirm the account and try again.",
      reportedToAdmin: true,
    },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const accounts = await new MoomooExecutionImportAccountService(database)
      .discoverAuthorizedAccounts(scope);
    return NextResponse.json(
      { status: "ready", accounts },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return safeFailure(database, error, "account_discovery");
  } finally {
    database.close();
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.selectionRef !== "string") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "moomooAccountSelection",
      });
    }
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    if (!scope.activeAccountId) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const service = new MoomooExecutionImportAccountService(database);
    const link = await service.linkAuthorizedAccount({
        scope,
        journalAccountId: scope.activeAccountId,
        selectionRef: body.selectionRef,
      });
    const linkedOption = service.listLinkedAccounts(scope, scope.activeAccountId)
      .find((account) => account.label === link.privacySafeLabel);
    if (!linkedOption) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        stage: "linked_account_projection",
      });
    }
    return NextResponse.json(
      {
        status: "linked",
        account: linkedOption,
      },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return safeFailure(database, error, "account_link");
  } finally {
    database.close();
  }
}
