import {statsConfiguredPublicHostname} from "./community-stats-public-origin";
import type Database from 'better-sqlite3';
import type {CommunityStatsTableRow} from '../../contracts/community-stats-contracts';
import {statsAttributionReady} from './community-stats-invites';
export function statsTrafficProjection(db:Database.Database,column:'source'|'category'|'referrer_host'|'campaign_medium'|'campaign_name'):string{
  if(!statsAttributionReady(db))return column==='source'?`CASE WHEN source_link_id IS NULL THEN 'Unknown' ELSE 'Shared link' END`:'NULL';
  const ownHost=column==='source'||column==='category'?statsConfiguredPublicHostname():null;
  // Keep original rows intact. Only the derived, untagged self-referral label is
  // corrected; genuine external referrals and campaign attribution stay intact.
  const hostLiteral=ownHost?`'${ownHost.replaceAll("'","''")}'`:null;
  const projected=hostLiteral?`CASE WHEN t.category='Referral' AND lower(t.referrer_host)=${hostLiteral} AND lower(t.source)=${hostLiteral} AND t.campaign_source IS NULL AND t.campaign_medium IS NULL AND t.campaign_name IS NULL THEN 'Internal' ELSE t.${column} END`:`t.${column}`;
  const value=`(SELECT ${projected} FROM community_stats_traffic_sources t WHERE t.community_id=community_stats_events.community_id AND t.event_id=community_stats_events.event_id)`;
  return column==='source'?`coalesce(${value},CASE WHEN source_link_id IS NULL THEN 'Unknown' ELSE 'Shared link' END)`:value;
}
export function readStatsInviteReports(db:Database.Database,communityId:string,channels:readonly string[],from:string,until:string,named:boolean,page:number,size:number,roleId?:string){
  if(!statsAttributionReady(db))return [];
  const role=roleId?` AND EXISTS(SELECT 1 FROM community_stats_members m,json_each(m.role_ids_json) r WHERE m.community_id=j.community_id AND m.discord_user_id=j.discord_user_id AND m.active=1 AND m.is_bot=0 AND r.value=@role)`:'';
  const params={community:communityId,channels:JSON.stringify(channels),from,until,...(roleId?{role:roleId}:{})};
  const sourceRows=db.prepare(`SELECT CASE WHEN j.invite_hash IS NULL THEN 'Unknown' WHEN i.vanity=1 THEN 'Server invite' ELSE coalesce(c.name,'Channel invite') END AS Source,${named?'i.creator_name':'NULL'} AS "Created by",count(*) AS Joins,CASE WHEN j.invite_hash IS NULL THEN 'Unknown' ELSE 'Estimated' END AS Attribution FROM community_stats_invite_joins j LEFT JOIN community_stats_invites i ON i.community_id=j.community_id AND i.invite_hash=j.invite_hash LEFT JOIN community_stats_channels c ON c.community_id=i.community_id AND c.channel_id=i.channel_id WHERE j.community_id=@community AND j.joined_at_utc>=@from AND j.joined_at_utc<@until AND (j.invite_hash IS NULL OR i.vanity=1 OR i.channel_id IN(SELECT value FROM json_each(@channels))) ${role} GROUP BY Source,j.method,i.vanity${named?',i.creator_id':''} ORDER BY Joins DESC,Source`).all(params) as CommunityStatsTableRow[];
  const inventory=db.prepare(`SELECT CASE WHEN i.vanity=1 THEN 'Server' ELSE coalesce(c.name,'Removed channel') END AS Channel,${named?'i.creator_name':'NULL'} AS "Created by",i.uses AS Uses,i.max_uses AS "Use limit",i.created_at_utc AS "Created UTC",i.expires_at_utc AS "Expires UTC",CASE WHEN i.active=0 THEN 'Inactive' WHEN i.expires_at_utc IS NOT NULL AND i.expires_at_utc<=@now THEN 'Expired' ELSE 'Active' END AS Status FROM community_stats_invites i LEFT JOIN community_stats_channels c ON c.community_id=i.community_id AND c.channel_id=i.channel_id WHERE i.community_id=@community AND (i.vanity=1 OR i.channel_id IN(SELECT value FROM json_each(@channels))) ORDER BY i.active DESC,i.uses DESC,i.invite_hash`).all({community:communityId,channels:JSON.stringify(channels),now:new Date().toISOString()}) as CommunityStatsTableRow[];
  const sourceColumns=['Source',...(named?['Created by']:[]),'Joins','Attribution'],inviteColumns=['Channel',...(named?['Created by']:[]),'Uses','Use limit','Created UTC','Expires UTC','Status'];
  // Do not expose suppressed creator fields in report JSON either.
  const visible=(rows:CommunityStatsTableRow[])=>named?rows:rows.map(({['Created by']:ignored,...row})=>{void ignored;return row;});
  return [{title:'Join sources',columns:sourceColumns,rows:visible(sourceRows).slice((page-1)*size,page*size),totalRows:sourceRows.length,page,pageSize:size},...(!roleId?[{title:'Current invites',columns:inviteColumns,rows:visible(inventory).slice((page-1)*size,page*size),totalRows:inventory.length,page,pageSize:size}]:[])];
}
