// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { deliverPlatformLoginMail, renderPlatformLoginMail } from "./platform-login-email";

const environment: NodeJS.ProcessEnv = { NODE_ENV: "test", RESEND_API_KEY: "synthetic-key", TRADERLINK_LOGIN_EMAIL_FROM: "login@example.test" };
describe("authentication mail transport contract", () => {
  it("uses the requested branded verification template and adapts existing-account wording", () => {
    const mail = { email: "member@example.test", origin: "https://login.example.test", purpose: "verify" as const, token: 'synthetic<"&token' };
    const signup = renderPlatformLoginMail(mail);
    expect(signup.html).toContain("Thanks for signing up for <strong>TradersLink</strong>!");
    expect(signup.html).toContain("activate your account and get started");
    expect(signup.html).toContain("If you didn’t create an account with TradersLink");
    expect(signup.html).not.toContain(mail.token);
    const linked = renderPlatformLoginMail({ ...mail, verificationContext: "add-email" });
    expect(linked.html).toContain("finish adding email sign-in");
    expect(linked.html).not.toContain("activate your account");
    expect(linked.text).toContain("If you didn’t request email sign-in");
  });
  it.each(["verify", "reset", "change-email"] as const)("keeps %s proof in a fragment and retries with a stable delivery identity", async purpose => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 202 }));
    const mail = { email: "member@example.test", origin: "https://login.example.test", purpose,
      token: "synthetic-token", deliveryId: "synthetic-delivery" };
    await deliverPlatformLoginMail(mail, fetcher, environment);
    await deliverPlatformLoginMail(mail, fetcher, environment);
    for (const [destination, init] of fetcher.mock.calls) {
      expect(destination).toBe("https://api.resend.com/emails");
      expect(new Headers(init?.headers).get("idempotency-key")).toBe(mail.deliveryId);
      const payload = JSON.parse(String(init?.body));
      const link = new URL(payload.text.match(/https:\/\/[^\s]+/)![0].replace(/\.$/, ""));
      expect(link.pathname).toBe(`/login/${purpose}`);
      expect(link.search).toBe("");
      expect(new URLSearchParams(link.hash.slice(1)).get("token")).toBe(mail.token);
      expect(payload.to).toEqual([mail.email]);
      expect(payload.html).toContain(purpose === "reset" ? "Reset Password" : "Confirm Email Address");
      expect(payload.html).toContain(`href="${link.href.replace(/&/g, "&amp;")}"`);
      expect(payload.html).toContain("copy and paste this link into your browser");
      expect(payload.html).toContain("— TradersLink");
    }
  });
  it("rejects missing sender configuration without contacting the provider and surfaces provider failure", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }));
    const mail = { email: "member@example.test", origin: "https://login.example.test", purpose: "changed" as const };
    await expect(deliverPlatformLoginMail(mail, fetcher, { NODE_ENV: "test" })).rejects.toThrow("not configured");
    expect(fetcher).not.toHaveBeenCalled();
    await expect(deliverPlatformLoginMail(mail, fetcher, environment)).rejects.toThrow("could not send");
  });
});
