import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as start } from "@/app/api/connections/moomoo/start/route";
import { GET as callback } from "@/app/api/connections/moomoo/callback/route";

const fixture = vi.hoisted(() => ({
  state: "synthetic-state",
  verifier: "synthetic-verifier",
  prepare: vi.fn(),
  consume: vi.fn(),
  exchange: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => ({
    scope: { userId: "test-user", workspaceId: "test-workspace" },
    sessionId: "test-session",
  }),
}));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({
  withPlatformDatabase: (_options: unknown, read: (database: unknown) => unknown) =>
    read({ transaction: (operation: () => unknown) => ({ immediate: operation }) }),
}));
vi.mock("@/src/modules/platform/server/broker-connections/moomoo-connection-repository", () => ({
  MoomooConnectionRepository: class {
    assertAuthorizationAllowed() {}
    saveAuthorized = fixture.save;
  },
}));
vi.mock("@/src/modules/platform/server/broker-connections/moomoo-connection-credentials", () => ({
  encryptMoomooCredentials: () => "synthetic-encrypted-tokens",
  loadMoomooCredentialKeyConfiguration: () => ({}),
}));
vi.mock("@/src/modules/platform/server/broker-connections/moomoo-operation-observability", () => ({
  recordMoomooOperationFailure: () => true,
}));
vi.mock("@/src/modules/platform/server/broker-connections/moomoo-oauth-pending-attempt-service", () => ({
  MoomooOAuthPendingAttemptService: class {
    prepare = fixture.prepare;
    consume = fixture.consume;
  },
  recordMoomooOAuthPendingOutcome: vi.fn(),
}));
vi.mock("@/src/modules/platform/server/broker-connections/moomoo-oauth", () => ({
  buildMoomooAuthorizeUrl: () => new URL("https://broker.test/consent"),
  getMoomooOAuthConfig: () => ({ clientId: "fixture", redirectUri: "https://app.traderslink.pro/api/connections/moomoo/callback" }),
  exchangeMoomooCode: fixture.exchange,
}));
vi.mock("@/src/modules/journal/server/broker-imports/moomoo-execution-import-repository", () => ({
  MoomooExecutionImportRepository: class { disconnectLinksForConnection() {} },
}));

const origin = "https://app.traderslink.pro";
const startUrl = origin + "/api/connections/moomoo/start";
const callbackUrl = origin + "/api/connections/moomoo/callback";

function browserCookies(response: Response) {
  return response.headers.getSetCookie()
    .filter(cookie => !cookie.includes("Max-Age=0"))
    .map(cookie => cookie.split(";", 1)[0])
    .join("; ");
}

describe("production Moomoo OAuth round trip", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", origin);
    fixture.prepare.mockReturnValue({ state: fixture.state, verifier: fixture.verifier, challenge: "challenge", outcome: "oauth_start_created" });
    fixture.consume.mockReturnValue(true);
    fixture.exchange.mockResolvedValue({ accessToken: "fixture-access", refreshToken: "fixture-refresh", expiresInSeconds: 300, scopes: ["quote:read"] });
    fixture.save.mockReturnValue({ connectionId: "test-connection" });
  });
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });

  it("reads the secure cookies written by start, reuses a pending attempt, and completes the callback", async () => {
    const url = startUrl + "?from=workspace-onboarding";
    const response = await start(new NextRequest(url));
    expect(response.status).toBe(307);
    const cookie = browserCookies(response);
    expect(cookie).toContain("__Host-tl_moomoo_oauth_state=");
    expect(cookie).toContain("__Host-tl_moomoo_oauth_verifier=");
    expect(cookie).toContain("__Host-tl_moomoo_oauth_onboarding_return=");

    await start(new NextRequest(url, { headers: { cookie } }));
    expect(fixture.prepare).toHaveBeenLastCalledWith(expect.objectContaining({
      cookieState: fixture.state, cookieVerifier: fixture.verifier,
    }));
    const returned = await callback(new NextRequest(callbackUrl + "?state=" + fixture.state + "&code=fixture-code", { headers: { cookie } }));
    expect(new URL(returned.headers.get("location")!).pathname).toBe("/trade-tracker");
    expect(fixture.consume).toHaveBeenCalledOnce();
    expect(fixture.exchange).toHaveBeenCalledWith(expect.objectContaining({ code: "fixture-code", verifier: fixture.verifier }));
    expect(fixture.save).toHaveBeenCalledOnce();
  });

  it("rejects a mismatched state or legacy-only cookies before calling Moomoo", async () => {
    const response = await start(new NextRequest(startUrl));
    for (const [state, cookie] of [
      ["different-state", browserCookies(response)],
      [fixture.state, `tl_moomoo_oauth_state=${fixture.state}; tl_moomoo_oauth_verifier=${fixture.verifier}`],
    ]) {
      const returned = await callback(new NextRequest(callbackUrl + "?state=" + state + "&code=fixture-code", { headers: { cookie } }));
      expect(new URL(returned.headers.get("location")!).searchParams.get("moomoo")).toBe("invalid-state");
    }
    expect(fixture.consume).not.toHaveBeenCalled();
    expect(fixture.exchange).not.toHaveBeenCalled();
  });
});
