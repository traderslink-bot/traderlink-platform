import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
vi.mock("./platform-google-oauth", () => ({
  finishGoogleLogin: vi.fn(async () => ({ subject: "synthetic-subject", displayName: "QA" })),
}));
vi.mock("./platform-login-http", () => ({
  loginOperation: vi.fn(() => ({ token: "synthetic-session-token" })),
  loginReturnTo: () => "/account/login",
  loginSession: () => null,
}));
import { GET } from "../../../../../app/api/auth/google/callback/route";
afterEach(() => vi.unstubAllEnvs());
describe("Google callback cookies", () => {
  it.each(["https://app.traderslink.pro", "https://preview.example.test"])(
    "retains the signed-in session when clearing OAuth cookies on %s", async (origin) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", origin);
      const transaction = encodeURIComponent(JSON.stringify({ linking: false, returnTo: "/account/login" }));
      const response = await GET(new NextRequest(origin + "/api/auth/google/callback?code=synthetic", {
        headers: { cookie: `tl_google_oauth=${transaction}` },
      }));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(origin + "/account/login");
      const cookie = response.headers.get("set-cookie") ?? "";
      expect(cookie).toContain("tl_platform_session=synthetic-session-token");
      expect(cookie).toContain("tl_google_oauth=;");
      expect(cookie).toContain("tl_provider_link=;");
      expect(cookie).toContain("tl_provider_link_method=;");
      expect(cookie).toContain("Max-Age=0");
    },
  );
});
