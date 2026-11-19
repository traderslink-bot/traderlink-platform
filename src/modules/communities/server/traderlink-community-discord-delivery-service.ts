import {sharedOwnedDeliverySql,sharedOwnedActionSql,sharedCooldownSql} from "./shared-alerts-storage-readiness";
import type {SharedActionAdmission} from "./community-publication-action-delivery";
import { COMMUNITY_REVIEW_DISCORD_GUILD_ID, isCommunityReviewDiscordGuild } from "./community-review-discord-guild";
import { verifyCommunityReviewDeliveryChannel, CommunityReviewDiscordChannelError, type CommunityReviewDeliveryScope } from "./community-review-discord-channel";
import {publicationContent,revisionDiscordPayload,type PublicationContent} from "./community-publication-revisions";
import {CommunityPublicationActionDelivery} from "./community-publication-action-delivery";
import {expireCommunityRecoverySettings,refreshCommunityBotInstallations} from "./community-lifecycle";
import {CommunityPublishingAccess,PublishingAccessError} from "./community-publishing-access";
import {verifyCommunityRequestMember} from "./community-request-verification";
import {recordCommunityDeliveryAttempt} from "./community-delivery-history";
import {createHash} from "node:crypto";
import type Database from "better-sqlite3";
import {sourceAlertDiscordParts} from "../contracts/community-source-alert-parts";
import {communityPublicationDestinationUrl} from "./community-branded-destination-url";
import {assertCommunityStagingQaCapability,type CommunityStagingQaCapability} from "./community-staging-qa-capability";

import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";

class RejectedDelivery extends Error {}
type DeliveryRow={publisher_user_id:string|null;destination_id:string;current_attempt_key:string|null;attempt_count:number;community_id:string;discord_guild_id:string;delivery_id:string;object_type:"alert"|"watchlist"|"plan";object_id:string;discord_channel_id:string;community_slug:string;community_name:string};
export type CommunityExactDeliverySelection=CommunityReviewDeliveryScope & Readonly<{capability:CommunityStagingQaCapability;deliveryIds:readonly string[];actionIds:readonly string[];sharedDeliveryIds:readonly string[]}>;

export class TraderLinkCommunityDiscordDeliveryService {
  constructor(private readonly database:Database.Database,private readonly config:Readonly<{botToken:string;publicOrigin:string;notBeforeUtc?:string;now?:()=>string;sharedActions?:SharedActionAdmission;exactSelection?:CommunityExactDeliverySelection}>,private readonly request:typeof fetch=fetch){ }

  private alertPublisher(row:DeliveryRow){return row.object_type==="alert"||row.object_type==="watchlist"?publicationContent(this.database,row.community_id,row.object_type,row.object_id)?.authorName??"An analyst":"An analyst";}
  private content(row:DeliveryRow):Readonly<{content:string;allowed_mentions:{parse:readonly string[]}}>{
    if(row.object_type==="alert"){
      const alert=this.database.prepare(`SELECT slug,title,symbol,body,publishing_mode FROM traderlink_community_alerts WHERE alert_id=? AND community_id=? AND status='published'`).get(row.object_id,row.community_id) as {slug:string;title:string;symbol:string|null;body:string;publishing_mode:string}|undefined;
      if(!alert)throw new RejectedDelivery("Community alert is no longer available.");
      const lead=alert.symbol?`**${alert.symbol} — ${alert.title}**`:`**${alert.title}**`; const url=communityPublicationDestinationUrl(this.database,{publicOrigin:this.config.publicOrigin,communityId:row.community_id,communitySlug:row.community_slug,kind:"alert",objectId:row.object_id});
      const original=this.database.prepare(`SELECT content_json FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type='alert' AND object_id=? AND evidence_kind='original' ORDER BY rowid LIMIT 1`).get(row.community_id,row.object_id) as {content_json:string}|undefined;
      if(original)return {content:revisionDiscordPayload(JSON.parse(original.content_json) as PublicationContent,"alert",url,this.alertPublisher(row)),allowed_mentions:{parse:[]}};
      return {content:alert.publishing_mode==="discord_post"?`${lead}\n${alert.body}`:`${this.alertPublisher(row)} published an alert.\nOpen alert: ${url}`,allowed_mentions:{parse:[]}};
    }
    if(row.object_type==="watchlist"){
      const serverWatchlist=this.database.prepare(`SELECT title,description,publishing_mode FROM traderlink_community_server_watchlists WHERE watchlist_id=? AND community_id=? AND status='published'`).get(row.object_id,row.community_id) as {title:string;description:string;publishing_mode:string}|undefined;
      if(serverWatchlist){
        const url=communityPublicationDestinationUrl(this.database,{publicOrigin:this.config.publicOrigin,communityId:row.community_id,communitySlug:row.community_slug,kind:"watchlist",objectId:row.object_id});
        const original=this.database.prepare(`SELECT content_json FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type='watchlist' AND object_id=? AND evidence_kind='original' ORDER BY rowid LIMIT 1`).get(row.community_id,row.object_id) as {content_json:string}|undefined;
        if(original)return {content:revisionDiscordPayload(JSON.parse(original.content_json) as PublicationContent,"watchlist",url,this.alertPublisher(row)),allowed_mentions:{parse:[]}};
        if(serverWatchlist.publishing_mode==="discord_post"){
          const symbols=this.database.prepare(`SELECT symbol,note FROM traderlink_community_server_watchlist_symbols WHERE watchlist_id=? ORDER BY ordinal`).all(row.object_id) as {symbol:string;note:string}[];
          return {content:`**${serverWatchlist.title}**\n${serverWatchlist.description}\n${symbols.map(item=>item.symbol+(item.note?` — ${item.note}`:"")).join("\n")}`,allowed_mentions:{parse:[]}};
        }
        return {content:`${this.alertPublisher(row)} published a watchlist.\nOpen watchlist: ${url}`,allowed_mentions:{parse:[]}};
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

  private messageParts(row:DeliveryRow,payload:string):readonly string[]{
    if(row.object_type!=="alert"||payload.length<=2000)return [payload];
    const original=this.database.prepare(`SELECT content_json FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type='alert' AND object_id=? AND evidence_kind='original' ORDER BY rowid LIMIT 1`).get(row.community_id,row.object_id) as {content_json:string}|undefined;
    if(!original)throw new RejectedDelivery("The original alert text is unavailable for a multipart post.");
    const content=JSON.parse(original.content_json) as PublicationContent;
    if(content.publishingMode!=="discord_post")throw new RejectedDelivery("A tracked-page alert cannot be split into full Discord posts.");
    try{return sourceAlertDiscordParts({title:content.title,symbol:content.symbol,body:content.body??""});}
    catch{throw new RejectedDelivery("Alert text cannot be split into Discord posts. Simplify it or choose a tracked-page link.");}
  }

  async runAvailable(limit=25):Promise<Readonly<{delivered:number;failed:number}>>{
    if(!Number.isInteger(limit)||limit<1||limit>25)throw new Error("Invalid delivery batch size.");
    const cutoff=this.config.notBeforeUtc??null,now=this.config.now??createCanonicalUtcTimestamp,at=now();
    if(cutoff&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cutoff))throw new Error("Invalid delivery cutoff.");
    const owned=sharedOwnedDeliverySql(this.database,"traderlink_community_content_deliveries");
    const exact=this.config.exactSelection;
    if(exact)assertCommunityStagingQaCapability(exact.capability,this.database);
    if(!exact){
      expireCommunityRecoverySettings(this.database,at);
      await refreshCommunityBotInstallations(this.database,this.config.botToken,at,this.request);
    }
    const stale=new Date(Date.parse(at)-120000).toISOString();
    if(!exact)this.database.prepare(`UPDATE traderlink_community_content_deliveries SET status='failed' WHERE object_type='alert' AND NOT ${owned} AND status='sending' AND delivery_outcome='pending' AND updated_at_utc<? AND EXISTS (SELECT 1 FROM traderlink_community_delivery_attempt_history h WHERE h.delivery_id=traderlink_community_content_deliveries.delivery_id AND h.outcome='confirmed' AND h.attempt_key LIKE 'source-alert:%:part:%')`).run(stale);
    const exactActionRate=exact?` AND a.action_id IN (${exact.actionIds.map(()=>"?").join(",")||"NULL"})`:"";
    if(this.database.prepare(`SELECT 1 FROM traderlink_community_publication_actions a WHERE NOT ${sharedOwnedActionSql(this.database)}${exactActionRate} AND status='pending' AND last_error='Discord rate limit; retry scheduled.' AND next_attempt_at_utc>? LIMIT 1`).get(...(exact?[...exact.actionIds]:[]),at))return Object.freeze({delivered:0,failed:0});
    // A crashed send is uncertain, not permission to post again.
    if(!exact)this.database.prepare(`UPDATE traderlink_community_content_deliveries SET status='failed' WHERE delivery_id IN (SELECT delivery_id FROM traderlink_community_content_deliveries WHERE NOT ${owned} AND status='sending' AND updated_at_utc<? ORDER BY updated_at_utc LIMIT 25)`).run(new Date(Date.parse(at)-120000).toISOString());
    // Conservatively honor a provider rate limit across this worker, not just one row.
    const exactDeliveryRate=exact?` AND delivery_id IN (${exact.deliveryIds.map(()=>"?").join(",")||"NULL"})`:"";
    if(this.database.prepare(`SELECT 1 FROM traderlink_community_content_deliveries WHERE NOT ${owned}${exactDeliveryRate} AND delivery_outcome='pending' AND status='failed' AND last_error='Discord rate limit; retry scheduled.' AND next_attempt_at_utc>? LIMIT 1`).get(...(exact?[...exact.deliveryIds]:[]),at))return Object.freeze({delivered:0,failed:0});
    const exactIds=exact?.deliveryIds??[];
    const exactClause=exact?` AND d.delivery_id IN (${exactIds.map(()=>"?").join(",")||"NULL"}) AND x.discord_channel_id IN (${exact.channelIds.map(()=>"?").join(",")||"NULL"})`:"";
    const guildId=exact?.guildId??COMMUNITY_REVIEW_DISCORD_GUILD_ID;
    const rows=this.database.prepare(`SELECT d.publisher_user_id,d.destination_id,d.current_attempt_key,d.community_id,c.discord_guild_id,d.delivery_id,d.object_type,d.object_id,d.attempt_count,x.discord_channel_id,c.slug community_slug,c.display_name community_name FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id JOIN traderlink_communities c ON c.community_id=d.community_id WHERE NOT ${sharedOwnedDeliverySql(this.database)} AND ${sharedCooldownSql(this.database,"x.discord_channel_id",at)} AND c.discord_guild_id=?${exactClause} AND ((d.object_type='plan' AND x.content_type='coaching') OR (d.object_type='alert' AND x.content_type='alerts') OR (d.object_type='watchlist' AND x.content_type='watchlists')) AND d.status IN ('pending','failed') AND d.delivery_outcome='pending' AND d.attempt_count<5 AND (d.next_attempt_at_utc IS NULL OR d.next_attempt_at_utc<=?) AND x.status='active' AND c.status='active' AND (? IS NULL OR d.requested_at_utc>=?) ORDER BY d.requested_at_utc LIMIT ?`).all(guildId,...(exact?[...exactIds,...exact.channelIds]:[]),at,cutoff,cutoff,limit) as DeliveryRow[];
    let delivered=0,failed=0;
    for(const row of rows){
      if(exact?(row.discord_guild_id!==exact.guildId||!exact.channelIds.includes(row.discord_channel_id)):!isCommunityReviewDiscordGuild(row.discord_guild_id))continue;
      if(this.database.prepare(`SELECT 1 FROM traderlink_community_content_deliveries d WHERE d.delivery_id=? AND ${sharedOwnedDeliverySql(this.database)}`).get(row.delivery_id))continue;
      const started=now();
      const claimed=this.database.prepare("UPDATE traderlink_community_content_deliveries SET status='sending',attempt_count=attempt_count+1,last_error=NULL,updated_at_utc=? WHERE delivery_id=? AND status IN ('pending','failed') AND delivery_outcome='pending'").run(started,row.delivery_id);
      if(claimed.changes!==1)continue;
      let postStarted=false,multipartProgressed=false;
      const fail=(outcome:"pending"|"rejected"|"uncertain",message:string,delaySeconds?:number)=>{
        const stamp=now();
        const delay=delaySeconds??Math.min(900,30*2**row.attempt_count);
        this.database.transaction(()=>{this.database.prepare("UPDATE traderlink_community_content_deliveries SET status='failed',delivery_outcome=?,last_error=?,next_attempt_at_utc=?,updated_at_utc=? WHERE delivery_id=? AND status='sending'").run(outcome,message,outcome==="pending"?new Date(Date.parse(stamp)+delay*1000).toISOString():null,stamp,row.delivery_id);recordCommunityDeliveryAttempt(this.database,{deliveryId:row.delivery_id,communityId:row.community_id,attemptKey:row.current_attempt_key??row.delivery_id,outcome,error:message,atUtc:stamp});}).immediate();
        failed++;
      };
      const retryDelay=async(response:Response)=>{
        const body=await response.json().catch(()=>({})) as {retry_after?:unknown};
        const seconds=Number(body.retry_after??response.headers.get("Retry-After")??30);
        return Number.isFinite(seconds)?Math.max(1,Math.min(seconds,86400)):30;
      };
      try{
        if(row.object_type==="alert"||row.object_type==="watchlist"){
          const intent=new CommunityPublishingAccess(this.database).intent(row.community_id,row.object_type,row.object_id);
          if(!intent||intent.distribution!=="discord"||!intent.destinationIds.includes(row.destination_id))throw new RejectedDelivery("This destination is no longer selected for Discord delivery.");
          if(!row.publisher_user_id)throw new RejectedDelivery("Legacy delivery requires owner review; no publisher was recorded.");
          const verified=await verifyCommunityRequestMember(this.database,{slug:row.community_slug,userId:row.publisher_user_id,botToken:this.config.botToken,atUtc:now(),stagingQaGuildId:exact?.guildId},this.request);
          if(!verified){fail("pending","Publisher verification unavailable; delivery paused.");continue;}
          new CommunityPublishingAccess(this.database).assertDelivery(row.community_id,row.publisher_user_id,row.destination_id,row.object_type==="alert"?"alerts":"watchlists",now());
        }
        let payload=this.content(row);
        let parts=this.messageParts(row,payload.content);
        if(parts.some(part=>part.length>2000))throw new RejectedDelivery("Post exceeds Discord's 2,000-character limit.");
        await verifyCommunityReviewDeliveryChannel(this.database,row,this.config.botToken,this.request,exact);
        const stillActive=this.database.prepare("SELECT 1 FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id JOIN traderlink_communities c ON c.community_id=d.community_id WHERE d.delivery_id=? AND d.status='sending' AND x.status='active' AND c.status='active' AND x.discord_channel_id=? AND c.discord_guild_id=?").get(row.delivery_id,row.discord_channel_id,row.discord_guild_id);
        if(!stillActive)throw new RejectedDelivery("The delivery or its destination is no longer active.");
        payload=this.content(row);
        parts=this.messageParts(row,payload.content);
        if(parts.some(part=>part.length>2000))throw new RejectedDelivery("Post exceeds Discord's 2,000-character limit.");
        if(parts.length>1){
          let halted=false;
          let firstMessageId:string|null=null;
          for(let index=0;index<parts.length;index++){
            const partKey=`source-alert:${row.delivery_id}:part:${index+1}`;
            const confirmed=this.database.prepare(`SELECT discord_message_id FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? AND attempt_key=? AND outcome='confirmed' AND discord_message_id IS NOT NULL ORDER BY occurred_at_utc LIMIT 1`).get(row.delivery_id,partKey) as {discord_message_id:string}|undefined;
            if(confirmed){if(index===0)firstMessageId=confirmed.discord_message_id;multipartProgressed=true;continue;}
            if(!this.database.prepare("SELECT 1 FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id JOIN traderlink_communities c ON c.community_id=d.community_id WHERE d.delivery_id=? AND d.status='sending' AND x.status='active' AND c.status='active' AND x.discord_channel_id=? AND c.discord_guild_id=?").get(row.delivery_id,row.discord_channel_id,row.discord_guild_id))throw new RejectedDelivery("The delivery or destination is no longer active.");
            const currentIntent=new CommunityPublishingAccess(this.database).intent(row.community_id,"alert",row.object_id);
            if(!currentIntent||currentIntent.distribution!=="discord"||!currentIntent.destinationIds.includes(row.destination_id))throw new RejectedDelivery("This channel is no longer selected for the alert.");
            if(!await verifyCommunityRequestMember(this.database,{slug:row.community_slug,userId:row.publisher_user_id!,botToken:this.config.botToken,atUtc:now(),stagingQaGuildId:exact?.guildId},this.request))throw new RejectedDelivery("Publisher verification unavailable.");
            new CommunityPublishingAccess(this.database).assertDelivery(row.community_id,row.publisher_user_id!,row.destination_id,"alerts",now());
            await verifyCommunityReviewDeliveryChannel(this.database,row,this.config.botToken,this.request,exact);
            new CommunityPublishingAccess(this.database).assertDelivery(row.community_id,row.publisher_user_id,row.destination_id,"alerts",now());
            this.content(row);
            const nonce=createHash("sha256").update(partKey).digest("hex").slice(0,24);
            const requestedAt=now();
            this.database.transaction(()=>{
              this.database.prepare("UPDATE traderlink_community_content_deliveries SET delivery_outcome='uncertain',updated_at_utc=? WHERE delivery_id=? AND status='sending'").run(requestedAt,row.delivery_id);
              recordCommunityDeliveryAttempt(this.database,{deliveryId:row.delivery_id,communityId:row.community_id,attemptKey:partKey,outcome:"requested",atUtc:requestedAt});
            }).immediate();
            postStarted=true;
            const response=await this.request("https://discord.com/api/v10/channels/"+row.discord_channel_id+"/messages",{method:"POST",signal:AbortSignal.timeout(8000),headers:{Authorization:"Bot "+this.config.botToken,"Content-Type":"application/json"},body:JSON.stringify({content:parts[index],allowed_mentions:{parse:[]},nonce,enforce_nonce:true})});
            if(response.status===429){postStarted=false;fail("pending","Discord rate limit; retry scheduled.",await retryDelay(response));halted=true;break;}
            if(!response.ok){fail(response.status>=500||multipartProgressed?"uncertain":"rejected",response.status>=500||multipartProgressed?"Alert delivery may be partial. Inspect Discord before retrying.":"Discord rejected the post ("+response.status+").");halted=true;break;}
            const receipt=await response.json() as {id?:string;channel_id?:string};
            if(!receipt.id||!/^[0-9]{1,32}$/.test(receipt.id)||receipt.channel_id!==row.discord_channel_id)throw new Error("Invalid delivery receipt.");
            if(index===0)firstMessageId=receipt.id;
            const stamp=now();
            this.database.transaction(()=>{
              recordCommunityDeliveryAttempt(this.database,{deliveryId:row.delivery_id,communityId:row.community_id,attemptKey:partKey,outcome:"confirmed",messageId:receipt.id,atUtc:stamp});
              this.database.prepare("UPDATE traderlink_community_content_deliveries SET delivery_outcome='pending',discord_message_id=coalesce(discord_message_id,?),updated_at_utc=? WHERE delivery_id=? AND status='sending'").run(firstMessageId,stamp,row.delivery_id);
            }).immediate();
            postStarted=false;multipartProgressed=true;
          }
          if(halted)continue;
          const stamp=now();
          this.database.prepare("UPDATE traderlink_community_content_deliveries SET status='delivered',delivery_outcome='confirmed',discord_message_id=?,next_attempt_at_utc=NULL,delivered_at_utc=?,updated_at_utc=? WHERE delivery_id=? AND status='sending'").run(firstMessageId,stamp,stamp,row.delivery_id);
          delivered++;
          continue;
        }
        const nonce=createHash("sha256").update(row.current_attempt_key??row.delivery_id).digest("hex").slice(0,24);
        this.database.prepare("UPDATE traderlink_community_content_deliveries SET delivery_outcome='uncertain' WHERE delivery_id=? AND status='sending'").run(row.delivery_id);
        if(row.object_type==="alert"||row.object_type==="watchlist")new CommunityPublishingAccess(this.database).assertDelivery(row.community_id,row.publisher_user_id,row.destination_id,row.object_type==="alert"?"alerts":"watchlists",now());
        await verifyCommunityReviewDeliveryChannel(this.database,row,this.config.botToken,this.request,exact);
        if(row.object_type==="alert"||row.object_type==="watchlist")new CommunityPublishingAccess(this.database).assertDelivery(row.community_id,row.publisher_user_id,row.destination_id,row.object_type==="alert"?"alerts":"watchlists",now());
        this.content(row);
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
        if(error instanceof CommunityReviewDiscordChannelError&&error.response.status===429){fail("pending","Discord rate limit; retry scheduled.",await retryDelay(error.response));break;}
        fail(postStarted||multipartProgressed?"uncertain":error instanceof RejectedDelivery||error instanceof PublishingAccessError?"rejected":"pending",postStarted||multipartProgressed?"Alert delivery may be partial. Inspect Discord before retrying.":error instanceof RejectedDelivery||error instanceof PublishingAccessError?error.message:"Discord destination verification unavailable; retry scheduled.");
      }
    }
    const updates=await new CommunityPublicationActionDelivery(this.database,this.config,this.request).runAvailable(Math.min(limit,10));
    return Object.freeze({delivered:delivered+updates.confirmed,failed:failed+updates.failed});
  }
}
