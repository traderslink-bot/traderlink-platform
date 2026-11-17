import type Database from "better-sqlite3";
import type { PartnerAlertCatalogCandidate, PartnerAlertCatalogCheckoutQualifier } from "./partner-alert-catalog-read";
import type { PartnerAlertWhopAccountProof } from "./partner-alert-whop-normalization";
import { normalizePartnerAlertWhopCheckout } from "./partner-alert-whop-normalization";
import { decryptPartnerAlertCredentials, type PartnerAlertCredentialKeys,
  type PartnerAlertEncryptedCredentials } from "./partner-alert-credentials";
import { PARTNER_ALERT_WHOP_API_VERSION, PartnerAlertWhopReadClient,
  type PartnerAlertWhopTransport } from "./partner-alert-whop-client";

export type PartnerAlertCatalogCheckoutContext = Readonly<{
  client: Pick<PartnerAlertWhopReadClient, "retrieveVariant">;
  accountProof: PartnerAlertWhopAccountProof;
  allowConfiguredTrial: boolean;
  maximumEvidenceAgeMs: number;
}>;

export type PartnerAlertCatalogCheckoutBindings = Readonly<{
  /** Resolve/decrypt only after the authenticated page has produced a private
   * candidate and invoked this qualifier. No context may come from the browser. */
  resolve: (candidate: PartnerAlertCatalogCandidate,
    signal: AbortSignal) => Promise<PartnerAlertCatalogCheckoutContext>;
  nowUtc: () => string;
}>;

/** Current plan verification and checkout projection. The injected client is
 * GET-only, follows no redirects and receives the request cancellation signal. */
export function createPartnerAlertCatalogCheckoutQualifier(
  bindings: PartnerAlertCatalogCheckoutBindings,
): PartnerAlertCatalogCheckoutQualifier {
  if (typeof bindings.resolve !== "function" || typeof bindings.nowUtc !== "function") {
    throw new Error("Partner Channel checkout verification is unavailable.");
  }
  return async (candidate, signal) => {
    if (signal.aborted) throw new Error("Partner Channel checkout verification was cancelled.");
    const context = await bindings.resolve(candidate, signal);
    if (signal.aborted || !context || typeof context.client?.retrieveVariant !== "function") {
      throw new Error("Partner Channel checkout verification is unavailable.");
    }
    const native = await context.client.retrieveVariant(candidate.offer.whop.planId, signal);
    if (signal.aborted) throw new Error("Partner Channel checkout verification was cancelled.");
    return normalizePartnerAlertWhopCheckout({ native, offer: candidate.offer,
      accountProof: context.accountProof, allowConfiguredTrial: context.allowConfiguredTrial,
      nowUtc: bindings.nowUtc(), maximumEvidenceAgeMs: context.maximumEvidenceAgeMs });
  };
}

type ConnectionRow = Readonly<{
  community_id: string;
  owner_user_id: string;
  environment: "sandbox" | "live";
  whop_account_id: string;
  owner_user_ref: string;
  encrypted_authorisation_json: string;
  status: string;
  verified_at_utc: string;
  valid_until_utc: string;
}>;

export type PartnerAlertWhopVerificationRuntimeInput = Readonly<{
  database: Database.Database;
  credentialKeys: PartnerAlertCredentialKeys;
  transport: PartnerAlertWhopTransport;
  nowUtc: () => string;
  maximumEvidenceAgeMs: number;
}>;

/** Resolve one exact stored merchant connection. The caller must complete its
 * authenticated private read and provider-plan derivation before invoking this
 * function. The returned client is GET-only and the decrypted credential never
 * leaves this server module. */
export async function resolvePartnerAlertWhopVerificationContext(
  input: PartnerAlertWhopVerificationRuntimeInput,
  offer: PartnerAlertCatalogCandidate["offer"],
  signal: AbortSignal,
): Promise<PartnerAlertCatalogCheckoutContext & Readonly<{ client: PartnerAlertWhopReadClient }>> {
  if (signal.aborted || !input.database.open) {
    throw new Error("Partner Channel checkout verification was cancelled.");
  }
  const at = input.nowUtc();
  const row = input.database.prepare<[string, string, string], ConnectionRow>(`SELECT
  connection.community_id,partner.owner_user_id,connection.environment,connection.whop_account_id,
  connection.owner_user_ref,connection.encrypted_authorisation_json,connection.status,
  connection.verified_at_utc,connection.valid_until_utc
FROM partner_alert_whop_connections connection
JOIN partner_alert_partners partner ON partner.community_id=connection.community_id
WHERE connection.community_id=? AND connection.environment=? AND connection.whop_account_id=?
LIMIT 1`).get(offer.communityId, offer.whop.environment, offer.whop.accountId);
  if (!row || row.community_id !== offer.communityId || row.environment !== offer.whop.environment
    || row.whop_account_id !== offer.whop.accountId || row.status !== "verified"
    || row.verified_at_utc > at || row.valid_until_utc <= at || signal.aborted) {
    throw new Error("Partner Channel checkout verification is unavailable.");
  }
  let encrypted: PartnerAlertEncryptedCredentials;
  try { encrypted = JSON.parse(row.encrypted_authorisation_json) as PartnerAlertEncryptedCredentials; }
  catch { throw new Error("Partner Channel checkout verification is unavailable."); }
  const credentials = decryptPartnerAlertCredentials({ context: { communityId: offer.communityId,
    environment: offer.whop.environment, accountId: offer.whop.accountId, purpose: "community_verification" },
  configuration: input.credentialKeys, encrypted, nowUtc: at });
  if (signal.aborted) throw new Error("Partner Channel checkout verification was cancelled.");
  const client = new PartnerAlertWhopReadClient({ environment: offer.whop.environment,
    apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION, accountId: offer.whop.accountId,
    bearerToken: credentials.accessToken }, input.transport);
  return Object.freeze({ client, allowConfiguredTrial: false,
    maximumEvidenceAgeMs: input.maximumEvidenceAgeMs,
    accountProof: Object.freeze({ communityId: offer.communityId, ownerUserId: row.owner_user_id,
      accountId: offer.whop.accountId, environment: offer.whop.environment, ownerWhopUserRef: row.owner_user_ref,
      observedAtUtc: row.verified_at_utc, validUntilUtc: row.valid_until_utc }) });
}

/** Concrete isolated server binding. Construction and candidate reads perform
 * no provider I/O. The encrypted credential is decrypted only inside an already
 * authenticated candidate qualification and is never returned from the module. */
export function createPartnerAlertCatalogCheckoutRuntime(input: Readonly<{
  database: Database.Database;
  credentialKeys: PartnerAlertCredentialKeys;
  transport: PartnerAlertWhopTransport;
  nowUtc: () => string;
  maximumEvidenceAgeMs: number;
}>): PartnerAlertCatalogCheckoutQualifier {
  if (!input.database.open || !input.database.readonly || typeof input.transport !== "function"
    || typeof input.nowUtc !== "function" || !Number.isSafeInteger(input.maximumEvidenceAgeMs)
    || input.maximumEvidenceAgeMs < 1 || input.maximumEvidenceAgeMs > 86_400_000) {
    throw new Error("Partner Channel checkout verification is unavailable.");
  }
  return createPartnerAlertCatalogCheckoutQualifier({ nowUtc: input.nowUtc,
    resolve: (candidate, signal) => resolvePartnerAlertWhopVerificationContext(input, candidate.offer, signal) });
}
