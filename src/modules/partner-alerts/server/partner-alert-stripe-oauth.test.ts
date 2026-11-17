// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import { createPartnerAlertStripeOAuth } from "./partner-alert-stripe-oauth";
import { createPartnerAlertStripeOnboarding } from "./partner-alert-stripe-onboarding";

it("binds an existing sandbox seller only after an owner-bound, one-time OAuth exchange", async () => {
  const db = new Database(":memory:");
  const onboarding = createPartnerAlertStripeOnboarding(db, async () => { throw new Error("No new seller expected."); });
  const verifyAccount = vi.fn(async () => {});
  const transport = vi.fn<typeof fetch>(async (url, options) => {
    expect(String(url)).toBe("https://connect.stripe.com/oauth/token");
    expect(new Headers(options?.headers).get("Authorization")).toBe(`Basic ${Buffer.from("sk_test_fixture:").toString("base64")}`);
    expect(String(options?.body)).toBe("grant_type=authorization_code&code=ac_fixture");
    return Response.json({ stripe_user_id: "acct_existing", scope: "read_write", livemode: false, access_token: "ignored" });
  });
  let now = 100;
  const origin = "http://127.0.0.1:3039";
  try {
    const oauth = createPartnerAlertStripeOAuth(db, { clientId: "ca_fixture", key: "sk_test_fixture", origin, verifyAccount, transport, nowMs: () => now });
    const url = new URL(oauth.start("community", "owner", "northstar"));
    const state = url.searchParams.get("state")!;
    const owns = (id: string, slug: string) => id === "community" && slug === "northstar";
    expect(url.origin).toBe("https://connect.stripe.com");
    expect(url.searchParams.get("redirect_uri")).toBe(`${origin}/api/partner-channels/stripe-sandbox/connect/callback`);
    expect(await oauth.finish(state, "ac_fixture", "other-user", owns)).toBeNull();
    expect(await oauth.finish(state, "ac_fixture", "owner", () => false)).toBeNull();
    const authorize = vi.fn(async (id: string) => id === "community");
    const save = vi.fn(async (id: string, account: string) => {
      expect(onboarding.sellerAccount("community", "owner")).toBeNull();
      return id === "community" && account === "acct_existing";
    });
    expect(await oauth.finish(state, "ac_fixture", "owner", owns, { authorize, save }))
      .toBe(`${origin}/communities/northstar/partner-channels`);
    expect(authorize).toHaveBeenCalledExactlyOnceWith("community");
    expect(save).toHaveBeenCalledExactlyOnceWith("community", "acct_existing");
    expect(onboarding.sellerAccount("community", "owner")).toBe("acct_existing");
    expect(verifyAccount).toHaveBeenCalledWith("acct_existing");
    expect(await oauth.finish(state, "ac_fixture", "owner", owns)).toBeNull();
    const expired = new URL(oauth.start("another", "owner", "different")).searchParams.get("state")!;
    now += 10 * 60_000;
    expect(await oauth.finish(expired, "ac_fixture", "owner", () => true)).toBeNull();
    expect(transport).toHaveBeenCalledTimes(1);
  } finally { db.close(); }
});
