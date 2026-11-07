// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { createAlpacaGateway } from "./gateway";

afterEach(() => vi.unstubAllGlobals());
describe("private Alpaca gateway", () => {
  it("shares one upstream socket and closes it after the last chart disconnects", async () => {
    const sockets: FakeSocket[] = [];
    class FakeSocket extends EventTarget {
      static OPEN = 1;
      readyState = 1;
      sent: { action: string; bars?: string[] }[] = [];
      constructor() { super(); sockets.push(this); queueMicrotask(() => this.dispatchEvent(new Event("open"))); }
      message(data: unknown) { this.dispatchEvent(Object.assign(new Event("message"), { data: JSON.stringify(data) })); }
      send(value: string) {
        const command = JSON.parse(value); this.sent.push(command);
        if (command.action === "auth") queueMicrotask(() => this.message([{ T: "success", msg: "authenticated" }]));
        if (command.action === "subscribe") queueMicrotask(() => this.message([{ T: "subscription" }]));
      }
      close = vi.fn(() => { this.readyState = 3; this.dispatchEvent(new Event("close")); });
    }
    vi.stubGlobal("WebSocket", FakeSocket);
    const gateway = createAlpacaGateway({ keyId: "key", secretKey: "secret", token: "test-token" });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/stream?symbol=AAPL`;
    const auth = { headers: { Authorization: "Bearer test-token" } };
    try {
      const first = await fetch(url, auth), second = await fetch(url, auth);
      expect(sockets).toHaveLength(1);
      await first.body!.cancel();
      await vi.waitFor(() => expect(sockets[0].sent.some(command => command.action === "subscribe")).toBe(true));
      expect(sockets[0].close).not.toHaveBeenCalled();
      const reader = second.body!.getReader();
      sockets[0].message([{ T: "u", S: "AAPL", t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 123 }]);
      let output = "";
      while (!output.includes('"volume":123')) output += new TextDecoder().decode((await reader.read()).value);
      expect(output).toContain("event: bar"); expect(output).toContain('"daily":false');
      await reader.cancel();
      await vi.waitFor(() => expect(sockets[0].close).toHaveBeenCalledOnce());
    } finally { gateway.close(); gateway.server.closeAllConnections(); }
  });
  it("denies unauthenticated requests before provider access, validates symbols, caches history and masks provider errors", async () => {
    const nativeFetch = globalThis.fetch;
    const provider = vi.fn<typeof fetch>(async () => Response.json({ bars: { AAPL: [{ t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 100 }] } }));
    vi.stubGlobal("fetch", provider);
    const gateway = createAlpacaGateway({ keyId: "private-key", secretKey: "private-secret", token: "test-gateway-token" });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`;
    const auth = { headers: { Authorization: "Bearer test-gateway-token" } };
    try {
      expect((await nativeFetch(`${url}/bars?symbol=AAPL`)).status).toBe(401);
      expect(provider).not.toHaveBeenCalled();
      expect((await nativeFetch(`${url}/bars?symbol=../AAPL`, auth)).status).toBe(400);
      const response = await nativeFetch(`${url}/bars?symbol=AAPL`, auth);
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.bars).toHaveLength(1); expect(result.feed).toBe("sip");
      await nativeFetch(`${url}/bars?symbol=AAPL`, auth);
      expect(provider).toHaveBeenCalledTimes(1);
      const requested = new URL(String(provider.mock.calls[0][0]));
      expect(requested.hostname).toBe("data.alpaca.markets");
      expect(requested.searchParams.get("feed")).toBe("sip");
      expect(requested.searchParams.get("sort")).toBe("desc");
      provider.mockImplementationOnce(async () => { throw Error("private-secret"); });
      const failed = await nativeFetch(`${url}/bars?symbol=MSFT`, auth);
      expect(failed.status).toBe(502);
      expect(await failed.text()).not.toContain("private-secret");
    } finally { gateway.close(); gateway.server.closeAllConnections(); }
  });
});
