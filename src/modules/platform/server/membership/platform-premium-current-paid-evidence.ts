import { premiumFresh, premiumInteger, premiumRef, premiumUtc, samePremiumPurchase, validatePremiumPurchase,
  type PlatformPremiumPaidEvidence, type PlatformPremiumPurchase } from "../../contracts/platform-premium-access";
import { readStoredPlatformPremiumWhopCurrentAccess, type PlatformPremiumNativeCurrentAccessCollection } from "./platform-premium-whop-current-access";

/** Shape is not origin qualification. Caller must consume this through the real
 * current-ticket authority reader after admitted receipt persistence. */
export function preparePlatformPremiumCurrentPaidEvidence(input: PlatformPremiumNativeCurrentAccessCollection,
  expected: PlatformPremiumPurchase, nowUtc: string, maximumEvidenceAgeMs: number): PlatformPremiumPaidEvidence {
  return preparePlatformPremiumCurrentPaidEvidenceInRealm(input, expected, nowUtc, maximumEvidenceAgeMs, "live");
}
/** @internal Server normalization only; never issuer/payment authority. Sandbox
 * callers must validate the actual opaque runtime authority and original ticket. */
export function preparePlatformPremiumCurrentPaidEvidenceInRealm(input: PlatformPremiumNativeCurrentAccessCollection,
  expected: PlatformPremiumPurchase, nowUtc: string, maximumEvidenceAgeMs: number, realm: "live" | "sandbox"): PlatformPremiumPaidEvidence {
  const at = premiumUtc(nowUtc), age = premiumInteger(maximumEvidenceAgeMs, 1, 86_400_000);
  const unknown = (reason: "incomplete" | "unqualified_coverage" | "scope_mismatch" | "conflicting_facts"): PlatformPremiumPaidEvidence =>
    Object.freeze({ kind: "unknown", basis: "current_provider_access", purchase: expected, observedAtUtc: at,
      validUntilUtc: new Date(Date.parse(at) + age).toISOString(), reason });
  try {
    validatePremiumPurchase(expected);
    if (!["live","sandbox"].includes(realm) || expected.environment !== realm) return unknown("unqualified_coverage");
    const c = readStoredPlatformPremiumWhopCurrentAccess(input);
    if (!c) return unknown("unqualified_coverage");
    const p = c.purchase, offer = p.offer;
    const purchase = { environment: offer.environment, accountId: offer.accountId, productId: offer.productId,
      planId: offer.planId, whopUserId: p.payer.whopUserId };
    if (!samePremiumPurchase(purchase, expected)) return unknown("scope_mismatch");
    const until = [c.validUntilUtc, new Date(Date.parse(c.observedAtUtc) + age).toISOString()].sort()[0]!;
    if (c.discovery !== "complete" || !premiumFresh(c.observedAtUtc, until, at)) return unknown("incomplete");
    const memberships: { membershipRef: string; paymentRef: string }[] = [];
    let uncertain = false, invalidated = false;
    // Exclusive product attribution is possible only when every potentially
    // access-producing sibling is the qualified paid subscription scope.
    const exclusive = c.members.every(member => member.productAccess === "absent"
      || (member.accessKind === "paid_membership" && member.attribution !== "ambiguous"
        && ["active", "past_due"].includes(member.nativeStatus) && member.paidBasis?.settlement === "settled"
        && BigInt(member.paidBasis.amountMinor) > BigInt(0) && member.paidBasis.refund === "none" && member.paidBasis.dispute === "none"));
    for (const member of c.members) {
      premiumRef(member.membershipRef);
      if (member.productAccess === "absent") continue;
      if (member.accessKind === "trial" || member.accessKind === "free") continue;
      if (member.accessKind !== "paid_membership" || member.productAccess !== "customer"
        || member.attribution === "ambiguous" || (member.attribution === "exclusive_paid_scope" && !exclusive)
        || !["active", "past_due"].includes(member.nativeStatus)) { uncertain = true; continue; }
      const basis = member.paidBasis;
      if (!basis || basis.settlement === "unknown" || basis.refund === "unknown" || basis.dispute === "unknown") {
        uncertain = true; continue;
      }
      if (basis.refund === "invalidating" || basis.dispute === "invalidating") { invalidated = true; continue; }
      if (basis.settlement !== "settled" || BigInt(basis.amountMinor) <= BigInt(0)) continue;
      memberships.push({ membershipRef: member.membershipRef, paymentRef: basis.paymentRef });
    }
    // A separately attributed genuine paid membership survives an unrelated
    // sibling; ambiguous product-level access never manufactures attribution.
    if (memberships.length) return Object.freeze({ kind: "current_paid_access", purchase: expected,
      observedAtUtc: c.observedAtUtc, validUntilUtc: until, memberships: Object.freeze(memberships.map(member => Object.freeze(member))) });
    if (uncertain) return unknown("incomplete");
    return Object.freeze({ kind: "not_paid", basis: "current_provider_access", purchase: expected,
      observedAtUtc: c.observedAtUtc, validUntilUtc: until, reason: invalidated ? "invalidated" : "no_current_provider_access" });
  } catch { return unknown("unqualified_coverage"); }
}
