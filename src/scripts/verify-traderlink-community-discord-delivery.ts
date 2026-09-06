import Database from "better-sqlite3";

import { TraderLinkCommunityDiscordDeliveryService } from "../modules/communities/server/traderlink-community-discord-delivery-service";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const database = new Database(":memory:");
  database.exec(`CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,slug TEXT,display_name TEXT);
CREATE TABLE traderlink_community_discord_destinations(destination_id TEXT PRIMARY KEY,discord_channel_id TEXT,status TEXT);
CREATE TABLE traderlink_community_content_deliveries(delivery_id TEXT PRIMARY KEY,community_id TEXT,object_type TEXT,object_id TEXT,destination_id TEXT,status TEXT,attempt_count INTEGER,last_error TEXT,requested_at_utc TEXT,delivered_at_utc TEXT,updated_at_utc TEXT);
CREATE TABLE traderlink_community_alerts(alert_id TEXT PRIMARY KEY,slug TEXT,title TEXT,symbol TEXT,body TEXT);
CREATE TABLE traderlink_community_server_watchlists(watchlist_id TEXT PRIMARY KEY,title TEXT,status TEXT);
CREATE TABLE community_profiles(user_id TEXT PRIMARY KEY,handle TEXT);
CREATE TABLE community_watchlists(watchlist_id TEXT PRIMARY KEY,owner_user_id TEXT,slug TEXT,title TEXT);`);
  database.prepare(`INSERT INTO traderlink_communities VALUES('community','test-community','Test Community')`).run();
  database.prepare(`INSERT INTO traderlink_community_discord_destinations VALUES('alerts-destination','1546033958448529508','active'),('watchlists-destination','1546034056725008385','active')`).run();
  database.prepare(`INSERT INTO traderlink_community_alerts VALUES('alert','opening-plan','Opening plan','ABC','Watch the opening range.')`).run();
  database.prepare(`INSERT INTO traderlink_community_server_watchlists VALUES('watchlist','Morning watchlist','published')`).run();
  const insertDelivery=database.prepare(`INSERT INTO traderlink_community_content_deliveries VALUES(?,?,?,?,?,'pending',0,NULL,'2026-09-06T12:00:00.000Z',NULL,'2026-09-06T12:00:00.000Z')`);
  insertDelivery.run("alert-delivery","community","alert","alert","alerts-destination");
  insertDelivery.run("watchlist-delivery","community","watchlist","watchlist","watchlists-destination");

  const requests: Array<{url:string;body:Readonly<{content:string;allowed_mentions:{parse:readonly string[]}}>}>=[];
  const originalFetch=globalThis.fetch;
  globalThis.fetch=(async(input,init)=>{
    requests.push({url:String(input),body:JSON.parse(String(init?.body))});
    return new Response("{}",{status:200,headers:{"content-type":"application/json"}});
  }) as typeof fetch;
  try {
    const result=await new TraderLinkCommunityDiscordDeliveryService(database,{botToken:"test-only",publicOrigin:"https://staging.example"}).runAvailable();
    assert(result.delivered===2&&result.failed===0,"Both queued Community deliveries must succeed.");
    assert(requests[0]?.url.endsWith("/channels/1546033958448529508/messages"),"Alert must use the owner-selected alert channel.");
    assert(requests[0]?.body.content.includes("/communities/test-community/alerts/opening-plan"),"Alert must link to its exact TraderLink page.");
    assert(requests[1]?.url.endsWith("/channels/1546034056725008385/messages"),"Server watchlist must use the owner-selected watchlist channel.");
    assert(requests[1]?.body.content.includes("/communities/test-community/server-watchlists/watchlist"),"Server watchlist must link to its exact private TraderLink page.");
    assert(requests.every(request=>request.body.allowed_mentions.parse.length===0),"Community delivery must suppress Discord mentions.");
    const delivered=(database.prepare(`SELECT count(*) count FROM traderlink_community_content_deliveries WHERE status='delivered' AND attempt_count=1`).get() as {count:number}).count;
    assert(delivered===2,"Delivery receipts must be persisted exactly once.");
    console.log(JSON.stringify({ok:true,delivered:result.delivered,exactLinks:true,ownerChannels:true,mentionsSuppressed:true}));
  } finally {
    globalThis.fetch=originalFetch;
    database.close();
  }
}

void main().catch((error)=>{
  console.error(error instanceof Error?error.message:"Community Discord delivery verification failed.");
  process.exitCode=1;
});
