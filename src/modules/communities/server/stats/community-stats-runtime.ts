import "server-only";
import type Database from "better-sqlite3";
import {openPlatformDatabase} from "../../../platform/server/database/open-platform-database";
import {approvedCommunityGuildIds} from "../community-launch-policy";
import {CommunityStatsRepository,communityStatsStorageReady} from "./community-stats-repository";
import {CommunityStatsDiscordGateway} from "./community-stats-discord-gateway";
import {pruneCommunityStats} from "./community-stats-retention";
import {TraderLinkCommunityRepository} from "../traderlink-community-repository";

type State={timer:ReturnType<typeof setInterval>;database:Database.Database;gateway:CommunityStatsDiscordGateway|null;signature:string;lastWeb:string|null;lastPrune:number;pruneBacklog:boolean};
const key="__traderlinkCommunityStatsRuntime";
type Global=typeof globalThis&{[key]?:State};
/** Called only from the hosted single-writer worker bootstrap, never from a page. */
export function startHostedCommunityStats():void{
  if((globalThis as Global)[key])return;
  const database=openPlatformDatabase({mode:"runtime"});
  if(!communityStatsStorageReady(database)){database.close();return;}
  const state:State={database,gateway:null,signature:"",lastWeb:null,lastPrune:0,pruneBacklog:false,timer:undefined as unknown as ReturnType<typeof setInterval>};
  const tick=()=>{
    const at=new Date().toISOString(),repo=new CommunityStatsRepository(database);
    try{
      // Retention continues in idle/disabled communities; collection and pruning are separate duties.
      if(state.pruneBacklog||Date.now()-state.lastPrune>=3_600_000){const limit=state.pruneBacklog?5000:500,result=pruneCommunityStats(database,at,limit);state.pruneBacklog=(result?.removed??0)>=limit;state.lastPrune=Date.now();}
      if(process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1"){
        state.gateway?.stop();state.gateway=null;state.signature="";state.lastWeb=null;
        database.prepare(`UPDATE community_stats_source_state SET status='disabled',checked_at_utc=?,reason='Collection is disabled.' WHERE status!='disabled'`).run(at);return;
      }
      const communities=database.prepare(`SELECT c.community_id,c.discord_guild_id,s.discord_enabled,s.channel_ids_json,s.discord_configuration_version FROM traderlink_communities c JOIN platform_users owner ON owner.user_id=c.owner_user_id AND owner.status='active' LEFT JOIN community_stats_settings s ON s.community_id=c.community_id WHERE c.status='active' AND NOT EXISTS(SELECT 1 FROM traderlink_community_lifecycle l WHERE l.community_id=c.community_id AND l.removed_at_utc IS NOT NULL) ORDER BY c.community_id`)
        .all() as {community_id:string;discord_guild_id:string;discord_enabled:number|null;channel_ids_json:string|null;discord_configuration_version:number|null}[];
      const approved=approvedCommunityGuildIds();
      repo.transaction(()=>{for(const community of communities){
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
      if(signature!==state.signature){
        state.gateway?.stop();state.gateway=null;state.signature=signature;
        if(selected.length&&token){
          // A prior process cannot prove that an unpaired voice session continued through downtime.
          repo.transaction(()=>{for(const community of selected){
            const voices=database.prepare(`SELECT discord_user_id FROM community_stats_voice_state WHERE community_id=?`).all(community.communityId) as {discord_user_id:string}[];
            for(const voice of voices)repo.closeVoice(community.communityId,voice.discord_user_id,at,true);
            repo.source(community.communityId,"discord","connecting",at);repo.source(community.communityId,"membership","connecting",at);
          }});
          state.gateway=new CommunityStatsDiscordGateway(()=>database,token,selected);state.gateway.start();
        }else for(const community of selected)repo.source(community.communityId,"discord","unavailable",at,"Bot credentials are unavailable.");
      }
    }catch(error){state.lastWeb=null;console.error("Community Stats collection paused.",{errorName:error instanceof Error?error.name:"UnknownError"});}
  };
  state.timer=setInterval(tick,30_000);state.timer.unref();(globalThis as Global)[key]=state;tick();
}
