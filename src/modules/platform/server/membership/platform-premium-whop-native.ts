import { createHash } from "node:crypto";

/** Approved commercial scope is independent of whether this user has a native
 * payer binding. A gift recipient must never need a fabricated Whop user ID. */
export type PlatformPremiumOfferScope = Readonly<{
  scopeRef: string;
  environment: "sandbox" | "live";
  accountId: string;
  productId: string;
  planId: string;
}>;

export type PlatformPremiumNativePayer = Readonly<{
  kind: "bound";
  linkId: string;
  whopUserRefHmac: string;
  whopUserId: string;
}> | Readonly<{
  kind: "unbound";
  reason: "not_linked" | "conflict" | "historical_hmac_only";
}>;

export type PlatformPremiumNativePurchase = Readonly<{
  offer: PlatformPremiumOfferScope;
  payer: Extract<PlatformPremiumNativePayer, { kind: "bound" }>;
}>;

export type PlatformPremiumNativeTerm = Readonly<{
  paymentRef: string;
  /** Required per payment: a membership can contain both trial entry charges
   * and later paid invoices. Do not infer this from its current status. */
  coverageKind: "paid_membership" | "trial" | "free" | "unknown";
  settlement: "settled" | "failed" | "pending" | "no_payment";
  amountMinor: string;
  currency: string;
  refund: "none" | "invalidating" | "unknown";
  dispute: "none" | "invalidating" | "unknown";
  coverage: Readonly<{ startsAtUtc: string; endsAtUtc: string }> | null;
}>;

export type PlatformPremiumNativeCollection = Readonly<{
  purchase: PlatformPremiumNativePurchase;
  discovery: "complete" | "incomplete";
  observedAtUtc: string;
  validUntilUtc: string;
  members: readonly Readonly<{
    membershipRef: string;
    /** Native classification is required even for a settled trial entry charge.
     * A payment amount/active label alone cannot make a trial paid Premium. */
    accessKind: "paid_membership" | "trial" | "free" | "unknown";
    state: "current" | "ended" | "invalidated" | "unknown";
    terms: readonly PlatformPremiumNativeTerm[];
  }>[];
}>;

/** Server-owned qualification, never a request flag. An actual version-specific
 * decoder must qualify native settlement, explicit paid periods, complete paging
 * and current refund/dispute reads together. No decoder or HTTP client is supplied
 * here: the existing v1 aggregate membership snapshot cannot implement this port. */
export interface PlatformPremiumQualifiedWhopDecoder {
  readonly qualification: Readonly<{
    reviewRef: string;
    schemaSha256: string;
    apiVersion: string;
    accountId: string;
    environment: "sandbox" | "live";
  }>;
  decodeHydrated(input: Readonly<{
    purchase: PlatformPremiumNativePurchase;
    hydrated: unknown;
    observedAtUtc: string;
    validUntilUtc: string;
  }>): PlatformPremiumNativeCollection | null;
}

export type PlatformPremiumPreparedWhopCoverage = Readonly<{
  kind: "prepared_native_coverage";
  digest: string;
  qualificationRef: string;
  schemaSha256: string;
  apiVersion: string;
  collection: PlatformPremiumNativeCollection;
}>;

const prepared = new WeakSet<object>();
const reference = (value: string): string => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_:-]{1,160}$/u.test(value)) {
    throw new Error("Premium native reference is invalid.");
  }
  return value;
};
const utc = (value: string): string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
    || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error("Premium native period is invalid.");
  }
  return value;
};

function copyPurchase(input: PlatformPremiumNativePurchase): PlatformPremiumNativePurchase {
  const { offer, payer } = input;
  if (!["sandbox", "live"].includes(offer.environment) || payer.kind !== "bound"
    || !/^[a-f0-9]{64}$/u.test(payer.whopUserRefHmac)) {
    throw new Error("Premium native binding is invalid.");
  }
  return Object.freeze({
    offer: Object.freeze({ scopeRef: reference(offer.scopeRef), environment: offer.environment,
      accountId: reference(offer.accountId), productId: reference(offer.productId), planId: reference(offer.planId) }),
    payer: Object.freeze({ kind: "bound", linkId: reference(payer.linkId),
      whopUserRefHmac: payer.whopUserRefHmac, whopUserId: reference(payer.whopUserId) }),
  });
}

function samePurchase(a: PlatformPremiumNativePurchase, b: PlatformPremiumNativePurchase): boolean {
  return a.offer.scopeRef === b.offer.scopeRef && a.offer.environment === b.offer.environment
    && a.offer.accountId === b.offer.accountId && a.offer.productId === b.offer.productId
    && a.offer.planId === b.offer.planId && a.payer.linkId === b.payer.linkId
    && a.payer.whopUserId === b.payer.whopUserId && a.payer.whopUserRefHmac === b.payer.whopUserRefHmac;
}

function copyCollection(value: PlatformPremiumNativeCollection,
  expected: PlatformPremiumNativePurchase, observed: string, until: string): PlatformPremiumNativeCollection {
  const purchase = copyPurchase(value.purchase);
  if (!samePurchase(purchase, expected) || value.observedAtUtc !== observed || value.validUntilUtc !== until
    || !["complete", "incomplete"].includes(value.discovery) || !Array.isArray(value.members)
    || value.members.length > 250) throw new Error("Premium native coverage scope is invalid.");
  const memberships = new Set<string>(), payments = new Set<string>();
  const members = value.members.map(member => {
    const membershipRef = reference(member.membershipRef);
    if (memberships.has(membershipRef) || !["paid_membership", "trial", "free", "unknown"].includes(member.accessKind)
      || !["current", "ended", "invalidated", "unknown"].includes(member.state)
      || !Array.isArray(member.terms) || member.terms.length > 250) throw new Error("Premium native coverage is incomplete.");
    memberships.add(membershipRef);
    const terms = member.terms.map((term: PlatformPremiumNativeCollection["members"][number]["terms"][number]) => {
      const paymentRef = reference(term.paymentRef);
      if (payments.size >= 250 || payments.has(paymentRef) || !/^(0|[1-9][0-9]{0,29})$/u.test(term.amountMinor)
        || !["paid_membership", "trial", "free", "unknown"].includes(term.coverageKind)
        || !/^[A-Z]{3}$/u.test(term.currency) || !["settled", "failed", "pending", "no_payment"].includes(term.settlement)
        || !["none", "invalidating", "unknown"].includes(term.refund)
        || !["none", "invalidating", "unknown"].includes(term.dispute)) {
        throw new Error("Premium native payment facts are invalid.");
      }
      payments.add(paymentRef);
      const coverage = term.coverage === null ? null : Object.freeze({
        startsAtUtc: utc(term.coverage.startsAtUtc), endsAtUtc: utc(term.coverage.endsAtUtc),
      });
      if (coverage && coverage.startsAtUtc >= coverage.endsAtUtc) throw new Error("Premium native paid period is invalid.");
      return Object.freeze({ paymentRef, coverageKind: term.coverageKind, settlement: term.settlement, amountMinor: term.amountMinor,
        currency: term.currency, refund: term.refund, dispute: term.dispute, coverage });
    });
    return Object.freeze({ membershipRef, accessKind: member.accessKind, state: member.state, terms: Object.freeze(terms) });
  });
  return Object.freeze({ purchase, discovery: value.discovery, observedAtUtc: observed,
    validUntilUtc: until, members: Object.freeze(members) });
}

/** No provider I/O, API-version default, timestamp+cadence inference, paid decision
 * or entitlement writer. Null decoder is explicitly unqualified, never unpaid.
 * Only a separately qualified server-owned decoder can mint an in-process receipt. */
export class PlatformPremiumWhopNativePreparation {
  constructor(private readonly decoder: PlatformPremiumQualifiedWhopDecoder | null) {}

  prepare(input: Readonly<{
    purchase: PlatformPremiumNativePurchase;
    hydrated: unknown;
    observedAtUtc: string;
    validUntilUtc: string;
    maximumEvidenceAgeMs: number;
    expectedQualification: Readonly<{ reviewRef: string; schemaSha256: string; apiVersion: string }>;
  }>): PlatformPremiumPreparedWhopCoverage | Readonly<{ kind: "unqualified"; reason:
    "native_decoder_unbound" | "qualification_mismatch" | "coverage_invalid" }> {
    if (!this.decoder) return Object.freeze({ kind: "unqualified", reason: "native_decoder_unbound" });
    try {
      const liveQualification = this.decoder.qualification;
      const q = Object.freeze({ reviewRef: liveQualification.reviewRef, schemaSha256: liveQualification.schemaSha256,
        apiVersion: liveQualification.apiVersion, accountId: liveQualification.accountId, environment: liveQualification.environment });
      const expected = Object.freeze({ reviewRef: input.expectedQualification.reviewRef,
        schemaSha256: input.expectedQualification.schemaSha256, apiVersion: input.expectedQualification.apiVersion });
      const purchase = copyPurchase(input.purchase);
      if (q.reviewRef !== reference(expected.reviewRef) || q.schemaSha256 !== expected.schemaSha256
        || !/^[a-f0-9]{64}$/u.test(q.schemaSha256) || q.apiVersion !== reference(expected.apiVersion)
        || q.accountId !== purchase.offer.accountId || q.environment !== purchase.offer.environment) {
        return Object.freeze({ kind: "unqualified", reason: "qualification_mismatch" });
      }
      const observed = utc(input.observedAtUtc), until = utc(input.validUntilUtc);
      if (observed >= until || !Number.isSafeInteger(input.maximumEvidenceAgeMs)
        || input.maximumEvidenceAgeMs < 1 || Date.parse(until) - Date.parse(observed) > input.maximumEvidenceAgeMs) {
        throw new Error("Premium native observation freshness is invalid.");
      }
      const decoded = this.decoder.decodeHydrated({ purchase, hydrated: input.hydrated,
        observedAtUtc: observed, validUntilUtc: until });
      if (!decoded) return Object.freeze({ kind: "unqualified", reason: "coverage_invalid" });
      const after = this.decoder.qualification;
      if (q.reviewRef !== after.reviewRef || q.schemaSha256 !== after.schemaSha256 || q.apiVersion !== after.apiVersion
        || q.accountId !== after.accountId || q.environment !== after.environment) {
        return Object.freeze({ kind: "unqualified", reason: "qualification_mismatch" });
      }
      const collection = copyCollection(decoded, purchase, observed, until);
      const result = Object.freeze({ kind: "prepared_native_coverage" as const,
        digest: createHash("sha256").update(JSON.stringify(collection)).digest("hex"),
        qualificationRef: q.reviewRef, schemaSha256: q.schemaSha256, apiVersion: q.apiVersion, collection });
      prepared.add(result);
      return result;
    } catch {
      return Object.freeze({ kind: "unqualified", reason: "coverage_invalid" });
    }
  }
}

/** Persistence must recheck current subject/generations/erasure in its transaction.
 * JSON, casts and objects from requests cannot manufacture this runtime receipt. */
export function isPreparedPlatformPremiumWhopCoverage(value: unknown): value is PlatformPremiumPreparedWhopCoverage {
  return value !== null && typeof value === "object" && prepared.has(value);
}

/** Validates the normalised stored shape only. It does NOT attest native origin,
 * mint an in-process receipt or make persisted JSON acceptable to the writer. */
export function readStoredPlatformPremiumWhopCollection(value: unknown): PlatformPremiumNativeCollection | null {
  try {
    const candidate = value as PlatformPremiumNativeCollection;
    const observed = utc(candidate.observedAtUtc), until = utc(candidate.validUntilUtc);
    if (observed >= until) return null;
    return copyCollection(candidate, copyPurchase(candidate.purchase), observed, until);
  } catch { return null; }
}
