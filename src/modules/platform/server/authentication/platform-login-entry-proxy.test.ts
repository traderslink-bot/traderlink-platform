// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../../../../../proxy";

describe("Workspace entry request context", () => {
  it.each(["/workspace", "/account/login", "/trades", "/api/auth/email", "/_next/static/test.js"])(
    "overwrites a forged entry path on %s", path => {
      const response = proxy(new NextRequest("https://app.traderslink.pro" + path, {
        headers: { "x-traderlink-page-path": "/workspace" },
      }));
      expect(response.headers.get("x-middleware-request-x-traderlink-page-path")).toBe(path);
    },
  );
  it("preserves the public help redirect", () => {
    const response = proxy(new NextRequest("https://app.traderslink.pro/help", { headers: { host: "app.traderslink.pro" } }));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://traderslink.pro/help");
  });
});
