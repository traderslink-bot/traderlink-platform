import { afterEach, describe, expect, it, vi } from "vitest";

const localBoundary = vi.hoisted(() => ({
  requirePage: vi.fn(),
  requireRequest: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock(
  "@/src/modules/platform/server/authentication/require-platform-request-scope",
  () => ({
    requireTraderLinkPlatformDiscordMemberPageIdentity: localBoundary.requirePage,
    requireTraderLinkPlatformDiscordMemberRequestIdentity: localBoundary.requireRequest,
  }),
);

import { authorizeWatchlistPageAccess } from "./watchlist-access-service";

describe("Watchlist member access", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
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
      error: "Discord login is required to view the live watchlist.",
    });
    expect(localBoundary.requirePage).toHaveBeenCalledOnce();
  });
});
