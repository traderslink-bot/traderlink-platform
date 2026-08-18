import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type {
  CoachAiChatEvidenceCard,
  CoachAiChatMessageEvidence,
} from "@/src/modules/coach/contracts/coach-ai-chat-evidence-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { COACH_AI_CHAT_EVIDENCE_CARD_MAX_COUNT } from "@/src/modules/coach/contracts/coach-ai-chat-evidence-contracts";

const MAX_MESSAGE_IDS = 100;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

type SnapshotRow = Readonly<{
  messageId: string;
  factualSnapshotJson: string;
  factualSnapshotSha256: string;
}>;

type JsonRecord = Readonly<Record<string, unknown>>;

type EvidenceReference = Readonly<{
  toolCallId: string;
}>;

type FactualToolCall = Readonly<{
  toolCallId: string;
  toolName: string;
  result: JsonRecord;
}>;

type EvidenceDefinition = Readonly<{
  title: string;
  href: string | null;
  linkLabel: string | null;
}>;

const EVIDENCE_DEFINITIONS: Readonly<Record<string, EvidenceDefinition>> = Object.freeze({
  summarize_closed_trades: { title: "Closed trades", href: "/analytics", linkLabel: "Open analytics" },
  group_closed_trades: { title: "Trade results", href: "/analytics/results", linkLabel: "Open results" },
  list_closed_trades: { title: "Completed trades", href: "/analytics/execution", linkLabel: "Open executions" },
  get_closed_trade_details: { title: "Trade details", href: "/analytics/execution", linkLabel: "Open executions" },
  summarize_journal_period: { title: "Journal period", href: "/workspace", linkLabel: "Open workspace" },
  list_saved_ai_reviews: { title: "AI reviews", href: "/ai-reviews", linkLabel: "Open AI reviews" },
  get_saved_ai_review: { title: "AI review", href: "/ai-reviews", linkLabel: "Open AI reviews" },
  search_product_help: { title: "Help Center", href: "/help", linkLabel: "Open Help Center" },
  get_workspace_summary: { title: "Workspace", href: "/workspace", linkLabel: "Open workspace" },
  get_trading_day_details: { title: "Trading day", href: "/trade-tracker", linkLabel: "Open tracker" },
  get_calendar_period: { title: "Calendar", href: "/calendar", linkLabel: "Open calendar" },
  list_open_positions: { title: "Open positions", href: "/trades/open", linkLabel: "Open positions" },
  get_open_position_details: { title: "Open position", href: "/trades/open", linkLabel: "Open positions" },
  list_swing_positions: { title: "Swing trades", href: "/trade-tracker/swings", linkLabel: "Open swing tracker" },
  get_swing_position_details: { title: "Swing trade", href: "/trade-tracker/swings", linkLabel: "Open swing tracker" },
  get_analytics_overview: { title: "Analytics overview", href: "/analytics", linkLabel: "Open analytics" },
  get_results_by_ticker: { title: "Results by ticker", href: "/analytics/results", linkLabel: "Open results" },
  get_timing_analytics: { title: "Timing", href: "/analytics/timing", linkLabel: "Open timing" },
  get_execution_analytics: { title: "Executions", href: "/analytics/execution", linkLabel: "Open executions" },
  query_trade_explorer: { title: "Trade Explorer", href: "/analytics/trade-explorer", linkLabel: "Open Trade Explorer" },
  list_imports: { title: "Imports", href: "/imports", linkLabel: "Open imports" },
  list_data_decisions: { title: "Data Decisions", href: "/data-decisions", linkLabel: "Open Data Decisions" },
  get_data_decision_details: { title: "Data Decision", href: "/data-decisions", linkLabel: "Open Data Decisions" },
  list_notifications: { title: "Notifications", href: "/notifications", linkLabel: "Open notifications" },
  get_account_profile: { title: "Account profile", href: "/account/profile", linkLabel: "Open profile" },
  get_account_trading: { title: "Trading settings", href: "/account/trading", linkLabel: "Open trading settings" },
  get_account_preferences: { title: "Preferences", href: "/account/preferences", linkLabel: "Open preferences" },
  get_account_ai_plan: { title: "AI plan", href: "/account/ai", linkLabel: "Open AI settings" },
  get_trade_analyzer_results: { title: "Trade Analyzer", href: "/analytics/trade-analyzer/day", linkLabel: "Open Trade Analyzer" },
  list_analyzed_trades: { title: "Analyzed trades", href: "/analytics/trade-analyzer/day/trades", linkLabel: "Open analyzed trades" },
  get_saved_candle_review: { title: "Candle review", href: "/trades/candle-review", linkLabel: "Open candle review" },
  list_trading_rules: { title: "Trading rules", href: "/rules", linkLabel: "Open rules" },
  get_trading_rule_results: { title: "Trading rule results", href: "/rules/results", linkLabel: "Open rule results" },
  get_trade_annotations: { title: "Completed trade Review", href: "/analytics/trade-explorer", linkLabel: "Open Trade Explorer" },
});

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

function verifiedSnapshot(value: unknown, sha256: string): JsonRecord | null {
  if (!isRecord(value) || !/^[0-9a-f]{64}$/u.test(sha256)) return null;
  const json = JSON.stringify(canonicalize(value));
  const expected = createHash("sha256").update(`${json}\n`, "utf8").digest("hex");
  return expected === sha256 ? value : null;
}

function evidenceReferences(snapshot: JsonRecord): readonly EvidenceReference[] {
  const answer = snapshot.answer;
  if (!isRecord(answer) || !Array.isArray(answer.evidenceReferences)) return Object.freeze([]);
  const references: EvidenceReference[] = [];
  for (const value of answer.evidenceReferences) {
    if (!isRecord(value) || typeof value.toolCallId !== "string") continue;
    if (value.toolCallId.length < 1 || value.toolCallId.length > 160) continue;
    references.push(Object.freeze({ toolCallId: value.toolCallId }));
  }
  return Object.freeze(references);
}

function factualToolCalls(snapshot: JsonRecord): ReadonlyMap<string, FactualToolCall> {
  if (!Array.isArray(snapshot.factualToolCalls)) return new Map();
  const calls = new Map<string, FactualToolCall>();
  for (const value of snapshot.factualToolCalls) {
    if (!isRecord(value) || typeof value.toolCallId !== "string" || typeof value.toolName !== "string" ||
        !isRecord(value.result) || !EVIDENCE_DEFINITIONS[value.toolName] ||
        value.toolCallId.length < 1 || value.toolCallId.length > 160 || calls.has(value.toolCallId)) continue;
    calls.set(value.toolCallId, Object.freeze({
      toolCallId: value.toolCallId,
      toolName: value.toolName,
      result: value.result,
    }));
  }
  return calls;
}

function boundedIds(messageIds: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(messageIds)]
    .filter((messageId) => UUID_V4_PATTERN.test(messageId))
    .slice(0, MAX_MESSAGE_IDS));
}

function card(call: FactualToolCall): CoachAiChatEvidenceCard {
  const definition = EVIDENCE_DEFINITIONS[call.toolName]!;
  return Object.freeze({
    title: definition.title,
    href: definition.href,
    linkLabel: definition.linkLabel,
  });
}

/**
 * Converts immutable, already-account-scoped answer snapshots into a compact
 * presentation model. Invalid or unrelated records deliberately disappear
 * instead of exposing their payload or affecting the surrounding chat.
 */
export class CoachAiChatEvidenceService {
  constructor(private readonly database: Database.Database) {}

  readForMessages(
    scope: WorkspaceAccessScope,
    conversationId: string,
    assistantMessageIds: readonly string[],
  ): readonly CoachAiChatMessageEvidence[] {
    if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
      return Object.freeze([]);
    }
    if (!UUID_V4_PATTERN.test(conversationId)) return Object.freeze([]);
    const ids = boundedIds(assistantMessageIds);
    if (ids.length === 0) return Object.freeze([]);
    const placeholders = ids.map(() => "?").join(", ");
    const rows = this.database.prepare<unknown[], SnapshotRow>(`SELECT
  snapshot.coach_ai_chat_message_id AS messageId,
  snapshot.factual_snapshot_json AS factualSnapshotJson,
  snapshot.factual_snapshot_sha256 AS factualSnapshotSha256
FROM coach_ai_chat_answer_snapshots snapshot
JOIN coach_ai_chat_messages message
  ON message.coach_ai_chat_message_id = snapshot.coach_ai_chat_message_id
JOIN coach_ai_chat_conversations conversation
  ON conversation.coach_ai_chat_conversation_id = snapshot.coach_ai_chat_conversation_id
WHERE snapshot.coach_ai_chat_conversation_id = ?
  AND snapshot.user_id = ? AND snapshot.workspace_id = ? AND snapshot.account_id = ?
  AND message.user_id = snapshot.user_id AND message.workspace_id = snapshot.workspace_id
  AND message.account_id = snapshot.account_id AND message.role = 'assistant'
  AND message.generation_state = 'completed'
  AND conversation.user_id = snapshot.user_id AND conversation.workspace_id = snapshot.workspace_id
  AND conversation.account_id = snapshot.account_id
  AND snapshot.coach_ai_chat_message_id IN (${placeholders})`).all(
      conversationId,
      scope.userId,
      scope.workspaceId,
      scope.activeAccountId,
      ...ids,
    );
    const byMessageId = new Map(rows.map((row) => [row.messageId, row]));
    const evidence: CoachAiChatMessageEvidence[] = [];
    for (const messageId of ids) {
      const row = byMessageId.get(messageId);
      if (!row) continue;
      let parsed: unknown;
      try { parsed = JSON.parse(row.factualSnapshotJson) as unknown; } catch { continue; }
      const snapshot = verifiedSnapshot(parsed, row.factualSnapshotSha256);
      if (!snapshot) continue;
      const calls = factualToolCalls(snapshot);
      const seen = new Set<string>();
      const cards: CoachAiChatEvidenceCard[] = [];
      for (const reference of evidenceReferences(snapshot)) {
        if (seen.has(reference.toolCallId)) continue;
        const factualCall = calls.get(reference.toolCallId);
        if (!factualCall) continue;
        seen.add(reference.toolCallId);
        cards.push(card(factualCall));
        if (cards.length === COACH_AI_CHAT_EVIDENCE_CARD_MAX_COUNT) break;
      }
      if (cards.length > 0) evidence.push(Object.freeze({
        messageId,
        cards: Object.freeze(cards),
      }));
    }
    return Object.freeze(evidence);
  }
}
