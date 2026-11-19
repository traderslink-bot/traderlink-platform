// @vitest-environment node
import {it,expect} from 'vitest';
import Database from 'better-sqlite3';
import {watchlistTraderNotesNotificationsMigration} from '@/src/modules/platform/server/database/migrations/0220_watchlist_trader_notes_notifications';
import {eraseWatchlistNotesUserCopies} from './watchlist-notes-privacy';
function fixture(){const db=new Database(':memory:');db.pragma('foreign_keys=ON');db.exec("CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);INSERT INTO platform_users VALUES('first'),('second');");for(const sql of watchlistTraderNotesNotificationsMigration.statements)db.exec(sql);return db;}
function add(db:Database.Database,id:string,actor:string,state='pending',discord='pending'){
 const recipients=[{userId:'first',channel:'email',targetRef:'first-address'},{userId:'second',channel:'web_push',targetRef:'second-device'}];
 db.prepare('INSERT INTO platform_watchlist_notes_notifications VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,'TEST','cycle',actor,'hash',JSON.stringify(recipients),'2026-11-18','2026-11-19','2026-11-18',state,discord,0);
 for(const user of ['first','second'])db.prepare(`INSERT INTO platform_watchlist_notes_deliveries(delivery_id,request_id,user_id,channel,target_ref,state,attempt_count,available_at_utc) VALUES(?,?,?,'email',?,'pending',0,'2026-11-18')`).run(id+user,id,user,user+'-address');
}
it('erases own serialized recipient/target copies and author authority while preserving settled other receipts',()=>{
 const db=fixture();try{
  add(db,'owned','platform-owner:first','accepted','sent');
  db.prepare("UPDATE platform_watchlist_notes_deliveries SET state='delivered' WHERE request_id='owned' AND user_id='second'").run();
  for(const [state,discord] of [['pending','pending'],['accepted','uncertain'],['expired','sent']])add(db,state,'platform-owner:second',state,discord);
  const before=db.prepare("SELECT request_id,actor,state,discord_state,discord_attempts FROM platform_watchlist_notes_notifications WHERE actor='platform-owner:second' ORDER BY request_id").all();
  db.transaction(()=>{eraseWatchlistNotesUserCopies(db,'first');db.prepare('DELETE FROM platform_users WHERE user_id=?').run('first');})();
  expect(db.prepare("SELECT actor,state,discord_state FROM platform_watchlist_notes_notifications WHERE request_id='owned'").get()).toEqual({actor:'erased-owner',state:'cancelled',discord_state:'sent'});
  expect(db.prepare("SELECT request_id,actor,state,discord_state,discord_attempts FROM platform_watchlist_notes_notifications WHERE request_id<>'owned' ORDER BY request_id").all()).toEqual(before);
  for(const row of db.prepare('SELECT recipients_json FROM platform_watchlist_notes_notifications').all() as {recipients_json:string}[])expect(JSON.parse(row.recipients_json)).toEqual([{userId:'second',channel:'web_push',targetRef:'second-device'}]);
  expect(JSON.stringify(db.prepare('SELECT * FROM platform_watchlist_notes_deliveries').all())).not.toContain('first');
  expect(db.prepare("SELECT state FROM platform_watchlist_notes_deliveries WHERE delivery_id='ownedsecond'").get()).toEqual({state:'delivered'});
  expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
 }finally{db.close();}
});
it.each(['sending','uncertain','pending-lost-ack'])('holds whole transaction for an unresolved owned Discord outcome %s even when expired',state=>{
 const db=fixture();try{add(db,'owned','platform-owner:first','expired',state==='pending-lost-ack'?'pending':state);if(state==='pending-lost-ack')db.prepare("UPDATE platform_watchlist_notes_notifications SET discord_attempts=1").run();const before=JSON.stringify(db.prepare('SELECT * FROM platform_watchlist_notes_notifications').all());expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,'first'))()).toThrow('notes_erasure_delivery_unresolved');expect(JSON.stringify(db.prepare('SELECT * FROM platform_watchlist_notes_notifications').all())).toBe(before);}finally{db.close();}
});
it('holds an in-flight own recipient delivery without touching other owners',()=>{
 const db=fixture();try{add(db,'other','platform-owner:second');db.prepare("UPDATE platform_watchlist_notes_deliveries SET state='sending' WHERE user_id='first'").run();expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,'first'))()).toThrow('notes_erasure_delivery_unresolved');expect(db.prepare('SELECT count(*) n FROM platform_users').get()).toEqual({n:2});}finally{db.close();}
});
it('cancels unstarted authored work, does not recreate recipients, and enforces atomic budgets',()=>{
 const db=fixture();try{add(db,'owned','platform-owner:first');db.transaction(()=>eraseWatchlistNotesUserCopies(db,'first'))();const before=JSON.stringify(db.prepare('SELECT * FROM platform_watchlist_notes_notifications').all());db.transaction(()=>eraseWatchlistNotesUserCopies(db,'first'))();expect(JSON.stringify(db.prepare('SELECT * FROM platform_watchlist_notes_notifications').all())).toBe(before);expect(db.prepare("SELECT state,discord_state FROM platform_watchlist_notes_notifications").get()).toEqual({state:'cancelled',discord_state:'cancelled'});expect(db.prepare("SELECT state FROM platform_watchlist_notes_deliveries WHERE delivery_id='ownedsecond'").get()).toEqual({state:'inaccessible'});add(db,'other','platform-owner:second');expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,'second',{maxRows:1}))()).toThrow('notes_erasure_budget');}finally{db.close();}
});
it('requires the erasure transaction and rolls back malformed attributable snapshots',()=>{
 const db=fixture();try{add(db,'owned','platform-owner:first');add(db,'other','platform-owner:second');expect(()=>eraseWatchlistNotesUserCopies(db,'first')).toThrow('notes_erasure_requires_transaction');db.prepare('UPDATE platform_watchlist_notes_notifications SET recipients_json=? WHERE request_id=?').run('{"userId":"first"}','other');expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,'first'))()).toThrow('notes_erasure_invalid_snapshot');expect(db.prepare("SELECT actor FROM platform_watchlist_notes_notifications WHERE request_id='owned'").get()).toEqual({actor:'platform-owner:first'});}finally{db.close();}
});
it('matches escaped JSON identities without an ASCII substring shortcut and preserves an empty first key',()=>{
 const db=fixture();try{
  add(db,'','platform-owner:second');
  db.prepare('UPDATE platform_watchlist_notes_notifications SET recipients_json=? WHERE request_id=?').run('[{"userId":"\\u0066irst","channel":"email","targetRef":"opaque-address-key"},{"userId":"second","channel":"web_push","targetRef":"second-device"}]','');
  db.transaction(()=>eraseWatchlistNotesUserCopies(db,'first'))();
  expect(JSON.parse((db.prepare('SELECT recipients_json FROM platform_watchlist_notes_notifications').get() as {recipients_json:string}).recipients_json)).toEqual([{userId:'second',channel:'web_push',targetRef:'second-device'}]);
 }finally{db.close();}
});
it('rolls back earlier streaming edits when a later row is malformed',()=>{
 const db=fixture();try{
  add(db,'a','platform-owner:first');add(db,'z','platform-owner:second');
  db.prepare('UPDATE platform_watchlist_notes_notifications SET recipients_json=? WHERE request_id=?').run('{"userId":"first"}','z');
  expect(()=>db.transaction(()=>eraseWatchlistNotesUserCopies(db,'first'))()).toThrow('notes_erasure_invalid_snapshot');
  expect(db.prepare("SELECT actor FROM platform_watchlist_notes_notifications WHERE request_id='a'").get()).toEqual({actor:'platform-owner:first'});
 }finally{db.close();}
});
