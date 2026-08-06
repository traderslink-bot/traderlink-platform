import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  encodeMessagePageCursor,
  parseConversationId,
  parseMessageHistoryQuery,
  readyResponse,
  respondToChatRouteError,
  withReadonlyChatRepository,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";

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
