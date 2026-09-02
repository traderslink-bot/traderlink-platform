import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalSharedNotesService } from "@/src/modules/journal/server/shared-notes/journal-shared-notes-service";

export const runtime = "nodejs";
const HEADERS = { "cache-control": "private, no-store, max-age=0" };
export async function DELETE(request: Request, context: { params: Promise<{ noteTypeId: string }> }): Promise<Response> {
  try { requirePlatformMutationRequest(request); const scope = requireTraderLinkPlatformRequestScope(request.headers); const body = await request.json() as Record<string, unknown>; const { noteTypeId } = await context.params; withPlatformDatabase({ mode: "runtime" }, (database) => new JournalSharedNotesService(database).retireCustomType(scope, { noteTypeId, expectedRevision: body.expectedRevision })); return Response.json({ status: "ready" }, { headers: HEADERS }); } catch (error) { return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 }); }
}
