import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  assertNoQueryParameters,
  encodeConversationPageCursor,
  parseConversationListQuery,
  parseCreateConversationBody,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
  withReadonlyChatRepository,
  withWritableChatRepository,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const page = parseConversationListQuery(new URL(request.url));
    const result = withReadonlyChatRepository(scope, (repository) =>
      repository.listConversations(scope, page));
    return readyResponse({
      status: "ready",
      conversations: result.conversations,
      nextCursor: encodeConversationPageCursor(result.nextCursor),
    });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const title = parseCreateConversationBody(await parseJsonBody(request));
    const conversation = withWritableChatRepository(scope, (repository) =>
      repository.createConversation(scope, title));
    return readyResponse({ status: "ready", conversation }, 201);
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
