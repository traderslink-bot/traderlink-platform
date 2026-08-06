import { CoachAiReviewDeliveryChangeCommandService } from "@/src/modules/coach/server/coach-ai-review-delivery-change-command-service";
import { parseCoachAiReviewDeliveryDraftId, parseCoachAiReviewDeliveryRejectBody } from "@/src/modules/coach/server/coach-ai-review-delivery-change-route-runtime";
import { assertNoQueryParameters, parseConversationId, parseJsonBody, readyResponse, respondToChatRouteError } from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = Readonly<{ params: Promise<{ conversationId: string; draftId: string }> }>;

export async function POST(request: Request, { params }: Context): Promise<Response> {
  try {
    assertNoQueryParameters(new URL(request.url));
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const values = await params;
    const conversationId = parseConversationId(values.conversationId);
    const draftId = parseCoachAiReviewDeliveryDraftId(values.draftId);
    parseCoachAiReviewDeliveryRejectBody(await parseJsonBody(request));
    const draft = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CoachAiReviewDeliveryChangeCommandService(database).reject(scope, { conversationId, draftId }));
    return readyResponse({ status: "ready", draft });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
