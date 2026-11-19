import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { openPlatformDatabase, withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { requestWatchlistRuntimeRaw } from "../runtime/watchlist-runtime-admin-client";
import { readWatchlistNotificationCandidates } from "./watchlist-notification-candidates";
import { watchlistNotificationAccess } from "./watchlist-notification-runtime";
import { WatchlistPublicationNotificationStore } from "./watchlist-publication-notification-store";
import { canNotifyWatchlistTicker } from "../access/watchlist-plan-policy";
import { sendWatchlistNotification } from "./watchlist-notification-delivery";

type Recipient = { userId: string; channel: "web_push" | "email"; targetRef: string };
type Intent = { request_id: string; ticker: string; cycle_id: string; actor: string; text_hash: string; recipients_json: string; expires_at_utc: string; discord_state: string; discord_attempts: number };
type Publication = { id: string; symbol: string; cycleId: string; textHash: string; published: boolean; publishedAt: number; notify: boolean; current: boolean; discord: string; retryAt?: number };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ticker = /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/;
const digest = (text: string) => createHash("sha256").update(text).digest("hex");
export function notesNotificationCopy(symbol: string) {
  if (!ticker.test(symbol)) throw Error("Invalid notes request.");
  const title = `${symbol} Trader notes updated by "This Guy"`, body = "Read the updated Trader Notes on the ticker page.";
  return {pushTitle:title,emailTitle:title,pushBody:body,emailBody:body,destinationPath:`/watchlist/${symbol}`,emailTickerLabel:`View ${symbol}`,emailWatchlistLabel:"View Watchlist",emailWatchlistPath:"/watchlist"} as const;
}
function recipients(db: Database.Database): Recipient[] {
  const result: Recipient[] = [];
  for (const user of readWatchlistNotificationCandidates(db)) {
    if (!watchlistNotificationAccess(db,user.user_id)) continue;
    if (user.web_push_enabled) for (const target of db.prepare<[string],{id:string}>("SELECT subscription_id id FROM platform_web_push_subscriptions WHERE user_id=? AND state='active'").all(user.user_id)) result.push({userId:user.user_id,channel:"web_push",targetRef:target.id});
    if (user.email_enabled) { const target=db.prepare<[string],{id:string}>("SELECT email_address_id id FROM platform_notification_email_addresses WHERE user_id=? AND state='confirmed' ORDER BY updated_at_utc DESC LIMIT 1").get(user.user_id); if(target) result.push({userId:user.user_id,channel:"email",targetRef:target.id}); }
  }
  return result;
}
export function recordNotesNotificationIntent(db: Database.Database, input: {id?:unknown;symbol?:unknown;cycleId?:unknown;text?:unknown;publish?:unknown;notifyUsers?:unknown}, actor: string, now = new Date(), capture = recipients) {
  if (input.notifyUsers !== true || input.publish !== true || typeof input.text !== "string" || !input.text.trim()) return;
  if (typeof input.id !== "string" || !uuid.test(input.id) || typeof input.symbol !== "string" || !ticker.test(input.symbol) || typeof input.cycleId !== "string" || !input.cycleId || input.cycleId.length>200 || input.text.length>12000) throw Error("Invalid notes request.");
  const id=input.id,symbol=input.symbol,cycle=input.cycleId,hash=digest(input.text);
  db.transaction(()=>{
    const old=db.prepare<[string],Intent>("SELECT * FROM platform_watchlist_notes_notifications WHERE request_id=?").get(id);
    if(old){if(old.ticker!==symbol||old.cycle_id!==cycle||old.actor!==actor||old.text_hash!==hash)throw Error("Notes notification request changed.");return;}
    db.prepare(`INSERT INTO platform_watchlist_notes_notifications(request_id,ticker,cycle_id,actor,text_hash,recipients_json,requested_at_utc,expires_at_utc,next_check_at_utc,state,discord_state)
      VALUES(?,?,?,?,?,?,?,?,?,'pending','pending')`).run(id,symbol,cycle,actor,hash,JSON.stringify(capture(db)),now.toISOString(),new Date(now.getTime()+3600000).toISOString(),now.toISOString());
  }).immediate();
}
export function prepareNotesNotification(body: string, actor: string) {
  const input=JSON.parse(body); if(!input || input.notifyUsers!==true || input.publish!==true)return;
  withPlatformDatabase({mode:"runtime"},db=>recordNotesNotificationIntent(db,input,actor));
}
function visibleNotes(db: Database.Database, row: Intent) {
  const item=db.prepare<[string],{state_json:string;status:string}>("SELECT state_json,status FROM live_watchlist_symbols WHERE symbol=?").get(row.ticker);
  if(!item || item.status==='deactivated')return false;
  const state=JSON.parse(item.state_json);
  return state.watchlistGroup!=='private' && typeof state.cards?.traderNotes?.body==='string' && digest(state.cards.traderNotes.body)===row.text_hash;
}
function matches(row: Intent, value: Publication | null | undefined): value is Publication {
  return Boolean(value && value.id===row.request_id && value.symbol===row.ticker && value.cycleId===row.cycle_id && value.textHash===row.text_hash && value.notify===true && value.published===true && value.current===true);
}
function currentIntent(db:Database.Database,row:Intent,now:number):Intent|null {
 const current=db.prepare<[string],Intent & {state:string}>('SELECT * FROM platform_watchlist_notes_notifications WHERE request_id=?').get(row.request_id);
 return current && ['pending','accepted'].includes(current.state) && current.actor===row.actor && current.cycle_id===row.cycle_id && current.text_hash===row.text_hash && current.expires_at_utc>new Date(now).toISOString() ? current : null;
}
let running=false;
export async function runNotesNotifications(options: {
  database?:Database.Database; runtime?:typeof requestWatchlistRuntimeRaw;
  sender?:typeof sendWatchlistNotification; access?:typeof watchlistNotificationAccess; permitted?:typeof canNotifyWatchlistTicker; now?:()=>Date;
} = {}) {
  if(running)return;running=true;
  let db:Database.Database;
  try {db=options.database ?? openPlatformDatabase({mode:"runtime"});}catch(error){running=false;throw error;}
  const runtime=options.runtime??requestWatchlistRuntimeRaw,sender=options.sender??sendWatchlistNotification;
  const access=options.access??watchlistNotificationAccess,permitted=options.permitted??canNotifyWatchlistTicker,clock=options.now??(()=>new Date());
  try {
    const now=clock().toISOString();
    db.prepare("UPDATE platform_watchlist_notes_notifications SET state='expired' WHERE state IN ('pending','accepted') AND expires_at_utc<=?").run(now);
    for(const row of db.prepare<[string],Intent>("SELECT * FROM platform_watchlist_notes_notifications WHERE state IN ('pending','accepted') AND next_check_at_utc<=? AND (state='pending' OR discord_state IN ('pending','retry','sending','uncertain')) ORDER BY requested_at_utc LIMIT 3").all(now)) {
      db.prepare("UPDATE platform_watchlist_notes_notifications SET next_check_at_utc=? WHERE request_id=?").run(new Date(clock().getTime()+30000).toISOString(),row.request_id);
      const response=await runtime({method:"GET",reviewActor:row.actor,path:`/api/watchlist/analysis-review/notes-notification?symbol=${row.ticker}&id=${row.request_id}`,timeoutMs:8000});
      if(!response.ok || !currentIntent(db,row,clock().getTime()))continue;
      const publication=(JSON.parse(response.body) as {notesPublication?:Publication|null}).notesPublication;
      if(!publication)continue;
      if(publication.id===row.request_id && publication.cycleId===row.cycle_id && publication.textHash===row.text_hash && publication.published===false)continue;
      if(!matches(row,publication)||!visibleNotes(db,row)){db.prepare("UPDATE platform_watchlist_notes_notifications SET state='cancelled' WHERE request_id=?").run(row.request_id);continue;}
      const accepted=db.transaction(()=>{
        const fresh=currentIntent(db,row,clock().getTime());if(!fresh)return false;
        for(const recipient of JSON.parse(fresh.recipients_json) as Recipient[]) {
          if(!access(db,recipient.userId)||!permitted(db,recipient.userId,row.ticker,'listing'))continue;
          db.prepare(`INSERT OR IGNORE INTO platform_watchlist_notes_deliveries(delivery_id,request_id,user_id,channel,target_ref,state,available_at_utc) VALUES(?,?,?,?,?,'pending',?)`).run(randomUUID(),row.request_id,recipient.userId,recipient.channel,recipient.targetRef,now);
        }
        db.prepare("UPDATE platform_watchlist_notes_notifications SET state='accepted' WHERE request_id=?").run(row.request_id);
        return true;
      }).immediate();
      if(!accepted)continue;
      let status=publication;
      const fresh=currentIntent(db,row,clock().getTime());if(!fresh)continue;
      let uncertain=['sending','uncertain'].includes(fresh.discord_state);
      if(!uncertain && ['pending','retry'].includes(publication.discord) && fresh.discord_attempts<5 && (publication.retryAt??0)<=clock().getTime()) {
        const claim=db.prepare(`UPDATE platform_watchlist_notes_notifications SET discord_state='sending',discord_attempts=discord_attempts+1
          WHERE request_id=? AND actor=? AND state='accepted' AND discord_state IN ('pending','retry') AND discord_attempts=?`).run(row.request_id,row.actor,fresh.discord_attempts);
        if(claim.changes!==1)continue;
        uncertain=true;
        try {
          const sent=await runtime({method:"POST",reviewActor:row.actor,path:"/api/watchlist/analysis-review/notes-notification",body:JSON.stringify({symbol:row.ticker,id:row.request_id}),contentType:"application/json",timeoutMs:12000});
          if(sent.ok){const confirmed=(JSON.parse(sent.body) as {notesPublication:Publication}).notesPublication;if(matches(row,confirmed)){status=confirmed;uncertain=!['sent','failed','retry','cancelled','skipped'].includes(confirmed.discord);}}
        }catch{/* A thrown/lost acknowledgement never permits another send. */}
      }
      if(status && matches(row,status)){
        const next=uncertain && !['sent','failed','cancelled','skipped'].includes(status.discord)?'uncertain':status.discord==='sending'?'uncertain':status.discord;
        db.prepare("UPDATE platform_watchlist_notes_notifications SET discord_state=?,next_check_at_utc=? WHERE request_id=? AND actor=? AND state='accepted'").run(next,new Date(Math.max(clock().getTime()+30000,status.retryAt??0)).toISOString(),row.request_id,row.actor);
      }
    }
    // Sending is an unresolved original, not a lease that expires after 60s.

    type Delivery={delivery_id:string;request_id:string;user_id:string;channel:'web_push'|'email';target_ref:string;attempt_count:number;ticker:string;cycle_id:string;actor:string;text_hash:string;expires_at_utc:string;recipients_json:string;discord_state:string;discord_attempts:number;intent_state:string};
    const checked=new Map<string,boolean>();
    for(const row of db.prepare<[string],Delivery>(`SELECT d.*,n.ticker,n.cycle_id,n.actor,n.text_hash,n.expires_at_utc,n.recipients_json,n.discord_state,n.discord_attempts,n.state intent_state FROM platform_watchlist_notes_deliveries d JOIN platform_watchlist_notes_notifications n USING(request_id) WHERE d.state='pending' AND d.available_at_utc<=? ORDER BY d.available_at_utc LIMIT 5`).all(clock().toISOString())) {
      if(!checked.has(row.request_id)) {
        const response=await runtime({method:'GET',reviewActor:row.actor,path:`/api/watchlist/analysis-review/notes-notification?symbol=${row.ticker}&id=${row.request_id}`,timeoutMs:8000});
        if(!response.ok)continue;
        checked.set(row.request_id,matches(row,JSON.parse(response.body).notesPublication));
      }
      if(!currentIntent(db,row,clock().getTime()))continue;
      const prefs=new WatchlistPublicationNotificationStore(db).readPreferences(row.user_id);
      const state=row.expires_at_utc<=clock().toISOString()?'expired':!(row.channel==='email'?prefs.emailEnabled:prefs.webPushEnabled)?'opted_out':row.intent_state!=='accepted'||!checked.get(row.request_id)||!visibleNotes(db,row)||!access(db,row.user_id)||!permitted(db,row.user_id,row.ticker,'listing')?'inaccessible':'sending';
      const claim=db.prepare(`UPDATE platform_watchlist_notes_deliveries SET state=?,last_attempt_at_utc=?,attempt_count=attempt_count+? WHERE delivery_id=? AND state='pending'
        AND EXISTS(SELECT 1 FROM platform_watchlist_notes_notifications n WHERE n.request_id=platform_watchlist_notes_deliveries.request_id AND n.actor=? AND n.state='accepted')`).run(state,clock().toISOString(),state==='sending'?1:0,row.delivery_id,row.actor);
      if(state!=='sending'||claim.changes!==1)continue;
      let result;try{result=await sender(db,{...row,event_id:'notes:'+row.request_id,notification_kind:'listing',owner_approved:1,analysis_update_context_json:null},notesNotificationCopy(row.ticker));}catch{db.prepare("UPDATE platform_watchlist_notes_deliveries SET failure_code='delivery_uncertain' WHERE delivery_id=? AND state='sending'").run(row.delivery_id);continue;}
      if(result.uncertain){db.prepare("UPDATE platform_watchlist_notes_deliveries SET failure_code='delivery_uncertain' WHERE delivery_id=? AND state='sending'").run(row.delivery_id);continue;}
      const retry=result.retry && row.attempt_count+1<5;
      db.prepare("UPDATE platform_watchlist_notes_deliveries SET state=?,available_at_utc=?,failure_code=? WHERE delivery_id=? AND state='sending'").run(result.sent?'delivered':retry?'pending':'failed',new Date(clock().getTime()+Math.min(900000,Math.max(result.delayMs??0,30000*2**row.attempt_count))).toISOString(),result.sent?null:result.code,row.delivery_id);
    }
  } finally {if(!options.database)db.close();running=false;}
}
