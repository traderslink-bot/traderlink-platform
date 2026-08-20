import type { CoachAiChatMessage } from
  "@/src/modules/coach/contracts/ai-chat-contracts";
import Database from "better-sqlite3";
import { buildCoachAiChatAdaptiveContext } from
  "@/src/modules/coach/server/coach-ai-chat-adaptive-context";
import {
  buildCoachAiChatConversationState,
  COACH_AI_CHAT_MAX_CONVERSATION_STATE_BYTES,
  finalizeCoachAiChatConversationState,
  parseCoachAiChatConversationState,
} from "@/src/modules/coach/server/coach-ai-chat-conversation-state";
import { CoachAiChatConversationStateRepository } from
  "@/src/modules/coach/server/coach-ai-chat-conversation-state-repository";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function message(sequence: number, text: string): CoachAiChatMessage {
  const role = sequence % 2 === 0 ? "assistant" : "user";
  return Object.freeze({
    messageId: `durable-message-${sequence}`,
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

const messages = Object.freeze(Array.from({ length: 80 }, (_, index) => message(
  index + 1,
  index === 2
    ? `Correction: my opening-range goal is patience. ${"x".repeat(500)}`
    : `conversation turn ${index + 1} ${"x".repeat(500)}`,
)));
const adaptive = buildCoachAiChatAdaptiveContext("What did we decide?", messages);
invariant(adaptive.recentFloorSequence !== null && adaptive.recentFloorSequence > 3,
  "The long conversation must create an older-context boundary.");

const started = buildCoachAiChatConversationState({
  previous: null,
  sourceMessages: messages,
  recentFloorSequence: adaptive.recentFloorSequence,
  currentQuestion: "What did we decide?",
  currentUserMessageSequence: 81,
  analysisScope: Object.freeze({ kind: "recent" }),
  pageContext: null,
});
invariant(started.olderContextSummary?.includes("opening-range goal is patience") === true,
  "The bounded older-context summary must retain the explicit correction.");
invariant(started.conversationNotes.some((note) =>
  note.includes("opening-range goal is patience")),
"Explicit corrections must also remain in structured conversation notes.");

const internalDraftId = "018f2f2b-47f5-4c62-8fd2-e1e20c76ba85";
const completed = finalizeCoachAiChatConversationState({
  state: started,
  assistantMessageSequence: 82,
  nextQuestion: "Do you want to compare that with your last five sessions?",
  drafts: Object.freeze([Object.freeze({
    kind: "account_action" as const,
    internalId: internalDraftId,
    state: "proposed",
  })]),
});
const serialized = JSON.stringify(completed);
invariant(Buffer.byteLength(serialized, "utf8") <= COACH_AI_CHAT_MAX_CONVERSATION_STATE_BYTES,
  "Conversation state must stay inside its provider and snapshot byte budget.");
invariant(!serialized.includes(internalDraftId),
  "Internal draft identifiers must be replaced with provider-safe opaque references.");
invariant(completed.pendingDrafts[0]?.opaqueRef.length === 24,
  "Pending drafts must retain a stable bounded opaque reference.");
invariant(parseCoachAiChatConversationState(JSON.parse(serialized)) !== null,
  "A saved conversation state must pass the runtime parser.");
invariant(parseCoachAiChatConversationState({ ...completed, stateSequence: 0 }) === null,
  "A malformed state version must be rejected.");

const database = new Database(":memory:");
database.exec(`CREATE TABLE coach_ai_chat_messages (
  coach_ai_chat_message_id TEXT PRIMARY KEY,
  message_sequence INTEGER NOT NULL
);
CREATE TABLE coach_ai_chat_answer_snapshots (
  coach_ai_chat_message_id TEXT NOT NULL,
  coach_ai_chat_conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  factual_snapshot_json TEXT NOT NULL
);`);
const ids = Object.freeze({
  user: "11111111-1111-4111-8111-111111111111",
  workspace: "22222222-2222-4222-8222-222222222222",
  account: "33333333-3333-4333-8333-333333333333",
  conversation: "44444444-4444-4444-8444-444444444444",
  message: "55555555-5555-4555-8555-555555555555",
  otherAccount: "66666666-6666-4666-8666-666666666666",
  otherConversation: "77777777-7777-4777-8777-777777777777",
});
database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, message_sequence
) VALUES (?, ?)` ).run(ids.message, 82);
database.prepare(`INSERT INTO coach_ai_chat_answer_snapshots (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id,
  workspace_id, account_id, factual_snapshot_json
) VALUES (?, ?, ?, ?, ?, ?)` ).run(
  ids.message,
  ids.conversation,
  ids.user,
  ids.workspace,
  ids.account,
  JSON.stringify({ conversationState: completed }),
);
const repository = new CoachAiChatConversationStateRepository(database);
const restored = repository.readLatest(Object.freeze({
  userId: ids.user,
  workspaceId: ids.workspace,
  workspaceRole: "owner" as const,
  activeAccountId: ids.account,
  allowedAccountIds: Object.freeze([ids.account]),
}), ids.conversation);
invariant(restored?.sourceMessageSequenceThrough === 82,
  "The latest valid state must restore from its immutable answer snapshot.");
const isolated = repository.readLatest(Object.freeze({
  userId: ids.user,
  workspaceId: ids.workspace,
  workspaceRole: "owner" as const,
  activeAccountId: ids.otherAccount,
  allowedAccountIds: Object.freeze([ids.otherAccount]),
}), ids.conversation);
invariant(isolated === null,
  "A different active Journal account must not read the conversation state.");
database.close();

console.log(JSON.stringify({
  status: "verified",
  sourceMessages: messages.length,
  summarizedThroughSequence: completed.summarizedThroughSequence,
  summaryBytes: Buffer.byteLength(completed.olderContextSummary ?? "", "utf8"),
  stateBytes: Buffer.byteLength(serialized, "utf8"),
  explicitCorrectionRetained: true,
  internalDraftIdHidden: true,
  malformedStateRejected: true,
  snapshotStateRestored: true,
  accountIsolationVerified: true,
}));
