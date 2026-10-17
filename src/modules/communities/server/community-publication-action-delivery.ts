import {createCanonicalUuidV4} from "../../platform/server/database/platform-migration-contract";
import {createHash} from "node:crypto";
import type Database from "better-sqlite3";
import {verifyCommunityRequestMember} from "./community-request-verification";
import {CommunityPublishingAccess} from "./community-publishing-access";
import {publicationContent,revisionDiscordPayload,type PublicationContent} from "./community-publication-revisions";
type Action={action_id:string;community_id:string;object_type:"alert"|"watchlist";object_id:string;destination_id:string;publisher_user_id:string|null;initiating_publisher_user_id:string|null;action_kind:"edit"|"announce";target_message_id:string;payload_json:string;content_json:string;content_hash:string;revision_id:string;discord_channel_id:string;discord_guild_id:string;slug:string;attempt_count:number};
export class CommunityPublicationActionDelivery {
 constructor(private readonly db:Database.Database,private readonly config:{botToken:string;publicOrigin:string;now?:()=>string},private readonly request:typeof fetch=fetch){}
 async runAvailable(limit=10){
  const now=this.config.now??(()=>new Date().toISOString()),atUtc=now();
  if(this.db.prepare(`SELECT 1 FROM traderlink_community_publication_actions WHERE status='pending' AND last_error='Discord rate limit; retry scheduled.' AND next_attempt_at_utc>? LIMIT 1`).get(atUtc))return {confirmed:0,failed:0};
  this.db.prepare(`UPDATE traderlink_community_publication_actions SET status='uncertain',last_error='Previous worker stopped without a confirmed receipt. Review Discord before requesting another announcement.',updated_at_utc=? WHERE status='sending' AND updated_at_utc<?`).run(atUtc,new Date(Date.parse(atUtc)-120000).toISOString());
  this.db.prepare(`UPDATE traderlink_community_publication_actions SET status='rejected',last_error='Automatic retries exhausted. Review the channel and request a new action.',updated_at_utc=? WHERE status='pending' AND attempt_count>=5`).run(atUtc);
  const rows=this.db.prepare(`SELECT a.*,r.content_json,r.content_hash,x.discord_channel_id,c.discord_guild_id,c.slug FROM traderlink_community_publication_actions a JOIN traderlink_community_publication_revisions r ON r.revision_id=a.revision_id AND r.community_id=a.community_id JOIN traderlink_community_discord_destinations x ON x.destination_id=a.destination_id AND x.community_id=a.community_id JOIN traderlink_communities c ON c.community_id=a.community_id WHERE a.status='pending' AND a.attempt_count<5 AND (a.next_attempt_at_utc IS NULL OR a.next_attempt_at_utc<=?) AND x.status='active' AND c.status='active' ORDER BY a.requested_at_utc,a.rowid LIMIT ?`).all(atUtc,Math.max(1,Math.min(25,limit))) as Action[];
  let confirmed=0,failed=0;
  for(const row of rows){
   if(this.db.prepare(`UPDATE traderlink_community_publication_actions SET status='sending',attempt_count=attempt_count+1,updated_at_utc=? WHERE action_id=? AND status='pending'`).run(now(),row.action_id).changes!==1)continue;
   const record=(outcome:string,error:string|null=null,messageId:string|null=null)=>this.db.prepare(`INSERT INTO traderlink_community_publication_action_attempts(attempt_id,action_id,attempt_number,outcome,discord_message_id,error_message,occurred_at_utc) VALUES(?,?,?,?,?,?,?)`).run(createCanonicalUuidV4(),row.action_id,row.attempt_count+1,outcome,messageId,error,now());
   record('sending');
   let transmitted=false;
   const fail=(status:"pending"|"rejected"|"uncertain",message:string,delay=30)=>{const stamp=now();this.db.prepare(`UPDATE traderlink_community_publication_actions SET status=?,last_error=?,next_attempt_at_utc=?,updated_at_utc=? WHERE action_id=?`).run(status,message,status==='pending'?new Date(Date.parse(stamp)+delay*1000).toISOString():null,stamp,row.action_id);record(status,message);failed++;};
   const retryDelay=async(response:Response)=>{const data=await response.json().catch(()=>({})) as {retry_after?:number};const seconds=Number(data.retry_after??response.headers.get('Retry-After')??60);return Number.isFinite(seconds)?Math.min(86400,Math.max(1,seconds)):60;};
   const headers={Authorization:`Bot ${this.config.botToken}`};
   try{
    const users=new Set([row.publisher_user_id,row.initiating_publisher_user_id]);
    if(users.has(null))throw new Error("Original publisher evidence is unavailable.");
    for(const userId of users){
     if(!await verifyCommunityRequestMember(this.db,{slug:row.slug,userId:userId!,botToken:this.config.botToken,atUtc:now()},this.request))throw new Error("Publisher verification unavailable.");
     new CommunityPublishingAccess(this.db).assertDelivery(row.community_id,userId!,row.destination_id,row.object_type==='alert'?'alerts':'watchlists',now());
    }
    const latest=this.db.prepare(`SELECT revision_id FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type=? AND object_id=? ORDER BY rowid DESC LIMIT 1`).get(row.community_id,row.object_type,row.object_id) as {revision_id:string}|undefined;
    if(latest?.revision_id!==row.revision_id)throw new Error("A newer revision exists. Review the current content before requesting a Discord update.");
    const table=row.object_type==='alert'?'traderlink_community_alerts':'traderlink_community_server_watchlists',key=row.object_type==='alert'?'alert_id':'watchlist_id';
    if(!this.db.prepare(`SELECT 1 FROM ${table} WHERE community_id=? AND ${key}=? AND status='published'`).get(row.community_id,row.object_id))throw new Error("Content is no longer published.");
    const [botResponse,channelResponse,messageResponse]=await Promise.all([
     this.request('https://discord.com/api/v10/users/@me',{headers,cache:'no-store',signal:AbortSignal.timeout(8000)}),
     this.request(`https://discord.com/api/v10/channels/${row.discord_channel_id}`,{headers,cache:'no-store',signal:AbortSignal.timeout(8000)}),
     this.request(`https://discord.com/api/v10/channels/${row.discord_channel_id}/messages/${row.target_message_id}`,{headers,cache:'no-store',signal:AbortSignal.timeout(8000)})]);
    if([botResponse,channelResponse,messageResponse].some(response=>response.status===429)){fail('pending','Discord rate limit; retry scheduled.',await retryDelay([botResponse,channelResponse,messageResponse].find(response=>response.status===429)!));break;}
    if([botResponse,channelResponse,messageResponse].some(response=>response.status>=500)){fail('pending','Discord verification unavailable; retry scheduled.',60);continue;}
    if(!botResponse.ok||!channelResponse.ok||!messageResponse.ok)throw new Error("Original Discord post is missing or inaccessible. No replacement was sent.");
    const [bot,channel,message]=await Promise.all([botResponse.json(),channelResponse.json(),messageResponse.json()]) as [{id:string;bot:boolean},{id:string;guild_id:string},{id:string;channel_id:string;author:{id:string}}];
    if(!bot.bot||channel.id!==row.discord_channel_id||channel.guild_id!==row.discord_guild_id||message.id!==row.target_message_id||message.channel_id!==channel.id||message.author?.id!==bot.id)throw new Error("The original post is not an editable message owned by this Discord bot.");
    const content=JSON.parse(row.content_json) as PublicationContent;
    const url=new URL(`/communities/${row.slug}/${row.object_type==='alert'?`alerts/${row.object_id}`:`server-watchlists/${row.object_id}`}`,this.config.publicOrigin).toString();
    const currentName=publicationContent(this.db,row.community_id,row.object_type,row.object_id)?.authorName??"An analyst";
    const summary=(JSON.parse(row.payload_json) as {summary:string}).summary;
    const text=row.action_kind==='edit'?revisionDiscordPayload(content,row.object_type,url,currentName):`${currentName} updated ${row.object_type==='alert'?'an alert':'a watchlist'}.\nWhat changed: ${summary}\nOpen ${row.object_type}: ${url}\nOriginal post: https://discord.com/channels/${row.discord_guild_id}/${row.discord_channel_id}/${row.target_message_id}`;
    if(text.length>2000)throw new Error("Discord post exceeds 2,000 characters. Shorten it or use a tracked-page link.");
    if(!this.db.prepare(`SELECT 1 FROM traderlink_community_discord_destinations x JOIN traderlink_communities c ON c.community_id=x.community_id WHERE x.community_id=? AND x.destination_id=? AND x.status='active' AND c.status='active'`).get(row.community_id,row.destination_id))throw new Error("Community or destination is no longer active.");
    for(const userId of users)new CommunityPublishingAccess(this.db).assertDelivery(row.community_id,userId!,row.destination_id,row.object_type==='alert'?'alerts':'watchlists',now());
    // Persisted sending claim becomes uncertain after a crash; announcements are never automatically duplicated.
    transmitted=true;
    const response=await this.request(`https://discord.com/api/v10/channels/${row.discord_channel_id}/messages${row.action_kind==='edit'?`/${row.target_message_id}`:''}`,{method:row.action_kind==='edit'?'PATCH':'POST',headers:{...headers,'Content-Type':'application/json'},signal:AbortSignal.timeout(8000),body:JSON.stringify({content:text,allowed_mentions:{parse:[]},...(row.action_kind==='announce'?{nonce:createHash('sha256').update(row.action_id).digest('hex').slice(0,24),enforce_nonce:true}:{})})});
    if(response.status===429){fail('pending','Discord rate limit; retry scheduled.',await retryDelay(response));break;}
    if(!response.ok){fail(response.status>=500?'uncertain':'rejected',response.status>=500?'Discord confirmation unavailable. Inspect the channel before requesting another action.':`Discord rejected this action (${response.status}).`);continue;}
    const receipt=await response.json() as {id:string;channel_id:string};if(!/^\d{1,32}$/.test(receipt.id)||receipt.channel_id!==row.discord_channel_id||(row.action_kind==='edit'&&receipt.id!==row.target_message_id))throw new Error("Invalid Discord receipt");
    this.db.prepare(`UPDATE traderlink_community_publication_actions SET status='confirmed',discord_message_id=?,last_error=NULL,next_attempt_at_utc=NULL,updated_at_utc=? WHERE action_id=?`).run(receipt.id,now(),row.action_id);record('confirmed',null,receipt.id);confirmed++;
   }catch(error){fail(transmitted?'uncertain':'rejected',transmitted?'Discord confirmation unavailable. Inspect the channel before requesting another action.':error instanceof Error?error.message:'Discord action unavailable.');}
  }
  return {confirmed,failed};
 }
}
