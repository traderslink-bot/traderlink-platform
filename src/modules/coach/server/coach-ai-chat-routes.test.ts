import { Buffer } from "node:buffer";

import { vi } from "vitest";

import type {
  CoachAiChatConversation,
  CoachAiChatMessage,
} from "../contracts/ai-chat-contracts";
import type { CoachAiManualEntryDraft } from "../contracts/ai-manual-entry-draft-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000003"]),
  activeAccountId: "00000000-0000-4000-8000-000000000003",
});

const conversation: CoachAiChatConversation = Object.freeze({
  conversationId: "00000000-0000-4000-8000-000000000010",
  title: "Morning review",
  state: "active",
  createdAtUtc: "2026-08-05T12:00:00.000Z",
  updatedAtUtc: "2026-08-05T12:00:00.000Z",
  archivedAtUtc: null,
});

const message: CoachAiChatMessage = Object.freeze({
  messageId: "00000000-0000-4000-8000-000000000011",
  sequence: 1,
  role: "user",
  originalUserTextPrivate: "How did my morning go?",
  normalizedUserTextPrivate: null,
  structuredInterpretationJson: null,
  assistantTextPrivate: null,
  generationState: "not_applicable",
  failureCode: null,
  createdAtUtc: "2026-08-05T12:01:00.000Z",
  finalizedAtUtc: null,
});

const manualEntryDraft: CoachAiManualEntryDraft = Object.freeze({
  contractVersion: "traderlink_coach_ai_manual_entry_draft_v1",
  draftId: "00000000-0000-4000-8000-000000000020",
  conversationId: conversation.conversationId,
  sourceMessageId: message.messageId,
  state: "draft",
  journalWriteState: "not_written",
  canonicalJournalCommand: null,
  canonicalJournalReference: null,
  writeFailureCode: null,
  rows: Object.freeze([]),
  createdAtUtc: message.createdAtUtc,
  updatedAtUtc: message.createdAtUtc,
  expiresAtUtc: "2026-08-06T12:01:00.000Z",
  finalizedAtUtc: null,
});

const { mocks, FakeRepository } = vi.hoisted(() => {
  const routeMocks = {
    requireScope: vi.fn(),
    listConversations: vi.fn(),
    createConversation: vi.fn(),
    readConversation: vi.fn(),
    renameConversation: vi.fn(),
    archiveConversation: vi.fn(),
    restoreConversation: vi.fn(),
    listMessages: vi.fn(),
    readMessageEvidence: vi.fn(),
    generateSavedAnswer: vi.fn(),
    reconcileStaleGenerations: vi.fn(),
    getDailyCompanionContext: vi.fn(),
    getTradeTrackerAccount: vi.fn(),
    withReadonlyPlatformDatabase: vi.fn(),
    withPlatformDatabase: vi.fn(),
  };
  class Repository {
    listConversations(...args: unknown[]) { return routeMocks.listConversations(...args); }
    createConversation(...args: unknown[]) { return routeMocks.createConversation(...args); }
    readConversation(...args: unknown[]) { return routeMocks.readConversation(...args); }
    renameConversation(...args: unknown[]) { return routeMocks.renameConversation(...args); }
    archiveConversation(...args: unknown[]) { return routeMocks.archiveConversation(...args); }
    restoreConversation(...args: unknown[]) { return routeMocks.restoreConversation(...args); }
    listMessages(...args: unknown[]) { return routeMocks.listMessages(...args); }
  }
  return { mocks: routeMocks, FakeRepository: Repository };
});

vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestScope: mocks.requireScope,
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: mocks.withReadonlyPlatformDatabase,
}));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({
  withPlatformDatabase: mocks.withPlatformDatabase,
}));
vi.mock("@/src/modules/coach/server/coach-ai-chat-repository", () => ({
  CoachAiChatRepository: FakeRepository,
}));
vi.mock("@/src/modules/coach/server/coach-ai-chat-generation-runtime", () => ({
  generateCoachAiChatSavedAnswer: mocks.generateSavedAnswer,
  reconcileStaleCoachAiChatGenerations: mocks.reconcileStaleGenerations,
}));
vi.mock("@/src/modules/coach/server/coach-ai-chat-evidence-service", () => ({
  CoachAiChatEvidenceService: class {
    readForMessages(...args: unknown[]) { return mocks.readMessageEvidence(...args); }
  },
}));
vi.mock("@/app/(dashboard)/trade-tracker/trade-tracker-platform-data", () => ({
  getReplacementDailyCompanionResolvedContext: mocks.getDailyCompanionContext,
  getReplacementTradeTrackerAccount: mocks.getTradeTrackerAccount,
}));

import { GET as listConversations, POST as createConversation } from "@/app/api/coach/chat/conversations/route";
import { GET as readConversation, PATCH as patchConversation } from "@/app/api/coach/chat/conversations/[conversationId]/route";
import { GET as listMessages, POST as generateMessage } from "@/app/api/coach/chat/conversations/[conversationId]/messages/route";

const conversationId = conversation.conversationId;
const conversationPath = `/api/coach/chat/conversations/${conversationId}`;

function request(path: string, init?: RequestInit): Request {
  return new Request(`http://127.0.0.1:3010${path}`, init);
}

function params(): { params: Promise<{ conversationId: string }> } {
  return { params: Promise.resolve({ conversationId }) };
}

describe("private AI Chat persistence routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireScope.mockReturnValue(scope);
    mocks.withReadonlyPlatformDatabase.mockImplementation((_options, operation) => operation({}));
    mocks.withPlatformDatabase.mockImplementation((_options, operation) => operation({}));
    mocks.listConversations.mockReturnValue({
      conversations: [conversation],
      nextCursor: Object.freeze({
        updatedAtUtc: conversation.updatedAtUtc,
        conversationId,
      }),
    });
    mocks.createConversation.mockReturnValue(conversation);
    mocks.readConversation.mockReturnValue(conversation);
    mocks.renameConversation.mockReturnValue(conversation);
    mocks.archiveConversation.mockReturnValue(Object.freeze({ ...conversation, state: "archived", archivedAtUtc: conversation.updatedAtUtc }));
    mocks.restoreConversation.mockReturnValue(conversation);
    mocks.listMessages.mockReturnValue({
      messages: [message],
      nextCursor: Object.freeze({ beforeSequence: 2 }),
    });
    mocks.readMessageEvidence.mockReturnValue(Object.freeze([]));
    mocks.generateSavedAnswer.mockResolvedValue({
      state: "completed",
      assistantMessageId: "00000000-0000-4000-8000-000000000012",
      attemptId: "00000000-0000-4000-8000-000000000013",
      manualEntryDraft: null,
      dailyCompanionDraft: null,
    });
    mocks.getDailyCompanionContext.mockReturnValue(null);
    mocks.getTradeTrackerAccount.mockReturnValue(Object.freeze({
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
    }));
  });

  it("lists bounded active conversations and preserves the repository cursor", async () => {
    const response = listConversations(request("/api/coach/chat/conversations?state=active&limit=10"));
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.conversations).toEqual([conversation]);
    expect(JSON.parse(Buffer.from(body.nextCursor as string, "base64url").toString("utf8"))).toEqual({
      updatedAtUtc: conversation.updatedAtUtc,
      conversationId,
    });
    expect(mocks.listConversations).toHaveBeenCalledWith(scope, {
      state: "active",
      search: null,
      limit: 10,
      cursor: null,
    });
  });

  it("passes a bounded private conversation search only to the scoped repository", async () => {
    const response = listConversations(request(
      "/api/coach/chat/conversations?state=active&search=morning%20review&limit=10",
    ));

    expect(response.status).toBe(200);
    expect(mocks.listConversations).toHaveBeenCalledWith(scope, {
      state: "active",
      search: "morning review",
      limit: 10,
      cursor: null,
    });
  });

  it("creates a conversation without accepting client ownership fields", async () => {
    const response = await createConversation(request("/api/coach/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ title: "Morning review" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ status: "ready", conversation });
    expect(mocks.createConversation).toHaveBeenCalledWith(scope, "Morning review");
  });

  it("rejects creation query parameters before reading or writing the body", async () => {
    const response = await createConversation(request("/api/coach/chat/conversations?state=active", {
      method: "POST",
      body: JSON.stringify({ title: "Morning review" }),
    }));
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body).toEqual({ status: "unavailable", code: "invalid_request" });
    expect(mocks.createConversation).not.toHaveBeenCalled();
  });

  it.each([
    ["oversized", `${"x".repeat(8 * 1024)} `],
    ["malformed JSON", "{\"title\":\"private text\""],
  ])("rejects %s bodies without echoing body text", async (_label, bodyText) => {
    const response = await createConversation(request("/api/coach/chat/conversations", {
      method: "POST",
      body: bodyText,
    }));
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body).toEqual({ status: "unavailable", code: "invalid_request" });
    expect(JSON.stringify(body)).not.toContain("private text");
    expect(mocks.createConversation).not.toHaveBeenCalled();
  });

  it("reads a private conversation and returns bounded message history", async () => {
    const conversationResponse = await readConversation(request(conversationPath), params());
    const conversationBody = await conversationResponse.json();
    const messagesResponse = await listMessages(request(`${conversationPath}/messages?limit=5`), params());
    const messagesBody = await messagesResponse.json() as Record<string, unknown>;

    expect(conversationResponse.status).toBe(200);
    expect(conversationBody).toEqual({ status: "ready", conversation });
    expect(messagesResponse.status).toBe(200);
    expect(messagesBody.messages).toEqual([message]);
    expect(JSON.parse(Buffer.from(messagesBody.nextCursor as string, "base64url").toString("utf8"))).toEqual({
      beforeSequence: 2,
    });
    expect(mocks.listMessages).toHaveBeenCalledWith(scope, conversationId, {
      limit: 5,
      cursor: null,
    });
    expect(mocks.reconcileStaleGenerations).toHaveBeenCalledWith(scope, { conversationId });
    expect(mocks.readMessageEvidence).toHaveBeenCalledWith(scope, conversationId, []);
  });

  it("returns only display-safe evidence associated with completed assistant messages", async () => {
    const assistant: CoachAiChatMessage = Object.freeze({
      ...message,
      messageId: "00000000-0000-4000-8000-000000000012",
      role: "assistant",
      originalUserTextPrivate: null,
      assistantTextPrivate: "Your entries were strongest in the morning.",
      generationState: "completed",
      finalizedAtUtc: "2026-08-05T12:02:00.000Z",
    });
    const evidence = Object.freeze([Object.freeze({
      messageId: assistant.messageId,
      cards: Object.freeze([Object.freeze({
        title: "Entry & Exit",
        detail: "Saved Analyzer results were used for this answer.",
        href: "/analytics/trade-analyzer/day/entry-exit",
        linkLabel: "Open Entry & Exit",
      })]),
    })]);
    mocks.listMessages.mockReturnValue({ messages: [assistant], nextCursor: null });
    mocks.readMessageEvidence.mockReturnValue(evidence);

    const response = await listMessages(request(`${conversationPath}/messages?limit=5`), params());
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.evidence).toEqual(evidence);
    expect(mocks.readMessageEvidence).toHaveBeenCalledWith(scope, conversationId, [assistant.messageId]);
    expect(JSON.stringify(body.evidence)).not.toContain("toolCallId");
  });

  it("generates one saved answer with a server-derived idempotency digest", async () => {
    const clientRequestId = "00000000-0000-4000-8000-000000000014";
    const response = await generateMessage(request(`${conversationPath}/messages`, {
      method: "POST",
      body: JSON.stringify({ question: "How did I trade this week?", clientRequestId }),
      headers: { "content-type": "application/json" },
    }), params());
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "completed",
      assistantMessageId: "00000000-0000-4000-8000-000000000012",
      manualEntryDraft: null,
      dailyCompanionDraft: null,
    });
    expect(mocks.generateSavedAnswer).toHaveBeenCalledWith(scope, {
      conversationId,
      question: "How did I trade this week?",
      intent: "answer_question",
      analysisScope: { kind: "recent" },
      pageContext: null,
      idempotencySha256: expect.stringMatching(/^[0-9a-f]{64}$/u),
      resolveTrustedContext: null,
      resolveManualEntryDefaults: expect.any(Function),
      resolveReviewDelivery: expect.any(Function),
    });
    expect(JSON.stringify(body)).not.toContain("attemptId");
  });

  it("accepts only a reduced current-page hint and binds it into the generation request", async () => {
    const response = await generateMessage(request(`${conversationPath}/messages`, {
      method: "POST",
      body: JSON.stringify({
        question: "What can I do on this page?",
        clientRequestId: "00000000-0000-4000-8000-000000000018",
        pagePathname: "/analytics/trade-analyzer/day/mfe-mae",
      }),
    }), params());

    expect(response.status).toBe(200);
    expect(mocks.generateSavedAnswer).toHaveBeenCalledWith(scope, expect.objectContaining({
      pageContext: expect.objectContaining({
        authority: "conversation_hint_only",
        feature: "trade_analyzer_mfe_mae",
        canonicalPath: "/analytics/trade-analyzer/day/mfe-mae",
      }),
    }));
  });

  it.each([
    "https://traderslink.pro/workspace",
    "/calendar?month=2026-08",
    "/calendar#day",
  ])("rejects malformed page context before provider work: %s", async (pagePathname) => {
    const response = await generateMessage(request(`${conversationPath}/messages`, {
      method: "POST",
      body: JSON.stringify({
        question: "Private question",
        clientRequestId: "00000000-0000-4000-8000-000000000018",
        pagePathname,
      }),
    }), params());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "unavailable", code: "invalid_request" });
    expect(mocks.generateSavedAnswer).not.toHaveBeenCalled();
  });

  it("uses different idempotency digests when a period or page hint changes", async () => {
    const clientRequestId = "00000000-0000-4000-8000-000000000018";
    for (const body of [
      { question: "Compare this.", clientRequestId, analysisScope: { kind: "day", date: "2026-08-04" }, pagePathname: "/calendar" },
      { question: "Compare this.", clientRequestId, analysisScope: { kind: "day", date: "2026-08-05" }, pagePathname: "/trade-tracker" },
    ]) {
      const response = await generateMessage(request(`${conversationPath}/messages`, {
        method: "POST",
        body: JSON.stringify(body),
      }), params());
      expect(response.status).toBe(200);
    }
    const first = mocks.generateSavedAnswer.mock.calls.at(-2)?.[1] as { idempotencySha256: string };
    const second = mocks.generateSavedAnswer.mock.calls.at(-1)?.[1] as { idempotencySha256: string };
    expect(first.idempotencySha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(second.idempotencySha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(first.idempotencySha256).not.toBe(second.idempotencySha256);
  });

  it("uses different idempotency digests when the question changes", async () => {
    const clientRequestId = "00000000-0000-4000-8000-000000000019";
    for (const question of ["Show my wins.", "Show my losses."]) {
      const response = await generateMessage(new Request("http://local.test/api/coach/chat/messages", {
        method: "POST",
        body: JSON.stringify({ question, clientRequestId }),
      }), params());
      expect(response.status).toBe(200);
    }
    const first = mocks.generateSavedAnswer.mock.calls.at(-2)?.[1] as { idempotencySha256: string };
    const second = mocks.generateSavedAnswer.mock.calls.at(-1)?.[1] as { idempotencySha256: string };
    expect(first.idempotencySha256).not.toBe(second.idempotencySha256);
  });

  it("accepts only a date selector and replaces it with server-derived Daily Tracker context", async () => {
    const trustedContext = Object.freeze({
      contractVersion: "traderlink_coach_ai_daily_companion_context_v1",
      kind: "daily_review",
      tradingDate: "2026-08-05",
      timezone: "America/New_York",
      currency: "USD",
      factSetRevisionSha256: "a".repeat(64),
      dayResult: Object.freeze({ netPnlDecimal: "25", tradeCount: 1, tickerCount: 1 }),
      review: Object.freeze({ status: "not_started" }),
      dailyNotes: Object.freeze({ whatWorked: "", whatNeedsWork: "", technicalRecap: "", currentFocuses: "", anythingElse: "" }),
      focusRevisions: Object.freeze([]),
      dayRules: Object.freeze([]),
      trades: Object.freeze([]),
      openPositions: Object.freeze([]),
      coverage: Object.freeze({ needsDecisionCount: 0, contextTruncated: false, limitations: Object.freeze([]) }),
    });
    const resolvedContext = Object.freeze({
      context: trustedContext,
      dailyNoteRevision: null,
      trades: Object.freeze([]),
    });
    mocks.getDailyCompanionContext.mockReturnValueOnce(resolvedContext);
    mocks.generateSavedAnswer.mockImplementationOnce(async (
      _scope: WorkspaceAccessScope,
      input: Readonly<{ resolveTrustedContext: () => unknown }>,
    ) => {
      expect(input.resolveTrustedContext()).toEqual(resolvedContext);
      return {
        state: "completed",
        assistantMessageId: "00000000-0000-4000-8000-000000000012",
        attemptId: "00000000-0000-4000-8000-000000000013",
        manualEntryDraft: null,
        dailyCompanionDraft: null,
      };
    });
    const response = await generateMessage(request(`${conversationPath}/messages`, {
      method: "POST",
      body: JSON.stringify({
        question: "Help me review this day.",
        clientRequestId: "00000000-0000-4000-8000-000000000017",
        context: { kind: "daily_review", tradingDate: "2026-08-05", currency: "USD" },
      }),
    }), params());

    expect(response.status).toBe(200);
    expect(mocks.getDailyCompanionContext).toHaveBeenCalledWith(scope, {
      tradingDate: "2026-08-05",
      currency: "USD",
    });
    expect(mocks.generateSavedAnswer).toHaveBeenCalledWith(scope, expect.objectContaining({
      conversationId,
      question: "Help me review this day.",
      resolveTrustedContext: expect.any(Function),
    }));
  });

  it("uses an explicit manual-entry intent and server-derived Eastern account defaults", async () => {
    mocks.generateSavedAnswer.mockImplementationOnce(async (
      _scope: WorkspaceAccessScope,
      input: Readonly<{ resolveManualEntryDefaults: () => unknown }>,
    ) => {
      expect(input.resolveManualEntryDefaults()).toEqual({
        sourceTimezone: "America/New_York",
        tradeCurrency: "USD",
      });
      return {
        state: "completed",
        assistantMessageId: "00000000-0000-4000-8000-000000000012",
        attemptId: "00000000-0000-4000-8000-000000000013",
        manualEntryDraft,
        dailyCompanionDraft: null,
      };
    });
    const response = await generateMessage(request(`${conversationPath}/messages`, {
      method: "POST",
      body: JSON.stringify({
        question: "Bought 10 TEST at 1.25.",
        clientRequestId: "00000000-0000-4000-8000-000000000019",
        intent: "prepare_manual_execution_draft",
      }),
    }), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "completed",
      assistantMessageId: "00000000-0000-4000-8000-000000000012",
      manualEntryDraft,
      dailyCompanionDraft: null,
    });
    expect(mocks.generateSavedAnswer).toHaveBeenCalledWith(scope, expect.objectContaining({
      intent: "prepare_manual_execution_draft",
      resolveTrustedContext: null,
      resolveManualEntryDefaults: expect.any(Function),
    }));
    expect(mocks.getDailyCompanionContext).not.toHaveBeenCalled();
  });

  it.each([
    ["pending", 202],
    ["blocked", 429],
    ["failed", 503],
  ] as const)("returns a safe %s generation state", async (state, expectedStatus) => {
    mocks.generateSavedAnswer.mockResolvedValueOnce({
      state,
      assistantMessageId: "00000000-0000-4000-8000-000000000012",
      attemptId: "00000000-0000-4000-8000-000000000013",
      manualEntryDraft: null,
      dailyCompanionDraft: null,
    });
    const response = await generateMessage(request(`${conversationPath}/messages`, {
      method: "POST",
      body: JSON.stringify({
        question: "Review this safely.",
        clientRequestId: "00000000-0000-4000-8000-000000000015",
      }),
    }), params());

    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toEqual({
      status: state,
      assistantMessageId: "00000000-0000-4000-8000-000000000012",
      manualEntryDraft: null,
      dailyCompanionDraft: null,
    });
  });

  it("rejects unknown generation fields and query parameters before provider work", async () => {
    const invalidBody = await generateMessage(request(`${conversationPath}/messages`, {
      method: "POST",
      body: JSON.stringify({
        question: "Private question",
        clientRequestId: "00000000-0000-4000-8000-000000000016",
        accountId: "do-not-accept",
      }),
    }), params());
    const invalidQuery = await generateMessage(request(`${conversationPath}/messages?retry=true`, {
      method: "POST",
      body: JSON.stringify({
        question: "Private question",
        clientRequestId: "00000000-0000-4000-8000-000000000016",
      }),
    }), params());

    expect(invalidBody.status).toBe(400);
    expect(invalidQuery.status).toBe(400);
    expect(mocks.generateSavedAnswer).not.toHaveBeenCalled();
  });

  it.each([
    ["unknown query", "/api/coach/chat/conversations?privateText=do-not-return"],
    ["overlarge limit", "/api/coach/chat/conversations?limit=101"],
    ["overlarge search", `/api/coach/chat/conversations?search=${"x".repeat(121)}`],
    ["invalid cursor", "/api/coach/chat/conversations?cursor=not-a-valid-cursor"],
  ])("rejects %s with a bounded error", async (_label, path) => {
    const response = listConversations(request(path));
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body).toEqual({ status: "unavailable", code: "invalid_request" });
    expect(JSON.stringify(body)).not.toContain("do-not-return");
  });

  it("rejects unknown PATCH fields and malformed JSON without private text in errors", async () => {
    const response = await patchConversation(request(conversationPath, {
      method: "PATCH",
      body: JSON.stringify({ action: "rename", title: "safe", privateText: "do-not-return" }),
    }), params());
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body).toEqual({ status: "unavailable", code: "invalid_request" });
    expect(JSON.stringify(body)).not.toContain("do-not-return");
  });

  it.each([
    ["archive", { action: "archive" }, "archiveConversation"],
    ["restore", { action: "restore" }, "restoreConversation"],
    ["rename", { action: "rename", title: "Renamed" }, "renameConversation"],
  ] as const)("supports strict %s action payloads", async (_label, payload, method) => {
    const response = await patchConversation(request(conversationPath, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    }), params());

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("ready");
    expect(mocks[method]).toHaveBeenCalledWith(scope, conversationId, ...(method === "renameConversation" ? ["Renamed"] : []));
  });

  it("denies inactive or cross-account scope without exposing internal or private values", async () => {
    mocks.requireScope.mockImplementationOnce(() => {
      throw new TraderLinkPlatformError("TRADERLINK_ACCOUNT_ACCESS_DENIED", {
        accountId: "private-account-value",
      });
    });
    const response = listConversations(request("/api/coach/chat/conversations"));
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(403);
    expect(body).toEqual({ status: "unavailable", code: "access_denied" });
    expect(JSON.stringify(body)).not.toContain("private-account-value");
    expect(JSON.stringify(body)).not.toContain("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  });
});
