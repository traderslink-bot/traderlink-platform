// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshMoomooAccessToken } from "./moomoo-oauth";

const input = { clientId: "synthetic-client", refreshToken: "synthetic-refresh" };
afterEach(() => vi.unstubAllGlobals());
describe("Moomoo refresh outcome classification", () => {
  it.each([429, 500, 502, 503, 401])("preserves consent on HTTP %s even with an invalid_grant body", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "invalid_grant" }, { status })));
    expect(await refreshMoomooAccessToken(input)).toEqual({ status: "unavailable" });
  });
  it("requires authorization only for explicit invalid_grant on HTTP 400", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "invalid_grant" }, { status: 400 })));
    expect(await refreshMoomooAccessToken(input)).toEqual({ status: "reauthorization_required" });
  });
  it.each(["invalid_client", "invalid_request", "server_error"])("does not blame user consent for %s", async error => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error }, { status: 400 })));
    expect(await refreshMoomooAccessToken(input)).toEqual({ status: "unavailable" });
  });
  it("preserves consent on network failure and invalid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("synthetic outage")));
    expect(await refreshMoomooAccessToken(input)).toEqual({ status: "unavailable" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));
    expect(await refreshMoomooAccessToken(input)).toEqual({ status: "unavailable" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json")));
    expect(await refreshMoomooAccessToken(input)).toEqual({ status: "unavailable" });
  });
  it.each([{ access_token: "token", expires_in: 0, scope: "quote:read" },
    { access_token: "token", expires_in: 7200, scope: "trade:write quote:read" },
    { access_token: "token", expires_in: 7200, scope: "trade:read" }, []])("rejects malformed or unsafe success without revocation: %j", async payload => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
    expect(await refreshMoomooAccessToken(input)).toEqual({ status: "unavailable" });
  });
  it("accepts documented nonrotating refresh response with bounded timeout", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ access_token: "synthetic-token", expires_in: 7200, scope: "quote:read trade:read" }));
    vi.stubGlobal("fetch", request);
    expect(await refreshMoomooAccessToken(input)).toEqual({ status: "refreshed", accessToken: "synthetic-token", expiresInSeconds: 7200, scopes: ["quote:read", "trade:read"] });
    expect(request.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(request.mock.calls[0][1].body.get("refresh_token")).toBe(input.refreshToken);
  });
});
