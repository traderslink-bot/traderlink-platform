import type { PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import type { PartnerAlertCredentialKeys } from "./partner-alert-credentials";
import { readPartnerAlertIsolatedStaging } from "./partner-alert-isolated-staging";

export type PartnerAlertCatalogRuntimeConfiguration = Readonly<{
  credentialKeys: PartnerAlertCredentialKeys;
  maximumEvidenceAgeMs: number;
}>;

const VERSION = /^[A-Za-z0-9_-]{1,64}$/u;

/** Disabled unless every server-only value is explicit and valid. Reading this
 * configuration performs no database, credential decryption or provider I/O. */
export function readPartnerAlertCatalogRuntimeConfiguration(
  environment: NodeJS.ProcessEnv,
): PartnerAlertCatalogRuntimeConfiguration | null {
  return environment.PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED === "true" ? readPartnerAlertWhopCredentialConfiguration(environment) : null;
}

/** Existing-buyer verification may use Whop sandbox only in the private Stripe sandbox. */
export function resolvePartnerAlertWhopReadEnvironment(
  stripeEnvironment: PartnerAlertEnvironment | undefined,
  environment: NodeJS.ProcessEnv = process.env,
): PartnerAlertEnvironment {
  if (readPartnerAlertIsolatedStaging(environment)) {
    if (stripeEnvironment !== "sandbox") throw new Error("Paid staging sandbox billing is unavailable.");
    return "sandbox";
  }
  return stripeEnvironment === "sandbox" && environment.NODE_ENV === "development"
    && environment.TRADERLINK_PAID_OWNER_PREVIEW === "1" && environment.PARTNER_ALERT_WHOP_READ_ENVIRONMENT === "sandbox"
    && environment.PARTNER_STRIPE_DISCORD_GUILD_ID !== undefined
    && environment.PARTNER_STRIPE_DISCORD_GUILD_ID === environment.DISCORD_GUILD_ID ? "sandbox" : "live";
}

/** Shared credential parser for reads that do not offer checkout. */
export function readPartnerAlertWhopCredentialConfiguration(
  environment: NodeJS.ProcessEnv,
): PartnerAlertCatalogRuntimeConfiguration | null {
  const activeKeyVersion = environment.PARTNER_ALERT_WHOP_CREDENTIAL_ACTIVE_KEY_VERSION;
  const encodedKeys = environment.PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON;
  const encodedAge = environment.PARTNER_ALERT_WHOP_EVIDENCE_MAX_AGE_MS;
  if (!activeKeyVersion || !VERSION.test(activeKeyVersion) || !encodedKeys
    || !encodedAge || !/^[1-9][0-9]{0,7}$/u.test(encodedAge)) return null;
  let raw: unknown;
  try { raw = JSON.parse(encodedKeys); } catch { return null; }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const entries = Object.entries(raw);
  if (entries.length < 1 || entries.length > 8) return null;
  const keys = entries.map(([version, value]) => {
    if (!VERSION.test(version) || typeof value !== "string" || value.length !== 44) return null;
    const decoded = Buffer.from(value, "base64");
    if (decoded.length !== 32 || decoded.toString("base64") !== value) return null;
    return [version, value] as const;
  });
  if (keys.some(value => value === null)) return null;
  const keysBase64 = Object.freeze(Object.fromEntries(keys as readonly (readonly [string, string])[]));
  if (!Object.hasOwn(keysBase64, activeKeyVersion)) return null;
  const maximumEvidenceAgeMs = Number(encodedAge);
  if (!Number.isSafeInteger(maximumEvidenceAgeMs) || maximumEvidenceAgeMs < 1
    || maximumEvidenceAgeMs > 300_000) return null;
  return Object.freeze({ credentialKeys: Object.freeze({ activeKeyVersion, keysBase64 }), maximumEvidenceAgeMs });
}
