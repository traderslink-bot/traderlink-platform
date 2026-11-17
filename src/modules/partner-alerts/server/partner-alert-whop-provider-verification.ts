import type { PartnerAlertWhopOfferReceipt } from "./partner-alert-authority";
import { resolvePartnerAlertWhopVerificationContext,
  type PartnerAlertWhopVerificationRuntimeInput } from "./partner-alert-catalog-checkout";
import type { PartnerAlertOfferVerificationTarget } from "./partner-alert-provider-verification";
import { normalizePartnerAlertWhopOffer } from "./partner-alert-whop-normalization";

/** Concrete approval-workflow Whop binding. It reuses the catalog's exact
 * verified merchant connection and GET-only client, but returns no checkout URL.
 * Provider work begins only after the HTTP boundary has authenticated the actor
 * and derived the exact verification plan from the current private revision. */
export function createPartnerAlertWhopOfferVerifier(input: PartnerAlertWhopVerificationRuntimeInput) {
  if (!input.database.open || typeof input.transport !== "function" || typeof input.nowUtc !== "function"
    || !Number.isSafeInteger(input.maximumEvidenceAgeMs) || input.maximumEvidenceAgeMs < 1
    || input.maximumEvidenceAgeMs > 86_400_000) {
    throw new Error("Partner Channel Whop verification is unavailable.");
  }
  return async (target: PartnerAlertOfferVerificationTarget,
    signal: AbortSignal): Promise<PartnerAlertWhopOfferReceipt> => {
    if (target.communityId !== target.offer.communityId) {
      throw new Error("Partner Channel Whop verification is unavailable.");
    }
    const context = await resolvePartnerAlertWhopVerificationContext(input, target.offer, signal);
    if (signal.aborted) throw new Error("Partner Channel Whop verification was cancelled.");
    const native = await context.client.retrieveVariant(target.offer.whop.planId, signal);
    if (signal.aborted) throw new Error("Partner Channel Whop verification was cancelled.");
    return normalizePartnerAlertWhopOffer({ native, offer: target.offer,
      accountProof: context.accountProof, allowConfiguredTrial: context.allowConfiguredTrial,
      nowUtc: input.nowUtc(), maximumEvidenceAgeMs: context.maximumEvidenceAgeMs });
  };
}
