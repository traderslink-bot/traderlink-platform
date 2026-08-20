import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import type { CoachAiChatConversationState } from
  "../contracts/ai-chat-conversation-state-contracts";
import {
  COACH_AI_CHAT_CONVERSATION_STATE_CONTRACT_VERSION,
  type CoachAiChatConversationDraftKind,
} from "../contracts/ai-chat-conversation-state-contracts";
import type {
  CoachAiChatAnalysisScope,
  CoachAiChatMessage,
} from "../contracts/ai-chat-contracts";
import type { CoachAiChatPageContext } from
  "../contracts/ai-chat-page-context-contracts";

export const COACH_AI_CHAT_MAX_OLDER_CONTEXT_SUMMARY_BYTES = 8 * 1024;
export const COACH_AI_CHAT_MAX_CONVERSATION_STATE_BYTES = 16 * 1024;

const MAX_CONVERSATION_NOTES = 12;
const MAX_NOTE_CHARACTERS = 360;
const MAX_UNRESOLVED_QUESTIONS = 4;
const MAX_PENDING_DRAFTS = 8;
const EXPLICIT_NOTE_PATTERN = /\b(?:actually|correction|i meant|my goal|my focus|i prefer|please remember)\b/iu;

function messageText(message: CoachAiChatMessage): string {
  return (message.role === "user"
    ? message.originalUserTextPrivate
    : message.assistantTextPrivate) ?? "";
}

function cleanLine(value: string, maximumCharacters = MAX_NOTE_CHARACTERS): string {
  const normalized = value.replace(/\s+/gu, " ").trim();
  return normalized.length <= maximumCharacters
    ? normalized
    : `${normalized.slice(0, maximumCharacters - 1).trimEnd()}…`;
}

function boundedSummary(lines: readonly string[]): string | null {
  const accepted = [...lines].filter(Boolean);
  while (accepted.length > 0 &&
      Buffer.byteLength(accepted.join("\n"), "utf8") > COACH_AI_CHAT_MAX_OLDER_CONTEXT_SUMMARY_BYTES) {
    const ordinaryIndex = accepted.findIndex((line) => !EXPLICIT_NOTE_PATTERN.test(line));
    accepted.splice(ordinaryIndex >= 0 ? ordinaryIndex : 0, 1);
  }
  if (accepted.length === 0) return null;
  return accepted.join("\n");
}

function conversationNotes(
  previous: readonly string[],
  messages: readonly CoachAiChatMessage[],
  currentQuestion: string,
): readonly string[] {
  const notes = [...previous];
  for (const message of messages) {
    if (message.role !== "user") continue;
    const text = messageText(message);
    if (EXPLICIT_NOTE_PATTERN.test(text)) notes.push(cleanLine(text));
  }
  if (EXPLICIT_NOTE_PATTERN.test(currentQuestion)) notes.push(cleanLine(currentQuestion));
  const deduplicated = [...new Set(notes.filter(Boolean))];
  return Object.freeze(deduplicated.slice(-MAX_CONVERSATION_NOTES));
}

function safePageHint(pageContext: CoachAiChatPageContext | null):
    CoachAiChatConversationState["currentPageHint"] {
  return pageContext ? Object.freeze({
    feature: pageContext.feature,
    featureLabel: cleanLine(pageContext.featureLabel, 120),
    tradingDate: pageContext.tradingDate,
  }) : null;
}

function assertBoundedState(state: CoachAiChatConversationState): CoachAiChatConversationState {
  if (Buffer.byteLength(JSON.stringify(state), "utf8") >
      COACH_AI_CHAT_MAX_CONVERSATION_STATE_BYTES) {
    throw new Error("TRADERLINK_COACH_CONVERSATION_STATE_TOO_LARGE");
  }
  return Object.freeze(state);
}

export function buildCoachAiChatConversationState(input: Readonly<{
  previous: CoachAiChatConversationState | null;
  sourceMessages: readonly CoachAiChatMessage[];
  recentFloorSequence: number | null;
  currentQuestion: string;
  currentUserMessageSequence: number;
  analysisScope: CoachAiChatAnalysisScope;
  pageContext: CoachAiChatPageContext | null;
}>): CoachAiChatConversationState {
  const previousThrough = input.previous?.summarizedThroughSequence ?? 0;
  const summaryLines = input.previous?.olderContextSummary?.split("\n") ?? [];
  const recentFloorSequence = input.recentFloorSequence;
  const newlyOlder = recentFloorSequence === null
    ? []
    : input.sourceMessages.filter((message) =>
        message.sequence > previousThrough && message.sequence < recentFloorSequence &&
        (message.role === "user" || message.generationState === "completed"));
  for (const message of newlyOlder) {
    const text = cleanLine(messageText(message));
    if (text) summaryLines.push(`${message.role === "user" ? "Trader" : "Links"}: ${text}`);
  }
  const summarizedThroughSequence = newlyOlder.length > 0
    ? Math.max(...newlyOlder.map((message) => message.sequence))
    : previousThrough;
  return assertBoundedState(Object.freeze({
    contractVersion: COACH_AI_CHAT_CONVERSATION_STATE_CONTRACT_VERSION,
    stateSequence: (input.previous?.stateSequence ?? 0) + 1,
    activeQuestion: cleanLine(input.currentQuestion, 4_000),
    analysisScope: input.analysisScope,
    currentPageHint: safePageHint(input.pageContext),
    unresolvedQuestions: input.previous?.unresolvedQuestions ?? Object.freeze([]),
    conversationNotes: conversationNotes(
      input.previous?.conversationNotes ?? Object.freeze([]),
      input.sourceMessages,
      input.currentQuestion,
    ),
    pendingDrafts: input.previous?.pendingDrafts ?? Object.freeze([]),
    olderContextSummary: boundedSummary(summaryLines),
    summarizedThroughSequence,
    sourceMessageSequenceThrough: input.currentUserMessageSequence,
  }));
}

function opaqueRef(kind: CoachAiChatConversationDraftKind, internalId: string): string {
  return createHash("sha256").update(`${kind}\n${internalId}`, "utf8")
    .digest("hex").slice(0, 24);
}

export function finalizeCoachAiChatConversationState(input: Readonly<{
  state: CoachAiChatConversationState;
  assistantMessageSequence: number;
  nextQuestion: string | null;
  drafts: readonly Readonly<{
    kind: CoachAiChatConversationDraftKind;
    internalId: string;
    state: string;
  }>[];
}>): CoachAiChatConversationState {
  const drafts = [...input.state.pendingDrafts, ...input.drafts.map((draft) => Object.freeze({
    kind: draft.kind,
    opaqueRef: opaqueRef(draft.kind, draft.internalId),
    state: cleanLine(draft.state, 80),
  }))];
  const uniqueDrafts = [...new Map(drafts.map((draft) => [
    `${draft.kind}:${draft.opaqueRef}`,
    draft,
  ])).values()].slice(-MAX_PENDING_DRAFTS);
  return assertBoundedState(Object.freeze({
    ...input.state,
    unresolvedQuestions: input.nextQuestion
      ? Object.freeze([cleanLine(input.nextQuestion, 400)].slice(-MAX_UNRESOLVED_QUESTIONS))
      : Object.freeze([]),
    pendingDrafts: Object.freeze(uniqueDrafts),
    sourceMessageSequenceThrough: input.assistantMessageSequence,
  }));
}

export function parseCoachAiChatConversationState(value: unknown):
    CoachAiChatConversationState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<CoachAiChatConversationState>;
  if (candidate.contractVersion !== COACH_AI_CHAT_CONVERSATION_STATE_CONTRACT_VERSION ||
      !Number.isSafeInteger(candidate.stateSequence) || (candidate.stateSequence ?? 0) < 1 ||
      typeof candidate.activeQuestion !== "string" ||
      !candidate.analysisScope || typeof candidate.analysisScope !== "object" ||
      !Array.isArray(candidate.unresolvedQuestions) ||
      !Array.isArray(candidate.conversationNotes) || !Array.isArray(candidate.pendingDrafts) ||
      (candidate.olderContextSummary !== null &&
        typeof candidate.olderContextSummary !== "string") ||
      !Number.isSafeInteger(candidate.summarizedThroughSequence) ||
      !Number.isSafeInteger(candidate.sourceMessageSequenceThrough)) return null;
  if (Buffer.byteLength(JSON.stringify(candidate), "utf8") >
      COACH_AI_CHAT_MAX_CONVERSATION_STATE_BYTES) return null;
  return Object.freeze(candidate as CoachAiChatConversationState);
}
