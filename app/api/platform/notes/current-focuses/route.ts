import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalSharedNotesService } from "@/src/modules/journal/server/shared-notes/journal-shared-notes-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store, max-age=0" };

function unavailable(error: unknown): Response {
  return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const focus = withReadonlyPlatformDatabase({}, (database) => new JournalSharedNotesService(database).readCurrentFocus(scope));
    return Response.json({ focus, status: "ready" }, { headers: HEADERS });
  } catch (error) { return unavailable(error); }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = await request.json() as Record<string, unknown>;
    const focus = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new JournalSharedNotesService(database).saveCurrentFocus(scope, {
        expectedRevision: body.expectedRevision,
        focusText: body.focusText,
        showInWorkspace: body.showInWorkspace,
      }));
    return Response.json({ focus, status: "ready" }, { headers: HEADERS });
  } catch (error) { return unavailable(error); }
}
