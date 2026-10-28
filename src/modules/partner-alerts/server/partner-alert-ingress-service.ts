import type Database from "better-sqlite3";
import { PartnerAlertValidationError, type PartnerAlertSourceMessage } from "../contracts/partner-alert-contracts";
import { evaluatePartnerAlertContent } from "../contracts/partner-alert-content-policy";
import { partnerAlertId, partnerAlertInteger, partnerAlertRecord, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";
import type { PartnerAlertGatewayDispatch } from "./partner-alert-discord-gateway";

export type PartnerAlertHydratedMessage = Readonly<{ kind: "found"; message: unknown }>
  | Readonly<{ kind: "deleted" }> | Readonly<{ kind: "unavailable" }>;
type Mapping = {
  mapping_id: string; community_id: string; source_guild_id: string; source_channel_id: string;
  destination_channel_id: string; display_name: string; content_policy_json: string;
  partner_status: string; delivery_state: string; activated_at_utc: string | null;
  review_state: string; revision: number; approved_revision: number | null; owner_approved_at: string | null;
  fee_state: string | null; fee_observed_at: string | null; fee_valid_until: string | null;
};
type SourceRow = { revision: number; state: string; text_content: string | null;
  source_created_at_utc: string | null; source_edited_at_utc: string | null; hold_issues_json: string };
type Part = { part_index: number; destination_message_id: string | null; state: string };

function discordTime(value: unknown): string {
  if (typeof value !== "string" || value.length > 40
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)) {
    throw new PartnerAlertValidationError("discordTimestamp");
  }
  // Date parsing alone normalises impossible dates (for example February 30).
  const year = Number(value.slice(0, 4)); const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const calendar = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() + 1 !== month || calendar.getUTCDate() !== day
    || Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59
    || Number(value.slice(17, 19)) > 59) throw new PartnerAlertValidationError("discordTimestamp");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new PartnerAlertValidationError("discordTimestamp");
  return date.toISOString();
}
function fullMessage(value: unknown, guildId: string, channelId: string, messageId: string): PartnerAlertSourceMessage {
  const data = partnerAlertRecord(value, "discordMessage");
  const author = partnerAlertRecord(data.author, "discordAuthor");
  if (data.id !== messageId || data.channel_id !== channelId || (data.guild_id !== undefined && data.guild_id !== guildId)
    || typeof data.content !== "string" || !Array.isArray(data.attachments) || !Array.isArray(data.embeds)
    || (author.bot !== undefined && typeof author.bot !== "boolean")) throw new PartnerAlertValidationError("discordMessage");
  const count = (items: unknown) => items === undefined ? 0 : Array.isArray(items) ? items.length : -1;
  if (data.webhook_id !== undefined) partnerAlertSnowflake(data.webhook_id, "webhookId");
  return { messageId, guildId, channelId, authorId: partnerAlertSnowflake(author.id, "authorId"),
    botAuthored: author.bot === true, webhookAuthored: data.webhook_id !== undefined,
    messageType: partnerAlertInteger(data.type, "messageType", 0, 1000), text: data.content,
    attachmentCount: data.attachments.length, embedCount: data.embeds.length,
    stickerCount: count(data.sticker_items), componentCount: count(data.components),
    hasPoll: data.poll !== undefined && data.poll !== null,
    createdAtUtc: discordTime(data.timestamp), editedAtUtc: data.edited_timestamp === null ? null : discordTime(data.edited_timestamp) };
}

/** No open/startup; hydrate is injected and is called only by explicit ingest(). */
export class PartnerAlertIngressService {
  constructor(private readonly db: Database.Database, private readonly configuration: Readonly<{
    enabled: boolean; nowUtc: () => string; createId: () => string;
    maximumFeeEvidenceAgeMs: number; maximumNewAlertAgeMs: number; retentionMs: number;
    hydrate: (guildId: string, channelId: string, messageId: string) => Promise<PartnerAlertHydratedMessage>;
  }>) {
    partnerAlertInteger(configuration.maximumFeeEvidenceAgeMs, "maximumFeeEvidenceAgeMs", 1, 86_400_000);
    partnerAlertInteger(configuration.maximumNewAlertAgeMs, "maximumNewAlertAgeMs", 1, 86_400_000);
    partnerAlertInteger(configuration.retentionMs, "retentionMs", 1, 90 * 86_400_000);
  }
  private now(): string { return partnerAlertUtc(this.configuration.nowUtc(), "nowUtc"); }
  private mappings(guildId: string, channelId: string): Mapping[] {
    return this.db.prepare(`SELECT m.*,p.content_policy_json,p.status partner_status,p.approved_at_utc owner_approved_at,
      fee.state fee_state,fee.observed_at_utc fee_observed_at,fee.valid_until_utc fee_valid_until
      FROM partner_alert_mappings m JOIN partner_alert_partners p ON p.community_id=m.community_id
      LEFT JOIN partner_alert_publishing_memberships fee ON fee.community_id=p.community_id
        AND fee.agreement_id=p.current_agreement_id
      WHERE m.source_guild_id=? AND m.source_channel_id=? AND m.ever_approved=1`).all(guildId, channelId) as Mapping[];
  }
  private eligible(mapping: Mapping, at: string): boolean {
    if (mapping.partner_status !== "active" || mapping.delivery_state !== "ready" || mapping.owner_approved_at === null
      || mapping.review_state !== "approved" || mapping.approved_revision !== mapping.revision
      || mapping.activated_at_utc === null || mapping.activated_at_utc > at || mapping.fee_state !== "active"
      || mapping.fee_observed_at === null || mapping.fee_valid_until === null) return false;
    return mapping.fee_observed_at <= at && mapping.fee_valid_until > at
      && Date.parse(at) - Date.parse(mapping.fee_observed_at) < this.configuration.maximumFeeEvidenceAgeMs;
  }

  async ingest(event: PartnerAlertGatewayDispatch): Promise<void> {
    if (this.configuration.enabled !== true) return;
    const guildId = partnerAlertSnowflake(event.data.guild_id, "guildId");
    const channelId = partnerAlertSnowflake(event.data.channel_id, "channelId");
    if (!this.mappings(guildId, channelId).length) return;
    if (event.type === "MESSAGE_DELETE_BULK") {
      if (!Array.isArray(event.data.ids) || event.data.ids.length > 100) throw new PartnerAlertValidationError("messageIds");
      for (const id of new Set(event.data.ids.map(value => partnerAlertSnowflake(value, "messageId")))) {
        this.persist(guildId, channelId, id, null);
      }
      return;
    }
    const id = partnerAlertSnowflake(event.data.id, "messageId");
    if (event.type === "MESSAGE_DELETE") { this.persist(guildId, channelId, id, null); return; }
    // GET complete current content even on create/replay. Partial edits or a
    // create replay after deletion must never resurrect or invent a message.
    const hydrated = await this.configuration.hydrate(guildId, channelId, id);
    if (hydrated.kind === "unavailable") throw new PartnerAlertValidationError("sourceMessage", "The source post could not be verified.");
    this.persist(guildId, channelId, id, hydrated.kind === "deleted" ? null
      : fullMessage(hydrated.message, guildId, channelId, id));
  }

  private persist(guildId: string, channelId: string, messageId: string, message: PartnerAlertSourceMessage | null): void {
    this.db.transaction(() => {
      const at = this.now();
      for (const mapping of this.mappings(guildId, channelId)) {
        const old = this.db.prepare(`SELECT * FROM partner_alert_source_messages
          WHERE community_id=? AND source_channel_id=? AND message_id=?`)
          .get(mapping.community_id, channelId, messageId) as SourceRow | undefined;
        if (old?.state === "deleted" || (old?.state === "expired" && message !== null)) continue;
        if (message !== null && !this.eligible(mapping, at)) continue;
        if (message && old?.source_edited_at_utc && (!message.editedAtUtc || message.editedAtUtc < old.source_edited_at_utc)) continue;
        let state: "allowed" | "held" | "deleted" = "deleted";
        let issues: readonly string[] = [];
        let parts: readonly string[] = [];
        if (message) {
          const decision = evaluatePartnerAlertContent({ message,
            mapping: { mappingId: mapping.mapping_id, communityId: mapping.community_id,
              sourceGuildId: guildId, sourceChannelId: channelId,
              destinationChannelId: mapping.destination_channel_id, displayName: mapping.display_name },
            policy: JSON.parse(mapping.content_policy_json),
            activatedAtUtc: old?.source_created_at_utc ?? mapping.activated_at_utc!, nowUtc: at });
          if (decision.action === "ignore") continue;
          if ((!old && Date.parse(at) - Date.parse(message.createdAtUtc) > this.configuration.maximumNewAlertAgeMs)
            || (old && (JSON.parse(old.hold_issues_json) as string[]).includes("delayed_post"))) {
            state = "held"; issues = ["delayed_post"];
          } else if (decision.action === "hold") { state = "held"; issues = decision.issues; }
          else { state = "allowed"; parts = decision.parts; }
        }
        const text = message && message.text.length <= 32_000 ? message.text : null;
        const issueJson = JSON.stringify(issues);
        if (old && old.state === state && old.text_content === text && old.hold_issues_json === issueJson
          && old.source_edited_at_utc === (message?.editedAtUtc ?? old.source_edited_at_utc)) continue;
        const revision = partnerAlertInteger((old?.revision ?? 0) + 1, "sourceRevision", 1);
        const retainUntil = new Date(Date.parse(at) + this.configuration.retentionMs).toISOString();
        if (old) this.db.prepare(`UPDATE partner_alert_source_messages SET revision=?,state=?,text_content=?,
          source_edited_at_utc=?,hold_issues_json=?,retain_until_utc=?
          WHERE community_id=? AND source_channel_id=? AND message_id=?`).run(revision, state, text,
          message?.editedAtUtc ?? old.source_edited_at_utc, issueJson, retainUntil, mapping.community_id, channelId, messageId);
        else this.db.prepare(`INSERT INTO partner_alert_source_messages
          (community_id,source_guild_id,source_channel_id,message_id,revision,state,text_content,
           source_created_at_utc,source_edited_at_utc,hold_issues_json,retain_until_utc)
          VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(mapping.community_id, guildId, channelId, messageId, revision,
          state, text, message?.createdAtUtc ?? null, message?.editedAtUtc ?? null, issueJson, retainUntil);
        this.db.prepare(`INSERT INTO partner_alert_source_revisions
          (community_id,source_channel_id,message_id,revision,state,hold_issues_json,text_content,observed_at_utc)
          VALUES(?,?,?,?,?,?,?,?)`).run(mapping.community_id, channelId, messageId, revision, state, issueJson, text, at);
        this.queueParts(mapping, messageId, revision, parts, message?.createdAtUtc ?? old?.source_created_at_utc ?? null, at);
      }
    }).immediate();
  }

  private queueParts(mapping: Mapping, messageId: string, revision: number, bodies: readonly string[],
    createdAt: string | null, at: string): void {
    const previous = this.db.prepare(`SELECT * FROM partner_alert_mirrored_parts WHERE mapping_id=? AND message_id=?`)
      .all(mapping.mapping_id, messageId) as Part[];
    this.db.prepare(`UPDATE partner_alert_deliveries SET status='cancelled' WHERE mapping_id=? AND message_id=?
      AND source_revision<? AND status IN ('pending','failed')`).run(mapping.mapping_id, messageId, revision);
    const indexes = new Set([...bodies.map((_, index) => index), ...previous.map(part => part.part_index)]);
    for (const index of [...indexes].sort((a, b) => a - b)) {
      const old = previous.find(part => part.part_index === index);
      const body = bodies[index] === undefined ? null
        : `${createdAt ? `Posted ${createdAt.slice(0, 19).replace("T", " ")} UTC\n` : ""}${bodies.length > 1 ? `[${index + 1} of ${bodies.length}]\n` : ""}${bodies[index]}`;
      if (body === null && (!old || old.state === "deleted")) continue;
      const action = body === null ? "delete" : old?.destination_message_id ? "edit" : "create";
      const status = old?.state === "uncertain" ? "uncertain" : "pending";
      this.db.prepare(`INSERT INTO partner_alert_deliveries
        (delivery_id,community_id,mapping_id,source_channel_id,message_id,source_revision,part_index,
         action,status,destination_message_id,text_content,next_attempt_at_utc)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(partnerAlertId(this.configuration.createId(), "deliveryId"),
        mapping.community_id, mapping.mapping_id, mapping.source_channel_id, messageId, revision, index,
        action, status, old?.destination_message_id ?? null, body, at);
    }
  }
}
