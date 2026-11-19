import Database from "better-sqlite3";
import {describe,expect,it} from "vitest";
import {SharedAlertsDelivery} from "./shared-alerts-delivery";

const AT="2026-11-19T12:00:00.000Z";

function fixture(){
 const db=new Database(":memory:");
 db.exec(`
 CREATE TABLE community_shared_alert_deliveries(
  delivery_id TEXT PRIMARY KEY,request_id TEXT,alert_id TEXT,author_user_id TEXT,publisher_user_id TEXT,change_actor_user_id TEXT,
  source_destination_ids_json TEXT,kind TEXT,original_delivery_id TEXT,terms_version INTEGER,channel_revision INTEGER,channel_id TEXT,
  title TEXT,symbol TEXT,body TEXT,publishing_mode TEXT,source_name TEXT,show_source_name INTEGER,requires_approval INTEGER,
  content_revision INTEGER,approved_content_revision INTEGER,approved_by_user_id TEXT,status TEXT,attempt_count INTEGER,
  retry_at_utc TEXT,last_error TEXT,discord_message_id TEXT,created_at_utc TEXT,updated_at_utc TEXT);
 CREATE TABLE community_shared_alert_delivery_parts(
  delivery_id TEXT,content_revision INTEGER,part_number INTEGER,total_parts INTEGER,content TEXT,nonce TEXT,status TEXT,
  attempt_count INTEGER DEFAULT 0,retry_at_utc TEXT,last_error TEXT,discord_message_id TEXT,created_at_utc TEXT,updated_at_utc TEXT,
  PRIMARY KEY(delivery_id,content_revision,part_number));
 CREATE TABLE community_shared_alert_rate_limits(scope TEXT,scope_id TEXT,retry_at_utc TEXT,updated_at_utc TEXT,PRIMARY KEY(scope,scope_id));
 INSERT INTO community_shared_alert_deliveries VALUES(
  'unselected','request','alert','author','publisher',NULL,'[]','publication',NULL,1,1,'1559172786176401410',
  'Title',NULL,'Body','discord_post','Source',1,0,1,NULL,NULL,'sending',0,NULL,NULL,NULL,'2026-11-19T11:00:00.000Z','2026-11-19T11:00:00.000Z');
 INSERT INTO community_shared_alert_delivery_parts VALUES(
  'unselected',1,1,1,'Body','nonce','sending',0,NULL,NULL,NULL,'2026-11-19T11:00:00.000Z','2026-11-19T11:00:00.000Z');
 `);
 return db;
}

describe("finite Community exact delivery selection",()=>{
 it("does not reconcile or cancel any unselected Shared delivery or part",async()=>{
  const db=fixture();
  try{
   const before=JSON.stringify({delivery:db.prepare("SELECT * FROM community_shared_alert_deliveries").get(),part:db.prepare("SELECT * FROM community_shared_alert_delivery_parts").get()});
   const worker=new SharedAlertsDelivery(db,{botToken:"synthetic",enabled:true,now:()=>AT,exactDeliveryIds:[]},async()=>{throw new Error("No provider request expected");});
   expect(await worker.runAvailable(3)).toEqual({delivered:0,failed:0});
   const after=JSON.stringify({delivery:db.prepare("SELECT * FROM community_shared_alert_deliveries").get(),part:db.prepare("SELECT * FROM community_shared_alert_delivery_parts").get()});
   expect(after).toBe(before);
  }finally{db.close();}
 });
});
