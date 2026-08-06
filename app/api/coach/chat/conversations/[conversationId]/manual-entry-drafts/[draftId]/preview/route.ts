import { CoachAiManualEntryCommandService } from "@/src/modules/coach/server/coach-ai-manual-entry-command-service";
import {
  parseCoachAiManualEntryDraftId,
  parseCoachAiManualEntryPreviewBody,
} from "@/src/modules/coach/server/coach-ai-manual-entry-route-runtime";
import {
  assertNoQueryParameters,
  parseConversationId,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = Readonly<{
  params: Promise<{ conversationId: string; draftId: string }>;
}>;

export async function POST(request: Request, { params }: Context): Promise<Response> {
  try {
    assertNoQueryParameters(new URL(request.url));
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const values = await params;
    const conversationId = parseConversationId(values.conversationId);
    const draftId = parseCoachAiManualEntryDraftId(values.draftId);
    const input = parseCoachAiManualEntryPreviewBody(await parseJsonBody(request));
    const result = withWritableJournalIntegrityRuntime(scope, (journal, database) =>
      new CoachAiManualEntryCommandService(database, journal).preview(scope, {
        conversationId,
        draftId,
        tracker: input.tracker,
        rows: input.rows,
      }));
    return readyResponse({ status: "ready", ...result });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
