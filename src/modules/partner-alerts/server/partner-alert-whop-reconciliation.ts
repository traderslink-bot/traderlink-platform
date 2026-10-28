import { PartnerAlertValidationError, type PartnerAlertMembershipEvidence, type PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import { parsePartnerAlertOffer, partnerAlertId, partnerAlertInteger, partnerAlertRecord, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PartnerAlertWhopReadError, type PartnerAlertWhopReadClient } from "./partner-alert-whop-client";
import { normalizePartnerAlertWhopAccount, normalizePartnerAlertWhopOffer, normalizePartnerAlertWhopMembership,
  normalizePartnerAlertWhopPayment, type PartnerAlertWhopAccountProof, type PartnerAlertWhopPaymentFact } from "./partner-alert-whop-normalization";

export type PartnerAlertWhopPreparationTarget = Readonly<{
  /** Server-owned target; never accept this shape from a browser or webhook. */
  userId: string; whopUserId: string; verifiedWhopUserRef: string;
  /** Existing purchases must be re-read even when absent from discovery pages. */
  knownMembershipIds: readonly string[];
  offer: PartnerAlertOffer; accountProof: PartnerAlertWhopAccountProof; identityKeyBase64: string;
  /** Claims only. This service cannot prove current identity/erasure provenance. */
  claimedGenerations: Readonly<{ identity: number; connection: number; erasure: number }>;
  policy: Readonly<{ maximumEvidenceAgeMs: number; allowConfiguredTrial: boolean;
    membershipReadAuthorised: boolean; eventsAuthorised: boolean; disputeReadAuthorised: boolean;
    refundPolicy: "any_refund_revokes" | "full_refund_revokes"; disputePolicy: "withhold_observed_dispute" }>;
}>;
export type PartnerAlertWhopPreparationLimits = Readonly<{
  membershipPages: number; membershipCount: number; paymentPagesPerMembership: number;
  paymentsPerMembership: number; totalReads: number; maximumElapsedMs: number;
}>;
type ReadClient = Pick<PartnerAlertWhopReadClient, "retrieveAccount" | "retrieveVariant" | "listMemberships"
  | "retrieveMembership" | "listMembershipPayments" | "retrievePayment">;
type PreparationReason = "target_invalid" | "scope_changed" | "authorisation_unavailable" | "provider_unavailable"
  | "native_shape_unqualified" | "read_budget" | "elapsed_budget" | "clock_invalid" | "discovery_limit"
  | "pagination_incomplete" | "pagination_changed" | "payment_limit" | "ambiguous_receipts" | "trial_not_approved";
export type PartnerAlertWhopPreparedMember = Readonly<{ kind: "prepared"; membershipId: string;
  evidence: PartnerAlertMembershipEvidence; paymentIds: readonly string[] }>
  | Readonly<{ kind: "needs_review"; membershipId: string; reason: PreparationReason }>;
const QUALIFICATION = Object.freeze([
  "authenticated_current_whop_identity_and_complete_server_owned_target",
  "actual_get_client_environment_account_and_credential_binding",
  "current_identity_connection_and_erasure_generation_fence",
  "current_reviewed_offer_and_policy_and_per_merchant_read_coordination",
  "transactional_fact_application_and_inbox_lease_fencing",
] as const);
export type PartnerAlertWhopPreparation = Readonly<{
  status: "disabled" | "prepared" | "incomplete" | "unavailable" | "review_required";
  canApply: false;
  provenance: "current_runtime_unbound";
  requiresRuntimeQualification: typeof QUALIFICATION;
  discoveryComplete: boolean;
  discoveredMembershipCount: number;
  members: readonly PartnerAlertWhopPreparedMember[];
  issues: readonly PreparationReason[];
  readCount: number;
  startedAtUtc: string | null;
  finishedAtUtc: string | null;
  context: Readonly<{ userId: string; communityId: string; offerId: string; offerVersion: number;
    environment: "sandbox" | "live"; accountId: string;
    claimedGenerations: PartnerAlertWhopPreparationTarget["claimedGenerations"] }> | null;
}>;
class PreparationStop extends Error {
  constructor(readonly reason: PreparationReason) { super("Whop preparation needs verification."); }
}
function resource(value: unknown, prefix: string): string {
  if (typeof value !== "string" || value.length > 128 || !value.startsWith(prefix)
    || value.length <= prefix.length || !/^[A-Za-z0-9_]+$/u.test(value)) throw new PreparationStop("target_invalid");
  return value;
}
function reason(error: unknown): PreparationReason {
  if (error instanceof PreparationStop) return error.reason;
  if (error instanceof PartnerAlertWhopReadError) return error.kind === "authorisation" ? "authorisation_unavailable"
    : error.kind === "scope" ? "scope_changed" : error.kind === "shape" ? "native_shape_unqualified" : "provider_unavailable";
  return error instanceof PartnerAlertValidationError ? "native_shape_unqualified" : "provider_unavailable";
}
class ReadBudget {
  readonly startedAtUtc: string;
  count = 0;
  private last: string;
  constructor(private readonly limits: PartnerAlertWhopPreparationLimits, private readonly clock: () => string) {
    try { this.startedAtUtc = partnerAlertUtc(clock(), "nowUtc"); }
    catch { throw new PreparationStop("clock_invalid"); }
    this.last = this.startedAtUtc;
  }
  now(): string {
    let at: string;
    try { at = partnerAlertUtc(this.clock(), "nowUtc"); }
    catch { throw new PreparationStop("clock_invalid"); }
    if (at < this.last) throw new PreparationStop("clock_invalid");
    this.last = at; return at;
  }
  async read<T>(operation: () => Promise<T>): Promise<Readonly<{ value: T; observedAtUtc: string }>> {
    const at = this.now();
    if (this.count >= this.limits.totalReads) throw new PreparationStop("read_budget");
    if (Date.parse(at) - Date.parse(this.startedAtUtc) >= this.limits.maximumElapsedMs) throw new PreparationStop("elapsed_budget");
    this.count += 1;
    const value = await operation();
    if (Date.parse(this.now()) - Date.parse(this.startedAtUtc) >= this.limits.maximumElapsedMs) throw new PreparationStop("elapsed_budget");
    // Read-start time avoids making a slow provider response artificially fresh.
    return { value, observedAtUtc: at };
  }
}

/** Dormant bounded preparation only. No DB, persistence, current-module imports,
 * client construction, config loading, schedule, route or payment write. The
 * injected GET client is called ONLY by an explicit enabled prepare() invocation.
 * Prepared native content is never authority to apply facts or grant a role. */
export class PartnerAlertWhopReconciliation {
  private readonly limits: PartnerAlertWhopPreparationLimits;
  constructor(private readonly client: ReadClient, private readonly configuration: Readonly<{
    enabled: boolean; nowUtc: () => string; limits: PartnerAlertWhopPreparationLimits;
  }>) {
    const value = configuration.limits;
    this.limits = Object.freeze({
      membershipPages: partnerAlertInteger(value.membershipPages, "membershipPages", 1, 10),
      membershipCount: partnerAlertInteger(value.membershipCount, "membershipCount", 1, 250),
      paymentPagesPerMembership: partnerAlertInteger(value.paymentPagesPerMembership, "paymentPagesPerMembership", 1, 10),
      paymentsPerMembership: partnerAlertInteger(value.paymentsPerMembership, "paymentsPerMembership", 1, 250),
      totalReads: partnerAlertInteger(value.totalReads, "totalReads", 3, 1000),
      maximumElapsedMs: partnerAlertInteger(value.maximumElapsedMs, "maximumElapsedMs", 1, 300_000),
    });
  }
  private target(raw: PartnerAlertWhopPreparationTarget, at: string): PartnerAlertWhopPreparationTarget {
    const offer = parsePartnerAlertOffer(raw.offer);
    const userId = partnerAlertId(raw.userId, "userId");
    const whopUserId = resource(raw.whopUserId, "user_");
    if (!Array.isArray(raw.knownMembershipIds) || raw.knownMembershipIds.length > this.limits.membershipCount) {
      throw new PreparationStop("target_invalid");
    }
    const knownMembershipIds = Object.freeze([...new Set(raw.knownMembershipIds.map(id => resource(id, "mem_")))]);
    if (!/^[0-9a-f]{64}$/u.test(raw.verifiedWhopUserRef) || typeof raw.identityKeyBase64 !== "string"
      || !/^[A-Za-z0-9+/]{43}=$/u.test(raw.identityKeyBase64)) throw new PreparationStop("target_invalid");
    const proof = Object.freeze({ ...raw.accountProof });
    if (proof.communityId !== offer.communityId || proof.accountId !== offer.whop.accountId || proof.environment !== offer.whop.environment
      || partnerAlertUtc(proof.observedAtUtc, "accountObservedAtUtc") > at
      || partnerAlertUtc(proof.validUntilUtc, "accountValidUntilUtc") <= at) throw new PreparationStop("target_invalid");
    partnerAlertId(proof.ownerUserId, "ownerUserId");
    if (!/^[0-9a-f]{64}$/u.test(proof.ownerWhopUserRef)) throw new PreparationStop("target_invalid");
    const policy = Object.freeze({ ...raw.policy });
    partnerAlertInteger(policy.maximumEvidenceAgeMs, "maximumEvidenceAgeMs", 1, 86_400_000);
    if (typeof policy.allowConfiguredTrial !== "boolean" || policy.membershipReadAuthorised !== true
      || policy.eventsAuthorised !== true || policy.disputeReadAuthorised !== true
      || !["any_refund_revokes", "full_refund_revokes"].includes(policy.refundPolicy)
      || policy.disputePolicy !== "withhold_observed_dispute") throw new PreparationStop("target_invalid");
    const generations = Object.freeze({ identity: partnerAlertInteger(raw.claimedGenerations.identity, "identityGeneration", 1),
      connection: partnerAlertInteger(raw.claimedGenerations.connection, "connectionGeneration", 1),
      erasure: partnerAlertInteger(raw.claimedGenerations.erasure, "erasureGeneration", 1) });
    return Object.freeze({ userId, whopUserId, verifiedWhopUserRef: raw.verifiedWhopUserRef, knownMembershipIds, offer,
      accountProof: proof, identityKeyBase64: raw.identityKeyBase64, policy, claimedGenerations: generations });
  }
  private async discover(target: PartnerAlertWhopPreparationTarget, budget: ReadBudget): Promise<readonly string[]> {
    const ids = new Set<string>(target.knownMembershipIds);
    const seen = new Map<string, string>(); const cursors = new Set<string>();
    let after: string | undefined;
    for (let pageNumber = 0; pageNumber < this.limits.membershipPages; pageNumber += 1) {
      const { value: page } = await budget.read(() => this.client.listMemberships({ whopUserId: target.whopUserId, after }));
      for (const item of page.items) {
        const id = resource(item.membershipId, "mem_");
        const binding = `${resource(item.productId, "prod_")}:${resource(item.planId, "plan_")}`;
        if (seen.has(id) && seen.get(id) !== binding) throw new PreparationStop("pagination_changed");
        seen.set(id, binding);
        if (item.productId === target.offer.whop.productId && item.planId === target.offer.whop.planId) ids.add(id);
        if (ids.size > this.limits.membershipCount) throw new PreparationStop("discovery_limit");
      }
      if (!page.hasNextPage) return Object.freeze([...ids].sort());
      if (!page.endCursor || cursors.has(page.endCursor)) throw new PreparationStop("pagination_changed");
      cursors.add(page.endCursor); after = page.endCursor;
    }
    throw new PreparationStop("pagination_incomplete");
  }
  private async payments(target: PartnerAlertWhopPreparationTarget, membershipId: string, budget: ReadBudget): Promise<readonly PartnerAlertWhopPaymentFact[]> {
    const ids = new Set<string>(); const cursors = new Set<string>(); let after: string | undefined; let complete = false;
    for (let pageNumber = 0; pageNumber < this.limits.paymentPagesPerMembership; pageNumber += 1) {
      const { value: page } = await budget.read(() => this.client.listMembershipPayments({ whopUserId: target.whopUserId, membershipId, after }));
      page.paymentIds.forEach(id => ids.add(resource(id, "pay_")));
      if (ids.size > this.limits.paymentsPerMembership) throw new PreparationStop("payment_limit");
      if (!page.hasNextPage) { complete = true; break; }
      if (!page.endCursor || cursors.has(page.endCursor)) throw new PreparationStop("pagination_changed");
      cursors.add(page.endCursor); after = page.endCursor;
    }
    if (!complete) throw new PreparationStop("pagination_incomplete");
    const facts: PartnerAlertWhopPaymentFact[] = [];
    for (const id of [...ids].sort()) {
      const read = await budget.read(() => this.client.retrievePayment(id));
      const fact = normalizePartnerAlertWhopPayment({ native: read.value, offer: target.offer,
        environment: target.offer.whop.environment, verifiedWhopUserRef: target.verifiedWhopUserRef,
        identityKeyBase64: target.identityKeyBase64, disputeReadAuthorised: target.policy.disputeReadAuthorised,
        nowUtc: read.observedAtUtc, maximumEvidenceAgeMs: target.policy.maximumEvidenceAgeMs });
      if (fact.paymentId !== id || fact.membershipId !== membershipId) throw new PreparationStop("scope_changed");
      facts.push(fact);
    }
    return Object.freeze(facts);
  }
  private async member(target: PartnerAlertWhopPreparationTarget, membershipId: string, budget: ReadBudget,
    preparationDeadline: string): Promise<PartnerAlertWhopPreparedMember> {
    const read = await budget.read(() => this.client.retrieveMembership(membershipId));
    let native = partnerAlertRecord(read.value, "membership");
    let memberObservedAtUtc = read.observedAtUtc;
    if (native.id !== membershipId || native.user_id !== target.whopUserId) throw new PreparationStop("scope_changed");
    const normalise = (payment: PartnerAlertWhopPaymentFact | null, at: string) => normalizePartnerAlertWhopMembership({
      native, userId: target.userId, verifiedWhopUserRef: target.verifiedWhopUserRef, offer: target.offer,
      identityKeyBase64: target.identityKeyBase64, payment, refundPolicy: target.policy.refundPolicy,
      disputePolicy: target.policy.disputePolicy, nowUtc: at, maximumEvidenceAgeMs: target.policy.maximumEvidenceAgeMs });
    const initial = normalise(null, read.observedAtUtc);
    if (initial.basis === "trial" && !target.policy.allowConfiguredTrial) throw new PreparationStop("trial_not_approved");
    if (initial.state === "inactive") return Object.freeze({ kind: "prepared", membershipId, evidence: initial, paymentIds: Object.freeze([]) });
    const receipts = await this.payments(target, membershipId, budget);
    // Subscription state may change while receipt pagination/reads are running.
    // Re-read it before composing, rather than replaying the original status.
    const refreshed = await budget.read(() => this.client.retrieveMembership(membershipId));
    native = partnerAlertRecord(refreshed.value, "membership"); memberObservedAtUtc = refreshed.observedAtUtc;
    if (native.id !== membershipId || native.user_id !== target.whopUserId) throw new PreparationStop("scope_changed");
    const current = normalise(null, memberObservedAtUtc);
    if (current.basis === "trial" && !target.policy.allowConfiguredTrial) throw new PreparationStop("trial_not_approved");
    if (current.state === "inactive") return Object.freeze({ kind: "prepared", membershipId, evidence: current, paymentIds: Object.freeze([]) });
    const periodEnd = partnerAlertUtc(native.current_period_end, "currentPeriodEnd");
    const relevant = receipts.filter(item => item.state === "paid" && item.paidAtUtc !== null
      && item.paidAtUtc >= current.startsAtUtc && item.paidAtUtc < periodEnd);
    // Never pick whichever receipt happened to arrive first, or assume an old
    // dispute cannot affect this subscription. Policy qualification is required.
    if (relevant.length > 1 || receipts.some(item => item.state === "uncertain" || item.disputeState === "unverified"
      || (item.disputeState === "observed" && item !== relevant[0]))
      || relevant.some(item => item.refundState === "unknown")) {
      throw new PreparationStop("ambiguous_receipts");
    }
    const at = budget.now();
    const evidence = normalise(relevant[0] ?? null, at);
    // Do not refresh the membership observation time merely by reading payments.
    const membershipDeadline = new Date(Date.parse(memberObservedAtUtc) + target.policy.maximumEvidenceAgeMs).toISOString();
    const until = [evidence.validUntilUtc, membershipDeadline, preparationDeadline].sort()[0]!;
    if (until <= at) throw new PreparationStop("elapsed_budget");
    return Object.freeze({ kind: "prepared", membershipId,
      evidence: Object.freeze({ ...evidence, observedAtUtc: memberObservedAtUtc, validUntilUtc: until }),
      paymentIds: Object.freeze(relevant.map(item => item.paymentId)) });
  }

  async prepare(raw: PartnerAlertWhopPreparationTarget): Promise<PartnerAlertWhopPreparation> {
    let budget: ReadBudget | null = null; let context: PartnerAlertWhopPreparation["context"] = null;
    let discoveryComplete = false; let count = 0; let preparationDeadline: string | null = null;
    const members: PartnerAlertWhopPreparedMember[] = [];
    const issues: PreparationReason[] = [];
    const finish = (status: PartnerAlertWhopPreparation["status"]): PartnerAlertWhopPreparation => {
      let finishedAtUtc: string | null = null;
      try { finishedAtUtc = budget?.now() ?? null; } catch { issues.push("clock_invalid"); status = "incomplete"; }
      if (preparationDeadline !== null && finishedAtUtc !== null && preparationDeadline <= finishedAtUtc) {
        issues.push("elapsed_budget"); status = "incomplete";
      }
      const currentMembers = members.map(item => {
        if (item.kind === "prepared" && item.evidence.state === "active"
          && (finishedAtUtc === null || item.evidence.validUntilUtc <= finishedAtUtc)) {
          issues.push("elapsed_budget"); status = "incomplete";
          return Object.freeze({ kind: "needs_review" as const, membershipId: item.membershipId, reason: "elapsed_budget" as const });
        }
        return item;
      });
      return Object.freeze({ status, canApply: false, provenance: "current_runtime_unbound", requiresRuntimeQualification: QUALIFICATION,
        discoveryComplete, discoveredMembershipCount: count, members: Object.freeze(currentMembers), issues: Object.freeze([...new Set(issues)]),
        readCount: budget?.count ?? 0, startedAtUtc: budget?.startedAtUtc ?? null, finishedAtUtc, context });
    };
    if (this.configuration.enabled !== true) return finish("disabled");
    try {
      budget = new ReadBudget(this.limits, this.configuration.nowUtc);
      let target: PartnerAlertWhopPreparationTarget;
      try { target = this.target(raw, budget.startedAtUtc); }
      catch { throw new PreparationStop("target_invalid"); }
      context = Object.freeze({ userId: target.userId, communityId: target.offer.communityId, offerId: target.offer.offerId,
        offerVersion: target.offer.version, environment: target.offer.whop.environment, accountId: target.offer.whop.accountId,
        claimedGenerations: target.claimedGenerations });
      const account = await budget.read(() => this.client.retrieveAccount());
      const proof = normalizePartnerAlertWhopAccount({ native: account.value, communityId: target.offer.communityId,
        ownerUserId: target.accountProof.ownerUserId, expectedAccountId: target.offer.whop.accountId,
        verifiedOwnerWhopUserRef: target.accountProof.ownerWhopUserRef, environment: target.offer.whop.environment,
        identityKeyBase64: target.identityKeyBase64, nowUtc: account.observedAtUtc,
        maximumEvidenceAgeMs: target.policy.maximumEvidenceAgeMs, membershipReadAuthorised: target.policy.membershipReadAuthorised,
        eventsAuthorised: target.policy.eventsAuthorised });
      const variant = await budget.read(() => this.client.retrieveVariant(target.offer.whop.planId));
      const offerProof = normalizePartnerAlertWhopOffer({ native: variant.value, offer: target.offer, accountProof: proof,
        allowConfiguredTrial: target.policy.allowConfiguredTrial, nowUtc: variant.observedAtUtc,
        maximumEvidenceAgeMs: target.policy.maximumEvidenceAgeMs });
      preparationDeadline = [offerProof.validUntilUtc, proof.validUntilUtc, target.accountProof.validUntilUtc].sort()[0]!;
      const ids = await this.discover(target, budget); discoveryComplete = true; count = ids.length;
      for (const id of ids) {
        try {
          if (preparationDeadline <= budget.now()) throw new PreparationStop("elapsed_budget");
          members.push(await this.member(target, id, budget, preparationDeadline));
        }
        catch (error) {
          const why = reason(error);
          if (["read_budget", "elapsed_budget", "clock_invalid"].includes(why)) throw error;
          members.push(Object.freeze({ kind: "needs_review", membershipId: id, reason: why })); issues.push(why);
        }
      }
      return finish(issues.length ? "review_required" : "prepared");
    } catch (error) {
      const why = reason(error); issues.push(why);
      return finish(["read_budget", "elapsed_budget", "clock_invalid", "discovery_limit", "pagination_incomplete", "pagination_changed", "payment_limit"].includes(why)
        ? "incomplete" : ["provider_unavailable", "authorisation_unavailable"].includes(why) ? "unavailable" : "review_required");
    }
  }
}
