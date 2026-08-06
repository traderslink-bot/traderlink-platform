import { vi } from "vitest";

import type { CoachAiDailyCompanionDraft } from "../contracts/ai-daily-companion-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000003"]),
  activeAccountId: "00000000-0000-4000-8000-000000000003",
});

const conversationId = "00000000-0000-4000-8000-000000000010";
const interactionId = "00000000-0000-4000-8000-000000000011";
const draft: CoachAiDailyCompanionDraft = Object.freeze({
  interactionId,
  conversationId,
  sourceMessageId: "00000000-0000-4000-8000-000000000012",
  tradingDate: "2026-08-05",
  proposal: Object.freeze({
    kind: "current_focus_draft",
    currentFocuses: "Wait for a clean setup before entering.",
  }),
  disposition: "proposed",
  journalWriteState: "not_written",
  createdAtUtc: "2026-08-05T20:00:00.000Z",
  resolvedAtUtc: null,
});

const { mocks, FakeRepository, FakeCommandService } = vi.hoisted(() => {
  const routeMocks = {
    requireScope: vi.fn(),
    requireMutation: vi.fn(),
    withReadonlyPlatformDatabase: vi.fn(),
    withPlatformDatabase: vi.fn(),
    listDrafts: vi.fn(),
    confirm: vi.fn(),
    reject: vi.fn(),
  };
  class Repository {
    listDrafts(...args: unknown[]) { return routeMocks.listDrafts(...args); }
  }
  class CommandService {
    confirm(...args: unknown[]) { return routeMocks.confirm(...args); }
    reject(...args: unknown[]) { return routeMocks.reject(...args); }
  }
  return { mocks: routeMocks, FakeRepository: Repository, FakeCommandService: CommandService };
});

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
vi.mock("@/src/modules/coach/server/coach-ai-daily-companion-repository", () => ({
  CoachAiDailyCompanionRepository: FakeRepository,
}));
vi.mock("@/src/modules/coach/server/coach-ai-daily-companion-command-service", () => ({
  CoachAiDailyCompanionCommandService: FakeCommandService,
}));

import { GET as listDrafts } from "@/app/api/coach/chat/conversations/[conversationId]/daily-companion-drafts/route";
import { POST as confirmDraft } from "@/app/api/coach/chat/conversations/[conversationId]/daily-companion-drafts/[interactionId]/confirm/route";
import { POST as rejectDraft } from "@/app/api/coach/chat/conversations/[conversationId]/daily-companion-drafts/[interactionId]/reject/route";

function request(path: string, init?: RequestInit): Request {
  return new Request(`http://127.0.0.1:3010${path}`, init);
}

function conversationParams(): { params: Promise<{ conversationId: string }> } {
  return { params: Promise.resolve({ conversationId }) };
}

function draftParams(): {
  params: Promise<{ conversationId: string; interactionId: string }>;
} {
  return { params: Promise.resolve({ conversationId, interactionId }) };
}

describe("Daily Companion draft routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireScope.mockReturnValue(scope);
    mocks.withReadonlyPlatformDatabase.mockImplementation((_options, operation) => operation({}));
    mocks.withPlatformDatabase.mockImplementation((_options, operation) => operation({}));
    mocks.listDrafts.mockReturnValue([draft]);
    mocks.confirm.mockReturnValue({ draft: Object.freeze({
      ...draft,
      disposition: "accepted",
      journalWriteState: "committed",
      resolvedAtUtc: "2026-08-05T20:01:00.000Z",
    }) });
    mocks.reject.mockReturnValue(Object.freeze({
      ...draft,
      disposition: "rejected",
      resolvedAtUtc: "2026-08-05T20:01:00.000Z",
    }));
  });

  it("lists only the selected conversation's account-scoped editable drafts", async () => {
    const response = await listDrafts(request(
      `/api/coach/chat/conversations/${conversationId}/daily-companion-drafts`,
    ), conversationParams());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      conversationId,
      drafts: [draft],
    });
    expect(mocks.listDrafts).toHaveBeenCalledWith(scope, { conversationId, limit: 50 });
  });

  it("confirms the exact edited proposal through the guarded Journal command", async () => {
    const editedProposal = Object.freeze({
      kind: "current_focus_draft" as const,
      currentFocuses: "Only enter when the setup is clear.",
    });
    const response = await confirmDraft(request(
      `/api/coach/chat/conversations/${conversationId}/daily-companion-drafts/${interactionId}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ editedProposal }),
      },
    ), draftParams());

    expect(response.status).toBe(200);
    expect(mocks.requireMutation).toHaveBeenCalledOnce();
    expect(mocks.confirm).toHaveBeenCalledWith(scope, {
      conversationId,
      interactionId,
      editedProposal,
    });
  });

  it("discards a proposal without supplying any Journal mutation fields", async () => {
    const response = await rejectDraft(request(
      `/api/coach/chat/conversations/${conversationId}/daily-companion-drafts/${interactionId}/reject`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      },
    ), draftParams());

    expect(response.status).toBe(200);
    expect(mocks.requireMutation).toHaveBeenCalledOnce();
    expect(mocks.reject).toHaveBeenCalledWith(scope, { conversationId, interactionId });
  });

  it("rejects extra client fields before any Daily Companion write", async () => {
    const response = await rejectDraft(request(
      `/api/coach/chat/conversations/${conversationId}/daily-companion-drafts/${interactionId}/reject`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "private text" }),
      },
    ), draftParams());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "unavailable", code: "invalid_request" });
    expect(mocks.reject).not.toHaveBeenCalled();
  });
});
