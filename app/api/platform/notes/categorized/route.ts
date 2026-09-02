import { JournalSharedNotesService, type SharedNoteTarget } from "@/src/modules/journal/server/shared-notes/journal-shared-notes-service";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireExpectedJournalAccountSelection, requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = { "cache-control": "private, no-store, max-age=0" };

function target(value: URLSearchParams | Record<string, unknown>): SharedNoteTarget {
  const kind = value instanceof URLSearchParams ? value.get("targetKind") : value.targetKind;
  if (kind === "trading_day") {
    const tradingDate = value instanceof URLSearchParams ? value.get("tradingDate") : value.tradingDate;
    if (typeof tradingDate !== "string") platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "tradingDate" });
    return { kind, tradingDate };
  }
  if (kind === "round_trip") {
    const roundTripId = value instanceof URLSearchParams ? value.get("roundTripId") : value.roundTripId;
    if (typeof roundTripId !== "string") platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "roundTripId" });
    return { kind, roundTripId };
  }
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "targetKind" });
}

function unavailable(error: unknown): Response { return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 }); }

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const notes = withReadonlyPlatformDatabase({}, (database) => new JournalSharedNotesService(database).listCategorizedNotes(
      narrowWorkspaceAccessToAccount(scope, scope.activeAccountId ?? ""), target(new URL(request.url).searchParams),
    ));
    return Response.json({ notes, status: "ready" }, { headers: HEADERS });
  } catch (error) { return unavailable(error); }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = await request.json() as Record<string, unknown>;
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const note = withPlatformDatabase({ mode: "runtime" }, (database) => {
      return new JournalSharedNotesService(database).saveCategorizedNote(
        narrowWorkspaceAccessToAccount(scope, scope.activeAccountId ?? ""),
        { category: body.category, customTypeId: body.customTypeId, expectedRevision: body.expectedRevision, target: target(body), text: body.text },
      );
    });
    return Response.json({ note, status: "ready" }, { headers: HEADERS });
  } catch (error) { return unavailable(error); }
}
