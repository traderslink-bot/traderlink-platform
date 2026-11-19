// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { watchlistTraderNotesNotificationsMigration } from "@/src/modules/platform/server/database/migrations/0220_watchlist_trader_notes_notifications";
const prefs=vi.hoisted(()=>({webPushEnabled:true,emailEnabled:true}));
vi.mock("./watchlist-notification-runtime",()=>({watchlistNotificationAccess:()=>true}));
vi.mock("./watchlist-publication-notification-store",()=>({WatchlistPublicationNotificationStore:class {readPreferences(){return prefs;}}}));
vi.mock("./watchlist-notification-delivery",()=>({sendWatchlistNotification:()=>{throw Error('Use fake sender');}}));
vi.mock("../runtime/watchlist-runtime-admin-client",()=>({requestWatchlistRuntimeRaw:()=>{throw Error('Use fake runtime');}}));
vi.mock("./watchlist-notification-candidates",()=>({readWatchlistNotificationCandidates:()=>[]}));
vi.mock("../access/watchlist-plan-policy",()=>({canNotifyWatchlistTicker:()=>true}));
import { eraseWatchlistNotesUserCopies } from "./watchlist-notes-privacy";
import { recordNotesNotificationIntent, runNotesNotifications, notesNotificationCopy } from "./watchlist-notes-notifications";
let db:Database.Database;
let now:number;
const id='10000000-0000-4000-8000-000000000001',user='20000000-0000-4000-8000-000000000002';
const input={id,symbol:'TEST',cycleId:'cycle',text:'Updated notes',publish:true,notifyUsers:true};
const actor='platform-owner:'+user;
const capture=()=>[{userId:user,channel:'email' as const,targetRef:user},{userId:user,channel:'web_push' as const,targetRef:user}];
const hash=createHash('sha256').update(input.text).digest('hex');
const publication=()=>({id,symbol:'TEST',cycleId:'cycle',textHash:hash,published:true,publishedAt:now,notify:true,current:true,discord:'pending'});
beforeEach(()=>{now=Date.parse('2026-11-18T18:00:00Z');Object.assign(prefs,{webPushEnabled:true,emailEnabled:true});db=new Database(':memory:');db.pragma('foreign_keys=ON');db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY); CREATE TABLE live_watchlist_symbols(symbol TEXT PRIMARY KEY,status TEXT,state_json TEXT);`);db.prepare('INSERT INTO platform_users VALUES(?)').run(user);for(const sql of watchlistTraderNotesNotificationsMigration.statements)db.exec(sql);db.prepare('INSERT INTO live_watchlist_symbols VALUES(?,?,?)').run('TEST','live',JSON.stringify({watchlistGroup:'main',cards:{traderNotes:{body:input.text}}}));});
afterEach(()=>db.close());
function queue(value=input){recordNotesNotificationIntent(db,value,actor,new Date(now),capture);}
function runner(value:{id:string;symbol:string;cycleId:string;textHash:string;published:boolean;publishedAt:number;notify:boolean;current:boolean;discord:string;retryAt?:number}=publication(),sent=vi.fn(async()=>({sent:true,retry:false,code:'sent'}))) {
 const runtime=vi.fn(async(options:{method:string})=>({ok:true,status:200,contentType:'application/json',body:JSON.stringify({notesPublication:{...value,discord:options.method==='POST'?'sent':value.discord}})}));
 const access=vi.fn(()=>true),permitted=vi.fn(()=>true);
 return {sent,runtime,access,permitted,run:()=>runNotesNotifications({database:db,runtime:runtime as never,sender:sent,access,permitted,now:()=>new Date(now)})};
}
describe('standalone Trader Notes notification outbox',()=>{
 it('default-off, draft and empty publications enqueue nothing',()=>{queue({...input,notifyUsers:false});queue({...input,publish:false});queue({...input,text:'  '});expect(db.prepare('SELECT count(*) n FROM platform_watchlist_notes_notifications').get()).toEqual({n:0});});
 it('snapshots recipients once, deduplicates retries and binds content/cycle/actor',()=>{const recipients=vi.fn(capture);recordNotesNotificationIntent(db,input,actor,new Date(now),recipients);recordNotesNotificationIntent(db,input,actor,new Date(now),recipients);expect(recipients).toHaveBeenCalledTimes(1);expect(()=>recordNotesNotificationIntent(db,{...input,text:'different'},actor,new Date(now),recipients)).toThrow();expect(()=>recordNotesNotificationIntent(db,{...input,cycleId:'other'},actor,new Date(now),recipients)).toThrow();});
 it('waits for the website receipt, then sends separate text-only alerts exactly once',async()=>{queue();const pending=runner({...publication(),published:false});await pending.run();expect(pending.sent).not.toHaveBeenCalled();expect(pending.runtime.mock.calls.every(([call])=>call.method==='GET')).toBe(true);
 expect(db.prepare('SELECT state FROM platform_watchlist_notes_notifications').get()).toEqual({state:'pending'});now+=31000;const f=runner();await f.run();expect(f.sent).toHaveBeenCalledTimes(2);expect(f.runtime.mock.calls.filter(([call])=>call.method==='POST')).toHaveLength(1);now+=31000;await f.run();expect(f.sent).toHaveBeenCalledTimes(2);expect(db.prepare('SELECT state FROM platform_watchlist_notes_deliveries').all()).toEqual([{state:'delivered'},{state:'delivered'}]);expect(f.permitted).toHaveBeenCalled();expect(notesNotificationCopy('TEST').pushTitle).toContain('Trader notes updated');});
 it.each(['private','removed','replaced','cycle'])('cancels stale %s alerts before delivery',async(reason)=>{queue();let value=publication();if(reason==='private')db.prepare('UPDATE live_watchlist_symbols SET state_json=?').run(JSON.stringify({watchlistGroup:'private',cards:{traderNotes:{body:input.text}}}));if(reason==='removed')db.exec('DELETE FROM live_watchlist_symbols');if(reason==='replaced')db.prepare('UPDATE live_watchlist_symbols SET state_json=?').run(JSON.stringify({cards:{traderNotes:{body:'new'}}}));if(reason==='cycle')value={...value,cycleId:'other'};const f=runner(value);await f.run();expect(f.sent).not.toHaveBeenCalled();expect(f.runtime.mock.calls.every(([call])=>call.method==='GET')).toBe(true);});
 it('checks current notification opt-outs and recipient access again at send time',async()=>{queue();prefs.emailEnabled=false;const f=runner();f.access.mockReturnValue(false);await f.run();expect(f.sent).not.toHaveBeenCalled();});
 it('does not replay uncertain Discord sends and keeps email/push independent',async()=>{queue();const f=runner({...publication(),discord:'uncertain'});await f.run();expect(f.runtime.mock.calls.every(([call])=>call.method==='GET')).toBe(true);expect(f.sent).toHaveBeenCalledTimes(2);});
 it('expires old notes alerts without affecting saved notes',async()=>{queue();now+=3600001;const f=runner();await f.run();expect(f.runtime).not.toHaveBeenCalled();expect(f.sent).not.toHaveBeenCalled();expect(db.prepare('SELECT state FROM platform_watchlist_notes_notifications').get()).toEqual({state:'expired'});expect(db.prepare('SELECT count(*) n FROM live_watchlist_symbols').get()).toEqual({n:1});});
 it('keeps retryable member delivery bounded without resending successful channels',async()=>{queue();const sender=vi.fn().mockResolvedValueOnce({sent:false,retry:true,code:'provider_unavailable'}).mockResolvedValue({sent:true,retry:false,code:'sent'});const f=runner(publication(),sender);await f.run();expect(sender).toHaveBeenCalledTimes(2);now+=31000;await f.run();expect(sender).toHaveBeenCalledTimes(3);});
 it('recovers a lost Discord acknowledgement by reading its receipt without another send',async()=>{
  queue();let discord='pending',posts=0;
  const runtime=vi.fn(async(options:{method:string})=>{if(options.method==='POST'){posts++;discord='sent';return{ok:false,status:503,body:'synthetic lost acknowledgement',contentType:'text/plain'};}return{ok:true,status:200,contentType:'application/json',body:JSON.stringify({notesPublication:{...publication(),discord}})};});
  const sender=vi.fn(async()=>({sent:true,retry:false,code:'sent'}));
  const run=()=>runNotesNotifications({database:db,runtime:runtime as never,sender,access:()=>true,permitted:()=>true,now:()=>new Date(now)});
  await run();now+=31000;await run();expect(posts).toBe(1);expect(sender).toHaveBeenCalledTimes(2);expect(db.prepare('SELECT discord_state FROM platform_watchlist_notes_notifications').get()).toEqual({discord_state:'sent'});
 });
 it('does not request another Discord send during a recorded cooldown',async()=>{
  queue();const f=runner({...publication(),discord:'retry',retryAt:now+120000});await f.run();expect(f.runtime.mock.calls.every(([call])=>call.method==='GET')).toBe(true);expect(f.sent).toHaveBeenCalledTimes(2);
 });
 it('requires a real operation ID when notifications are requested',()=>{expect(()=>queue({...input,id:'bad'})).toThrow();expect(notesNotificationCopy('TEST').destinationPath).toBe('/watchlist/TEST');});
 it('does not recreate an intent cancelled by whole-user erasure during awaited Runtime preflight',async()=>{
  queue();let erased=false;
  const runtime=vi.fn(async()=>{if(!erased){db.transaction(()=>eraseWatchlistNotesUserCopies(db,user))();erased=true;}return {ok:true,status:200,body:JSON.stringify({notesPublication:publication()})};});
  const sender=vi.fn();await runNotesNotifications({database:db,runtime:runtime as never,sender,access:()=>true,permitted:()=>true,now:()=>new Date(now)});
  expect(sender).not.toHaveBeenCalled();expect(runtime).toHaveBeenCalledTimes(1);
  expect(db.prepare('SELECT state,actor FROM platform_watchlist_notes_notifications').get()).toEqual({state:'cancelled',actor:'erased-owner'});
  expect(db.prepare('SELECT COUNT(*) n FROM platform_watchlist_notes_deliveries').get()).toEqual({n:0});
 });
 it('does not call sender after recipient erasure deletes its pending row during awaited preflight',async()=>{
  queue();db.prepare("UPDATE platform_watchlist_notes_notifications SET actor='platform-owner:other'").run();let gets=0;
  const runtime=vi.fn(async(call:{method:string})=>{if(call.method==='GET'&&++gets===2){db.transaction(()=>{eraseWatchlistNotesUserCopies(db,user);db.prepare('DELETE FROM platform_users WHERE user_id=?').run(user);})();}return {ok:true,status:200,body:JSON.stringify({notesPublication:{...publication(),discord:call.method==='POST'?'sent':'pending'}})};});
  const sender=vi.fn();await runNotesNotifications({database:db,runtime:runtime as never,sender,access:()=>true,permitted:()=>true,now:()=>new Date(now)});
  expect(sender).not.toHaveBeenCalled();expect(db.prepare('SELECT COUNT(*) n FROM platform_watchlist_notes_deliveries').get()).toEqual({n:0});
 });
 it('persists sending before Discord POST, holds erasure and keeps lost acknowledgement sticky until receipt readback',async()=>{
  queue();let posts=0;
  const runtime=vi.fn(async(call:{method:string})=>{if(call.method==='POST'){posts++;expect(db.prepare('SELECT discord_state,discord_attempts FROM platform_watchlist_notes_notifications').get()).toEqual({discord_state:'sending',discord_attempts:1});expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,user))()).toThrow('notes_erasure_delivery_unresolved');throw Error('synthetic lost transport');}return {ok:true,status:200,body:JSON.stringify({notesPublication:publication()})};});
  const sender=vi.fn(async()=>({sent:true,retry:false,code:'sent'}));const run=()=>runNotesNotifications({database:db,runtime:runtime as never,sender,access:()=>true,permitted:()=>true,now:()=>new Date(now)});
  await run();now+=61000;await run();expect(posts).toBe(1);expect(db.prepare('SELECT discord_state FROM platform_watchlist_notes_notifications').get()).toEqual({discord_state:'uncertain'});
  expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,user))()).toThrow('notes_erasure_delivery_unresolved');
 });
 it('does not reset a thrown member send after 60s or treat expiry as settlement',async()=>{
  queue();const sender=vi.fn(async()=>{expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,user))()).toThrow('notes_erasure_delivery_unresolved');throw Error('unknown provider outcome');});const f=runner(publication(),sender);
  await f.run();const count=sender.mock.calls.length;now+=61000;await f.run();now+=3600001;await f.run();expect(sender).toHaveBeenCalledTimes(count);
  expect(db.prepare("SELECT COUNT(*) n FROM platform_watchlist_notes_deliveries WHERE state='sending'").get()).toEqual({n:2});
  expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,user))()).toThrow('notes_erasure_delivery_unresolved');
 });

 it('keeps structured unknown transport outcomes fenced while known retryable rejection remains retryable',async()=>{
  queue();const sender=vi.fn(async()=>({sent:false,retry:true,code:'provider_unavailable',uncertain:true}));const f=runner(publication(),sender);
  await f.run();now+=61000;await f.run();expect(sender).toHaveBeenCalledTimes(2);
  expect(db.prepare("SELECT COUNT(*) n FROM platform_watchlist_notes_deliveries WHERE state='sending' AND failure_code='delivery_uncertain'").get()).toEqual({n:2});
 });

});
