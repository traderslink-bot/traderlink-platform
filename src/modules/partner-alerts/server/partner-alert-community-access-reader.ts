import type Database from "better-sqlite3";
import type { PlatformPremiumTicket } from "../../platform/contracts/platform-premium-access";
import type { PartnerAlertAccessInput } from "../contracts/partner-alert-access-policy";
import type { PartnerAlertAccessTicket } from "../contracts/partner-alert-contracts";
import { parsePartnerAlertOffer } from "../contracts/partner-alert-validation";
import type { PartnerAlertCommunityAccessReader } from "./partner-alert-authority";
import { PartnerAlertCurrentContext } from "./partner-alert-current-context";

type NativeEvidence = Pick<PartnerAlertAccessInput, "membershipDiscovery" | "previousCommunityPaidThroughUtc"
  | "communityCoverageQualification" | "discord" | "memberships"> & Readonly<{
  whopUserRef: string | null;
  previousDiscordUserIds: readonly string[];
}>;

type Mapping = {
  mapping_id: string; destination_guild_id: string; destination_role_id: string;
  review_state: "approved" | "withdrawn";
};

/** Current SQLite facts and external evidence remain distinct. The supplied
 * evidence reader must expose only fully qualified, pre-hydrated observations
 * for the original admitted ticket, without doing network I/O in the writer. */
export class PartnerAlertCurrentCommunityAccessReader implements PartnerAlertCommunityAccessReader {
  private readonly context: PartnerAlertCurrentContext;
  constructor(private readonly database: Database.Database,
    private readonly configuration: Readonly<{
      policy: PartnerAlertAccessInput["policy"];
      nowUtc: () => string;
      readQualifiedEvidence: (ticket: PartnerAlertAccessTicket) => NativeEvidence | null;
      readStripeFunding?: (ticket: PartnerAlertAccessTicket) => PartnerAlertAccessInput["stripeFunding"];
      readDiscord?: (ticket: PartnerAlertAccessTicket) => Readonly<{
        evidence: PartnerAlertAccessInput["discord"];
        previousDiscordUserIds: readonly string[];
      }> | null;
    }>) {
    this.context = new PartnerAlertCurrentContext(database);
  }

  private whopEvidence(ticket: PartnerAlertAccessTicket): NativeEvidence | null {
    const { userId } = ticket.context;
    const native = this.configuration.readQualifiedEvidence(ticket);
    if (!native || native.membershipDiscovery !== "complete" || native.communityCoverageQualification.kind !== "qualified") return null;
    const local = this.database.prepare(`SELECT whop_user_ref FROM partner_alert_whop_identities
      WHERE user_id=? AND environment=? AND status='verified' LIMIT 2`)
      .pluck().all(userId, this.configuration.policy.environment);
    return local.length === 1 && local[0] === native.whopUserRef ? native : null;
  }

  private evidence(ticket: PartnerAlertAccessTicket): (NativeEvidence & Pick<PartnerAlertAccessInput, "stripeFunding">) | null {
    if (!this.context.isCurrent(ticket)) return null;
    const stripeFunding = this.configuration.readStripeFunding?.(ticket);
    const whop = this.whopEvidence(ticket);
    if (whop) return { ...whop, stripeFunding };
    const discord = stripeFunding ? this.configuration.readDiscord?.(ticket) : null;
    if (!discord?.evidence || discord.evidence.userId !== ticket.context.userId
      || discord.evidence.discordUserId !== ticket.context.linkedDiscordUserId
      || discord.evidence.guildId !== ticket.context.guildId) return null;
    return { stripeFunding, discord: discord.evidence, previousDiscordUserIds: discord.previousDiscordUserIds,
      membershipDiscovery: "unknown", communityCoverageQualification: { kind: "unqualified" },
      whopUserRef: null, memberships: [], previousCommunityPaidThroughUtc: null };
  }

  isCurrent(ticket: PartnerAlertAccessTicket): boolean {
    try { return this.evidence(ticket) !== null; } catch { return false; }
  }

  capture(input: Readonly<{ communityId: string; mappingId: string; userId: string }>, premium: PlatformPremiumTicket):
    ReturnType<PartnerAlertCommunityAccessReader["capture"]> {
    const unbound = { kind: "unbound" } as const;
    try {
      const ticket = this.context.capture(premium, input.mappingId);
      if (ticket.context.userId !== input.userId || ticket.context.communityId !== input.communityId
        || ticket.context.guildId !== this.configuration.policy.destinationGuildId) return unbound;
      const native = this.evidence(ticket);
      if (!native) return unbound;
      const partnerState = this.database.prepare("SELECT status FROM partner_alert_partners WHERE community_id=?")
        .pluck().get(input.communityId);
      if (partnerState !== "active" && partnerState !== "publishing_paused" && partnerState !== "suspended") return unbound;
      const rows = this.database.prepare(`SELECT mapping_id,destination_guild_id,destination_role_id,review_state
        FROM partner_alert_mappings WHERE community_id=? AND review_state IN ('approved','withdrawn')
        AND destination_role_id IS NOT NULL ORDER BY mapping_id LIMIT 101`).all(input.communityId) as Mapping[];
      if (rows.length > 100 || !rows.some(row => row.mapping_id === input.mappingId)) return unbound;
      const offerRows = this.database.prepare(`SELECT offer_json,review_state FROM partner_alert_offers
        WHERE community_id=? AND whop_environment=? AND review_state IN ('approved','withdrawn')
        ORDER BY offer_id,version LIMIT 101`).all(input.communityId, this.configuration.policy.environment) as {offer_json:string;review_state:"approved" | "withdrawn"}[];
      if (offerRows.length > 100) return unbound;
      const accounts = this.database.prepare(`SELECT whop_account_id FROM partner_alert_whop_connections
        WHERE community_id=? AND environment=? AND status='verified' AND valid_until_utc>?
        ORDER BY whop_account_id LIMIT 101`).pluck().all(input.communityId, this.configuration.policy.environment,
        this.configuration.nowUtc()) as string[];
      if (accounts.length > 100 || (!accounts.length && !native.stripeFunding)) return unbound;
      const { previousDiscordUserIds, ...facts } = native;
      return {
        kind: "snapshot", ticket: ticket.context, previousDiscordUserIds,
        input: { ...facts, ...input, partnerState, policy: this.configuration.policy, partnerWhopAccountIds: accounts,
          mappings: rows.map(row => ({ mappingId: row.mapping_id, communityId: input.communityId,
            destinationGuildId: row.destination_guild_id, destinationRoleId: row.destination_role_id, accessState: row.review_state })),
          offers: offerRows.map(row => ({ offer: parsePartnerAlertOffer(JSON.parse(row.offer_json)), accessState: row.review_state })) },
      };
    } catch { return unbound; }
  }
}
