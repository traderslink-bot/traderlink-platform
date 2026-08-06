import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  assertNoQueryParameters,
  createChatGenerationIdempotencySha256,
  encodeMessagePageCursor,
  parseGenerateChatMessageBody,
  parseJsonBody,
  parseConversationId,
  parseMessageHistoryQuery,
  readyResponse,
  respondToChatRouteError,
  withReadonlyChatRepository,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import { generateCoachAiChatSavedAnswer } from "@/src/modules/coach/server/coach-ai-chat-generation-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConversationMessagesRouteContext = Readonly<{
  params: Promise<{ conversationId: string }>;
}>;

export async function GET(
  request: Request,
  { params }: ConversationMessagesRouteContext,
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const query = parseMessageHistoryQuery(new URL(request.url));
    const { conversationId } = await params;
    const id = parseConversationId(conversationId);
    const result = withReadonlyChatRepository(scope, (repository) =>
      repository.listMessages(scope, id, query));
    return readyResponse({
      status: "ready",
      conversationId: id,
      messages: result.messages,
      nextCursor: encodeMessagePageCursor(result.nextCursor),
    });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: ConversationMessagesRouteContext,
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const { conversationId } = await params;
    const id = parseConversationId(conversationId);
    const input = parseGenerateChatMessageBody(await parseJsonBody(request));
    const result = await generateCoachAiChatSavedAnswer(scope, {
      conversationId: id,
      question: input.question,
      idempotencySha256: createChatGenerationIdempotencySha256(id, input.clientRequestId),
    });
    const status = result.state === "completed" ? 200
      : result.state === "pending" ? 202
      : result.state === "blocked" ? 429
      : 503;
    return readyResponse({
      status: result.state,
      assistantMessageId: result.assistantMessageId,
    }, status);
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
