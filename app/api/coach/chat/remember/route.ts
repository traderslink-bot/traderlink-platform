import type { CoachAiRelationshipMemoryCategory } from
  "@/src/modules/coach/contracts/ai-relationship-memory-contracts";
import { COACH_AI_RELATIONSHIP_MEMORY_CATEGORIES } from
  "@/src/modules/coach/contracts/ai-relationship-memory-contracts";
import { CoachAiChatRepository } from
  "@/src/modules/coach/server/coach-ai-chat-repository";
import { CoachAiRelationshipMemoryRepository } from
  "@/src/modules/coach/server/coach-ai-relationship-memory-repository";
import {
  assertNoQueryParameters,
  parseConversationId,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function invalid(field: string): never {
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const body = await parseJsonBody(request);
    const keys = Object.keys(body).sort();
    if (keys.join(",") !== "category,conversationId,conversationTitle,memoryText,originalQuestion,scopeKind" ||
        typeof body.originalQuestion !== "string" || typeof body.memoryText !== "string" ||
        typeof body.conversationTitle !== "string" ||
        (body.conversationId !== null && typeof body.conversationId !== "string") ||
        (body.scopeKind !== "user" && body.scopeKind !== "account") ||
        typeof body.category !== "string" ||
        !(COACH_AI_RELATIONSHIP_MEMORY_CATEGORIES as readonly string[]).includes(body.category)) {
      invalid("rememberRequest");
    }
    const originalQuestion = body.originalQuestion as string;
    const memoryText = body.memoryText as string;
    const conversationTitle = body.conversationTitle as string;
    const requestedConversationId = body.conversationId === null
      ? null
      : parseConversationId(body.conversationId);
    const scopeKind = body.scopeKind as "user" | "account";
    const category = body.category as CoachAiRelationshipMemoryCategory;
    const result = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const chat = new CoachAiChatRepository(database);
      const memories = new CoachAiRelationshipMemoryRepository(database);
      return chat.runAtomically(() => {
        const conversation = requestedConversationId
          ? chat.readConversation(scope, requestedConversationId)
          : chat.createConversation(scope, conversationTitle);
        const pair = chat.appendUserMessageAndReserveAssistant(scope, conversation.conversationId, {
          originalUserTextPrivate: originalQuestion,
          structuredInterpretation: Object.freeze({ intent: "remember_relationship_context" }),
        });
        const memory = memories.create(scope, {
          scope: scopeKind === "user"
            ? Object.freeze({ kind: "user" })
            : Object.freeze({ kind: "account", accountId: scope.activeAccountId! }),
          category,
          text: memoryText,
          sourceKind: "direct_request",
          sourceConversationId: conversation.conversationId,
          sourceMessageId: pair.userMessage.messageId,
        });
        const assistant = chat.finalizeDeterministicAssistant(
          scope,
          pair.assistantMessage.messageId,
          `Remembered. I’ll keep this in mind for ${memory.scopeLabel}.`,
        );
        return Object.freeze({ conversation, memory, assistant });
      });
    });
    return readyResponse({ status: "ready", ...result }, 201);
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
