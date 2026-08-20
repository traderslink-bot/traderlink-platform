import { Buffer } from "node:buffer";

import Database from "better-sqlite3";

import type { CoachAiChatMessage } from
  "@/src/modules/coach/contracts/ai-chat-contracts";
import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "@/src/modules/coach/contracts/coach-ai-chat-factual-tool-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  buildCoachAiChatAdaptiveContext,
  buildCoachAiChatAdaptiveHistory,
} from "@/src/modules/coach/server/coach-ai-chat-adaptive-context";
import {
  buildCoachAiChatConversationState,
  finalizeCoachAiChatConversationState,
} from "@/src/modules/coach/server/coach-ai-chat-conversation-state";
import { CoachAiChatFactualToolDispatcher } from
  "@/src/modules/coach/server/coach-ai-chat-factual-tool-dispatcher";
import {
  projectCoachAiChatRelationshipMemoryContext,
  selectCoachAiChatRelationshipMemories,
} from "@/src/modules/coach/server/coach-ai-chat-relationship-memory-context";
import { CoachAiRelationshipMemoryRepository } from
  "@/src/modules/coach/server/coach-ai-relationship-memory-repository";
import { coachAiChatRelationshipMemoryMigration } from
  "@/src/modules/coach/server/database/migrations/0067_coach_ai_chat_relationship_memory";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function message(sequence: number, text: string): CoachAiChatMessage {
  const role = sequence % 2 === 0 ? "assistant" : "user";
  return Object.freeze({
    messageId: `professional-reliability-${sequence}`,
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
  (_, index) => message(index + 1, `brief exchange ${index + 1}`),
));
const retainedShortConversation = buildCoachAiChatAdaptiveHistory(
  "What were we discussing?",
  shortConversation,
);
invariant(retainedShortConversation.length === shortConversation.length,
  "At least 50 consecutive short messages must remain available by byte budget.");

const longConversation = Object.freeze(Array.from({ length: 120 }, (_, index) => {
  const sequence = index + 1;
  if (sequence === 3) {
    return message(sequence,
      `My focus is taking every fast breakout I see. ${"a".repeat(420)}`);
  }
  if (sequence === 41) {
    return message(sequence,
      `Actually, correction: my focus is patient A-plus breakouts, not chasing. ${"b".repeat(420)}`);
  }
  if (sequence === 83) {
    return message(sequence,
      `Please remember my opening-range setup needs volume confirmation. ${"c".repeat(420)}`);
  }
  return message(sequence, `intervening topic ${sequence} ${"x".repeat(420)}`);
}));
const topicReturn = buildCoachAiChatAdaptiveContext(
  "When we return to my opening-range setup, what did I say about volume confirmation?",
  longConversation,
);
invariant(topicReturn.recentFloorSequence !== null && topicReturn.recentFloorSequence > 83,
  "The topic-return fixture must sit outside the recent-context byte window.");
invariant(topicReturn.messages.some((item) => item.sequence === 83),
  "A relevant older topic must return through bounded retrieval.");

const startedState = buildCoachAiChatConversationState({
  previous: null,
  sourceMessages: longConversation,
  recentFloorSequence: topicReturn.recentFloorSequence,
  currentQuestion: "What is my corrected breakout focus?",
  currentUserMessageSequence: 121,
  analysisScope: Object.freeze({ kind: "recent" }),
  pageContext: null,
});
const initialNoteIndex = startedState.conversationNotes.findIndex((note) =>
  note.includes("taking every fast breakout"));
const correctedNoteIndex = startedState.conversationNotes.findIndex((note) =>
  note.includes("patient A-plus breakouts"));
invariant(initialNoteIndex >= 0 && correctedNoteIndex > initialNoteIndex,
  "The later explicit correction must remain ordered after the earlier statement.");
invariant(startedState.olderContextSummary?.includes("patient A-plus breakouts") === true,
  "The durable older-context summary must retain the later correction.");

const internalDraftId = "55000000-0000-4000-8000-000000000001";
const completedState = finalizeCoachAiChatConversationState({
  state: startedState,
  assistantMessageSequence: 122,
  nextQuestion: null,
  drafts: Object.freeze([Object.freeze({
    kind: "account_action" as const,
    internalId: internalDraftId,
    state: "proposed",
  })]),
});
invariant(!JSON.stringify(completedState).includes(internalDraftId) &&
  completedState.pendingDrafts[0]?.opaqueRef.length === 24,
"Potentially stale draft context must expose only an opaque reference.");

const ids = Object.freeze({
  user: "11000000-0000-4000-8000-000000000001",
  workspace: "22000000-0000-4000-8000-000000000001",
  accountA: "33000000-0000-4000-8000-000000000001",
  accountB: "44000000-0000-4000-8000-000000000001",
});
const database = new Database(":memory:");
database.pragma("foreign_keys = ON");
database.exec(`CREATE TABLE platform_users (
  user_id TEXT PRIMARY KEY,
  status TEXT NOT NULL
);
CREATE TABLE platform_workspaces (
  workspace_id TEXT PRIMARY KEY,
  status TEXT NOT NULL
);
CREATE TABLE platform_workspace_memberships (
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL,
  PRIMARY KEY (user_id, workspace_id)
);
CREATE TABLE journal_accounts (
  account_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE coach_ai_chat_conversations (
  coach_ai_chat_conversation_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  title TEXT NOT NULL
);
CREATE TABLE coach_ai_chat_messages (
  coach_ai_chat_message_id TEXT PRIMARY KEY,
  coach_ai_chat_conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  account_id TEXT NOT NULL
);`);
for (const statement of coachAiChatRelationshipMemoryMigration.statements) {
  database.exec(statement);
}
database.prepare("INSERT INTO platform_users VALUES (?, 'active')").run(ids.user);
database.prepare("INSERT INTO platform_workspaces VALUES (?, 'active')").run(ids.workspace);
database.prepare("INSERT INTO platform_workspace_memberships VALUES (?, ?, 'active')")
  .run(ids.user, ids.workspace);
database.prepare("INSERT INTO journal_accounts VALUES (?, ?, ?, 'active')")
  .run(ids.accountA, ids.workspace, "Day account");
database.prepare("INSERT INTO journal_accounts VALUES (?, ?, ?, 'active')")
  .run(ids.accountB, ids.workspace, "Swing account");

function scope(activeAccountId: string): WorkspaceAccessScope {
  return Object.freeze({
    userId: ids.user,
    workspaceId: ids.workspace,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([ids.accountA, ids.accountB]),
    activeAccountId,
  });
}

const scopeA = scope(ids.accountA);
const scopeB = scope(ids.accountB);
const memories = new CoachAiRelationshipMemoryRepository(database);
const rememberedAt = new Date("2026-01-01T15:00:00.000Z");
const userWideMemory = memories.create(scopeA, {
  scope: Object.freeze({ kind: "user" }),
  category: "current_focus",
  text: "I am practicing patient A-plus entries.",
  sourceKind: "direct_request",
}, rememberedAt);
const accountAMemory = memories.create(scopeA, {
  scope: Object.freeze({ kind: "account", accountId: ids.accountA }),
  category: "setups",
  text: "On this account I trade opening-range breakouts.",
  sourceKind: "direct_request",
}, new Date("2026-01-01T15:00:01.000Z"));
const accountBMemory = memories.create(scopeB, {
  scope: Object.freeze({ kind: "account", accountId: ids.accountB }),
  category: "setups",
  text: "On this account I track multi-day pullbacks.",
  sourceKind: "direct_request",
}, new Date("2026-01-01T15:00:02.000Z"));

const reliabilityNow = new Date("2026-08-20T15:00:00.000Z");
const accountBView = memories.read(scopeB, reliabilityNow);
invariant(accountBView.memories.some((memory) => memory.memoryId === userWideMemory.memoryId),
  "User-wide relationship memory must remain available after an account change.");
invariant(!accountBView.memories.some((memory) => memory.memoryId === accountAMemory.memoryId) &&
  accountBView.memories.some((memory) => memory.memoryId === accountBMemory.memoryId),
"Account-scoped relationship memory must change with the active account without leaking.");
const accountAView = memories.read(scopeA, reliabilityNow);
invariant(!accountAView.memories.some((memory) => memory.memoryId === accountBMemory.memoryId),
  "The first account must not read the second account's relationship memory.");
const staleMemory = accountBView.memories.find((memory) =>
  memory.memoryId === userWideMemory.memoryId);
invariant(staleMemory?.needsReview === true,
  "A time-sensitive memory beyond 90 days must be marked for review.");
invariant(projectCoachAiChatRelationshipMemoryContext([staleMemory])[0]?.status ===
  "previously_shared_needs_review",
"Stale personal context must not be projected to the provider as current.");

const reconfirmedView = memories.update(scopeB, userWideMemory.memoryId, {
  text: staleMemory.text,
  reconfirm: true,
}, reliabilityNow);
const reconfirmedMemory = reconfirmedView.memories.find((memory) =>
  memory.memoryId === userWideMemory.memoryId);
invariant(reconfirmedMemory?.needsReview === false &&
  reconfirmedMemory.sourceKind === "reconfirmation" &&
  Date.parse(reconfirmedMemory.reviewDueAtUtc ?? "") > reliabilityNow.getTime(),
"Reconfirmation must create a current version with a renewed review date.");

memories.forget(scopeB, accountBMemory.memoryId,
  new Date("2026-08-20T15:00:01.000Z"));
invariant(!memories.read(scopeB, reliabilityNow).memories.some((memory) =>
  memory.memoryId === accountBMemory.memoryId),
"Forgotten relationship content must leave the readable memory surface.");
const forgottenVersionCount = database.prepare(`SELECT count(*) AS count
FROM coach_ai_relationship_memory_versions
WHERE coach_ai_relationship_memory_id = ?`).get(accountBMemory.memoryId) as { count: number };
const forgottenEventCount = database.prepare(`SELECT count(*) AS count
FROM coach_ai_relationship_memory_events
WHERE coach_ai_relationship_memory_id = ?`).get(accountBMemory.memoryId) as { count: number };
invariant(forgottenVersionCount.count === 0 && forgottenEventCount.count === 2,
  "Forget must remove private content while retaining content-free audit events.");

const disabledSettings = memories.setEnabled(
  scopeB,
  false,
  new Date("2026-08-20T15:00:02.000Z"),
);
invariant(selectCoachAiChatRelationshipMemories(
  disabledSettings.enabled,
  memories.read(scopeB, reliabilityNow).memories,
).length === 0,
"Disabling relationship memory must produce an empty provider memory channel.");

let currentReportingCurrency = "USD";
const currentFactAccountReads: string[] = [];
const unavailable = (toolName: string) => Object.freeze({
  contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  toolName,
  result: Object.freeze({ state: "unavailable" }),
});
const baseTools = Object.freeze({
  summarizeClosedTrades: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
    unavailable(request.toolName),
  groupClosedTrades: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
    unavailable(request.toolName),
  listClosedTrades: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
    unavailable(request.toolName),
});
const details = Object.freeze({
  getClosedTradeDetails: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
    unavailable(request.toolName),
});
const productContext = Object.freeze({
  accountContext: (_scope: unknown, selectedAccountId: string, request: { toolName: string }) => {
    currentFactAccountReads.push(selectedAccountId);
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({ reportingCurrency: currentReportingCurrency }),
    });
  },
});
function currentFactDispatcher(
  activeScope: WorkspaceAccessScope,
  selectedAccountId: string,
  asOfUtc: string,
): CoachAiChatFactualToolDispatcher {
  return new CoachAiChatFactualToolDispatcher(
    baseTools as never,
    details as never,
    activeScope,
    selectedAccountId,
    asOfUtc,
    Object.freeze({ productContext: productContext as never }),
  );
}
const accountAResult = currentFactDispatcher(
  scopeA,
  ids.accountA,
  "2026-08-20T15:00:00.000Z",
).dispatch("current-fact-a", Object.freeze({
  contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  toolName: "get_account_preferences",
}));
currentReportingCurrency = "CAD";
const accountBResult = currentFactDispatcher(
  scopeB,
  ids.accountB,
  "2026-08-20T15:05:00.000Z",
).dispatch("current-fact-b", Object.freeze({
  contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  toolName: "get_account_preferences",
}));
invariant(JSON.stringify(accountAResult).includes("USD") &&
  JSON.stringify(accountBResult).includes("CAD") &&
  currentFactAccountReads.length === 2 &&
  currentFactAccountReads[0] === ids.accountA &&
  currentFactAccountReads[1] === ids.accountB,
"Current account facts must be reread from the active account instead of reused from conversation context.");

database.close();

console.log(JSON.stringify({
  status: "verified",
  shortMessagesRetained: retainedShortConversation.length,
  longConversationMessages: longConversation.length,
  topicReturnRetrieved: true,
  correctionOrderPreserved: true,
  durableStateBytes: Buffer.byteLength(JSON.stringify(completedState), "utf8"),
  staleDraftReferenceOpaque: true,
  userWideMemoryAcrossAccounts: true,
  accountMemoryIsolation: true,
  staleMemoryMarkedForReview: true,
  reconfirmationRenewedReviewDate: true,
  forgottenPrivateContentRemoved: true,
  disabledMemoryProviderCount: 0,
  currentFactRereads: currentFactAccountReads.length,
  currentFactAccountChangeVerified: true,
}));
