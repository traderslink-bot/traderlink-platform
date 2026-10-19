/** Configuration presence only; this is not evidence of a live provider connection. */
export function membershipPrivateStripeTestCheckoutAllowed(
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  // This exception belongs only to the designated staging lane. Never infer it
  // from NODE_ENV: staging and production both run production-mode Next.js.
  return env.RAILWAY_ENVIRONMENT_ID === "9e079dd4-f3f3-4872-9b00-adbd3000c485" &&
    env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN === "https://traderlink-platform-staging-staging.up.railway.app" &&
    /^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY ?? "") &&
    Boolean(env.STRIPE_MEMBERSHIP_WEBHOOK_SECRET);
}

/** Configuration presence only; this is not evidence of a live provider connection. */
export function membershipWhopConfiguration(env: Readonly<Record<string, string | undefined>> = process.env) {
  const webhook = Boolean(env.WHOP_MEMBERSHIP_WEBHOOK_SECRET);
  const renewalApi = Boolean(env.WHOP_API_KEY);
  const identity = Boolean(env.WHOP_COMPANY_ID && env.TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY && env.WHOP_API_VERSION_DATE);
  return { webhook, renewalApi, identity, automaticConfirmation: webhook && renewalApi && identity };
}
