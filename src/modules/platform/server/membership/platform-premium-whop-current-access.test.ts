import { describe, expect, it } from "vitest";
import { PlatformPremiumWhopCurrentAccessPreparation, isPreparedPlatformPremiumWhopCurrentAccess,
  readStoredPlatformPremiumWhopCurrentAccess, type PlatformPremiumNativeCurrentAccessCollection,
  type PlatformPremiumQualifiedWhopCurrentAccessDecoder } from "./platform-premium-whop-current-access";

const purchase = { offer: { scopeRef: "offer", environment: "sandbox" as const, accountId: "merchant",
  productId: "product", planId: "variant" }, payer: { kind: "bound" as const, linkId: "link",
  whopUserRefHmac: "a".repeat(64), whopUserId: "buyer" } };
const qualification = { reviewRef: "review", schemaSha256: "b".repeat(64), apiVersion: "native_v1",
  accountId: "merchant", environment: "sandbox" as const };
const observedAtUtc = "2026-11-17T20:00:00.000Z", validUntilUtc = "2026-11-17T20:01:00.000Z";
function collection(): PlatformPremiumNativeCurrentAccessCollection {
  return { protocol: "platform_premium_current_paid_access_v1", purchase, discovery: "complete", observedAtUtc, validUntilUtc,
    members: [{ membershipRef: "membership", nativeStatus: "past_due", accessKind: "paid_membership", productAccess: "customer",
      attribution: "exact_membership", paidBasis: { paymentRef: "payment", settlement: "settled", amountMinor: "1000",
        currency: "USD", refund: "none", dispute: "none" } }] };
}
const input = () => ({ purchase, hydrated: { synthetic: true }, observedAtUtc, validUntilUtc,
  maximumEvidenceAgeMs: 60_000, expectedQualification: { ...qualification } });
function prepare(value: PlatformPremiumNativeCurrentAccessCollection) {
  const decoder: PlatformPremiumQualifiedWhopCurrentAccessDecoder = { qualification, decodeHydrated: () => value };
  return new PlatformPremiumWhopCurrentAccessPreparation(decoder).prepare(input());
}
describe("distinct current provider access preparation (synthetic only)", () => {
  it("copies and freezes genuine decoder facts without creating a billing period or sharing mutable inputs", () => {
    const value = collection(), result = prepare(value);
    expect(result.kind).toBe("prepared_native_current_paid_access");
    if (result.kind !== "prepared_native_current_paid_access") throw new Error("Preparation refused");
    expect(isPreparedPlatformPremiumWhopCurrentAccess(result)).toBe(true);
    expect(isPreparedPlatformPremiumWhopCurrentAccess(structuredClone(result))).toBe(false);
    expect(isPreparedPlatformPremiumWhopCurrentAccess({ ...result })).toBe(false);
    expect(Object.isFrozen(result.collection.members[0]?.paidBasis)).toBe(true);
    expect(JSON.stringify(result.collection)).not.toContain("endsAtUtc");
    (value.members[0] as { membershipRef: string }).membershipRef = "changed";
    expect(result.collection.members[0]?.membershipRef).toBe("membership");
    expect(readStoredPlatformPremiumWhopCurrentAccess(JSON.parse(JSON.stringify(result.collection)))).toEqual(result.collection);
    expect(isPreparedPlatformPremiumWhopCurrentAccess(readStoredPlatformPremiumWhopCurrentAccess(result.collection))).toBe(false);
  });
  it("requires an actual bound decoder and exact merchant, realm and review", () => {
    expect(new PlatformPremiumWhopCurrentAccessPreparation(null).prepare(input())).toEqual({ kind: "unqualified", reason: "native_decoder_unbound" });
    for (const delta of [{ accountId: "other" }, { environment: "live" }, { reviewRef: "other" }, { schemaSha256: "c".repeat(64) }, { apiVersion: "other" }]) {
      const decoder = { qualification: { ...qualification, ...delta }, decodeHydrated: () => collection() } as PlatformPremiumQualifiedWhopCurrentAccessDecoder;
      expect(new PlatformPremiumWhopCurrentAccessPreparation(decoder).prepare(input())).toEqual({ kind: "unqualified", reason: "qualification_mismatch" });
    }
  });
  it("rejects a decoder that changes qualification during hydration", () => {
    const decoder: PlatformPremiumQualifiedWhopCurrentAccessDecoder = { qualification: { ...qualification }, decodeHydrated() {
      (this.qualification as { reviewRef: string }).reviewRef = "changed"; return collection();
    } };
    expect(new PlatformPremiumWhopCurrentAccessPreparation(decoder).prepare(input())).toEqual({ kind: "unqualified", reason: "qualification_mismatch" });
  });
  it("rejects mismatched purchase, observed time and unbounded freshness", () => {
    for (const value of [ { ...collection(), purchase: { ...purchase, offer: { ...purchase.offer, planId: "other" } } },
      { ...collection(), observedAtUtc: "2026-11-17T19:59:00.000Z" }, { ...collection(), validUntilUtc: "2026-11-17T20:02:00.000Z" } ]) {
      expect(prepare(value).kind).toBe("unqualified");
    }
    const decoder = { qualification, decodeHydrated: () => collection() };
    expect(new PlatformPremiumWhopCurrentAccessPreparation(decoder).prepare({ ...input(), maximumEvidenceAgeMs: 59_999 }).kind).toBe("unqualified");
  });
  it("rejects duplicate members/payments and invented period or malformed monetary fields", () => {
    const good = collection(), member = good.members[0]!;
    for (const value of [{ ...good, members: [member, member] }, { ...good, members: [member, { ...member, membershipRef: "second" }] },
      { ...good, members: [{ ...member, paidBasis: { ...member.paidBasis!, amountMinor: "-1" } }] },
      { ...good, members: [{ ...member, paidBasis: { ...member.paidBasis!, startsAtUtc: observedAtUtc } }] }]) {
      expect(prepare(value).kind).toBe("unqualified");
    }
  });
  it("preserves negative and uncertain facts for the reducer without turning preparation into eligibility", () => {
    const value = collection(), member = value.members[0]!;
    for (const delta of [{ accessKind: "trial" }, { accessKind: "free" }, { productAccess: "admin" }, { productAccess: "unknown" },
      { attribution: "ambiguous" }, { nativeStatus: "expired" }, { paidBasis: null },
      { paidBasis: { ...member.paidBasis!, refund: "invalidating" } }, { paidBasis: { ...member.paidBasis!, dispute: "unknown" } }]) {
      const candidate = { ...value, members: [{ ...member, ...delta }] } as PlatformPremiumNativeCurrentAccessCollection;
      const result = prepare(candidate);
      expect(result.kind).toBe("prepared_native_current_paid_access");
      if (result.kind === "prepared_native_current_paid_access") expect(result.collection.members[0]).toEqual(candidate.members[0]);
    }
  });
});
