import type { CoachAiChatMessage } from
  "@/src/modules/coach/contracts/ai-chat-contracts";
import {
  buildCoachAiChatAdaptiveHistory,
  COACH_AI_CHAT_MAX_CONTEXT_SOURCE_MESSAGES,
} from "@/src/modules/coach/server/coach-ai-chat-adaptive-context";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function message(sequence: number, text: string): CoachAiChatMessage {
  const role = sequence % 2 === 0 ? "assistant" : "user";
  return Object.freeze({
    messageId: `context-message-${sequence}`,
    sequence,
    role,
    originalUserTextPrivate: role === "user" ? text : null,
    normalizedUserTextPrivate: null,
    structuredInterpretationJson: null,
    assistantTextPrivate: role === "assistant" ? text : null,
    generationState: role === "assistant" ? "completed" : "not_applicable",
    failureCode: null,
    createdAtUtc: "2026-08-20T12:00:00.000Z",
    finalizedAtUtc: role === "assistant" ? "2026-08-20T12:00:00.000Z" : null,
  });
}

const shortConversation = Object.freeze(Array.from(
  { length: 60 },
  (_, index) => message(index + 1, `short turn ${index + 1}`),
));
const shortContext = buildCoachAiChatAdaptiveHistory("What did we decide?", shortConversation);
invariant(shortContext.length === 60,
  "Sixty consecutive short messages must survive the adaptive recent-context budget.");

const longConversation = Object.freeze(Array.from(
  { length: COACH_AI_CHAT_MAX_CONTEXT_SOURCE_MESSAGES },
  (_, index) => message(
    index + 1,
    index === 10
      ? `omega-focus correction ${"x".repeat(500)}`
      : `unrelated-${index} ${"x".repeat(500)}`,
  ),
));
const retrieved = buildCoachAiChatAdaptiveHistory(
  "What was the omega-focus correction?",
  longConversation,
);
invariant(retrieved.some((item) => item.sequence === 11),
  "A relevant older correction must be retrieved outside the recent byte window.");
invariant(retrieved.every((item, index, all) => index === 0 ||
  all[index - 1]!.sequence < item.sequence),
"Selected context must remain in chronological order.");

console.log(JSON.stringify({
  status: "verified",
  shortMessagesRetained: shortContext.length,
  olderCorrectionRetrieved: true,
  maximumSourceMessages: COACH_AI_CHAT_MAX_CONTEXT_SOURCE_MESSAGES,
}));
