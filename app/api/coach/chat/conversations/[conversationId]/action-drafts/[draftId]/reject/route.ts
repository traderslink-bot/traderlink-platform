import { CoachAiChatActionDraftService } from
  "@/src/modules/coach/server/coach-ai-chat-action-draft-service";
import {
  assertNoQueryParameters,
  parseConversationId,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import { requireJournalMutationRequest } from
  "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";
import { assertCanonicalUuidV4, platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = Readonly<{ params: Promise<{ conversationId: string; draftId: string }> }>;

export async function POST(request: Request, { params }: Context): Promise<Response> {
  try {
    assertNoQueryParameters(new URL(request.url));
    requireJournalMutationRequest(request);
    const body = await parseJsonBody(request);
    if (Object.keys(body).length !== 0) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "body" });
    }
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const values = await params;
    const conversationId = parseConversationId(values.conversationId);
    assertCanonicalUuidV4(values.draftId, "draftId");
    const draft = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CoachAiChatActionDraftService(database).reject(scope, {
        conversationId,
        draftId: values.draftId,
      }));
    return readyResponse({ status: "ready", draft });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
