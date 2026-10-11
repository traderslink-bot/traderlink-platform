import Database from "better-sqlite3";
import { platformCoachingContentDeliveryReceiptsMigration } from "../modules/platform/server/database/migrations/0161_platform_coaching_content_delivery_receipts";
import {platformCoachingDeliveryAttemptHistoryMigration} from "../modules/platform/server/database/migrations/0162_platform_coaching_delivery_attempt_history";

import { TraderLinkCommunityDiscordDeliveryService } from "../modules/communities/server/traderlink-community-discord-delivery-service";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const legacy=new Database(':memory:');
  legacy.exec("CREATE TABLE traderlink_community_content_deliveries(delivery_id TEXT PRIMARY KEY,status TEXT,delivered_at_utc TEXT); INSERT INTO traderlink_community_content_deliveries VALUES('sent','delivered','2026-09-01T00:00:00.000Z'),('lost','sending',NULL),('failed','failed',NULL),('new','pending',NULL)");
  for(const statement of platformCoachingContentDeliveryReceiptsMigration.statements)legacy.exec(statement);
  const oldRows=legacy.prepare('SELECT * FROM traderlink_community_content_deliveries ORDER BY delivery_id').all() as {delivery_id:string;status:string;delivery_outcome:string;discord_message_id:string|null;delivered_at_utc:string|null}[];
  assert(oldRows.every(row=>row.discord_message_id===null),'Migration must not invent historical Discord receipts.');
  assert(oldRows.find(row=>row.delivery_id==='sent')?.delivered_at_utc==='2026-09-01T00:00:00.000Z','Migration preserves confirmed historical delivery time.');
  assert(oldRows.filter(row=>['lost','failed'].includes(row.delivery_id)).every(row=>row.delivery_outcome==='uncertain'),'Historical unconfirmed sends must be held, not replayed.');
  assert(oldRows.find(row=>row.delivery_id==='new')?.delivery_outcome==='pending','Untouched queue remains pending.');
  legacy.close();
  const database = new Database(":memory:");
  database.exec(`CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,discord_guild_id TEXT DEFAULT '123456789',slug TEXT,display_name TEXT,status TEXT DEFAULT 'active');
CREATE TABLE traderlink_community_discord_destinations(destination_id TEXT PRIMARY KEY,community_id TEXT DEFAULT 'community',discord_channel_id TEXT,status TEXT);
CREATE TABLE traderlink_community_content_deliveries(delivery_id TEXT PRIMARY KEY,community_id TEXT,object_type TEXT,object_id TEXT,destination_id TEXT,status TEXT,attempt_count INTEGER,last_error TEXT,requested_at_utc TEXT,delivered_at_utc TEXT,updated_at_utc TEXT);
CREATE TABLE traderlink_community_alerts(alert_id TEXT PRIMARY KEY,community_id TEXT DEFAULT 'community',slug TEXT,title TEXT,symbol TEXT,body TEXT,publishing_mode TEXT DEFAULT 'tracked_page',status TEXT DEFAULT 'published');
CREATE TABLE traderlink_community_server_watchlists(watchlist_id TEXT PRIMARY KEY,community_id TEXT DEFAULT 'community',title TEXT,status TEXT,description TEXT DEFAULT '',publishing_mode TEXT DEFAULT 'tracked_page');
CREATE TABLE traderlink_community_server_watchlist_symbols(watchlist_id TEXT,symbol TEXT,note TEXT,ordinal INTEGER);
CREATE TABLE community_profiles(user_id TEXT PRIMARY KEY,handle TEXT);
CREATE TABLE community_watchlists(watchlist_id TEXT PRIMARY KEY,owner_user_id TEXT,slug TEXT,title TEXT,status TEXT DEFAULT 'published');
CREATE TABLE traderlink_community_watchlist_placements(watchlist_id TEXT,community_id TEXT,status TEXT);`);
  database.prepare(`INSERT INTO traderlink_communities(community_id,slug,display_name) VALUES('community','test-community','Test Community')`).run();
  database.prepare(`INSERT INTO traderlink_community_discord_destinations(destination_id,discord_channel_id,status) VALUES('alerts-destination','1546033958448529508','active'),('watchlists-destination','1546034056725008385','active')`).run();
  database.prepare(`INSERT INTO traderlink_community_alerts(alert_id,slug,title,symbol,body) VALUES('alert','opening-plan','Opening plan','ABC','Watch the opening range.')`).run();
  database.prepare(`INSERT INTO traderlink_community_server_watchlists(watchlist_id,title,status,description) VALUES('watchlist','Morning watchlist','published','Private watchlist notes')`).run();
  database.prepare(`INSERT INTO traderlink_community_server_watchlist_symbols VALUES('watchlist','ABC','Entry note',0)`).run();
  database.exec("CREATE TABLE platform_users(user_id TEXT PRIMARY KEY)");
  for(const statement of [...platformCoachingContentDeliveryReceiptsMigration.statements,...platformCoachingDeliveryAttemptHistoryMigration.statements])database.exec(statement);
  const insertDelivery=database.prepare(`INSERT INTO traderlink_community_content_deliveries(delivery_id,community_id,object_type,object_id,destination_id,status,attempt_count,last_error,requested_at_utc,delivered_at_utc,updated_at_utc) VALUES(?,?,?,?,?,'pending',0,NULL,'2026-09-06T12:00:00.000Z',NULL,'2026-09-06T12:00:00.000Z')`);
  insertDelivery.run("alert-delivery","community","alert","alert","alerts-destination");
  insertDelivery.run("watchlist-delivery","community","watchlist","watchlist","watchlists-destination");

  const requests: Array<{url:string;body:Readonly<{content:string;allowed_mentions:{parse:readonly string[]}}>}>=[];
  const originalFetch=globalThis.fetch;
  globalThis.fetch=(async(input,init)=>{
    const channelId=String(input).split('/channels/')[1]?.split('/')[0];
    if(init?.method!=="POST")return Response.json({id:channelId,guild_id:"123456789",type:0});
    requests.push({url:String(input),body:JSON.parse(String(init?.body))});
    return Response.json({id:String(100000+requests.length),channel_id:channelId});
  }) as typeof fetch;
  try {
    const result=await new TraderLinkCommunityDiscordDeliveryService(database,{botToken:"test-only",publicOrigin:"https://staging.example"}).runAvailable();
    assert(result.delivered===2&&result.failed===0,"Both queued Community deliveries must succeed.");
    assert(requests[0]?.url.endsWith("/channels/1546033958448529508/messages"),"Alert must use the owner-selected alert channel.");
    assert(requests[0]?.body.content.includes("/communities/test-community/alerts/opening-plan"),"Alert must link to its exact TraderLink page.");
    assert(!requests[0]?.body.content.includes("Watch the opening range."),"Tracked alert must not disclose page content in Discord.");
    assert(requests[1]?.url.endsWith("/channels/1546034056725008385/messages"),"Server watchlist must use the owner-selected watchlist channel.");
    assert(requests[1]?.body.content.includes("/communities/test-community/server-watchlists/watchlist"),"Server watchlist must link to its exact private TraderLink page.");
    assert(!requests[1]?.body.content.includes("Private watchlist notes"),"Tracked watchlist must not disclose notes.");
    assert(requests.every(request=>request.body.allowed_mentions.parse.length===0),"Community delivery must suppress Discord mentions.");
    const delivered=(database.prepare(`SELECT count(*) count FROM traderlink_community_content_deliveries WHERE status='delivered' AND attempt_count=1`).get() as {count:number}).count;
    assert(delivered===2,"Delivery receipts must be persisted exactly once.");
    const again=await new TraderLinkCommunityDiscordDeliveryService(database,{botToken:"test-only",publicOrigin:"https://staging.example"}).runAvailable();
    assert(again.delivered===0&&requests.length===2,"Delivered messages must not replay.");
    database.prepare(`UPDATE traderlink_community_alerts SET publishing_mode='discord_post'`).run();
    database.prepare(`UPDATE traderlink_community_server_watchlists SET publishing_mode='discord_post'`).run();
    insertDelivery.run("full-alert","community","alert","alert","alerts-destination");
    insertDelivery.run("full-watchlist","community","watchlist","watchlist","watchlists-destination");
    const held=await new TraderLinkCommunityDiscordDeliveryService(database,{botToken:"test-only",publicOrigin:"https://staging.example",notBeforeUtc:"2026-10-02T00:00:00.000Z"}).runAvailable();
    assert(held.delivered===0&&requests.length===2,"Activation cutoff must hold historical rows without sending.");
    await new TraderLinkCommunityDiscordDeliveryService(database,{botToken:"test-only",publicOrigin:"https://staging.example"}).runAvailable();
    assert(requests[2]?.body.content.includes("Watch the opening range.")&&!requests[2]?.body.content.includes("Open in TraderLink"),"Full alert must carry content without requiring the page.");
    assert(requests[3]?.body.content.includes("Private watchlist notes")&&requests[3]?.body.content.includes("ABC — Entry note")&&!requests[3]?.body.content.includes("Open in TraderLink"),"Full watchlist must include symbols and notes.");
    const receipt=database.prepare("SELECT discord_message_id,delivery_outcome FROM traderlink_community_content_deliveries WHERE delivery_id='alert-delivery'").get() as {discord_message_id:string;delivery_outcome:string};
    assert(receipt.discord_message_id==='100001'&&receipt.delivery_outcome==='confirmed',"Confirmed message identity must be retained.");
    let clock='2026-10-10T12:00:00.000Z',mode='ok',posts=0;
    const controlledFetch=(async(input,init)=>{
      const channelId=String(input).split('/channels/')[1]?.split('/')[0];
      if(init?.method!=="POST"){
        if(mode==='preflight-outage')throw new Error('network unavailable');
        if(mode==='unpublish-during-check')database.prepare("UPDATE traderlink_community_alerts SET status='draft'").run();
        return Response.json({id:channelId,guild_id:mode==='wrong-guild'?'999999999':'123456789',type:0});
      }
      posts++;
      const payload=JSON.parse(String(init.body));
      assert(payload.enforce_nonce===true&&payload.nonce.length<=25,"Send requires a stable bounded nonce.");
      if(mode==='rate-limit')return Response.json({retry_after:60},{status:429});
      if(mode==='post-outage')throw new Error('response lost');
      if(mode==='server-error')return Response.json({},{status:503});
      if(mode==='bad-receipt')return Response.json({id:'123',channel_id:'wrong'});
      return Response.json({id:String(200000+posts),channel_id:channelId});
    }) as typeof fetch;
    const worker=new TraderLinkCommunityDiscordDeliveryService(database,{botToken:'test-only',publicOrigin:'https://staging.example',now:()=>clock},controlledFetch);
    const outcome=(id:string)=>database.prepare("SELECT delivery_outcome,next_attempt_at_utc,attempt_count FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(id) as {delivery_outcome:string;next_attempt_at_utc:string|null;attempt_count:number};
    for(const failure of ['wrong-guild','unpublish-during-check']){
      mode=failure;
      insertDelivery.run(failure,'community','alert','alert','alerts-destination');
      await worker.runAvailable();
      assert(outcome(failure).delivery_outcome==='rejected'&&posts===0,'Invalid or unpublished destination content must not post.');
      database.prepare("UPDATE traderlink_community_alerts SET status='published'").run();
    }
    mode='ok';
    database.prepare("UPDATE traderlink_community_alerts SET body=?").run('x'.repeat(2001));
    insertDelivery.run('oversized','community','alert','alert','alerts-destination');
    await worker.runAvailable();
    assert(outcome('oversized').delivery_outcome==='rejected'&&posts===0,'Oversized content is rejected, never silently truncated.');
    database.prepare("UPDATE traderlink_community_alerts SET body='Normal post'").run();
    mode='rate-limit';
    insertDelivery.run('limited','community','alert','alert','alerts-destination');
    await worker.runAvailable();
    assert(outcome('limited').next_attempt_at_utc==='2026-10-10T12:01:00.000Z','Retry respects provider delay.');
    const afterLimit=posts;
    await worker.runAvailable();
    assert(posts===afterLimit,'Rate limited rows must wait before retry.');
    mode='ok';clock='2026-10-10T12:01:00.000Z';await worker.runAvailable();
    assert(outcome('limited').delivery_outcome==='confirmed','Rejected rate-limit attempt may safely retry.');
    for(const failure of ['post-outage','server-error','bad-receipt']){
      mode=failure;insertDelivery.run(failure,'community','alert','alert','alerts-destination');
      await worker.runAvailable();
      assert(outcome(failure).delivery_outcome==='uncertain','Unconfirmed POST cannot be treated as safely retryable.');
      const beforeRetry:number=posts;mode='ok';await worker.runAvailable();
      assert(posts===beforeRetry,'Uncertain delivery must not automatically replay.');
    }
    mode='preflight-outage';insertDelivery.run('preflight','community','alert','alert','alerts-destination');
    const beforePreflight=posts;await worker.runAvailable();
    assert(outcome('preflight').delivery_outcome==='pending'&&posts===beforePreflight,'Preflight outage remains retryable without a post.');
    mode='ok';clock='2026-10-10T12:02:00.000Z';await worker.runAvailable();
    assert(outcome('preflight').delivery_outcome==='confirmed','Safe preflight retry recovers.');
    const history=database.prepare("SELECT count(*) n FROM traderlink_community_delivery_attempt_history WHERE delivery_id='alert-delivery' AND discord_message_id='100001' AND outcome='confirmed'").get() as {n:number};
    assert(history.n===1,'Confirmed receipt has one append-only history event.');
    let resendNonce='';
    const resendFetch=(async(input,init)=>{if(init?.method==='POST')resendNonce=JSON.parse(String(init.body)).nonce;return controlledFetch(input,init);}) as typeof fetch;
    database.prepare("UPDATE traderlink_community_content_deliveries SET current_attempt_key='new-explicit-attempt',status='pending',delivery_outcome='pending',attempt_count=0 WHERE delivery_id='alert-delivery'").run();
    await new TraderLinkCommunityDiscordDeliveryService(database,{botToken:'test-only',publicOrigin:'https://staging.example',now:()=>clock},resendFetch).runAvailable();
    assert(resendNonce!==JSON.parse(JSON.stringify(requests[0].body)).nonce,'Explicit resend must use a different nonce from the prior confirmed send.');
    assert((database.prepare("SELECT count(*) n FROM traderlink_community_delivery_attempt_history WHERE delivery_id='alert-delivery' AND outcome='confirmed'").get() as {n:number}).n===2,'Later confirmation appends rather than replaces the earlier receipt.');
    console.log(JSON.stringify({ok:true,exactLinks:true,ownerChannels:true,mentionsSuppressed:true,publishingModes:true,noReplay:true,cutoff:true,receipts:true,tenantValidation:true,publicationRecheck:true,noTruncation:true,rateLimit:true,uncertainSendHeld:true,preflightRecovery:true,attemptHistory:true,freshResendNonce:true}));
  } finally {
    globalThis.fetch=originalFetch;
    database.close();
  }
}

void main().catch((error)=>{
  console.error(error instanceof Error?error.message:"Community Discord delivery verification failed.");
  process.exitCode=1;
});
