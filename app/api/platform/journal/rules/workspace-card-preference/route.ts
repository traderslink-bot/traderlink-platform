import { JournalWorkspaceRuleResultsCardPreferenceService } from "@/src/modules/journal/server/rules/journal-workspace-rule-results-card-preference";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store, max-age=0" };

export async function PUT(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = await request.json() as Record<string, unknown>;
    const preference = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new JournalWorkspaceRuleResultsCardPreferenceService(database).save(scope, {
        expectedRevision: body.expectedRevision,
        showInWorkspace: body.showInWorkspace,
      }));
    return Response.json({ preference, status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
  }
}
