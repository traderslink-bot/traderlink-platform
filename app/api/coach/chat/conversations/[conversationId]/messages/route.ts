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
  getReplacementDailyCompanionResolvedContext,
  getReplacementTradeTrackerAccount,
} from "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { CoachReviewDeliveryScheduleRepository } from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";

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
      analysisScope: input.analysisScope,
      idempotencySha256: createChatGenerationIdempotencySha256(
        id,
        input.clientRequestId,
        input.intent,
      ),
      resolveTrustedContext: input.context
        ? () => {
            const context = getReplacementDailyCompanionResolvedContext(scope, {
              tradingDate: input.context!.tradingDate,
              currency: input.context!.currency,
            });
            if (!context) {
              platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "context" });
            }
            return context;
        }
        : null,
      resolveManualEntryDefaults: () => {
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
      },
      resolveReviewDelivery: () => withReadonlyPlatformDatabase({}, (database) => {
        const saved = new CoachReviewDeliveryScheduleRepository(database).read(scope);
        return saved ?? Object.freeze({
          weeklyDeliveryDay: "friday" as const,
          deliveryTimeEastern: "18:00",
          updatedAtUtc: null,
        });
      }),
    });
    const status = result.state === "completed" ? 200
      : result.state === "pending" ? 202
      : result.state === "blocked" ? 429
      : 503;
    return readyResponse({
      status: result.state,
      assistantMessageId: result.assistantMessageId,
      manualEntryDraft: result.manualEntryDraft,
      dailyCompanionDraft: result.dailyCompanionDraft,
      reviewDeliveryChangeDraft: result.reviewDeliveryChangeDraft,
      actionDraft: result.actionDraft,
    }, status);
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
