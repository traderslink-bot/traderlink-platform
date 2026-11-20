// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deriveJournalAccountSelectionRef } from "../../contracts/journal-account-selection";
import { platformFailure } from "../database/platform-migration-contract";
const mocks = vi.hoisted(() => ({ database: null as Database.Database | null, identity: vi.fn(), mutation: vi.fn(), expected: vi.fn(), worker: vi.fn(), prepare: vi.fn(), idle: vi.fn() }));
vi.mock("../authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformAuthenticatedRequestIdentity: mocks.identity,
  requireExpectedJournalAccountSelection: mocks.expected,
}));
vi.mock("../authentication/journal-mutation-request-security", () => ({ requireJournalMutationRequest: mocks.mutation }));
vi.mock("../database/platform-database-config", () => ({ resolvePlatformDatabaseConfig: () => ({ databasePath: "/synthetic.sqlite" }) }));
vi.mock("./platform-erasure-worker-supervisor", () => ({ runErasureWorker: mocks.worker, assertErasureWorkerIdle: mocks.idle }));
vi.mock("./platform-erasure-request-preparation", () => ({ prepareAuthenticatedErasureRequest: mocks.prepare }));
import { GET, POST } from "@/app/api/platform/account-erasure/route";
import type Database from "better-sqlite3";
import { randomUUID, createHash } from "node:crypto";
import { ERASURE_STATUS_PROTOCOL, type ErasureAction } from "../../contracts/account-erasure-status";
import { erasureViewerRef } from "./platform-erasure-status-read";
import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import { PlatformAuthenticationRepository } from "../authentication/platform-authentication-repository";
import { PlatformSessionRepository } from "../authentication/platform-session-repository";
import { PlatformSessionService, TRADERLINK_PLATFORM_SESSION_COOKIE } from "../authentication/platform-session-service";
import { platformAuthCookieName } from "../authentication/platform-auth-cookies";
vi.mock("../database/open-platform-database", async original => ({
  ...await original<typeof import("../database/open-platform-database")>(),
  withPlatformDatabase: (_options: unknown, operation: (db: Database.Database) => unknown) => operation(mocks.database!),
}));
vi.mock("../database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, operation: (db: Database.Database) => unknown) => {
    const db = mocks.database!; db.pragma("query_only=ON");
    try { return operation(db); } finally { db.pragma("query_only=OFF"); }
  },
}));

const scope = { userId: "00000000-0000-4000-8000-000000000001", workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner", activeAccountId: "00000000-0000-4000-8000-000000000003", allowedAccountIds: ["00000000-0000-4000-8000-000000000003"] };
function request(action: string, confirmation: string, cookie?: string) {
  return new NextRequest("https://app.traderslink.pro/api/platform/account-erasure", {
    method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ action, confirmation, expectedAccountSelectionRef: action === "traderlink_account" ? null : "a".repeat(64), expectedViewerRef: erasureViewerRef(scope.userId) }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.identity.mockReturnValue({ scope, mode: "platform_session", sessionId: "synthetic-session" });
  mocks.worker.mockResolvedValue({ nextSelectionRef: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { mocks.database?.close(); mocks.database = null; vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("completion-based account erasure HTTP contract", () => {
  it("awaits worker completion, uses genuine scope and clears only selection for account deletion", async () => {
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
    expect(await response.json()).toMatchObject({ protocol: ERASURE_STATUS_PROTOCOL, status: "deleted", action: "trade_tracker_account", expectedViewerRef: erasureViewerRef(scope.userId) });
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
  it("passes only the authenticated command to request preparation before the worker", async () => {
    await POST(request("traderlink_account", "DELETE MY TRADERLINK ACCOUNT"));
    expect(mocks.prepare).toHaveBeenCalledOnce();
    const args = mocks.prepare.mock.calls[0]!;
    expect(args[3]).toBe("/synthetic.sqlite");
    expect(args[2].scope).toBe(scope);
    expect(args[2]).not.toHaveProperty("profileRef");
    expect(mocks.prepare.mock.invocationCallOrder[0]).toBeLessThan(mocks.worker.mock.invocationCallOrder[0]!);
  });
  it("refuses a failed request preparation before starting the deletion worker", async () => {
    mocks.prepare.mockImplementationOnce(() => platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT"));
    const response = await POST(request("traderlink_account", "DELETE MY TRADERLINK ACCOUNT"));
    expect(response.status).toBe(409);
    expect(mocks.worker).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("refuses an occupied writer before opening request-side renewal", async () => {
    mocks.idle.mockImplementationOnce(() => platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT"));
    const response = await POST(request("traderlink_account", "DELETE MY TRADERLINK ACCOUNT"));
    expect(response.status).toBe(409);
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.worker).not.toHaveBeenCalled();
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

/** Genuine parser/session/identity/Journal resolution; ONLY runtime DB-open and
 * effect dispatch are isolated ports. No actual erasure/provider admission. */
function actor(db: Database.Database, label: string) {
  const userId = randomUUID(), workspaceId = randomUUID(), authSubject = `synthetic-${label}@example.test`, at = new Date().toISOString();
  new PlatformUserRepository(db, { allowedAuthProviders: ["email"] }).createUser({
    userId, authProvider: "email", authSubject, displayName: label, createdAtUtc: at, updatedAtUtc: at,
  });
  new PlatformAuthenticationRepository(db).linkIdentity({ userId, authProvider: "email", authSubject, linkedByUserId: userId, timestamp: at });
  new PlatformWorkspaceRepository(db).createWorkspaceWithOwner({ workspaceId, ownerUserId: userId,
    displayName: `${label} workspace`, defaultTradingTimezone: "America/New_York", createdAtUtc: at });
  const created = new PlatformSessionService(new PlatformSessionRepository(db)).createForIdentity({ userId, authProvider: "email", authSubject });
  return { userId, workspaceId, token: created.token, sessionId: created.session.sessionId };
}
function nativeRequest(action: ErasureAction, viewer: string, token: string, binding: string | null = erasureViewerRef(viewer)) {
  return new NextRequest("https://app.traderslink.pro/api/platform/account-erasure", { method: "POST", headers: {
    cookie: `${platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)}=${encodeURIComponent(token)}`,
    "content-type": "application/json", origin: "https://app.traderslink.pro", "sec-fetch-site": "same-origin",
  }, body: JSON.stringify({ action, confirmation: action === "traderlink_account" ? "DELETE MY TRADERLINK ACCOUNT" : "DELETE ACCOUNT",
    expectedAccountSelectionRef: action === "traderlink_account" ? null : "a".repeat(64), expectedViewerRef: binding }) });
}
async function genuineActors() {
  mocks.database = openPristinePlatformTestDatabase();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "https://app.traderslink.pro");
  const actual = await vi.importActual<typeof import("../authentication/require-platform-request-scope")>("../authentication/require-platform-request-scope");
  mocks.identity.mockImplementation(actual.requireTraderLinkPlatformAuthenticatedRequestIdentity);
  return { db: mocks.database, a: actor(mocks.database, "Viewer A"), b: actor(mocks.database, "Viewer B") };
}
describe("original viewer enforcement through actual registered POST and genuine identity repositories", () => {
  it("preserves original byte binding instead of canonicalizing a valid request", async () => {
    const { a } = await genuineActors();
    const original = nativeRequest("traderlink_account", a.userId, a.token);
    const bytes = `\n${await original.text()}  `;
    const response = await POST(new NextRequest(original.url, { method: "POST", headers: original.headers, body: bytes }));
    expect(response.status).toBe(200);
    expect((await response.json()).bodySha256).toBe(createHash("sha256").update(bytes).digest("hex"));
  });
  it.each(["BOM", "oversized"])("refuses %s input before authentication or effects", async kind => {
    const original = request("traderlink_account", "DELETE MY TRADERLINK ACCOUNT");
    const bytes = kind === "BOM" ? `\ufeff${await original.text()}` : " ".repeat(8193);
    const response = await POST(new NextRequest(original.url, { method: "POST", headers: original.headers, body: bytes }));
    expect(response.ok).toBe(false); expect(mocks.identity).not.toHaveBeenCalled();
    expect(mocks.prepare).not.toHaveBeenCalled(); expect(mocks.worker).not.toHaveBeenCalled();
  });
  it.each(["trade_tracker_account", "demo_trade_tracker_account", "traderlink_account"] as const)("refuses A confirmation authenticated as B before any %s effect", async action => {
    const { a, b } = await genuineActors();
    // The mounted A snapshot has not changed; cookie B changes AFTER the last
    // browser check and BEFORE this actual handler's authentication resolution.
    const response = await POST(nativeRequest(action, a.userId, b.token));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ status: "known_not_submitted", reason: "viewer_changed", expectedViewerRef: erasureViewerRef(a.userId), action });
    expect(mocks.prepare).not.toHaveBeenCalled(); expect(mocks.worker).not.toHaveBeenCalled(); expect(mocks.idle).not.toHaveBeenCalled();
  });
  it.each(["trade_tracker_account", "demo_trade_tracker_account", "traderlink_account"] as const)("refuses missing/corrupt viewer binding before %s dispatch", async action => {
    const { a } = await genuineActors();
    for (const ref of [null, "corrupt"]) {
      const response = await POST(nativeRequest(action, a.userId, a.token, ref));
      expect(response.status).toBe(400);
    }
    expect(mocks.prepare).not.toHaveBeenCalled(); expect(mocks.worker).not.toHaveBeenCalled();
  });
  it("uses genuine scope on a valid original whole-account request, without a Community gate", async () => {
    const { a } = await genuineActors();
    const response = await POST(nativeRequest("traderlink_account", a.userId, a.token));
    expect(response.status).toBe(200); expect(mocks.prepare).toHaveBeenCalledOnce();
    expect(mocks.worker.mock.calls[0]![1]).toMatchObject({ scope: { userId: a.userId, workspaceId: a.workspaceId }, sessionId: a.sessionId, mode: "platform_session" });
    expect(mocks.worker.mock.calls[0]![1]).not.toHaveProperty("expectedViewerRef");
  });
  it("resolves authentication after awaited body read; revocation during input cannot use an earlier session snapshot", async () => {
    const { a, db } = await genuineActors();
    const original = nativeRequest("traderlink_account", a.userId, a.token);
    const bytes = new TextEncoder().encode(await original.text());
    let finish!: () => void;
    const body = new ReadableStream<Uint8Array>({ start(controller) { finish = () => { controller.enqueue(bytes); controller.close(); }; } });
    const pending = POST(new NextRequest(original.url, { method: "POST", headers: original.headers, body }));
    expect(mocks.identity).not.toHaveBeenCalled();
    expect(new PlatformSessionRepository(db).revokeActiveSessionForUser({ userId: a.userId, sessionId: a.sessionId, timestamp: new Date().toISOString() })).toBe(true);
    finish(); const response = await pending;
    expect(response.status).toBe(403); expect((await response.json()).status).not.toBe("known_not_submitted");
    expect(mocks.worker).not.toHaveBeenCalled(); expect(mocks.prepare).not.toHaveBeenCalled();
  });
  it("keeps every post-prepare/dispatch failure UNKNOWN, including postcommit transport/close uncertainty", async () => {
    const { a } = await genuineActors();
    mocks.prepare.mockImplementationOnce(() => { throw new Error("synthetic preparation uncertainty"); });
    expect((await (await POST(nativeRequest("traderlink_account", a.userId, a.token))).json()).status).toBe("unavailable");
    mocks.worker.mockRejectedValueOnce(new Error("synthetic committed result lost"));
    expect((await (await POST(nativeRequest("traderlink_account", a.userId, a.token))).json()).status).toBe("unavailable");
  });
  it("GET uses self-owned unexpired readonly rows; revocation and foreign receipts reveal no data", async () => {
    const { a, b, db } = await genuineActors(), receipt = randomUUID(), at = new Date().toISOString();
    db.prepare("INSERT INTO platform_erasure_history VALUES(?,?,?,'traderlink_account','outcome_unknown',?,?,NULL,NULL,?,NULL)")
      .run(receipt, a.userId, "private fixture name", at, at, new Date(Date.now() + 60000).toISOString());
    db.prepare("INSERT INTO platform_erasure_operations VALUES(?,NULL,'traderlink_account','purge_pending',1,?,NULL,0)").run(receipt, at);
    const get = async (token: string) => GET(new NextRequest(`https://app.traderslink.pro/api/platform/account-erasure?receipt=${receipt}`, {
      headers: { cookie: `${platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)}=${token}` },
    }));
    const own = await get(a.token); expect(own.status).toBe(200);
    expect(await own.json()).toMatchObject({ exact: { receiptRef: receipt }, currentPending: true });
    expect(own.headers.get("cache-control")).toBe("private, no-store");
    expect((await (await get(b.token)).json()).exact).toBeNull();
    expect(new PlatformSessionRepository(db).revokeActiveSessionForUser({ userId: a.userId, sessionId: a.sessionId, timestamp: new Date().toISOString() })).toBe(true);
    expect((await get(a.token)).status).toBe(403);
    expect(mocks.prepare).not.toHaveBeenCalled(); expect(mocks.worker).not.toHaveBeenCalled();
  });
});
