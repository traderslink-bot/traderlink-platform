// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { browserDataSession, matchesBrowserDataSession } from "./server/browser-data-session";

const state = vi.hoisted(() => ({ provider: "alpaca" as "alpaca" | "moomoo", revision: 0, authenticated: true }));
vi.mock("./server/provider-settings", () => ({ marketDataSelection: () => ({ provider: state.provider, revision: state.revision }) }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => { if (!state.authenticated) throw Error("unauthenticated"); return {}; },
}));
import { GET } from "@/app/api/charts/provider/route";

afterEach(() => { state.provider = "alpaca"; state.revision = 0; state.authenticated = true; });

it("exposes only an opaque generation and keeps authentication and feature validation", async () => {
  const request = () => new Request("https://app.example/api/charts/provider?feature=charts");
  const response = GET(request());
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(Object.keys(body)).toEqual(["generation"]);
  expect(body.generation).toMatch(/^[a-f0-9]{64}$/);
  expect(body).toEqual(await GET(request()).json());
  expect(response.headers.get("cache-control")).toContain("no-store");
  state.authenticated = false;
  expect(GET(request()).status).toBe(401);
  state.authenticated = true;
  expect(GET(new Request("https://app.example/api/charts/provider?feature=watchlist")).status).toBe(400);
});

it("isolates features and source switches including switching back, without reversible source labels", () => {
  const a = { provider: "alpaca" as const, revision: 0 };
  const b = { provider: "moomoo" as const, revision: 1 };
  const again = { provider: "alpaca" as const, revision: 2 };
  const tokens = [browserDataSession("charts", a), browserDataSession("charts", b), browserDataSession("charts", again), browserDataSession("scanners", a)];
  expect(new Set(tokens.map(value => value.generation)).size).toBe(4);
  for (const value of tokens) expect(JSON.stringify(value)).not.toMatch(/alpaca|moomoo|sip|revision/i);
  const query = new URLSearchParams(tokens[0]);
  expect(matchesBrowserDataSession(query, "charts", a)).toBe(true);
  expect(matchesBrowserDataSession(query, "charts", b)).toBe(false);
  expect(matchesBrowserDataSession(query, "charts", again)).toBe(false);
  expect(matchesBrowserDataSession(query, "scanners", a)).toBe(false);
  expect(matchesBrowserDataSession(new URLSearchParams({ generation: "invalid" }), "charts", a)).toBe(false);
});

it("rejects retired routing parameters uniformly even with a current opaque generation", () => {
  const selections = [{ provider: "alpaca", revision: 0 }, { provider: "moomoo", revision: 1 }] as const;
  for (const selection of selections) {
    const current = browserDataSession("charts", selection);
    expect(matchesBrowserDataSession(new URLSearchParams(), "charts", selection)).toBe(true);
    for (const input of ["provider=", "providerRevision=", "provider=alpaca&provider=moomoo", "%70roviderRevision=0"]) {
      const query = new URLSearchParams(input);
      expect(matchesBrowserDataSession(query, "charts", selection)).toBe(false);
      query.set("generation", current.generation);
      expect(matchesBrowserDataSession(query, "charts", selection)).toBe(false);
    }
  }
});
