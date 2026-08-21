import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { CoachAiChatQualityFeedbackRepository } from "@/src/modules/coach/server/coach-ai-chat-quality-feedback-repository";
import { CoachAiChatRepository } from "@/src/modules/coach/server/coach-ai-chat-repository";
import {
  assertNoQueryParameters,
  parseConversationId,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = Readonly<{ params: Promise<{ conversationId: string; assistantMessageId: string }> }>;

export async function POST(request: Request, { params }: Context): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const body = await parseJsonBody(request);
    if (Object.keys(body).length !== 0) throw new TypeError("quality_feedback_body_invalid");
    const { conversationId, assistantMessageId } = await params;
    const id = parseConversationId(conversationId);
    const messageId = parseConversationId(assistantMessageId);
    const quality = withPlatformDatabase({ mode: "runtime" }, (database) => {
      new CoachAiChatRepository(database).readGenerationPair(scope, id, messageId);
      return new CoachAiChatQualityFeedbackRepository(database).capture(scope, {
        assistantMessageId: messageId,
        eventKind: "trader_flagged",
      });
    });
    return readyResponse({ status: "ready", caseId: quality.caseId, eventKinds: quality.eventKinds });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
