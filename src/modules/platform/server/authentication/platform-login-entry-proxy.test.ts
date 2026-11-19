// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../../../../../proxy";

describe("Dashboard entry request context", () => {
  it.each(["/workspace", "/account/login", "/trades", "/api/auth/email", "/_next/static/test.js"])(
    "overwrites a forged entry path on %s", path => {
      const response = proxy(new NextRequest("https://app.traderslink.pro" + path, {
        headers: { "x-traderlink-page-path": "/workspace" },
      }));
      expect(response.headers.get("x-middleware-request-x-traderlink-page-path")).toBe(path);
    },
  );
  it("distinguishes opening the app from a feature link and preserves its query", () => {
    const hostname = "https://app.traderslink.pro";
    const cookieName = process.env.NODE_ENV === "production" ? "__Host-tl_platform_session" : "tl_platform_session";
    const headers = {
      host: "app.traderslink.pro",
      cookie: `${cookieName}=synthetic-session`,
      "x-traderlink-page-return-to": "/workspace",
    };
    const entry = proxy(new NextRequest(hostname, { headers }));
    expect(entry.headers.get("location")).toBe(hostname + "/dashboard-entry");
    expect(entry.headers.get("cache-control")).toContain("no-store");

    const deepLink = proxy(new NextRequest(hostname + "/workspace?period=month&_rsc=123", { headers }));
    expect(deepLink.headers.get("location")).toBeNull();
    expect(deepLink.headers.get("x-middleware-request-x-traderlink-page-return-to")).toBe("/workspace?period=month");
  });

  it.each([
    { url: "https://app.traderslink.pro/help", host: "app.traderslink.pro", expected: "https://traderslink.pro/help" },
    { url: "http://0.0.0.0:8080/help/traderslink-app/shared-alerts?from=shared-alerts&section=sharing-requests", host: "0.0.0.0:8080", expected: "https://traderslink.pro/help/traderslink-app/shared-alerts?from=shared-alerts&section=sharing-requests" },
  ])("preserves the public help redirect for $url", ({ url, host, expected }) => {
    const response = proxy(new NextRequest(url, { headers: { host, "x-forwarded-host": "app.traderslink.pro" } }));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(expected);
  });
});
