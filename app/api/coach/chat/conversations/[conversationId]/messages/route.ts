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
import {
  getReplacementDailyCompanionContext,
  getReplacementTradeTrackerAccount,
} from "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

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
      intent: input.intent,
      idempotencySha256: createChatGenerationIdempotencySha256(
        id,
        input.clientRequestId,
        input.intent,
      ),
      resolveTrustedContext: input.context
        ? () => {
            const context = getReplacementDailyCompanionContext(scope, {
              tradingDate: input.context!.tradingDate,
              currency: input.context!.currency,
            });
            if (!context) {
              platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "context" });
            }
            return context;
        }
        : null,
      resolveManualEntryDefaults: input.intent === "prepare_manual_execution_draft"
        ? () => {
            const account = getReplacementTradeTrackerAccount(scope);
            if (!account || account.tradingTimezone !== "America/New_York") {
              platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
                field: "manualEntryTimezone",
              });
            }
            return Object.freeze({
              sourceTimezone: "America/New_York",
              tradeCurrency: account.baseCurrency,
            });
          }
        : null,
    });
    const status = result.state === "completed" ? 200
      : result.state === "pending" ? 202
      : result.state === "blocked" ? 429
      : 503;
    return readyResponse({
      status: result.state,
      assistantMessageId: result.assistantMessageId,
      manualEntryDraft: result.manualEntryDraft,
    }, status);
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
