import "server-only";

import { openPartnerAlertStripeSandboxLedger } from "./partner-alert-stripe-billing-store";
import { createPartnerAlertStripeAccountClient, createPartnerAlertStripeOnboarding, partnerStripeSellerStatus,
  requirePartnerAlertStripeKey } from "./partner-alert-stripe-onboarding";
import { readPartnerAlertIsolatedStaging } from "./partner-alert-isolated-staging";

import { createPartnerAlertStripeOAuth } from "./partner-alert-stripe-oauth";

export function stripeSandboxCredentials() {
  const { NODE_ENV, TRADERLINK_PAID_OWNER_PREVIEW, TRADERLINK_PLATFORM_PUBLIC_ORIGIN: origin,
    PARTNER_STRIPE_ONBOARDING_SANDBOX_OAUTH_CLIENT: clientId, PARTNER_STRIPE_ONBOARDING_SANDBOX_KEY: key, PARTNER_STRIPE_ONBOARDING_SANDBOX_DIRECTORY: directory } = process.env;
  const staging = readPartnerAlertIsolatedStaging();
  if (staging) {
    if (!key) return null;
    requirePartnerAlertStripeKey(key, "sandbox");
    if (clientId !== undefined && !/^ca_[A-Za-z0-9]+$/u.test(clientId)) throw new Error("Stripe sandbox Connect client required.");
    return { origin: staging.origin, key, directory, clientId };
  }
  if (NODE_ENV !== "development" || TRADERLINK_PAID_OWNER_PREVIEW !== "1"
    || origin !== "http://127.0.0.1:3039" || !key) return null;
  return { origin, key, directory, clientId: clientId && /^ca_[A-Za-z0-9]+$/u.test(clientId) ? clientId : undefined };
}

export function stripeOnboardingConfiguration() {
  const sandbox = stripeSandboxCredentials();
  return sandbox?.directory ? { ...sandbox, directory: sandbox.directory } : null;
}

export async function withStripeOnboarding<T>(
  configuration: NonNullable<ReturnType<typeof stripeOnboardingConfiguration>>,
  operation: (service: ReturnType<typeof createPartnerAlertStripeOnboarding>, oauth?: ReturnType<typeof createPartnerAlertStripeOAuth>) => Promise<T>,
) {
  const db = openPartnerAlertStripeSandboxLedger(configuration.directory);
  try {
    const stripe = createPartnerAlertStripeAccountClient(configuration.key);
    const service = createPartnerAlertStripeOnboarding(db, stripe);
    const oauth = configuration.clientId ? createPartnerAlertStripeOAuth(db, {
      ...configuration, clientId: configuration.clientId,
      async verifyAccount(account) {
        if (partnerStripeSellerStatus(await stripe(`accounts/${account}`), account) !== "ready") {
          throw new Error("Stripe account must support payments and payouts.");
        }
      },
    }) : undefined;
    return await operation(service, oauth);
  } finally {
    db.close();
  }
}
