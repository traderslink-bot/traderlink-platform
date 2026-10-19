// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { NextRequest } from "next/server";
import { loginReturnTo, readLoginBody } from "./platform-login-http";
describe("login HTTP boundary", () => {
  it("blocks cross-origin mutations, unexpected bodies and open redirects", async () => {
    expect(loginReturnTo(undefined)).toBe("/workspace");
    expect(loginReturnTo("/account/login")).toBe("/account/login");
    expect(loginReturnTo("//other.example/path")).toBe("/workspace");
    expect(loginReturnTo("/\\other.example")).toBe("/workspace");
    expect(loginReturnTo("/workspace?view=journal")).toBe(
      "/workspace?view=journal",
    );
    await expect(
      readLoginBody(
        new NextRequest("https://app.traderslink.pro/api/auth/email", {
          method: "POST",
          headers: {
            origin: "https://other.example",
            "content-type": "application/json",
          },
          body: "{}",
        }),
      ),
    ).rejects.toThrow();
    await expect(
      readLoginBody(
        new NextRequest("https://app.traderslink.pro/api/auth/email", {
          method: "POST",
          headers: {
            origin: "https://app.traderslink.pro",
            "content-type": "application/json",
          },
          body: JSON.stringify({ value: "a".repeat(9000) }),
        }),
      ),
    ).rejects.toThrow();
    expect(
      await readLoginBody(
        new NextRequest("https://app.traderslink.pro/api/auth/email", {
          method: "POST",
          headers: {
            origin: "https://app.traderslink.pro",
            "content-type": "application/json",
          },
          body: '{"action":"login"}',
        }),
      ),
    ).toEqual({ action: "login" });
  });
  it('rejects structured values for credential fields before coercion', async () => {
    await expect(readLoginBody(new NextRequest('https://app.traderslink.pro/api/auth/email', {
      method:'POST', headers:{origin:'https://app.traderslink.pro','content-type':'application/json'},
      body:JSON.stringify({action:'signup',password:{unexpected:'object'}}),
    }))).rejects.toThrow();
  });

});
