import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";
import "server-only";
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { withPlatformDatabase, openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { requestWatchlistRuntimeRaw } from "../runtime/watchlist-runtime-admin-client";
import { watchlistNotificationAccess } from "./watchlist-notification-runtime";
import { WatchlistPublicationNotificationStore } from "./watchlist-publication-notification-store";
import { sendWatchlistNotification } from "./watchlist-notification-delivery";

type Recipient={userId:string;channel:"web_push"|"email";targetRef:string};
type Intent={operation_id:string;ticker:string;destination_group:string;actor:string;recipients_json:string;expires_at_utc:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function categoryMoveNotificationCopy(ticker:string,group:string){
 const labels:Record<string,string>={main:"Main Session",top_regular:"Top Regular Hour Watches",postmarket:"Post-Market",general:"General Watchlist",swings:"Swings"};
 const label=/^top_watches:\d{4}-\d{2}-\d{2}$/.test(group)?"Overnight Watches":labels[group];
 if(!label||!/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(ticker))throw Error("Invalid category move.");
 const title=`${ticker} added to ${label} by "This Guy"`;
 const body=label==="Overnight Watches"?`See the analysis for potential setups and levels to watch.`:`${ticker} has moved to ${label}. View the ticker page for available analysis, notes and levels.`;
 return {pushTitle:title,emailTitle:title,pushBody:body,emailBody:body,destinationPath:`/watchlist/${ticker}`,emailTickerLabel:`View ${ticker}`,emailWatchlistLabel:"View Watchlist",emailWatchlistPath:"/watchlist"} as const;
}
/** Owner proxy snapshots current recipients before dispatch. Duplicate clicks keep the same set. */
export function recordCategoryMoveIntent(body:string,actor:string){
 const input=JSON.parse(body);if(input.notify!==true || input.to==='private' || (typeof input.symbol==='string' && isPrivateWatchlistTicker(input.symbol)))return;
 if(!uuid.test(input.id)||typeof input.symbol!=="string"||typeof input.to!=="string")throw Error("Invalid move request.");
 const ticker=input.symbol.trim().toUpperCase();categoryMoveNotificationCopy(ticker,input.to);
 withPlatformDatabase({mode:"runtime"},db=>db.transaction(()=>{
  const old=db.prepare<[string],{ticker:string;destination_group:string;actor:string}>("SELECT ticker,destination_group,actor FROM platform_watchlist_category_move_intents WHERE operation_id=?").get(input.id);
  if(old){if(old.ticker!==ticker||old.destination_group!==input.to||old.actor!==actor)throw Error("Move identity changed.");return;}
  const recipients:Recipient[]=[];
  for(const user of db.prepare<[],{user_id:string;web_push_enabled:number;email_enabled:number}>("SELECT user_id,web_push_enabled,email_enabled FROM platform_watchlist_notification_preferences WHERE web_push_enabled=1 OR email_enabled=1").all()){
   if(!watchlistNotificationAccess(db,user.user_id))continue;
   if(user.web_push_enabled)for(const target of db.prepare<[string],{id:string}>("SELECT subscription_id id FROM platform_web_push_subscriptions WHERE user_id=? AND state='active'").all(user.user_id))recipients.push({userId:user.user_id,channel:"web_push",targetRef:target.id});
   if(user.email_enabled){const target=db.prepare<[string],{id:string}>("SELECT email_address_id id FROM platform_notification_email_addresses WHERE user_id=? AND state='confirmed' ORDER BY updated_at_utc DESC LIMIT 1").get(user.user_id);if(target)recipients.push({userId:user.user_id,channel:"email",targetRef:target.id});}
  }
  const now=new Date();db.prepare("INSERT INTO platform_watchlist_category_move_intents VALUES(?,?,?,?,?,?,?,?, 'pending')").run(input.id,ticker,input.to,actor,JSON.stringify(recipients),now.toISOString(),new Date(now.getTime()+3600000).toISOString(),now.toISOString());
 }).immediate());
}
let running=false;
export async function runCategoryMoveNotifications(){
 if(running)return;running=true;let db:Database.Database|undefined;
 try{
  db=openPlatformDatabase({mode:"runtime"});const now=new Date().toISOString();
  db.prepare("UPDATE platform_watchlist_category_move_intents SET state='expired' WHERE state='pending' AND expires_at_utc<=?").run(now);
  for(const row of db.prepare<[string],Intent>("SELECT * FROM platform_watchlist_category_move_intents WHERE state='pending' AND next_check_at_utc<=? ORDER BY requested_at_utc LIMIT 3").all(now)){
   db.prepare("UPDATE platform_watchlist_category_move_intents SET next_check_at_utc=? WHERE operation_id=?").run(new Date(Date.now()+30000).toISOString(),row.operation_id);
   const response=await requestWatchlistRuntimeRaw({method:"GET",reviewActor:row.actor,timeoutMs:8000,path:`/api/watchlist/analysis-review/category-move?symbol=${encodeURIComponent(row.ticker)}`});if(!response.ok)continue;
   const result=JSON.parse(response.body) as {moves?:{id:string;symbol:string;to:string;notify:boolean;published:boolean;placement:string;destination:string;notification:string;current:boolean}[]};
   const move=result.moves?.find(move=>move.id===row.operation_id&&move.symbol===row.ticker&&move.to===row.destination_group);
   if(!move)continue;
   if(!move.current||!move.published||move.destination==='skipped'){db.prepare("UPDATE platform_watchlist_category_move_intents SET state='cancelled' WHERE operation_id=?").run(row.operation_id);continue;}
   if(!move.notify||move.placement!=='complete'||move.destination!=='confirmed'||move.notification!=='confirmed')continue;
   db.transaction(()=>{
    for(const recipient of JSON.parse(row.recipients_json) as Recipient[])db!.prepare("INSERT OR IGNORE INTO platform_watchlist_category_move_deliveries(delivery_id,operation_id,user_id,channel,target_ref,state,available_at_utc) VALUES(?,?,?,?,?,'pending',?)").run(randomUUID(),row.operation_id,recipient.userId,recipient.channel,recipient.targetRef,new Date().toISOString());
    db!.prepare("UPDATE platform_watchlist_category_move_intents SET state='accepted' WHERE operation_id=?").run(row.operation_id);
   }).immediate();
  }
  db.prepare("UPDATE platform_watchlist_category_move_deliveries SET state='pending' WHERE state='sending' AND last_attempt_at_utc<=? AND attempt_count<5").run(new Date(Date.now()-60000).toISOString());
  db.prepare("UPDATE platform_watchlist_category_move_deliveries SET state='failed' WHERE state='sending' AND last_attempt_at_utc<=? AND attempt_count>=5").run(new Date(Date.now()-60000).toISOString());
  type Delivery={delivery_id:string;operation_id:string;user_id:string;channel:"web_push"|"email";target_ref:string;attempt_count:number;ticker:string;destination_group:string;expires_at_utc:string;actor:string};
  const currentMoves=new Map<string,boolean>();
  for(const row of db.prepare<[string],Delivery>(`SELECT d.*,i.ticker,i.destination_group,i.expires_at_utc,i.actor FROM platform_watchlist_category_move_deliveries d JOIN platform_watchlist_category_move_intents i USING(operation_id) WHERE d.state='pending' AND d.available_at_utc<=? ORDER BY d.available_at_utc LIMIT 5`).all(new Date().toISOString())){
   if(!currentMoves.has(row.operation_id)){
    const response=await requestWatchlistRuntimeRaw({method:'GET',reviewActor:row.actor,timeoutMs:8000,path:'/api/watchlist/analysis-review/category-move?symbol='+encodeURIComponent(row.ticker)});
    if(!response.ok)continue;
    const status=JSON.parse(response.body) as {moves?:{id:string;current:boolean}[]};currentMoves.set(row.operation_id,status.moves?.some(move=>move.id===row.operation_id&&move.current)===true);
   }
   const prefs=new WatchlistPublicationNotificationStore(db).readPreferences(row.user_id);
   const visible=db.prepare<[string],{n:number}>("SELECT count(*) n FROM live_watchlist_symbols WHERE symbol=? AND status<>'deactivated' AND COALESCE(json_extract(state_json,'$.watchlistGroup'),'main')<>'private'").get(row.ticker)?.n;
   const state=row.expires_at_utc<=now?'expired':!(row.channel==='email'?prefs.emailEnabled:prefs.webPushEnabled)?'opted_out':!currentMoves.get(row.operation_id)||!visible||!watchlistNotificationAccess(db,row.user_id)?'inaccessible':'sending';
   db.prepare("UPDATE platform_watchlist_category_move_deliveries SET state=?,last_attempt_at_utc=?,attempt_count=attempt_count+? WHERE delivery_id=? AND state='pending'").run(state,new Date().toISOString(),state==='sending'?1:0,row.delivery_id);
   if(state!=='sending')continue;
   let result;try{result=await sendWatchlistNotification(db,{...row,event_id:row.operation_id,notification_kind:'listing',owner_approved:1,analysis_update_context_json:null},categoryMoveNotificationCopy(row.ticker,row.destination_group));}catch{result={sent:false,retry:true,code:'provider_unavailable'};}
   const retry=result.retry&&row.attempt_count+1<5;db.prepare("UPDATE platform_watchlist_category_move_deliveries SET state=?,available_at_utc=?,delivered_at_utc=?,failure_code=? WHERE delivery_id=? AND state='sending'").run(result.sent?'delivered':retry?'pending':'failed',new Date(Date.now()+Math.min(900000,30000*2**row.attempt_count)).toISOString(),result.sent?new Date().toISOString():null,result.sent?null:result.code,row.delivery_id);
  }
 }finally{db?.close();running=false;}
}
