// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deriveJournalAccountSelectionRef } from "../../contracts/journal-account-selection";
import { platformFailure } from "../database/platform-migration-contract";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), mutation: vi.fn(), expected: vi.fn(), worker: vi.fn() }));
vi.mock("../authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformAuthenticatedRequestIdentity: mocks.identity,
  requireExpectedJournalAccountSelection: mocks.expected,
}));
vi.mock("../authentication/journal-mutation-request-security", () => ({ requireJournalMutationRequest: mocks.mutation }));
vi.mock("../database/platform-database-config", () => ({ resolvePlatformDatabaseConfig: () => ({ databasePath: "/synthetic.sqlite" }) }));
vi.mock("./platform-erasure-worker-supervisor", () => ({ runErasureWorker: mocks.worker }));
import { POST } from "@/app/api/platform/account-erasure/route";

const scope = { userId: "00000000-0000-4000-8000-000000000001", workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner", activeAccountId: "00000000-0000-4000-8000-000000000003", allowedAccountIds: ["00000000-0000-4000-8000-000000000003"] };
function request(action: string, confirmation: string, cookie?: string) {
  return new NextRequest("https://app.traderslink.pro/api/platform/account-erasure", {
    method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ action, confirmation, expectedAccountSelectionRef: "a".repeat(64), scope: { userId: "untrusted" } }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.identity.mockReturnValue({ scope, mode: "platform_session", sessionId: "synthetic-session" });
  mocks.worker.mockResolvedValue({ nextSelectionRef: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
describe("completion-based account erasure HTTP contract", () => {
  it("awaits worker completion, ignores body scope and clears only selection for account deletion", async () => {
    let finish!: (result: unknown) => void;
    mocks.worker.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    let completed = false;
    const pending = POST(request("trade_tracker_account", "DELETE ACCOUNT")).then((response) => { completed = true; return response; });
    await vi.waitFor(() => expect(mocks.worker).toHaveBeenCalledOnce());
    expect(completed).toBe(false);
    expect(mocks.worker.mock.calls[0]![1].scope === scope).toBe(true);
    finish({ nextSelectionRef: null });
    const response = await pending;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "deleted", action: "trade_tracker_account" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain("traderlink_journal_account=;");
    expect(response.headers.get("set-cookie")).not.toContain("tl_platform_session");
  });
  it("clears sign-in cookies for whole deletion and ignores an irrelevant malformed demo cookie", async () => {
    const response = await POST(request("traderlink_account", "DELETE MY TRADERLINK ACCOUNT", "traderlink_journal_demo_return_account=invalid"));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("tl_platform_session=;");
    expect(response.headers.get("set-cookie")).toContain("traderlink_journal_account=;");
    expect(mocks.expected).not.toHaveBeenCalled();
  });
  it("sets the demo replacement selection and removes the demo-return cookie", async () => {
    const selection = deriveJournalAccountSelectionRef(scope.workspaceId, scope.activeAccountId);
    mocks.worker.mockResolvedValue({ nextSelectionRef: selection });
    const response = await POST(request("demo_trade_tracker_account", "DELETE ACCOUNT"));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(`traderlink_journal_account=${selection}`);
    expect(response.headers.get("set-cookie")).toContain("traderlink_journal_demo_return_account=;");
  });
  it("rejects CSRF, authentication, confirmation and expected selection failures before starting a writer", async () => {
    mocks.mutation.mockImplementationOnce(() => platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED"));
    expect((await POST(request("trade_tracker_account", "DELETE ACCOUNT"))).status).toBe(403);
    mocks.identity.mockImplementationOnce(() => platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED"));
    expect((await POST(request("trade_tracker_account", "DELETE ACCOUNT"))).status).toBe(403);
    expect((await POST(request("trade_tracker_account", "wrong"))).status).toBe(400);
    mocks.expected.mockImplementationOnce(() => platformFailure("TRADERLINK_ACCOUNT_SELECTION_CONFLICT"));
    expect((await POST(request("trade_tracker_account", "DELETE ACCOUNT"))).status).toBe(409);
    expect(mocks.worker).not.toHaveBeenCalled();
  });
  it("never returns deleted or cookie changes after worker failure", async () => {
    mocks.worker.mockRejectedValue(new Error("synthetic_private_path"));
    const response = await POST(request("trade_tracker_account", "DELETE ACCOUNT"));
    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({ status: "unavailable", code: "TRADERLINK_ACCOUNT_ERASURE_FAILED" });
  });
});
