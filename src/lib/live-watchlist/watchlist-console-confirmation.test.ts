import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/app/(dashboard)/admin/watchlist/watchlist-analysis-editor", () => ({ WatchlistAnalysisEditor: () => null }));
import { WatchlistRuntimeAdminClient } from "@/app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client";
const generation = "11111111-1111-4111-8111-111111111111";
afterEach(() => { document.body.innerHTML = ""; vi.unstubAllGlobals(); });
describe("trusted Watchlist mutation confirmation", () => {
  it("ignores foreign frames/origins and sends only the displayed confirmed request", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { headers: { "content-type": "application/json" } })); vi.stubGlobal("fetch", fetch);
    const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
    try {
      await act(async () => root.render(createElement(WatchlistRuntimeAdminClient)));
      const frame = host.querySelector("iframe")!; expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
      const message = (data: object, origin = "null", source: MessageEventSource | null = frame.contentWindow) => window.dispatchEvent(new MessageEvent("message", { data: { source: "traderslink-watchlist-relay", ...data }, origin, source }));
      await act(async () => { message({ type: "initialize", generation }); });
      const input = { type: "request", id: generation + "-1", url: "/api/admin/watchlist/runtime/watchlist/activate", method: "POST", body: '{"symbol":"ABCD"}' };
      await act(async () => { message(input, window.location.origin); message(input, "null", window); });
      expect(document.body.textContent).not.toContain("Confirm Watchlist change");
      await act(async () => { message(input); });
      expect(document.body.textContent).toContain("Confirm Watchlist change"); expect(fetch).not.toHaveBeenCalled();
      input.body = '{"symbol":"OTHER"}';
      const confirm = [...document.querySelectorAll("button")].find(button => button.textContent === "Confirm change")!;
      await act(async () => { confirm.click(); });
      expect(fetch).toHaveBeenCalledOnce(); expect(fetch.mock.calls[0][1].body).toBe('{"symbol":"ABCD"}');
      await act(async () => { message({ ...input, id: generation + "-2" }); });
      const cancel = [...document.querySelectorAll("button")].find(button => button.textContent === "Cancel")!;
      await act(async () => { cancel.click(); }); expect(fetch).toHaveBeenCalledOnce();
    } finally { await act(async () => root.unmount()); }
  });
});
