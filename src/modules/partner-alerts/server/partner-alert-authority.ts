import type {
  PartnerAlertOffer,
  PartnerAlertWhopBinding,
  PartnerAlertContextTicket,
} from "../contracts/partner-alert-contracts";
import type { PlatformPremiumScope } from "../../platform/contracts/platform-premium-access";
import type { PartnerAlertAccessInput } from "../contracts/partner-alert-access-policy";
import type { PartnerAlertPricingCapabilities } from "../contracts/partner-alert-publishing-pricing";

/**
 * Server-owned interfaces only. No implementation, auth bypass, provider adapter,
 * environment loading, DB opener or implicit grant lives here. Request JSON must
 * never be cast to these types. Later adapters validate the existing Platform
 * session/operator/community authority and hydrate provider receipts first.
 */
export type PartnerAlertActorReceipt = Readonly<{
  userId: string;
  observedAtUtc: string;
  validUntilUtc: string;
}>;

export type PartnerAlertOperatorActor = PartnerAlertActorReceipt & Readonly<{
  kind: "operator";
  authority: "platform_owner";
}>;

export type PartnerAlertCommunityOwnerActor = PartnerAlertActorReceipt & Readonly<{
  kind: "community_owner";
  communityId: string;
  guildId: string;
  ownership: "verified";
}>;

export type PartnerAlertCommunityReceipt = Readonly<{
  communityId: string;
  guildId: string;
  ownerUserId: string;
  observedAtUtc: string;
  validUntilUtc: string;
}>;

export type PartnerAlertResourceReceipt = Readonly<{
  communityId: string;
  sourceGuildId: string;
  sourceChannelId: string;
  destinationGuildId: string;
  destinationChannelId: string;
  destinationRoleId: string;
  sourceTextChannel: true;
  sourceReadable: true;
  messageContentAvailable: true;
  destinationReadOnly: true;
  destinationPrivate: true;
  destinationRoleManageable: true;
  destinationRoleExclusiveToTradersLink: true;
  observedAtUtc: string;
  validUntilUtc: string;
}>;

export type PartnerAlertWhopOfferReceipt = Readonly<{
  communityId: string;
  communityOwnerUserId: string;
  binding: PartnerAlertWhopBinding;
  /** Exact canonical offer, price and benefits reviewed against the native provider. */
  offer: PartnerAlertOffer;
  membershipVerificationAuthorised: true;
  observedAtUtc: string;
  validUntilUtc: string;
}>;

export interface PartnerAlertAuthority {
  requireOperator(): PartnerAlertOperatorActor;
  requireCommunityOwner(communityId: string): PartnerAlertCommunityOwnerActor;
  requireCommunity(communityId: string): PartnerAlertCommunityReceipt;
  requireResources(input: Readonly<{
    communityId: string;
    sourceGuildId: string;
    sourceChannelId: string;
    destinationGuildId: string;
    destinationChannelId: string;
    destinationRoleId: string;
  }>): PartnerAlertResourceReceipt;
  requireWhopOffer(communityId: string, offer: PartnerAlertOffer): PartnerAlertWhopOfferReceipt;
  pricingCapabilities(): PartnerAlertPricingCapabilities;
}

export type PartnerAlertRepositoryConfiguration = Readonly<{
  destinationGuildId: string;
  /** Synchronous trusted clock/ID factory. Repository construction runs neither. */
  nowUtc: () => string;
  createId: () => string;
}>;

/** No implementation is supplied. These facts must come from actual approved
 * mapping/offer/provider/identity/erasure readers, never request JSON or generated
 * epochs. The full context ticket is persisted alongside the Premium ticket. */
export interface PartnerAlertCommunityAccessReader {
  capture(input: Readonly<{ communityId: string; mappingId: string; userId: string }>, premiumScope: PlatformPremiumScope):
    Readonly<{ kind: "unbound" }> | Readonly<{ kind: "snapshot"; ticket: PartnerAlertContextTicket;
      input: Omit<PartnerAlertAccessInput, "ticket" | "premium" | "nowUtc">;
      previousDiscordUserIds: readonly string[] }>;
  isCurrent(ticket: PartnerAlertContextTicket): boolean;
}
