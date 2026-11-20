// @vitest-environment node
import Database from "better-sqlite3";
import {afterEach,beforeEach,describe,expect,it} from "vitest";
import {resolveCommunityStatsPage} from './community-stats-catalog';
import {readCanonicalStatsTargets,readWatchlistFirstPublisher,resolveCanonicalStatsTarget} from "./community-stats-content-targets";
import type {CommunityStatsRequestScope} from "../../contracts/community-stats-contracts";
let db:Database.Database;
const from="2026-01-01T00:00:00.000Z",later="2026-02-01T00:00:00.000Z";
const scope:CommunityStatsRequestScope={communityId:"c",slug:"unit",guildId:"g",communityName:"Unit",actorUserId:"a",isOwner:true,ownContentOnly:false,canExport:true,canReadNamed:true,capabilities:[],discordRoleIds:[],readableChannelIds:[]};
beforeEach(()=>{db=new Database(":memory:");db.exec(`
 CREATE TABLE platform_users(user_id TEXT,status TEXT,display_name TEXT);
 CREATE TABLE traderlink_community_content_pages(community_id TEXT,page_id TEXT,page_type TEXT,slug TEXT,secondary_slug TEXT,title TEXT,status TEXT,feed_kind TEXT,publisher_user_id TEXT,category_id TEXT,discord_destination_id TEXT);
 CREATE TABLE traderlink_community_watchlist_items(community_id TEXT,page_id TEXT,item_id TEXT,symbol TEXT,publisher_user_id TEXT,category_id TEXT,status TEXT,published_at_utc TEXT,revision INTEGER);
 CREATE TABLE traderlink_community_watchlist_item_revisions(item_id TEXT,revision INTEGER,actor_user_id TEXT,status TEXT,changed_at_utc TEXT);
 CREATE TABLE traderlink_community_content_documents(community_id TEXT,page_id TEXT,document_id TEXT,slug TEXT,title TEXT,author_user_id TEXT,category_id TEXT,status TEXT,published_at_utc TEXT);
 CREATE TABLE traderlink_community_content_placements(community_id TEXT,page_id TEXT,placement_id TEXT,content_type TEXT,content_id TEXT,publisher_user_id TEXT,category_id TEXT,status TEXT);
 CREATE TABLE traderlink_community_discord_destinations(community_id TEXT,destination_id TEXT,discord_channel_id TEXT);
 INSERT INTO platform_users VALUES('a','active','First publisher'),('b','active','Moderator');
 INSERT INTO traderlink_community_content_pages VALUES('c','board','watchlist','board',NULL,'Board','active','general',NULL,NULL,NULL),('c','collection','content','articles',NULL,'Articles','active','general',NULL,NULL,NULL);`);
 db.prepare("INSERT INTO traderlink_community_watchlist_items VALUES('c','board','i','ABC','b',NULL,'published',?,2)").run(from);
 db.prepare("INSERT INTO traderlink_community_watchlist_item_revisions VALUES('i',1,'a','published',?),('i',2,'b','published',?)").run(from,later);
 db.prepare("INSERT INTO traderlink_community_content_documents VALUES('c','collection','doc','research','Research','a',NULL,'published',?)").run(from);
});
afterEach(()=>db.close());
describe('canonical metadata and actual native identities',()=>{
 it('keeps board and collection opens authorless; focus credits exactly one item',()=>{
  const targets=readCanonicalStatsTargets(db,scope);
  expect(resolveCanonicalStatsTarget(targets,'/communities/unit/watchlist/board')).toMatchObject({id:'board',authorUserId:null});
  expect(resolveCanonicalStatsTarget(targets,'/communities/unit/watchlist/board','i')).toMatchObject({id:'watchlist-item:i',canonicalId:'i',authorUserId:null,publisherUserId:'b',contributorUserId:'a'});
  expect(resolveCanonicalStatsTarget(targets,'/communities/unit/content/articles')).toMatchObject({id:'collection',authorUserId:null});
  expect(resolveCanonicalStatsTarget(targets,'/communities/unit/content/articles/research')).toMatchObject({id:'document:doc',authorUserId:'a'});
  expect(resolveCanonicalStatsTarget(targets,'/communities/unit/watchlist/board','doc')).toBeNull();
 });
 it('reads no authored, body or metadata payload columns',()=>{
  // Synthetic projection schema deliberately lacks every private payload column.
  expect(readCanonicalStatsTargets(db,scope)).toHaveLength(4);
 });
 it('retains first publisher and original date across same-ID remove/restore and moderator edit',()=>{
  db.exec("UPDATE traderlink_community_watchlist_items SET status='removed'");
  expect(resolveCanonicalStatsTarget(readCanonicalStatsTargets(db,scope),'/communities/unit/watchlist/board','i')).toBeNull();
  db.exec("UPDATE traderlink_community_watchlist_items SET status='published'");
  const item=readCanonicalStatsTargets(db,scope).find(row=>row.targetKind==='watchlist_item');
  expect(item).toMatchObject({id:'watchlist-item:i',publishedAtUtc:from,contributorUserId:'a',publisherUserId:'b'});
 });
 it.each(['gap','mismatch','erased','duplicate','overflow'])('returns n/a rather than guessing on %s evidence',kind=>{
  if(kind==='gap')db.exec("UPDATE traderlink_community_watchlist_item_revisions SET revision=3 WHERE revision=1");
  if(kind==='mismatch')db.prepare("UPDATE traderlink_community_watchlist_item_revisions SET changed_at_utc=? WHERE revision=1").run(later);
  if(kind==='erased')db.exec("UPDATE platform_users SET status='removed' WHERE user_id='a'");
  if(kind==='duplicate')db.prepare("UPDATE traderlink_community_watchlist_item_revisions SET changed_at_utc=? WHERE revision=2").run(from);
  if(kind==='overflow'){const insert=db.prepare("INSERT INTO traderlink_community_watchlist_item_revisions VALUES('i',?,'b','published',?)");for(let i=3;i<=513;i++)insert.run(i,later);}
  expect(readWatchlistFirstPublisher(db,'i',from,2)).toBeNull();
 });
 it('does not expand own-native-author access to a contributor or current publisher',()=>{
  const own=readCanonicalStatsTargets(db,{...scope,isOwner:false,ownContentOnly:true});
  expect(own.map(item=>item.id)).toEqual(['document:doc']);
 });
 it('requires the current associated channel and active page',()=>{
  db.exec("INSERT INTO traderlink_community_discord_destinations VALUES('c','dest','chan');UPDATE traderlink_community_content_pages SET discord_destination_id='dest'");
  expect(readCanonicalStatsTargets(db,{...scope,isOwner:false})).toHaveLength(0);
  expect(readCanonicalStatsTargets(db,{...scope,isOwner:false,readableChannelIds:['chan']})).toHaveLength(4);
  db.exec("UPDATE traderlink_community_content_pages SET status='archived'");
  expect(readCanonicalStatsTargets(db,{...scope,isOwner:false,readableChannelIds:['chan']})).toEqual([]);
  expect(resolveCanonicalStatsTarget(readCanonicalStatsTargets(db,scope),'/communities/unit/watchlist/board','i')).toBeNull();
  expect(readCanonicalStatsTargets(db,scope).find(row=>row.id==='watchlist-item:i')?.publishedAtUtc).toBe(from);
 });
 it('preserves the stored publisher/category tuple rather than relying on a label',()=>{
  db.exec("UPDATE traderlink_community_content_pages SET feed_kind='publisher_category',publisher_user_id='b',category_id='cat' WHERE page_id='board'");
  expect(readCanonicalStatsTargets(db,scope).some(item=>item.id==='watchlist-item:i')).toBe(false);
  db.exec("UPDATE traderlink_community_watchlist_items SET category_id='cat'");expect(readCanonicalStatsTargets(db,scope).some(item=>item.id==='watchlist-item:i')).toBe(true);
 });
 it('resolves the exact alert occurrence while retaining one native aggregation key',()=>{
  db.exec("CREATE TABLE traderlink_community_alerts(community_id TEXT,alert_id TEXT,title TEXT,author_user_id TEXT,status TEXT,published_at_utc TEXT)");
  db.prepare("INSERT INTO traderlink_community_alerts VALUES('c','alert','Alert','a','published',?)").run(from);
  db.exec("INSERT INTO traderlink_community_content_pages VALUES('c','alerts','alert','alerts',NULL,'Alerts','active','general',NULL,NULL,NULL),('c','alerts2','alert','another',NULL,'Another','active','general',NULL,NULL,NULL)");
  db.exec("INSERT INTO traderlink_community_content_placements VALUES('c','alerts','placement1','alert','alert','b',NULL,'published'),('c','alerts2','placement2','alert','alert','b',NULL,'published')");
  const targets=readCanonicalStatsTargets(db,scope);
  const one=resolveCanonicalStatsTarget(targets,'/communities/unit/alert/alerts','placement1');
  const two=resolveCanonicalStatsTarget(targets,'/communities/unit/alert/another','placement2');
  expect(one).toMatchObject({id:'alert',canonicalId:'alert',placementId:'placement1',authorUserId:'a',publisherUserId:'b'});
  expect(two).toMatchObject({id:'alert',canonicalId:'alert',placementId:'placement2'});
  expect(resolveCanonicalStatsTarget(targets,'/communities/unit/alert/another','placement1')).toBeNull();
 });

 it('retains eligible legacy links without claiming a canonical page occurrence',()=>{
  const row={id:'alert',canonicalId:'alert',placementId:'placed',pageId:'canonical-page',type:'alert' as const,title:'Alert',path:'/communities/unit/alert/desk?focus=placed',legacyPath:'/communities/unit/alerts/original',legacyMode:'tracked_page' as const,authorUserId:'a',authorName:'A',mode:'tracked_page' as const,state:'published' as const};
  expect(resolveCommunityStatsPage([row],'unit',row.legacyPath)).toMatchObject({id:'alert',path:row.legacyPath,pageId:undefined,placementId:undefined});
  expect(resolveCommunityStatsPage([{...row,legacyMode:'discord_post'}],'unit',row.legacyPath)).toBeNull();
 });

 it('does not credit a legacy placement hidden by a native board or document collection',()=>{
  db.exec("CREATE TABLE traderlink_community_alerts(community_id TEXT,alert_id TEXT,title TEXT,author_user_id TEXT,status TEXT,published_at_utc TEXT)");
  db.prepare("INSERT INTO traderlink_community_alerts VALUES('c','hidden','Hidden','a','published',?)").run(from);
  db.exec("INSERT INTO traderlink_community_content_placements VALUES('c','board','hidden-placement','alert','hidden','a',NULL,'published')");
  expect(resolveCanonicalStatsTarget(readCanonicalStatsTargets(db,scope),'/communities/unit/watchlist/board','hidden-placement')).toBeNull();
 });

});
