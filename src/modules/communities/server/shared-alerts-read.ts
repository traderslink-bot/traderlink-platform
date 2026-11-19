import type { SharedAlertActor, SharedAlertCommunity, SharedAlertDelivery, SharedAlertMessage, SharedAlertRequest, SharedAlertRoute, SharedAlertsSnapshot } from "../contracts/shared-alerts-contracts";
import { communityAlertDiscordAuthor, sharedAlertDiscordContent, sharedAlertDiscordParts } from "./community-alert-discord-content";
import { hasConfirmedSharedAlertOriginal, readSharedAlertParts } from "./shared-alerts-parts";
import { SharedAlertError } from "./shared-alerts-errors";
import { SharedAlertsRepository, type SharedAlertRequestRow } from "./shared-alerts-repository";

type CommunityRow = { community_id: string; slug: string; display_name: string; logo_url?: string | null; requests_open: number; blocked: number; existing_request_id?: string; existing_connection?: number };
const mapCommunity = (row: CommunityRow): SharedAlertCommunity => ({ communityId: row.community_id, slug: row.slug, name: row.display_name, logoUrl: row.logo_url ?? null, requestsOpen: row.requests_open !== 0, blocked: row.blocked === 1, existingRequestId: row.existing_request_id, existingConnection: row.existing_connection === 1 });
const safePage = (value: number | undefined) => Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : 1;
const PAGE_SIZE = 12;
const unreadSql = `((SELECT count(*) FROM community_shared_alert_messages message WHERE message.request_id=r.request_id AND message.author_community_id<>@own AND message.sequence>coalesce((SELECT last_read_sequence FROM community_shared_alert_read_positions WHERE request_id=r.request_id AND community_id=@own),0))
  +(SELECT count(*) FROM community_shared_alert_events event WHERE event.request_id=r.request_id AND (event.actor_community_id IS NULL OR event.actor_community_id<>@own) AND event.sequence>coalesce((SELECT last_read_event_sequence FROM community_shared_alert_read_positions WHERE request_id=r.request_id AND community_id=@own),0)))`;

/** A count only, scoped to the current stored owner. Private threads still require live verification. */
export function sharedAlertUnreadCount(repository: SharedAlertsRepository, actor: SharedAlertActor): number {
  return (repository.database.prepare(`SELECT coalesce(sum(${unreadSql}),0) total FROM community_shared_alert_requests r
    JOIN traderlink_communities c ON c.community_id=@own AND c.owner_user_id=@user AND c.status='active'
    WHERE (r.source_community_id=@own AND r.source_owner_user_id=@user) OR (r.receiver_community_id=@own AND r.receiver_owner_user_id=@user)`)
    .get({ own: actor.communityId, user: actor.userId }) as { total: number }).total;
}

export function readSharedAlerts(repository: SharedAlertsRepository, actor: SharedAlertActor, options: { query?: string; page?: number; requestPage?: number; requestId?: string; composeCommunityId?: string; messageBefore?: number; deliveryPage?: number; approvalOnly?: boolean; view?: string }): Omit<SharedAlertsSnapshot, "channels" | "channelError" | "deliveryEnabled"> {
  const db = repository.database;
  return db.transaction(() => {
    const own = repository.ownerContext(actor.communityId);
    repository.localOwner(own.slug, actor.userId);
    if (!repository.ownerIsFresh(own)) throw new SharedAlertError("discord_unavailable");
    const query = (options.query ?? "").normalize("NFKC").trim().slice(0, 80);
    const ownSettings = db.prepare("SELECT requests_open FROM community_shared_alert_settings WHERE community_id=?").get(actor.communityId) as { requests_open: number } | undefined;
    const directoryBase = `FROM traderlink_communities c
      JOIN platform_users owner ON owner.user_id=c.owner_user_id AND owner.status='active'
      JOIN platform_auth_identities identity ON identity.user_id=owner.user_id AND identity.auth_provider='discord' AND identity.status='active'
      JOIN platform_discord_memberships membership ON membership.user_id=owner.user_id AND membership.guild_id=c.discord_guild_id AND membership.guild_owner=1
      JOIN traderlink_community_memberships cm ON cm.community_id=c.community_id AND cm.user_id=owner.user_id AND cm.status='active'
      LEFT JOIN traderlink_community_settings settings ON settings.community_id=c.community_id
      LEFT JOIN community_shared_alert_settings contact ON contact.community_id=c.community_id
      WHERE c.status='active' AND c.community_id<>? AND c.slug<>'review'
      AND (instr(lower(c.display_name),lower(?))>0 OR instr(lower(c.slug),lower(?))>0)`;
    const projection = `c.community_id,c.slug,c.display_name,settings.logo_url,coalesce(contact.requests_open,1) requests_open,
      (SELECT r.request_id FROM community_shared_alert_requests r WHERE r.source_community_id=@own AND r.receiver_community_id=c.community_id AND r.status IN ('pending','active') LIMIT 1) existing_request_id,
      EXISTS(SELECT 1 FROM community_shared_alert_requests r WHERE r.source_community_id=@own AND r.receiver_community_id=c.community_id AND r.status='active') existing_connection,
      EXISTS(SELECT 1 FROM community_shared_alert_blocks b WHERE (b.community_id=c.community_id AND b.blocked_community_id=@own) OR (b.community_id=@own AND b.blocked_community_id=c.community_id)) blocked`;
    const total = (db.prepare(`SELECT count(*) total ${directoryBase}`).get(own.communityId, query, query) as { total: number }).total;
    const page = Math.min(safePage(options.page), Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const directory = db.prepare(`SELECT ${projection} ${directoryBase} ORDER BY c.display_name COLLATE NOCASE,c.slug LIMIT ? OFFSET ?`)
      .all({ own: own.communityId }, own.communityId, query, query, PAGE_SIZE, (page - 1) * PAGE_SIZE) as CommunityRow[];
    const privateScope = `((r.source_community_id=@own AND r.source_owner_user_id=@user) OR (r.receiver_community_id=@own AND r.receiver_owner_user_id=@user))`;
    const parameters = { own: own.communityId, user: actor.userId };
    const connected = "(r.status='active' OR (r.status='pending' AND (r.activated_at_utc IS NOT NULL OR EXISTS(SELECT 1 FROM community_shared_alert_events e WHERE e.request_id=r.request_id AND e.event_type IN ('Both owners agreed','Analyst selection opened','Revised presentation proposed; sharing paused until both agree')))))";
    const filter = options.view === "connections" ? connected : options.view === "history" ? "r.status IN ('declined','withdrawn','ended')" : options.view === "activity" ? `${unreadSql}>0` : `r.status='pending' AND NOT ${connected}`;
    const listingScope = `${privateScope} AND (${filter})`;
    const requestTotal = (db.prepare(`SELECT count(*) total FROM community_shared_alert_requests r WHERE ${listingScope}`).get(parameters) as { total: number }).total;
    const requestPage = Math.min(safePage(options.requestPage), Math.max(1, Math.ceil(requestTotal / PAGE_SIZE)));

    function mapRequest(row: SharedAlertRequestRow & { unread?: number }): SharedAlertRequest {
      const source = db.prepare("SELECT community_id,slug,display_name FROM traderlink_communities WHERE community_id=?").get(row.source_community_id) as CommunityRow;
      const receiver = db.prepare("SELECT community_id,slug,display_name FROM traderlink_communities WHERE community_id=?").get(row.receiver_community_id) as CommunityRow;
      const ownerName = (userId: string, communityId: string) => {
        const result = db.prepare(`SELECT coalesce(m.global_display_name,m.username) name FROM platform_discord_memberships m JOIN traderlink_communities c ON c.discord_guild_id=m.guild_id WHERE m.user_id=? AND c.community_id=?`).get(userId, communityId) as { name: string } | undefined;
        return result?.name ?? "Discord owner unavailable";
      };
      let integrationProblem: string | null = null;
      if (row.status === "active") {
        for (const id of [row.source_community_id, row.receiver_community_id]) {
          try { if (!repository.ownerIsFresh(repository.ownerContext(id))) integrationProblem = "Discord ownership verification is due or unavailable."; }
          catch { integrationProblem = "A connected server or its owner is no longer available."; }
        }
      }
      return { requestId: row.request_id, source: mapCommunity(source), receiver: mapCommunity(receiver), initiatorCommunityId: row.initiator_community_id, status: row.status, version: row.terms_version,
        isConnection: row.status === "active" || (row.status === "pending" && Boolean(row.activated_at_utc || db.prepare("SELECT 1 FROM community_shared_alert_events WHERE request_id=? AND event_type IN ('Both owners agreed','Analyst selection opened','Revised presentation proposed; sharing paused until both agree')").get(row.request_id))),
        sourceApproved: row.source_approved_version === row.terms_version, receiverApproved: row.receiver_approved_version === row.terms_version,
        sourceOwnerName: ownerName(row.source_owner_user_id, row.source_community_id), receiverOwnerName: ownerName(row.receiver_owner_user_id, row.receiver_community_id),
        showSourceCommunityName: row.show_source_name === 1, routes: (db.prepare(`SELECT route.*,coalesce(d.global_display_name,d.username,'Discord author unavailable') author_name,coalesce(p.enabled,0) enabled
          FROM community_shared_alert_routes route JOIN traderlink_communities c ON c.community_id=?
          LEFT JOIN platform_discord_memberships d ON d.user_id=route.author_user_id AND d.guild_id=c.discord_guild_id
          LEFT JOIN community_alert_publisher_permissions p ON p.community_id=c.community_id AND p.user_id=route.author_user_id
          WHERE route.request_id=? ORDER BY author_name,route.author_user_id`).all(row.source_community_id,row.request_id) as {author_user_id:string;author_name:string;source_offered:number;receiver_selected:number;channel_id:string|null;channel_name:string|null;revision:number;require_approval:number;receiver_paused:number;enabled:number}[])
          .map((r):SharedAlertRoute=>({userId:r.author_user_id,name:r.author_name,offered:r.source_offered===1,selected:r.receiver_selected===1,channelId:r.channel_id,channelName:r.channel_name,revision:r.revision,requireApproval:r.require_approval===1,paused:r.receiver_paused===1,canPublish:r.enabled===1})), sourcePaused: row.source_paused === 1, receiverPaused: row.receiver_paused === 1,
        unread: row.unread ?? 0, integrationProblem, createdAtUtc: row.created_at_utc, updatedAtUtc: row.updated_at_utc };
    }

    let selected: SharedAlertsSnapshot["selected"] = null;
    if (options.requestId) {
      const row = repository.requestForActor(actor, options.requestId);
      const unread = (db.prepare(`SELECT ${unreadSql} unread FROM community_shared_alert_requests r WHERE r.request_id=@request`).get({ own: own.communityId, request: row.request_id }) as { unread: number }).unread;
      const olderPage = Number.isSafeInteger(options.messageBefore) && Number(options.messageBefore) > 0;
      const before = olderPage ? Number(options.messageBefore) : Number.MAX_SAFE_INTEGER;
      const messages = db.prepare(`SELECT sequence,author_community_id,author_name,body,created_at_utc FROM community_shared_alert_messages WHERE request_id=? AND sequence<? ORDER BY sequence DESC LIMIT 31`)
        .all(row.request_id, before) as { sequence: number; author_community_id: string; author_name: string; body: string; created_at_utc: string }[];
      const hasOlder = messages.length > 30;
      const visible = messages.slice(0, 30).reverse();
      const eventSequence = (db.prepare("SELECT coalesce(max(sequence),0) sequence FROM community_shared_alert_events WHERE request_id=?").get(row.request_id) as { sequence: number }).sequence;
      const approvalOnly=options.approvalOnly===true && row.receiver_community_id===actor.communityId;
      const approvalTotal=(db.prepare("SELECT count(*) total FROM community_shared_alert_deliveries WHERE request_id=? AND status='awaiting_approval'").get(row.request_id) as {total:number}).total;
      const deliveryTotal = (db.prepare("SELECT count(*) total FROM community_shared_alert_deliveries WHERE request_id=? AND (?=0 OR status='awaiting_approval')").get(row.request_id,approvalOnly?1:0) as { total: number }).total;
      const deliveryPage = Math.min(safePage(options.deliveryPage), Math.max(1, Math.ceil(deliveryTotal / PAGE_SIZE)));
      const receiverGuild = (db.prepare("SELECT discord_guild_id FROM traderlink_communities WHERE community_id=?").get(row.receiver_community_id) as { discord_guild_id: string }).discord_guild_id;
      const deliveries = db.prepare(`SELECT d.*,original.discord_message_id original_message_id,original.status original_status FROM community_shared_alert_deliveries d LEFT JOIN community_shared_alert_deliveries original ON original.delivery_id=d.original_delivery_id WHERE d.request_id=? AND (?=0 OR d.status='awaiting_approval') ORDER BY d.created_at_utc DESC,d.delivery_id LIMIT ? OFFSET ?`).all(row.request_id, approvalOnly?1:0, PAGE_SIZE, (deliveryPage - 1) * PAGE_SIZE) as { delivery_id: string; kind: SharedAlertDelivery["kind"]; alert_id:string; author_user_id:string; source_name:string; show_source_name:number; original_status:string|null; original_delivery_id:string|null; content_revision:number; channel_revision:number; body:string; symbol:string|null; title: string; channel_id: string; status: SharedAlertDelivery["status"]; attempt_count: number; last_error: string | null; discord_message_id: string | null; original_message_id: string | null; created_at_utc: string; updated_at_utc: string }[];
      const discordUrl = (channelId: string, messageId: string | null) => messageId && /^[0-9]{1,32}$/u.test(messageId) ? `https://discord.com/channels/${receiverGuild}/${channelId}/${messageId}` : null;
      const events = db.prepare("SELECT e.event_type,e.created_at_utc,c.display_name actor_name FROM community_shared_alert_events e LEFT JOIN traderlink_communities c ON c.community_id=e.actor_community_id WHERE e.request_id=? ORDER BY e.sequence DESC LIMIT 20").all(row.request_id) as { event_type: string; created_at_utc: string; actor_name: string | null }[];
      const messageParts=(item:typeof deliveries[number]):SharedAlertDelivery["parts"]=>{
        const frozen=readSharedAlertParts(db,item.delivery_id,item.content_revision);
        if(frozen.length)return frozen.map(p=>({number:p.part_number,total:p.total_parts,content:p.content,status:p.status,discordUrl:discordUrl(item.channel_id,p.discord_message_id),error:p.last_error,attemptCount:p.attempt_count}));
        const content=sharedAlertDiscordParts(db,{alertId:item.alert_id,title:item.title,symbol:item.symbol,body:item.body,communityName:item.source_name,showCommunityName:item.show_source_name===1,kind:item.kind,originalUrl:discordUrl(item.channel_id,item.original_message_id)});
        // A migrated confirmed legacy delivery was a single message, not inferred parts.
        const legacy=item.status==="delivered"&&item.discord_message_id;
        return (legacy?[sharedAlertDiscordContent(db,{alertId:item.alert_id,title:item.title,symbol:item.symbol,body:item.body,communityName:item.source_name,showCommunityName:item.show_source_name===1,kind:item.kind,originalUrl:discordUrl(item.channel_id,item.original_message_id)}).content]:content)
          .map((text,index,all)=>({number:index+1,total:all.length,content:text,status:legacy?"delivered":item.status==="cancelled"||item.status==="rejected"?"cancelled":item.status==="uncertain"?"uncertain":"pending",discordUrl:legacy?discordUrl(item.channel_id,item.discord_message_id):null,error:null,attemptCount:legacy?item.attempt_count:0}));
      };
      const mappedRequest=mapRequest({ ...row, unread });
      selected = { request: mappedRequest, messages: visible.map((message): SharedAlertMessage => ({ sequence: message.sequence, authorCommunityId: message.author_community_id, authorName: message.author_name, body: message.body, createdAtUtc: message.created_at_utc })),
        olderMessagesBefore: hasOlder ? visible[0]?.sequence ?? null : null,
        readThrough: olderPage ? null : { messageSequence: messages[0]?.sequence ?? 0, eventSequence },
        deliveryPage, deliveryTotal, deliveryFilter:approvalOnly?"approval":"all", approvalTotal, deliveries: deliveries.map(item => { const parts = messageParts(item); return ({ deliveryId: item.delivery_id, authorUserId:item.author_user_id, authorName:communityAlertDiscordAuthor(db,item.alert_id), contentRevision:item.content_revision, routeRevision:item.channel_revision, body:item.body, symbol:item.symbol, parts, reviewable:item.kind==="publication" || Boolean(item.original_delivery_id && hasConfirmedSharedAlertOriginal(db,item.original_delivery_id) && discordUrl(item.channel_id,item.original_message_id)),
          content:sharedAlertDiscordContent(db,{alertId:item.alert_id,title:item.title,symbol:item.symbol,body:item.body,communityName:item.source_name,showCommunityName:item.show_source_name===1,kind:item.kind,originalUrl:discordUrl(item.channel_id,item.original_message_id)}).content, kind: item.kind, channelId: item.channel_id, discordUrl: discordUrl(item.channel_id,item.discord_message_id), originalDiscordUrl: discordUrl(item.channel_id,item.original_message_id), attemptCount: Math.max(item.attempt_count, parts.reduce((total, part) => total + part.attemptCount, 0)), updatedAtUtc: item.updated_at_utc, title: item.title, status: item.status, error: item.last_error, messageId: item.discord_message_id, createdAtUtc: item.created_at_utc }); }),
        events: events.map(item => ({ event: item.event_type === "Owner paused sharing" ? `${item.actor_name ?? "The other community"} paused sharing` : item.event_type === "Owner cleared their pause" ? `${item.actor_name ?? "The other community"} resumed their side of sharing` : item.event_type, atUtc: item.created_at_utc })) };
    }
    const rows = db.prepare(`SELECT r.*,${unreadSql} unread FROM community_shared_alert_requests r WHERE ${listingScope} ORDER BY r.updated_at_utc DESC,r.request_id LIMIT @limit OFFSET @offset`)
      .all({ ...parameters, limit: PAGE_SIZE, offset: (requestPage - 1) * PAGE_SIZE }) as (SharedAlertRequestRow & { unread: number })[];
    const unreadCount = (db.prepare(`SELECT coalesce(sum(${unreadSql}),0) total FROM community_shared_alert_requests r WHERE ${privateScope}`).get(parameters) as { total: number }).total;
    const countUnread = (filter: string) => (db.prepare(`SELECT coalesce(sum(${unreadSql}),0) total FROM community_shared_alert_requests r WHERE ${privateScope} AND (${filter})`).get(parameters) as {total:number}).total;
    const requestUnreadCount = countUnread(`r.status='pending' AND NOT ${connected}`);
    const connectionUnreadCount = countUnread(connected);
    const blocks = db.prepare(`SELECT c.community_id,c.slug,c.display_name,1 requests_open,1 blocked FROM community_shared_alert_blocks b JOIN traderlink_communities c ON c.community_id=b.blocked_community_id WHERE b.community_id=? ORDER BY c.display_name`).all(own.communityId) as CommunityRow[];
    let composeCommunity: SharedAlertCommunity | null = null;
    if (options.composeCommunityId) {
      const candidate = db.prepare(`SELECT ${projection} ${directoryBase} AND c.community_id=?`).get({ own: own.communityId }, own.communityId, "", "", options.composeCommunityId) as CommunityRow | undefined;
      if (!candidate) throw new SharedAlertError("unavailable");
      composeCommunity = mapCommunity(candidate);
    }
    const publishers = db.prepare(`SELECT m.user_id,coalesce(d.global_display_name,d.username,'Discord user unavailable') name,d.username,coalesce(p.enabled,0) enabled
      FROM traderlink_community_memberships m JOIN traderlink_communities c ON c.community_id=m.community_id
      JOIN platform_users u ON u.user_id=m.user_id AND u.status='active'
      JOIN platform_discord_memberships d ON d.user_id=m.user_id AND d.guild_id=c.discord_guild_id
      LEFT JOIN community_alert_publisher_permissions p ON p.community_id=m.community_id AND p.user_id=m.user_id
      WHERE m.community_id=? AND m.status='active' ORDER BY name,m.user_id`).all(own.communityId) as {user_id:string;name:string;username:string;enabled:number}[];
    const publisherNameCounts = new Map<string, number>();
    for (const publisher of publishers) publisherNameCounts.set(publisher.name, (publisherNameCounts.get(publisher.name) ?? 0) + 1);
    return { publishers:publishers.map(p=>({userId:p.user_id,name:(publisherNameCounts.get(p.name) ?? 0)>1 ? `${p.name} (@${p.username})` : p.name,canPublish:p.enabled===1})), community: { communityId: own.communityId, slug: own.slug, name: own.name, logoUrl: null, requestsOpen: ownSettings?.requests_open !== 0, blocked: false }, directory: directory.map(mapCommunity), directoryTotal: total, directoryPage: page, pageSize: PAGE_SIZE, query, composeCommunity,
      requests: rows.map(mapRequest), requestTotal, requestPage, unreadCount, requestUnreadCount, connectionUnreadCount, blockedCommunities: blocks.map(mapCommunity), selected };
  }).deferred();
}

/** Snapshot author attribution once; never derive a historical author from a Platform display name. */
export function captureSharedAlertPublication(repository: SharedAlertsRepository, alertId: string, atUtc: string): void {
  const db = repository.database;
  db.prepare(`INSERT INTO community_alert_discord_authors(alert_id,discord_user_id,display_name,username,captured_at_utc)
    SELECT a.alert_id,i.auth_subject,m.global_display_name,m.username,? FROM traderlink_community_alerts a JOIN traderlink_communities c ON c.community_id=a.community_id
    LEFT JOIN platform_auth_identities i ON i.user_id=a.author_user_id AND i.auth_provider='discord' AND i.status='active'
    LEFT JOIN platform_discord_memberships m ON m.user_id=a.author_user_id AND m.guild_id=c.discord_guild_id
    WHERE a.alert_id=? ON CONFLICT(alert_id) DO NOTHING`).run(atUtc, alertId);
  // Disabled publications are not accumulated for a surprise replay at release.
  if (process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED !== "1") return;
  // The newer Coaching lane has explicit Website only / Send to Discord intent.
  // Preserve it even if a later integrator places the publication hook too early.
  if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_community_publication_distribution'").get()) return;
  const intent = db.prepare("SELECT publisher_user_id,distribution,destination_ids_json FROM traderlink_community_publication_distribution WHERE object_type='alert' AND object_id=?").get(alertId) as { publisher_user_id: string; distribution: string; destination_ids_json: string } | undefined;
  if (intent?.distribution !== "discord") return;
  db.prepare(`INSERT INTO community_shared_alert_deliveries(delivery_id,request_id,alert_id,author_user_id,terms_version,channel_revision,channel_id,title,symbol,body,publishing_mode,publisher_user_id,source_destination_ids_json,source_name,show_source_name,requires_approval,status,created_at_utc,updated_at_utc)
    SELECT lower(hex(randomblob(16))),r.request_id,a.alert_id,a.author_user_id,r.terms_version,route.revision,route.channel_id,
      a.title,a.symbol,a.body,a.publishing_mode,?,?,c.display_name,r.show_source_name,route.require_approval,
      CASE WHEN route.require_approval=1 THEN 'awaiting_approval' ELSE 'pending' END,?,?
    FROM traderlink_community_alerts a JOIN traderlink_communities c ON c.community_id=a.community_id AND c.status='active'
    JOIN community_shared_alert_requests r ON r.source_community_id=a.community_id
    JOIN community_shared_alert_routes route ON route.request_id=r.request_id AND route.author_user_id=a.author_user_id
    JOIN community_alert_publisher_permissions p ON p.community_id=a.community_id AND p.user_id=a.author_user_id AND p.enabled=1
    JOIN traderlink_community_memberships member ON member.community_id=a.community_id AND member.user_id=a.author_user_id AND member.status='active'
    JOIN platform_users author ON author.user_id=a.author_user_id AND author.status='active'
    WHERE a.alert_id=? AND a.status='published' AND r.status='active' AND r.source_approved_version=r.terms_version AND r.receiver_approved_version=r.terms_version
    AND r.source_paused=0 AND r.receiver_paused=0 AND r.activated_at_utc<=? AND route.selected_at_utc<=?
    AND a.published_at_utc>=r.activated_at_utc AND a.published_at_utc>=route.selected_at_utc
    AND route.source_offered=1 AND route.receiver_selected=1 AND route.receiver_paused=0 AND route.channel_id IS NOT NULL
    ON CONFLICT(request_id,alert_id,channel_id,event_key) DO NOTHING`).run(intent.publisher_user_id,intent.destination_ids_json,atUtc,atUtc,alertId,atUtc,atUtc);
}
