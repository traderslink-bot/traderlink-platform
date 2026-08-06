import { CoachAiManualEntryDraftRepository } from "@/src/modules/coach/server/coach-ai-manual-entry-draft-repository";
import {
  assertNoQueryParameters,
  parseConversationId,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = Readonly<{ params: Promise<{ conversationId: string }> }>;

export async function GET(request: Request, { params }: Context): Promise<Response> {
  try {
    assertNoQueryParameters(new URL(request.url));
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const conversationId = parseConversationId((await params).conversationId);
    const drafts = withReadonlyPlatformDatabase({}, (database) =>
      new CoachAiManualEntryDraftRepository(database).listDrafts(scope, {
        conversationId,
        limit: 50,
      }));
    return readyResponse({ status: "ready", conversationId, drafts });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
