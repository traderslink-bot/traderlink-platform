import type Database from "better-sqlite3";
import type {CommunityStatsTableRow} from "../../contracts/community-stats-contracts";
import {statsChannelIdSql} from "./community-stats-channel-selection";
import {statsHistoryReady} from "./community-stats-history-storage";

/** Both messages must remain in the reader's channel scope. Never treat self-replies as response times. */
export function statsReplySecondsSql(reply="e",original="p"):string{
  return `CASE WHEN ${original}.discord_user_id!=${reply}.discord_user_id AND ${original}.occurred_at_utc<=${reply}.occurred_at_utc THEN cast(round((julianday(${reply}.occurred_at_utc)-julianday(${original}.occurred_at_utc))*86400) AS INTEGER) END`;
}

/** Prepared migration only. Never create storage from a request or collector. */
export const communityStatsBotMessageStatements=Object.freeze([
  `CREATE TABLE community_stats_bot_messages (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
    message_id TEXT NOT NULL,channel_id TEXT NOT NULL,message_at_utc TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN('bot','webhook')),
    PRIMARY KEY(community_id,message_id)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE INDEX community_stats_bot_message_date ON community_stats_bot_messages(community_id,channel_id,message_at_utc);`,
  `CREATE TABLE community_stats_reaction_refresh (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),message_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,requested_at_utc TEXT NOT NULL,retry_at_utc TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY(community_id,message_id)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE INDEX community_stats_reaction_refresh_due ON community_stats_reaction_refresh(community_id,retry_at_utc,requested_at_utc);`,
]);
export type StatsReactionRefresh={message_id:string;channel_id:string;version:number};
export function statsReactionRefreshReady(db:Database.Database):boolean{
  return !!db.prepare(`SELECT 1 FROM sqlite_schema WHERE type='table' AND name='community_stats_reaction_refresh'`).get();
}
/** Coalesce bursts without estimating deltas or retaining individual reactor identities. */
export function queueStatsReactionRefresh(db:Database.Database,communityId:string,messageId:string,channelId:string,at:string):void{
  if(!statsReactionRefreshReady(db))return;
  db.prepare(`INSERT INTO community_stats_reaction_refresh(community_id,message_id,channel_id,requested_at_utc,retry_at_utc) VALUES(?,?,?,?,?)
    ON CONFLICT(community_id,message_id) DO UPDATE SET requested_at_utc=excluded.requested_at_utc,version=version+1`).run(communityId,messageId,channelId,at,at);
}
export function nextStatsReactionRefresh(db:Database.Database,communityId:string,at:string):StatsReactionRefresh|undefined{
  return statsReactionRefreshReady(db)?db.prepare(`SELECT message_id,channel_id,version FROM community_stats_reaction_refresh WHERE community_id=? AND retry_at_utc<=? ORDER BY requested_at_utc,message_id LIMIT 1`).get(communityId,at) as StatsReactionRefresh|undefined:undefined;
}
export function statsBotMessagesReady(db:Database.Database):boolean{
  return !!db.prepare(`SELECT 1 FROM sqlite_schema WHERE type='table' AND name='community_stats_bot_messages'`).get();
}
/** No body, username or member identity is retained for automated messages. */
export function recordStatsBotMessage(db:Database.Database,communityId:string,messageId:string,channelId:string,at:string,kind:"bot"|"webhook"):void{
  if(!statsBotMessagesReady(db))return;
  db.prepare(`INSERT INTO community_stats_bot_messages VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING`).run(communityId,messageId,channelId,at,kind);
}

export type StatsMemberReactionRow=CommunityStatsTableRow&{channelId:string;Channel:string;Messages:number;Reactions:number|null};
/** Only member-message events can contribute historical reaction totals. */
export function readStatsMemberReactions(db:Database.Database,communityId:string,from:string,until:string,channels:readonly string[],roleId?:string):StatsMemberReactionRow[]{
  const ready=statsHistoryReady(db),messageKind="e.kind IN('message','thread_reply','forum_post')";
  const rows=db.prepare(`SELECT e.channel_id AS channelId,coalesce(c.name,'Removed channel') AS Channel,
    sum(${messageKind}) AS Messages,${ready?"coalesce(sum(r.reactions),0)":"0"} AS reactions,
    ${ready?"count(r.message_id)":"0"} AS counted
    FROM community_stats_events e
    LEFT JOIN community_stats_channels c ON c.community_id=e.community_id AND c.channel_id=e.channel_id
    ${ready?`LEFT JOIN community_stats_reaction_snapshots r ON r.community_id=e.community_id AND r.message_id=substr(e.event_id,9) AND ${messageKind}`:""}
    WHERE e.community_id=@communityId AND e.surface='discord' AND ${messageKind} AND ${statsChannelIdSql(channels,"e")}
    AND e.occurred_at_utc>=@from AND e.occurred_at_utc<@until
    ${roleId?"AND e.discord_user_id IN(SELECT n.discord_user_id FROM community_stats_members n,json_each(n.role_ids_json) role WHERE n.community_id=@communityId AND n.active=1 AND role.value=@roleId)":""}
    GROUP BY e.channel_id ORDER BY Messages DESC,e.channel_id`).all({communityId,from,until,...(roleId?{roleId}:{})}) as {channelId:string;Channel:string;Messages:number;reactions:number;counted:number}[];
  return rows.map(row=>({channelId:row.channelId,Channel:row.Channel,Messages:row.Messages,
    Reactions:row.reactions>0||row.Messages===0||ready&&row.counted===row.Messages?row.reactions:null}));
}

/** Old unclassified snapshots are never assumed to be bot messages. */
export function readStatsBotActivity(db:Database.Database,communityId:string,from:string,until:string,channels:readonly string[]):CommunityStatsTableRow[]{
  if(!statsBotMessagesReady(db))return [];
  const history=statsHistoryReady(db);
  return db.prepare(`SELECT coalesce(c.name,'Removed channel') AS Channel,
    sum(b.kind='bot') AS "Bot messages",sum(b.kind='webhook') AS "Webhook messages",
    ${history?"CASE WHEN sum(r.reactions)>0 OR count(r.message_id)=count(*) THEN sum(r.reactions) ELSE NULL END":"NULL"} AS Reactions
    FROM community_stats_bot_messages b LEFT JOIN community_stats_channels c ON c.community_id=b.community_id AND c.channel_id=b.channel_id
    ${history?"LEFT JOIN community_stats_reaction_snapshots r ON r.community_id=b.community_id AND r.message_id=b.message_id":""}
    WHERE b.community_id=? AND ${statsChannelIdSql(channels,"b")} AND b.message_at_utc>=? AND b.message_at_utc<?
    GROUP BY b.channel_id ORDER BY count(*) DESC,b.channel_id`).all(communityId,from,until) as CommunityStatsTableRow[];
}
