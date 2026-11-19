import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { beforeAll, expect, it } from "vitest";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformPremiumAuthorityRepository, platformPremiumAuthoritySchemaDescriptor, platformPremiumAuthoritySchemaDescriptorV2,
  type PlatformPremiumAuthorityDependenciesV2 } from "./platform-premium-authority-repository";
import { PlatformPremiumWhopCurrentAccessPreparation } from "./platform-premium-whop-current-access";
let pristine: Buffer;
beforeAll(() => {
  const db = new Database(":memory:");
  try { db.pragma("foreign_keys=ON"); runPlatformMigrations(db); pristine = db.serialize(); } finally { db.close(); }
}, 30_000);
const at = "2026-11-17T20:00:00.000Z", until = "2026-11-17T20:01:00.000Z";
const offer = { scopeRef: "offer", environment: "live" as const, accountId: "merchant", productId: "product", planId: "plan" };
const q = { reviewRef: "review", schemaSha256: "b".repeat(64), apiVersion: "native_v1", accountId: "merchant", environment: "live" as const };
function fixture() {
  const db = new Database(Buffer.from(pristine)); db.pragma("foreign_keys=ON");
  const userId = randomUUID(), linkId = randomUUID();
  db.prepare("INSERT INTO platform_users VALUES(?, 'discord', '12345', 'Synthetic', 'active', ?, ?)").run(userId, at, at);
  db.prepare("INSERT INTO platform_auth_identities VALUES(?, 'discord', '12345', 'active', ?, ?, ?, ?)").run(userId, userId, at, at, at);
  db.prepare("INSERT INTO platform_whop_user_links VALUES(?, ?, ?, 'active', ?, ?, ?, NULL)").run(linkId, userId, "a".repeat(64), at, at, at);
  // Explicit synthetic admission/owner ports exercise real repository SQL and
  // epochs only. They do not qualify actual Core admission, a provider or release.
  const deps: PlatformPremiumAuthorityDependenciesV2 = { nowUtc: () => at,
    schemaIsQualified: (_db, descriptor) => descriptor === platformPremiumAuthoritySchemaDescriptor.sha256 || descriptor === platformPremiumAuthoritySchemaDescriptorV2.sha256,
    erasure: { readCurrent: () => ({ kind: "admitted", generation: 1, admissionRef: "synthetic_admission", validUntilUtc: until }),
      captureBeforeRootDelete: () => { throw new Error("Not a root erasure fixture"); } },
    owner: { authorizePolicy: () => true, authorizeGift: () => false }, whopSubjectReference: () => "a".repeat(64),
    redactedComplimentary: { isQualified: () => true, readCurrent: () => ({ kind: "unbound" }),
      prepareRedaction: () => ({ kind: "unbound" }), commitCanonicalRedaction: () => ({ kind: "unbound" }) } };
  const repo = new PlatformPremiumAuthorityRepository(db, deps);
  const key = db.transaction(() => {
    repo.savePolicy({ policyRef: "policy", configurationRef: "config", guildId: "12346", state: "active", offerScopes: [offer],
      premiumPlanIds: [], maximumEvidenceAgeMs: 60_000, nativeQualification: q }, null);
    return repo.initialize(userId, "policy");
  }).immediate();
  const ticket = db.transaction(() => {
    const read = repo.captureV2(key); if (read.kind !== "snapshot") throw new Error(read.reason); return read.ticket;
  }).immediate();
  const native = db.transaction(() => repo.nativePurchaseV2(ticket, "offer", "buyer")).immediate();
  if (native.kind !== "purchase") throw new Error("Missing synthetic payer");
  const proof = new PlatformPremiumWhopCurrentAccessPreparation({ qualification: q, decodeHydrated: input => ({
    protocol: "platform_premium_current_paid_access_v1", purchase: input.purchase, discovery: "complete",
    observedAtUtc: at, validUntilUtc: until, members: [{ membershipRef: "member", nativeStatus: "past_due", accessKind: "paid_membership",
      productAccess: "customer", attribution: "exact_membership", paidBasis: { paymentRef: "payment", settlement: "settled",
        amountMinor: "100", currency: "USD", refund: "none", dispute: "none" } }] }) }).prepare({
    purchase: native.purchase, hydrated: null, observedAtUtc: at, validUntilUtc: until, maximumEvidenceAgeMs: 60_000, expectedQualification: q });
  if (proof.kind !== "prepared_native_current_paid_access") throw new Error("Missing synthetic native receipt");
  return { db, repo, key, ticket, proof, userId, linkId };
}
it("persists only the prepared receipt under the original V2 ticket, never a V1 substitute or serialized proof", () => {
  const x = fixture();
  try { x.db.transaction(() => {
    expect(x.repo.isCurrentV2(x.ticket)).toBe(true);
    expect(x.repo.isCurrent(x.ticket)).toBe(false);
    const v1 = x.repo.capture(x.key); if (v1.kind !== "snapshot") throw new Error(v1.reason);
    expect(() => x.repo.recordWhopCurrentAccess(v1.ticket, "v1", x.proof)).toThrow();
    expect(() => x.repo.recordWhopCurrentAccess(x.ticket, "forged", structuredClone(x.proof))).toThrow();
    expect(x.db.prepare("SELECT count(*) n FROM platform_premium_paid_observations").get()).toEqual({ n: 0 });
    expect(x.repo.recordWhopCurrentAccess(x.ticket, "observation", x.proof)).toEqual({ kind: "recorded" });
    expect(x.repo.isCurrentV2(x.ticket)).toBe(false);
    const fresh = x.repo.captureV2(x.key); if (fresh.kind !== "snapshot") throw new Error(fresh.reason);
    expect(fresh.coverage[0]).toMatchObject({ kind: "native_coverage", collection: { protocol: "platform_premium_current_paid_access_v1" } });
  }).immediate(); } finally { x.db.close(); }
});
it("keeps a historical current-access mode as a hold tag after a payer epoch changes, without adopting its old facts", () => {
  const x = fixture();
  try { x.db.transaction(() => {
    x.repo.recordWhopCurrentAccess(x.ticket, "observation", x.proof);
    x.db.prepare("UPDATE platform_whop_user_links SET link_state='revoked',revoked_at_utc=? WHERE link_id=?").run(at, x.linkId);
    const read = x.repo.captureV2(x.key); if (read.kind !== "snapshot") throw new Error(read.reason);
    expect(read.coverage[0]).toMatchObject({ kind: "unknown", basis: "current_provider_access" });
    expect(x.repo.isCurrentV2(x.ticket)).toBe(false);
  }).immediate(); } finally { x.db.close(); }
});
it.each(["identity", "whop", "erasure", "policy"] as const)("refuses hydration completed after actual %s authority changes", change => {
  const x = fixture();
  try { x.db.transaction(() => {
    if (change === "identity") x.db.prepare("UPDATE platform_auth_identities SET status='revoked' WHERE user_id=?").run(x.userId);
    if (change === "whop") x.db.prepare("UPDATE platform_whop_user_links SET link_state='revoked',revoked_at_utc=? WHERE link_id=?").run(at, x.linkId);
    if (change === "erasure") x.db.prepare("UPDATE platform_premium_authorities SET erasure_generation=erasure_generation+1 WHERE authority_key=?").run(x.key);
    if (change === "policy") x.repo.savePolicy({ policyRef: "policy", configurationRef: "config", guildId: "12346", state: "active",
      offerScopes: [offer], premiumPlanIds: [], maximumEvidenceAgeMs: 60_000, nativeQualification: q }, 1);
    expect(x.repo.isCurrentV2(x.ticket)).toBe(false);
    expect(() => x.repo.recordWhopCurrentAccess(x.ticket, "stale", x.proof)).toThrow();
    expect(x.db.prepare("SELECT count(*) n FROM platform_premium_paid_observations").get()).toEqual({ n: 0 });
  }).immediate(); } finally { x.db.close(); }
});
