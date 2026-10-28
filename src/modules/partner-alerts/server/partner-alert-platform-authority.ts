import type { TraderLinkCommunityRepository } from "../../communities/server/traderlink-community-repository";
import type { PlatformAdminAuthorization } from "../../platform/server/administration/platform-admin-authorization";
import type { PlatformAuthenticationRepository } from "../../platform/server/authentication/platform-authentication-repository";
import type { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import type { requireTraderLinkPlatformAuthenticatedRequestIdentity, TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertInteger, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";
import type { PartnerAlertAuthority, PartnerAlertCommunityOwnerActor, PartnerAlertCommunityReceipt,
  PartnerAlertOperatorActor, PartnerAlertCommunityAccessReader } from "./partner-alert-authority";
import { evaluatePlatformPremium, premiumFresh, premiumUtc } from "../../platform/contracts/platform-premium-access";
import type { PlatformPremiumAuthority } from "../../platform/server/membership/platform-premium-role-reconciliation";
import type { PremiumAdmittedImmediateWriter, MembershipPremiumProducerReadPort } from "../../platform/server/membership/platform-premium-current-authority";
import { partnerAlertAccessTicket, type PartnerAlertAccessTicket, type PartnerAlertPremiumEvidence } from "../contracts/partner-alert-contracts";
import type { PartnerAlertRoleAuthority, PartnerAlertRoleSnapshot } from "./partner-alert-role-worker";

/** TYPE-only current exports. Actual implementations must be explicitly bound by
 * a reviewed current-baseline runtime; this module opens/loads no runtime. */
export type PartnerAlertPlatformReadBindings = Readonly<{
  resolveIdentity: typeof requireTraderLinkPlatformAuthenticatedRequestIdentity;
  identityOptions: NonNullable<Parameters<typeof requireTraderLinkPlatformAuthenticatedRequestIdentity>[1]> & {
    environment: NodeJS.ProcessEnv;
  };
  admin: Pick<PlatformAdminAuthorization, "authorize">;
  communities: Pick<TraderLinkCommunityRepository, "findById" | "resolveAccess">;
  discordMemberships: Pick<PlatformDiscordMembershipRepository, "findCurrent">;
  nowUtc: () => string;
  maximumActorAgeMs: number;
  maximumDiscordEvidenceAgeMs: number;
  destinationGuildId: string;
}>;

/** Existing mutation callers still supply all three native/config dependencies.
 * Authenticated settings reads require only the actual read bindings above;
 * omitting a mutation dependency never creates a positive resource receipt. */
export type PartnerAlertPlatformBindings = PartnerAlertPlatformReadBindings & Readonly<{
  verifiedResources: PartnerAlertAuthority["requireResources"];
  verifiedWhopOffer: PartnerAlertAuthority["requireWhopOffer"];
  qualifiedPricing: PartnerAlertAuthority["pricingCapabilities"];
}>;

function freshDeadline(observed: string, now: string, maximumAgeMs: number): string {
  const at = Date.parse(partnerAlertUtc(observed, "observedAtUtc"));
  const current = Date.parse(partnerAlertUtc(now, "nowUtc"));
  if (at > current || current - at >= maximumAgeMs) throw new PartnerAlertValidationError("authority", "Access must be verified again.");
  return new Date(at + maximumAgeMs).toISOString();
}

/** Per-request server-owned adapter. No public constructor from browser actors. */
export class PartnerAlertPlatformAuthority implements PartnerAlertAuthority {
  private constructor(private readonly identity: TraderLinkPlatformRequestIdentity,
    private readonly headers: Headers, private readonly authenticatedAtUtc: string,
    private readonly bindings: PartnerAlertPlatformReadBindings & Partial<PartnerAlertPlatformBindings>) {}

  static forRequest(request: Request, bindings: PartnerAlertPlatformReadBindings & Partial<PartnerAlertPlatformBindings>): PartnerAlertPlatformAuthority {
    partnerAlertInteger(bindings.maximumActorAgeMs, "maximumActorAgeMs", 1, 300_000);
    partnerAlertInteger(bindings.maximumDiscordEvidenceAgeMs, "maximumDiscordEvidenceAgeMs", 1, 300_000);
    partnerAlertSnowflake(bindings.destinationGuildId, "destinationGuildId");
    const identity = bindings.resolveIdentity(request.headers, bindings.identityOptions);
    // No development shortcut, workspace-owner inference or browser actor field.
    if (identity.mode !== "platform_session" || !identity.sessionId) throw new PartnerAlertValidationError("identity", "Sign in again.");
    partnerAlertId(identity.scope.userId, "userId"); partnerAlertId(identity.sessionId, "sessionId");
    const at = partnerAlertUtc(bindings.nowUtc(), "nowUtc");
    return new PartnerAlertPlatformAuthority(identity, new Headers(request.headers), at, bindings);
  }
  private now(): string { return partnerAlertUtc(this.bindings.nowUtc(), "nowUtc"); }
  requireSignedInUser(): Readonly<{ userId: string; sessionId: string; observedAtUtc: string; validUntilUtc: string }> {
    const until = freshDeadline(this.authenticatedAtUtc, this.now(), this.bindings.maximumActorAgeMs);
    return Object.freeze({ userId: this.identity.scope.userId, sessionId: this.identity.sessionId!,
      observedAtUtc: this.authenticatedAtUtc, validUntilUtc: until });
  }
  requireOperator(): PartnerAlertOperatorActor {
    const member = this.requireSignedInUser(); const at = this.now();
    const scope = this.bindings.admin.authorize(this.identity, this.headers);
    if (scope.userId !== member.userId || scope.role !== "journal_owner_admin" || scope.mode !== "production_discord_owner"
      || !scope.discordOwnerVerifiedAtUtc) throw new PartnerAlertValidationError("operator", "Owner access could not be verified.");
    const authorisedUntil = freshDeadline(scope.authorizedAtUtc, at, this.bindings.maximumActorAgeMs);
    const ownerUntil = freshDeadline(scope.discordOwnerVerifiedAtUtc, at, this.bindings.maximumDiscordEvidenceAgeMs);
    return Object.freeze({ kind: "operator", authority: "platform_owner", userId: member.userId,
      observedAtUtc: at, validUntilUtc: [member.validUntilUtc, authorisedUntil, ownerUntil].sort()[0]! });
  }
  requireCommunity(communityId: string): PartnerAlertCommunityReceipt {
    this.requireSignedInUser(); partnerAlertId(communityId, "communityId");
    const community = this.bindings.communities.findById(communityId); const at = this.now();
    if (!community || community.communityId !== communityId || community.status === "suspended") {
      throw new PartnerAlertValidationError("community", "The community is unavailable.");
    }
    partnerAlertId(community.ownerUserId, "communityOwnerUserId"); partnerAlertSnowflake(community.discordGuildId, "guildId");
    const access = this.bindings.communities.resolveAccess(communityId, community.ownerUserId);
    const discord = this.bindings.discordMemberships.findCurrent(community.ownerUserId, community.discordGuildId);
    if (!access.isOwner || access.userId !== community.ownerUserId || access.communityId !== communityId
      || access.membershipStatus !== "active" || !access.capabilities.includes("community.manage")
      || !discord?.guildOwner || discord.userId !== community.ownerUserId || discord.guildId !== community.discordGuildId) {
      throw new PartnerAlertValidationError("communityOwner", "Community ownership must be verified again.");
    }
    const until = freshDeadline(discord.lastVerifiedAtUtc, at, this.bindings.maximumDiscordEvidenceAgeMs);
    return Object.freeze({ communityId, guildId: community.discordGuildId, ownerUserId: community.ownerUserId,
      observedAtUtc: discord.lastVerifiedAtUtc, validUntilUtc: until });
  }
  requireCommunityOwner(communityId: string): PartnerAlertCommunityOwnerActor {
    const member = this.requireSignedInUser(); const community = this.requireCommunity(communityId);
    if (community.ownerUserId !== member.userId) throw new PartnerAlertValidationError("communityOwner", "Only the verified community owner can do this.");
    return Object.freeze({ kind: "community_owner", userId: member.userId, communityId,
      guildId: community.guildId, ownership: "verified", observedAtUtc: this.now(),
      validUntilUtc: [member.validUntilUtc, community.validUntilUtc].sort()[0]! });
  }
  requireResources(input: Parameters<PartnerAlertAuthority["requireResources"]>[0]) {
    const community = this.requireCommunity(input.communityId);
    if (input.sourceGuildId !== community.guildId || input.destinationGuildId !== this.bindings.destinationGuildId) {
      throw new PartnerAlertValidationError("resources");
    }
    if (typeof this.bindings.verifiedResources !== "function") {
      throw new PartnerAlertValidationError("requestAuthority", "This action could not be authorized.");
    }
    return this.bindings.verifiedResources(input);
  }
  requireWhopOffer(...args: Parameters<PartnerAlertAuthority["requireWhopOffer"]>) {
    this.requireCommunity(args[0]);
    if (typeof this.bindings.verifiedWhopOffer !== "function") {
      throw new PartnerAlertValidationError("requestAuthority", "This action could not be authorized.");
    }
    return this.bindings.verifiedWhopOffer(...args);
  }
  pricingCapabilities() {
    this.requireSignedInUser();
    if (typeof this.bindings.qualifiedPricing !== "function") {
      throw new PartnerAlertValidationError("requestAuthority", "This action could not be authorized.");
    }
    return this.bindings.qualifiedPricing();
  }
}

export const PARTNER_ALERT_PLATFORM_BRIDGE_BLOCKERS = Object.freeze([
  "premium_source_policy_not_selected_and_qualified",
  "no_exported_current_discord_subject_and_membership_snapshot_binding",
  "no_bound_current_runtime_authority_generation_or_identity_history_adapter",
] as const);

/** Actual V4 Premium read/ticket/mapper interface plus independent community authority.
 * Disabled/null by default. This supplies no native reader, admission/erasure,
 * context-generation, credential or runtime implementation. Diagnostic legacy
 * role/member observations above never become positive payment evidence. */
export class PartnerAlertCombinedRoleAuthority implements PartnerAlertRoleAuthority {
  private readonly configuration: Readonly<{ enabled: boolean; guildId: string; nowUtc: () => string }>;
  constructor(configuration: Readonly<{ enabled?: boolean; guildId: string; nowUtc: () => string }>,
    private readonly premium: PlatformPremiumAuthority | null = null,
    private readonly community: PartnerAlertCommunityAccessReader | null = null,
    private readonly writer: PremiumAdmittedImmediateWriter | null = null,
    /** Actual V4 method, structurally injected; no provider is constructed here. */
    private readonly principals: Pick<MembershipPremiumProducerReadPort, "resolveUserAuthority"> | null = null) {
    partnerAlertSnowflake(configuration.guildId, "guildId");
    if (typeof configuration.nowUtc !== "function") throw new PartnerAlertValidationError("clock");
    this.configuration = Object.freeze({ enabled: configuration.enabled === true, guildId: configuration.guildId, nowUtc: configuration.nowUtc });
  }
  inCurrentWriter<T>(operation: () => T): T {
    if (this.configuration.enabled !== true || !this.premium || !this.community || !this.writer || !this.principals) throw new PartnerAlertValidationError("authorityUnbound");
    return this.writer.run(() => {
      if (this.writer!.isCurrentWriter() !== true) throw new PartnerAlertValidationError("admissionUnbound");
      const result = operation();
      if (result !== null && (typeof result === "object" || typeof result === "function")
        && typeof (result as { then?: unknown }).then === "function") throw new PartnerAlertValidationError("asyncWriter");
      return result;
    });
  }
  isCurrent(input: PartnerAlertAccessTicket): boolean {
    try {
      if (this.configuration.enabled !== true || !this.premium || !this.community || !this.principals || this.writer?.isCurrentWriter() !== true) return false;
      const ticket = partnerAlertAccessTicket(input); const at = premiumUtc(this.configuration.nowUtc());
      return ticket.context.guildId === this.configuration.guildId
        && premiumFresh(ticket.premium.observedAtUtc, ticket.premium.validUntilUtc, at)
        && premiumFresh(ticket.context.observedAtUtc, ticket.context.validUntilUtc, at)
        && this.premium.isCurrent(ticket.premium) === true && this.community.isCurrent(ticket.context) === true;
    } catch { return false; }
  }
  async refresh(input: Readonly<{ communityId: string; mappingId: string; userId: string }>): Promise<PartnerAlertRoleSnapshot> {
    if (this.configuration.enabled !== true || !this.premium || !this.community || !this.writer || !this.principals) throw new PartnerAlertValidationError("authorityUnbound");
    // The authority key must be resolved by a real server-owned mapper. A user
    // UUID is not an authority key, and no email/username/role inference is used.
    partnerAlertId(input.communityId, "communityId"); partnerAlertId(input.mappingId, "mappingId"); partnerAlertId(input.userId, "userId");
    const mapped = this.inCurrentWriter(() => this.principals!.resolveUserAuthority(input.userId, this.configuration.guildId));
    if (mapped.kind !== "linked") throw new PartnerAlertValidationError("principalMapperUnbound");
    const loaded = await this.premium.loadCurrent(partnerAlertId(mapped.authorityKey, "authorityKey"));
    if (loaded.kind !== "snapshot") throw new PartnerAlertValidationError("premiumUnbound");
    const p = structuredClone(loaded.snapshot);
    return this.inCurrentWriter(() => {
      const at = premiumUtc(this.configuration.nowUtc());
      if (p.scope.userId !== input.userId || p.scope.guildId !== this.configuration.guildId
        || !this.premium!.isCurrent(p.ticket)) throw new PartnerAlertValidationError("premiumChanged");
      const own = this.community!.capture(input, p.scope);
      if (own.kind !== "snapshot") throw new PartnerAlertValidationError("communityUnbound");
      const ticket = partnerAlertAccessTicket({ premium: p.ticket, context: own.ticket });
      const c = ticket.context;
      if (c.communityId !== input.communityId || c.mappingId !== input.mappingId || c.userId !== input.userId
        || own.input.communityId !== input.communityId || own.input.mappingId !== input.mappingId || own.input.userId !== input.userId
        || !Array.isArray(own.previousDiscordUserIds) || own.previousDiscordUserIds.length > 100
        || !this.isCurrent(ticket)) throw new PartnerAlertValidationError("contextChanged");
      own.previousDiscordUserIds.forEach(id => partnerAlertSnowflake(id, "previousDiscordUserId"));
      const decision = evaluatePlatformPremium(p, at);
      const priorEnded = p.previousPaidThroughUtc !== null && premiumUtc(p.previousPaidThroughUtc) <= at;
      const knownUnpaid = p.payer.kind === "bound" && p.coverage.length > 0 && p.coverage.every(item => item.kind === "evidence"
        && item.offer.environment === "live" && item.evidence.kind === "not_paid"
        && premiumFresh(item.evidence.observedAtUtc, item.evidence.validUntilUtc, at));
      const paid = decision.partnerPaidEligible && decision.reason === "paid";
      const evidence: PartnerAlertPremiumEvidence = Object.freeze({ ticket: p.ticket, userId: input.userId,
        state: paid ? "active" : priorEnded || knownUnpaid ? "inactive" : "unknown",
        basis: paid ? "paid_live" : priorEnded || knownUnpaid ? "none" : "unknown",
        paidThroughUtc: paid ? decision.paidThroughUtc : null,
        observedAtUtc: p.ticket.observedAtUtc, validUntilUtc: p.ticket.validUntilUtc });
      return Object.freeze({ ticket, authorityRevision: c.authorityRevision, linkedDiscordUserId: c.linkedDiscordUserId,
        previousDiscordUserIds: Object.freeze([...new Set(own.previousDiscordUserIds)]),
        input: Object.freeze({ ...structuredClone(own.input), ticket, premium: evidence, nowUtc: at }) });
    });
  }
}

/** Diagnostic projection ONLY, never Premium/Discord access evidence. Existing
 * findActiveIdentity verifies a supplied subject, but cannot discover the user's
 * unique current subject; membership rows do not record that subject. Therefore
 * a fresh user/guild row alone cannot safely transfer roles after relinking. */
export function inspectPartnerAlertConfiguredDiscordEvidence(input: Readonly<{
  userId: string; discordUserId: string; destinationGuildId: string;
  premiumRoleId: string | null; maximumEvidenceAgeMs: number; nowUtc: string;
}>, dependencies: Readonly<{
  identities: Pick<PlatformAuthenticationRepository, "findActiveIdentity">;
  memberships: Pick<PlatformDiscordMembershipRepository, "findCurrent">;
}>): Readonly<{ canAuthorise: false; observedMember: boolean; observedPremiumRole: boolean | null;
  blockedBy: readonly string[] }> {
  const none = Object.freeze({ canAuthorise: false as const, observedMember: false, observedPremiumRole: null,
    blockedBy: PARTNER_ALERT_PLATFORM_BRIDGE_BLOCKERS });
  try {
    partnerAlertId(input.userId, "userId"); partnerAlertSnowflake(input.discordUserId, "discordUserId");
    partnerAlertSnowflake(input.destinationGuildId, "destinationGuildId");
    partnerAlertInteger(input.maximumEvidenceAgeMs, "maximumEvidenceAgeMs", 1, 300_000);
    const now = partnerAlertUtc(input.nowUtc, "nowUtc");
    const identity = dependencies.identities.findActiveIdentity("discord", input.discordUserId);
    if (!identity || identity.userId !== input.userId || identity.authProvider !== "discord" || identity.status !== "active") return none;
    const member = dependencies.memberships.findCurrent(input.userId, input.destinationGuildId);
    if (!member || member.userId !== input.userId || member.guildId !== input.destinationGuildId) return none;
    freshDeadline(member.lastVerifiedAtUtc, now, input.maximumEvidenceAgeMs);
    if (member.lastVerifiedAtUtc < partnerAlertUtc(identity.updatedAtUtc, "identityUpdatedAtUtc")) return none;
    let observedPremiumRole: boolean | null = null;
    if (input.premiumRoleId !== null) {
      partnerAlertSnowflake(input.premiumRoleId, "premiumRoleId");
      observedPremiumRole = member.roleIds.includes(input.premiumRoleId);
    }
    return Object.freeze({ canAuthorise: false, observedMember: true, observedPremiumRole,
      blockedBy: PARTNER_ALERT_PLATFORM_BRIDGE_BLOCKERS });
  } catch { return none; }
}
