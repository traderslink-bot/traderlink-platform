import "server-only";

import type Database from "better-sqlite3";
import type { CommunityStagingQaTargetPins } from "../../communities/server/community-staging-qa-target";
import { issuePlatformPremiumStagingRuntimeAuthority, type PlatformPremiumRuntimeAuthority,
  type PlatformPremiumRuntimeAuthorityBinding } from "../../platform/server/membership/platform-premium-runtime-authority";

import { premiumFresh, premiumRef, premiumSnowflake, premiumTicket, premiumUtc,
  type PlatformPremiumOfferScope, type PlatformPremiumTicket } from "../../platform/contracts/platform-premium-access";
import type { MembershipPremiumProducerReadPort, PremiumAdmittedImmediateWriter } from
  "../../platform/server/membership/platform-premium-current-authority";
import type { PlatformPremiumNativePurchase } from "../../platform/server/membership/platform-premium-whop-native";
import { isPreparedPlatformPremiumWhopCurrentAccess, readStoredPlatformPremiumWhopCurrentAccess,
  type PlatformPremiumPreparedWhopCurrentAccess } from "../../platform/server/membership/platform-premium-whop-current-access";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import type { PartnerAlertPremiumWhopAccessProvider } from "./partner-alert-premium-whop-access-provider";

type Producer = MembershipPremiumProducerReadPort & Readonly<{
  nativePurchaseV2: (ticket: PlatformPremiumTicket, scopeRef: string, knownNativeSubject?: string) =>
    Readonly<{ kind: "purchase"; purchase: PlatformPremiumNativePurchase }> | Readonly<{ kind: "unbound" }>;
  recordWhopCurrentAccess: (ticket: PlatformPremiumTicket, observationRef: string,
    proof: PlatformPremiumPreparedWhopCurrentAccess) => Readonly<{ kind: "recorded" | "duplicate" }>;
}>;
const refused = (): never => { throw new PartnerAlertValidationError("premiumRefreshUnavailable"); };
const sameOffer = (a: PlatformPremiumOfferScope, b: PlatformPremiumOfferScope) =>
  a.scopeRef === b.scopeRef && a.environment === b.environment && a.accountId === b.accountId
  && a.productId === b.productId && a.planId === b.planId;
const samePurchase = (a: PlatformPremiumNativePurchase, b: PlatformPremiumNativePurchase) =>
  sameOffer(a.offer,b.offer) && a.payer.kind === "bound" && b.payer.kind === "bound"
  && a.payer.linkId === b.payer.linkId && a.payer.whopUserRefHmac === b.payer.whopUserRefHmac
  && a.payer.whopUserId === b.payer.whopUserId;

/** Server-owned hook for the catalog and role refresh path. It grants nothing.
 * Exactly one independently reviewed sandbox Premium scope is supported here;
 * a multi-scope policy is refused instead of partially persisting stale tickets.
 * Provider I/O stays outside the writer; persistence uses its ORIGINAL V2 ticket.
 * Failed hydration throws so callers cannot fall back to older paid evidence. */
export function createPartnerAlertPremiumWhopRefresh(input: Readonly<{
  guildId: string; offer: PlatformPremiumOfferScope; provider: PartnerAlertPremiumWhopAccessProvider;
  producer: Producer; writer: PremiumAdmittedImmediateWriter; nowUtc: () => string;
  createObservationRef: () => string;
  readKnownMembershipIds: (original: PlatformPremiumTicket, scopeRef: string) => readonly string[];
  /** Optional raw subject from the normal verified identity service only.
   * The repository still checks it against the canonical link HMAC. */
  readVerifiedNativeSubject?: (original: PlatformPremiumTicket) => string | undefined;
}>): (authorityKey: string) => Promise<void> {
  const guildId = premiumSnowflake(input.guildId), offer = Object.freeze({ ...input.offer });
  if (offer.environment !== "sandbox" || input.provider.qualification.environment !== "sandbox"
    || input.provider.qualification.accountId !== offer.accountId) refused();
  const inWriter = <T>(operation: () => T): T => input.writer.run(() => {
    if (!input.writer.isCurrentWriter()) return refused();
    return operation();
  });
  return async authorityKey => {
    premiumRef(authorityKey); input.provider.assertCurrent();
    const captured = inWriter(() => {
      const snapshot = input.producer.captureV2(authorityKey);
      if (snapshot.kind !== "snapshot" || snapshot.apiVersion !== "platform_premium_authority_v2") return refused();
      const original = premiumTicket(snapshot.ticket), policy = snapshot.policy, q = policy.nativeQualification;
      const at = premiumUtc(input.nowUtc()), expected = input.provider.qualification;
      if (original.scope.authorityKey !== authorityKey || original.scope.guildId !== guildId
        || !input.producer.isCurrentV2(original) || policy.state !== "active" || policy.guildId !== guildId
        || policy.generation !== original.scope.policyGeneration || policy.offerScopes.length !== 1
        || !sameOffer(policy.offerScopes[0]!,offer) || !q || q.reviewRef !== expected.reviewRef
        || q.schemaSha256 !== expected.schemaSha256 || q.apiVersion !== expected.apiVersion
        || !Number.isSafeInteger(policy.maximumEvidenceAgeMs) || policy.maximumEvidenceAgeMs < 30_000) return refused();
      const native = input.producer.nativePurchaseV2(original,offer.scopeRef,input.readVerifiedNativeSubject?.(original));
      if (native.kind !== "purchase" || !sameOffer(native.purchase.offer,offer) || native.purchase.payer.kind !== "bound") return refused();
      const purchase = structuredClone(native.purchase);
      const coverage = snapshot.coverage.filter(item => sameOffer(item.offer,offer));
      if (coverage.length !== 1) return refused();
      const item = coverage[0]!;
      const current = item.kind === "native_coverage" ? readStoredPlatformPremiumWhopCurrentAccess(item.collection) : null;
      // Reuse an already admitted finite observation while enough lifetime
      // remains. This avoids creating a new row for every catalog render.
      const reusable = current !== null && samePurchase(current.purchase,purchase)
        && premiumFresh(current.observedAtUtc,current.validUntilUtc,at)
        && Date.parse(current.validUntilUtc) - Date.parse(at) > 12_000;
      const knownMembershipIds = [...input.readKnownMembershipIds(original,offer.scopeRef)];
      if (knownMembershipIds.length > 50 || new Set(knownMembershipIds).size !== knownMembershipIds.length
        || knownMembershipIds.some(id => !/^mem_[A-Za-z0-9_]{1,124}$/u.test(id))) return refused();
      return { original,purchase,knownMembershipIds,reusable };
    });
    input.provider.assertCurrent();
    if (captured.reusable) return;
    const prepared = await input.provider.prepare({ purchase: captured.purchase,knownMembershipIds: captured.knownMembershipIds });
    input.provider.assertCurrent();
    if (!isPreparedPlatformPremiumWhopCurrentAccess(prepared)) return refused();
    inWriter(() => {
      input.provider.assertCurrent();
      if (!input.producer.isCurrentV2(captured.original) || !samePurchase(prepared.collection.purchase,captured.purchase)
        || !premiumFresh(prepared.collection.observedAtUtc,prepared.collection.validUntilUtc,premiumUtc(input.nowUtc()))) return refused();
      input.producer.recordWhopCurrentAccess(captured.original,premiumRef(input.createObservationRef()),prepared);
    });
  };
}


/** Per-case server composition for the actual native subscriber binder. There
 * is no global registry, environment-subject shortcut or public capability field.
 * The controller supplies a normal current owner Request and exact image pins.
 * First record the original-ticket proof, then capture a NEW consumption ticket
 * for owner issuance outside SQLite. Outstanding original intents stay original. */
export function createPartnerAlertPremiumWhopSubscriberBinding(input:
  Parameters<typeof createPartnerAlertPremiumWhopRefresh>[0] & Readonly<{
    database: Database.Database; ownerRequest: Request; pins: CommunityStagingQaTargetPins;
  }>): Readonly<{
    refreshPremium: (authorityKey: string) => Promise<void>;
    runtimeAuthority: PlatformPremiumRuntimeAuthorityBinding;
    clear: () => void;
  }> {
  const refresh = createPartnerAlertPremiumWhopRefresh(input);
  let token: PlatformPremiumRuntimeAuthority | null = null;
  const runtimeAuthority: PlatformPremiumRuntimeAuthorityBinding = Object.freeze({ database: input.database,current: () => token });
  return Object.freeze({ runtimeAuthority,clear: () => { token = null; },refreshPremium: async authorityKey => {
    token = null;
    await refresh(authorityKey);
    const current = input.writer.run(() => {
      if (!input.writer.isCurrentWriter()) return refused();
      const read = input.producer.captureV2(authorityKey);
      if (read.kind !== "snapshot" || read.apiVersion !== "platform_premium_authority_v2"
        || !input.producer.isCurrentV2(read.ticket)) return refused();
      return premiumTicket(read.ticket);
    });
    input.provider.assertCurrent();
    token = issuePlatformPremiumStagingRuntimeAuthority({ database: input.database,request: input.ownerRequest,
      pins: input.pins,originalTicket: current });
  } });
}
