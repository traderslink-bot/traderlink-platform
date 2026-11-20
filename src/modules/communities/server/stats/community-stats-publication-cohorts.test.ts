// @vitest-environment node
import Database from "better-sqlite3";
import {randomUUID} from "node:crypto";
import {maintainCommunityContentStats} from "../community-content-stats-retention";
import {eraseCommunityStatsIdentity} from "./community-stats-retention";
import {statsHistoryIdentityHash} from "./community-stats-history-storage";
import {PlatformUserRepository} from "../../../platform/server/identity/platform-user-repository";
import {PlatformAuthenticationRepository} from "../../../platform/server/authentication/platform-authentication-repository";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {readStatsAnalysts,statsPublicationUnits,statsPublishedIn} from "./community-stats-analysts";
import type {CommunityStatsContent} from "../../contracts/community-stats-contracts";
const metadata=vi.hoisted(()=>({catalog:null as CommunityStatsContent[]|null}));
vi.mock('./community-stats-catalog',async original=>{
 const actual=await original<typeof import('./community-stats-catalog')>();
 return {...actual,readCommunityStatsCatalog:(...args:Parameters<typeof actual.readCommunityStatsCatalog>)=>metadata.catalog??actual.readCommunityStatsCatalog(...args)};
});
import {readCommunityStatsCatalog} from './community-stats-catalog';
import {readCanonicalStatsTargets,resolveCanonicalStatsTarget} from './community-stats-content-targets';
import {CommunityStatsRepository} from './community-stats-repository';
import {openPristinePlatformTestDatabase} from '@/src/test/pristine-platform-test-database';
import {readCommunityStats,openCommunityStatsEventExport} from './community-stats-read';
import type {CommunityStatsRequestScope} from '../../contracts/community-stats-contracts';
let db:Database.Database;
const from='2026-02-01T00:00:00.000Z',until='2026-03-01T00:00:00.000Z';
const post=(id:string,date:string|null):CommunityStatsContent=>({id,type:'alert',title:id,path:'/'+id,authorUserId:'a',authorName:'A',publishedAtUtc:date,state:'published',mode:'tracked_page'});
beforeEach(()=>{db=new Database(':memory:');db.exec("CREATE TABLE community_stats_events(community_id TEXT,surface TEXT,content_id TEXT,discord_user_id TEXT,occurred_at_utc TEXT)");});afterEach(()=>db.close());
describe('first publication versus in-window audience',()=>{
 it('counts old readership while excluding old posts from new counts and the average denominator',()=>{
  const catalog=[post('old','2025-01-01T00:00:00.000Z'),post('new',from),post('new-zero',from)];
  const add=db.prepare("INSERT INTO community_stats_events VALUES('c','web',?,?,?)");
  add.run('old','member1',from);add.run('new','member1',from);add.run('new','member2',from);
  const rows=readStatsAnalysts(db,'c',catalog,from,until,true);
  expect(rows[0]).toMatchObject({'Alerts published':2,Views:3,Viewers:2,'Avg viewers per new post':1});
  expect(readStatsAnalysts(db,'c',catalog,from,until,false)[0]['Avg viewers per new post']).toBeNull();
 });
 it('uses half-open UTC dates and does not count a second placement as a post',()=>{
  const one=post('native',from),other={...one,placementId:'two',path:'/another'};
  expect(statsPublicationUnits([one,other])).toHaveLength(1);
  expect(statsPublishedIn(one,from,until)).toBe(true);expect(statsPublishedIn(post('edge',until),from,until)).toBe(false);
 });
 it('keeps distinct native IDs with the same symbol separate',()=>{
  const items=['i1','i2'].map(id=>({...post('watchlist-item:'+id,from),title:'ABC',type:'watchlist' as const,targetKind:'watchlist_item' as const,canonicalId:id,authorUserId:null,contributorUserId:'a'}));
  expect(statsPublicationUnits(items)).toHaveLength(2);expect(readStatsAnalysts(db,'c',items,from,until,true)[0]['Watchlists published']).toBe(2);
 });
 it('does not turn unknown first-publisher attribution into a false known zero',()=>{
  const unknown={...post('watchlist-item:i',from),type:'watchlist' as const,targetKind:'watchlist_item' as const,authorUserId:null,contributorUserId:null};
  expect(readStatsAnalysts(db,'c',[post('known',from),unknown],from,until,true)[0]['Watchlists published']).toBeNull();
 });
 it('counts focused opens in the selected page exactly once globally, without adopting another occurrence',()=>{
  const store=openPristinePlatformTestDatabase();
  try{
   store.pragma('foreign_keys=OFF');
   const board:CommunityStatsContent={id:'page',pageId:'page',targetKind:'page',type:'alerts',title:'Desk',path:'/desk',state:'published',mode:'tracked_page',authorUserId:null,authorName:null};
   const item={...post('alert',from),targetKind:'alert' as const,canonicalId:'alert',pageId:'page',placementId:'placement-one'};
   metadata.catalog=[board,item];
   const insert=store.prepare("INSERT INTO community_stats_events(community_id,event_id,discord_user_id,platform_user_id,surface,kind,occurred_at_utc,received_at_utc,content_id,page_id,title) VALUES('c',?,?,'actor','web','web_visit',?,?,?, ?,?)");
   insert.run('landing','12345',from,from,'page','page','Desk');
   insert.run('focused1','12345',from,from,item.id,'page','Item');
   insert.run('focused2','67890',from,from,item.id,'page','Item');
   insert.run('elsewhere','67890',from,from,item.id,'another-page','Other occurrence');
   const scope:CommunityStatsRequestScope={communityId:'c',communityName:'Unit',slug:'unit',guildId:'g',actorUserId:'actor',isOwner:true,canReadNamed:true,canExport:true,ownContentOnly:false,capabilities:[],discordRoleIds:[],readableChannelIds:[]};
   const options={tab:'pages' as const,page:1,contentId:'page',window:{fromDate:'2026-02-01',throughDate:'2026-02-28',asOfUtc:'2026-03-01T00:00:00.000Z',timezone:'UTC' as const,quietDays:7 as const,calendar:'calendar_days' as const}};
   const report=readCommunityStats(store,scope,options);
   expect(report.metrics.find(metric=>metric.label==='Webpage visits')?.value).toBe(3);
   expect(report.rows).toHaveLength(1);expect(report.rows[0]).toMatchObject({Page:'Desk',Visits:3,Viewers:2});
   const viewers=readCommunityStats(store,scope,{...options,tab:'visits'});expect(viewers.totalRows).toBe(3);expect(viewers.rows).toHaveLength(3);
   const exported=[...openCommunityStatsEventExport(store,scope,options).rows];expect(exported).toHaveLength(3);expect(exported.some(row=>row.Page==='Other occurrence')).toBe(false);
   const all=readCommunityStats(store,scope,{...options,contentId:undefined});
   expect(all.metrics.find(metric=>metric.label==='Webpage visits')?.value).toBe(4);
   expect(all.rows.find(row=>row.Page==='Desk')?.Visits).toBe(3);expect(all.rows.find(row=>row.Page===item.title)?.Visits).toBe(3);
  }finally{store.close();metadata.catalog=null;}
 });

 it('preserves real authorized occurrences from targets through page, viewer, export and analyst reads',()=>{
  const store=openPristinePlatformTestDatabase();
  try{
   store.pragma('foreign_keys=OFF');metadata.catalog=null;
   const community=randomUUID(),author=randomUUID(),alert=randomUUID(),audience=randomUUID();
   const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',pa=randomUUID(),pb=randomUUID();
   new PlatformUserRepository(store,{allowedAuthProviders:['discord']}).createUser({userId:author,authProvider:'discord',authSubject:'100000000000000992',displayName:'Analyst',createdAtUtc:from,updatedAtUtc:from});
   store.prepare("INSERT INTO traderlink_community_alerts(alert_id,community_id,slug,author_user_id,title,body,status,audience_id,published_at_utc,created_at_utc,updated_at_utc,publishing_mode) VALUES(?,?, 'one-alert',?,'One alert','Synthetic','published',?,?,?,?,'tracked_page')").run(alert,community,author,audience,from,from,from);
   const page=store.prepare("INSERT INTO traderlink_community_content_pages(page_id,community_id,page_type,feed_kind,slug,title,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'alert','general',?,?,?, ?,?)");
   page.run(a,community,'desk-a','Desk A',author,from,from);page.run(b,community,'desk-b','Desk B',author,from,from);
   const placement=store.prepare("INSERT INTO traderlink_community_content_placements(placement_id,community_id,page_id,content_type,content_id,publisher_user_id,published_at_utc,created_at_utc,updated_at_utc) VALUES(?,?,?,'alert',?,?,?,?,?)");
   placement.run(pa,community,a,alert,author,from,from,from);placement.run(pb,community,b,alert,author,from,from,from);
   store.prepare("INSERT INTO community_stats_coverage(community_id,source,from_utc,until_utc,state) VALUES(?,'web',?,?,'observed')").run(community,from,until);
   const scope:CommunityStatsRequestScope={communityId:community,communityName:'Unit',slug:'unit',guildId:'g',actorUserId:author,isOwner:true,canReadNamed:true,canExport:true,ownContentOnly:false,capabilities:[],discordRoleIds:[],readableChannelIds:[]};
   const raw=readCanonicalStatsTargets(store,scope);
   expect(raw.filter(item=>item.id===alert)).toHaveLength(2);
   const target=resolveCanonicalStatsTarget(raw,'/communities/unit/alert/desk-b',pb)!;
   expect(target).toMatchObject({id:alert,pageId:b,placementId:pb});
   const catalog=readCommunityStatsCatalog(store,scope);
   expect(catalog.filter(item=>item.id===alert)).toHaveLength(1);
   expect(catalog.find(item=>item.id===alert)?.occurrences?.map(item=>item.pageId)).toEqual([a,b]);
   expect(new CommunityStatsRepository(store).recordEvent(community,{eventId:'second-page',discordUserId:'12345',platformUserId:author,surface:'web',kind:'web_visit',occurredAtUtc:from,receivedAtUtc:from,
    contentId:target.id,contentType:target.type,title:target.title,path:target.path,authorUserId:target.authorUserId,canonicalContentId:target.canonicalId,placementId:target.placementId,pageId:target.pageId,
    username:'Named reader',displayName:'Named reader',nickname:null,identityObservedAtUtc:from,channelId:null,durationSeconds:0,replyToEventId:null,replyDelaySeconds:null,sourceLinkId:null})).toBe(true);
   const options={tab:'pages' as const,page:1,window:{fromDate:'2026-02-01',throughDate:'2026-02-28',asOfUtc:until,timezone:'UTC' as const,quietDays:7 as const,calendar:'calendar_days' as const}};
   const visits=(contentId?:string)=>readCommunityStats(store,scope,{...options,contentId}).metrics.find(metric=>metric.label==='Webpage visits')?.value;
   expect(visits(a)).toBe(0);expect(visits(b)).toBe(1);expect(visits()).toBe(1);
   const pages=readCommunityStats(store,scope,options);
   expect(pages.rows.find(row=>row.Page==='Desk A')).toMatchObject({Visits:0,Viewers:0});
   expect(pages.rows.find(row=>row.Page==='Desk B')).toMatchObject({Visits:1,Viewers:1});
   expect(pages.rows.filter(row=>row.Page==='One alert')).toHaveLength(1);
   const viewers=readCommunityStats(store,scope,{...options,contentId:b,tab:'visits'});
   expect(viewers.totalRows).toBe(1);expect(JSON.stringify(viewers.rows)).toContain('Named reader');
   expect([...openCommunityStatsEventExport(store,scope,{...options,contentId:b}).rows]).toHaveLength(1);
   expect([...openCommunityStatsEventExport(store,scope,{...options,contentId:a}).rows]).toHaveLength(0);
   expect(readStatsAnalysts(store,community,catalog,from,until,true)[0]).toMatchObject({'Alerts published':1,Views:1,Viewers:1});
   store.prepare("UPDATE traderlink_community_content_pages SET status='archived' WHERE page_id=?").run(a);
   const active=readCommunityStatsCatalog(store,scope).find(item=>item.id===alert)!;
   expect(active).toMatchObject({pageId:b,placementId:pb,path:target.path,state:'published',mode:'tracked_page'});
   expect(active.occurrences).toHaveLength(2);
   store.prepare('DELETE FROM community_stats_events WHERE community_id=?').run(community);
   expect(readStatsAnalysts(store,community,readCommunityStatsCatalog(store,scope),from,until,true)[0]).toMatchObject({'Alerts published':1,Views:0,Viewers:0});
   // An unreadable occurrence never enters the graph; metadata adds no authority.
   const destination=randomUUID();
   store.prepare("INSERT INTO traderlink_community_discord_destinations(destination_id,community_id,name,discord_channel_id,content_type,status,updated_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'Restricted','998877','alerts','active',?,?,?)").run(destination,community,author,from,from);
   store.prepare('UPDATE traderlink_community_content_pages SET discord_destination_id=? WHERE page_id=?').run(destination,b);
   const reader={...scope,isOwner:false};
   expect(readCommunityStatsCatalog(store,reader).some(item=>item.id===alert)).toBe(false);
   expect(readCommunityStatsCatalog(store,{...scope,ownContentOnly:true,actorUserId:randomUUID()}).some(item=>item.id===alert)).toBe(false);
  }finally{store.close();metadata.catalog=null;}
 });

});


describe('indefinite canonical Stats history with explicit erasure intact',()=>{
 it('retains old raw visits, legacy rollups and exclusion markers with zero database writes',()=>{
  const store=openPristinePlatformTestDatabase();
  try{
   store.pragma('foreign_keys=OFF');const community=randomUUID(),page=randomUUID(),actor=randomUUID(),old='2024-01-01T00:00:00.000Z';
   store.prepare("INSERT INTO community_stats_events(community_id,event_id,discord_user_id,platform_user_id,surface,kind,occurred_at_utc,received_at_utc,content_id,page_id) VALUES(?,'old','12345',?,'web','web_visit',?,?,?,?)").run(community,actor,old,old,page,page);
   store.prepare("INSERT INTO traderlink_community_content_daily_stats VALUES(?,?,?,'','',1,1,0,?)").run(community,page,'2024-01-01',old);
   store.prepare("INSERT INTO community_stats_history_exclusions VALUES(?,?,?)").run(community,statsHistoryIdentityHash(community,'67890'),old);
   const before=store.serialize(),changes=store.prepare('SELECT total_changes() n').get();store.pragma('query_only=ON');
   expect(maintainCommunityContentStats(store,'2026-11-20T00:00:00.000Z',31,5000)).toEqual({days:0,rolledUp:0,pruned:0});
   expect(store.serialize().equals(before)).toBe(true);expect(store.prepare('SELECT total_changes() n').get()).toEqual(changes);
   expect((store.prepare('SELECT count(*) n FROM community_stats_events').get() as {n:number}).n).toBe(1);
  }finally{store.close();}
 });
 it('preserves canonical UTC and bounded limit validation without accessing the database',()=>{
  const forbidden=new Proxy({} as Database.Database,{get(){throw Error('Unexpected database access');}});
  expect(maintainCommunityContentStats(forbidden,'2026-11-20T00:00:00.000Z')).toEqual({days:0,rolledUp:0,pruned:0});
  for(const at of ['invalid','2026-11-20','2026-11-20T00:00:00Z'])expect(()=>maintainCommunityContentStats(forbidden,at)).toThrow();
  for(const limit of [0,32,1.5])expect(()=>maintainCommunityContentStats(forbidden,'2026-11-20T00:00:00.000Z',limit)).toThrow('Invalid Community content Stats maintenance limit');
  for(const limit of [0,5001,1.5])expect(()=>maintainCommunityContentStats(forbidden,'2026-11-20T00:00:00.000Z',7,limit)).toThrow('Invalid Community content Stats maintenance limit');
 });
 it('still erases a requested identity and retains its history exclusion; maintenance cannot resurrect it',()=>{
  const store=openPristinePlatformTestDatabase();
  try{
   store.pragma('foreign_keys=OFF');const actor=randomUUID(),other=randomUUID(),community=randomUUID(),page=randomUUID(),old='2024-01-01T00:00:00.000Z';
   new PlatformUserRepository(store,{allowedAuthProviders:['discord']}).createUser({userId:actor,authProvider:'discord',authSubject:'100000000000000991',displayName:'Synthetic member',createdAtUtc:old,updatedAtUtc:old});
   new PlatformAuthenticationRepository(store).linkIdentity({userId:actor,authProvider:'discord',authSubject:'100000000000000991',linkedByUserId:actor,timestamp:old});
   store.prepare("INSERT INTO community_stats_identity_links(community_id,platform_user_id,discord_user_id,from_utc) VALUES(?,?,'100000000000000991',?)").run(community,actor,old);
   store.prepare("INSERT INTO community_stats_members(community_id,discord_user_id,username,role_ids_json,is_bot,active,first_observed_at_utc,last_observed_at_utc) VALUES(?,'100000000000000991','Synthetic','[]',0,1,?,?)").run(community,old,old);
   const insert=store.prepare("INSERT INTO community_stats_events(community_id,event_id,discord_user_id,platform_user_id,surface,kind,occurred_at_utc,received_at_utc,content_id,page_id) VALUES(?,?,?,?,'web','web_visit',?,?,?,?)");
   insert.run(community,'own','100000000000000991',actor,old,old,page,page);insert.run(community,'other','67890',other,old,old,page,page);
   eraseCommunityStatsIdentity(store,actor);
   expect(store.prepare('SELECT event_id FROM community_stats_events').all()).toEqual([{event_id:'other'}]);
   const exclusions=store.prepare('SELECT * FROM community_stats_history_exclusions').all();
   expect(exclusions).toEqual([expect.objectContaining({community_id:community,identity_hash:statsHistoryIdentityHash(community,'100000000000000991')})]);
   maintainCommunityContentStats(store,'2026-11-20T00:00:00.000Z');
   expect(store.prepare('SELECT * FROM community_stats_history_exclusions').all()).toEqual(exclusions);
   expect(store.prepare('SELECT event_id FROM community_stats_events').all()).toEqual([{event_id:'other'}]);
  }finally{store.close();}
 });
 it.each([false,true])('clears only erased attribution with actual helper and atomic rollback=%s',(fail)=>{
  const store=openPristinePlatformTestDatabase();
  try{
   store.pragma('foreign_keys=OFF');
   const community=randomUUID(),secondCommunity=randomUUID(),page=randomUUID(),subject=randomUUID(),viewer=randomUUID(),otherPublisher=randomUUID(),old='2024-01-01T00:00:00.000Z';
   new PlatformUserRepository(store,{allowedAuthProviders:['discord']}).createUser({userId:subject,authProvider:'discord',authSubject:'100000000000000993',displayName:'Erased publisher',createdAtUtc:old,updatedAtUtc:old});
   new PlatformAuthenticationRepository(store).linkIdentity({userId:subject,authProvider:'discord',authSubject:'100000000000000993',linkedByUserId:subject,timestamp:old});
   const link=store.prepare('INSERT INTO community_stats_identity_links(community_id,platform_user_id,discord_user_id,from_utc,until_utc) VALUES(?,?,?,?,?)');
   link.run(community,subject,'100000000000000993',old,null);link.run(community,subject,'67890',old,'2025-01-01T00:00:00.000Z');
   const insert=store.prepare("INSERT INTO community_stats_events(community_id,event_id,discord_user_id,platform_user_id,surface,kind,occurred_at_utc,received_at_utc,content_id,page_id,author_user_id,publisher_user_id) VALUES(?,?,?,?,'web','web_visit',?,?,?,?,?,?)");
   insert.run(community,'own','100000000000000993',subject,old,old,page,page,subject,subject);
   insert.run(community,'both','12345',viewer,old,old,page,page,subject,subject);
   insert.run(secondCommunity,'other-community','12345',viewer,old,old,page,page,subject,subject);
   insert.run(community,'author','12345',viewer,old,old,page,page,subject,otherPublisher);
   insert.run(community,'publisher','12345',viewer,old,old,page,page,otherPublisher,subject);
   insert.run(community,'untouched','12345',viewer,old,old,page,page,otherPublisher,otherPublisher);
   // A former link cannot erase a different account's subsequent web visits.
   insert.run(community,'later-web','67890',viewer,from,from,page,page,otherPublisher,otherPublisher);
   const discord=store.prepare("INSERT INTO community_stats_events(community_id,event_id,discord_user_id,surface,kind,occurred_at_utc,received_at_utc) VALUES(?,?,'67890','discord','message',?,?)");
   discord.run(community,'old-discord',old,old);discord.run(community,'later-discord',from,from);
   const activity=store.prepare("INSERT INTO traderlink_community_activity_events(event_id,community_id,user_id,event_type,object_type,path,occurred_at_utc,page_id,publisher_user_id) VALUES(?,?,?,'page_visit','page','/synthetic',?,?,?)");
   const attributed=randomUUID(),unrelated=randomUUID();
   activity.run(attributed,community,viewer,old,page,subject);activity.run(unrelated,community,viewer,old,page,otherPublisher);
   const daily=store.prepare('INSERT INTO traderlink_community_content_daily_stats VALUES(?,?,?,?,?,1,1,1,?)');
   daily.run(community,page,'2024-01-01','',subject,old);daily.run(community,page,'2024-01-02','',subject,old);
   daily.run(community,page,'2024-01-01','','',old);daily.run(community,page,'2024-01-01','',otherPublisher,old);
   const snapshot=()=>({events:store.prepare('SELECT * FROM community_stats_events ORDER BY event_id').all(),activity:store.prepare('SELECT * FROM traderlink_community_activity_events ORDER BY event_id').all(),daily:store.prepare('SELECT * FROM traderlink_community_content_daily_stats ORDER BY activity_day,publisher_user_id').all(),links:store.prepare('SELECT * FROM community_stats_identity_links ORDER BY discord_user_id').all(),exclusions:store.prepare('SELECT * FROM community_stats_history_exclusions ORDER BY identity_hash').all(),auth:store.prepare('SELECT * FROM platform_auth_identities ORDER BY user_id').all()});
   const before=snapshot();
   if(fail)store.exec("CREATE TRIGGER fail_stats_erasure BEFORE DELETE ON traderlink_community_content_daily_stats BEGIN SELECT RAISE(ABORT,'injected erasure failure'); END");
   const erase=()=>store.transaction(()=>{
    eraseCommunityStatsIdentity(store,subject);
    expect(store.inTransaction).toBe(true);
    expect(store.prepare('SELECT 1 FROM platform_auth_identities WHERE user_id=?').get(subject)).toBeDefined();
   }).immediate();
   if(fail){expect(erase).toThrow('injected erasure failure');expect(snapshot()).toEqual(before);}
   else{
    erase();
    expect(store.prepare('SELECT event_id FROM community_stats_events ORDER BY event_id').all()).toEqual(['author','both','later-discord','later-web','other-community','publisher','untouched'].map(event_id=>({event_id})));
    expect(store.prepare('SELECT count(*) n FROM community_stats_events WHERE author_user_id=? OR publisher_user_id=?').get(subject,subject)).toEqual({n:0});
    expect(snapshot().events).toEqual(before.events.filter(row=>!['own','old-discord'].includes((row as {event_id:string}).event_id)).map(row=>{
     const event=row as Record<string,unknown>;return {...event,author_user_id:event.author_user_id===subject?null:event.author_user_id,publisher_user_id:event.publisher_user_id===subject?null:event.publisher_user_id};
    }));
    expect(snapshot().activity).toEqual(before.activity.map(row=>{const event=row as Record<string,unknown>;return {...event,publisher_user_id:event.publisher_user_id===subject?null:event.publisher_user_id};}));
    expect(store.prepare('SELECT platform_user_id,author_user_id,publisher_user_id FROM community_stats_events WHERE event_id=?').get('both')).toEqual({platform_user_id:viewer,author_user_id:null,publisher_user_id:null});
    expect(store.prepare('SELECT author_user_id,publisher_user_id FROM community_stats_events WHERE event_id=?').get('author')).toEqual({author_user_id:null,publisher_user_id:otherPublisher});
    expect(store.prepare('SELECT author_user_id,publisher_user_id FROM community_stats_events WHERE event_id=?').get('publisher')).toEqual({author_user_id:otherPublisher,publisher_user_id:null});
    expect(store.prepare('SELECT user_id,publisher_user_id FROM traderlink_community_activity_events WHERE event_id=?').get(attributed)).toEqual({user_id:viewer,publisher_user_id:null});
    expect(store.prepare('SELECT * FROM traderlink_community_activity_events WHERE event_id=?').get(unrelated)).toEqual(before.activity.find(row=>(row as {event_id:string}).event_id===unrelated));
    expect(snapshot().daily).toEqual(before.daily.filter(row=>(row as {publisher_user_id:string}).publisher_user_id!==subject));
    expect(snapshot().exclusions).toEqual(expect.arrayContaining(['100000000000000993','67890'].map(id=>expect.objectContaining({community_id:community,identity_hash:statsHistoryIdentityHash(community,id)}))));
    expect(snapshot().auth).toEqual(before.auth);
    const after=snapshot();erase();expect(snapshot()).toEqual(after);
   }
   expect(store.inTransaction).toBe(false);
  }finally{store.close();}
 });

});
