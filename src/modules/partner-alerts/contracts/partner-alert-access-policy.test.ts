// @vitest-environment node
import { describe, expect, it } from "vitest";
import { checkPartnerAlertSubscriberAccess } from "../server/partner-alert-subscriber-access";
import { preparePartnerAlertStripeCheckoutEligibility } from "../server/partner-alert-stripe-checkout-eligibility";
import { createPartnerAlertWhopUserReference } from "../server/partner-alert-credentials";
import { normalizePartnerAlertWhopMembership } from "../server/partner-alert-whop-normalization";
import { evaluatePartnerAlertActivationReadiness, evaluatePartnerAlertChannelAccess, planPartnerAlertRoleChanges, type PartnerAlertAccessInput } from "./partner-alert-access-policy";

import { userId, communityId, mappingId, offerId, guildId, discordUserId, roleId, observedAtUtc, nowUtc, qualifiedPaidInput } from "./partner-alert-access-policy.test-fixture";

describe("Partner Channel paid eligibility", () => {
  it("allows only the fully qualified dual-paid baseline", () => {
    expect(evaluatePartnerAlertChannelAccess(qualifiedPaidInput())).toMatchObject({
      allowed: true, desiredRole: "present", reason: "allowed",
    });
  });

  it("denies access when paid Premium is present but no Whop subscription is found", () => {
    const base = qualifiedPaidInput();
    expect(evaluatePartnerAlertChannelAccess({ ...base, memberships: [], previousCommunityPaidThroughUtc: null }))
      .toMatchObject({ allowed: false, desiredRole: "absent", reason: "subscription_required" });
  });

  it("accepts either paid provider and holds removal while a Stripe loss is being reviewed", () => {
    const base = qualifiedPaidInput();
    const stripeFunding = { paidOffers: [{ offerId, offerVersion: 1, paidThroughUtc: "2026-11-02T12:04:00.000Z" }],
      holdRemoval: false };
    expect(evaluatePartnerAlertChannelAccess({ ...base, stripeFunding, whopUserRef: null,
      partnerWhopAccountIds: [], memberships: [] })).toMatchObject({
      allowed: true, desiredRole: "present", validUntilUtc: "2026-11-02T12:04:00.000Z",
    });
    expect(evaluatePartnerAlertChannelAccess({ ...base, stripeFunding, premium: null }))
      .toMatchObject({ allowed: false, desiredRole: "hold", reason: "premium_unverified" });
    const awaitingReview = { paidOffers: [], holdRemoval: true };
    expect(evaluatePartnerAlertChannelAccess({ ...base, stripeFunding: awaitingReview, memberships: [] }))
      .toMatchObject({ allowed: false, desiredRole: "hold", reason: "subscription_unverified" });
    expect(evaluatePartnerAlertChannelAccess({ ...base, stripeFunding: awaitingReview }))
      .toMatchObject({ allowed: true, desiredRole: "present", qualifyingMembershipIds: ["mem_paid"] });
    expect(evaluatePartnerAlertChannelAccess({ ...base, stripeFunding: { paidOffers: [], holdRemoval: false }, memberships: [] }))
      .toMatchObject({ allowed: false, desiredRole: "absent", reason: "subscription_required" });
  });

  it("denies access when the Whop subscription is current but Premium evidence is absent", () => {
    const base = qualifiedPaidInput();
    expect(evaluatePartnerAlertChannelAccess({ ...base, premium: null }))
      .toMatchObject({ allowed: false, desiredRole: "hold", reason: "premium_unverified" });
  });

  it("uses only a fresh scoped Whop loss, while preserving Stripe coverage or review", () => {
    const base = qualifiedPaidInput();
    const loss = { observedAtUtc: nowUtc, validUntilUtc: "2026-11-02T12:00:30.000Z", kind: "absent" as const, retainedOffers: [] };
    const input = { ...base, membershipDiscovery: "unknown" as const,
      communityCoverageQualification: { kind: "unqualified" as const }, memberships: [], whopUserRef: null,
      existingWhopAccess: loss, stripeFunding: { paidOffers: [], holdRemoval: false } };
    expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({ desiredRole: "absent", validUntilUtc: loss.validUntilUtc });
    expect(evaluatePartnerAlertChannelAccess({ ...input, nowUtc: loss.validUntilUtc }))
      .toMatchObject({ desiredRole: "hold" });
    expect(evaluatePartnerAlertChannelAccess({ ...input, stripeFunding: { paidOffers: [], holdRemoval: true } }))
      .toMatchObject({ desiredRole: "hold" });
    expect(evaluatePartnerAlertChannelAccess({ ...input, stripeFunding: { holdRemoval: false,
      paidOffers: [{ offerId, offerVersion: 1, paidThroughUtc: "2026-11-02T12:04:00.000Z" }] } }))
      .toMatchObject({ desiredRole: "present" });
  });

  it("qualifies a Stripe checkout only for the current paid trader without selected offer access", async () => {
    const base = qualifiedPaidInput();
    const target = { userId, communityId, offerId, offerVersion: 1, mappingIds: [mappingId] };
    let current = true;
    let input: PartnerAlertAccessInput = base;
    const authority = {
      inCurrentWriter: <T>(apply: () => T) => apply(),
      isCurrent: () => current,
      async refresh() {
        return { input, ticket: base.ticket, authorityRevision: 1, linkedDiscordUserId: discordUserId, previousDiscordUserIds: [] };
      },
    };
    const prepare = () => preparePartnerAlertStripeCheckoutEligibility(target, authority, () => nowUtc);
    await expect(prepare()).rejects.toThrow("could not be confirmed");
    input = { ...base, memberships: [], premium: null };
    await expect(prepare()).rejects.toThrow("could not be confirmed");
    input = { ...base, memberships: [] };
    const recheck = await prepare();
    expect(recheck).not.toThrow();
    current = false;
    expect(recheck).toThrow("eligibility changed");
  });

  it.each(["stripe", "whop", "expired", "unknown"] as const)(
    "identifies only current overlapping package coverage from %s evidence", async provider => {
      const base = qualifiedPaidInput();
      const secondMappingId = "33333333-3333-4333-8333-333333333334";
      const secondRoleId = "810000000000000004";
      const target = { userId, communityId, offerId: "44444444-4444-4444-8444-444444444445",
        offerVersion: 1, mappingIds: [mappingId, secondMappingId] };
      const authority = {
        inCurrentWriter: <T>(apply: () => T) => apply(),
        isCurrent: () => true,
        async refresh(scope: { mappingId: string }) {
          const first = scope.mappingId === mappingId;
          const ticket = { ...base.ticket, context: { ...base.ticket.context, mappingId: scope.mappingId,
            roleId: first ? roleId : secondRoleId } };
          const another = { offerId, offerVersion: 1 };
          const input: PartnerAlertAccessInput = { ...base, ticket, mappingId: scope.mappingId, memberships: [],
            premium: { ...base.premium!, ticket: ticket.premium },
            mappings: [...base.mappings, { ...base.mappings[0], mappingId: secondMappingId, destinationRoleId: secondRoleId }],
            stripeFunding: { holdRemoval: false, stripeOnlyOffers: [target],
              paidOffers: first && provider === "stripe" ? [{ ...another, paidThroughUtc: "2026-11-02T12:04:00.000Z" }] : [] },
            existingWhopAccess: first && provider !== "stripe" ? { kind: provider === "unknown" ? "unknown" : "retained",
              observedAtUtc: nowUtc, validUntilUtc: provider === "expired" ? nowUtc : "2026-11-02T12:00:30.000Z",
              retainedOffers: provider === "unknown" ? [] : [another] } : undefined };
          return { input, ticket, authorityRevision: 1, linkedDiscordUserId: discordUserId, previousDiscordUserIds: [] };
        },
      };
      const recheck = await preparePartnerAlertStripeCheckoutEligibility(target, authority, () => nowUtc);
      expect(recheck()).toEqual(provider === "stripe" || provider === "whop" ? [mappingId] : []);
    },
  );

  it("denies paid evidence for a different version of the same offer", () => {
    const base = qualifiedPaidInput();
    expect(evaluatePartnerAlertChannelAccess({ ...base,
      memberships: [{ ...base.memberships[0]!, offerVersion: 2 }], previousCommunityPaidThroughUtc: null }))
      .toMatchObject({ allowed: false });
  });

  it.each(["trial", "complimentary"] as const)("rejects active %s community coverage as unpaid", basis => {
    const base = qualifiedPaidInput();
    const coverageKind = basis === "complimentary" ? "free" : "trial";
    const input: PartnerAlertAccessInput = { ...base, memberships: [{ ...base.memberships[0]!, basis,
      paidCoverage: { ...base.memberships[0]!.paidCoverage!, membershipAccessKind: coverageKind,
        paymentCoverageKind: coverageKind } }] };
    expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({
      allowed: false, desiredRole: "absent", reason: "subscription_required",
    });
  });

  it("does not treat complimentary Premium or admin-style access as paid Premium", () => {
    const base = qualifiedPaidInput();
    const input: PartnerAlertAccessInput = { ...base,
      premium: { ...base.premium!, basis: "unknown", paidThroughUtc: null } };
    expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({
      allowed: false, desiredRole: "hold", reason: "premium_unverified",
    });
  });

  it("removes Partner access for a confirmed ended paid Premium term", () => {
    const base = qualifiedPaidInput();
    const input: PartnerAlertAccessInput = { ...base,
      premium: { ...base.premium!, state: "inactive", basis: "none", paidThroughUtc: null } };
    expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({
      allowed: false, desiredRole: "absent", reason: "premium_required",
    });
  });

  it("allows an independent paid community purchase when a complimentary membership also exists", () => {
    const base = qualifiedPaidInput();
    const complimentary = { ...base.memberships[0]!, membershipId: "mem_gift", basis: "complimentary" as const,
      paidCoverage: { ...base.memberships[0]!.paidCoverage!, membershipAccessKind: "free" as const,
        paymentCoverageKind: "free" as const } };
    const input: PartnerAlertAccessInput = { ...base, memberships: [complimentary, base.memberships[0]!] };
    expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({
      allowed: true, desiredRole: "present", reason: "allowed",
      qualifyingMembershipIds: ["mem_paid"],
    });
  });

  it("does not let an active complimentary community membership extend ended paid coverage", () => {
    const base = qualifiedPaidInput();
    const complimentary = { ...base.memberships[0]!, membershipId: "mem_gift", basis: "complimentary" as const,
      paidCoverage: { ...base.memberships[0]!.paidCoverage!, membershipAccessKind: "free" as const,
        paymentCoverageKind: "free" as const } };
    const endedPaid = { ...base.memberships[0]!, state: "inactive" as const,
      validUntilUtc: "2026-11-02T12:10:00.000Z",
      paidCoverage: { ...base.memberships[0]!.paidCoverage!, endsAtUtc: "2026-11-02T11:59:59.000Z" } };
    const input: PartnerAlertAccessInput = { ...base, previousCommunityPaidThroughUtc: "2026-11-02T11:59:59.000Z",
      memberships: [complimentary, endedPaid] };
    expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({
      allowed: false, desiredRole: "absent", reason: "subscription_required",
    });
  });

  it("holds a Whop role through failed renewal and removes only that role after a fresh terminal read", () => {
    const base = qualifiedPaidInput();
    const offer = base.offers[0]!.offer;
    const identityKeyBase64 = Buffer.alloc(32, 7).toString("base64");
    const whopUserRef = createPartnerAlertWhopUserReference({ environment: "live", whopUserId: "user_buyer", identityKeyBase64 });
    const endedAt = "2026-11-02T11:59:59.000Z";
    const unrelatedRole = "810000000000000004";
    const membership = (status: string, periodEnd: string | null) => normalizePartnerAlertWhopMembership({
      native: { id: "mem_paid", user_id: "user_buyer", account: { id: offer.whop.accountId },
        product: { id: offer.whop.productId }, product_id: offer.whop.productId, variant_id: offer.whop.planId,
        status, current_period_start: "2026-10-02T12:00:00.000Z", current_period_end: periodEnd, expires_at: periodEnd },
      userId, verifiedWhopUserRef: whopUserRef, offer, identityKeyBase64, payment: null,
      refundPolicy: "full_refund_revokes", disputePolicy: "withhold_observed_dispute", nowUtc, maximumEvidenceAgeMs: 60_000,
    });
    const facts = { ...base, whopUserRef, previousCommunityPaidThroughUtc: endedAt };
    const plan = (decision: ReturnType<typeof evaluatePartnerAlertChannelAccess>) =>
      planPartnerAlertRoleChanges({ decisions: [decision], observedRoleIds: [roleId, unrelatedRole], nowUtc });

    for (const status of ["past_due", "unresolved", "active"]) {
      const evidence = membership(status, endedAt);
      expect(evidence).toMatchObject({ state: "unknown", basis: "unknown" });
      const decision = evaluatePartnerAlertChannelAccess({ ...facts, memberships: [evidence] });
      expect(decision).toMatchObject({ allowed: false, desiredRole: "hold", reason: "subscription_unverified" });
      expect(plan(decision)).toEqual([]);
    }

    for (const status of ["canceled", "expired"]) {
      const evidence = membership(status, null);
      expect(evidence).toMatchObject({ state: "inactive", validUntilUtc: "2026-11-02T12:01:00.000Z" });
      const decision = evaluatePartnerAlertChannelAccess({ ...facts, memberships: [evidence] });
      expect(decision).toMatchObject({ allowed: false, desiredRole: "absent", reason: "subscription_required" });
      expect(plan(decision)).toEqual([{ roleId, action: "remove", mappingIds: [mappingId] }]);
      expect(plan(evaluatePartnerAlertChannelAccess({ ...facts, memberships: [evidence, {
        ...base.memberships[0]!, membershipId: "mem_renewed", whopUserRef,
      }] }))).toEqual([]);
    }
  });

  it("rejects sandbox policy even when every supplied fact says paid", () => {
    const base = qualifiedPaidInput();
    const input: PartnerAlertAccessInput = { ...base, policy: { ...base.policy, environment: "sandbox" } };
    expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({
      allowed: false, desiredRole: "hold", reason: "invalid_evidence",
    });
  });

  it("holds access when native paid-coverage qualification is missing", () => {
    const base = qualifiedPaidInput();
    const membership = { ...base.memberships[0]! };
    delete membership.paidCoverage;
    const input: PartnerAlertAccessInput = { ...base, memberships: [membership] };
    expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({
      allowed: false, desiredRole: "hold", reason: "subscription_unverified",
    });
  });
});

describe("Partner Channel subscriber HTTP response", () => {
  it.each([
    ["both paid", 200],
    ["missing Premium", 503],
    ["missing Whop", 403],
    ["wrong offer version", 403],
    ["stale ticket", 503],
    ["unbound authority", 503],
    ["role present", 200],
    ["role revoked", 200],
    ["wrong Discord subject", 503],
    ["stale role query", 503],
  ] as const)("returns the expected status for %s", async (scenario, status) => {
    const base = qualifiedPaidInput();
    const input: PartnerAlertAccessInput = {
      ...base,
      premium: scenario === "missing Premium" ? null : base.premium,
      memberships: scenario === "missing Whop" ? [] : scenario === "wrong offer version"
        ? [{ ...base.memberships[0]!, offerVersion: 2 }] : base.memberships,
    };
    const request = new Request("http://127.0.0.1:3038/access", {
      method: "POST",
      headers: { host: "127.0.0.1:3038", origin: "http://127.0.0.1:3038",
        "sec-fetch-site": "same-origin", "x-traderlink-platform-mutation": "1" },
    });
    const destinations = [{ name: "Verified alerts", guildId, channelId: "1550000000000001234" }];
    let destinationReads = 0;
    const response = await checkPartnerAlertSubscriberAccess(request,
      () => ({ userId, communityId, offerId, offerVersion: 1, mappingIds: [mappingId] }),
      scenario === "unbound authority" ? null : {
        refresh: async () => ({ ticket: input.ticket, input, authorityRevision: 1,
          linkedDiscordUserId: discordUserId, previousDiscordUserIds: [] }),
        isCurrent: () => scenario !== "stale ticket",
        inCurrentWriter: operation => operation(),
      }, () => nowUtc, ["role present", "role revoked", "wrong Discord subject", "stale role query"].includes(scenario)
        ? async () => ({ guildId, discordUserId: scenario === "wrong Discord subject" ? roleId : discordUserId,
          roleIds: scenario === "role revoked" ? [] : [roleId],
          observedAtUtc: scenario === "stale role query" ? observedAtUtc : nowUtc,
          validUntilUtc: scenario === "stale role query" ? nowUtc : "2026-11-02T12:00:20.000Z" })
        : undefined, contexts => {
          destinationReads++;
          expect(contexts).toEqual([input.ticket.context]);
          return destinations;
        });
    expect(destinationReads).toBe(scenario === "role present" ? 1 : 0);
    if (scenario === "role present") expect(await response.json()).toEqual({
      ok: true, code: "subscribed", result: { access: "subscribed", destinations },
    });
    if (scenario === "role revoked") expect(await response.json()).toEqual({ ok: true, code: "eligible" });
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});

describe("Fee-free Partner Channel activation readiness", () => {
  const ready = {
    partnerState: "setup_required", reviewRequested: false,
    approvedApplicationRevision: 5, inspectedApplicationRevision: 5,
    currentRulesConsent: true, discordSetupVerified: true,
    approvedOffersVerified: true, subscriberAccessQualified: true,
  } as const;

  it("is ready without publisher payment or an existing subscriber purchase", () => {
    expect(evaluatePartnerAlertActivationReadiness(ready)).toBe("ready");
  });

  it.each([
    [{ partnerState: "suspended" }, "partner_state"],
    [{ reviewRequested: true }, "application_required"],
    [{ approvedApplicationRevision: null }, "application_required"],
    [{ inspectedApplicationRevision: 4 }, "application_required"],
    [{ currentRulesConsent: false }, "application_required"],
    [{ discordSetupVerified: false }, "discord_setup_required"],
    [{ approvedOffersVerified: false }, "offer_verification_required"],
    [{ subscriberAccessQualified: false }, "subscriber_access_unqualified"],
  ] as const)("blocks activation for %j", (change, reason) => {
    expect(evaluatePartnerAlertActivationReadiness({ ...ready, ...change })).toBe(reason);
  });
});


it("uses qualified current paid Premium freshness without fabricating a billing period", () => {
  const base = qualifiedPaidInput();
  const premium = { ...base.premium!,basis: "current_provider_access" as const,state: "active" as const,
    paidThroughUtc: null,providerRealm: "live" as const,validUntilUtc: "2026-11-02T12:00:30.000Z" };
  const input = { ...base,premium };
  expect(evaluatePartnerAlertChannelAccess(input)).toMatchObject({ allowed: true,desiredRole: "present",validUntilUtc: premium.validUntilUtc });
  expect(evaluatePartnerAlertChannelAccess({ ...input,nowUtc: premium.validUntilUtc }))
    .toMatchObject({ allowed: false,desiredRole: "hold",reason: "premium_unverified" });
  expect(evaluatePartnerAlertChannelAccess({ ...input,premium: { ...premium,providerRealm: "sandbox" } }))
    .toMatchObject({ allowed: false,desiredRole: "hold",reason: "premium_unverified" });
  expect(evaluatePartnerAlertChannelAccess({ ...input,premium: { ...premium,paidThroughUtc: "2026-12-01T00:00:00.000Z" } as never }))
    .toMatchObject({ allowed: false,desiredRole: "hold",reason: "premium_unverified" });
  expect(base.premium!.paidThroughUtc).not.toBeNull();
});
it("applies the same Premium freshness gate before a new Stripe checkout", async () => {
  const base = qualifiedPaidInput();
  let now = base.nowUtc;
  const input = { ...base,memberships: [],premium: { ...base.premium!,basis: "current_provider_access" as const,state: "active" as const,
    paidThroughUtc: null,providerRealm: "live" as const,validUntilUtc: "2026-11-02T12:00:30.000Z" } };
  const authority = { inCurrentWriter: <T>(operation: () => T) => operation(),isCurrent: () => true,
    refresh: async () => ({ input,ticket: base.ticket,authorityRevision: 1,linkedDiscordUserId: discordUserId,previousDiscordUserIds: [] }) };
  const recheck = await preparePartnerAlertStripeCheckoutEligibility({ userId,communityId,offerId,offerVersion: 1,mappingIds: [mappingId] },authority,() => now);
  expect(recheck).not.toThrow();now = input.premium.validUntilUtc;expect(recheck).toThrow();
});
