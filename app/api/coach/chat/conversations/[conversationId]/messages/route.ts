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
import {
  generateCoachAiChatSavedAnswer,
  reconcileStaleCoachAiChatGenerations,
} from "@/src/modules/coach/server/coach-ai-chat-generation-runtime";
import { CoachAiChatEvidenceService } from "@/src/modules/coach/server/coach-ai-chat-evidence-service";
import type { CoachAiChatPageContext } from "@/src/modules/coach/contracts/ai-chat-page-context-contracts";
import {
  CoachAiChatPageContextValidationError,
  parseCoachAiChatPageContext,
} from "@/src/modules/coach/server/coach-ai-chat-page-context";
import {
  getReplacementReportingDailyCompanionResolvedContext,
  getReplacementTradeTrackerAccount,
} from "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { CoachReviewDeliveryScheduleRepository } from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";

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
    // The recovery service owns timeout reconciliation. A read never invents
    // an answer; it only makes a safely-finalized pending state visible.
    reconcileStaleCoachAiChatGenerations(scope, { conversationId: id });
    const result = withReadonlyChatRepository(scope, (repository) =>
      repository.listMessages(scope, id, query));
    const evidence = withReadonlyPlatformDatabase({}, (database) =>
      new CoachAiChatEvidenceService(database).readForMessages(
        scope,
        id,
        result.messages
          .filter((message) => message.role === "assistant" && message.generationState === "completed")
          .map((message) => message.messageId),
      ));
    return readyResponse({
      status: "ready",
      conversationId: id,
      messages: result.messages,
      evidence,
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
    const body = await parseJsonBody(request);
    let pageContext: CoachAiChatPageContext | null;
    try {
      pageContext = parseCoachAiChatPageContext(body.pagePathname);
    } catch (error) {
      if (error instanceof CoachAiChatPageContextValidationError) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "pagePathname",
        });
      }
      throw error;
    }
    const messageBody = { ...body };
    delete messageBody.pagePathname;
    const input = parseGenerateChatMessageBody(messageBody);
    const reportingContext = await withJournalAnalyticsReportingDashboardRuntime(
      scope,
      ({ reportingContext: context }) => context,
    );
    const trustedContext = input.context
      ? await getReplacementReportingDailyCompanionResolvedContext(scope, {
          tradingDate: input.context.tradingDate,
          currency: input.context.currency,
        })
      : null;
    if (input.context && !trustedContext) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "context",
      });
    }
    const result = await generateCoachAiChatSavedAnswer(scope, {
      conversationId: id,
      question: input.question,
      intent: input.intent,
      analysisScope: input.analysisScope,
      reportingContext,
      pageContext,
      idempotencySha256: createChatGenerationIdempotencySha256(
        id,
        input.clientRequestId,
        {
          question: input.question,
          intent: input.intent,
          analysisScope: input.analysisScope,
          context: input.context,
          pageContext,
        },
      ),
      resolveTrustedContext: input.context
        ? () => trustedContext!
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
