import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
const { createLinkIntent } = vi.hoisted(() => ({ createLinkIntent: vi.fn(() => "synthetic-bound-intent") }));
vi.mock("./platform-login-http", async importOriginal => {
  const actual = await importOriginal<typeof import("./platform-login-http")>();
  return { ...actual, throttleLogin: vi.fn(), loginOperation: (operation: (service: unknown) => unknown) => operation({ createLinkIntent }) };
});
import { POST } from "../../../../../app/api/auth/connections/route";
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("account-bound Discord membership check", () => {
  it.each(["/workspace", "/account/login", "https://untrusted.example/", "//untrusted.example/"])("requires consent and restricts return destination %s", async returnTo => {
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "https://preview.example.test");
    const response = await POST(new NextRequest("https://preview.example.test/api/auth/connections", {
      method: "POST", headers: { origin: "https://preview.example.test", "content-type": "application/json", cookie: "tl_platform_session=synthetic-current-session" },
      body: JSON.stringify({ action: "connect", provider: "discord", returnTo }),
    }));
    expect(response.status).toBe(200);
    expect(createLinkIntent).toHaveBeenCalledWith("synthetic-current-session", "discord");
    const redirect = new URL((await response.json()).redirect, "https://preview.example.test");
    expect(redirect.pathname).toBe("/api/auth/discord/login");
    expect(redirect.searchParams.get("prompt")).toBe("consent");
    expect(redirect.searchParams.get("connect")).toBe("1");
    expect(redirect.searchParams.get("returnTo")).toBe(returnTo === "/workspace" ? "/workspace" : "/account/login");
    const cookies = response.headers.get("set-cookie");
    expect(cookies).toContain("tl_provider_link=synthetic-bound-intent");
    expect(cookies).toContain("tl_provider_link_method=discord");
    expect(cookies).toContain("HttpOnly");
  });
  it("rejects a cross-site attempt before issuing an intent", async () => {
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "https://preview.example.test");
    const response = await POST(new NextRequest("https://preview.example.test/api/auth/connections", {
      method: "POST", headers: { origin: "https://untrusted.example", "content-type": "application/json" },
      body: JSON.stringify({ action: "connect", provider: "discord", returnTo: "/workspace" }),
    }));
    expect(response.status).toBe(400);
    expect(createLinkIntent).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
