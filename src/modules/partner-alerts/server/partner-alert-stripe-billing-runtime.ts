import "server-only";

import { requirePartnerAlertStripeKey } from "./partner-alert-stripe-onboarding";
import { stripeSandboxCredentials } from "./partner-alert-stripe-onboarding-runtime";
import { readPartnerAlertIsolatedStaging } from "./partner-alert-isolated-staging";
import type { PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";

type StripeBillingConfiguration = Readonly<{
  environment: PartnerAlertEnvironment;
  origin: string;
  key: string;
  signingSecret: string;
  clientId?: string;
}>;

export function readPartnerAlertStripeBillingConfiguration(): StripeBillingConfiguration | null {
  const env = process.env;
  const staging = readPartnerAlertIsolatedStaging(env);
  const sandbox = stripeSandboxCredentials();
  if (sandbox) {
    const signingSecret = env.PARTNER_STRIPE_NATIVE_SANDBOX_SIGNING_SECRET;
    return signingSecret && /^whsec_[A-Za-z0-9_]+$/u.test(signingSecret)
      ? { key: sandbox.key, clientId: sandbox.clientId, origin: sandbox.origin, environment: "sandbox", signingSecret } : null;
  }
  if (staging) return null;
  if (env.NODE_ENV !== "production" || env.PARTNER_STRIPE_NATIVE_LIVE_ENABLED !== "true") return null;

  const origin = env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN;
  const key = env.PARTNER_STRIPE_NATIVE_LIVE_SECRET_KEY;
  const signingSecret = env.PARTNER_STRIPE_NATIVE_LIVE_SIGNING_SECRET;
  const clientId = env.PARTNER_STRIPE_NATIVE_LIVE_CONNECT_CLIENT;
  if (!origin || !key || !signingSecret || !/^whsec_[A-Za-z0-9_]+$/u.test(signingSecret)
    || (clientId !== undefined && !/^ca_[A-Za-z0-9]+$/u.test(clientId))) return null;
  try {
    const configured = new URL(origin);
    if (configured.protocol !== "https:" || configured.origin !== origin) return null;
    requirePartnerAlertStripeKey(key, "live");
    return { environment: "live", origin, key, signingSecret, clientId };
  } catch { return null; }
}
