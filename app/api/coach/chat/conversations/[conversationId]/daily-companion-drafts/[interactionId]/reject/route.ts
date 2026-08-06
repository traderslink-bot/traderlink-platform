import { CoachAiDailyCompanionCommandService } from "@/src/modules/coach/server/coach-ai-daily-companion-command-service";
import {
  parseCoachAiDailyCompanionInteractionId,
  parseCoachAiDailyCompanionRejectBody,
} from "@/src/modules/coach/server/coach-ai-daily-companion-route-runtime";
import {
  assertNoQueryParameters,
  parseConversationId,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = Readonly<{
  params: Promise<{ conversationId: string; interactionId: string }>;
}>;

export async function POST(request: Request, { params }: Context): Promise<Response> {
  try {
    assertNoQueryParameters(new URL(request.url));
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const values = await params;
    const conversationId = parseConversationId(values.conversationId);
    const interactionId = parseCoachAiDailyCompanionInteractionId(values.interactionId);
    parseCoachAiDailyCompanionRejectBody(await parseJsonBody(request));
    const draft = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CoachAiDailyCompanionCommandService(database).reject(scope, {
        conversationId,
        interactionId,
      }));
    return readyResponse({ status: "ready", draft });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
