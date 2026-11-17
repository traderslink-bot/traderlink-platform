import { isCommunityReviewDiscordGuild } from "@/src/modules/communities/server/community-review-discord-guild";
import type Database from "better-sqlite3";
import type { PartnerAlertAccessInput } from "../contracts/partner-alert-access-policy";
import { requirePlatformErasureWriter, type PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import type { PremiumOwnedHistoryReader } from "../../platform/server/membership/platform-premium-current-authority";
import { SqlitePlatformPremiumRoleStore } from "../../platform/server/membership/platform-premium-role-store";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { partnerAlertSnowflake } from "../contracts/partner-alert-validation";
import { requirePartnerAlertAdmission } from "./partner-alert-admission";
import { PartnerAlertCurrentCommunityAccessReader } from "./partner-alert-community-access-reader";
import { startPartnerAlertMaintenance } from "./partner-alert-maintenance";
import { createPartnerAlertPaidAuthority } from "./partner-alert-platform-authority";
import { createPartnerAlertWhopReceiptReader, type PartnerAlertWhopReceiptInputs } from "./partner-alert-whop-evidence-reader";
import type { PartnerAlertSubscriberOffer, PartnerAlertSubscriberRoleObserver } from "./partner-alert-subscriber-access";
import { readPartnerAlertStripeChannelFunding } from "./database/partner-alert-stripe-channel-funding";
import { PartnerAlertCurrentContext } from "./partner-alert-current-context";
import { readPartnerAlertWhopCredentialConfiguration, resolvePartnerAlertWhopReadEnvironment } from "./partner-alert-catalog-runtime-configuration";
import { readPartnerAlertExistingWhopTarget, verifyPartnerAlertExistingWhopAccess } from "./partner-alert-existing-whop-access";
import type { PartnerAlertWhopTransport } from "./partner-alert-whop-client";

type SubscriberInputs = Readonly<{
  paidRoleId: string;
  complimentaryRoleId: string | null;
  policy: PartnerAlertAccessInput["policy"];
  history: PremiumOwnedHistoryReader;
  receipt: Omit<PartnerAlertWhopReceiptInputs, "nowUtc" | "environment" | "maximumEvidenceAgeMs">;
}>;

export type PartnerAlertNativeProvider = Readonly<{
  bindSubscriber: (db: Database.Database, core: PlatformErasureAdmission,
    target: PartnerAlertSubscriberOffer) => SubscriberInputs | null;
  maintenance: Parameters<typeof startPartnerAlertMaintenance>[0];
}>;

const slot = Symbol.for("traderlink.partner-alert.native-provider.v1");
const running = Symbol.for("traderlink.partner-alert.native-maintenance.v1");
const state = globalThis as typeof globalThis & { [slot]?: PartnerAlertNativeProvider; [running]?: () => Promise<void> };

/** Only reviewed server bootstrap supplies native inputs. Reading an env flag
 * cannot turn on access without this exact provider binding. */
export function installPartnerAlertNativeProvider(provider: PartnerAlertNativeProvider): void {
  if (state[slot]) throw new Error("Partner native provider already installed.");
  state[slot] = Object.freeze(provider);
}

export function startConfiguredPartnerAlertMaintenance(): (() => Promise<void>) | null {
  if (process.env.NODE_ENV !== "production" || process.env.PARTNER_ALERT_LIFECYCLE_ENABLED !== "true") return null;
  const config = state[slot]?.maintenance;
  if (!config) return null;
  if (state[running]) return state[running];
  const stop = startPartnerAlertMaintenance(config);
  const close = () => stop().finally(() => { if (state[running] === close) delete state[running]; });
  state[running] = close;
  return close;
}

/** The reviewed production path publishes subscriber authority only after
 * the same maintenance setup has opened and qualified its connection. */
export function startReviewedPartnerAlertNativeProvider(provider: PartnerAlertNativeProvider): () => Promise<void> {
  if (state[slot] || state[running]) throw new Error("Partner native provider already installed.");
  const stop = startPartnerAlertMaintenance(provider.maintenance);
  const close = () => stop().finally(() => {
    if (state[running] === close) delete state[running];
    if (state[slot] === provider) delete state[slot];
  });
  state[slot] = provider;
  state[running] = close;
  return close;
}

export function resolvePartnerAlertSandboxPremiumRole(db: Database.Database, environment: NodeJS.ProcessEnv, guildId: string): string | null {
  return environment.PARTNER_STRIPE_DISCORD_GUILD_ID === guildId
    ? resolvePartnerAlertRegisteredPremiumRole(db, guildId, environment.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID) : null;
}

export function resolvePartnerAlertRegisteredPremiumRole(db: Database.Database, guildId: string, configuredRoleId: string | undefined): string | null {
  try {
    const paidRoleId = partnerAlertSnowflake(configuredRoleId, "premiumMemberRoleId");
    const hasMembershipAuthority = db.prepare(`SELECT 1 FROM platform_premium_authority_policies
      WHERE guild_id=? AND state='active' AND native_qualification_json IS NOT NULL LIMIT 1`).get(guildId);
    return paidRoleId !== guildId && hasMembershipAuthority ? paidRoleId : null;
  } catch { return null; }
}

export function bindPartnerAlertNativeSubscriber(db: Database.Database, core: PlatformErasureAdmission,
  target: PartnerAlertSubscriberOffer, guildId: string, stripeEnvironment?: "sandbox" | "live", registeredPremiumRoleId?: string | null,
  provider?: Readonly<{ whopTransport?: PartnerAlertWhopTransport; observeDiscord?: PartnerAlertSubscriberRoleObserver }>) {
  const whopEnvironment = resolvePartnerAlertWhopReadEnvironment(stripeEnvironment);
  if (!isCommunityReviewDiscordGuild(guildId)) return null;
  if (whopEnvironment === "sandbox" && guildId !== process.env.PARTNER_STRIPE_DISCORD_GUILD_ID) return null;
  const input = whopEnvironment === "sandbox" ? null : state[slot]?.bindSubscriber(db, core, target);
  if ((input && (input.policy.destinationGuildId !== guildId || input.policy.environment !== "live"))
    || (!input && !registeredPremiumRoleId)) return null;
  const admission = requirePartnerAlertAdmission(db);
  const nowUtc = () => core.now();
  const writer = {
    run: <T>(operation: () => T) => admission.runCommunity(target.communityId, [target.userId], operation),
    isCurrentWriter: () => {
      try { return requirePlatformErasureWriter(db, target.userId) === core; } catch { return false; }
    },
  };
  const policy = input?.policy ?? { environment: whopEnvironment, destinationGuildId: guildId, maximumEvidenceAgeMs: 300_000,
    allowedSubscriptionBases: ["paid" as const], publishingPauseAccess: "retain_paid_access" as const };
  const paidRoleId = input?.paidRoleId ?? registeredPremiumRoleId!;
  const producer = core.memberRepository(target.userId);
  const context = new PartnerAlertCurrentContext(db);
  const whop = stripeEnvironment === "live" || whopEnvironment === "sandbox"
    ? readPartnerAlertWhopCredentialConfiguration(process.env) : null;
  let observedDiscord: Awaited<ReturnType<PartnerAlertSubscriberRoleObserver>> = null;
  const readQualifiedEvidence = input ? createPartnerAlertWhopReceiptReader(db, {
    ...input.receipt, environment: "live", nowUtc, maximumEvidenceAgeMs: policy.maximumEvidenceAgeMs,
    readCurrentGenerations: (ticket, offer) => {
      const generations = input.receipt.readCurrentGenerations(ticket, offer);
      return generations?.erasure === core.lifecycle(target.userId).erasure_generation ? generations : null;
    },
  }) : () => null;
  return createPartnerAlertPaidAuthority({
    enabled: true, guildId, paidRoleId, complimentaryRoleId: input?.complimentaryRoleId ?? null,
    nowUtc, writer, producer, history: input?.history ?? new SqlitePlatformPremiumRoleStore(db, { enabled: true, guildId, paidRoleId }),
    prepareExistingWhopAccess: whop || provider?.observeDiscord ? async (scope, premium) => {
      const discordUserId = premium.scope.discordUserId;
      if (provider?.observeDiscord && discordUserId && (!observedDiscord || observedDiscord.discordUserId !== discordUserId
        || observedDiscord.validUntilUtc <= nowUtc())) {
        observedDiscord = await provider.observeDiscord({ guildId, discordUserId });
      }
      if (!whop) return null;
      try {
        const admitted = writer.run(() => {
          const ticket = context.capture(premium, scope.mappingId);
          if (ticket.context.communityId !== scope.communityId || ticket.context.userId !== target.userId) return null;
          const binding = readPartnerAlertExistingWhopTarget(db, ticket, whopEnvironment);
          return binding && { ticket, binding };
        });
        if (!admitted) return null;
        const access = await verifyPartnerAlertExistingWhopAccess({ database: db, ...whop, nowUtc,
          transport: provider?.whopTransport ?? ((url, request) => fetch(url, request)) }, admitted.binding);
        return () => context.isCurrent(admitted.ticket)
          && resolvePartnerAlertWhopReadEnvironment(stripeEnvironment) === whopEnvironment
          && JSON.stringify(readPartnerAlertWhopCredentialConfiguration(process.env)) === JSON.stringify(whop)
          && JSON.stringify(readPartnerAlertExistingWhopTarget(db, admitted.ticket, whopEnvironment)) === JSON.stringify(admitted.binding)
          ? access : { ...access, kind: "unknown", retainedOffers: [] };
      } catch { return null; }
    } : undefined,
    community: new PartnerAlertCurrentCommunityAccessReader(db, { policy, nowUtc, readQualifiedEvidence,
      readDiscord: input?.receipt.readDiscord ?? (ticket => {
        if (!writer.isCurrentWriter()) return null;
        const { userId, linkedDiscordUserId } = ticket.context;
        if (!linkedDiscordUserId) return null;
        const linked = db.prepare(`SELECT auth_subject,created_at_utc FROM platform_auth_identities
          WHERE user_id=? AND auth_provider='discord' AND status='active' LIMIT 2`).all(userId) as
          { auth_subject: string; created_at_utc: string }[];
        if (linked.length !== 1 || linked[0]?.auth_subject !== linkedDiscordUserId) return null;
        const at = nowUtc();
        const native = observedDiscord?.discordUserId === linkedDiscordUserId && observedDiscord.guildId === guildId
          && observedDiscord.observedAtUtc >= linked[0].created_at_utc
          && observedDiscord.observedAtUtc <= at && observedDiscord.validUntilUtc > at ? observedDiscord : null;
        const member = native ? null : new PlatformDiscordMembershipRepository(db).findCurrent(userId, guildId);
        const observedAtUtc = native?.observedAtUtc ?? member?.lastVerifiedAtUtc;
        if (!observedAtUtc || observedAtUtc < linked[0].created_at_utc || observedAtUtc > at) return null;
        const validUntilUtc = native?.validUntilUtc ?? new Date(Date.parse(observedAtUtc) + policy.maximumEvidenceAgeMs).toISOString();
        if (validUntilUtc <= at) return null;
        const previous = producer.captureV2(ticket.premium.scope.authorityKey);
        return { evidence: { userId, discordUserId: linkedDiscordUserId, guildId, state: "member",
          observedAtUtc, validUntilUtc }, previousDiscordUserIds: previous.kind === "snapshot"
          ? previous.retiredSubjectFacts.map(entry => entry.discordUserId) : [] };
      }),
      readStripeFunding: stripeEnvironment ? ticket => {
        const { userId, communityId, mappingId } = ticket.context;
        if (!writer.isCurrentWriter()) throw new Error("Unqualified Stripe coverage reader.");
        return readPartnerAlertStripeChannelFunding(db, { userId, communityId, mappingId,
          environment: stripeEnvironment, whopEnvironment, atMs: Date.parse(nowUtc()) });
      } : undefined,
    }),
  });
}
