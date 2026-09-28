/** Configuration presence only; this is not evidence of a live provider connection. */
export function membershipWhopConfiguration(env: Readonly<Record<string, string | undefined>> = process.env) {
  const webhook = Boolean(env.WHOP_MEMBERSHIP_WEBHOOK_SECRET);
  const renewalApi = Boolean(env.WHOP_API_KEY);
  const identity = Boolean(env.WHOP_COMPANY_ID && env.TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY && env.WHOP_API_VERSION_DATE);
  return { webhook, renewalApi, identity, automaticConfirmation: webhook && renewalApi && identity };
}
