// @vitest-environment node
// Real event/identity/member/traffic transactions; metadata/auth ports are explicit synthetic inputs.
import Database from "better-sqlite3";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import type {CommunityStatsContent,CommunityStatsRequestScope} from "../../contracts/community-stats-contracts";
const ports=vi.hoisted(()=>({targets:[] as CommunityStatsContent[]}));
vi.mock('./community-stats-content-targets',async original=>({...await original<typeof import('./community-stats-content-targets')>(),readCanonicalStatsTargets:()=>ports.targets}));
vi.mock('../traderlink-community-repository',()=>({TraderLinkCommunityRepository:class{requireCapability(){return {isOwner:true,capabilities:[]};}}}));
vi.mock('./community-stats-catalog',()=>({readCommunityStatsCatalog:()=>[],resolveCommunityStatsPage:()=>null}));
vi.mock('./community-stats-repository',async original=>({...await original<typeof import('./community-stats-repository')>(),communityStatsStorageReady:()=>true}));
vi.mock('./community-stats-invites',()=>({statsAttributionReady:()=>true}));
vi.mock('./community-stats-identity',()=>({resolveOwnCommunityStatsIdentity:(_db:unknown,x:{authenticatedUserId:string})=>({state:'verified',identity:{communityId:'c',guildId:'g',discordUserId:x.authenticatedUserId==='b'?'67890':'12345',platformUserId:x.authenticatedUserId,username:'Member',globalDisplayName:'Member',guildNickname:null,nicknameAvailability:'not_collected',observedAtUtc:'2026-02-01T00:00:00.000Z'}})}));
import {recordCommunityStatsVisit as recordVisit} from './community-stats-visits';
// Explicit synthetic request-auth port; production has no default guard.
function recordCommunityStatsVisit(db:Database.Database,scope:CommunityStatsRequestScope,body:unknown,at:string,host='',guard:()=>void=()=>{}){return recordVisit(db,scope,body,at,host,guard);}
let db:Database.Database;
const at='2026-02-01T00:00:00.000Z',scope:CommunityStatsRequestScope={communityId:'c',slug:'unit',communityName:'Unit',guildId:'g',actorUserId:'a',isOwner:true,canReadNamed:true,canExport:true,ownContentOnly:false,capabilities:[],discordRoleIds:[],readableChannelIds:[]};
const target:CommunityStatsContent={id:'watchlist-item:i',canonicalId:'i',pageId:'page',targetKind:'watchlist_item',type:'watchlist',title:'ABC',path:'/communities/unit/watchlist/board?focus=i',state:'published',mode:'tracked_page',authorUserId:null,authorName:null,publisherUserId:'publisher'};
const body={path:'/communities/unit/watchlist/board',focus:'i',navigationId:'10000000-0000-4000-8000-000000000001',campaignSource:'discord'};
beforeEach(()=>{vi.stubEnv('TRADERLINK_COMMUNITY_STATS_ENABLED','1');ports.targets=[target];db=new Database(':memory:');db.exec(`
CREATE TABLE traderlink_communities(community_id TEXT,slug TEXT,discord_guild_id TEXT,status TEXT);
INSERT INTO traderlink_communities VALUES('c','unit','g','active');
CREATE TABLE community_stats_events(community_id TEXT,event_id TEXT,discord_user_id TEXT,platform_user_id TEXT,surface TEXT,kind TEXT,occurred_at_utc TEXT,received_at_utc TEXT,content_id TEXT,content_type TEXT,title TEXT,path TEXT,author_user_id TEXT,username TEXT,display_name TEXT,nickname TEXT,identity_observed_at_utc TEXT,channel_id TEXT,duration_seconds INTEGER,reply_to_event_id TEXT,reply_delay_seconds REAL,source_link_id TEXT,canonical_content_id TEXT,placement_id TEXT,nickname_state TEXT,page_id TEXT,category_id TEXT,publisher_user_id TEXT,PRIMARY KEY(community_id,event_id));
CREATE TABLE community_stats_source_state(community_id TEXT,source TEXT,last_event_at_utc TEXT);
CREATE TABLE community_stats_settings(community_id TEXT PRIMARY KEY,created_at_utc TEXT,updated_at_utc TEXT);
CREATE TABLE community_stats_members(community_id TEXT,discord_user_id TEXT,username TEXT,display_name TEXT,nickname TEXT,role_ids_json TEXT,is_bot INTEGER,active INTEGER,joined_at_utc TEXT,first_observed_at_utc TEXT,last_observed_at_utc TEXT,PRIMARY KEY(community_id,discord_user_id));
CREATE TABLE community_stats_memberships(community_id TEXT,discord_user_id TEXT,from_utc TEXT,joined_at_utc TEXT,join_kind TEXT,until_utc TEXT,end_kind TEXT,PRIMARY KEY(community_id,discord_user_id,from_utc));
CREATE TABLE community_stats_identity_links(community_id TEXT,platform_user_id TEXT,discord_user_id TEXT,from_utc TEXT,until_utc TEXT);
CREATE TABLE community_stats_traffic_sources(community_id TEXT,event_id TEXT,category TEXT,source TEXT,referrer_host TEXT,campaign_source TEXT,campaign_medium TEXT,campaign_name TEXT,PRIMARY KEY(community_id,event_id));`);});
afterEach(()=>{db.close();vi.unstubAllEnvs();});
const count=(table:string)=>(db.prepare(`SELECT count(*) n FROM ${table}`).get() as {n:number}).n;
describe('one canonical navigation transaction',()=>{
 it('deduplicates a StrictMode/retry UUID with exactly one traffic row',()=>{
  expect(recordCommunityStatsVisit(db,scope,body,at)).toBe('recorded');expect(recordCommunityStatsVisit(db,scope,body,at)).toBe('duplicate');
  expect(count('community_stats_events')).toBe(1);expect(count('community_stats_traffic_sources')).toBe(1);
  expect(db.prepare('SELECT author_user_id,publisher_user_id,page_id,canonical_content_id FROM community_stats_events').get()).toEqual({author_user_id:null,publisher_user_id:'publisher',page_id:'page',canonical_content_id:'i'});
 });
 it('refuses a same-actor UUID reused for another occurrence, while another actor has its own namespace',()=>{
  recordCommunityStatsVisit(db,scope,body,at);ports.targets=[{...target,pageId:'other'}];
  expect(recordCommunityStatsVisit(db,scope,body,at)).toBe('not_eligible');
  expect(recordCommunityStatsVisit(db,{...scope,actorUserId:'b'},body,at)).toBe('recorded');expect(count('community_stats_events')).toBe(2);
 });
 it.each(['actorUserId','authorUserId','sessionId','scope'])('rejects forged %s authority',key=>{
  expect(recordCommunityStatsVisit(db,scope,{...body,[key]:'attacker'},at)).toBe('not_eligible');expect(count('community_stats_events')).toBe(0);
 });
 it('records an authorless board once without fanning out to visible items',()=>{
  ports.targets.push({...target,id:'page',path:'/communities/unit/watchlist/board',canonicalId:undefined,targetKind:'page',publisherUserId:null});
  expect(recordCommunityStatsVisit(db,scope,{...body,focus:undefined},at)).toBe('recorded');
  expect(db.prepare('SELECT content_id,author_user_id FROM community_stats_events').all()).toEqual([{content_id:'page',author_user_id:null}]);
 });
 it('rolls back identity/member/event changes when traffic persistence fails',()=>{
  db.exec("CREATE TRIGGER reject_traffic BEFORE INSERT ON community_stats_traffic_sources BEGIN SELECT RAISE(ABORT,'synthetic traffic failure');END");
  expect(()=>recordCommunityStatsVisit(db,scope,body,at)).toThrow('synthetic traffic failure');
  for(const table of ['community_stats_events','community_stats_identity_links','community_stats_members','community_stats_traffic_sources'])expect(count(table)).toBe(0);
 });
 it('rejects unknown focus without replacing it with a misleading page event',()=>{
  expect(recordCommunityStatsVisit(db,scope,{...body,focus:'other'},at)).toBe('not_eligible');expect(count('community_stats_events')).toBe(0);
 });
 it('runs the original-request guard under the actual writer transaction before any identity/event write',()=>{
  let inTransaction=false;
  expect(()=>recordCommunityStatsVisit(db,scope,body,at,'',()=>{inTransaction=db.inTransaction;throw Error('original session revoked');})).toThrow('original session revoked');
  expect(inTransaction).toBe(true);expect(count('community_stats_identity_links')).toBe(0);expect(count('community_stats_events')).toBe(0);
 });
 it('refuses a relinked or renamed community before consuming stale metadata',()=>{
  db.exec("UPDATE traderlink_communities SET discord_guild_id='another'");
  expect(recordCommunityStatsVisit(db,scope,body,at)).toBe('not_eligible');expect(count('community_stats_events')).toBe(0);
 });

 it('cannot use an omitted request guard as a default admission',()=>{
  expect(()=>recordVisit(db,scope,body,at,'',undefined as unknown as ()=>void)).toThrow();expect(count('community_stats_events')).toBe(0);
 });

});
