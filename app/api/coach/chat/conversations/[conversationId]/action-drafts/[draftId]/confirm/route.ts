import { revalidatePath } from "next/cache";

import { CoachAiChatActionDraftService } from
  "@/src/modules/coach/server/coach-ai-chat-action-draft-service";
import {
  assertNoQueryParameters,
  parseConversationId,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import { serializeJournalAccountSelectionCookie } from
  "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import { parseJournalAccountSelectionRef } from
  "@/src/modules/platform/contracts/journal-account-selection";
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
    const result = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CoachAiChatActionDraftService(database).confirm(scope, {
        conversationId,
        draftId: values.draftId,
      }));
    revalidatePath("/account");
    revalidatePath("/notifications");
    revalidatePath("/workspace");
    const response = readyResponse({ status: "ready", draft: result.draft });
    if (!result.accountSelectionRef) return response;
    response.headers.set(
      "set-cookie",
      serializeJournalAccountSelectionCookie(
        parseJournalAccountSelectionRef(result.accountSelectionRef),
      ),
    );
    return response;
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
