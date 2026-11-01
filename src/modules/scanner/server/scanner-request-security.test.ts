// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ allowed: false, run: vi.fn().mockResolvedValue({ status: "ready" }) }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({ requireTraderLinkPlatformRequestIdentity: () => ({ scope: {} }) }));
vi.mock("./scanner-early-access", () => ({ hasScannerEarlyAccess: () => state.allowed }));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({ openPlatformDatabase: () => ({ close: vi.fn() }) }));
vi.mock("@/src/modules/platform/server/broker-connections/moomoo-connection-repository", () => ({ MoomooConnectionRepository: class {} }));
vi.mock("./moomoo-stock-screen-service", () => ({ MoomooStockScreenService: class { run = state.run; } }));
import { POST } from "@/app/api/scanner/run/route";
beforeEach(() => { state.allowed = false; state.run.mockClear(); });
describe("scanner request boundary", () => {
  it("does not consume the body before access is established", async () => {
    const request = new Request("https://app.example.test/api/scanner/run", { method: "POST", body: "{}" });
    const body = vi.spyOn(request, "body", "get");
    expect((await POST(request)).status).toBe(404); expect(body).not.toHaveBeenCalled(); expect(state.run).not.toHaveBeenCalled();
  });
  it("rejects oversized bodies before provider execution", async () => {
    state.allowed = true;
    expect((await POST(new Request("https://app.example.test/api/scanner/run", { method: "POST", body: "x".repeat(32769) }))).status).toBe(413);
    expect(state.run).not.toHaveBeenCalled();
  });
  it("retains bounded authorized runs", async () => {
    state.allowed = true;
    expect((await POST(new Request("https://app.example.test/api/scanner/run", { method: "POST", body: JSON.stringify({ filters: [], limit: 25, sortBy: "daily-change" }) }))).status).toBe(200);
    expect(state.run).toHaveBeenCalledOnce();
  });
});
