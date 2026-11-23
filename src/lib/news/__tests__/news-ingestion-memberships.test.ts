// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { fork } from "node:child_process";
vi.mock("@/src/modules/platform/server/membership/platform-membership-access", () => ({ assertMembershipFeature: () => {}, evaluateMembershipFeature: () => ({ allowed: true }) }));
vi.mock("@/src/modules/platform/server/membership/membership-news-delay", () => ({ readMembershipNewsDelaySeconds: () => 0 }));
import { upsertNewsArticle, resetNewsDatabaseForTests, getNewsArticle, type NewsArticleInput } from "../news-article-store";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { DEFAULT_NEWS_FILTERS } from "@/src/modules/news/contracts/press-release-filters";
import { listScannerRecentPressReleases } from "@/src/modules/news/server/scanner-recent-press-releases";
import { newsArticleIngestionMembershipsMigration } from "@/src/modules/news/server/database/migrations/0227_news_article_ingestion_memberships";
import { newsContentMigration } from "@/src/modules/news/server/database/migrations/0015_news_content";
const directory = mkdtempSync(join(tmpdir(), "news-memberships-")), path = join(directory, "synthetic.sqlite");
const publishedAt = new Date(Date.now() - 60_000).toISOString();
const cap = (id: string, extra: Partial<NewsArticleInput> = {}): NewsArticleInput => ({ sourceEventId: `${id}-cap`, ticker: "TEST", headline: "General headline", sourceUrl: `https://publisher.example/${id}`, routeTag: "market_cap_under_30m", publishedAt, metadata: { marketCap: "1.8 M", marketCapValue: 1_800_000, filing: { type: "8-K", missing: null } }, ...extra });
const scanner = (id: string, extra: Partial<NewsArticleInput> = {}): NewsArticleInput => ({ ...cap(id), sourceEventId: `${id}-scanner`, headline: "Reaction headline", summary: "Useful analysis", articleText: "Full PC-collected source text", positives: ["Useful positive"], negatives: ["Useful negative"], routeTag: "spike", metadata: { supportResistanceLevels: "Support $1.10", dilution: { risk: "high" } }, ...extra });
beforeAll(async () => { process.env.TRADERSLINK_NEWS_DB_PATH = path; await resetNewsDatabaseForTests(); });
afterAll(async () => { await resetNewsDatabaseForTests(); delete process.env.TRADERSLINK_NEWS_DB_PATH; rmSync(directory, { recursive: true, force: true }); });
function memberships(db: Database.Database, id: string) { return db.prepare("SELECT route_tag FROM news_article_category_memberships WHERE article_id=? ORDER BY route_tag").all(id); }
function setupReader(db: Database.Database) {
 db.exec(`CREATE TABLE IF NOT EXISTS platform_users(user_id TEXT,status TEXT); CREATE TABLE IF NOT EXISTS platform_workspaces(workspace_id TEXT,status TEXT); CREATE TABLE IF NOT EXISTS platform_workspace_memberships(user_id TEXT,workspace_id TEXT,status TEXT); CREATE TABLE IF NOT EXISTS news_article_read_receipts(article_id TEXT,user_id TEXT,read_at_utc TEXT,UNIQUE(article_id,user_id)); DELETE FROM platform_users; DELETE FROM platform_workspaces; DELETE FROM platform_workspace_memberships; INSERT INTO platform_users VALUES('member','active'); INSERT INTO platform_workspaces VALUES('workspace','active'); INSERT INTO platform_workspace_memberships VALUES('member','workspace','active');`);
 return { repository: new PressReleaseDashboardRepository(db), scope: { userId: "member", workspaceId: "workspace", workspaceRole: "member" as const, allowedAccountIds: [], activeAccountId: null } };
}
it.each(["cap-first", "scanner-first"])("preserves both destinations, useful fields and one public identity: %s", async order => {
 const inputs = order === "cap-first" ? [cap(order), scanner(order)] : [scanner(order), cap(order)];
 const first = await upsertNewsArticle(inputs[0]), second = await upsertNewsArticle(inputs[1]);
 expect(second.id).toBe(first.id); expect(second.slug).toBe(first.slug); expect(second.ticker).toBe(first.ticker);
 expect(second.summary).toBe("Useful analysis"); expect(second.articleText).toBe("Full PC-collected source text"); expect(second.positives).toEqual(["Useful positive"]);
 expect(second.metadata).toMatchObject({ marketCap: "1.8 M", marketCapValue: 1_800_000, supportResistanceLevels: "Support $1.10", dilution: { risk: "high" }, filing: { type: "8-K" } });
 const empty = await upsertNewsArticle(scanner(order, { summary: " ", articleText: "", positives: [], negatives: [], metadata: { supportResistanceLevels: "", dilution: { risk: null }, marketCapValue: 0, marketCap: "N/A" } }));
 expect(empty.revision).toBe(second.revision); expect(empty.summary).toBe(second.summary); expect(empty.metadata.supportResistanceLevels).toBe("Support $1.10"); expect(empty.metadata.dilution).toEqual({ risk: "high" }); expect(empty.metadata.marketCapValue).toBe(1_800_000);
 for (const input of [inputs[0], inputs[1], inputs[1]]) await upsertNewsArticle(input);
 const db = new Database(path); try {
  expect(db.prepare("SELECT count(*) n FROM news_articles WHERE id=?").get(first.id)).toEqual({ n: 1 });
  expect(memberships(db, first.id)).toEqual([{ route_tag: "market_cap_under_30m" }, { route_tag: "spike" }]);
  expect(db.prepare("SELECT count(*) n FROM news_article_source_events WHERE article_id=?").get(first.id)).toEqual({ n: 2 });
 } finally { db.close(); }
 await resetNewsDatabaseForTests(); const reloaded = await getNewsArticle(first.ticker, first.slug); expect(reloaded?.id).toBe(first.id);
 const reopened = new Database(path); try {
  const { repository: r, scope } = setupReader(reopened);
  for (const channel of ["all", "news_filtered", "market_cap_all", "market_cap_under_30m"] as const) {
   expect(r.list({ channel, scope }).filter(a => a.id === first.id)).toHaveLength(1);
   expect(r.listPage({ channel, scope, filters: { ...DEFAULT_NEWS_FILTERS, maxCap: "5" } }).articles.filter(a => a.id === first.id)).toHaveLength(1);
   expect(r.find({ channel, scope, articleId: first.id })?.id).toBe(first.id);
   expect(r.listHeadlines({ channel, scope, includePublishedAt: true }).filter(a => a.id === first.id)).toHaveLength(1);
   const plan = r.headlineQueryPlan({ channel, scope, includePublishedAt: true }); expect(reopened.prepare(plan.sql).all(...plan.parameters).filter((a: unknown) => (a as {id:string}).id === first.id)).toHaveLength(1);
  }
  reopened.prepare("UPDATE news_articles SET created_at=? WHERE id=?").run("2026-11-20T15:00:00.000Z",first.id);
  expect(listScannerRecentPressReleases(reopened, first.ticker, new Date("2026-11-20T16:00:00.000Z")).articles.filter(a=>a.id===first.id)).toHaveLength(1);
  const plan = r.unreadCountQueryPlan(scope); expect(reopened.prepare(plan.sql).get(...plan.parameters)).toEqual(r.unreadCounts(scope));
  r.markChannelRead({ channel: "market_cap_all", scope, readAtUtc: new Date().toISOString() }); expect(r.find({ channel: "news_filtered", scope, articleId: first.id })?.isRead).toBe(true);
 } finally { reopened.close(); }
});
it("does not erase useful raw source arrays with an empty later submission", async () => {
 const first=await upsertNewsArticle(cap("raw-array",{rawPayload:[{filingType:"8-K",source:"PC"}]}));
 const second=await upsertNewsArticle(scanner("raw-array",{rawPayload:[]}));
 expect(second.id).toBe(first.id);expect(second.rawPayload).toEqual([{filingType:"8-K",source:"PC"}]);
 const db=new Database(path);try {expect(JSON.parse((db.prepare("SELECT raw_payload_json FROM news_articles WHERE id=?").get(first.id) as {raw_payload_json:string}).raw_payload_json)).toEqual(second.rawPayload);}finally{db.close();}
});
it("matches URL across ticker/event differences but never headlines, and rejects reused event conflicts", async () => {
 const first = await upsertNewsArticle(cap("identity"));
 const other = await upsertNewsArticle(scanner("identity", { ticker: "OTHER", sourceUrl: "https://PUBLISHER.EXAMPLE/identity#fragment" }));
 expect([other.id, other.ticker, other.slug]).toEqual([first.id, first.ticker, first.slug]);
 const different = await upsertNewsArticle(cap("different", { headline: first.headline })); expect(different.id).not.toBe(first.id);
 await expect(upsertNewsArticle(cap("elsewhere", { sourceEventId: "identity-cap" }))).rejects.toThrow();
});
it("keeps general-only articles outside Scanner and supports all five market-cap tags", async () => {
 const tags = ["market_cap_under_30m", "market_cap_30m_to_50m", "market_cap_50m_to_100m", "market_cap_100m_to_300m", "market_cap_300m_to_500m"];
 for (const [i, tag] of tags.entries()) await upsertNewsArticle(cap(`range-${i}`, { routeTag: tag, metadata: { marketCap: `${[1.8,40,75,150,350][i]} M`, marketCapValue: [1.8,40,75,150,350][i] * 1e6 } }));
 const db = new Database(path); try { const { repository:r,scope }=setupReader(db);
  const all=r.list({channel:"market_cap_all",scope});for(let i=0;i<5;i++)expect(all.some(a=>a.sourceUrl===`https://publisher.example/range-${i}`)).toBe(true);
  expect(r.list({channel:"news_filtered",scope}).some(a=>a.sourceUrl?.includes("/range-"))).toBe(false);
 } finally { db.close(); }
});
it("migrates recorded historic memberships without changing article/version bytes and fails closed on URL collisions", () => {
 const current=new Database(path);const row=current.prepare("SELECT * FROM news_articles WHERE source_url=?").get("https://publisher.example/cap-first") as Record<string,unknown>;
 const versions=current.prepare("SELECT * FROM news_article_versions WHERE article_id=? ORDER BY revision").all(row.id) as Record<string,unknown>[];current.close();
 const insert=(db:Database.Database,table:string,value:Record<string,unknown>)=>db.prepare(`INSERT INTO ${table} (${Object.keys(value).join(",")}) VALUES (${Object.keys(value).map(()=>"?").join(",")})`).run(...Object.values(value));
 const legacy=()=>{const db=new Database(":memory:");for(const sql of newsContentMigration.statements)db.exec(sql);insert(db,"news_articles",row);for(const version of versions)insert(db,"news_article_versions",version);return db;};
 const db=legacy();try {
  db.transaction(()=>{for(const sql of newsArticleIngestionMembershipsMigration.statements)db.exec(sql);})();
  expect(db.prepare("SELECT * FROM news_articles").get()).toEqual(row);
  expect(db.prepare("SELECT * FROM news_article_versions ORDER BY revision").all()).toEqual(versions);
  expect(memberships(db,String(row.id))).toEqual([{route_tag:"market_cap_under_30m"},{route_tag:"spike"}]);
 }finally{db.close();}
 const conflict=legacy();try {
  insert(conflict,"news_articles",{...row,id:"historic-duplicate",source_event_id:"other-event",ticker:"OTHER",slug:"different-published-slug",canonical_source_key:String(row.canonical_source_key).replace(/^TEST\|/,"OTHER|")});
  expect(()=>conflict.transaction(()=>{for(const sql of newsArticleIngestionMembershipsMigration.statements)conflict.exec(sql);})()).toThrow();
  expect(conflict.prepare("SELECT name FROM sqlite_master WHERE name='news_article_source_urls'").get()).toBeUndefined();
  expect(conflict.prepare("SELECT count(*) n FROM news_articles").get()).toEqual({n:2});
 }finally{conflict.close();}
});
it("serializes independent concurrent arrivals against one file", async () => {
 const seed=await upsertNewsArticle(cap("concurrent-seed"));expect(seed.id).toBeTruthy();await resetNewsDatabaseForTests();
 const children=[cap("concurrent"),scanner("concurrent")].map(input=>fork(join(process.cwd(),"src/lib/news/__tests__/news-ingestion-child.cjs"),[],{env:{...process.env,NODE_ENV:"test",TRADERSLINK_NEWS_DB_PATH:path},stdio:["ignore","pipe","pipe","ipc"],execArgv:["--max-old-space-size=384"]}));
 let errors="";children.forEach(c=>c.stderr?.on("data",d=>{errors+=d.toString();}));
 const completed=children.map(child=>new Promise<void>((resolve,reject)=>{child.once("error",reject);child.once("exit",code=>code===0?resolve():reject(new Error(errors||`child ${code}`)));}));
 const ready=children.map(child=>new Promise<void>((resolve,reject)=>{child.once("message",()=>resolve());child.once("error",reject);child.once("exit",code=>reject(new Error(errors||`child exited before ready: ${code}`)));}));
 try {
  await Promise.race([Promise.all(ready), Promise.all(completed).then(() => { throw new Error("children exited before dispatch"); })]);
  children.forEach((child,i)=>child.send([cap("concurrent"),scanner("concurrent")][i]));
  await Promise.all(completed);
 } finally {for(const child of children)if(child.exitCode===null)child.kill();await Promise.allSettled(completed);}

 const db=new Database(path);try {const row=db.prepare("SELECT id FROM news_articles WHERE source_url=?").get("https://publisher.example/concurrent") as {id:string};expect(row).toBeTruthy();expect(memberships(db,row.id)).toHaveLength(2);expect(db.prepare("SELECT count(*) n FROM news_articles WHERE source_url=?").get("https://publisher.example/concurrent")).toEqual({n:1});}finally{db.close();}
},30000);
