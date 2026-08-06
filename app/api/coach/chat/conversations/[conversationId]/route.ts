import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  assertNoQueryParameters,
  parseConversationId,
  parseConversationPatchBody,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
  withReadonlyChatRepository,
  withWritableChatRepository,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConversationRouteContext = Readonly<{
  params: Promise<{ conversationId: string }>;
}>;

export async function GET(
  request: Request,
  { params }: ConversationRouteContext,
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const { conversationId } = await params;
    const conversation = withReadonlyChatRepository(scope, (repository) =>
      repository.readConversation(scope, parseConversationId(conversationId)));
    return readyResponse({ status: "ready", conversation });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: ConversationRouteContext,
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const { conversationId } = await params;
    const id = parseConversationId(conversationId);
    const patch = parseConversationPatchBody(await parseJsonBody(request));
    const conversation = withWritableChatRepository(scope, (repository) => {
      if (patch.action === "rename") return repository.renameConversation(scope, id, patch.title);
      if (patch.action === "archive") return repository.archiveConversation(scope, id);
      return repository.restoreConversation(scope, id);
    });
    return readyResponse({ status: "ready", conversation });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
