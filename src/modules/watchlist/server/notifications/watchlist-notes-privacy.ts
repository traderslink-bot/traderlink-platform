import type Database from 'better-sqlite3';

/** Whole Platform-user erasure only; caller holds the existing permanent-delete
 * transaction. Never call for Journal account/workspace clearing. No I/O. */
export function eraseWatchlistNotesUserCopies(database:Database.Database,userId:string,options:{maxRows?:number;maxElapsedMs?:number}={}):void {
 if(!database.inTransaction)throw Error('notes_erasure_requires_transaction');
 if(!userId || userId.length>128)throw Error('notes_erasure_invalid_user');
 if(!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_notes_notifications'").get())return;
 const started=performance.now(),maxRows=options.maxRows??1_000_000,maxElapsedMs=options.maxElapsedMs??30_000;
 if(!Number.isSafeInteger(maxRows)||maxRows<1||!Number.isFinite(maxElapsedMs)||maxElapsedMs<=0)throw Error('notes_erasure_budget');
 let visited=0;
 const budget=()=>{if(performance.now()-started>maxElapsedMs)throw Error('notes_erasure_budget');};
 const visit=()=>{budget();if(++visited>maxRows)throw Error('notes_erasure_budget');};
 const actor='platform-owner:'+userId;
 // Explicit indexed keyset scans, one row/body at a time. There is no text
 // predicate that silently misses JSON-escaped identities or scans unbounded
 // candidate bodies before checking the existing row/time budget.
 type Delivery={delivery_id:string;request_id:string;user_id:string;state:string};
 const firstDelivery=database.prepare<[],Delivery>('SELECT delivery_id,request_id,user_id,state FROM platform_watchlist_notes_deliveries ORDER BY delivery_id LIMIT 1');
 const nextDelivery=database.prepare<[string],Delivery>('SELECT delivery_id,request_id,user_id,state FROM platform_watchlist_notes_deliveries WHERE delivery_id>? ORDER BY delivery_id LIMIT 1');
 const parent=database.prepare<[string],{actor:string}>('SELECT actor FROM platform_watchlist_notes_notifications WHERE request_id=?');
 let deliveryKey:string|undefined;
 for(;;){
  budget();const row:Delivery|undefined=deliveryKey===undefined?firstDelivery.get():nextDelivery.get(deliveryKey);
  if(!row)break;visit();deliveryKey=row.delivery_id;
  if(row.state==='sending' && (row.user_id===userId || parent.get(row.request_id)?.actor===actor))throw Error('notes_erasure_delivery_unresolved');
 }
 type Intent={request_id:string;actor:string;recipients_json:string;discord_state:string;discord_attempts:number};
 const first=database.prepare<[],Intent>('SELECT request_id,actor,recipients_json,discord_state,discord_attempts FROM platform_watchlist_notes_notifications ORDER BY request_id LIMIT 1');
 const next=database.prepare<[string],Intent>('SELECT request_id,actor,recipients_json,discord_state,discord_attempts FROM platform_watchlist_notes_notifications WHERE request_id>? ORDER BY request_id LIMIT 1');
 let key:string|undefined;
 for(;;){
  budget();const row:Intent|undefined=key===undefined?first.get():next.get(key);
  if(!row)break;visit();key=row.request_id;
  if(row.actor===actor && (['sending','uncertain'].includes(row.discord_state)||(row.discord_state==='pending'&&row.discord_attempts>0)))throw Error('notes_erasure_delivery_unresolved');
  const recipients:unknown=JSON.parse(row.recipients_json);budget();
  if(!Array.isArray(recipients)||recipients.some(value=>!value||typeof value!=='object'||typeof value.userId!=='string'||typeof value.targetRef!=='string'||!['web_push','email'].includes(value.channel)))throw Error('notes_erasure_invalid_snapshot');
  const remaining=recipients.filter(value=>value.userId!==userId);
  if(remaining.length!==recipients.length)database.prepare('UPDATE platform_watchlist_notes_notifications SET recipients_json=? WHERE request_id=?').run(JSON.stringify(remaining),row.request_id);
  if(row.actor===actor){
   // Keep settled receipts and other recipients; revoke author authority and
   // unstarted work. Later malformed/uncertain rows roll back the SAME outer
   // transaction, including any changes already made in this keyset pass.
   database.prepare(`UPDATE platform_watchlist_notes_notifications SET actor='erased-owner',state='cancelled',
    discord_state=CASE WHEN discord_state IN ('pending','retry') THEN 'cancelled' ELSE discord_state END WHERE request_id=?`).run(row.request_id);
   database.prepare("UPDATE platform_watchlist_notes_deliveries SET state='inaccessible' WHERE request_id=? AND state='pending'").run(row.request_id);
  }
 }
 // Existing whole-user FK closure removes own delivery/target_ref rows. This
 // helper never resets retries or creates work. One legacy JSON body itself
 // has no schema byte cap: parsing is checked afterward, not preemptible.
}
