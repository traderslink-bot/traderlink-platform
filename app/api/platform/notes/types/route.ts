import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalSharedNotesService } from "@/src/modules/journal/server/shared-notes/journal-shared-notes-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = { "cache-control": "private, no-store, max-age=0" };
function unavailable(error: unknown): Response { return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 }); }
export async function GET(request: Request): Promise<Response> {
  try { const scope = requireTraderLinkPlatformRequestScope(request.headers); const noteTypes = withReadonlyPlatformDatabase({}, (database) => new JournalSharedNotesService(database).listCustomTypes(scope)); return Response.json({ noteTypes, status: "ready" }, { headers: HEADERS }); } catch (error) { return unavailable(error); }
}
export async function POST(request: Request): Promise<Response> {
  try { requirePlatformMutationRequest(request); const scope = requireTraderLinkPlatformRequestScope(request.headers); const body = await request.json() as Record<string, unknown>; const noteType = withPlatformDatabase({ mode: "runtime" }, (database) => new JournalSharedNotesService(database).createCustomType(scope, { displayName: body.displayName })); return Response.json({ noteType, status: "ready" }, { headers: HEADERS }); } catch (error) { return unavailable(error); }
}
