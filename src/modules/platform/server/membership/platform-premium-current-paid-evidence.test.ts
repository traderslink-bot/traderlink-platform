import { describe, expect, it } from "vitest";
import { evaluatePlatformPremium, type PlatformPremiumSnapshot } from "../../contracts/platform-premium-access";
import { preparePlatformPremiumCurrentPaidEvidence } from "./platform-premium-current-paid-evidence";
import type { PlatformPremiumNativeCurrentAccessCollection } from "./platform-premium-whop-current-access";
const at = "2026-11-17T20:00:00.000Z", until = "2026-11-17T20:01:00.000Z";
const purchase = { environment: "live" as const, accountId: "merchant", productId: "product", planId: "plan", whopUserId: "buyer" };
function collection(): PlatformPremiumNativeCurrentAccessCollection {
  return { protocol: "platform_premium_current_paid_access_v1", purchase: {
    offer: { ...purchase, scopeRef: "offer" }, payer: { kind: "bound", linkId: "link", whopUserRefHmac: "a".repeat(64), whopUserId: "buyer" } },
    observedAtUtc: at, validUntilUtc: until, discovery: "complete", members: [{ membershipRef: "member", nativeStatus: "past_due",
      accessKind: "paid_membership", productAccess: "customer", attribution: "exact_membership", paidBasis: {
        paymentRef: "payment", settlement: "settled", amountMinor: "100", currency: "USD", refund: "none", dispute: "none" } }] };
}
const reduce = (value = collection(), now = at) => preparePlatformPremiumCurrentPaidEvidence(value, purchase, now, 60_000);
function snapshot(evidence = reduce()): PlatformPremiumSnapshot {
  const scope = { authorityKey: "11111111-1111-4111-8111-111111111111", userId: "22222222-2222-4222-8222-222222222222",
    discordUserId: "12345", guildId: "12346", identityGeneration: 1, entitlementGeneration: 1, erasureGeneration: 1, policyGeneration: 1 };
  return { apiVersion: "platform_premium_authority_v2", scope, authorityRevision: 1, observedAtUtc: at, validUntilUtc: until,
    ticket: { scope, authorityRevision: 1, whopGeneration: 1, admissionRef: "admission", factsSha256: "b".repeat(64), observedAtUtc: at, validUntilUtc: until },
    paidRoleId: "12347", complimentaryRoleId: null, payer: collection().purchase.payer,
    coverage: [{ kind: "evidence", offer: collection().purchase.offer, evidence }], complimentary: { kind: "none" },
    assignmentReview: { kind: "reviewed", reviewRef: "review", actorUserId: "actor", reviewedAtUtc: at, paidRoleDisposition: "paid_only" },
    previousPaidThroughUtc: "2026-11-01T00:00:00.000Z", retiredSubjects: [] };
}
describe("current paid provider access (synthetic facts, no provider qualification)", () => {
  it("retains actual customer access during past-due grace with a paid basis and no invented period", () => {
    const evidence = reduce();
    expect(evidence.kind).toBe("current_paid_access");
    expect(evaluatePlatformPremium(snapshot(evidence), at)).toMatchObject({ ordinaryAccess: "allowed", partnerPaidEligible: true,
      paidRole: "present", paidThroughUtc: null, validUntilUtc: until, basis: "current_provider_access" });
  });
  it.each(["trial", "free"] as const)("does not count %s customer access as paid", accessKind => {
    const c = collection(); expect(reduce({ ...c, members: [{ ...c.members[0]!, accessKind }] }).kind).toBe("not_paid");
  });
  it("ends access only on a fresh actual absent read", () => {
    const c = collection(), evidence = reduce({ ...c, members: [{ ...c.members[0]!, productAccess: "absent" }] });
    expect(evidence.kind).toBe("not_paid");
    expect(evaluatePlatformPremium(snapshot(evidence), at)).toMatchObject({ partnerPaidEligible: false, paidRole: "absent" });
  });
  it.each(["unknown", "admin"] as const)("holds existing roles for %s product access despite a previous invoice end", productAccess => {
    const c = collection(), evidence = reduce({ ...c, members: [{ ...c.members[0]!, productAccess }] });
    expect(evidence.kind).toBe("unknown");
    expect(evaluatePlatformPremium(snapshot(evidence), at)).toMatchObject({ ordinaryAccess: "unknown", partnerPaidEligible: false, paidRole: "hold" });
  });
  it.each(["canceled", "expired", "unknown", "trialing"] as const)("holds conflicting %s state with continuing customer access", nativeStatus => {
    const c = collection(); expect(reduce({ ...c, members: [{ ...c.members[0]!, nativeStatus }] }).kind).toBe("unknown");
  });
  it("never treats unknown disputes/refunds as a negative removal or positive grant", () => {
    const c = collection(), member = c.members[0]!;
    for (const delta of [{ refund: "unknown" }, { dispute: "unknown" }]) {
      const evidence = reduce({ ...c, members: [{ ...member, paidBasis: { ...member.paidBasis!, ...delta } }] } as PlatformPremiumNativeCurrentAccessCollection);
      expect(evaluatePlatformPremium(snapshot(evidence), at)).toMatchObject({ partnerPaidEligible: false, paidRole: "hold" });
    }
    for (const delta of [{ refund: "invalidating" }, { dispute: "invalidating" }]) {
      expect(reduce({ ...c, members: [{ ...member, paidBasis: { ...member.paidBasis!, ...delta } }] } as PlatformPremiumNativeCurrentAccessCollection)).toMatchObject({ kind: "not_paid", reason: "invalidated" });
    }
  });
  it("refuses old payment plus ambiguous product access from a free sibling", () => {
    const c = collection(), paid = { ...c.members[0]!, attribution: "exclusive_paid_scope" as const };
    const free = { ...paid, membershipRef: "free", accessKind: "free" as const, paidBasis: null };
    const evidence = reduce({ ...c, members: [paid, free] });
    expect(evidence.kind).toBe("unknown");
    expect(evaluatePlatformPremium(snapshot(evidence), at).paidRole).toBe("hold");
    expect(reduce({ ...c, members: [c.members[0]!, free] }).kind).toBe("current_paid_access");
  });
  it("keeps provider gaps, incomplete discovery and exact expiry unknown", () => {
    const c = collection();
    expect(reduce({ ...c, discovery: "incomplete" }).kind).toBe("unknown");
    expect(reduce(c, until).kind).toBe("unknown");
    expect(evaluatePlatformPremium(snapshot(), until).paidRole).toBe("hold");
  });
  it("holds stale current-access observations rejected by the repository despite earlier invoice history", () => {
    const s = snapshot();
    expect(evaluatePlatformPremium({ ...s, coverage: [{ kind: "unknown", offer: s.coverage[0]!.offer,
      reason: "native_coverage_stale_or_unqualified", basis: "current_provider_access" }] }, at).paidRole).toBe("hold");
  });
  it("preserves the exact legacy live period decision shape", () => {
    const evidence = { kind: "paid" as const, purchase, observedAtUtc: at, validUntilUtc: until,
      terms: [{ membershipRef: "legacy", paymentRef: "invoice", startsAtUtc: at, endsAtUtc: "2026-12-01T00:00:00.000Z" }] };
    expect(evaluatePlatformPremium(snapshot(evidence), at)).toEqual({ ordinaryAccess: "allowed", partnerPaidEligible: true,
      paidRole: "present", complimentaryRole: "unchanged", reason: "paid", paidThroughUtc: "2026-12-01T00:00:00.000Z", validUntilUtc: until });
  });
  it("does not let a separate legacy period-false observation override current paid or unknown provider access", () => {
    const c = collection(), knownFalse = { kind: "evidence" as const,
      offer: { ...c.purchase.offer, scopeRef: "legacy_offer", planId: "legacy_plan" },
      evidence: { kind: "not_paid" as const, purchase: { ...purchase, planId: "legacy_plan" },
        observedAtUtc: at, validUntilUtc: until, reason: "no_current_paid_term" as const } };
    const paid = snapshot();
    expect(evaluatePlatformPremium({ ...paid, coverage: [...paid.coverage, knownFalse] }, at)).toMatchObject({ partnerPaidEligible: true, paidRole: "present", paidThroughUtc: null });
    const unknown = snapshot(reduce({ ...c, members: [{ ...c.members[0]!, productAccess: "unknown" }] }));
    expect(evaluatePlatformPremium({ ...unknown, coverage: [...unknown.coverage, knownFalse] }, at)).toMatchObject({ partnerPaidEligible: false, paidRole: "hold" });
  });
  it("does not consume sandbox facts in the live reducer or pure evaluator", () => {
    const c = collection(), sandbox = { ...purchase, environment: "sandbox" as const };
    expect(preparePlatformPremiumCurrentPaidEvidence(c, sandbox, at, 60_000).kind).toBe("unknown");
    const s = snapshot(), evidence = reduce();
    const changed = { ...s, coverage: [{ kind: "evidence" as const, offer: { ...s.coverage[0]!.offer, environment: "sandbox" as const },
      evidence: { ...evidence, purchase: sandbox } }] };
    expect(evaluatePlatformPremium(changed, at)).toMatchObject({ partnerPaidEligible: false, paidRole: "hold" });
  });
});
