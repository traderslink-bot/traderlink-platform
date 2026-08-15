import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import type {
  CoachAiChatAnalysisScope,
  CoachAiChatConversationCursor,
  CoachAiChatMessageIntent,
  CoachAiChatMessageCursor,
} from "@/src/modules/coach/contracts/ai-chat-contracts";
import type { CoachAiDailyCompanionContextSelector } from "@/src/modules/coach/contracts/ai-daily-companion-contracts";
import { CoachAiChatRepository } from "@/src/modules/coach/server/coach-ai-chat-repository";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { assertCanonicalUuidV4, isCanonicalUtcTimestamp, isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

const MAX_CURSOR_LENGTH = 1024;
const MAX_PAGE_LIMIT = 100;
const MAX_CONVERSATION_SEARCH_LENGTH = 120;
const MAX_JSON_BODY_BYTES = 8 * 1024;
const INTEGER_PATTERN = /^(?:0|[1-9][0-9]*)$/u;
const CURSOR_PATTERN = /^[A-Za-z0-9_-]{1,1024}$/u;

type ConversationListQuery = Readonly<{
  state: "active" | "archived";
  search: string | null;
  limit: number;
  cursor: CoachAiChatConversationCursor | null;
}>;

type MessageHistoryQuery = Readonly<{
  limit: number;
  cursor: CoachAiChatMessageCursor | null;
}>;

export type ConversationPatch =
  | Readonly<{ action: "rename"; title: string }>
  | Readonly<{ action: "archive" }>
  | Readonly<{ action: "restore" }>;

export type GenerateChatMessageInput = Readonly<{
  question: string;
  clientRequestId: string;
  context: CoachAiDailyCompanionContextSelector | null;
  analysisScope: CoachAiChatAnalysisScope;
  intent: CoachAiChatMessageIntent;
}>;

function invalidRequest(field: string): never {
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => keys.includes(key));
}

function readSingleQueryValue(url: URL, key: string): string | null {
  const values = url.searchParams.getAll(key);
  if (values.length > 1) invalidRequest(key);
  return values[0] ?? null;
}

function assertKnownQueryKeys(url: URL, allowed: readonly string[]): void {
  const allowedKeys = new Set(allowed);
  for (const key of new Set(url.searchParams.keys())) {
    if (!allowedKeys.has(key)) invalidRequest(key);
  }
}

function parseLimit(value: string | null, defaultValue: number, field: string): number {
  if (value === null) return defaultValue;
  if (!INTEGER_PATTERN.test(value)) invalidRequest(field);
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
    invalidRequest(field);
  }
  return limit;
}

function encodeCursor(value: object): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeCursor(value: string, field: string): unknown {
  if (value.length > MAX_CURSOR_LENGTH || !CURSOR_PATTERN.test(value)) {
    invalidRequest(field);
  }
  let decoded: string;
  try {
    decoded = Buffer.from(value, "base64url").toString("utf8");
    if (Buffer.from(decoded, "utf8").toString("base64url") !== value) {
      invalidRequest(field);
    }
  } catch {
    invalidRequest(field);
  }
  try {
    return JSON.parse(decoded) as unknown;
  } catch {
    invalidRequest(field);
  }
}

function parseConversationCursor(value: string | null): CoachAiChatConversationCursor | null {
  if (value === null) return null;
  const decoded = decodeCursor(value, "cursor");
  if (!isRecord(decoded) || !hasExactKeys(decoded, ["updatedAtUtc", "conversationId"]) ||
      typeof decoded.updatedAtUtc !== "string" || !isCanonicalUtcTimestamp(decoded.updatedAtUtc) ||
      typeof decoded.conversationId !== "string") {
    invalidRequest("cursor");
  }
  assertCanonicalUuidV4(decoded.conversationId, "cursor");
  return Object.freeze({
    updatedAtUtc: decoded.updatedAtUtc,
    conversationId: decoded.conversationId,
  });
}

function parseMessageCursor(value: string | null): CoachAiChatMessageCursor | null {
  if (value === null) return null;
  const decoded = decodeCursor(value, "cursor");
  if (!isRecord(decoded) || !hasExactKeys(decoded, ["beforeSequence"]) ||
      typeof decoded.beforeSequence !== "number" || !Number.isSafeInteger(decoded.beforeSequence) ||
      decoded.beforeSequence < 2) {
    invalidRequest("cursor");
  }
  return Object.freeze({ beforeSequence: decoded.beforeSequence });
}

export function encodeConversationPageCursor(cursor: CoachAiChatConversationCursor | null): string | null {
  return cursor ? encodeCursor(cursor) : null;
}

export function encodeMessagePageCursor(cursor: CoachAiChatMessageCursor | null): string | null {
  return cursor ? encodeCursor(cursor) : null;
}

export function parseConversationListQuery(url: URL): ConversationListQuery {
  assertKnownQueryKeys(url, ["state", "search", "limit", "cursor"]);
  const state = readSingleQueryValue(url, "state") ?? "active";
  if (state !== "active" && state !== "archived") invalidRequest("state");
  const rawSearch = readSingleQueryValue(url, "search");
  const search = rawSearch?.trim() ?? "";
  if (search.length > MAX_CONVERSATION_SEARCH_LENGTH || /[\u0000-\u001f\u007f]/u.test(search)) {
    invalidRequest("search");
  }
  return Object.freeze({
    state,
    search: search.length > 0 ? search : null,
    limit: parseLimit(readSingleQueryValue(url, "limit"), 30, "limit"),
    cursor: parseConversationCursor(readSingleQueryValue(url, "cursor")),
  });
}

export function parseMessageHistoryQuery(url: URL): MessageHistoryQuery {
  assertKnownQueryKeys(url, ["limit", "cursor"]);
  return Object.freeze({
    limit: parseLimit(readSingleQueryValue(url, "limit"), 50, "limit"),
    cursor: parseMessageCursor(readSingleQueryValue(url, "cursor")),
  });
}

export function assertNoQueryParameters(url: URL): void {
  if ([...url.searchParams.keys()].length > 0) invalidRequest("query");
}

export function parseConversationId(value: unknown): string {
  if (typeof value !== "string") invalidRequest("conversationId");
  assertCanonicalUuidV4(value, "conversationId");
  return value;
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null &&
      (!INTEGER_PATTERN.test(contentLength) || Number(contentLength) > MAX_JSON_BODY_BYTES)) {
    invalidRequest("body");
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    invalidRequest("body");
  }
  if (text.length === 0 || Buffer.byteLength(text, "utf8") > MAX_JSON_BODY_BYTES) {
    invalidRequest("body");
  }
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    invalidRequest("body");
  }
  if (!isRecord(body)) invalidRequest("body");
  return body;
}

export function parseCreateConversationBody(body: Record<string, unknown>): string {
  if (!hasExactKeys(body, ["title"]) || typeof body.title !== "string") {
    invalidRequest("title");
  }
  return body.title;
}

export function parseConversationPatchBody(body: Record<string, unknown>): ConversationPatch {
  if (typeof body.action !== "string") invalidRequest("action");
  if (body.action === "rename") {
    if (!hasExactKeys(body, ["action", "title"]) || typeof body.title !== "string") {
      invalidRequest("title");
    }
    return Object.freeze({ action: "rename", title: body.title });
  }
  if ((body.action === "archive" || body.action === "restore") && hasExactKeys(body, ["action"])) {
    return Object.freeze({ action: body.action });
  }
  invalidRequest("action");
}

export function parseGenerateChatMessageBody(body: Record<string, unknown>): GenerateChatMessageInput {
  const expectedKeys = [
    "question",
    "clientRequestId",
    ...(body.context === undefined ? [] : ["context"]),
    ...(body.analysisScope === undefined ? [] : ["analysisScope"]),
    ...(body.intent === undefined ? [] : ["intent"]),
  ];
  if (!hasExactKeys(body, expectedKeys) ||
      typeof body.question !== "string" || body.question.trim().length === 0 ||
      typeof body.clientRequestId !== "string") {
    invalidRequest("message");
  }
  assertCanonicalUuidV4(body.clientRequestId, "clientRequestId");
  const intent = body.intent === undefined ? "answer_question" : body.intent;
  if (intent !== "answer_question" && intent !== "prepare_manual_execution_draft") {
    invalidRequest("intent");
  }
  let context: CoachAiDailyCompanionContextSelector | null = null;
  if (body.context !== undefined) {
    if (!isRecord(body.context) || !hasExactKeys(body.context, ["kind", "tradingDate", "currency"]) ||
        body.context.kind !== "daily_review" || typeof body.context.tradingDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/u.test(body.context.tradingDate) ||
        typeof body.context.currency !== "string" || !/^[A-Z]{3}$/u.test(body.context.currency)) {
      invalidRequest("context");
    }
    context = Object.freeze({
      kind: "daily_review",
      tradingDate: body.context.tradingDate,
      currency: body.context.currency,
    });
  }
  if (context && intent !== "answer_question") invalidRequest("intent");
  const analysisScope = parseAnalysisScope(body.analysisScope);
  return Object.freeze({
    question: body.question,
    clientRequestId: body.clientRequestId,
    context,
    analysisScope,
    intent,
  });
}

function parseAnalysisScope(value: unknown): CoachAiChatAnalysisScope {
  if (value === undefined) return Object.freeze({ kind: "recent" });
  if (!isRecord(value) || typeof value.kind !== "string") invalidRequest("analysisScope");
  if (value.kind === "recent" && hasExactKeys(value, ["kind"])) {
    return Object.freeze({ kind: "recent" });
  }
  if (value.kind === "day" && hasExactKeys(value, ["kind", "date"]) &&
      typeof value.date === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value.date)) {
    return Object.freeze({ kind: "day", date: value.date });
  }
  if (value.kind === "week" && hasExactKeys(value, ["kind", "anchorDate"]) &&
      typeof value.anchorDate === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value.anchorDate)) {
    return Object.freeze({ kind: "week", anchorDate: value.anchorDate });
  }
  if (value.kind === "month" && hasExactKeys(value, ["kind", "month"]) &&
      typeof value.month === "string" && /^\d{4}-\d{2}$/u.test(value.month)) {
    return Object.freeze({ kind: "month", month: value.month });
  }
  if (value.kind === "custom" && hasExactKeys(value, ["kind", "startDate", "endDate"]) &&
      typeof value.startDate === "string" && typeof value.endDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/u.test(value.startDate) && /^\d{4}-\d{2}-\d{2}$/u.test(value.endDate) &&
      value.startDate <= value.endDate) {
    return Object.freeze({ kind: "custom", startDate: value.startDate, endDate: value.endDate });
  }
  if (value.kind === "ticker" && hasExactKeys(value, ["kind", "ticker"]) &&
      typeof value.ticker === "string" && /^[A-Za-z0-9.\-]{1,32}$/u.test(value.ticker.trim())) {
    return Object.freeze({ kind: "ticker", ticker: value.ticker.trim().toUpperCase() });
  }
  invalidRequest("analysisScope");
}

export function createChatGenerationIdempotencySha256(
  conversationId: string,
  clientRequestId: string,
  intent: CoachAiChatMessageIntent = "answer_question",
): string {
  return createHash("sha256")
    .update("traderlink-coach-chat-generation-v2\0", "utf8")
    .update(conversationId, "utf8")
    .update("\0", "utf8")
    .update(clientRequestId, "utf8")
    .update("\0", "utf8")
    .update(intent, "utf8")
    .digest("hex");
}

export function withReadonlyChatRepository<T>(
  scope: WorkspaceAccessScope,
  operation: (repository: CoachAiChatRepository) => T,
): T {
  return withReadonlyPlatformDatabase({}, (database) => operation(new CoachAiChatRepository(database)));
}

export function withWritableChatRepository<T>(
  scope: WorkspaceAccessScope,
  operation: (repository: CoachAiChatRepository) => T,
): T {
  return withPlatformDatabase({ mode: "runtime" }, (database) => operation(new CoachAiChatRepository(database)));
}

type ChatRouteError = Readonly<{ status: number; code: "invalid_request" | "access_denied" | "conflict" | "unavailable" }>;

function mapChatRouteError(error: unknown): ChatRouteError {
  if (!isTraderLinkPlatformError(error)) {
    return Object.freeze({ status: 503, code: "unavailable" });
  }
  if (error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED") {
    return Object.freeze({ status: 400, code: "invalid_request" });
  }
  if (error.code === "TRADERLINK_PLATFORM_INTEGRITY_FAILED") {
    return Object.freeze({ status: 409, code: "conflict" });
  }
  if (error.code.includes("CONFLICT") ||
      error.code === "TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID") {
    return Object.freeze({ status: 409, code: "conflict" });
  }
  if (error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ||
      error.code === "TRADERLINK_ACCOUNT_ACCESS_DENIED" ||
      error.code === "TRADERLINK_ACCOUNT_NOT_FOUND" ||
      error.code === "TRADERLINK_AUTH_SESSION_INVALID") {
    return Object.freeze({ status: 403, code: "access_denied" });
  }
  return Object.freeze({ status: 503, code: "unavailable" });
}

export function respondToChatRouteError(error: unknown): Response {
  const mapped = mapChatRouteError(error);
  return Response.json(
    { status: "unavailable", code: mapped.code },
    { status: mapped.status, headers: { "cache-control": "no-store" } },
  );
}

export function readyResponse(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
