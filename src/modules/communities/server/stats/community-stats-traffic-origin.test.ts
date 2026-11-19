// @vitest-environment node
// Local HTTP glue + disposable SQLite projections only. Authentication ports
// are stubbed; this is not hosted/native authorization or provider proof.
import Database from "better-sqlite3";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
const ports=vi.hoisted(()=>({close:vi.fn(),open:vi.fn(),identity:vi.fn(),authorize:vi.fn(),record:vi.fn()}));
vi.mock("../../../platform/server/authentication/require-platform-request-scope",()=>({requireTraderLinkPlatformRequestIdentity:ports.identity}));
vi.mock("../community-owner-review-request-identity",()=>({requireCommunityOwnerReviewIdentity:(identity:unknown)=>identity}));
vi.mock("../../../platform/server/database/open-platform-database",()=>({openPlatformDatabase:ports.open}));
vi.mock("./community-stats-access",async original=>({...await original<typeof import("./community-stats-access")>(),authorizeCommunityStats:ports.authorize}));
vi.mock("./community-stats-visits",()=>({recordCommunityStatsVisit:ports.record}));
import {POST} from "@/app/api/communities/[communitySlug]/stats/visits/route";
import {statsTrafficProjection} from "./community-stats-attribution-report";
import {statsConfiguredPublicHostname} from "./community-stats-public-origin";
import {normalizeStatsTrafficSource} from "../../contracts/community-stats-traffic-source";
const publicOrigin="https://app.traderslink.pro",USER="10000000-0000-4000-8000-000000000001",COMMUNITY="10000000-0000-4000-8000-000000000002";
const dbs:Database.Database[]=[];
function request(referrerHost="app.traderslink.pro",origin=publicOrigin,site="same-origin"){
 return new Request("http://0.0.0.0:8080/api/communities/unit/stats/visits",{method:"POST",headers:{origin,host:"app.traderslink.pro","sec-fetch-site":site,"x-forwarded-host":"attacker.example","content-type":"application/json"},body:JSON.stringify({path:"/communities/unit",navigationId:"10000000-0000-4000-8000-000000000003",referrerHost})});
}
function fixture(){const db=new Database(":memory:");dbs.push(db);db.exec(`CREATE TABLE community_stats_events(community_id TEXT,event_id TEXT,source_link_id TEXT);
 CREATE TABLE community_stats_traffic_sources(community_id TEXT,event_id TEXT,category TEXT,source TEXT,referrer_host TEXT,campaign_source TEXT,campaign_medium TEXT,campaign_name TEXT);
 CREATE TABLE community_stats_invites(x TEXT);CREATE TABLE community_stats_invite_joins(x TEXT);CREATE TABLE community_stats_attribution_state(x TEXT);CREATE TABLE community_stats_invite_usage(x TEXT);`);
 const insert=db.prepare("INSERT INTO community_stats_traffic_sources VALUES('unit',?,?,?,?,?,?,?)");
 for(const [id,category,source,host,campaign,medium,name]of [["self","Referral","app.traderslink.pro","APP.TRADERSLINK.PRO",null,null,null],["external","Referral","other.example","other.example",null,null,null],["campaign","Campaign","newsletter","app.traderslink.pro","newsletter","email","weekly"],["ambiguous","Referral","legacy-campaign","app.traderslink.pro","legacy-campaign",null,null],["mismatched-source","Referral","third.example","app.traderslink.pro",null,null,null]]as const){db.prepare("INSERT INTO community_stats_events VALUES('unit',?,NULL)").run(id);insert.run(id,category,source,host,campaign,medium,name);}return db;}
function projection(db:Database.Database,id:string){return db.prepare(`SELECT ${statsTrafficProjection(db,"source")} AS source,${statsTrafficProjection(db,"category")} AS category,${statsTrafficProjection(db,"campaign_name")} AS campaign FROM community_stats_events WHERE event_id=?`).get(id);}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv("NODE_ENV","production");vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN",undefined);vi.stubEnv("DISCORD_REDIRECT_URI",publicOrigin+"/api/auth/discord/callback");vi.stubEnv("TRADERLINK_COMMUNITY_STATS_ENABLED","1");ports.identity.mockReturnValue({scope:{userId:USER}});ports.open.mockReturnValue({close:ports.close});ports.authorize.mockResolvedValue({communityId:COMMUNITY,actorUserId:USER});ports.record.mockReturnValue("recorded");});
afterEach(()=>{vi.unstubAllEnvs();for(const db of dbs.splice(0))db.close();});
describe("Stats traffic canonical origin behind the deployment proxy",()=>{
 it("passes the validated public host to actual route collection despite the internal request URL",async()=>{const response=await POST(request(),{params:Promise.resolve({communitySlug:"unit"})});expect(response.status).toBe(202);const args=ports.record.mock.calls[0];expect(args[4]).toBe("app.traderslink.pro");expect(normalizeStatsTrafficSource(args[2],args[4])).toMatchObject({category:"Internal",source:"Internal"});expect(ports.close).toHaveBeenCalledOnce();});
 it("uses explicit canonical configuration and keeps true external referrals external",async()=>{vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","https://review.example");const response=await POST(request("other.example","https://review.example"),{params:Promise.resolve({communitySlug:"unit"})});expect(response.status).toBe(202);const args=ports.record.mock.calls[0];expect(args[4]).toBe("review.example");expect(normalizeStatsTrafficSource(args[2],args[4])).toMatchObject({category:"Referral",source:"other.example"});});
 it("does not weaken the existing same-origin guard",async()=>{const response=await POST(request("app.traderslink.pro",publicOrigin,"cross-site"),{params:Promise.resolve({communitySlug:"unit"})});expect(response.status).toBe(404);expect(ports.open).not.toHaveBeenCalled();expect(ports.record).not.toHaveBeenCalled();});
 it("corrects only derived historical untagged self-referrals without rewriting stored rows",()=>{const db=fixture(),before=db.prepare("SELECT * FROM community_stats_traffic_sources ORDER BY event_id").all();expect(projection(db,"self")).toMatchObject({source:"Internal",category:"Internal"});expect(projection(db,"external")).toMatchObject({source:"other.example",category:"Referral"});expect(projection(db,"campaign")).toMatchObject({source:"newsletter",category:"Campaign",campaign:"weekly"});expect(projection(db,"ambiguous")).toMatchObject({source:"legacy-campaign",category:"Referral"});expect(projection(db,"mismatched-source")).toMatchObject({source:"third.example",category:"Referral"});expect(db.prepare("SELECT * FROM community_stats_traffic_sources ORDER BY event_id").all()).toEqual(before);});
 it("does not guess a canonical host when none is configured",()=>{vi.stubEnv("NODE_ENV","test");vi.stubEnv("DISCORD_REDIRECT_URI",undefined);const db=fixture();expect(statsConfiguredPublicHostname()).toBeNull();expect(projection(db,"self")).toMatchObject({source:"app.traderslink.pro",category:"Referral"});});
 it("preserves validated explicit loopback and isolated preview origins",()=>{vi.stubEnv("NODE_ENV","development");vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","http://127.0.0.1:3032");expect(statsConfiguredPublicHostname()).toBe("127.0.0.1");vi.stubEnv("TRADERLINK_PRIVATE_LIVE_PREVIEW","coaching");vi.stubEnv("TRADERLINK_PRIVATE_LIVE_PREVIEW_ORIGIN","https://traderlink-live-preview.tail41b7ab.ts.net");expect(statsConfiguredPublicHostname()).toBe("traderlink-live-preview.tail41b7ab.ts.net");});
});
