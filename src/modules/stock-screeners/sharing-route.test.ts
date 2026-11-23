import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/stock-screeners/route";
import { sharedScreenPath } from "./sharing-contracts";

const session = vi.hoisted(() => ({ eligible: false, dashboard: true, enabled: true, userId: "" }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity() {
    if (!session.dashboard) throw Error("dashboard_denied");
    if (!session.userId) throw Error("unauthenticated");
    return { mode: "platform_session", displayName: "TraderLink test member", discord: null, scope: { userId: session.userId } };
  },
  requireTraderLinkPlatformAuthenticatedRequestIdentity() {
    if (!session.userId) throw Error("unauthenticated");
    return { mode: "platform_session", discord: null, scope: { userId: session.userId } };
  },
}));
vi.mock("@/src/modules/market-data/server/market-tools-dashboard-access", () => ({
  hasStockScreenersDashboardAccess: () => session.eligible,
}));
vi.mock("./service", () => ({
  stockScreenersEnabled: () => session.enabled,
  takeScreenBudget: () => true,
}));

const endpoint = "https://app.traderslink.pro/api/stock-screeners";

describe("stock screener sharing access", () => {
  it("preserves the shared preset during sign-in and keeps the gallery behind member access", async () => {
    session.userId = "";
    const id = randomUUID();
    const response = await GET(new Request(endpoint + "?open=" + id));
    expect(response.status).toBe(303);
    const login = new URL(response.headers.get("location")!, endpoint);
    expect(login.pathname).toBe("/login");
    expect(login.searchParams.get("returnTo")).toBe(sharedScreenPath(id));
    expect((await GET(new Request(endpoint + "?community=1"))).status).toBe(404);

    session.userId = "member";
    session.eligible = false;
    expect((await GET(new Request(endpoint + "?open=" + id))).status).toBe(404);
    expect((await GET(new Request(endpoint + "?community=1"))).status).toBe(404);
    session.eligible = true;
    const signedIn = await GET(new Request(endpoint + "?open=" + id));
    expect(signedIn.status).toBe(303);
    expect(signedIn.headers.get("location")).toBe(sharedScreenPath(id));
    session.dashboard = false;
    expect((await GET(new Request(endpoint + "?open=" + id))).status).toBe(404);
    session.dashboard = true;
    session.enabled = false;
    expect((await GET(new Request(endpoint + "?open=" + id))).status).toBe(404);
    expect((await GET(new Request(endpoint + "?community=1"))).status).toBe(404);
    session.enabled = true;
  });

  it("requires the existing same-origin mutation contract for sharing", async () => {
    session.userId = "member";
    session.eligible = true;
    const response = await POST(new Request(endpoint, {
      method: "POST", headers: { Origin: "https://other.example", Host: "app.traderslink.pro", "Sec-Fetch-Site": "cross-site" },
      body: JSON.stringify({ action: "share", operation: "revoke", screenId: randomUUID(), expectedId: randomUUID() }),
    }));
    expect(response.status).toBe(403);
  });
});
