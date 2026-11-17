import "server-only";
import {isCommunityReviewDiscordGuild} from "../community-review-discord-guild";
import type Database from "better-sqlite3";
import {approvedCommunityGuildIds} from "../community-launch-policy";
import {CommunityStatsRepository} from "./community-stats-repository";
import {CommunityStatsDiscordGateway} from "./community-stats-discord-gateway";
import {TraderLinkCommunityRepository} from "../traderlink-community-repository";
import {CommunityStatsHistory} from "./community-stats-history";

import {assertCommunityStagingQaCapability,type CommunityStagingQaCapability} from "../community-staging-qa-capability";
/** Shared production collector logic. No timer, socket or database opens on construction. */
export class CommunityStatsCollector {
 private state:{gateway:CommunityStatsDiscordGateway|null;signature:string;lastWeb:string|null;historyCommunities:string[]}={gateway:null,signature:"",lastWeb:null,historyCommunities:[]};
 private stopped=false;
 private readonly history:CommunityStatsHistory;
 constructor(private readonly database:Database.Database,private readonly review?:CommunityStagingQaCapability){
  if(review)assertCommunityStagingQaCapability(review,database);
  this.history=new CommunityStatsHistory(database,review?.request,review);
 }
 tick():void{
    if(this.stopped)return;
    const database=this.database,state=this.state;
    this.review?.collectorTick();
    const at=new Date().toISOString(),repo=new CommunityStatsRepository(database);
    try{
      if(process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1"){
        state.gateway?.stop();state.gateway=null;state.signature="";state.lastWeb=null;state.historyCommunities=[];
        database.prepare(`UPDATE community_stats_source_state SET status='disabled',checked_at_utc=?,reason='Collection is disabled.' WHERE status!='disabled' AND (? IS NULL OR community_id=?)`).run(at,this.review?.run.communityId??null,this.review?.run.communityId??null);return;
      }
      const communities=database.prepare(`SELECT c.community_id,c.discord_guild_id,s.discord_enabled,s.channel_ids_json,s.discord_configuration_version FROM traderlink_communities c JOIN platform_users owner ON owner.user_id=c.owner_user_id AND owner.status='active' LEFT JOIN community_stats_settings s ON s.community_id=c.community_id WHERE c.status='active' AND NOT EXISTS(SELECT 1 FROM traderlink_community_lifecycle l WHERE l.community_id=c.community_id AND l.removed_at_utc IS NOT NULL) ORDER BY c.community_id`)
        .all() as {community_id:string;discord_guild_id:string;discord_enabled:number|null;channel_ids_json:string|null;discord_configuration_version:number|null}[];
      if(this.review)communities.splice(0,communities.length,...communities.filter(row=>row.community_id===this.review!.run.communityId));
      const approved=approvedCommunityGuildIds().filter(isCommunityReviewDiscordGuild);
      repo.transaction(()=>{for(const community of communities){
        if(!isCommunityReviewDiscordGuild(community.discord_guild_id))continue;
        repo.ensureCommunity(community.community_id,at);
        // Close revoked/relinked web eligibility at the first observed change; never relabel history.
        database.prepare(`UPDATE community_stats_identity_links SET until_utc=max(from_utc,?) WHERE community_id=? AND until_utc IS NULL AND NOT EXISTS(
          SELECT 1 FROM platform_users u JOIN platform_auth_identities i ON i.user_id=u.user_id AND i.auth_provider='discord' AND i.status='active'
          JOIN traderlink_community_memberships m ON m.user_id=u.user_id AND m.community_id=? AND m.status='active'
          WHERE u.status='active' AND u.user_id=community_stats_identity_links.platform_user_id AND i.auth_subject=community_stats_identity_links.discord_user_id)`)
          .run(state.lastWeb??at,community.community_id,community.community_id);
        const permissions=new TraderLinkCommunityRepository(database);
        const openLinks=database.prepare(`SELECT platform_user_id FROM community_stats_identity_links WHERE community_id=? AND until_utc IS NULL`).all(community.community_id) as {platform_user_id:string}[];
        for(const link of openLinks)if(!permissions.resolveAccess(community.community_id,link.platform_user_id).capabilities.includes("community.view"))database.prepare(`UPDATE community_stats_identity_links SET until_utc=max(from_utc,?) WHERE community_id=? AND platform_user_id=? AND until_utc IS NULL`).run(state.lastWeb??at,community.community_id,link.platform_user_id);
        // Guild roster evidence can establish a current stable-ID link for members who have not visited.
        const linked=database.prepare(`SELECT u.user_id,i.auth_subject FROM platform_users u JOIN platform_auth_identities i ON i.user_id=u.user_id AND i.auth_provider='discord' AND i.status='active'
          JOIN traderlink_community_memberships m ON m.user_id=u.user_id AND m.community_id=? AND m.status='active'
          JOIN community_stats_members n ON n.community_id=m.community_id AND n.discord_user_id=i.auth_subject AND n.active=1 AND n.is_bot=0
          JOIN community_stats_source_state s ON s.community_id=m.community_id AND s.source='membership' AND s.status='collecting'
          WHERE u.status='active' AND s.checked_at_utc>=?`).all(community.community_id,new Date(Date.parse(at)-90_000).toISOString()) as {user_id:string;auth_subject:string}[];
        for(const identity of linked){
          if(!permissions.resolveAccess(community.community_id,identity.user_id).capabilities.includes("community.view"))continue;
          const exists=database.prepare(`SELECT 1 FROM community_stats_identity_links WHERE community_id=? AND platform_user_id=? AND discord_user_id=? AND until_utc IS NULL`).get(community.community_id,identity.user_id,identity.auth_subject);
          if(!exists){database.prepare(`UPDATE community_stats_identity_links SET until_utc=? WHERE community_id=? AND until_utc IS NULL AND (platform_user_id=? OR discord_user_id=?)`).run(at,community.community_id,identity.user_id,identity.auth_subject);database.prepare(`INSERT INTO community_stats_identity_links(community_id,platform_user_id,discord_user_id,from_utc) VALUES(?,?,?,?)`).run(community.community_id,identity.user_id,identity.auth_subject,at);}
        }
        if(state.lastWeb)repo.coverage(community.community_id,"web",state.lastWeb,at,Date.parse(at)-Date.parse(state.lastWeb)<=90_000?"observed":"gap",Date.parse(at)-Date.parse(state.lastWeb)<=90_000?null:"lag");
        else{
          const last=database.prepare(`SELECT max(until_utc) AS at FROM community_stats_coverage WHERE community_id=? AND source='web' AND state='observed'`).get(community.community_id) as {at:string|null};
          if(last.at&&last.at<at)repo.coverage(community.community_id,"web",last.at,at,"gap","disconnected");
        }
        repo.source(community.community_id,"web","collecting",at);
        if(!community.discord_enabled||!approved.includes(community.discord_guild_id)){
          repo.source(community.community_id,"discord","not_configured",at,approved.includes(community.discord_guild_id)?"Discord collection is disabled for this community.":"Discord collection is awaiting operator approval for this server.");
          repo.source(community.community_id,"membership","not_configured",at,"A complete guild roster has not been observed.");
        }
      }});state.lastWeb=at;
      const selected=communities.filter(row=>row.discord_enabled===1&&approved.includes(row.discord_guild_id)).map(row=>({communityId:row.community_id,guildId:row.discord_guild_id,channelIds:JSON.parse(row.channel_ids_json??"[]") as string[],configurationVersion:row.discord_configuration_version??0}));
      const token=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim(),signature=JSON.stringify(selected)+(token?":token-present":":no-token");
      state.historyCommunities=selected.map(community=>community.communityId);
      if(signature!==state.signature){
        state.gateway?.stop();state.gateway=null;state.signature=signature;
        if(selected.length&&token){
          // Re-establish current Discord and membership collection after a configuration change.
          repo.transaction(()=>{for(const community of selected){
            repo.source(community.communityId,"discord","connecting",at);repo.source(community.communityId,"membership","connecting",at);
          }});
          state.gateway=new CommunityStatsDiscordGateway(()=>database,token,selected,this.review);state.gateway.start();
        }else for(const community of selected)repo.source(community.communityId,"discord","unavailable",at,"Bot credentials are unavailable.");
      }
    }catch(error){state.lastWeb=null;console.error("Community Stats collection paused.",{errorName:error instanceof Error?error.name:"UnknownError"});}

 }
 async historyTick():Promise<void>{
  if(this.stopped)return;
  const token=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim();
  if(process.env.TRADERLINK_COMMUNITY_STATS_ENABLED==="1"&&token)await this.history.tick(this.state.historyCommunities,token);
 }
 stop():void{
  if(this.stopped)return;this.stopped=true;
  this.state.gateway?.stop();this.state.gateway=null;this.state.historyCommunities=[];this.state.lastWeb=null;
  if(this.review)this.database.prepare("UPDATE community_stats_source_state SET status='gap',checked_at_utc=?,reason='Collection is paused.' WHERE community_id=? AND source='web' AND status='collecting'").run(new Date().toISOString(),this.review.run.communityId);
 }
}
