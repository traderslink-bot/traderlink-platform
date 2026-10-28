/** Domain values and pure owned Premium ticket validation; no DB/provider/runtime binding. */
import { premiumTicket, premiumFresh, type PlatformPremiumTicket } from "../../platform/contracts/platform-premium-access";

export type PartnerAlertEnvironment = "sandbox" | "live";

/** Actual server-owned community/offer/provider/identity/erasure epochs and fact
 * receipts. No implementation or timestamp-derived/default generation is supplied. */
export type PartnerAlertContextTicket = Readonly<{
  communityId: string; mappingId: string; userId: string; linkedDiscordUserId: string | null;
  guildId: string; roleId: string; authorityRevision: number; partnerRevision: number; mappingRevision: number;
  providerGeneration: number; identityGeneration: number; erasureGeneration: number; policyGeneration: number;
  admissionRef: string; factsSha256: string; offerFactsSha256: string;
  observedAtUtc: string; validUntilUtc: string;
}>;
export type PartnerAlertAccessTicket = Readonly<{ premium: PlatformPremiumTicket; context: PartnerAlertContextTicket }>;

/** Whitelisted immutable persistence shape. Actual current checks belong to the
 * admitted same-writer ports; a valid shape alone is never access authority. */
export function partnerAlertAccessTicket(value: PartnerAlertAccessTicket): PartnerAlertAccessTicket {
  const premium = premiumTicket(value.premium); const c = value.context;
  const uuid = (s: string) => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(s);
  const snow = (s: string) => typeof s === "string" && /^[1-9][0-9]{0,19}$/u.test(s) && BigInt(s) <= (BigInt(1) << BigInt(64)) - BigInt(1);
  if (![c.communityId, c.mappingId, c.userId].every(uuid) || !snow(c.guildId) || !snow(c.roleId) || c.guildId === c.roleId
    || (c.linkedDiscordUserId !== null && !snow(c.linkedDiscordUserId))
    || ![c.authorityRevision, c.partnerRevision, c.mappingRevision, c.providerGeneration, c.identityGeneration,
      c.erasureGeneration, c.policyGeneration].every(n => Number.isSafeInteger(n) && n > 0)
    || !/^[A-Za-z0-9_:-]{1,160}$/u.test(c.admissionRef) || !/^[0-9a-f]{64}$/u.test(c.factsSha256)
    || !/^[0-9a-f]{64}$/u.test(c.offerFactsSha256) || c.userId !== premium.scope.userId
    || c.guildId !== premium.scope.guildId || c.linkedDiscordUserId !== premium.scope.discordUserId
    || !premiumFresh(c.observedAtUtc, c.validUntilUtc, c.observedAtUtc)) throw new PartnerAlertValidationError("authorityTicket");
  return Object.freeze({ premium, context: Object.freeze({ communityId: c.communityId, mappingId: c.mappingId, userId: c.userId,
    linkedDiscordUserId: c.linkedDiscordUserId, guildId: c.guildId, roleId: c.roleId, authorityRevision: c.authorityRevision,
    partnerRevision: c.partnerRevision, mappingRevision: c.mappingRevision, providerGeneration: c.providerGeneration,
    identityGeneration: c.identityGeneration, erasureGeneration: c.erasureGeneration, policyGeneration: c.policyGeneration,
    admissionRef: c.admissionRef, factsSha256: c.factsSha256, offerFactsSha256: c.offerFactsSha256,
    observedAtUtc: c.observedAtUtc, validUntilUtc: c.validUntilUtc }) });
}
export function samePartnerAlertAccessTicket(a: PartnerAlertAccessTicket, b: PartnerAlertAccessTicket): boolean {
  return JSON.stringify(partnerAlertAccessTicket(a)) === JSON.stringify(partnerAlertAccessTicket(b));
}
export type PartnerAlertCurrency = Readonly<{ code: string; minorUnitDigits: 0 | 1 | 2 | 3 }>;
export type PartnerAlertCadence = Readonly<{ unit: "day" | "calendar_month"; count: number }>;
export type PartnerAlertWhopBinding = Readonly<{
  environment: PartnerAlertEnvironment;
  accountId: string;
  productId: string;
  planId: string;
}>;

export type PartnerAlertMappingDraft = Readonly<{
  mappingId: string;
  communityId: string;
  sourceGuildId: string;
  sourceChannelId: string;
  destinationChannelId: string;
  displayName: string;
}>;

export type PartnerAlertOffer = Readonly<{
  offerId: string;
  communityId: string;
  version: number;
  kind: "channel" | "package";
  title: string;
  mappingIds: readonly string[];
  currency: PartnerAlertCurrency;
  amountMinor: number;
  cadence: PartnerAlertCadence;
  whop: PartnerAlertWhopBinding;
}>;

/** Immutable price versions; agreement acceptance is a separate server-owned fact. */
export type PartnerAlertPublishingTerms = Readonly<{
  termsId: string;
  communityId: string;
  version: number;
  pricingSource: "standard" | "private";
  currency: PartnerAlertCurrency;
  firstChannelAmountMinor: number;
  additionalChannelAmountMinor: number;
  includedChannels: number;
  cadence: PartnerAlertCadence;
}>;

export type PartnerAlertPublishingQuote = Readonly<{
  termsId: string;
  communityId: string;
  termsVersion: number;
  pricingSource: "standard" | "private";
  contractedChannels: number;
  includedChannels: number;
  additionalChannels: number;
  firstChannelAmountMinor: number;
  additionalChannelAmountMinor: number;
  additionalTotalMinor: number;
  totalMinor: number;
  currency: PartnerAlertCurrency;
  cadence: PartnerAlertCadence;
}>;

export type PartnerAlertSourceMessage = Readonly<{
  messageId: string;
  guildId: string;
  channelId: string;
  authorId: string;
  botAuthored: boolean;
  webhookAuthored: boolean;
  messageType: number;
  text: string;
  attachmentCount: number;
  embedCount: number;
  stickerCount: number;
  componentCount: number;
  hasPoll: boolean;
  createdAtUtc: string;
  editedAtUtc: string | null;
}>;

export type PartnerAlertContentPolicy = Readonly<{
  blockedServerNames: readonly string[];
  blockedPhrases: readonly string[];
  authorMode: "all_humans" | "allowlist";
  allowedAuthorIds: readonly string[];
  mirrorBotUserId: string;
}>;

export type PartnerAlertContentIssue =
  | "empty_text" | "unsupported_media" | "link_or_invite"
  | "server_promotion" | "discord_mention" | "invalid_timestamp"
  | "oversized_text" | "unsupported_text" | "delayed_post";

export type PartnerAlertContentDecision =
  | Readonly<{ action: "allow"; text: string; parts: readonly string[]; suppressMentions: true }>
  | Readonly<{ action: "hold"; issues: readonly PartnerAlertContentIssue[] }>
  | Readonly<{
      action: "ignore";
      reason: "unmapped_source" | "before_activation" | "unsupported_message_type"
        | "mirror_output" | "author_not_allowed";
    }>;

export type PartnerAlertPremiumEvidence = Readonly<{
  ticket: PlatformPremiumTicket;
  basis: "paid_live" | "none" | "unknown";
  paidThroughUtc: string | null;
  userId: string;
  state: "active" | "inactive" | "unknown";
  observedAtUtc: string;
  validUntilUtc: string;
}>;

export type PartnerAlertDiscordEvidence = Readonly<{
  userId: string;
  discordUserId: string;
  guildId: string;
  state: "member" | "absent" | "unknown";
  observedAtUtc: string;
  validUntilUtc: string;
}>;

export type PartnerAlertMembershipEvidence = Readonly<{
  /** Absent in the preserved normalizer: that older output stays UNKNOWN.
   * Must be actual qualified native coverage, never payment timestamp+cadence. */
  paidCoverage?: Readonly<{ qualificationRef: string; membershipAccessKind: "paid_membership" | "trial" | "free" | "unknown";
    paymentCoverageKind: "paid_membership" | "trial" | "free" | "unknown"; startsAtUtc: string; endsAtUtc: string }>;
  membershipId: string;
  userId: string;
  /** Environment-scoped server HMAC of the verified Whop user ID; never an email match. */
  whopUserRef: string;
  communityId: string;
  offerId: string;
  offerVersion: number;
  whop: PartnerAlertWhopBinding;
  state: "active" | "inactive" | "unknown";
  basis: "paid" | "trial" | "complimentary" | "unknown";
  observedAtUtc: string;
  startsAtUtc: string;
  validUntilUtc: string;
}>;

/** Sales and publishing pauses are not implicit withdrawal of existing access. */
export type PartnerAlertAccessMapping = Readonly<{
  mappingId: string;
  communityId: string;
  destinationGuildId: string;
  destinationRoleId: string;
  accessState: "approved" | "withdrawn";
}>;

export type PartnerAlertAccessOffer = Readonly<{
  offer: PartnerAlertOffer;
  accessState: "approved" | "withdrawn";
}>;

/** The caller must supply owner-approved policy. There are no implicit grace/trial defaults. */
export type PartnerAlertAccessPolicy = Readonly<{
  environment: PartnerAlertEnvironment;
  destinationGuildId: string;
  maximumEvidenceAgeMs: number;
  allowedSubscriptionBases: readonly ("paid" | "trial" | "complimentary")[];
  publishingPauseAccess: "retain_paid_access" | "pause_access";
}>;

export type PartnerAlertAccessReason =
  | "allowed" | "invalid_evidence" | "mapping_withdrawn" | "partner_suspended"
  | "partner_paused" | "premium_required" | "premium_unverified"
  | "discord_required" | "discord_unverified" | "subscription_required" | "subscription_unverified";

export type PartnerAlertAccessDecision = Readonly<{
  mappingId: string;
  roleId: string;
  allowed: boolean;
  desiredRole: "present" | "absent" | "hold";
  reason: PartnerAlertAccessReason;
  validUntilUtc: string | null;
  qualifyingMembershipIds: readonly string[];
}>;

export type PartnerAlertRoleChange = Readonly<{
  roleId: string;
  action: "add" | "remove";
  mappingIds: readonly string[];
}>;

/** Codes are internal. Render messages, never provider payloads or field values. */
export class PartnerAlertValidationError extends Error {
  constructor(readonly field: string, message = "Check the partner alert settings.") {
    super(message);
    this.name = "PartnerAlertValidationError";
  }
}
