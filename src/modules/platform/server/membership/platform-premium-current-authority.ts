import { PlatformPremiumError, premiumComplimentaryEvidence, premiumFresh, premiumInteger, premiumOffer, premiumRef, premiumScope, premiumSnowflake,
  premiumTicket, premiumUtc, type PlatformPremiumAssignmentReview, type PlatformPremiumComplimentaryEvidence,
  type PlatformPremiumOfferScope, type PlatformPremiumPayer, type PlatformPremiumScope, type PlatformPremiumSnapshot,
  type PlatformPremiumTicket } from "../../contracts/platform-premium-access";
import { preparePlatformPremiumPaidEvidence, type PlatformPremiumWhopCoverage } from "./platform-premium-paid-evidence";
import type { PlatformPremiumAuthority } from "./platform-premium-role-reconciliation";

/** Structural READ contract of actual V6's named V2 capture/current methods.
 * V1 snapshots/tickets are never cast/decorated into V2 and no V1 fallback/native
 * writer is exposed. No absent producer import, copy, SQL or substitute proof. */
export type MembershipPremiumNativeCollection = Readonly<{
  purchase: Readonly<{ offer: PlatformPremiumOfferScope; payer: Extract<PlatformPremiumPayer, { kind: "bound" }> }>;
  discovery: "complete" | "incomplete"; observedAtUtc: string; validUntilUtc: string;
  members: readonly Omit<PlatformPremiumWhopCoverage, "purchase" | "observedAtUtc">[];
}>;
export type MembershipPremiumRead = Readonly<{ kind: "unbound"; reason: string }> | Readonly<{
  kind: "snapshot"; apiVersion: "platform_premium_authority_v2"; ticket: PlatformPremiumTicket;
  policy: Readonly<{ policyRef: string; configurationRef: string; guildId: string; state: "active" | "disabled";
    offerScopes: readonly PlatformPremiumOfferScope[]; premiumPlanIds: readonly string[]; maximumEvidenceAgeMs: number;
    generation: number; nativeQualification: Readonly<{ reviewRef: string; schemaSha256: string; apiVersion: string }> | null }>;
  payer: PlatformPremiumPayer;
  coverage: readonly (Readonly<{ kind: "unknown"; offer: PlatformPremiumOfferScope; reason: string }>
    | Readonly<{ kind: "native_coverage"; offer: PlatformPremiumOfferScope;
      collection: MembershipPremiumNativeCollection; observationRef: string }>)[];
  complimentary: Omit<Extract<PlatformPremiumComplimentaryEvidence, { kind: "active" }>, "observedAtUtc" | "validUntilUtc">
    | Readonly<{ kind: "none" | "unknown" }>;
  retiredSubjectFacts: readonly Readonly<{ discordUserId: string; identityGeneration: number }>[];
}>;
export interface MembershipPremiumProducerReadPort {
  captureV2(authorityKey: string): MembershipPremiumRead;
  isCurrentV2(originalTicket: PlatformPremiumTicket): boolean;
  resolveUserAuthority(userId: string, guildId: string): Readonly<{ kind: "linked"; authorityKey: string }>
    | Readonly<{ kind: "ambiguous" | "unbound" }>;
}
export interface PremiumAdmittedImmediateWriter {
  /** Actual admission + same SQLite connection. Nested calls reuse its existing
   * admitted IMMEDIATE writer; no independent commit, async callback or I/O. */
  run<T>(operation: () => T): T;
  /** Must attest real server admission/context, not merely db.inTransaction. */
  isCurrentWriter(): boolean;
}
export interface PremiumOwnedHistoryReader {
  readAuthorityHistory(scope: PlatformPremiumScope): Readonly<{ previousPaidThroughUtc: string | null;
    assignments: readonly Readonly<{ discordUserId: string; assignmentRef: string; ticket: PlatformPremiumTicket }>[] }>;
}
export interface PremiumHistoricalAssignmentReviewReader {
  /** Explicit owner-reviewed provenance only. No row or none means review_required. */
  read(scope: PlatformPremiumScope, paidRoleId: string): PlatformPremiumAssignmentReview;
}
export const PLATFORM_PREMIUM_CONSUMER_QUALIFICATION = Object.freeze({
  producer: "membership-premium-producer-implementation-20261028-v6",
  apiVersion: "platform_premium_authority_v2",
  producerAuthoritySha256: "577315a40178507b88a14c487351112a680b024362c5c0fca40f6f183b732e4a",
  producerNativeSha256: "140f91d8d13320fc9a3edc8565dd647971bfac9e03fe61adb363a92fdbed7a4d",
  privacySourceAvailabilitySha256: "3d132bf98852c13fd48fb46f04f7cce0350221af11c4b533be6a8264bf14972e",
  runtimeBound: false, payloadRetentionQualified: false, erasureAdmissionBound: false,
});
function sameOffer(a: PlatformPremiumOfferScope, b: PlatformPremiumOfferScope): boolean {
  return a.scopeRef === b.scopeRef && a.environment === b.environment && a.accountId === b.accountId
    && a.productId === b.productId && a.planId === b.planId;
}
function payerCopy(value: PlatformPremiumPayer): PlatformPremiumPayer {
  if (value.kind === "unbound") {
    if (!["not_linked", "conflict", "historical_hmac_only"].includes(value.reason)) throw new PlatformPremiumError("invalid");
    return Object.freeze({ kind: "unbound", reason: value.reason });
  }
  if (value.kind !== "bound" || !/^[0-9a-f]{64}$/u.test(value.whopUserRefHmac)) throw new PlatformPremiumError("invalid");
  return Object.freeze({ kind: "bound", linkId: premiumRef(value.linkId), whopUserRefHmac: value.whopUserRefHmac,
    whopUserId: premiumRef(value.whopUserId) });
}

/** Dormant explicit-call consumer only. Default disabled and all dependencies
 * null. No native decoder, GET, credentials, DB opener, migration, timer, worker
 * registration, erasure implementation or positive runtime binding is supplied. */
export class PlatformPremiumCurrentAuthority implements PlatformPremiumAuthority {
  private readonly configuration: Readonly<{ enabled: boolean; guildId: string; paidRoleId: string;
    complimentaryRoleId: string | null; nowUtc: () => string }>;
  constructor(configuration: Readonly<{ enabled?: boolean; guildId: string; paidRoleId: string;
    complimentaryRoleId: string | null; nowUtc: () => string }>,
    private readonly producer: MembershipPremiumProducerReadPort | null = null,
    private readonly writer: PremiumAdmittedImmediateWriter | null = null,
    private readonly history: PremiumOwnedHistoryReader | null = null,
    private readonly reviews: PremiumHistoricalAssignmentReviewReader | null = null) {
    premiumSnowflake(configuration.guildId); premiumSnowflake(configuration.paidRoleId);
    if (configuration.complimentaryRoleId !== null) premiumSnowflake(configuration.complimentaryRoleId);
    if (configuration.guildId === configuration.paidRoleId || (configuration.complimentaryRoleId !== null
      && [configuration.guildId, configuration.paidRoleId].includes(configuration.complimentaryRoleId))
      || typeof configuration.nowUtc !== "function") throw new PlatformPremiumError("invalid");
    this.configuration = Object.freeze({ ...configuration, enabled: configuration.enabled === true });
  }
  inCurrentWriter<T>(operation: () => T): T {
    if (!this.configuration.enabled || !this.producer || !this.writer || !this.history) throw new PlatformPremiumError("unbound");
    return this.writer.run(() => {
      if (!this.writer!.isCurrentWriter()) throw new PlatformPremiumError("unbound");
      const value = operation();
      if (value !== null && (typeof value === "object" || typeof value === "function")
        && typeof (value as { then?: unknown }).then === "function") throw new PlatformPremiumError("invalid");
      return value;
    });
  }
  isCurrent(input: PlatformPremiumTicket): boolean {
    try {
      if (!this.configuration.enabled || !this.producer || !this.history || !this.writer?.isCurrentWriter()) return false;
      const ticket = premiumTicket(input);
      if (ticket.scope.guildId !== this.configuration.guildId
        || !premiumFresh(ticket.observedAtUtc, ticket.validUntilUtc, premiumUtc(this.configuration.nowUtc()))) return false;
      // Pass the ORIGINAL full ticket to its paired V2 checker. Old V1 fact
      // digests fail this check; never capture or upgrade an outstanding intent.
      return this.producer.isCurrentV2(ticket);
    } catch { return false; }
  }
  /** Actual V4 existing-key lookup only. No initialization, guessed UUID/guild,
   * native/payer/payment inference or replacement of any persisted ticket. */
  resolveUserAuthority(userId: string, guildId: string): Readonly<{ kind: "linked"; authorityKey: string }>
    | Readonly<{ kind: "ambiguous" | "unbound" }> {
    if (!this.configuration.enabled || !this.producer || !this.writer || !this.history) return { kind: "unbound" };
    try {
      premiumRef(userId); premiumSnowflake(guildId);
      if (guildId !== this.configuration.guildId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(userId)) return { kind: "unbound" };
      return this.inCurrentWriter(() => {
        const result = this.producer!.resolveUserAuthority(userId, this.configuration.guildId);
        if (result.kind === "ambiguous") return Object.freeze({ kind: "ambiguous" as const });
        if (result.kind !== "linked" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(result.authorityKey)) return Object.freeze({ kind: "unbound" as const });
        return Object.freeze({ kind: "linked" as const, authorityKey: result.authorityKey });
      });
    } catch { return { kind: "unbound" }; }
  }
  async loadCurrent(authorityKey: string): Promise<Readonly<{ kind: "unbound" }>
    | Readonly<{ kind: "snapshot"; snapshot: PlatformPremiumSnapshot }>> {
    if (!this.configuration.enabled || !this.producer || !this.writer || !this.history) return { kind: "unbound" };
    try {
      return this.inCurrentWriter(() => {
        const read = this.producer!.captureV2(premiumRef(authorityKey));
        if (read.kind !== "snapshot" || read.apiVersion !== "platform_premium_authority_v2") return { kind: "unbound" as const };
        const raw: Extract<MembershipPremiumRead, { kind: "snapshot" }> = structuredClone(read);
        const ticket = premiumTicket(raw.ticket); const scope = premiumScope(ticket.scope);
        const at = premiumUtc(this.configuration.nowUtc());
        if (scope.authorityKey !== authorityKey || !this.isCurrent(ticket) || raw.policy.state !== "active"
          || raw.policy.guildId !== this.configuration.guildId || raw.policy.generation !== scope.policyGeneration
          || !Array.isArray(raw.policy.offerScopes) || raw.policy.offerScopes.length < 1 || raw.policy.offerScopes.length > 50
          || !Array.isArray(raw.coverage) || raw.coverage.length !== raw.policy.offerScopes.length) throw new PlatformPremiumError("invalid");
        const age = premiumInteger(raw.policy.maximumEvidenceAgeMs, 1, 86_400_000); const payer = payerCopy(raw.payer);
        const seen = new Set<string>();
        const coverage: PlatformPremiumSnapshot["coverage"] = Object.freeze(raw.policy.offerScopes.map(value => {
          const offer = premiumOffer(value);
          if (seen.has(offer.scopeRef)) throw new PlatformPremiumError("invalid"); seen.add(offer.scopeRef);
          const items = raw.coverage.filter(item => item.offer.scopeRef === offer.scopeRef);
          if (items.length !== 1 || !sameOffer(premiumOffer(items[0]!.offer), offer)) throw new PlatformPremiumError("invalid");
          const item = items[0]!;
          const unknown = (reason: string) => Object.freeze({ kind: "unknown" as const, offer, reason: premiumRef(reason) });
          if (item.kind === "unknown") return unknown(item.reason);
          if (item.kind !== "native_coverage" || payer.kind !== "bound" || !raw.policy.nativeQualification) return unknown("native_unqualified");
          premiumRef(item.observationRef);
          const c = item.collection; const p = c.purchase;
          if (!sameOffer(premiumOffer(p.offer), offer) || p.payer.kind !== "bound" || p.payer.linkId !== payer.linkId
            || p.payer.whopUserId !== payer.whopUserId || p.payer.whopUserRefHmac !== payer.whopUserRefHmac
            || !premiumFresh(c.observedAtUtc, c.validUntilUtc, at) || !Array.isArray(c.members) || c.members.length > 250) return unknown("native_scope_or_freshness");
          const purchase = Object.freeze({ environment: offer.environment, accountId: offer.accountId,
            whopUserId: payer.whopUserId, productId: offer.productId, planId: offer.planId });
          const evidence = preparePlatformPremiumPaidEvidence({ purchase, observedAtUtc: c.observedAtUtc,
            validUntilUtc: [ticket.validUntilUtc, c.validUntilUtc].sort()[0]!, discovery: c.discovery,
            coverageQualification: "native_bound", members: c.members.map(member => ({ ...member,
              purchase, observedAtUtc: c.observedAtUtc })) }, purchase, at, age);
          return Object.freeze({ kind: "evidence" as const, offer, evidence });
        }));
        const gift = raw.complimentary;
        const complimentary = premiumComplimentaryEvidence(gift.kind === "active" ? {
          kind: "active", grantRef: gift.grantRef, entitlementId: gift.entitlementId, provenance: gift.provenance,
          startsAtUtc: gift.startsAtUtc, endsAtUtc: gift.endsAtUtc,
          observedAtUtc: ticket.observedAtUtc, validUntilUtc: ticket.validUntilUtc,
        } : gift, ticket);
        const own = this.history!.readAuthorityHistory(scope);
        if (!Array.isArray(own.assignments) || own.assignments.length > 101
          || !Array.isArray(raw.retiredSubjectFacts) || raw.retiredSubjectFacts.length > 100) throw new PlatformPremiumError("invalid");
        const retired = new Map<string, string>();
        for (const fact of raw.retiredSubjectFacts) {
          premiumSnowflake(fact.discordUserId); premiumInteger(fact.identityGeneration);
          if (fact.discordUserId === scope.discordUserId) continue;
          const assignment = own.assignments.find(a => a.discordUserId === fact.discordUserId
            && a.ticket.scope.identityGeneration <= fact.identityGeneration);
          if (!assignment) continue; // Native history alone does not prove an owned role.
          const original = premiumTicket(assignment.ticket);
          if (original.scope.authorityKey !== scope.authorityKey || original.scope.guildId !== scope.guildId
            || original.scope.discordUserId !== fact.discordUserId) throw new PlatformPremiumError("invalid");
          retired.set(fact.discordUserId, premiumRef(assignment.assignmentRef));
        }
        const review = this.reviews?.read(scope, this.configuration.paidRoleId) ?? Object.freeze({ kind: "review_required" as const });
        // A successful paid-role PUT can coincide with an older manual gift.
        // Managed history alone must not erase that unresolved classification.
        const retirementReviewed = review.kind === "reviewed" && review.paidRoleDisposition === "paid_only"
          && Boolean(premiumRef(review.reviewRef)) && Boolean(premiumRef(review.actorUserId))
          && premiumUtc(review.reviewedAtUtc) <= at;
        const snapshot: PlatformPremiumSnapshot = Object.freeze({ apiVersion: read.apiVersion, ticket, scope, authorityRevision: ticket.authorityRevision,
          observedAtUtc: ticket.observedAtUtc, validUntilUtc: ticket.validUntilUtc, paidRoleId: this.configuration.paidRoleId,
          complimentaryRoleId: this.configuration.complimentaryRoleId, payer, coverage, complimentary,
          assignmentReview: Object.freeze(structuredClone(review)),
          previousPaidThroughUtc: own.previousPaidThroughUtc === null ? null : premiumUtc(own.previousPaidThroughUtc),
          retiredSubjects: Object.freeze((retirementReviewed ? [...retired] : []).map(([discordUserId, priorManagedAssignmentRef]) => Object.freeze({ discordUserId, priorManagedAssignmentRef }))) });
        if (!this.isCurrent(ticket)) return { kind: "unbound" as const };
        return Object.freeze({ kind: "snapshot" as const, snapshot });
      });
    } catch { return { kind: "unbound" }; }
  }
}
