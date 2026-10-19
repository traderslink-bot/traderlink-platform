// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ path: "/workspace", guard: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-traderlink-page-path": state.path }) }));
vi.mock("./require-platform-request-scope", () => ({ requireTraderLinkPlatformServerComponentPageIdentity: state.guard }));
import Template from "../../../../../app/(dashboard)/template";
beforeEach(() => { state.guard.mockReset(); });
describe("Dashboard navigation admission", () => {
  it("checks protected-page navigation after a Workspace landing", async () => {
    state.path = "/workspace";
    expect(await Template({ children: "welcome" })).toBe("welcome");
    expect(state.guard).not.toHaveBeenCalled();
    state.path = "/trades";
    state.guard.mockRejectedValue(new Error("access blocked"));
    await expect(Template({ children: "private facts" })).rejects.toThrow("access blocked");
    expect(state.guard).toHaveBeenCalledOnce();
  });
});
