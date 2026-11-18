// @vitest-environment node
import { expect,it,vi } from "vitest";
import { PlatformPremiumWhopCurrentAccessPreparation,
  type PlatformPremiumNativeCurrentAccessCollection } from "../../platform/server/membership/platform-premium-whop-current-access";
import { createPartnerAlertPremiumWhopRefresh, createPartnerAlertPremiumWhopSubscriberBinding,
  createPartnerAlertPremiumWhopRequestSubscriberBinding } from "./partner-alert-premium-whop-refresh";
vi.mock("server-only",() => ({}));
const at = "2026-11-17T20:00:00.000Z",until = "2026-11-17T20:00:30.000Z";
function fixture() {
  let inWriter = false,current = true,now = at;
  const offer = { scopeRef: "premium_scope",environment: "sandbox" as const,accountId: "biz_one",productId: "prod_one",planId: "plan_one" };
  const q = { reviewRef: "native_review",schemaSha256: "a".repeat(64),apiVersion: "2026-10-27-2",accountId: "biz_one",environment: "sandbox" as const };
  const scope = { authorityKey: "11111111-1111-4111-8111-111111111111",userId: "22222222-2222-4222-8222-222222222222",
    guildId: "12345",discordUserId: "12346",identityGeneration: 1,entitlementGeneration: 1,erasureGeneration: 1,policyGeneration: 1 };
  const ticket = { scope,authorityRevision: 4,whopGeneration: 2,admissionRef: "original_admission",factsSha256: "b".repeat(64),
    observedAtUtc: at,validUntilUtc: until };
  const payer = { kind: "bound" as const,linkId: "33333333-3333-4333-8333-333333333333",whopUserRefHmac: "c".repeat(64),whopUserId: "user_one" };
  const purchase = { offer,payer };
  const collection: PlatformPremiumNativeCurrentAccessCollection = { protocol: "platform_premium_current_paid_access_v1",purchase,
    discovery: "complete",observedAtUtc: at,validUntilUtc: until,members: [] };
  const snapshot = { kind: "snapshot" as const,apiVersion: "platform_premium_authority_v2" as const,ticket,
    policy: { policyRef: "policy",configurationRef: "configuration",guildId: scope.guildId,state: "active" as const,
      generation: 1,offerScopes: [offer],premiumPlanIds: ["plan"],maximumEvidenceAgeMs: 30_000,nativeQualification: q },payer,
    coverage: [{ kind: "unknown" as const,offer,reason: "missing" }],complimentary: { kind: "none" as const },retiredSubjectFacts: [] };
  const proof = () => new PlatformPremiumWhopCurrentAccessPreparation({ qualification: q,decodeHydrated: () => collection })
    .prepare({ purchase,hydrated: {},observedAtUtc: at,validUntilUtc: until,maximumEvidenceAgeMs: 30_000,expectedQualification: q });
  const captureV2 = vi.fn(() => { expect(inWriter).toBe(true);return snapshot; });
  const isCurrentV2 = vi.fn(() => current);
  const nativePurchaseV2 = vi.fn(() => { expect(inWriter).toBe(true);return { kind: "purchase" as const,purchase }; });
  const recordWhopCurrentAccess = vi.fn(() => { expect(inWriter).toBe(true);return { kind: "recorded" as const }; });
  const prepare = vi.fn(async () => { expect(inWriter).toBe(false);return proof(); });
  const input = { guildId: scope.guildId,offer,provider: { qualification: q,assertCurrent: vi.fn(),prepare },
    producer: { captureV2,isCurrentV2,nativePurchaseV2,recordWhopCurrentAccess,
      resolveUserAuthority: () => ({ kind: "linked" as const,authorityKey: scope.authorityKey }) },
    writer: { isCurrentWriter: () => inWriter,run: <T>(operation: () => T): T => {
      expect(inWriter).toBe(false);inWriter = true;try { return operation(); } finally { inWriter = false; }
    } },nowUtc: () => now,createObservationRef: () => "observation_ref",
    readKnownMembershipIds: vi.fn(() => ["mem_known"]),readVerifiedNativeSubject: () => "user_one" };
  return { input,snapshot,collection,ticket,proof,scope,setCurrent: (value: boolean) => { current = value; },
    setNow: (value: string) => { now = value; } };
}
it("hydrates outside SQLite and persists the original V2 ticket without recapturing it",async () => {
  const f = fixture();await createPartnerAlertPremiumWhopRefresh(f.input)(f.scope.authorityKey);
  expect(f.input.producer.captureV2).toHaveBeenCalledTimes(1);
  expect(f.input.producer.nativePurchaseV2).toHaveBeenCalledWith(f.ticket,"premium_scope","user_one");
  expect(f.input.provider.prepare).toHaveBeenCalledWith({ purchase: f.collection.purchase,knownMembershipIds: ["mem_known"] });
  expect(f.input.producer.recordWhopCurrentAccess).toHaveBeenCalledWith(f.ticket,"observation_ref",
    expect.objectContaining({ kind: "prepared_native_current_paid_access" }));
});
it.each(["generation changed","unqualified read","forged receipt","expired response","artifact changed"])(
  "holds instead of persisting or reusing paid evidence after %s",async kind => {
    const f = fixture();f.input.provider.prepare.mockImplementation(async () => {
      if (kind === "generation changed") f.setCurrent(false);
      if (kind === "expired response") f.setNow(until);
      if (kind === "artifact changed") f.input.provider.assertCurrent.mockImplementation(() => { throw new Error("artifact changed"); });
      const proof = f.proof();
      if (kind === "unqualified read") return { kind: "unqualified",reason: "coverage_invalid" } as ReturnType<typeof f.proof>;
      if (kind === "forged receipt") return structuredClone(proof);
      return proof;
    });
    await expect(createPartnerAlertPremiumWhopRefresh(f.input)(f.scope.authorityKey)).rejects.toThrow();
    expect(f.input.producer.recordWhopCurrentAccess).not.toHaveBeenCalled();
    expect(f.input.producer.captureV2).toHaveBeenCalledTimes(1);
  });
it.each(["wrong qualifier","second scope","wrong guild","unknown payer","invalid known IDs"])(
  "refuses %s before provider I/O",async kind => {
    const f = fixture();
    if (kind === "wrong qualifier") f.snapshot.policy.nativeQualification = { ...f.snapshot.policy.nativeQualification,reviewRef: "other" };
    if (kind === "second scope") f.snapshot.policy.offerScopes.push({ ...f.input.offer,scopeRef: "other_scope" });
    if (kind === "wrong guild") f.snapshot.ticket.scope.guildId = "99999";
    if (kind === "unknown payer") f.input.producer.nativePurchaseV2.mockReturnValue({ kind: "unbound" } as never);
    if (kind === "invalid known IDs") f.input.readKnownMembershipIds.mockReturnValue(["foreign"]);
    await expect(createPartnerAlertPremiumWhopRefresh(f.input)(f.scope.authorityKey)).rejects.toThrow();
    expect(f.input.provider.prepare).not.toHaveBeenCalled();expect(f.input.producer.recordWhopCurrentAccess).not.toHaveBeenCalled();
  });
it("reuses a fresh admitted observation without appending a new row",async () => {
  const f = fixture();f.snapshot.coverage = [{ kind: "native_coverage",offer: f.input.offer,
    collection: f.collection,observationRef: "prior_observation" }] as never;
  await createPartnerAlertPremiumWhopRefresh(f.input)(f.scope.authorityKey);
  expect(f.input.provider.prepare).not.toHaveBeenCalled();expect(f.input.producer.recordWhopCurrentAccess).not.toHaveBeenCalled();
});
it("refreshes an observation approaching expiry rather than extending its lifetime",async () => {
  const f = fixture();f.snapshot.coverage = [{ kind: "native_coverage",offer: f.input.offer,
    collection: f.collection,observationRef: "prior_observation" }] as never;
  f.setNow("2026-11-17T20:00:20.000Z");await createPartnerAlertPremiumWhopRefresh(f.input)(f.scope.authorityKey);
  expect(f.input.provider.prepare).toHaveBeenCalledOnce();expect(f.input.producer.recordWhopCurrentAccess).toHaveBeenCalledOnce();
  expect(f.collection.validUntilUtc).toBe(until);
});

it("does not capture or hydrate an already cancelled buyer request",async () => {
  const f = fixture(),controller = new AbortController();controller.abort();
  await expect(createPartnerAlertPremiumWhopRefresh({ ...f.input,signal: controller.signal })(f.scope.authorityKey)).rejects.toThrow();
  expect(f.input.producer.captureV2).not.toHaveBeenCalled();
  expect(f.input.provider.prepare).not.toHaveBeenCalled();
  expect(f.input.producer.recordWhopCurrentAccess).not.toHaveBeenCalled();
});

it("propagates buyer cancellation to hydration and refuses its late receipt",async () => {
  const f = fixture(),controller = new AbortController();
  f.input.provider.prepare.mockImplementation(async () => { controller.abort();return f.proof(); });
  await expect(createPartnerAlertPremiumWhopRefresh({ ...f.input,signal: controller.signal })(f.scope.authorityKey)).rejects.toThrow();
  expect(f.input.provider.prepare).toHaveBeenCalledWith({ purchase: f.collection.purchase,
    knownMembershipIds: ["mem_known"],signal: controller.signal });
  expect(f.input.producer.recordWhopCurrentAccess).not.toHaveBeenCalled();
});

it("does not retain a request token when actual self issuance refuses an unqualified image",async () => {
  const f = fixture();
  vi.stubEnv("TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE","enabled");
  try {
    const binding = createPartnerAlertPremiumWhopRequestSubscriberBinding({ ...f.input,database: {} as never,
      request: new Request("https://isolated.example.invalid/partner-channels"),
      pins: { origin: "https://isolated.example.invalid",sourceCommit: "a".repeat(40),sourceVectorSha256: "b".repeat(64),
        schemaSha256: "c".repeat(64),buildId: "unit",artifactSha256: "d".repeat(64) } });
    await expect(binding.refreshPremium(f.scope.authorityKey)).rejects.toThrow();
    expect(f.input.producer.recordWhopCurrentAccess).toHaveBeenCalledWith(f.ticket,"observation_ref",expect.anything());
    expect(f.input.producer.captureV2).toHaveBeenCalledTimes(2);
    expect(binding.runtimeAuthority.current()).toBeNull();binding.clear();
    expect(binding.runtimeAuthority.current()).toBeNull();
  } finally { vi.unstubAllEnvs(); }
});


it("keeps the realm binding empty until actual owner issuance succeeds after native persistence",async () => {
  const f = fixture();
  vi.stubEnv("TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE","enabled");
  try {
    const binding = createPartnerAlertPremiumWhopSubscriberBinding({ ...f.input,database: {} as never,
      ownerRequest: new Request("https://isolated.example.invalid/owner-case",{ method: "POST",headers: { origin: "https://isolated.example.invalid" } }),
      pins: { origin: "https://isolated.example.invalid",sourceCommit: "a".repeat(40),sourceVectorSha256: "b".repeat(64),
        schemaSha256: "c".repeat(64),buildId: "unit",artifactSha256: "d".repeat(64) } });
    expect(binding.runtimeAuthority.current()).toBeNull();expect(f.input.provider.prepare).not.toHaveBeenCalled();
    await expect(binding.refreshPremium(f.scope.authorityKey)).rejects.toThrow();
    // New consumption capture does not replace the original hydration ticket.
    expect(f.input.producer.recordWhopCurrentAccess).toHaveBeenCalledWith(f.ticket,"observation_ref",expect.anything());
    expect(f.input.producer.captureV2).toHaveBeenCalledTimes(2);
    expect(binding.runtimeAuthority.current()).toBeNull();binding.clear();expect(binding.runtimeAuthority.current()).toBeNull();
  } finally { vi.unstubAllEnvs(); }
});
