import { NextResponse } from "next/server";

import { MoomooExecutionImportCommandService } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-command-service";
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
  stage: "import_start" | "import_status",
): NextResponse {
  const code = isTraderLinkPlatformError(error) ? error.code : null;
  recordMoomooImportFailure({ database, error, stage });
  const status = code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT"
    ? 409
    : code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED"
      ? 400
      : 503;
  return NextResponse.json({
    status: "unavailable",
    message: code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED"
      ? "Enter the date of the first execution in this Moomoo trading account."
      : stage === "import_status"
        ? "Import progress could not be loaded. Try again."
        : "The import could not be started. Try again.",
    reportedToAdmin: true,
  }, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request): Promise<NextResponse> {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const accounts = new MoomooExecutionImportCommandService(database).list(
      scope,
      scope.activeAccountId,
    );
    return NextResponse.json(
      { status: "ready", accounts },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return safeFailure(database, error, "import_status");
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
    if (
      !isRecord(body) ||
      typeof body.linkRef !== "string" ||
      typeof body.earliestExecutionDate !== "string"
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "moomooImportRequest",
      });
    }
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const job = new MoomooExecutionImportCommandService(database).start({
      scope,
      journalAccountId: scope.activeAccountId,
      linkRef: body.linkRef,
      earliestExecutionDate: body.earliestExecutionDate,
    });
    return NextResponse.json(
      { status: "queued", job },
      { status: 202, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return safeFailure(database, error, "import_start");
  } finally {
    database.close();
  }
}
