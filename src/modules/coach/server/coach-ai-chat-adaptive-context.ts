import { Buffer } from "node:buffer";

import type { CoachAiChatMessage } from
  "@/src/modules/coach/contracts/ai-chat-contracts";

export const COACH_AI_CHAT_MAX_CONTEXT_SOURCE_MESSAGES = 400;
export const COACH_AI_CHAT_RECENT_CONTEXT_BYTES = 12 * 1024;
export const COACH_AI_CHAT_RETRIEVED_CONTEXT_BYTES = 4 * 1024;

export type CoachAiChatAdaptiveContext = Readonly<{
  messages: readonly CoachAiChatMessage[];
  recentFloorSequence: number | null;
}>;

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}._-]*/gu;
const STOP_WORDS = new Set([
  "a", "about", "and", "are", "as", "at", "be", "but", "by", "can",
  "do", "for", "from", "had", "has", "have", "how", "i", "in", "is",
  "it", "me", "my", "of", "on", "or", "that", "the", "this", "to",
  "was", "what", "when", "where", "which", "who", "why", "with", "you",
]);

function messageText(message: CoachAiChatMessage): string {
  return (message.role === "user"
    ? message.originalUserTextPrivate
    : message.assistantTextPrivate) ?? "";
}

function terms(value: string): ReadonlySet<string> {
  return new Set((value.toLocaleLowerCase().match(WORD_PATTERN) ?? [])
    .filter((term) => term.length >= 2 && !STOP_WORDS.has(term)));
}

function relevance(message: CoachAiChatMessage, queryTerms: ReadonlySet<string>): number {
  const textTerms = terms(messageText(message));
  let score = 0;
  for (const term of queryTerms) {
    if (textTerms.has(term)) score += term.length >= 5 ? 3 : 1;
  }
  if (message.role === "user" && /\b(?:actually|correction|i meant|remember|my goal|my focus)\b/iu
    .test(messageText(message))) score += 2;
  return score;
}

/**
 * Builds one chronological, bounded same-conversation package. Recent context
 * is selected by bytes rather than message count, so many short turns remain
 * available. Older messages compete for a separate relevance budget.
 */
export function buildCoachAiChatAdaptiveContext(
  question: string,
  messages: readonly CoachAiChatMessage[],
): CoachAiChatAdaptiveContext {
  const eligible = messages.filter((message) =>
    message.role === "user" || message.generationState === "completed");
  const recentIds = new Set<string>();
  let recentBytes = 0;
  for (const message of [...eligible].reverse()) {
    const bytes = Buffer.byteLength(messageText(message), "utf8");
    if (recentBytes + bytes > COACH_AI_CHAT_RECENT_CONTEXT_BYTES) break;
    recentBytes += bytes;
    recentIds.add(message.messageId);
  }

  const recent = eligible.filter((message) => recentIds.has(message.messageId));
  const querySeed = [question, ...recent.filter((message) => message.role === "user")
    .slice(-4).map(messageText)].join(" ");
  const queryTerms = terms(querySeed);
  const older = eligible
    .filter((message) => !recentIds.has(message.messageId))
    .map((message) => Object.freeze({ message, score: relevance(message, queryTerms) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score ||
      right.message.sequence - left.message.sequence);

  const retrievedIds = new Set<string>();
  let retrievedBytes = 0;
  for (const { message } of older) {
    const bytes = Buffer.byteLength(messageText(message), "utf8");
    if (retrievedBytes + bytes > COACH_AI_CHAT_RETRIEVED_CONTEXT_BYTES) continue;
    retrievedBytes += bytes;
    retrievedIds.add(message.messageId);
  }
  const selected = Object.freeze(eligible.filter((message) =>
    recentIds.has(message.messageId) || retrievedIds.has(message.messageId)));
  return Object.freeze({
    messages: selected,
    recentFloorSequence: recent.length > 0
      ? Math.min(...recent.map((message) => message.sequence))
      : null,
  });
}

export function buildCoachAiChatAdaptiveHistory(
  question: string,
  messages: readonly CoachAiChatMessage[],
): readonly CoachAiChatMessage[] {
  return buildCoachAiChatAdaptiveContext(question, messages).messages;
}
