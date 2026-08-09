const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export type WhopAiReviewConfigurationHealth = Readonly<{
  apiKeyConfigured: boolean;
  webhookConfigured: boolean;
  oauthConfigured: boolean;
  identityProtectionConfigured: boolean;
  companyConfigured: boolean;
  productConfigured: boolean;
  checkoutConfigured: boolean;
  billingPortalConfigured: boolean;
  apiVersionDate: string | null;
  readyForEntitlement: boolean;
  readyForReconciliation: boolean;
  readyForLaunch: boolean;
}>;

export type WhopAiReviewEntitlementConfiguration = Readonly<{
  webhookSecret: string;
  companyId: string;
  productIds: ReadonlySet<string>;
  identityHmacKey: string;
  apiVersionDate: string;
}>;

export type WhopAiReviewOAuthConfiguration = Readonly<{
  clientId: string;
  redirectUri: string;
  companyId: string;
  identityHmacKey: string;
}>;

export type WhopAiReviewReconciliationConfiguration = Readonly<{
  apiKey: string;
  companyId: string;
  productIds: ReadonlySet<string>;
  identityHmacKey: string;
  apiVersionDate: string;
}>;

function value(environment: NodeJS.ProcessEnv, name: string): string | null {
  return environment[name]?.trim() || null;
}

function httpsUrl(environment: NodeJS.ProcessEnv, name: string): string | null {
  const candidate = value(environment, name);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function products(environment: NodeJS.ProcessEnv): readonly string[] {
  return Object.freeze((value(environment, "WHOP_AI_REVIEWS_PRODUCT_IDS") ?? "")
    .split(",").map((item) => item.trim()).filter(Boolean));
}

export function readWhopAiReviewConfigurationHealth(
  environment: NodeJS.ProcessEnv = process.env,
): WhopAiReviewConfigurationHealth {
  const apiVersionDate = value(environment, "WHOP_API_VERSION_DATE");
  const webhookConfigured = Boolean(value(environment, "WHOP_WEBHOOK_SECRET"));
  const oauthConfigured = Boolean(value(environment, "WHOP_OAUTH_CLIENT_ID") &&
    httpsUrl(environment, "WHOP_OAUTH_REDIRECT_URI"));
  const identityProtectionConfigured = Boolean(
    (value(environment, "TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY")?.length ?? 0) >= 32,
  );
  const companyConfigured = Boolean(value(environment, "WHOP_COMPANY_ID"));
  const productConfigured = products(environment).length > 0;
  const versionConfigured = Boolean(apiVersionDate && DATE_PATTERN.test(apiVersionDate));
  const readyForEntitlement = webhookConfigured && oauthConfigured &&
    identityProtectionConfigured && companyConfigured && productConfigured && versionConfigured;
  const readyForReconciliation = Boolean(value(environment, "WHOP_API_KEY")) &&
    identityProtectionConfigured && companyConfigured && productConfigured && versionConfigured;
  return Object.freeze({
    apiKeyConfigured: Boolean(value(environment, "WHOP_API_KEY")),
    webhookConfigured,
    oauthConfigured,
    identityProtectionConfigured,
    companyConfigured,
    productConfigured,
    checkoutConfigured: Boolean(httpsUrl(environment, "WHOP_AI_REVIEWS_CHECKOUT_URL")),
    billingPortalConfigured: Boolean(httpsUrl(environment, "WHOP_BILLING_PORTAL_URL")),
    apiVersionDate: versionConfigured ? apiVersionDate : null,
    readyForEntitlement,
    readyForReconciliation,
    readyForLaunch: readyForEntitlement && Boolean(value(environment, "WHOP_API_KEY")) &&
      Boolean(httpsUrl(environment, "WHOP_AI_REVIEWS_CHECKOUT_URL")) &&
      Boolean(httpsUrl(environment, "WHOP_BILLING_PORTAL_URL")),
  });
}

export function loadWhopAiReviewEntitlementConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): WhopAiReviewEntitlementConfiguration {
  const health = readWhopAiReviewConfigurationHealth(environment);
  if (!health.readyForEntitlement) throw new Error("TRADERLINK_WHOP_CONFIGURATION_INVALID");
  return Object.freeze({
    webhookSecret: value(environment, "WHOP_WEBHOOK_SECRET") as string,
    companyId: value(environment, "WHOP_COMPANY_ID") as string,
    productIds: new Set(products(environment)),
    identityHmacKey: value(environment,
      "TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY") as string,
    apiVersionDate: health.apiVersionDate as string,
  });
}

export function loadWhopAiReviewOAuthConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): WhopAiReviewOAuthConfiguration {
  const health = readWhopAiReviewConfigurationHealth(environment);
  if (!health.readyForEntitlement) throw new Error("TRADERLINK_WHOP_CONFIGURATION_INVALID");
  return Object.freeze({
    clientId: value(environment, "WHOP_OAUTH_CLIENT_ID") as string,
    redirectUri: httpsUrl(environment, "WHOP_OAUTH_REDIRECT_URI") as string,
    companyId: value(environment, "WHOP_COMPANY_ID") as string,
    identityHmacKey: value(environment,
      "TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY") as string,
  });
}

export function loadWhopAiReviewReconciliationConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): WhopAiReviewReconciliationConfiguration {
  const health = readWhopAiReviewConfigurationHealth(environment);
  if (!health.apiKeyConfigured || !health.identityProtectionConfigured ||
      !health.companyConfigured || !health.productConfigured || !health.apiVersionDate) {
    throw new Error("TRADERLINK_WHOP_RECONCILIATION_CONFIGURATION_INVALID");
  }
  return Object.freeze({
    apiKey: value(environment, "WHOP_API_KEY") as string,
    companyId: value(environment, "WHOP_COMPANY_ID") as string,
    productIds: new Set(products(environment)),
    identityHmacKey: value(environment,
      "TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY") as string,
    apiVersionDate: health.apiVersionDate,
  });
}

export function readWhopAiReviewCustomerUrls(
  environment: NodeJS.ProcessEnv = process.env,
): Readonly<{ checkoutUrl: string | null; billingPortalUrl: string | null }> {
  return Object.freeze({
    checkoutUrl: httpsUrl(environment, "WHOP_AI_REVIEWS_CHECKOUT_URL"),
    billingPortalUrl: httpsUrl(environment, "WHOP_BILLING_PORTAL_URL"),
  });
}
