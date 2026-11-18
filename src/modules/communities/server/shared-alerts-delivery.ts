import { isCommunityReviewDiscordGuild } from "./community-review-discord-guild";
import type { SharedAlertPublishingContext } from "./shared-alerts-publishing-authorization";
import { isSharedAlertPublisher } from "./shared-alerts-publisher-permissions";
import type Database from "better-sqlite3";
import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { sharedAlertDiscordParts } from "./community-alert-discord-content";
import { SharedAlertsDiscord } from "./shared-alerts-discord";
import { SharedAlertsRepository, type SharedAlertRequestRow } from "./shared-alerts-repository";
import { verifySharedAlertOwner } from "./shared-alerts-verification";
import { sharedAlertAwareDiscordRequest, sharedAlertRateLimit, SharedAlertRateLimits } from "./shared-alerts-rate-limits";
import { cancelStoppedSharedAlertParts, ensureSharedAlertParts, hasConfirmedSharedAlertOriginal, type SharedAlertPartRow } from "./shared-alerts-parts";

type Job = { author_user_id:string; content_revision:number; requires_approval:number; kind:"publication"|"correction"|"withdrawal"; original_delivery_id:string|null; publisher_user_id:string|null; change_actor_user_id:string|null; source_destination_ids_json:string; delivery_id:string; request_id:string; alert_id:string; terms_version:number; channel_revision:number; channel_id:string; title:string; symbol:string|null; body:string; publishing_mode:"tracked_page"|"discord_post"; source_name:string; show_source_name:number };
type CurrentJob = {status:string;title:string;symbol:string|null;body:string;content_revision:number;approved_content_revision:number|null;approved_by_user_id:string|null;retry_at_utc:string|null};

/** Default-off. Counts complete alerts; limit bounds HTTP message sends per pass. */
export class SharedAlertsDelivery {
  private readonly now:()=>string;
  private readonly request:typeof fetch;
  constructor(private readonly database:Database.Database,private readonly config:{botToken:string;enabled:boolean;now?:()=>string;notBeforeUtc?:string;preparePublication?:(communityId:string,alertId:string,context:SharedAlertPublishingContext)=>Promise<boolean>;canSharePublication?:(communityId:string,alertId:string,context:SharedAlertPublishingContext)=>boolean},request:typeof fetch=fetch){
    this.now=config.now??createCanonicalUtcTimestamp;
    this.request=sharedAlertAwareDiscordRequest(request,operation=>operation(database),this.now);
  }
  hasGlobalCooldown():boolean{return this.coolingDown("");}

  async runAvailable(limit=10):Promise<{delivered:number;failed:number}>{
    if(!this.config.enabled)return {delivered:0,failed:0};
    const repository=new SharedAlertsRepository(this.database,this.now),discord=new SharedAlertsDiscord(this.config.botToken,this.request,this.now);
    const at=this.now(),cutoff=this.config.notBeforeUtc??null;
    if(cutoff&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(cutoff)||!Number.isFinite(Date.parse(cutoff))))throw new Error("Invalid shared delivery cutoff.");
    this.reconcileInterrupted();cancelStoppedSharedAlertParts(this.database,at);
    this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='cancelled',last_error='Original partner post was never confirmed.',updated_at_utc=?
      WHERE status IN ('awaiting_approval','pending','failed') AND original_delivery_id IN (
        SELECT original.delivery_id FROM community_shared_alert_deliveries original WHERE original.status IN ('cancelled','rejected') AND original.discord_message_id IS NULL
          AND NOT EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=original.delivery_id AND p.status IN ('sending','uncertain')))` ).run(at);
    const budget=Math.max(1,Math.min(25,Number.isSafeInteger(limit)?limit:10));
    const jobs=this.database.prepare(`SELECT d.* FROM community_shared_alert_deliveries d WHERE d.attempt_count<5
      AND (d.status='pending' OR (d.status='failed' AND d.retry_at_utc IS NOT NULL AND d.retry_at_utc<=@now))
      AND NOT EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts unsafe WHERE unsafe.delivery_id=d.delivery_id AND unsafe.content_revision=d.content_revision AND unsafe.status IN ('sending','uncertain'))
      AND (d.kind='publication' OR EXISTS(SELECT 1 FROM community_shared_alert_deliveries original WHERE original.delivery_id=d.original_delivery_id AND original.discord_message_id IS NOT NULL
        AND (original.status='delivered' OR EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts first WHERE first.delivery_id=original.delivery_id AND first.part_number=1 AND first.status='delivered' AND first.discord_message_id=original.discord_message_id))))
      AND (@cutoff IS NULL OR d.created_at_utc>=@cutoff)
      AND NOT EXISTS(SELECT 1 FROM community_shared_alert_rate_limits cooldown WHERE cooldown.retry_at_utc>@now AND ((cooldown.scope='global' AND cooldown.scope_id='*') OR (cooldown.scope='channel' AND cooldown.scope_id=d.channel_id)))
      ORDER BY d.created_at_utc,d.delivery_id LIMIT @limit`).all({now:at,cutoff,limit:budget}) as Job[];
    let delivered=0,failed=0,sends=0;
    const channelChecks=new Map<string,Promise<readonly {channelId:string;name:string}[]>>();
    for(const job of jobs){
      if(sends>=budget)break;
      let inFlight:SharedAlertPartRow|null=null;
      try{
        if(this.coolingDown(job.channel_id))continue;
        const agreement=this.database.prepare("SELECT * FROM community_shared_alert_requests WHERE request_id=?").get(job.request_id) as SharedAlertRequestRow|undefined;
        if(!agreement){this.cancel(job,"The agreement is unavailable.");continue;}
        const source=repository.ownerContext(agreement.source_community_id),receiver=repository.ownerContext(agreement.receiver_community_id);
        if(!isCommunityReviewDiscordGuild(source.guildId)||!isCommunityReviewDiscordGuild(receiver.guildId))continue;
        await Promise.all([verifySharedAlertOwner(repository,discord,source),verifySharedAlertOwner(repository,discord,receiver)]);
        const publication:SharedAlertPublishingContext={authorUserId:job.author_user_id,publisherUserId:job.publisher_user_id,changeActorUserId:job.change_actor_user_id,kind:job.kind,sourceDestinationIds:JSON.parse(job.source_destination_ids_json) as string[]};
        if(this.config.preparePublication&&!await this.config.preparePublication(source.communityId,job.alert_id,publication)){this.failBeforeSend(job,"Source publisher verification is unavailable.");failed++;continue;}
        if(!channelChecks.has(receiver.guildId))channelChecks.set(receiver.guildId,discord.channels(receiver.guildId));
        if(!(await channelChecks.get(receiver.guildId)!).some(c=>c.channelId===job.channel_id)){this.failBeforeSend(job,"The receiving channel is unavailable or the bot cannot post there.");failed++;continue;}
        const original=job.original_delivery_id?this.database.prepare("SELECT discord_message_id,channel_id FROM community_shared_alert_deliveries WHERE delivery_id=? AND request_id=? AND alert_id=?").get(job.original_delivery_id,job.request_id,job.alert_id) as {discord_message_id:string|null;channel_id:string}|undefined:undefined;
        if(job.kind!=="publication"&&(!original?.discord_message_id||!/^\d{1,32}$/u.test(original.discord_message_id)||original.channel_id!==job.channel_id||!hasConfirmedSharedAlertOriginal(this.database,job.original_delivery_id!))){this.cancel(job,"Original partner post is not confirmed in this channel.");continue;}
        const contents=sharedAlertDiscordParts(this.database,{alertId:job.alert_id,title:job.title,symbol:job.symbol,body:job.body,communityName:job.source_name,showCommunityName:job.show_source_name===1,kind:job.kind,originalUrl:original?.discord_message_id?`https://discord.com/channels/${receiver.guildId}/${job.channel_id}/${original.discord_message_id}`:null});
        const parts=this.database.transaction(()=>{
          if(!this.permitted(job,publication,repository,"queue"))return null;
          if(this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='sending',last_error=NULL,retry_at_utc=NULL,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND status IN ('pending','failed')`).run(this.now(),job.delivery_id,job.content_revision).changes!==1)return null;
          return ensureSharedAlertParts(this.database,job.delivery_id,job.content_revision,contents,this.now());
        }).immediate();
        if(!parts)continue;
        for(const part of parts){
          if(part.status==="delivered")continue;
          if(sends>=budget||this.coolingDown(job.channel_id)){this.release(job);break;}
          if(part.status==="sending"||part.status==="uncertain"){this.hold(job,part,"A message part needs confirmation.");break;}
          if(part.status==="cancelled"){this.cancel(job,"Remaining message parts were stopped.");break;}
          const first=this.database.prepare("SELECT discord_message_id FROM community_shared_alert_delivery_parts WHERE delivery_id=? AND content_revision=? AND part_number=1 AND status='delivered'").get(job.delivery_id,job.content_revision) as {discord_message_id:string|null}|undefined;
          const replyId=part.part_number===1?original?.discord_message_id:first?.discord_message_id;
          if(part.part_number>1&&(!replyId||!/^\d{1,32}$/u.test(replyId))){this.hold(job,part,"The first message part is not confirmed.");break;}
          const claimed=this.database.transaction(()=>{
            if(!this.permitted(job,publication,repository,"sending"))return false;
            const stamp=this.now();
            const changed=this.database.prepare(`UPDATE community_shared_alert_delivery_parts SET status='sending',attempt_count=attempt_count+1,last_error=NULL,retry_at_utc=NULL,updated_at_utc=?
              WHERE delivery_id=? AND content_revision=? AND part_number=? AND attempt_count<5 AND (status='pending' OR (status='failed' AND retry_at_utc IS NOT NULL AND retry_at_utc<=?))`).run(stamp,job.delivery_id,job.content_revision,part.part_number,stamp).changes;
            if(changed)this.database.prepare("UPDATE community_shared_alert_deliveries SET attempt_count=max(attempt_count,?),updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND status='sending'").run(part.attempt_count+1,stamp,job.delivery_id,job.content_revision);
            return changed===1;
          }).immediate();
          if(!claimed)break;
          inFlight=part;sends++;
          let response:Response;
          if(!isCommunityReviewDiscordGuild(receiver.guildId))throw new Error("Discord destination is outside the review test server.");
          try{response=await this.request(`https://discord.com/api/v10/channels/${job.channel_id}/messages`,{
            method:"POST",headers:{Authorization:`Bot ${this.config.botToken}`,"Content-Type":"application/json"},
            body:JSON.stringify({content:part.content,allowed_mentions:{parse:[],replied_user:false},...(replyId?{message_reference:{message_id:replyId,channel_id:job.channel_id,guild_id:receiver.guildId,fail_if_not_exists:true}}:{}),nonce:part.nonce,enforce_nonce:true}),signal:AbortSignal.timeout(10000),
          });}catch{this.hold(job,part,"Discord did not confirm this message part. Check the receiving channel.");inFlight=null;failed++;break;}
          if(response.ok){
            let receipt:{id?:string;channel_id?:string};try{receipt=await response.json() as {id?:string;channel_id?:string};}catch{receipt={};}
            if(!receipt.id||!/^\d{1,32}$/u.test(receipt.id)||receipt.channel_id!==job.channel_id){this.hold(job,part,"Discord accepted a part but did not confirm its message and channel.");inFlight=null;failed++;break;}
            this.database.transaction(()=>{
              const stamp=this.now();
              this.database.prepare(`UPDATE community_shared_alert_delivery_parts SET status='delivered',discord_message_id=?,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND part_number=? AND status='sending'`).run(receipt.id,stamp,job.delivery_id,job.content_revision,part.part_number);
              // Confirmed progress releases the whole-alert failure budget; each
              // part retains its own attempt cap. Otherwise a fifth-attempt
              // success can strand later parts when this pass reaches its limit.
              this.database.prepare(`UPDATE community_shared_alert_deliveries SET attempt_count=0,
                discord_message_id=CASE WHEN ?=1 THEN coalesce(discord_message_id,?) ELSE discord_message_id END,
                updated_at_utc=? WHERE delivery_id=? AND content_revision=?`)
                .run(part.part_number,receipt.id,stamp,job.delivery_id,job.content_revision);
            }).immediate();inFlight=null;
          }else if(response.status===429){
            const rate=await sharedAlertRateLimit(response);
            const retryAt=new SharedAlertRateLimits(this.database,this.now).record(rate,job.channel_id);
            this.partFailed(job,part,"Discord requested a retry after its rate limit.",retryAt);inFlight=null;failed++;break;
          }else if(response.status>=500){this.hold(job,part,"Discord returned a server error; this part needs confirmation.");inFlight=null;failed++;break;
          }else{this.partFailed(job,part,`Discord rejected message part ${part.part_number} of ${part.total_parts} (${response.status}).`,null);inFlight=null;failed++;break;}
        }
        if(this.complete(job))delivered++;
      }catch{
        if(inFlight)this.hold(job,inFlight,"The message-part result needs confirmation.");
        else this.failBeforeSend(job,"Discord ownership, source publishing or channel verification is unavailable.");
        failed++;
      }
    }
    cancelStoppedSharedAlertParts(this.database,this.now());
    return {delivered,failed};
  }

  private permitted(job:Job,context:SharedAlertPublishingContext,repository:SharedAlertsRepository,phase:"queue"|"sending"):boolean{
    if(this.coolingDown(job.channel_id))return false;
    const current=this.database.prepare("SELECT status,title,symbol,body,content_revision,approved_content_revision,approved_by_user_id,retry_at_utc FROM community_shared_alert_deliveries WHERE delivery_id=?").get(job.delivery_id) as CurrentJob|undefined;
    if(!current||current.content_revision!==job.content_revision||current.title!==job.title||current.symbol!==job.symbol||current.body!==job.body)return false;
    if(phase==="sending"?current.status!=="sending":current.status!=="pending"&&!(current.status==="failed"&&current.retry_at_utc&&current.retry_at_utc<=this.now()))return false;
    const agreement=this.database.prepare("SELECT * FROM community_shared_alert_requests WHERE request_id=?").get(job.request_id) as SharedAlertRequestRow|undefined;
    if(!agreement||agreement.status!=="active"||agreement.source_paused||agreement.receiver_paused||agreement.terms_version!==job.terms_version||agreement.source_approved_version!==agreement.terms_version||agreement.receiver_approved_version!==agreement.terms_version||agreement.show_source_name!==job.show_source_name){this.cancel(job,"The agreement was paused, ended or changed.");return false;}
    const route=this.database.prepare(`SELECT 1 FROM community_shared_alert_routes WHERE request_id=? AND author_user_id=? AND source_offered=1 AND receiver_selected=1 AND receiver_paused=0 AND revision=? AND channel_id=? AND require_approval=?`).get(job.request_id,job.author_user_id,job.channel_revision,job.channel_id,job.requires_approval);
    if(!route||!isSharedAlertPublisher(this.database,agreement.source_community_id,job.author_user_id,this.now(),true)){this.cancel(job,"Publisher permission or receiving settings changed.");return false;}
    for(const side of ["source","receiver"] as const){const owner=repository.ownerContext(agreement[`${side}_community_id`]);if(owner.ownerUserId!==agreement[`${side}_owner_user_id`]||owner.discordUserId!==agreement[`${side}_owner_discord_id`]||!repository.ownerIsFresh(owner)){this.cancel(job,"Current owner agreement could not be verified.");return false;}}
    if(job.requires_approval&&(current.approved_content_revision!==job.content_revision||current.approved_by_user_id!==agreement.receiver_owner_user_id))return false;
    if(job.kind==="publication"&&!this.database.prepare("SELECT 1 FROM traderlink_community_alerts WHERE alert_id=? AND community_id=? AND status='published'").get(job.alert_id,agreement.source_community_id)){this.cancel(job,"The source alert is no longer published.");return false;}
    if(!this.config.canSharePublication?.(agreement.source_community_id,job.alert_id,context)){this.cancel(job,"Source publishing authorization no longer permits this delivery.");return false;}
    return true;
  }

  private reconcileInterrupted():void{
    const at=this.now(),stale=new Date(Date.parse(at)-300000).toISOString();
    this.database.prepare("UPDATE community_shared_alert_delivery_parts SET status='uncertain',last_error='The part send was interrupted; check Discord before reconciliation.',updated_at_utc=? WHERE status='sending' AND updated_at_utc<?").run(at,stale);
    this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='delivered',updated_at_utc=? WHERE status IN ('pending','failed','sending') AND discord_message_id IS NOT NULL
      AND EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=community_shared_alert_deliveries.delivery_id AND p.content_revision=community_shared_alert_deliveries.content_revision)
      AND NOT EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=community_shared_alert_deliveries.delivery_id AND p.content_revision=community_shared_alert_deliveries.content_revision AND p.status<>'delivered')`).run(at);
    this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='uncertain',last_error='A message part needs confirmation.',updated_at_utc=? WHERE status='sending'
      AND (EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=community_shared_alert_deliveries.delivery_id AND p.content_revision=community_shared_alert_deliveries.content_revision AND p.status='uncertain')
        OR (updated_at_utc<? AND NOT EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=community_shared_alert_deliveries.delivery_id AND p.content_revision=community_shared_alert_deliveries.content_revision)))`).run(at,stale);
    this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='pending',updated_at_utc=? WHERE status='sending' AND updated_at_utc<?
      AND NOT EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=community_shared_alert_deliveries.delivery_id AND p.content_revision=community_shared_alert_deliveries.content_revision AND p.status IN ('sending','uncertain'))`).run(at,stale);
  }
  private complete(job:Job):boolean{
    return this.database.prepare(`UPDATE community_shared_alert_deliveries SET status='delivered',last_error=NULL,retry_at_utc=NULL,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND status='sending'
      AND EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=? AND p.content_revision=?)
      AND NOT EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=? AND p.content_revision=? AND p.status<>'delivered')`).run(this.now(),job.delivery_id,job.content_revision,job.delivery_id,job.content_revision,job.delivery_id,job.content_revision).changes===1;
  }
  private release(job:Job):void{this.database.prepare("UPDATE community_shared_alert_deliveries SET status='pending',updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND status='sending'").run(this.now(),job.delivery_id,job.content_revision);}
  private coolingDown(channelId:string):boolean{return new SharedAlertRateLimits(this.database,this.now).current(channelId)!==null;}
  private cancel(job:Job,reason:string):void{this.database.prepare("UPDATE community_shared_alert_deliveries SET status='cancelled',last_error=?,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND status IN ('pending','failed','sending')").run(reason,this.now(),job.delivery_id,job.content_revision);cancelStoppedSharedAlertParts(this.database,this.now());}
  private failBeforeSend(job:Job,reason:string):void{this.database.prepare("UPDATE community_shared_alert_deliveries SET status='failed',attempt_count=min(5,attempt_count+1),last_error=?,retry_at_utc=?,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND status IN ('pending','failed','sending')").run(reason,new Date(Date.parse(this.now())+60000).toISOString(),this.now(),job.delivery_id,job.content_revision);}
  private hold(job:Job,part:SharedAlertPartRow,reason:string):void{this.database.transaction(()=>{
    this.database.prepare("UPDATE community_shared_alert_delivery_parts SET status='uncertain',last_error=?,retry_at_utc=NULL,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND part_number=? AND status IN ('pending','sending','failed')").run(reason,this.now(),job.delivery_id,job.content_revision,part.part_number);
    this.database.prepare("UPDATE community_shared_alert_deliveries SET status='uncertain',last_error=?,retry_at_utc=NULL,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND status IN ('pending','failed','sending')").run(reason,this.now(),job.delivery_id,job.content_revision);
  }).immediate();}
  private partFailed(job:Job,part:SharedAlertPartRow,reason:string,retryAt:string|null):void{this.database.transaction(()=>{
    this.database.prepare("UPDATE community_shared_alert_delivery_parts SET status='failed',last_error=?,retry_at_utc=?,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND part_number=? AND status='sending'").run(reason,retryAt,this.now(),job.delivery_id,job.content_revision,part.part_number);
    this.database.prepare("UPDATE community_shared_alert_deliveries SET status='failed',last_error=?,retry_at_utc=?,updated_at_utc=? WHERE delivery_id=? AND content_revision=? AND status='sending'").run(reason,retryAt,this.now(),job.delivery_id,job.content_revision);
  }).immediate();}
}
