import { createHash } from "node:crypto";
import { premiumOffer, premiumRef, premiumUtc } from "../../contracts/platform-premium-access";
import type { PlatformPremiumNativePurchase, PlatformPremiumQualifiedWhopDecoder } from "./platform-premium-whop-native";

/** Current provider access is a separate fact, never a synthesized billing period.
 * The qualified decoder must prove the no-trial recurring subscription variant,
 * exact payment/identity/merchant relations and complete same-product discovery. */
export type PlatformPremiumNativeCurrentAccessCollection = Readonly<{
  protocol: "platform_premium_current_paid_access_v1";
  purchase: PlatformPremiumNativePurchase;
  discovery: "complete" | "incomplete";
  observedAtUtc: string;
  validUntilUtc: string;
  members: readonly Readonly<{
    membershipRef: string;
    nativeStatus: "active" | "past_due" | "canceled" | "expired" | "trialing" | "unknown";
    accessKind: "paid_membership" | "trial" | "free" | "unknown";
    productAccess: "customer" | "absent" | "admin" | "unknown";
    attribution: "exact_membership" | "exclusive_paid_scope" | "ambiguous";
    paidBasis: Readonly<{
      paymentRef: string;
      settlement: "settled" | "failed" | "pending" | "unknown";
      amountMinor: string;
      currency: string;
      refund: "none" | "invalidating" | "unknown";
      dispute: "none" | "invalidating" | "unknown";
    }> | null;
  }>[];
}>;
export interface PlatformPremiumQualifiedWhopCurrentAccessDecoder {
  readonly qualification: PlatformPremiumQualifiedWhopDecoder["qualification"];
  decodeHydrated(input: Readonly<{
    purchase: PlatformPremiumNativePurchase; hydrated: unknown;
    observedAtUtc: string; validUntilUtc: string;
  }>): PlatformPremiumNativeCurrentAccessCollection | null;
}
export type PlatformPremiumPreparedWhopCurrentAccess = Readonly<{
  kind: "prepared_native_current_paid_access";
  digest: string; qualificationRef: string; schemaSha256: string; apiVersion: string;
  collection: PlatformPremiumNativeCurrentAccessCollection;
}>;
const prepared = new WeakSet<object>();
function keys(value: object, expected: readonly string[]): void {
  if (!value || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    || Object.keys(value).length !== expected.length || Object.keys(value).some(key => !expected.includes(key))) {
    throw new Error("Premium current access facts are invalid.");
  }
}
function copyPurchase(value: PlatformPremiumNativePurchase): PlatformPremiumNativePurchase {
  const offer = premiumOffer(value.offer), payer = value.payer;
  if (payer.kind !== "bound" || !/^[a-f0-9]{64}$/u.test(payer.whopUserRefHmac)) {
    throw new Error("Premium current access binding is invalid.");
  }
  return Object.freeze({ offer, payer: Object.freeze({ kind: "bound", linkId: premiumRef(payer.linkId),
    whopUserRefHmac: payer.whopUserRefHmac, whopUserId: premiumRef(payer.whopUserId) }) });
}
function copyCollection(value: PlatformPremiumNativeCurrentAccessCollection): PlatformPremiumNativeCurrentAccessCollection {
  keys(value, ["protocol", "purchase", "discovery", "observedAtUtc", "validUntilUtc", "members"]);
  if (value.protocol !== "platform_premium_current_paid_access_v1"
    || !["complete", "incomplete"].includes(value.discovery) || !Array.isArray(value.members)
    || value.members.length > 250 || premiumUtc(value.observedAtUtc) >= premiumUtc(value.validUntilUtc)) {
    throw new Error("Premium current access collection is invalid.");
  }
  const seen = new Set<string>(), payments = new Set<string>();
  const members = value.members.map(member => {
    keys(member, ["membershipRef", "nativeStatus", "accessKind", "productAccess", "attribution", "paidBasis"]);
    const membershipRef = premiumRef(member.membershipRef);
    if (seen.has(membershipRef) || !["active", "past_due", "canceled", "expired", "trialing", "unknown"].includes(member.nativeStatus)
      || !["paid_membership", "trial", "free", "unknown"].includes(member.accessKind)
      || !["customer", "absent", "admin", "unknown"].includes(member.productAccess)
      || !["exact_membership", "exclusive_paid_scope", "ambiguous"].includes(member.attribution)) {
      throw new Error("Premium current access member is invalid.");
    }
    seen.add(membershipRef);
    let paidBasis: typeof member.paidBasis = null;
    if (member.paidBasis !== null) {
      const basis = member.paidBasis;
      keys(basis, ["paymentRef", "settlement", "amountMinor", "currency", "refund", "dispute"]);
      const paymentRef = premiumRef(basis.paymentRef);
      if (payments.has(paymentRef) || !["settled", "failed", "pending", "unknown"].includes(basis.settlement)
        || !/^(0|[1-9][0-9]{0,29})$/u.test(basis.amountMinor) || !/^[A-Z]{3}$/u.test(basis.currency)
        || !["none", "invalidating", "unknown"].includes(basis.refund)
        || !["none", "invalidating", "unknown"].includes(basis.dispute)) throw new Error("Premium current paid basis is invalid.");
      payments.add(paymentRef);
      paidBasis = Object.freeze({ paymentRef, settlement: basis.settlement, amountMinor: basis.amountMinor,
        currency: basis.currency, refund: basis.refund, dispute: basis.dispute });
    }
    return Object.freeze({ membershipRef, nativeStatus: member.nativeStatus, accessKind: member.accessKind,
      productAccess: member.productAccess, attribution: member.attribution, paidBasis });
  });
  return Object.freeze({ protocol: value.protocol, purchase: copyPurchase(value.purchase), discovery: value.discovery,
    observedAtUtc: value.observedAtUtc, validUntilUtc: value.validUntilUtc, members: Object.freeze(members) });
}
/** Shape validation alone cannot mint a producer receipt or qualify persisted JSON. */
export function readStoredPlatformPremiumWhopCurrentAccess(value: unknown): PlatformPremiumNativeCurrentAccessCollection | null {
  try { return copyCollection(value as PlatformPremiumNativeCurrentAccessCollection); } catch { return null; }
}
export function isPreparedPlatformPremiumWhopCurrentAccess(value: unknown): value is PlatformPremiumPreparedWhopCurrentAccess {
  return value !== null && typeof value === "object" && prepared.has(value);
}
export class PlatformPremiumWhopCurrentAccessPreparation {
  constructor(private readonly decoder: PlatformPremiumQualifiedWhopCurrentAccessDecoder | null) {}
  prepare(input: Readonly<{
    purchase: PlatformPremiumNativePurchase; hydrated: unknown; observedAtUtc: string; validUntilUtc: string;
    maximumEvidenceAgeMs: number;
    expectedQualification: Readonly<{ reviewRef: string; schemaSha256: string; apiVersion: string }>;
  }>): PlatformPremiumPreparedWhopCurrentAccess | Readonly<{ kind: "unqualified";
    reason: "native_decoder_unbound" | "qualification_mismatch" | "coverage_invalid" }> {
    if (!this.decoder) return Object.freeze({ kind: "unqualified", reason: "native_decoder_unbound" });
    try {
      const q = { ...this.decoder.qualification }, expected = { ...input.expectedQualification };
      const purchase = copyPurchase(input.purchase);
      if (q.reviewRef !== premiumRef(expected.reviewRef) || q.schemaSha256 !== expected.schemaSha256
        || !/^[a-f0-9]{64}$/u.test(q.schemaSha256) || q.apiVersion !== premiumRef(expected.apiVersion)
        || q.accountId !== purchase.offer.accountId || q.environment !== purchase.offer.environment) {
        return Object.freeze({ kind: "unqualified", reason: "qualification_mismatch" });
      }
      const observedAtUtc = premiumUtc(input.observedAtUtc), validUntilUtc = premiumUtc(input.validUntilUtc);
      if (observedAtUtc >= validUntilUtc || !Number.isSafeInteger(input.maximumEvidenceAgeMs)
        || input.maximumEvidenceAgeMs < 1 || input.maximumEvidenceAgeMs > 86_400_000
        || Date.parse(validUntilUtc) - Date.parse(observedAtUtc) > input.maximumEvidenceAgeMs) throw new Error("Invalid freshness.");
      const decoded = this.decoder.decodeHydrated({ purchase, hydrated: input.hydrated, observedAtUtc, validUntilUtc });
      if (!decoded) throw new Error("Unqualified facts.");
      const after = this.decoder.qualification;
      if (q.reviewRef !== after.reviewRef || q.schemaSha256 !== after.schemaSha256 || q.apiVersion !== after.apiVersion
        || q.accountId !== after.accountId || q.environment !== after.environment) {
        return Object.freeze({ kind: "unqualified", reason: "qualification_mismatch" });
      }
      const collection = copyCollection(decoded);
      if (JSON.stringify(collection.purchase) !== JSON.stringify(purchase)
        || collection.observedAtUtc !== observedAtUtc || collection.validUntilUtc !== validUntilUtc) throw new Error("Scope changed.");
      const result: PlatformPremiumPreparedWhopCurrentAccess = Object.freeze({ kind: "prepared_native_current_paid_access",
        digest: createHash("sha256").update(JSON.stringify(collection)).digest("hex"), qualificationRef: q.reviewRef,
        schemaSha256: q.schemaSha256, apiVersion: q.apiVersion, collection });
      prepared.add(result);
      return result;
    } catch { return Object.freeze({ kind: "unqualified", reason: "coverage_invalid" }); }
  }
}
