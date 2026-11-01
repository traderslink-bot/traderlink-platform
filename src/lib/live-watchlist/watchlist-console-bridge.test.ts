import { afterEach, describe, expect, it, vi } from "vitest";
import { readWatchlistConsoleRequest, sendWatchlistConsoleRequest } from "./watchlist-console-bridge";
const origin = "https://app.example.test";
afterEach(() => vi.unstubAllGlobals());
describe("opaque console request relay", () => {
  it.each(["/api/admin/journal/users", "/api/platform/journal/imports/commit", "https://attacker.example/api/admin/watchlist/runtime/watchlist", "/api/admin/watchlist/runtime/../journal/users", "/api/admin/watchlist/runtime/%2e%2e/journal/users"])("rejects non-Watchlist target %s", (url) => {
    expect(readWatchlistConsoleRequest({ id: "request-1", method: "POST", url, body: "{}" }, origin)).toBeNull();
  });
  it("copies validated request data so later child changes cannot alter a confirmation", () => {
    const input = { id: "request-1", method: "POST", url: "/api/admin/watchlist/runtime/watchlist/activate", body: '{"symbol":"ABCD"}' };
    const request = readWatchlistConsoleRequest(input, origin)!;
    input.body = '{"symbol":"OTHER"}';
    expect(Object.isFrozen(request)).toBe(true); expect(request.body).toBe('{"symbol":"ABCD"}');
  });
  it("rejects non-allowlisted methods and oversized bodies", () => {
    expect(readWatchlistConsoleRequest({ id: "request-1", method: "DELETE", url: "/api/admin/watchlist/runtime/watchlist" }, origin)).toBeNull();
    expect(readWatchlistConsoleRequest({ id: "request-1", method: "POST", url: "/api/admin/watchlist/runtime/watchlist/activate", body: "x".repeat(1048577) }, origin)).toBeNull();
  });
  it("adds trusted request headers without forwarding child credentials and rejects HTML responses", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("<script>bad()</script>", { headers: { "content-type": "text/html" } })); vi.stubGlobal("fetch", fetch);
    const request = readWatchlistConsoleRequest({ id: "request-1", method: "GET", url: "/api/admin/watchlist/runtime/watchlist" }, origin)!;
    await expect(sendWatchlistConsoleRequest(request, new AbortController().signal)).rejects.toThrow();
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: "same-origin", redirect: "error", headers: { "x-traderlink-journal-admin-request": "1" } });
    expect(fetch.mock.calls[0][1].headers.authorization).toBeUndefined();
  });
});
