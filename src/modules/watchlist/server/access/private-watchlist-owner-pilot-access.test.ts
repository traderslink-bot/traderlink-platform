// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  identity: null as unknown,
  admitted: false,
  signedOut: false,
}));

vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformPageIdentity: async () => {
    if (fixture.signedOut) throw new Error("Invalid or missing session");
    return fixture.identity;
  },
}));

vi.mock("./watchlist-dashboard-navigation-access", () => ({
  hasWatchlistDashboardNavigationAccess: () => fixture.admitted,
}));

import { readPrivateWatchlistPilotPageIdentity } from "./private-watchlist-owner-pilot-access";

describe("Private Watchlist pilot page identity", () => {
  beforeEach(() => {
    fixture.identity = Object.freeze({ mode: "platform_session", sessionId: "fixture", scope: { userId: "fixture-user" } });
    fixture.admitted = false;
    fixture.signedOut = false;
  });

  it("returns the authenticated identity only when the pilot predicate admits it", async () => {
    fixture.admitted = true;
    await expect(readPrivateWatchlistPilotPageIdentity()).resolves.toBe(fixture.identity);
    fixture.admitted = false;
    await expect(readPrivateWatchlistPilotPageIdentity()).resolves.toBeNull();
  });

  it("preserves signed-out denial before the pilot predicate can grant access", async () => {
    fixture.admitted = true;
    fixture.signedOut = true;
    await expect(readPrivateWatchlistPilotPageIdentity()).rejects.toThrow("Invalid or missing session");
  });
});
