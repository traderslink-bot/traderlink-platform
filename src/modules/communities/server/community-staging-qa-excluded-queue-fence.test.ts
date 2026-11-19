import Database from "better-sqlite3";
import {describe,expect,it} from "vitest";
import {createCommunityStagingQaExcludedQueueFence} from "./community-staging-qa-capability";

function fixture(){
 const database=new Database(":memory:");
 database.exec(`
  CREATE TABLE traderlink_community_content_deliveries(delivery_id TEXT PRIMARY KEY,status TEXT,delivery_outcome TEXT,attempt_count INTEGER,payload TEXT,receipt TEXT);
  CREATE TABLE traderlink_community_publication_actions(action_id TEXT PRIMARY KEY,status TEXT,attempt_count INTEGER,payload TEXT,receipt TEXT);
  CREATE TABLE community_shared_alert_deliveries(delivery_id TEXT PRIMARY KEY,status TEXT,attempt_count INTEGER,payload TEXT,receipt TEXT);
  CREATE TABLE community_shared_alert_delivery_parts(delivery_id TEXT,content_revision INTEGER,part_number INTEGER,status TEXT,attempt_count INTEGER,content TEXT,receipt TEXT);
  INSERT INTO traderlink_community_content_deliveries VALUES('common','pending','pending',0,'before',NULL);
  INSERT INTO traderlink_community_publication_actions VALUES('action','pending',0,'before',NULL);
  INSERT INTO community_shared_alert_deliveries VALUES('shared','pending',0,'before',NULL);
  INSERT INTO community_shared_alert_delivery_parts VALUES('shared',1,1,'pending',0,'before',NULL);
 `);
 return database;
}

describe("Community staging QA excluded-queue fence",()=>{
 it.each([
  ["status remains nonterminal","UPDATE traderlink_community_content_deliveries SET status='failed' WHERE delivery_id='common'"],
  ["attempt count","UPDATE traderlink_community_publication_actions SET attempt_count=1 WHERE action_id='action'"],
  ["payload","UPDATE community_shared_alert_deliveries SET payload='changed' WHERE delivery_id='shared'"],
  ["part receipt","UPDATE community_shared_alert_delivery_parts SET receipt='message' WHERE delivery_id='shared'"],
 ])("refuses an unselected %s mutation before dispatch and at finish",(_label,mutation)=>{
  for(const boundary of ["before provider dispatch","at finish"]){
   const database=fixture();
   try{
    const fence=createCommunityStagingQaExcludedQueueFence(database,[]);
    database.exec(mutation);
    expect(()=>fence.assertUnchanged(),boundary).toThrow("Community staging QA capability refused.");
   }finally{database.close();}
  }
 });

 it("does not include an exactly selected queue row in the exclusion fence",()=>{
  const database=fixture();
  try{
   const fence=createCommunityStagingQaExcludedQueueFence(database,[{table:"traderlink_community_content_deliveries",id:"common"}]);
   database.exec("UPDATE traderlink_community_content_deliveries SET attempt_count=1,payload='selected' WHERE delivery_id='common'");
   expect(()=>fence.assertUnchanged()).not.toThrow();
  }finally{database.close();}
 });
});
