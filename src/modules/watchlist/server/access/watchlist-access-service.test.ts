import { afterEach, describe, expect, it, vi } from "vitest";

const localBoundary = vi.hoisted(() => ({
  requirePage: vi.fn(),
  requireRequest: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock(
  "@/src/modules/platform/server/authentication/require-platform-request-scope",
  () => ({
    requireTraderLinkPlatformAuthenticatedPageIdentity: localBoundary.requirePage,
    requireTraderLinkPlatformAuthenticatedRequestIdentity: localBoundary.requireRequest,
  }),
);

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { authorizeWatchlistPageAccess, authorizeWatchlistRequest } from "./watchlist-access-service";

describe("Watchlist member access", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it("uses the guarded Platform user for local development review", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", undefined);
    localBoundary.requirePage.mockResolvedValue({
      mode: "local_development",
      scope: { userId: "platform-user" },
      discord: null,
    });

    await expect(authorizeWatchlistPageAccess()).resolves.toEqual({
      ok: true,
      principal: {
        kind: "platform_user",
        platformUserId: "platform-user",
      },
    });
  });

  it("fails closed when a hosted request has no Platform session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    localBoundary.requirePage.mockRejectedValue(new Error("denied"));

    await expect(authorizeWatchlistPageAccess()).resolves.toEqual({
      ok: false,
      status: 401,
      reason: "login_required",
      error: "Sign in to view the live watchlist.",
    });
    expect(localBoundary.requirePage).toHaveBeenCalledOnce();
  });
});


describe("Watchlist membership denial", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
  function denied() {
    try { platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED", { reason: "membership_feature_required", feature: "watchlist.access" }); }
    catch (error) { return error; }
  }
  it("keeps a denied signed-in page on Watchlist for its upgrade view", async () => {
    vi.stubEnv("NODE_ENV", "production");
    localBoundary.requirePage.mockRejectedValue(denied());
    await expect(authorizeWatchlistPageAccess()).resolves.toMatchObject({ ok: false, status: 403, reason: "membership_required" });
    expect(localBoundary.requirePage).toHaveBeenCalledWith({ membershipFeatures: ["watchlist.access"] });
  });
  it("returns the same denial to direct API callers", async () => {
    localBoundary.requireRequest.mockImplementation(() => { throw denied(); });
    await expect(authorizeWatchlistRequest({ headers: new Headers() })).resolves.toMatchObject({ ok: false, status: 403, reason: "membership_required" });
  });
  it("accepts an authenticated Google/email identity without requiring Discord", async () => {
    localBoundary.requirePage.mockResolvedValue({ mode: "platform_session", scope: { userId: "member" }, discord: null });
    await expect(authorizeWatchlistPageAccess()).resolves.toMatchObject({ ok: true, principal: { platformUserId: "member" } });
  });
});
