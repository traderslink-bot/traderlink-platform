import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { partnerAlertRecord } from "../contracts/partner-alert-validation";
import type { PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";

type StripeAccountRequest = (path: string, data?: object, idempotencyKey?: string) => Promise<Record<string, unknown>>;
export type PartnerStripeSellerStatus = "unconnected" | "setup_required" | "in_review" | "ready" | "unavailable";

export function requirePartnerAlertStripeKey(key: string, environment: PartnerAlertEnvironment): void {
  const pattern = environment === "live" ? /^(?:sk|rk)_live_[A-Za-z0-9_]+$/u : /^(?:sk|rk)_test_[A-Za-z0-9_]+$/u;
  if (!pattern.test(key)) throw new Error(`Stripe ${environment} key required.`);
}

export function createPartnerAlertStripeAccountClient(key: string, transport: typeof fetch = fetch,
  environment: PartnerAlertEnvironment = "sandbox"): StripeAccountRequest {
  requirePartnerAlertStripeKey(key, environment);
  const livemode = environment === "live";
  return async (path, data, idempotencyKey) => {
    if (!/^(accounts(?:\/acct_[A-Za-z0-9]+)?|account_links)$/u.test(path)) throw new Error("Unexpected Stripe account endpoint.");
    const url = new URL(`https://api.stripe.com/v2/core/${path}`);
    if (!data) {
      url.searchParams.set("include[0]", "configuration.merchant");
      url.searchParams.set("include[1]", "defaults");
    }
    const response = await transport(url, {
      method: data ? "POST" : "GET", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${key}`, "Stripe-Version": "2026-10-28.endive",
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!data && /^accounts\/acct_[A-Za-z0-9]+$/u.test(path) && (response.status === 400 || response.status === 404)) {
      await response.body?.cancel();
      const legacy = await transport(new URL(`https://api.stripe.com/v1/${path}`), {
        method: "GET", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000),
        headers: { Authorization: `Bearer ${key}`, "Stripe-Version": "2026-10-28.endive" },
      });
      if (!legacy.ok) throw new Error("Stripe account request failed.");
      const account = partnerAlertRecord(await legacy.json(), "legacyStripeAccount");
      const controller = partnerAlertRecord(account.controller, "legacyStripeController");
      const fees = partnerAlertRecord(controller.fees, "legacyStripeFees");
      const losses = partnerAlertRecord(controller.losses, "legacyStripeLosses");
      const dashboard = partnerAlertRecord(controller.stripe_dashboard, "legacyStripeDashboard");
      const capabilities = partnerAlertRecord(account.capabilities, "legacyStripeCapabilities");
      if (account.object !== "account" || account.id !== path.slice("accounts/".length)
        || (account.livemode !== undefined && account.livemode !== livemode)
        || dashboard.type !== "full" || controller.requirement_collection !== "stripe"
        || fees.payer !== "account" || losses.payments !== "stripe") throw new Error("Unverified Stripe Standard seller.");
      return {
        id: account.id, livemode, dashboard: "full",
        defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe", requirements_collector: "stripe" } },
        configuration: { merchant: { capabilities: {
          card_payments: { status: account.charges_enabled === true ? capabilities.card_payments : "restricted" },
          stripe_balance: { payouts: { status: account.payouts_enabled === true ? "active" : "restricted" } },
        } } },
      };
    }
    if (!response.ok) throw new Error("Stripe account request failed.");
    const result = partnerAlertRecord(await response.json(), "stripeAccountResult");
    if (result.livemode !== livemode) throw new Error("Stripe account mode changed.");
    return result;
  };
}

export function partnerStripeSellerStatus(seller: Record<string, unknown>, expectedId: string,
  environment: PartnerAlertEnvironment = "sandbox"): PartnerStripeSellerStatus {
  const defaults = partnerAlertRecord(seller.defaults, "sellerDefaults");
  const rules = partnerAlertRecord(defaults.responsibilities, "sellerResponsibilities");
  if (seller.id !== expectedId || seller.livemode !== (environment === "live") || seller.dashboard !== "full"
    || rules.fees_collector !== "stripe" || rules.losses_collector !== "stripe" || rules.requirements_collector !== "stripe") {
    throw new Error("Unexpected seller account configuration.");
  }
  const config = partnerAlertRecord(seller.configuration, "sellerConfiguration");
  const merchant = partnerAlertRecord(config.merchant, "sellerMerchant");
  const capabilities = partnerAlertRecord(merchant.capabilities, "sellerCapabilities");
  const cards = partnerAlertRecord(capabilities.card_payments, "sellerCards");
  const payouts = partnerAlertRecord(partnerAlertRecord(capabilities.stripe_balance, "sellerBalance").payouts, "sellerPayouts");
  if (cards.status === "active" && payouts.status === "active") return "ready";
  return cards.status === "pending" || payouts.status === "pending" ? "in_review" : "setup_required";
}

export async function createPartnerAlertStripeHostedSeller(stripe: StripeAccountRequest, country: string,
  requestId: string, environment: PartnerAlertEnvironment = "sandbox"): Promise<string> {
  const created = await stripe("accounts", {
    identity: { country },
    dashboard: "full",
    defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
    configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
  }, `partner-seller-${requestId}`);
  if (created.livemode !== (environment === "live") || typeof created.id !== "string" || !/^acct_[A-Za-z0-9]+$/u.test(created.id)) {
    throw new Error("Stripe account identity missing.");
  }
  return created.id;
}

export async function openPartnerAlertStripeOnboardingLink(stripe: StripeAccountRequest, account: string,
  returnUrl: string, refreshUrl: string, stillOwner: () => boolean, environment: PartnerAlertEnvironment = "sandbox"): Promise<string> {
  if (!stillOwner()) throw new Error("Community owner changed.");
  const link = await stripe("account_links", {
    account,
    use_case: { type: "account_onboarding", account_onboarding: { return_url: returnUrl, refresh_url: refreshUrl } },
  });
  const url = new URL(String(link.url));
  if (!stillOwner() || link.account !== account || link.livemode !== (environment === "live") || url.protocol !== "https:"
    || !["accounts.stripe.com", "connect.stripe.com"].includes(url.hostname)
    || url.port || url.username || url.password) throw new Error("Invalid Stripe onboarding link.");
  return url.href;
}

type SellerBinding = { owner_id: string; request_id: string; country: string; account_id: string | null };

export function createPartnerAlertStripeOnboarding(db: Database.Database, stripe: StripeAccountRequest) {
  db.exec(`CREATE TABLE IF NOT EXISTS qa_partner_stripe_sellers (
    community_id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, request_id TEXT NOT NULL UNIQUE, country TEXT NOT NULL,
    account_id TEXT UNIQUE
  ) STRICT`);
  const read = (communityId: string) => db.prepare("SELECT owner_id,request_id,country,account_id FROM qa_partner_stripe_sellers WHERE community_id=?")
    .get(communityId) as SellerBinding | undefined;
  const sellerAccount = (communityId: string, ownerId: string) => {
    const binding = read(communityId);
    if (binding && binding.owner_id !== ownerId) throw new Error("Stripe seller owner changed.");
    return binding?.account_id ?? null;
  };
  const status = async (communityId: string, ownerId: string): Promise<PartnerStripeSellerStatus> => {
    const account = sellerAccount(communityId, ownerId);
    if (!account) return "unconnected";
    return partnerStripeSellerStatus(await stripe(`accounts/${account}`), account);
  };

  return {
    status, sellerAccount,
    async start(communityId: string, ownerId: string, country: string, returnUrl: string, refreshUrl: string,
      stillOwner: () => boolean, bindVerifiedAccount?: (account: string) => Promise<void>) {
      if (!stillOwner()) throw new Error("Community owner required.");
      let binding = read(communityId);
      if (!binding) {
        if (!/^[A-Z]{2}$/u.test(country)) throw new Error("Country code required.");
        db.prepare("INSERT INTO qa_partner_stripe_sellers VALUES(?,?,?,?,NULL) ON CONFLICT(community_id) DO NOTHING")
          .run(communityId, ownerId, randomUUID(), country);
        binding = read(communityId)!;
      }
      let account = sellerAccount(communityId, ownerId);
      if (!account) {
        account = await createPartnerAlertStripeHostedSeller(stripe, binding.country, binding.request_id);
        db.prepare("UPDATE qa_partner_stripe_sellers SET account_id=? WHERE community_id=? AND account_id IS NULL")
          .run(account, communityId);
        if (read(communityId)?.account_id !== account) throw new Error("Stripe seller binding changed.");
      }
      if (!stillOwner()) throw new Error("Community owner changed.");
      const current = partnerStripeSellerStatus(await stripe(`accounts/${account}`), account);
      await bindVerifiedAccount?.(account);
      if (current === "ready" || current === "in_review") return null;
      return openPartnerAlertStripeOnboardingLink(stripe, account, returnUrl, refreshUrl, stillOwner);
    },
  };
}
