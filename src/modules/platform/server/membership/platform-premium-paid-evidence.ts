import { premiumFresh, premiumInteger, premiumRef, premiumUtc, samePremiumPurchase, validatePremiumPurchase,
  type PlatformPremiumPaidEvidence, type PlatformPremiumPaidTerm, type PlatformPremiumPurchase } from "../../contracts/platform-premium-access";

/** Normalised server facts ONLY after native API/identity/coverage qualification.
 * There is deliberately no converter from existing aggregate entitlements or webhook JSON. */
export type PlatformPremiumWhopCoverage = Readonly<{
  purchase: PlatformPremiumPurchase;
  membershipRef: string;
  observedAtUtc: string;
  /** Current native membership, payment/refund/dispute observations were all hydrated. */
  state: "current" | "ended" | "invalidated" | "unknown";
  accessKind: "paid_membership" | "trial" | "free" | "unknown";
  terms: readonly Readonly<{
    paymentRef: string;
    coverageKind: "paid_membership" | "trial" | "free" | "unknown";
    settlement: "settled" | "failed" | "pending" | "no_payment";
    amountMinor: string;
    currency: string;
    refund: "none" | "invalidating" | "unknown";
    dispute: "none" | "invalidating" | "unknown";
    /** Native explicit coverage; never payment timestamp plus plan cadence. */
    coverage: Readonly<{ startsAtUtc: string; endsAtUtc: string }> | null;
  }>[];
}>;
export type PlatformPremiumCoverageCollection = Readonly<{
  purchase: PlatformPremiumPurchase;
  observedAtUtc: string;
  /** When supplied by the producer, never extend its native validity deadline. */
  validUntilUtc?: string;
  /** Includes known purchases omitted by pagination; complete is not inferred from an empty list. */
  discovery: "complete" | "incomplete";
  coverageQualification: "native_bound" | "unqualified";
  members: readonly PlatformPremiumWhopCoverage[];
}>;

/** Bound payment period reducer. Trials/free/manual grants and active status cannot create terms. */
export function preparePlatformPremiumPaidEvidence(input: PlatformPremiumCoverageCollection,
  expected: PlatformPremiumPurchase, nowUtc: string, maximumEvidenceAgeMs: number): PlatformPremiumPaidEvidence {
  const at = premiumUtc(nowUtc); validatePremiumPurchase(expected);
  const age = premiumInteger(maximumEvidenceAgeMs, 1, 86_400_000);
  const unknown = (reason: "incomplete" | "unqualified_coverage" | "scope_mismatch" | "conflicting_facts"): PlatformPremiumPaidEvidence =>
    Object.freeze({ kind: "unknown", purchase: expected, observedAtUtc: at, validUntilUtc: new Date(Date.parse(at) + age).toISOString(), reason });
  try {
    if (!samePremiumPurchase(input.purchase, expected)) return unknown("scope_mismatch");
    if (expected.environment !== "live") return unknown("unqualified_coverage");
    if (input.coverageQualification !== "native_bound") return unknown("unqualified_coverage");
    if (!["complete", "incomplete"].includes(input.discovery) || !Array.isArray(input.members) || input.members.length > 250) return unknown("incomplete");
    const observed = premiumUtc(input.observedAtUtc);
    let until = new Date(Date.parse(observed) + age).toISOString();
    if (input.validUntilUtc !== undefined) until = [until, premiumUtc(input.validUntilUtc)].sort()[0]!;
    if (!premiumFresh(observed, until, at)) return unknown("incomplete");
    const seenMembers = new Set<string>(); const seenPayments = new Set<string>();
    const terms: PlatformPremiumPaidTerm[] = [];
    let uncertain = input.discovery !== "complete"; let invalidated = false;
    for (const member of input.members) {
      if (!samePremiumPurchase(member.purchase, expected)) return unknown("scope_mismatch");
      premiumRef(member.membershipRef);
      if (seenMembers.has(member.membershipRef)) return unknown("conflicting_facts");
      seenMembers.add(member.membershipRef);
      const memberUntil = new Date(Date.parse(premiumUtc(member.observedAtUtc)) + age).toISOString();
      if (!premiumFresh(member.observedAtUtc, memberUntil, at)) { uncertain = true; continue; }
      until = [until, memberUntil].sort()[0]!;
      if (!Array.isArray(member.terms) || member.terms.length > 250) return unknown("incomplete");
      if (!["current", "ended", "invalidated", "unknown"].includes(member.state)) return unknown("unqualified_coverage");
      if (!["paid_membership", "trial", "free", "unknown"].includes(member.accessKind)) return unknown("unqualified_coverage");
      const memberTerms: PlatformPremiumPaidTerm[] = [];
      let memberUncertain = member.state === "unknown" || member.accessKind === "unknown";
      let memberInvalidated = member.state === "invalidated";
      if (memberUncertain) uncertain = true;
      if (member.state === "invalidated") invalidated = true;
      for (const term of member.terms) {
        premiumRef(term.paymentRef);
        if (seenPayments.has(term.paymentRef)) return unknown("conflicting_facts");
        seenPayments.add(term.paymentRef);
        if (!/^(0|[1-9][0-9]{0,29})$/u.test(term.amountMinor) || !/^[A-Z]{3}$/u.test(term.currency)
          || !["paid_membership", "trial", "free", "unknown"].includes(term.coverageKind)
          || !["settled", "failed", "pending", "no_payment"].includes(term.settlement)
          || !["none", "invalidating", "unknown"].includes(term.refund)
          || !["none", "invalidating", "unknown"].includes(term.dispute)) return unknown("unqualified_coverage");
        if (term.coverage && premiumUtc(term.coverage.startsAtUtc) >= premiumUtc(term.coverage.endsAtUtc)) return unknown("conflicting_facts");
        if (term.coverageKind === "unknown") { uncertain = true; memberUncertain = true; continue; }
        if (member.accessKind !== "paid_membership" || term.coverageKind !== "paid_membership") continue;
        if (term.refund === "unknown" || term.dispute === "unknown") { uncertain = true; memberUncertain = true; continue; }
        if (term.refund === "invalidating" || term.dispute === "invalidating") {
          invalidated = true;
          if (!term.coverage || (premiumUtc(term.coverage.startsAtUtc) <= at && premiumUtc(term.coverage.endsAtUtc) > at)) memberInvalidated = true;
          continue;
        }
        if (member.state !== "current" || term.settlement !== "settled" || BigInt(term.amountMinor) <= BigInt(0)) continue;
        if (!term.coverage) { uncertain = true; memberUncertain = true; continue; }
        const start = premiumUtc(term.coverage.startsAtUtc); const end = premiumUtc(term.coverage.endsAtUtc);
        if (start >= end) return unknown("conflicting_facts");
        if (start <= at && end > at) memberTerms.push(Object.freeze({ membershipRef: member.membershipRef,
          paymentRef: term.paymentRef, startsAtUtc: start, endsAtUtc: end }));
      }
      if (!memberUncertain && !memberInvalidated) terms.push(...memberTerms);
    }
    // One independent valid purchase survives another ended/disputed purchase.
    if (terms.length) return Object.freeze({ kind: "paid", purchase: expected, observedAtUtc: observed,
      validUntilUtc: until, terms: Object.freeze(terms) });
    if (uncertain) return unknown("incomplete");
    return Object.freeze({ kind: "not_paid", purchase: expected, observedAtUtc: observed, validUntilUtc: until,
      reason: invalidated ? "invalidated" : "no_current_paid_term" });
  } catch { return unknown("unqualified_coverage"); }
}
