import type Database from "better-sqlite3";
import type { SharedAlertActor, SharedAlertStatus } from "../contracts/shared-alerts-contracts";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";
import { cancelStoppedSharedAlertParts } from "./shared-alerts-parts";
import { isSharedAlertPublisher } from "./shared-alerts-publisher-permissions";
import { SharedAlertError } from "./shared-alerts-errors";
import type { VerifiedSharedAlertChannel } from "./shared-alerts-discord";
import { sharedAlertsPreviewHourlyLimitLifted, sharedAlertsPreviewMessageLimitLifted, sharedAlertsPreviewPeerLimitLifted } from "./shared-alerts-preview-policy";

export const SHARED_ALERT_OWNER_FRESHNESS_MS = 5 * 60 * 1000;
export type SharedAlertOwnerContext = Readonly<{ communityId: string; guildId: string; ownerUserId: string; discordUserId: string; name: string; slug: string; ownerName: string }>;
export type SharedAlertRequestRow = {
  request_id: string; source_community_id: string; receiver_community_id: string; initiator_community_id: string;
  source_owner_user_id: string; receiver_owner_user_id: string; source_owner_discord_id: string; receiver_owner_discord_id: string;
  status: SharedAlertStatus; terms_version: number; source_approved_version: number | null; receiver_approved_version: number | null;
  show_source_name: number;
  source_paused: number; receiver_paused: number; activated_at_utc: string | null; created_at_utc: string; updated_at_utc: string;
};

function body(value: string): string {
  const normalized = value.normalize("NFKC").replace(/\r\n?/gu, "\n").trim();
  if (!normalized || normalized.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(normalized)) throw new SharedAlertError("invalid");
  return normalized;
}

export class SharedAlertsRepository {
  constructor(readonly database: Database.Database, private readonly now: () => string = createCanonicalUtcTimestamp) {}
  private write<T>(operation: () => T): T { return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate(); }

  ownerContext(communityId: string): SharedAlertOwnerContext {
    assertCanonicalUuidV4(communityId, "communityId");
    const row = this.database.prepare(`SELECT c.community_id,c.discord_guild_id,c.owner_user_id,c.display_name,c.slug,
      i.auth_subject,coalesce(m.global_display_name,m.username) owner_name
      FROM traderlink_communities c JOIN platform_users u ON u.user_id=c.owner_user_id AND u.status='active'
      JOIN platform_auth_identities i ON i.user_id=u.user_id AND i.auth_provider='discord' AND i.status='active'
      JOIN platform_discord_memberships m ON m.user_id=u.user_id AND m.guild_id=c.discord_guild_id
      JOIN traderlink_community_memberships cm ON cm.community_id=c.community_id AND cm.user_id=u.user_id AND cm.status='active'
      WHERE c.community_id=? AND c.status='active'`).get(communityId) as { community_id: string; discord_guild_id: string; owner_user_id: string; display_name: string; slug: string; auth_subject: string; owner_name: string } | undefined;
    if (!row) throw new SharedAlertError("unavailable");
    return { communityId: row.community_id, guildId: row.discord_guild_id, ownerUserId: row.owner_user_id, discordUserId: row.auth_subject, name: row.display_name, slug: row.slug, ownerName: row.owner_name };
  }

  localOwner(slug: string, userId: string): SharedAlertOwnerContext {
    const row = this.database.prepare("SELECT community_id FROM traderlink_communities WHERE slug=? AND owner_user_id=?").get(slug, userId) as { community_id: string } | undefined;
    if (!row) throw new SharedAlertError("not_owner");
    const owner = this.ownerContext(row.community_id);
    const access = new TraderLinkCommunityRepository(this.database).resolveAccess(owner.communityId, userId);
    if (!access.isOwner || !access.capabilities.includes("community.manage")) throw new SharedAlertError("not_owner");
    return owner;
  }

  ownerIsFresh(context: SharedAlertOwnerContext): boolean {
    const row = this.database.prepare(`SELECT 1 present FROM community_shared_alert_owner_checks WHERE community_id=? AND owner_user_id=? AND discord_user_id=? AND result='verified' AND checked_at_utc>=? AND checked_at_utc<=?`)
      .get(context.communityId, context.ownerUserId, context.discordUserId, new Date(Date.parse(this.now()) - SHARED_ALERT_OWNER_FRESHNESS_MS).toISOString(), this.now());
    return Boolean(row);
  }

  recordOwnerCheck(context: SharedAlertOwnerContext, result: "verified" | "changed" | "unavailable"): void {
    this.write(() => {
      const current = this.ownerContext(context.communityId);
      if (current.ownerUserId !== context.ownerUserId || current.discordUserId !== context.discordUserId) throw new SharedAlertError("changed");
      const at = this.now();
      this.database.prepare(`INSERT INTO community_shared_alert_owner_checks(community_id,owner_user_id,discord_user_id,result,checked_at_utc) VALUES(?,?,?,?,?) ON CONFLICT(community_id) DO UPDATE SET owner_user_id=excluded.owner_user_id,discord_user_id=excluded.discord_user_id,result=excluded.result,checked_at_utc=excluded.checked_at_utc`)
        .run(context.communityId, context.ownerUserId, context.discordUserId, result, at);
      if (result !== "unavailable") {
        const rows = this.database.prepare(`SELECT request_id FROM community_shared_alert_requests WHERE status IN ('pending','active') AND
          ((source_community_id=@community AND (@changed=1 OR source_owner_user_id<>@owner OR source_owner_discord_id<>@discord)) OR
           (receiver_community_id=@community AND (@changed=1 OR receiver_owner_user_id<>@owner OR receiver_owner_discord_id<>@discord)))`)
          .all({ community: context.communityId, owner: context.ownerUserId, discord: context.discordUserId, changed: result === "changed" ? 1 : 0 }) as { request_id: string }[];
        for (const row of rows) {
          this.database.prepare(`UPDATE community_shared_alert_requests SET status='ended',source_approved_version=NULL,receiver_approved_version=NULL,updated_at_utc=? WHERE request_id=?`).run(at, row.request_id);
          this.cancelQueued(row.request_id, "Server ownership changed.");
          this.event(row.request_id, null, "Ownership changed; a new agreement is required", {});
        }
      }
    });
  }

  requireOwner(actor: SharedAlertActor): SharedAlertOwnerContext {
    const context = this.ownerContext(actor.communityId);
    if (context.ownerUserId !== actor.userId) throw new SharedAlertError("not_owner");
    this.localOwner(context.slug, actor.userId);
    if (!this.ownerIsFresh(context)) throw new SharedAlertError("discord_unavailable");
    return context;
  }

  requestForActor(actor: SharedAlertActor, requestId: string): SharedAlertRequestRow {
    this.requireOwner(actor);
    assertCanonicalUuidV4(requestId, "requestId");
    const row = this.database.prepare(`SELECT * FROM community_shared_alert_requests WHERE request_id=? AND ((source_community_id=? AND source_owner_user_id=?) OR (receiver_community_id=? AND receiver_owner_user_id=?))`)
      .get(requestId, actor.communityId, actor.userId, actor.communityId, actor.userId) as SharedAlertRequestRow | undefined;
    if (!row) throw new SharedAlertError("not_found");
    return row;
  }

  private sameOwners(row: SharedAlertRequestRow): void {
    for (const side of ["source", "receiver"] as const) {
      const owner = this.ownerContext(row[`${side}_community_id`]);
      if (owner.ownerUserId !== row[`${side}_owner_user_id`] || owner.discordUserId !== row[`${side}_owner_discord_id`]) throw new SharedAlertError("changed");
      if (!this.ownerIsFresh(owner)) throw new SharedAlertError("discord_unavailable");
    }
  }

  private event(requestId: string, actor: SharedAlertActor | null, event: string, detail: Record<string, string | number | boolean | null>): void {
    this.database.prepare(`INSERT INTO community_shared_alert_events(event_id,request_id,actor_user_id,actor_community_id,event_type,detail_json,created_at_utc) VALUES(?,?,?,?,?,?,?)`)
      .run(createCanonicalUuidV4(), requestId, actor?.userId ?? null, actor?.communityId ?? null, event, JSON.stringify(detail), this.now());
  }

  private cancelQueued(requestId: string, reason: string): void {
    this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='cancelled',last_error=?,updated_at_utc=? WHERE request_id=? AND status IN ('awaiting_approval','pending','failed','sending')`).run(reason, this.now(), requestId);
    cancelStoppedSharedAlertParts(this.database,this.now());
  }

  private verifyChannel(context: SharedAlertOwnerContext, channel: VerifiedSharedAlertChannel | undefined): VerifiedSharedAlertChannel {
    if (!channel || channel.guildId !== context.guildId || !/^[0-9]{1,32}$/u.test(channel.channelId) || !channel.name || channel.name.length > 100 || !Number.isFinite(Date.parse(channel.verifiedAtUtc)) || Date.parse(channel.verifiedAtUtc) < Date.parse(this.now()) - SHARED_ALERT_OWNER_FRESHNESS_MS || Date.parse(channel.verifiedAtUtc) > Date.parse(this.now()) + 1000) throw new SharedAlertError("channel_unavailable");
    return channel;
  }

  private addMessage(row: SharedAlertRequestRow, actor: SharedAlertActor, text: string): void {
    const owner = this.requireOwner(actor);
    const count = this.database.prepare(`SELECT count(*) total FROM community_shared_alert_messages WHERE request_id=? AND author_user_id=? AND created_at_utc>=?`)
      .get(row.request_id, actor.userId, new Date(Date.parse(this.now()) - 3600000).toISOString()) as { total: number };
    if (count.total >= 40 && !sharedAlertsPreviewMessageLimitLifted()) throw new SharedAlertError("limit");
    this.database.prepare(`INSERT INTO community_shared_alert_messages(message_id,request_id,author_user_id,author_community_id,author_name,body,created_at_utc) VALUES(?,?,?,?,?,?,?)`)
      .run(createCanonicalUuidV4(), row.request_id, actor.userId, actor.communityId, owner.ownerName, body(text), this.now());
    this.database.prepare("UPDATE community_shared_alert_requests SET updated_at_utc=? WHERE request_id=?").run(this.now(), row.request_id);
  }

  createRequest(input: { actor: SharedAlertActor; otherCommunityId: string; direction: "send" | "receive"; showSourceCommunityName: boolean; message: string; agreed: boolean; publisherIds?: readonly string[] }): string {
    return this.write(() => {
      const own = this.requireOwner(input.actor), other = this.ownerContext(input.otherCommunityId);
      if (!input.agreed || own.communityId === other.communityId || !["send", "receive"].includes(input.direction)) throw new SharedAlertError("invalid");
      if (!this.ownerIsFresh(other)) throw new SharedAlertError("discord_unavailable");
      const settings = this.database.prepare("SELECT requests_open FROM community_shared_alert_settings WHERE community_id=?").get(other.communityId) as { requests_open: number } | undefined;
      const blocked = this.database.prepare("SELECT 1 FROM community_shared_alert_blocks WHERE (community_id=? AND blocked_community_id=?) OR (community_id=? AND blocked_community_id=?)").get(other.communityId, own.communityId, own.communityId, other.communityId);
      if (settings?.requests_open === 0 || blocked) throw new SharedAlertError("blocked");
      const source = input.direction === "send" ? own : other, receiver = input.direction === "send" ? other : own;
      const existing = this.database.prepare(`SELECT request_id FROM community_shared_alert_requests WHERE source_community_id=? AND receiver_community_id=? AND status IN ('pending','active')`).get(source.communityId, receiver.communityId) as { request_id: string } | undefined;
      if (existing) throw new SharedAlertError("duplicate");
      const recent = this.database.prepare(`SELECT count(*) total FROM community_shared_alert_requests WHERE initiator_community_id=? AND created_at_utc>=?`).get(own.communityId, new Date(Date.parse(this.now()) - 3600000).toISOString()) as { total: number };
      const pair = this.database.prepare(`SELECT count(*) total FROM community_shared_alert_requests WHERE initiator_community_id=? AND (source_community_id=? OR receiver_community_id=?) AND created_at_utc>=?`).get(own.communityId, other.communityId, other.communityId, new Date(Date.parse(this.now()) - 86400000).toISOString()) as { total: number };
      if ((recent.total >= 10 && !sharedAlertsPreviewHourlyLimitLifted()) || (pair.total >= 3 && !sharedAlertsPreviewPeerLimitLifted())) throw new SharedAlertError("request_limit");
      const publisherIds = [...(input.publisherIds ?? [])];
      if (input.direction === "send" && (!publisherIds.length || publisherIds.length > 200 || new Set(publisherIds).size !== publisherIds.length)) throw new SharedAlertError("publishers_required");
      for (const userId of publisherIds) {
        assertCanonicalUuidV4(userId, "publisherId");
        if (input.direction !== "send" || !isSharedAlertPublisher(this.database, source.communityId, userId, this.now())) throw new SharedAlertError("publishers_required");
      }
      const id = createCanonicalUuidV4(), at = this.now();
      this.database.prepare(`INSERT INTO community_shared_alert_requests(request_id,source_community_id,receiver_community_id,initiator_community_id,source_owner_user_id,receiver_owner_user_id,source_owner_discord_id,receiver_owner_discord_id,status,terms_version,source_approved_version,receiver_approved_version,show_source_name,created_at_utc,updated_at_utc)
        VALUES(@id,@source,@receiver,@initiator,@sourceOwner,@receiverOwner,@sourceDiscord,@receiverDiscord,'pending',1,@sourceApproval,@receiverApproval,@showName,@at,@at)`)
        .run({ id, source: source.communityId, receiver: receiver.communityId, initiator: own.communityId, sourceOwner: source.ownerUserId, receiverOwner: receiver.ownerUserId, sourceDiscord: source.discordUserId, receiverDiscord: receiver.discordUserId, sourceApproval: input.direction === "send" ? 1 : null, receiverApproval: null, showName: 1, at });
      for (const userId of publisherIds) this.database.prepare(`INSERT INTO community_shared_alert_routes(request_id,author_user_id,source_offered,updated_at_utc) VALUES(?,?,1,?)`).run(id,userId,at);
      const row = this.requestForActor(input.actor, id);
      this.addMessage(row, input.actor, input.message);
      this.event(id, input.actor, "Sharing requested", { showSourceCommunityName: true });
      return id;
    });
  }

  reply(actor: SharedAlertActor, requestId: string, message: string): void {
    this.write(() => {
      const row = this.requestForActor(actor, requestId);
      if (!["pending", "active"].includes(row.status)) throw new SharedAlertError("changed");
      this.addMessage(row, actor, message);
    });
  }

  markRead(actor: SharedAlertActor, requestId: string, messageSequence: number, eventSequence: number): void {
    this.write(() => {
      const row = this.requestForActor(actor, requestId);
      if (![messageSequence, eventSequence].every(value => Number.isSafeInteger(value) && value >= 0)) throw new SharedAlertError("invalid");
      const lastMessage = (this.database.prepare("SELECT coalesce(max(sequence),0) sequence FROM community_shared_alert_messages WHERE request_id=?").get(row.request_id) as { sequence: number }).sequence;
      const lastEvent = (this.database.prepare("SELECT coalesce(max(sequence),0) sequence FROM community_shared_alert_events WHERE request_id=?").get(row.request_id) as { sequence: number }).sequence;
      this.database.prepare(`INSERT INTO community_shared_alert_read_positions(request_id,community_id,last_read_sequence,last_read_event_sequence) VALUES(?,?,?,?)
        ON CONFLICT(request_id,community_id) DO UPDATE SET last_read_sequence=max(last_read_sequence,excluded.last_read_sequence),last_read_event_sequence=max(last_read_event_sequence,excluded.last_read_event_sequence)`)
        .run(row.request_id, actor.communityId, Math.min(messageSequence, lastMessage), Math.min(eventSequence, lastEvent));
    });
  }

  setPublisher(actor: SharedAlertActor, userId: string, enabled: boolean): void {
    this.write(() => {
      this.requireOwner(actor); assertCanonicalUuidV4(userId, "userId");
      if (!this.database.prepare(`SELECT 1 FROM traderlink_community_memberships m JOIN platform_users u ON u.user_id=m.user_id AND u.status='active'
        JOIN traderlink_communities c ON c.community_id=m.community_id
        JOIN platform_discord_memberships d ON d.user_id=m.user_id AND d.guild_id=c.discord_guild_id
        WHERE m.community_id=? AND m.user_id=? AND m.status='active'`).get(actor.communityId,userId)) throw new SharedAlertError("invalid");
      this.database.prepare(`INSERT INTO community_alert_publisher_permissions(community_id,user_id,enabled,assigned_by_user_id,updated_at_utc) VALUES(?,?,?,?,?)
        ON CONFLICT(community_id,user_id) DO UPDATE SET enabled=excluded.enabled,assigned_by_user_id=excluded.assigned_by_user_id,updated_at_utc=excluded.updated_at_utc`)
        .run(actor.communityId,userId,enabled?1:0,actor.userId,this.now());
      if (!enabled) {
        this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='cancelled',last_error='Publisher permission removed.',updated_at_utc=?
          WHERE author_user_id=? AND request_id IN (SELECT request_id FROM community_shared_alert_requests WHERE source_community_id=?) AND status IN ('awaiting_approval','pending','failed','sending')`).run(this.now(),userId,actor.communityId);
        // Regranting never restores previously selected partner routes.
        this.database.prepare(`UPDATE community_shared_alert_routes SET receiver_selected=0,revision=revision+1,updated_at_utc=?
          WHERE author_user_id=? AND request_id IN (SELECT request_id FROM community_shared_alert_requests WHERE source_community_id=?)`).run(this.now(),userId,actor.communityId);
        cancelStoppedSharedAlertParts(this.database,this.now());
      }
    });
  }

  agree(input: { actor: SharedAlertActor; requestId: string; version: number; showSourceCommunityName: boolean; publisherIds: readonly string[]; routes: readonly { userId: string; channel: VerifiedSharedAlertChannel; requireApproval: boolean }[]; agreed: boolean }): void {
    this.write(() => {
      const row = this.requestForActor(input.actor, input.requestId);
      if (!input.agreed || row.status !== "pending" || row.terms_version !== input.version) throw new SharedAlertError("changed");
      this.sameOwners(row);
      const receiving = row.receiver_community_id === input.actor.communityId;
      if (!(receiving ? input.routes.length : input.publisherIds.length)) throw new SharedAlertError("publishers_required");
      if (receiving && input.publisherIds.length && (input.routes.length !== input.publisherIds.length || input.routes.some(route => !input.publisherIds.includes(route.userId)))) throw new SharedAlertError("invalid");
      if (!receiving && input.showSourceCommunityName !== (row.show_source_name===1)) throw new SharedAlertError("invalid");
      if (input.publisherIds.length>200 || input.routes.length>200 || new Set(input.publisherIds).size!==input.publisherIds.length || new Set(input.routes.map(r=>r.userId)).size!==input.routes.length) throw new SharedAlertError("invalid");
      const previous=this.database.prepare(`SELECT author_user_id,source_offered,receiver_selected,channel_id,require_approval FROM community_shared_alert_routes WHERE request_id=? ORDER BY author_user_id`).all(row.request_id) as {author_user_id:string;source_offered:number;receiver_selected:number;channel_id:string|null;require_approval:number}[];
      let changed=receiving && input.showSourceCommunityName!==(row.show_source_name===1);
      if (receiving) {
        const own=this.requireOwner(input.actor);
        for(const route of input.routes) {
          if (!previous.some(r=>r.author_user_id===route.userId && r.source_offered===1) || !isSharedAlertPublisher(this.database,row.source_community_id,route.userId,this.now())) throw new SharedAlertError("changed");
          this.verifyChannel(own,route.channel);
        }
        const before=previous.filter(r=>r.receiver_selected===1).map(r=>[r.author_user_id,r.channel_id,r.require_approval]);
        const after=[...input.routes].sort((a,b)=>a.userId.localeCompare(b.userId)).map(r=>[r.userId,r.channel.channelId,r.requireApproval?1:0]);
        changed ||= JSON.stringify(before)!==JSON.stringify(after);
        if(changed) {
          this.database.prepare(`UPDATE community_shared_alert_routes SET receiver_selected=0,revision=revision+1,updated_at_utc=? WHERE request_id=?`).run(this.now(),row.request_id);
          for(const route of input.routes) this.database.prepare(`UPDATE community_shared_alert_routes SET receiver_selected=1,channel_id=?,channel_name=?,require_approval=?,receiver_paused=0,selected_at_utc=?,updated_at_utc=? WHERE request_id=? AND author_user_id=? AND source_offered=1`)
            .run(route.channel.channelId,route.channel.name,route.requireApproval?1:0,this.now(),this.now(),row.request_id,route.userId);
        }
      } else {
        for(const id of input.publisherIds) { assertCanonicalUuidV4(id,"publisherId"); if(!isSharedAlertPublisher(this.database,row.source_community_id,id,this.now())) throw new SharedAlertError("invalid"); }
        changed=JSON.stringify(previous.filter(r=>r.source_offered===1).map(r=>r.author_user_id))!==JSON.stringify([...input.publisherIds].sort());
        if(changed) {
          this.database.prepare(`UPDATE community_shared_alert_routes SET source_offered=0,receiver_selected=0,revision=revision+1,updated_at_utc=? WHERE request_id=?`).run(this.now(),row.request_id);
          for(const id of input.publisherIds) this.database.prepare(`INSERT INTO community_shared_alert_routes(request_id,author_user_id,source_offered,updated_at_utc) VALUES(?,?,1,?)
            ON CONFLICT(request_id,author_user_id) DO UPDATE SET source_offered=1,updated_at_utc=excluded.updated_at_utc`).run(row.request_id,id,this.now());
        }
      }
      const version=row.terms_version+(changed?1:0);
      // The source offers these people; choosing a subset, destination and post
      // presentation belongs to the receiving owner, not another source vote.
      const sourceApproval=receiving?(row.source_approved_version===row.terms_version?version:null):version;
      const receiverApproval=receiving?version:(changed?null:row.receiver_approved_version);
      const selected=this.database.prepare(`SELECT 1 FROM community_shared_alert_routes WHERE request_id=? AND source_offered=1 AND receiver_selected=1`).get(row.request_id);
      const active=sourceApproval===version && receiverApproval===version && Boolean(selected);
      const at=this.now();
      this.database.prepare(`UPDATE community_shared_alert_requests SET terms_version=?,source_approved_version=?,receiver_approved_version=?,show_source_name=?,status=?,activated_at_utc=?,updated_at_utc=? WHERE request_id=?`)
        .run(version,sourceApproval,receiverApproval,input.showSourceCommunityName?1:0,active?"active":"pending",active?at:row.activated_at_utc,at,row.request_id);
      this.cancelQueued(row.request_id,"The agreement changed.");
      this.event(row.request_id,input.actor,active?"Both owners agreed":changed?"Sharing settings revised":"Owner agreed",{version});
    });
  }

  lifecycle(actor: SharedAlertActor, requestId: string, version: number, command: "decline" | "withdraw" | "end" | "pause" | "resume"): void {
    this.write(() => {
      const row = this.requestForActor(actor, requestId);
      if (row.terms_version !== version) throw new SharedAlertError("changed");
      const side = row.source_community_id === actor.communityId ? "source" : "receiver";
      const at = this.now();
      if (command === "pause" || command === "resume") {
        if (row.status !== "active") throw new SharedAlertError("changed");
        if (command === "resume") this.sameOwners(row);
        const paused = command === "pause" ? 1 : 0;
        if (row[`${side}_paused`] === paused) return;
        this.database.prepare(`UPDATE community_shared_alert_requests SET ${side}_paused=?,updated_at_utc=? WHERE request_id=?`).run(paused, at, requestId);
      } else {
        if (command === "end" ? row.status !== "active" : row.status !== "pending") throw new SharedAlertError("changed");
        if (command === "withdraw" && row.initiator_community_id !== actor.communityId) throw new SharedAlertError("not_owner");
        if (command === "decline" && row.initiator_community_id === actor.communityId) throw new SharedAlertError("invalid");
        this.database.prepare("UPDATE community_shared_alert_requests SET status=?,updated_at_utc=? WHERE request_id=?").run(command === "end" ? "ended" : command === "decline" ? "declined" : "withdrawn", at, requestId);
      }
      // Paused publications never enter the queue. Resume must not discard
      // fresh publications arriving after a successful earlier resume.
      if (command !== "resume") this.cancelQueued(requestId, "Sharing stopped or paused.");
      this.event(requestId, actor, { decline: "Request declined", withdraw: "Request withdrawn", end: "Sharing ended", pause: "Owner paused sharing", resume: "Owner cleared their pause" }[command], {});
    });
  }

  reopenAgreement(actor: SharedAlertActor, requestId: string, version: number): void {
    this.write(() => {
      const row=this.requestForActor(actor,requestId);
      if(row.status!=="active" || row.terms_version!==version) throw new SharedAlertError("changed");
      this.sameOwners(row);
      this.database.prepare(`UPDATE community_shared_alert_requests SET status='pending',terms_version=terms_version+1,source_approved_version=CASE WHEN ?=receiver_community_id AND source_approved_version=terms_version THEN terms_version+1 ELSE NULL END,receiver_approved_version=NULL,updated_at_utc=? WHERE request_id=?`).run(actor.communityId,this.now(),requestId);
      this.cancelQueued(requestId,"Analyst selection changed.");
      this.event(requestId,actor,"Analyst selection opened",{});
    });
  }

  configureRoute(actor: SharedAlertActor, requestId: string, userId: string, revision: number, input: { channel?: VerifiedSharedAlertChannel; requireApproval?: boolean; command: "save"|"pause"|"resume"|"remove" }): void {
    this.write(() => {
      const row=this.requestForActor(actor,requestId);
      if(row.receiver_community_id!==actor.communityId || row.status!=="active") throw new SharedAlertError("not_owner");
      const route=this.database.prepare(`SELECT * FROM community_shared_alert_routes WHERE request_id=? AND author_user_id=? AND revision=? AND source_offered=1 AND receiver_selected=1`).get(requestId,userId,revision) as {channel_id:string;require_approval:number;receiver_paused:number}|undefined;
      if(!route) throw new SharedAlertError("changed");
      if(input.command==="resume" || input.command==="save") {
        this.sameOwners(row);
        if(!isSharedAlertPublisher(this.database,row.source_community_id,userId,this.now())) throw new SharedAlertError("changed");
      }
      if(input.command==="save") {
        const channel=this.verifyChannel(this.requireOwner(actor),input.channel);
        if(channel.channelId===route.channel_id && (input.requireApproval?1:0)===route.require_approval) return;
        this.database.prepare(`UPDATE community_shared_alert_routes SET channel_id=?,channel_name=?,require_approval=?,revision=revision+1,updated_at_utc=? WHERE request_id=? AND author_user_id=?`)
          .run(channel.channelId,channel.name,input.requireApproval?1:0,this.now(),requestId,userId);
      } else {
        if(input.command!=="remove" && route.receiver_paused===(input.command==="pause"?1:0)) return;
        this.database.prepare(`UPDATE community_shared_alert_routes SET receiver_selected=CASE WHEN ?='remove' THEN 0 ELSE receiver_selected END,receiver_paused=?,revision=revision+1,updated_at_utc=? WHERE request_id=? AND author_user_id=?`)
          .run(input.command,input.command==="pause"?1:0,this.now(),requestId,userId);
      }
      this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='cancelled',last_error='Receiving publisher settings changed.',updated_at_utc=? WHERE request_id=? AND author_user_id=? AND status IN ('awaiting_approval','pending','failed','sending')`).run(this.now(),requestId,userId);
      cancelStoppedSharedAlertParts(this.database,this.now());
      this.event(requestId,actor,"Receiving publisher settings changed",{userId,command:input.command});
    });
  }

  reviewDelivery(actor: SharedAlertActor, requestId: string, deliveryId: string, contentRevision: number, approve: boolean): void {
    this.write(() => {
      const row=this.requestForActor(actor,requestId);
      if(row.receiver_community_id!==actor.communityId) throw new SharedAlertError("not_owner");
      if(row.status!=="active" || row.source_paused || row.receiver_paused) throw new SharedAlertError("changed");
      const delivery=this.database.prepare(`SELECT d.author_user_id FROM community_shared_alert_deliveries d JOIN community_shared_alert_routes route ON route.request_id=d.request_id AND route.author_user_id=d.author_user_id
        WHERE d.delivery_id=? AND d.request_id=? AND d.status='awaiting_approval' AND d.content_revision=? AND d.terms_version=?
          AND route.source_offered=1 AND route.receiver_selected=1 AND route.receiver_paused=0 AND route.require_approval=1 AND route.revision=d.channel_revision AND route.channel_id=d.channel_id
          AND (?=0 OR d.kind='publication' OR EXISTS(SELECT 1 FROM community_shared_alert_deliveries original WHERE original.delivery_id=d.original_delivery_id AND original.discord_message_id IS NOT NULL AND original.channel_id=d.channel_id AND (original.status='delivered' OR EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts first WHERE first.delivery_id=original.delivery_id AND first.part_number=1 AND first.status='delivered' AND first.discord_message_id=original.discord_message_id))))`).get(deliveryId,requestId,contentRevision,row.terms_version,approve?1:0) as {author_user_id:string}|undefined;
      if(!delivery || (approve && !isSharedAlertPublisher(this.database,row.source_community_id,delivery.author_user_id,this.now()))) throw new SharedAlertError("changed");
      this.database.prepare(`UPDATE community_shared_alert_deliveries SET status=?,approved_content_revision=?,approved_by_user_id=?,reviewed_at_utc=?,updated_at_utc=?,last_error=? WHERE delivery_id=?`)
        .run(approve?"pending":"rejected",approve?contentRevision:null,actor.userId,this.now(),this.now(),approve?null:"Receiving owner declined this post.",deliveryId);
      this.event(requestId,actor,approve?"Post approved":"Post declined",{deliveryId,contentRevision});
    });
  }

  settings(actor: SharedAlertActor, requestsOpen: boolean): void {
    this.requireOwner(actor);
    this.database.prepare(`INSERT INTO community_shared_alert_settings(community_id,requests_open,updated_at_utc) VALUES(?,?,?) ON CONFLICT(community_id) DO UPDATE SET requests_open=excluded.requests_open,updated_at_utc=excluded.updated_at_utc`).run(actor.communityId, requestsOpen ? 1 : 0, this.now());
  }

  revisePresentation(actor: SharedAlertActor, requestId: string, version: number, showName: boolean, agreed: boolean): void {
    this.write(() => {
      const row = this.requestForActor(actor, requestId);
      if (!agreed || row.status !== "active" || row.terms_version !== version || row.receiver_community_id !== actor.communityId) throw new SharedAlertError("changed");
      if (showName === (row.show_source_name === 1)) return;
      this.sameOwners(row);
      this.database.prepare(`UPDATE community_shared_alert_requests SET show_source_name=?,terms_version=terms_version+1,source_approved_version=terms_version+1,receiver_approved_version=terms_version+1,updated_at_utc=? WHERE request_id=?`)
        .run(showName ? 1 : 0, this.now(), requestId);
      this.cancelQueued(requestId, "The receiving owner changed post attribution.");
      this.event(requestId, actor, "Source community name in shared posts changed", { showSourceCommunityName: showName });
    });
  }

  retryDelivery(actor: SharedAlertActor, requestId: string, deliveryId: string): void {
    this.write(() => {
      const row = this.requestForActor(actor, requestId);
      this.sameOwners(row);
      if (row.status !== "active" || row.source_paused || row.receiver_paused) throw new SharedAlertError("changed");
      const changed = this.database.prepare(`UPDATE community_shared_alert_deliveries SET status=CASE WHEN requires_approval=1 THEN 'awaiting_approval' ELSE 'pending' END,approved_content_revision=NULL,approved_by_user_id=NULL,reviewed_at_utc=NULL,attempt_count=0,retry_at_utc=NULL,last_error=NULL,updated_at_utc=?
        WHERE delivery_id=? AND request_id=? AND status='failed' AND terms_version=? AND NOT EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts unsafe WHERE unsafe.delivery_id=community_shared_alert_deliveries.delivery_id AND unsafe.content_revision=community_shared_alert_deliveries.content_revision AND unsafe.status IN ('sending','uncertain')) AND EXISTS(SELECT 1 FROM community_shared_alert_routes route WHERE route.request_id=community_shared_alert_deliveries.request_id AND route.author_user_id=community_shared_alert_deliveries.author_user_id AND route.source_offered=1 AND route.receiver_selected=1 AND route.receiver_paused=0 AND route.revision=community_shared_alert_deliveries.channel_revision AND route.channel_id=community_shared_alert_deliveries.channel_id)`)
        .run(this.now(),deliveryId,requestId,row.terms_version).changes;
      if (!changed) throw new SharedAlertError("changed");
      this.database.prepare(`UPDATE community_shared_alert_delivery_parts SET status='pending',attempt_count=0,retry_at_utc=NULL,last_error=NULL,updated_at_utc=?
        WHERE delivery_id=? AND status IN ('pending','failed') AND content_revision=(SELECT content_revision FROM community_shared_alert_deliveries WHERE delivery_id=?)`).run(this.now(),deliveryId,deliveryId);
      this.event(requestId, actor, "Owner requested retry of a confirmed failed delivery", { deliveryId });
    });
  }

  block(actor: SharedAlertActor, otherCommunityId: string, blocked: boolean): void {
    this.requireOwner(actor); assertCanonicalUuidV4(otherCommunityId, "communityId");
    if (otherCommunityId === actor.communityId) throw new SharedAlertError("invalid");
    if (blocked) this.database.prepare("INSERT OR IGNORE INTO community_shared_alert_blocks(community_id,blocked_community_id,created_at_utc) VALUES(?,?,?)").run(actor.communityId, otherCommunityId, this.now());
    else this.database.prepare("DELETE FROM community_shared_alert_blocks WHERE community_id=? AND blocked_community_id=?").run(actor.communityId, otherCommunityId);
  }
}
