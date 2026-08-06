import { CoachAiManualEntryCommandService } from "@/src/modules/coach/server/coach-ai-manual-entry-command-service";
import {
  parseCoachAiManualEntryCommitBody,
  parseCoachAiManualEntryDraftId,
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
    const input = parseCoachAiManualEntryCommitBody(await parseJsonBody(request));
    const committed = withWritableJournalIntegrityRuntime(scope, (journal, database) =>
      new CoachAiManualEntryCommandService(database, journal).commit(scope, {
        conversationId,
        draftId,
        ...input,
      }));
    return readyResponse({
      status: "ready",
      draft: committed.draft,
      result: committed.result
        ? {
            importStatus: committed.result.status,
            acceptedExecutionCount: committed.result.executionIds.length,
            createdExecutionCount: committed.result.createdExecutionCount,
            matchedExecutionCount: committed.result.matchedExecutionCount,
            pendingDecisionCount: committed.result.relatedDecisionIds.length,
            affectedDates: committed.result.affectedDates,
          }
        : null,
    });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
