import { describe, expect, it, beforeEach, vi } from "vitest";

import type { CoachAiManualEntryDraft } from "../contracts/ai-manual-entry-draft-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000003"]),
  activeAccountId: "00000000-0000-4000-8000-000000000003",
});
const conversationId = "00000000-0000-4000-8000-000000000010";
const draftId = "00000000-0000-4000-8000-000000000020";
const draft: CoachAiManualEntryDraft = Object.freeze({
  contractVersion: "traderlink_coach_ai_manual_entry_draft_v1",
  draftId,
  conversationId,
  sourceMessageId: "00000000-0000-4000-8000-000000000011",
  state: "ready_for_confirmation",
  journalWriteState: "not_written",
  canonicalJournalCommand: null,
  canonicalJournalReference: null,
  writeFailureCode: null,
  rows: Object.freeze([Object.freeze({
    clientRowRef: "row-1",
    localDate: "2026-08-05",
    localTime: "09:30:00",
    normalizedSymbol: "TEST",
    side: "buy",
    quantityDecimal: "10",
    priceDecimal: "1.25",
    feesDecimal: null,
    sourceTimezone: "America/New_York",
    tradeCurrency: "USD",
  })]),
  createdAtUtc: "2026-08-05T14:00:00.000Z",
  updatedAtUtc: "2026-08-05T14:00:00.000Z",
  expiresAtUtc: "2026-08-06T14:00:00.000Z",
  finalizedAtUtc: null,
});
const preview = Object.freeze({
  previewRef: "preview:" + "a".repeat(80),
  expiresAtUtc: "2026-08-05T14:10:00.000Z",
  tracker: "quick",
  affectedDates: Object.freeze(["2026-08-05"]),
  executionCount: 1,
  groups: Object.freeze([]),
});

const { mocks, FakeDraftRepository, FakeCommandService } = vi.hoisted(() => {
  const routeMocks = {
    requireScope: vi.fn(),
    requireMutation: vi.fn(),
    withReadonly: vi.fn(),
    withJournal: vi.fn(),
    listDrafts: vi.fn(),
    preview: vi.fn(),
    commit: vi.fn(),
  };
  class DraftRepository {
    listDrafts(...args: unknown[]) { return routeMocks.listDrafts(...args); }
  }
  class CommandService {
    preview(...args: unknown[]) { return routeMocks.preview(...args); }
    commit(...args: unknown[]) { return routeMocks.commit(...args); }
  }
  return { mocks: routeMocks, FakeDraftRepository: DraftRepository, FakeCommandService: CommandService };
});

vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestScope: mocks.requireScope,
}));
vi.mock("@/src/modules/platform/server/authentication/journal-mutation-request-security", () => ({
  requireJournalMutationRequest: mocks.requireMutation,
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: mocks.withReadonly,
}));
vi.mock("@/src/modules/journal/server/journal-integrity-runtime", () => ({
  withWritableJournalIntegrityRuntime: mocks.withJournal,
}));
vi.mock("./coach-ai-manual-entry-draft-repository", () => ({
  CoachAiManualEntryDraftRepository: FakeDraftRepository,
}));
vi.mock("./coach-ai-manual-entry-command-service", () => ({
  CoachAiManualEntryCommandService: FakeCommandService,
}));

import { GET as listDrafts } from "@/app/api/coach/chat/conversations/[conversationId]/manual-entry-drafts/route";
import { POST as previewDraft } from "@/app/api/coach/chat/conversations/[conversationId]/manual-entry-drafts/[draftId]/preview/route";
import { POST as commitDraft } from "@/app/api/coach/chat/conversations/[conversationId]/manual-entry-drafts/[draftId]/commit/route";

function request(path: string, body?: unknown): Request {
  return new Request(`http://127.0.0.1:3010${path}`, body === undefined ? undefined : {
    method: "POST",
    headers: { "content-type": "application/json", "x-traderlink-journal-mutation": "1" },
    body: JSON.stringify(body),
  });
}

function conversationParams() {
  return { params: Promise.resolve({ conversationId }) };
}

function draftParams() {
  return { params: Promise.resolve({ conversationId, draftId }) };
}

describe("AI Chat manual-entry routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireScope.mockReturnValue(scope);
    mocks.withReadonly.mockImplementation((_options, operation) => operation({}));
    mocks.withJournal.mockImplementation((_scope, operation) => operation({}, {}));
    mocks.listDrafts.mockReturnValue(Object.freeze([draft]));
    mocks.preview.mockReturnValue(Object.freeze({ draft, preview }));
    mocks.commit.mockReturnValue(Object.freeze({
      draft: Object.freeze({ ...draft, state: "committed", journalWriteState: "committed" }),
      result: Object.freeze({
        status: "committed",
        executionIds: Object.freeze(["execution-1"]),
        createdExecutionCount: 1,
        matchedExecutionCount: 0,
        relatedDecisionIds: Object.freeze([]),
        affectedDates: Object.freeze(["2026-08-05"]),
      }),
    }));
  });

  it("lists only scoped drafts for one conversation", async () => {
    const response = await listDrafts(request(`/api/coach/chat/conversations/${conversationId}/manual-entry-drafts`), conversationParams());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready", conversationId, drafts: [draft] });
    expect(mocks.listDrafts).toHaveBeenCalledWith(scope, { conversationId, limit: 50 });
  });

  it("requires mutation protection and sends editable rows to canonical preview", async () => {
    const rows = draft.rows.map((row) => Object.freeze({
      clientRowRef: row.clientRowRef,
      localDate: row.localDate,
      localTime: row.localTime,
      normalizedSymbol: row.normalizedSymbol,
      side: row.side,
      quantityDecimal: row.quantityDecimal,
      priceDecimal: row.priceDecimal,
      feesDecimal: row.feesDecimal,
    }));
    const response = await previewDraft(request(
      `/api/coach/chat/conversations/${conversationId}/manual-entry-drafts/${draftId}/preview`,
      { tracker: "quick", rows },
    ), draftParams());
    expect(response.status).toBe(200);
    expect(mocks.requireMutation).toHaveBeenCalledTimes(1);
    expect(mocks.preview).toHaveBeenCalledWith(scope, { conversationId, draftId, tracker: "quick", rows });
  });

  it("requires explicit confirmations before the canonical commit bridge", async () => {
    const confirmations = [Object.freeze({
      groupRef: "b".repeat(64),
      relationship: "start_new_trade",
      style: "day_trade",
      existingPositionRef: null,
      completeExecutionSetConfirmed: true,
    })];
    const body = {
      tracker: "quick",
      previewRef: preview.previewRef,
      clientRequestId: "00000000-0000-4000-8000-000000000099",
      confirmations,
    };
    const response = await commitDraft(request(
      `/api/coach/chat/conversations/${conversationId}/manual-entry-drafts/${draftId}/commit`,
      body,
    ), draftParams());
    expect(response.status).toBe(200);
    expect(mocks.requireMutation).toHaveBeenCalledTimes(1);
    expect(mocks.commit).toHaveBeenCalledWith(scope, { conversationId, draftId, ...body });
    expect(await response.json()).toMatchObject({
      status: "ready",
      draft: { state: "committed", journalWriteState: "committed" },
      result: { acceptedExecutionCount: 1, pendingDecisionCount: 0 },
    });
  });

  it("rejects unknown row fields before any Journal preview", async () => {
    const response = await previewDraft(request(
      `/api/coach/chat/conversations/${conversationId}/manual-entry-drafts/${draftId}/preview`,
      { tracker: "quick", rows: [{ ...draft.rows[0], privateAccount: "not-accepted" }] },
    ), draftParams());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "unavailable", code: "invalid_request" });
    expect(mocks.preview).not.toHaveBeenCalled();
  });
});
