// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { NextRequest, NextResponse } from "next/server";
import { setPlatformAuthCookie, platformAuthCookieName } from "./platform-auth-cookies";
afterEach(() => vi.unstubAllEnvs());
describe("host-bound authentication cookies", () => {
  it("sets only host-prefixed bearer cookies and deletes legacy domain values", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "https://app.traderslink.pro");
    const response = NextResponse.json({});
    setPlatformAuthCookie(response, new NextRequest("https://app.traderslink.pro/login"), "tl_platform_session", "private-token", 600);
    const cookies = response.headers.getSetCookie();
    const bearer = cookies.find((cookie) => cookie.includes("private-token"))!;
    expect(bearer).toContain("__Host-tl_platform_session=private-token");
    expect(bearer).toContain("Secure"); expect(bearer).toContain("HttpOnly"); expect(bearer).toContain("Path=/"); expect(bearer).not.toContain("Domain=");
    expect(cookies.filter((cookie) => cookie.includes("Domain=")).every((cookie) => cookie.includes("Max-Age=0"))).toBe(true);
  });
  it("retains loopback HTTP cookie names in development", () => {
    vi.stubEnv("NODE_ENV", "development"); expect(platformAuthCookieName("tl_platform_session")).toBe("tl_platform_session");
  });
});
