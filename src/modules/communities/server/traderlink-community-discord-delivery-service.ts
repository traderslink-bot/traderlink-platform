import {CommunityPublishingAccess,PublishingAccessError} from "./community-publishing-access";
import {verifyCommunityRequestMember} from "./community-request-verification";
import {recordCommunityDeliveryAttempt} from "./community-delivery-history";
import {createHash} from "node:crypto";
import type Database from "better-sqlite3";

import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";

class RejectedDelivery extends Error {}
type DeliveryRow={publisher_user_id:string|null;destination_id:string;current_attempt_key:string|null;attempt_count:number;community_id:string;discord_guild_id:string;delivery_id:string;object_type:"alert"|"watchlist"|"coach"|"plan";object_id:string;discord_channel_id:string;community_slug:string;community_name:string};

export class TraderLinkCommunityDiscordDeliveryService {
  constructor(private readonly database:Database.Database,private readonly config:Readonly<{botToken:string;publicOrigin:string;notBeforeUtc?:string;now?:()=>string}>,private readonly request:typeof fetch=fetch){ }

  private content(row:DeliveryRow):Readonly<{content:string;allowed_mentions:{parse:readonly string[]}}>{
    if(row.object_type==="alert"){
      const alert=this.database.prepare(`SELECT slug,title,symbol,body,publishing_mode FROM traderlink_community_alerts WHERE alert_id=? AND community_id=? AND status='published'`).get(row.object_id,row.community_id) as {slug:string;title:string;symbol:string|null;body:string;publishing_mode:string}|undefined;
      if(!alert)throw new RejectedDelivery("Community alert is no longer available.");
      const lead=alert.symbol?`**${alert.symbol} — ${alert.title}**`:`**${alert.title}**`; const url=`${this.config.publicOrigin}/communities/${row.community_slug}/alerts/${alert.slug}`;
      return {content:alert.publishing_mode==="discord_post"?`${lead}\n${alert.body}`:`${lead}\n\nOpen in TraderLink: ${url}`,allowed_mentions:{parse:[]}};
    }
    if(row.object_type==="watchlist"){
      const serverWatchlist=this.database.prepare(`SELECT title,description,publishing_mode FROM traderlink_community_server_watchlists WHERE watchlist_id=? AND community_id=? AND status='published'`).get(row.object_id,row.community_id) as {title:string;description:string;publishing_mode:string}|undefined;
      if(serverWatchlist){
        const url=`${this.config.publicOrigin}/communities/${row.community_slug}/server-watchlists/${row.object_id}`;
        if(serverWatchlist.publishing_mode==="discord_post"){
          const symbols=this.database.prepare(`SELECT symbol,note FROM traderlink_community_server_watchlist_symbols WHERE watchlist_id=? ORDER BY ordinal`).all(row.object_id) as {symbol:string;note:string}[];
          return {content:`**${serverWatchlist.title}**\n${serverWatchlist.description}\n${symbols.map(item=>item.symbol+(item.note?` — ${item.note}`:"")).join("\n")}`,allowed_mentions:{parse:[]}};
        }
        return {content:`**${serverWatchlist.title}**\nPublished by ${row.community_name}.\n\nOpen in TraderLink: ${url}`,allowed_mentions:{parse:[]}};
      }
      if(this.database.prepare("SELECT 1 FROM traderlink_community_server_watchlists WHERE watchlist_id=?").get(row.object_id))throw new RejectedDelivery("Official watchlist is no longer published.");
      const watchlist=this.database.prepare(`SELECT p.handle,w.slug,w.title FROM community_watchlists w JOIN community_profiles p ON p.user_id=w.owner_user_id JOIN traderlink_community_watchlist_placements placement ON placement.watchlist_id=w.watchlist_id AND placement.community_id=? AND placement.status='published' WHERE w.watchlist_id=? AND w.status='published'`).get(row.community_id,row.object_id) as {handle:string;slug:string;title:string}|undefined;
      if(!watchlist)throw new RejectedDelivery("Community watchlist is no longer available.");
      const url=`${this.config.publicOrigin}/community/${encodeURIComponent(watchlist.handle)}/watchlists/${encodeURIComponent(watchlist.slug)}`;
      return {content:`**${watchlist.title}**\nShared with ${row.community_name} on TraderLink.\n\nOpen watchlist: ${url}`,allowed_mentions:{parse:[]}};
    }
    if(row.object_type==="plan"){
      const plan=this.database.prepare(`SELECT p.name,p.description,p.price_label,c.coach_slug,c.display_name FROM traderlink_community_coaching_plans p JOIN traderlink_community_coach_profiles c ON c.coach_profile_id=p.coach_profile_id WHERE p.plan_id=? AND p.community_id=? AND p.status='active' AND c.status='active'`).get(row.object_id,row.community_id) as {name:string;description:string;price_label:string;coach_slug:string;display_name:string}|undefined;
      if(!plan)throw new RejectedDelivery("Community coaching plan is no longer available.");
      const url=`${this.config.publicOrigin}/communities/${row.community_slug}/coaches/${plan.coach_slug}`;
      const price=plan.price_label?`\n${plan.price_label}`:"";
      return {content:`**${plan.name} with ${plan.display_name}**${price}\n${plan.description.slice(0,1400)}\n\nPayment and access are handled by ${row.community_name} in Discord.\nOpen coaching details: ${url}`,allowed_mentions:{parse:[]}};
    }
    throw new RejectedDelivery("Unsupported community delivery type.");
  }

  async runAvailable(limit=25):Promise<Readonly<{delivered:number;failed:number}>>{
    if(!Number.isInteger(limit)||limit<1||limit>25)throw new Error("Invalid delivery batch size.");
    const cutoff=this.config.notBeforeUtc??null,now=this.config.now??createCanonicalUtcTimestamp,at=now();
    if(cutoff&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cutoff))throw new Error("Invalid delivery cutoff.");
    // A crashed send is uncertain, not permission to post again.
    this.database.prepare("UPDATE traderlink_community_content_deliveries SET status='failed' WHERE delivery_id IN (SELECT delivery_id FROM traderlink_community_content_deliveries WHERE status='sending' AND updated_at_utc<? ORDER BY updated_at_utc LIMIT 25)").run(new Date(Date.parse(at)-120000).toISOString());
    // Conservatively honor a provider rate limit across this worker, not just one row.
    if(this.database.prepare("SELECT 1 FROM traderlink_community_content_deliveries WHERE delivery_outcome='pending' AND status='failed' AND last_error='Discord rate limit; retry scheduled.' AND next_attempt_at_utc>? LIMIT 1").get(at))return Object.freeze({delivered:0,failed:0});
    const rows=this.database.prepare("SELECT d.publisher_user_id,d.destination_id,d.current_attempt_key,d.community_id,c.discord_guild_id,d.delivery_id,d.object_type,d.object_id,d.attempt_count,x.discord_channel_id,c.slug community_slug,c.display_name community_name FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id JOIN traderlink_communities c ON c.community_id=d.community_id WHERE d.status IN ('pending','failed') AND d.delivery_outcome='pending' AND d.attempt_count<5 AND (d.next_attempt_at_utc IS NULL OR d.next_attempt_at_utc<=?) AND x.status='active' AND c.status='active' AND (? IS NULL OR d.requested_at_utc>=?) ORDER BY d.requested_at_utc LIMIT ?").all(at,cutoff,cutoff,limit) as DeliveryRow[];
    let delivered=0,failed=0;
    for(const row of rows){
      const started=now();
      const claimed=this.database.prepare("UPDATE traderlink_community_content_deliveries SET status='sending',attempt_count=attempt_count+1,last_error=NULL,updated_at_utc=? WHERE delivery_id=? AND status IN ('pending','failed') AND delivery_outcome='pending'").run(started,row.delivery_id);
      if(claimed.changes!==1)continue;
      let postStarted=false;
      const fail=(outcome:"pending"|"rejected"|"uncertain",message:string,delaySeconds?:number)=>{
        const stamp=now();
        const delay=delaySeconds??Math.min(900,30*2**row.attempt_count);
        this.database.transaction(()=>{this.database.prepare("UPDATE traderlink_community_content_deliveries SET status='failed',delivery_outcome=?,last_error=?,next_attempt_at_utc=?,updated_at_utc=? WHERE delivery_id=?").run(outcome,message,outcome==="pending"?new Date(Date.parse(stamp)+delay*1000).toISOString():null,stamp,row.delivery_id);recordCommunityDeliveryAttempt(this.database,{deliveryId:row.delivery_id,communityId:row.community_id,attemptKey:row.current_attempt_key??row.delivery_id,outcome,error:message,atUtc:stamp});}).immediate();
        failed++;
      };
      const retryDelay=async(response:Response)=>{
        const body=await response.json().catch(()=>({})) as {retry_after?:unknown};
        const seconds=Number(body.retry_after??response.headers.get("Retry-After")??30);
        return Number.isFinite(seconds)?Math.max(1,Math.min(seconds,86400)):30;
      };
      try{
        if(row.object_type==="alert"||row.object_type==="watchlist"){
          if(!row.publisher_user_id)throw new RejectedDelivery("Legacy delivery requires owner review; no publisher was recorded.");
          const verified=await verifyCommunityRequestMember(this.database,{slug:row.community_slug,userId:row.publisher_user_id,botToken:this.config.botToken,atUtc:now()},this.request);
          if(!verified){fail("pending","Publisher verification unavailable; delivery paused.");continue;}
          new CommunityPublishingAccess(this.database).assertDelivery(row.community_id,row.publisher_user_id,row.destination_id,row.object_type==="alert"?"alerts":"watchlists",now());
        }
        let payload=this.content(row);
        if(payload.content.length>2000)throw new RejectedDelivery("Post exceeds Discord's 2,000-character limit. Shorten it or choose a page link.");
        const channelResponse=await this.request("https://discord.com/api/v10/channels/"+row.discord_channel_id,{headers:{Authorization:"Bot "+this.config.botToken},signal:AbortSignal.timeout(8000),cache:"no-store"});
        if(channelResponse.status===429){fail("pending","Discord rate limit; retry scheduled.",await retryDelay(channelResponse));break;}
        if(!channelResponse.ok){
          if(channelResponse.status>=500)throw new Error("Discord destination verification unavailable.");
          throw new RejectedDelivery("Discord destination is unavailable or inaccessible.");
        }
        const channel=await channelResponse.json() as {id?:string;guild_id?:string;type?:number};
        if(channel.id!==row.discord_channel_id||channel.guild_id!==row.discord_guild_id||![0,5].includes(channel.type??-1))throw new RejectedDelivery("Discord destination does not belong to this server or is not a supported channel.");
        const stillActive=this.database.prepare("SELECT 1 FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id JOIN traderlink_communities c ON c.community_id=d.community_id WHERE d.delivery_id=? AND d.status='sending' AND x.status='active' AND c.status='active' AND x.discord_channel_id=? AND c.discord_guild_id=?").get(row.delivery_id,row.discord_channel_id,row.discord_guild_id);
        if(!stillActive)throw new RejectedDelivery("The delivery or its destination is no longer active.");
        payload=this.content(row);
        if(payload.content.length>2000)throw new RejectedDelivery("Post exceeds Discord's 2,000-character limit. Shorten it or choose a page link.");
        const nonce=createHash("sha256").update(row.current_attempt_key??row.delivery_id).digest("hex").slice(0,24);
        this.database.prepare("UPDATE traderlink_community_content_deliveries SET delivery_outcome='uncertain' WHERE delivery_id=? AND status='sending'").run(row.delivery_id);
        if(row.object_type==="alert"||row.object_type==="watchlist")new CommunityPublishingAccess(this.database).assertDelivery(row.community_id,row.publisher_user_id,row.destination_id,row.object_type==="alert"?"alerts":"watchlists",now());
        postStarted=true;
        const response=await this.request("https://discord.com/api/v10/channels/"+row.discord_channel_id+"/messages",{method:"POST",signal:AbortSignal.timeout(8000),headers:{Authorization:"Bot "+this.config.botToken,"Content-Type":"application/json"},body:JSON.stringify({...payload,nonce,enforce_nonce:true})});
        if(response.status===429){fail("pending","Discord rate limit; retry scheduled.",await retryDelay(response));break;}
        if(!response.ok){fail(response.status>=500?"uncertain":"rejected",response.status>=500?"Delivery confirmation unavailable. Check Discord before retrying.":"Discord rejected the post ("+response.status+").");continue;}
        const receipt=await response.json() as {id?:string;channel_id?:string};
        if(!receipt.id||!/^\d{1,32}$/.test(receipt.id)||receipt.channel_id!==row.discord_channel_id)throw new Error("Invalid delivery receipt.");
        const stamp=now();
        this.database.transaction(()=>{this.database.prepare("UPDATE traderlink_community_content_deliveries SET status='delivered',delivery_outcome='confirmed',discord_message_id=?,next_attempt_at_utc=NULL,delivered_at_utc=?,updated_at_utc=? WHERE delivery_id=?").run(receipt.id,stamp,stamp,row.delivery_id);recordCommunityDeliveryAttempt(this.database,{deliveryId:row.delivery_id,communityId:row.community_id,attemptKey:row.current_attempt_key??row.delivery_id,outcome:"confirmed",messageId:receipt.id,atUtc:stamp});}).immediate();
        delivered++;
      }catch(error){
        fail(postStarted?"uncertain":error instanceof RejectedDelivery||error instanceof PublishingAccessError?"rejected":"pending",postStarted?"Delivery confirmation unavailable. Check Discord before retrying.":error instanceof RejectedDelivery||error instanceof PublishingAccessError?error.message:"Discord destination verification unavailable; retry scheduled.");
      }
    }
    return Object.freeze({delivered,failed});
  }
}
