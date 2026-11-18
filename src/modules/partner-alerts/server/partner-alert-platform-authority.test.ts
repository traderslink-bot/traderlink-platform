// @vitest-environment node
import { expect, it, vi } from "vitest";
import { PartnerAlertCombinedRoleAuthority, createPartnerAlertPaidAuthority } from "./partner-alert-platform-authority";

it("does not open paid authority until the writer and readers are explicitly supplied", async () => {
  expect(createPartnerAlertPaidAuthority(null)).toBeNull();
  const captureV2 = vi.fn(() => ({ kind: "unbound" as const, reason: "unready" }));
  const binding = {
    enabled: false, guildId: "810000000000000001", paidRoleId: "810000000000000002",
    complimentaryRoleId: null, nowUtc: () => "2026-11-14T22:00:00.000Z",
    producer: { captureV2, isCurrentV2: () => false, resolveUserAuthority: () => ({ kind: "unbound" as const }) },
    writer: { run: <T>(operation: () => T) => operation(), isCurrentWriter: () => false },
    history: { readAuthorityHistory: () => ({ previousPaidThroughUtc: null, assignments: [] }) },
    community: { capture: () => ({ kind: "unbound" as const }), isCurrent: () => false },
  };
  expect(createPartnerAlertPaidAuthority(binding)).toBeNull();
  const enabled = createPartnerAlertPaidAuthority({ ...binding, enabled: true });
  expect(enabled).not.toBeNull();
  await expect(enabled!.refresh({ communityId: "11111111-1111-4111-8111-111111111111",
    mappingId: "22222222-2222-4222-8222-222222222222",
    userId: "33333333-3333-4333-8333-333333333333" })).rejects.toThrow();
  expect(captureV2).not.toHaveBeenCalled();
});


it.each(["refresh refused","identity changed","refreshed"])("keeps native hydration outside the writer and rechecks the mapper: %s",async outcome => {
  const authorityKey = "11111111-1111-4111-8111-111111111111";
  let inWriter = false,changed = false;
  const loadCurrent = vi.fn(async () => ({ kind: "unbound" as const }));
  const refresh = vi.fn(async () => {
    expect(inWriter).toBe(false);
    if (outcome === "refresh refused") throw new Error("provider unavailable");
    if (outcome === "identity changed") changed = true;
  });
  const writer = { run: <T>(operation: () => T): T => {
    expect(inWriter).toBe(false);inWriter = true;try { return operation(); } finally { inWriter = false; }
  },isCurrentWriter: () => inWriter };
  const authority = new PartnerAlertCombinedRoleAuthority({ enabled: true,guildId: "12345",nowUtc: () => "2026-11-17T20:00:00.000Z" },
    { loadCurrent,isCurrent: () => true },{ capture: () => ({ kind: "unbound" }),isCurrent: () => false },writer,
    { resolveUserAuthority: () => ({ kind: "linked",authorityKey: changed ? "44444444-4444-4444-8444-444444444444" : authorityKey }) },
    undefined,refresh);
  await expect(authority.refresh({ communityId: "22222222-2222-4222-8222-222222222222",
    mappingId: "33333333-3333-4333-8333-333333333333",userId: "55555555-5555-4555-8555-555555555555" })).rejects.toThrow();
  expect(refresh).toHaveBeenCalledWith(authorityKey);
  if (outcome === "refreshed") expect(loadCurrent).toHaveBeenCalledWith(authorityKey);
  else expect(loadCurrent).not.toHaveBeenCalled();
});

it.each(["paid","unknown","missing","not_paid","sandbox"] as const)(
  "maps current Premium %s without using an expired historical invoice as a removal signal",async state => {
    const { qualifiedPaidInput } = await import("../contracts/partner-alert-access-policy.test-fixture");
    const base = qualifiedPaidInput(),ticket = base.ticket.premium;
    const offer = { scopeRef: "premium_scope",environment: state === "sandbox" ? "sandbox" as const : "live" as const,
      accountId: "biz_premium",productId: "prod_premium",planId: "plan_premium" };
    const purchase = { environment: offer.environment,accountId: offer.accountId,productId: offer.productId,planId: offer.planId,
      whopUserId: "user_buyer" };
    const evidence = state === "paid" || state === "sandbox"
      ? { kind: "current_paid_access" as const,purchase,observedAtUtc: base.nowUtc,validUntilUtc: ticket.validUntilUtc,
        memberships: [{ membershipRef: "mem_premium",paymentRef: "pay_premium" }] }
      : { kind: state === "not_paid" ? "not_paid" as const : "unknown" as const,basis: "current_provider_access" as const,
        purchase,observedAtUtc: base.nowUtc,validUntilUtc: ticket.validUntilUtc,reason: "provider_unavailable" as const };
    const snapshot: import("../../platform/contracts/platform-premium-access").PlatformPremiumSnapshot = {
      apiVersion: "platform_premium_authority_v2",ticket,scope: ticket.scope,authorityRevision: ticket.authorityRevision,
      observedAtUtc: ticket.observedAtUtc,validUntilUtc: ticket.validUntilUtc,paidRoleId: "12349",complimentaryRoleId: null,
      payer: { kind: "bound",linkId: "buyer_link",whopUserRefHmac: "a".repeat(64),whopUserId: purchase.whopUserId },
      coverage: state === "missing" ? [{ kind: "unknown",offer,reason: "native_stale",basis: "current_provider_access" }]
        : [{ kind: "evidence",offer,evidence }],complimentary: { kind: "none" },retiredSubjects: [],
      assignmentReview: { kind: "reviewed",reviewRef: "review",actorUserId: "reviewer",paidRoleDisposition: "paid_only",
        reviewedAtUtc: base.nowUtc },previousPaidThroughUtc: "2026-11-01T00:00:00.000Z",
    };
    let inWriter = false;
    const writer = { run: <T>(operation: () => T): T => { inWriter = true;try { return operation(); } finally { inWriter = false; } },
      isCurrentWriter: () => inWriter };
    const authority = new PartnerAlertCombinedRoleAuthority({ enabled: true,guildId: ticket.scope.guildId,nowUtc: () => base.nowUtc },
      { loadCurrent: async () => ({ kind: "snapshot",snapshot }),isCurrent: () => true },
      { capture: () => ({ kind: "snapshot",ticket: base.ticket.context,input: base,previousDiscordUserIds: [] }),isCurrent: () => true },
      writer,{ resolveUserAuthority: () => ({ kind: "linked",authorityKey: ticket.scope.authorityKey }) });
    const result = await authority.refresh({ userId: base.userId,communityId: base.communityId,mappingId: base.mappingId });
    if (state === "paid") expect(result.input.premium).toMatchObject({ state: "active",basis: "current_provider_access",
      paidThroughUtc: null,providerRealm: "live" });
    else if (state === "not_paid") expect(result.input.premium).toMatchObject({ state: "inactive",basis: "none",paidThroughUtc: null });
    else expect(result.input.premium).toMatchObject({ state: "unknown",basis: "unknown",paidThroughUtc: null });
  });
