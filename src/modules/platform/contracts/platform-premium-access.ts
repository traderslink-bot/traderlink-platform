/** Server-owned Premium facts. No request payload or Discord role is payment proof. */
export type PlatformPremiumScope = Readonly<{
  /** Privacy-preserving, durable principal reference; binding is an integration dependency. */
  authorityKey: string;
  userId: string;
  discordUserId: string | null;
  guildId: string;
  identityGeneration: number;
  entitlementGeneration: number;
  erasureGeneration: number;
  policyGeneration: number;
}>;
export type PlatformPremiumPurchase = Readonly<{
  environment: "sandbox" | "live";
  accountId: string;
  whopUserId: string;
  productId: string;
  planId: string;
}>;
/** Exact structural counterpart of the pinned Membership V2 ticket. Persist it
 * whole; neither a revision nor a newly captured ticket can replace this one. */
export type PlatformPremiumTicket = Readonly<{
  scope: PlatformPremiumScope; authorityRevision: number; whopGeneration: number;
  admissionRef: string; factsSha256: string; observedAtUtc: string; validUntilUtc: string;
}>;
export type PlatformPremiumOfferScope = Readonly<{
  scopeRef: string; environment: "sandbox" | "live"; accountId: string; productId: string; planId: string;
}>;
export type PlatformPremiumPayer = Readonly<{
  kind: "bound"; linkId: string; whopUserRefHmac: string; whopUserId: string;
}> | Readonly<{ kind: "unbound"; reason: "not_linked" | "conflict" | "historical_hmac_only" }>;
export type PlatformPremiumPaidTerm = Readonly<{
  membershipRef: string;
  paymentRef: string;
  startsAtUtc: string;
  endsAtUtc: string;
}>;
export type PlatformPremiumPaidEvidence = Readonly<{
  kind: "paid";
  purchase: PlatformPremiumPurchase;
  observedAtUtc: string;
  validUntilUtc: string;
  /** All qualifying independent purchases; never replace one with a cancelled sibling. */
  terms: readonly PlatformPremiumPaidTerm[];
}> | Readonly<{
  kind: "not_paid" | "unknown";
  purchase: PlatformPremiumPurchase;
  observedAtUtc: string;
  validUntilUtc: string;
  reason: "no_current_paid_term" | "invalidated" | "provider_unavailable" | "incomplete"
    | "unqualified_coverage" | "scope_mismatch" | "conflicting_facts";
}>;
/** Structural counterpart of the actual V6 producer's named V2 receipt. Shape
 * validation is not issuer qualification; captureV2/isCurrentV2 bind its facts. */
export type PlatformPremiumRedactedComplimentaryReceipt = Readonly<{
  protocol: "ordinary_complimentary_signer_redaction_v1";
  provenanceRef: string; authorizationReceiptRef: string; qualificationRef: string;
  originalGrantRef: string; canonicalSourceRef: string; privacyCaptureRef: string;
  quiescenceRef: string; redactionOperationRef: string;
  scope: Readonly<{ authorityKey: string; recipientUserId: string; entitlementId: string; planVersionId: string; planId: string }>;
  originalTerms: Readonly<{ giftStartsAtUtc: string; giftEndsAtUtc: string | null;
    entitlementStartsAtUtc: string; entitlementEndsAtUtc: string | null }>;
  sourceKind: "ordinary_owner_complimentary";
  disposition: "retain_access_remove_grantor_identity";
  redactedAtUtc: string; recipientRevisionAfterRedaction: number; recipientEntitlementGenerationAfterRedaction: number;
}>;
export type PlatformPremiumComplimentaryProvenance = Readonly<{
  kind: "live_signer"; actorUserId: string; authorizationRef: string;
}> | Readonly<{ kind: "qualified_redacted_signer"; receipt: PlatformPremiumRedactedComplimentaryReceipt }>;
export type PlatformPremiumComplimentaryEvidence = Readonly<{
  kind: "active";
  /** Explicit Premium-specific owner grant, not merely source_type=owner_grant. */
  grantRef: string;
  entitlementId: string;
  provenance: PlatformPremiumComplimentaryProvenance;
  startsAtUtc: string;
  endsAtUtc: string | null;
  observedAtUtc: string;
  validUntilUtc: string;
}> | Readonly<{ kind: "none" | "unknown" }>;
export type PlatformPremiumAssignmentReview = Readonly<{ kind: "review_required" }>
  | Readonly<{
    kind: "reviewed";
    reviewRef: string;
    actorUserId: string;
    reviewedAtUtc: string;
    /** paid_only also means intentional ordinary gifts have been safely transferred. */
    paidRoleDisposition: "paid_only" | "retain";
  }>;
export type PlatformPremiumSnapshot = Readonly<{
  apiVersion: "platform_premium_authority_v2";
  ticket: PlatformPremiumTicket;
  scope: PlatformPremiumScope;
  /** Advances on every payment, grant, policy, identity or erasure observation change. */
  authorityRevision: number;
  observedAtUtc: string;
  validUntilUtc: string;
  paidRoleId: string;
  complimentaryRoleId: string | null;
  /** Offers remain real even when a native payer/coverage cannot be bound. */
  payer: PlatformPremiumPayer;
  coverage: readonly (Readonly<{ kind: "evidence"; offer: PlatformPremiumOfferScope; evidence: PlatformPremiumPaidEvidence }>
    | Readonly<{ kind: "unknown"; offer: PlatformPremiumOfferScope; reason: string }>)[];
  complimentary: PlatformPremiumComplimentaryEvidence;
  assignmentReview: PlatformPremiumAssignmentReview;
  /** Previously complete paid coverage, from the fenced authority ledger, not a role. */
  previousPaidThroughUtc: string | null;
  retiredSubjects: readonly Readonly<{
    discordUserId: string;
    priorManagedAssignmentRef: string;
  }>[];
}>;
export type PlatformPremiumDecision = Readonly<{
  ordinaryAccess: "allowed" | "denied" | "unknown";
  partnerPaidEligible: boolean;
  paidRole: "present" | "absent" | "hold";
  /** Complimentary role assignment/removal stays with the owner in this slice. */
  complimentaryRole: "unchanged";
  reason: "paid" | "complimentary" | "paid_ended" | "unpaid" | "historical_review"
    | "evidence_unknown" | "identity_unlinked" | "evidence_invalid";
  validUntilUtc: string | null;
  paidThroughUtc: string | null;
}>;

export class PlatformPremiumError extends Error {
  constructor(readonly code: "invalid" | "unbound" | "conflict" | "unavailable") {
    super("Premium verification requires attention.");
  }
}
export function premiumUtc(value: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
    || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new PlatformPremiumError("invalid");
  return value;
}
export function premiumRef(value: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_:-]{1,160}$/u.test(value)) throw new PlatformPremiumError("invalid");
  return value;
}
export function premiumSnowflake(value: string): string {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,19}$/u.test(value)
    || BigInt(value) > (BigInt(1) << BigInt(64)) - BigInt(1)) throw new PlatformPremiumError("invalid");
  return value;
}
export function premiumInteger(value: number, minimum = 1, maximum = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new PlatformPremiumError("invalid");
  return value;
}
export function premiumScope(scope: PlatformPremiumScope): PlatformPremiumScope {
  premiumRef(scope.authorityKey); premiumRef(scope.userId); premiumSnowflake(scope.guildId);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(scope.userId)) throw new PlatformPremiumError("invalid");
  if (scope.discordUserId !== null) premiumSnowflake(scope.discordUserId);
  [scope.identityGeneration, scope.entitlementGeneration, scope.erasureGeneration, scope.policyGeneration]
    .forEach(value => premiumInteger(value));
  return Object.freeze({ ...scope });
}
export function samePremiumScope(a: PlatformPremiumScope, b: PlatformPremiumScope): boolean {
  return a.authorityKey === b.authorityKey && a.userId === b.userId && a.discordUserId === b.discordUserId
    && a.guildId === b.guildId && a.identityGeneration === b.identityGeneration
    && a.entitlementGeneration === b.entitlementGeneration && a.erasureGeneration === b.erasureGeneration
    && a.policyGeneration === b.policyGeneration;
}
export function premiumTicket(value: PlatformPremiumTicket): PlatformPremiumTicket {
  const scope = premiumScope(value.scope);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(scope.authorityKey)
    || !/^[0-9a-f]{64}$/u.test(value.factsSha256)
    || premiumUtc(value.observedAtUtc) >= premiumUtc(value.validUntilUtc)) throw new PlatformPremiumError("invalid");
  return Object.freeze({ scope: Object.freeze({ authorityKey: scope.authorityKey, userId: scope.userId,
    discordUserId: scope.discordUserId, guildId: scope.guildId, identityGeneration: scope.identityGeneration,
    entitlementGeneration: scope.entitlementGeneration, erasureGeneration: scope.erasureGeneration, policyGeneration: scope.policyGeneration }),
  authorityRevision: premiumInteger(value.authorityRevision), whopGeneration: premiumInteger(value.whopGeneration),
  admissionRef: premiumRef(value.admissionRef), factsSha256: value.factsSha256,
  observedAtUtc: value.observedAtUtc, validUntilUtc: value.validUntilUtc });
}
export function samePremiumTicket(a: PlatformPremiumTicket, b: PlatformPremiumTicket): boolean {
  return samePremiumScope(a.scope, b.scope) && a.authorityRevision === b.authorityRevision
    && a.whopGeneration === b.whopGeneration && a.admissionRef === b.admissionRef && a.factsSha256 === b.factsSha256
    && a.observedAtUtc === b.observedAtUtc && a.validUntilUtc === b.validUntilUtc;
}
function exactGiftKeys(value: object, keys: readonly string[]): void {
  if (!value || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    || Object.keys(value).some(key => !keys.includes(key))) throw new PlatformPremiumError("invalid");
}
function giftUuid(value: string): string {
  premiumRef(value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) throw new PlatformPremiumError("invalid");
  return value;
}
function giftEnd(value: string | null, start: string): string | null {
  if (value !== null && premiumUtc(value) <= start) throw new PlatformPremiumError("invalid");
  return value;
}
/** Whitelist/copy the actual V2 gift fields. No actor replacement, NULL adoption,
 * receipt issuance, redaction, schema or privacy qualification is performed. */
export function premiumComplimentaryEvidence(input: PlatformPremiumComplimentaryEvidence,
  originalTicket: PlatformPremiumTicket): PlatformPremiumComplimentaryEvidence {
  const ticket = premiumTicket(originalTicket);
  if (input.kind === "none" || input.kind === "unknown") return Object.freeze({ kind: input.kind });
  if (input.kind !== "active") throw new PlatformPremiumError("invalid");
  exactGiftKeys(input, ["kind", "grantRef", "entitlementId", "provenance", "startsAtUtc", "endsAtUtc", "observedAtUtc", "validUntilUtc"]);
  const grantRef = premiumRef(input.grantRef); const entitlementId = giftUuid(input.entitlementId);
  const start = premiumUtc(input.startsAtUtc); const end = giftEnd(input.endsAtUtc, start);
  const observed = premiumUtc(input.observedAtUtc); const until = premiumUtc(input.validUntilUtc);
  if (observed !== ticket.observedAtUtc || until > ticket.validUntilUtc || until <= observed) throw new PlatformPremiumError("invalid");
  const p = input.provenance; let provenance: PlatformPremiumComplimentaryProvenance;
  if (p.kind === "live_signer") {
    exactGiftKeys(p, ["kind", "actorUserId", "authorizationRef"]);
    provenance = Object.freeze({ kind: "live_signer", actorUserId: giftUuid(p.actorUserId), authorizationRef: premiumRef(p.authorizationRef) });
  } else if (p.kind === "qualified_redacted_signer") {
    exactGiftKeys(p, ["kind", "receipt"]); const r = p.receipt;
    exactGiftKeys(r, ["protocol", "provenanceRef", "authorizationReceiptRef", "qualificationRef", "originalGrantRef", "canonicalSourceRef",
      "privacyCaptureRef", "quiescenceRef", "redactionOperationRef", "scope", "originalTerms", "sourceKind", "disposition", "redactedAtUtc",
      "recipientRevisionAfterRedaction", "recipientEntitlementGenerationAfterRedaction"]);
    exactGiftKeys(r.scope, ["authorityKey", "recipientUserId", "entitlementId", "planVersionId", "planId"]);
    exactGiftKeys(r.originalTerms, ["giftStartsAtUtc", "giftEndsAtUtc", "entitlementStartsAtUtc", "entitlementEndsAtUtc"]);
    const t = r.originalTerms; const giftStart = premiumUtc(t.giftStartsAtUtc); const canonicalStart = premiumUtc(t.entitlementStartsAtUtc);
    const giftStop = giftEnd(t.giftEndsAtUtc, giftStart); const canonicalStop = giftEnd(t.entitlementEndsAtUtc, canonicalStart);
    const stops = [giftStop, canonicalStop].filter((value): value is string => value !== null).sort();
    if (r.protocol !== "ordinary_complimentary_signer_redaction_v1" || r.sourceKind !== "ordinary_owner_complimentary"
      || r.disposition !== "retain_access_remove_grantor_identity" || r.originalGrantRef !== grantRef
      || premiumRef(r.canonicalSourceRef).startsWith("external:")
      || r.scope.authorityKey !== ticket.scope.authorityKey || r.scope.recipientUserId !== ticket.scope.userId
      || r.scope.entitlementId !== entitlementId || premiumUtc(r.redactedAtUtc) > observed
      || start !== [giftStart, canonicalStart].sort().at(-1) || end !== (stops[0] ?? null)
      || premiumInteger(r.recipientRevisionAfterRedaction) > ticket.authorityRevision
      || premiumInteger(r.recipientEntitlementGenerationAfterRedaction) > ticket.scope.entitlementGeneration) throw new PlatformPremiumError("invalid");
    const receipt: PlatformPremiumRedactedComplimentaryReceipt = Object.freeze({ protocol: r.protocol,
      provenanceRef: premiumRef(r.provenanceRef), authorizationReceiptRef: premiumRef(r.authorizationReceiptRef),
      qualificationRef: premiumRef(r.qualificationRef), originalGrantRef: grantRef, canonicalSourceRef: premiumRef(r.canonicalSourceRef),
      privacyCaptureRef: premiumRef(r.privacyCaptureRef), quiescenceRef: premiumRef(r.quiescenceRef), redactionOperationRef: premiumRef(r.redactionOperationRef),
      scope: Object.freeze({ authorityKey: ticket.scope.authorityKey, recipientUserId: ticket.scope.userId, entitlementId,
        planVersionId: giftUuid(r.scope.planVersionId), planId: giftUuid(r.scope.planId) }),
      originalTerms: Object.freeze({ giftStartsAtUtc: giftStart, giftEndsAtUtc: giftStop,
        entitlementStartsAtUtc: canonicalStart, entitlementEndsAtUtc: canonicalStop }),
      sourceKind: r.sourceKind, disposition: r.disposition, redactedAtUtc: r.redactedAtUtc,
      recipientRevisionAfterRedaction: r.recipientRevisionAfterRedaction,
      recipientEntitlementGenerationAfterRedaction: r.recipientEntitlementGenerationAfterRedaction });
    provenance = Object.freeze({ kind: "qualified_redacted_signer", receipt });
  } else throw new PlatformPremiumError("invalid");
  return Object.freeze({ kind: "active", grantRef, entitlementId, provenance, startsAtUtc: start, endsAtUtc: end,
    observedAtUtc: observed, validUntilUtc: until });
}
export function premiumOffer(value: PlatformPremiumOfferScope): PlatformPremiumOfferScope {
  if (!["sandbox", "live"].includes(value.environment)) throw new PlatformPremiumError("invalid");
  [value.scopeRef, value.accountId, value.productId, value.planId].forEach(premiumRef);
  return Object.freeze({ scopeRef: value.scopeRef, environment: value.environment, accountId: value.accountId,
    productId: value.productId, planId: value.planId });
}
export function samePremiumPurchase(a: PlatformPremiumPurchase, b: PlatformPremiumPurchase): boolean {
  return a.environment === b.environment && a.accountId === b.accountId && a.whopUserId === b.whopUserId
    && a.productId === b.productId && a.planId === b.planId;
}
export function validatePremiumPurchase(value: PlatformPremiumPurchase): PlatformPremiumPurchase {
  if (!["sandbox", "live"].includes(value.environment)) throw new PlatformPremiumError("invalid");
  [value.accountId, value.whopUserId, value.productId, value.planId].forEach(premiumRef);
  return Object.freeze({ ...value });
}
export function premiumFresh(observed: string, until: string, at: string): boolean {
  return premiumUtc(observed) <= premiumUtc(at) && observed < premiumUtc(until) && until > at;
}

/** Pure commercial decision. Existing membership enforcement/owner bypasses are not consulted. */
export function evaluatePlatformPremium(snapshot: PlatformPremiumSnapshot, nowUtc: string): PlatformPremiumDecision {
  const hold = (reason: PlatformPremiumDecision["reason"]): PlatformPremiumDecision => Object.freeze({
    ordinaryAccess: "unknown", partnerPaidEligible: false, paidRole: "hold", complimentaryRole: "unchanged",
    reason, validUntilUtc: null, paidThroughUtc: null,
  });
  try {
    if (snapshot.apiVersion !== "platform_premium_authority_v2") return hold("evidence_invalid");
    const at = premiumUtc(nowUtc); premiumScope(snapshot.scope); premiumInteger(snapshot.authorityRevision);
    premiumSnowflake(snapshot.paidRoleId);
    if (snapshot.paidRoleId === snapshot.scope.guildId) return hold("evidence_invalid");
    if (snapshot.complimentaryRoleId !== null) {
      premiumSnowflake(snapshot.complimentaryRoleId);
      if ([snapshot.scope.guildId, snapshot.paidRoleId].includes(snapshot.complimentaryRoleId)) return hold("evidence_invalid");
    }
    if (!snapshot.scope.discordUserId) return hold("identity_unlinked");
    if (!premiumFresh(snapshot.observedAtUtc, snapshot.validUntilUtc, at)) return hold("evidence_unknown");
    const ticket = premiumTicket(snapshot.ticket);
    if (!samePremiumScope(ticket.scope, snapshot.scope) || ticket.authorityRevision !== snapshot.authorityRevision
      || ticket.observedAtUtc !== snapshot.observedAtUtc || ticket.validUntilUtc !== snapshot.validUntilUtc) return hold("evidence_invalid");
    if (!Array.isArray(snapshot.coverage) || snapshot.coverage.length < 1 || snapshot.coverage.length > 50) return hold("evidence_invalid");
    const payer = snapshot.payer;
    if (payer.kind === "bound") {
      premiumRef(payer.linkId); premiumRef(payer.whopUserId);
      if (!/^[0-9a-f]{64}$/u.test(payer.whopUserRefHmac)) return hold("evidence_invalid");
    } else if (payer.kind !== "unbound" || !["not_linked", "conflict", "historical_hmac_only"].includes(payer.reason)) return hold("evidence_invalid");
    const paid: PlatformPremiumPaidEvidence[] = []; const offers = new Set<string>();
    for (const item of snapshot.coverage) {
      const offer = premiumOffer(item.offer);
      if (offers.has(offer.scopeRef)) return hold("evidence_invalid"); offers.add(offer.scopeRef);
      if (item.kind === "unknown") { premiumRef(item.reason); continue; }
      if (item.kind !== "evidence" || payer.kind !== "bound") return hold("evidence_invalid");
      const evidence = item.evidence; const p = validatePremiumPurchase(evidence.purchase);
      if (p.environment !== offer.environment || p.accountId !== offer.accountId || p.productId !== offer.productId
        || p.planId !== offer.planId || p.whopUserId !== payer.whopUserId
        || !["paid", "not_paid", "unknown"].includes(evidence.kind)) return hold("evidence_invalid");
      // Sandbox observations remain UNKNOWN for this live-access consumer.
      if (offer.environment === "live") paid.push(evidence);
    }
    const gift = premiumComplimentaryEvidence(snapshot.complimentary, ticket);
    const complimentary = gift.kind === "active" && premiumFresh(gift.observedAtUtc, gift.validUntilUtc, at)
      && premiumUtc(gift.startsAtUtc) <= at && (gift.endsAtUtc === null || premiumUtc(gift.endsAtUtc) > at);
    const review = snapshot.assignmentReview;
    const removable = review.kind === "reviewed" && review.paidRoleDisposition === "paid_only"
      && Boolean(premiumRef(review.reviewRef)) && Boolean(premiumRef(review.actorUserId))
      && premiumUtc(review.reviewedAtUtc) <= at;
    const positive: Readonly<{ through: string; until: string }>[] = [];
    for (const evidence of paid) {
      if (evidence.kind !== "paid" || !premiumFresh(evidence.observedAtUtc, evidence.validUntilUtc, at)) continue;
      if (!Array.isArray(evidence.terms) || evidence.terms.length < 1 || evidence.terms.length > 250) return hold("evidence_invalid");
      const seen = new Set<string>();
      const terms = evidence.terms.filter(term => {
        premiumRef(term.membershipRef); premiumRef(term.paymentRef);
        const key = `${term.membershipRef}:${term.paymentRef}`;
        if (seen.has(key)) throw new PlatformPremiumError("invalid");
        seen.add(key);
        if (premiumUtc(term.startsAtUtc) >= premiumUtc(term.endsAtUtc)) throw new PlatformPremiumError("invalid");
        return term.startsAtUtc <= at && term.endsAtUtc > at;
      });
      if (terms.length) {
        const through = terms.map(term => term.endsAtUtc).sort().at(-1)!;
        positive.push({ through, until: [through, snapshot.validUntilUtc, evidence.validUntilUtc].sort()[0]! });
      }
    }
    if (positive.length) return Object.freeze({ ordinaryAccess: "allowed", partnerPaidEligible: true, paidRole: "present",
      complimentaryRole: "unchanged", reason: "paid", paidThroughUtc: positive.map(value => value.through).sort().at(-1)!,
      validUntilUtc: positive.map(value => value.until).sort().at(-1)!,
    });
    const priorEnded = snapshot.previousPaidThroughUtc !== null && premiumUtc(snapshot.previousPaidThroughUtc) <= at;
    const complete = paid.length === snapshot.coverage.length && paid.length > 0;
    const knownUnpaid = complete && paid.every(evidence => premiumFresh(evidence.observedAtUtc, evidence.validUntilUtc, at)
      && evidence.kind === "not_paid");
    const endedPaidTerms = complete && paid.every(evidence => premiumFresh(evidence.observedAtUtc, evidence.validUntilUtc, at)
      && (evidence.kind === "not_paid" || (evidence.kind === "paid" && evidence.terms.length > 0
        && evidence.terms.every(term => premiumUtc(term.endsAtUtc) <= at))));
    const absent = removable && (knownUnpaid || priorEnded || endedPaidTerms);
    return Object.freeze({ ordinaryAccess: complimentary ? "allowed" : gift.kind === "unknown" ? "unknown" : absent ? "denied" : "unknown",
      partnerPaidEligible: false, paidRole: absent ? "absent" : "hold", complimentaryRole: "unchanged",
      reason: complimentary ? "complimentary" : gift.kind === "unknown" ? "evidence_unknown" : absent ? priorEnded || endedPaidTerms ? "paid_ended" : "unpaid"
        : !removable ? "historical_review" : "evidence_unknown",
      paidThroughUtc: null, validUntilUtc: complimentary && gift.kind === "active"
        ? [snapshot.validUntilUtc, gift.validUntilUtc, ...(gift.endsAtUtc ? [gift.endsAtUtc] : [])].sort()[0]!
        : absent ? snapshot.validUntilUtc : null,
    });
  } catch { return hold("evidence_invalid"); }
}
