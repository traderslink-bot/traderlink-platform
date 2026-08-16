import { vi } from "vitest";

import type { CoachAiChatActionDraft } from "../contracts/ai-chat-action-draft-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000003"]),
  activeAccountId: "00000000-0000-4000-8000-000000000003",
});

const conversationId = "00000000-0000-4000-8000-000000000010";
const draftId = "00000000-0000-4000-8000-000000000011";
const draft: CoachAiChatActionDraft = Object.freeze({
  contractVersion: "traderlink_coach_ai_chat_action_draft_v1",
  draftId,
  conversationId,
  sourceMessageId: "00000000-0000-4000-8000-000000000012",
  preview: Object.freeze({
    kind: "reporting_currency",
    title: "Change reporting currency",
    currentReportingCurrency: "USD",
    proposedReportingCurrency: "CAD",
  }),
  disposition: "proposed",
  writeState: "not_written",
  createdAtUtc: "2026-08-16T12:00:00.000Z",
  expiresAtUtc: "2026-08-17T12:00:00.000Z",
  finalizedAtUtc: null,
});

const { mocks, FakeActionService } = vi.hoisted(() => {
  const routeMocks = {
    requireScope: vi.fn(),
    requireMutation: vi.fn(),
    withReadonlyPlatformDatabase: vi.fn(),
    withPlatformDatabase: vi.fn(),
    list: vi.fn(),
    confirm: vi.fn(),
    reject: vi.fn(),
    revalidatePath: vi.fn(),
  };
  class ActionService {
    list(...args: unknown[]) { return routeMocks.list(...args); }
    confirm(...args: unknown[]) { return routeMocks.confirm(...args); }
    reject(...args: unknown[]) { return routeMocks.reject(...args); }
  }
  return { mocks: routeMocks, FakeActionService: ActionService };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestScope: mocks.requireScope,
}));
vi.mock("@/src/modules/platform/server/authentication/journal-mutation-request-security", () => ({
  requireJournalMutationRequest: mocks.requireMutation,
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: mocks.withReadonlyPlatformDatabase,
}));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({
  withPlatformDatabase: mocks.withPlatformDatabase,
}));
vi.mock("@/src/modules/coach/server/coach-ai-chat-action-draft-service", () => ({
  CoachAiChatActionDraftService: FakeActionService,
}));

import { GET as listDrafts } from
  "@/app/api/coach/chat/conversations/[conversationId]/action-drafts/route";
import { POST as confirmDraft } from
  "@/app/api/coach/chat/conversations/[conversationId]/action-drafts/[draftId]/confirm/route";
import { POST as rejectDraft } from
  "@/app/api/coach/chat/conversations/[conversationId]/action-drafts/[draftId]/reject/route";

function request(path: string, init?: RequestInit): Request {
  return new Request(`http://127.0.0.1:3010${path}`, init);
}

function conversationParams(): { params: Promise<{ conversationId: string }> } {
  return { params: Promise.resolve({ conversationId }) };
}

function draftParams(): {
  params: Promise<{ conversationId: string; draftId: string }>;
} {
  return { params: Promise.resolve({ conversationId, draftId }) };
}

describe("AI Chat action draft routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireScope.mockReturnValue(scope);
    mocks.withReadonlyPlatformDatabase.mockImplementation((_options, operation) => operation({}));
    mocks.withPlatformDatabase.mockImplementation((_options, operation) => operation({}));
    mocks.list.mockReturnValue([draft]);
    mocks.confirm.mockReturnValue(Object.freeze({
      draft: Object.freeze({
        ...draft,
        disposition: "confirmed",
        writeState: "committed",
        finalizedAtUtc: "2026-08-16T12:01:00.000Z",
      }),
      accountSelectionRef: null,
    }));
    mocks.reject.mockReturnValue(Object.freeze({
      ...draft,
      disposition: "rejected",
      finalizedAtUtc: "2026-08-16T12:01:00.000Z",
    }));
  });

  it("lists only the selected conversation's scoped action drafts", async () => {
    const response = await listDrafts(request(
      `/api/coach/chat/conversations/${conversationId}/action-drafts`,
    ), conversationParams());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      conversationId,
      drafts: [draft],
    });
    expect(mocks.list).toHaveBeenCalledWith(scope, conversationId);
  });

  it("confirms one exact empty-body draft through mutation security", async () => {
    const response = await confirmDraft(request(
      `/api/coach/chat/conversations/${conversationId}/action-drafts/${draftId}/confirm`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    ), draftParams());

    expect(response.status).toBe(200);
    expect(mocks.requireMutation).toHaveBeenCalledOnce();
    expect(mocks.confirm).toHaveBeenCalledWith(scope, { conversationId, draftId });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/account");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notifications");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/workspace");
  });

  it("rejects one exact empty-body draft through mutation security", async () => {
    const response = await rejectDraft(request(
      `/api/coach/chat/conversations/${conversationId}/action-drafts/${draftId}/reject`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    ), draftParams());

    expect(response.status).toBe(200);
    expect(mocks.requireMutation).toHaveBeenCalledOnce();
    expect(mocks.reject).toHaveBeenCalledWith(scope, { conversationId, draftId });
  });

  it("rejects extra client fields before confirming or rejecting a draft", async () => {
    const body = JSON.stringify({ action: "confirm without preview" });
    const confirmResponse = await confirmDraft(request(
      `/api/coach/chat/conversations/${conversationId}/action-drafts/${draftId}/confirm`,
      { method: "POST", headers: { "content-type": "application/json" }, body },
    ), draftParams());
    const rejectResponse = await rejectDraft(request(
      `/api/coach/chat/conversations/${conversationId}/action-drafts/${draftId}/reject`,
      { method: "POST", headers: { "content-type": "application/json" }, body },
    ), draftParams());

    expect(confirmResponse.status).toBe(400);
    expect(rejectResponse.status).toBe(400);
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.reject).not.toHaveBeenCalled();
  });
});
