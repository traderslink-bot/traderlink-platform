// @vitest-environment node
import Database from "better-sqlite3";
import { writeFileSync, mkdirSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { DEFAULT_NEWS_FILTERS, easternDayStart, marketCapUsd, parseNewsFilters } from "../contracts/press-release-filters";
const state = vi.hoisted(() => ({ filters: true, access: true, delay: 0 }));
vi.mock("../../platform/server/membership/platform-membership-access", () => ({
  assertMembershipFeature: () => { if (!state.access) throw new Error("Access denied"); },
  evaluateMembershipFeature: () => ({ allowed: state.filters }),
}));
vi.mock("../../platform/server/membership/membership-news-delay", () => ({ readMembershipNewsDelaySeconds: () => state.delay }));
import { PressReleaseDashboardRepository } from "./press-release-dashboard-repository";
const opened: Database.Database[] = [];
afterEach(() => { opened.splice(0).forEach(db => db.close()); Object.assign(state, { filters: true, access: true, delay: 0 }); });
function fixture() {
  const db = new Database(":memory:"); opened.push(db);
  db.exec(`CREATE TABLE platform_users(user_id TEXT,status TEXT); CREATE TABLE platform_workspaces(workspace_id TEXT,status TEXT);
    CREATE TABLE platform_workspace_memberships(user_id TEXT,workspace_id TEXT,status TEXT);
    INSERT INTO platform_users VALUES('one','active'),('two','active'); INSERT INTO platform_workspaces VALUES('workspace','active');
    INSERT INTO platform_workspace_memberships VALUES('one','workspace','active'),('two','workspace','active');
    CREATE TABLE news_article_read_receipts(article_id TEXT,user_id TEXT,read_at_utc TEXT);
    CREATE TABLE news_articles(id TEXT PRIMARY KEY,ticker TEXT,slug TEXT,headline TEXT,summary TEXT,article_text TEXT,source_url TEXT,event_type TEXT,route_tag TEXT,published_at TEXT,created_at TEXT,metadata_json TEXT,positives_json TEXT,negatives_json TEXT,risk_flags_json TEXT);`);
  const insert = db.prepare("INSERT INTO news_articles VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  const add = (id: string, cap: string | null, options: { summary?: string | null; ticker?: string; type?: string; date?: string; tag?: string } = {}) => insert.run(id, options.ticker ?? "TEST", id, `Release ${id}`, options.summary === undefined ? "Actual summary" : options.summary, null, "https://news.nuntiobot.com/story", options.type ?? "press_release", options.tag ?? "default", options.date ?? "2026-01-01T16:00:00.000Z", options.date ?? "2026-01-01T16:00:00.000Z", JSON.stringify({ marketCap: cap }), '[]', '[]', '[]');
  const scope = { userId: "one", workspaceId: "workspace", workspaceRole: "owner" as const, allowedAccountIds: [], activeAccountId: null };
  const repo = new PressReleaseDashboardRepository(db);
  return { db, add, scope, read: (filters: unknown = DEFAULT_NEWS_FILTERS, offset = 0, asOf?: string) => repo.listPage({ channel: "all", scope, filters, offset, asOf, limit: 100 }) };
}
it('filters the stored population before pagination, with stable cap ordering and unknown values last', () => {
  const f = fixture(); for (let i = 0; i < 180; i++) f.add(`recent${i}`, "$50M", { date: "2026-01-10T12:00:00.000Z" });
  f.add('old-match', '$20M'); f.add('unknown', null); f.add('boundary', '$30M');
  expect(f.read({ ...DEFAULT_NEWS_FILTERS, maxCap: '30' }).articles.map(a => a.id)).toEqual(['old-match']);
  expect(f.read({ ...DEFAULT_NEWS_FILTERS, sort: 'cap_asc' }).articles[0].id).toBe('old-match');
  const first = f.read({ ...DEFAULT_NEWS_FILTERS, sort: 'cap_desc' });
  expect(first.more).toBe(true); const rest = f.read({ ...DEFAULT_NEWS_FILTERS, sort: 'cap_desc' },100,first.asOf);
  expect(rest.articles.at(-1)?.id).toBe('unknown');
  expect(new Set([...first.articles,...rest.articles].map(a => a.id)).size).toBe(183);
});
it('combines exact tickers, keywords and dates while ignoring retired criteria', () => {
  const f=fixture(); f.add('match','$10M',{ticker:'ABCD',summary:null,type:'press_release_earnings'}); f.add('other','$10M',{ticker:'OTHER'});
  expect(f.read({...DEFAULT_NEWS_FILTERS,tickers:'abcd',search:'match',type:'earnings',summary:'unavailable',from:'2026-01-01',to:'2026-01-01'}).articles.map(a=>a.id)).toEqual(['match']);
});
it('isolates read state by user and enforces account access and delayed visibility', () => {
  const f=fixture();f.add('read','$10M');f.add('other','$20M');f.db.prepare('INSERT INTO news_article_read_receipts VALUES(?,?,?)').run('read','two','2020-01-01T00:00:00.000Z');
  expect(f.read({...DEFAULT_NEWS_FILTERS,read:'read'}).articles).toHaveLength(0);
  f.db.prepare('INSERT INTO news_article_read_receipts VALUES(?,?,?)').run('read','one','2020-01-01T00:00:00.000Z');
  expect(f.read({...DEFAULT_NEWS_FILTERS,read:'read'}).articles.map(a=>a.id)).toEqual(['read']);
  f.add('held','$10M',{date:new Date().toISOString()});state.delay=86400;
  expect(f.read().articles.some(a=>a.id==='held')).toBe(false);
  state.access=false;expect(()=>f.read()).toThrow('Access denied');
});
it('ignores forged filters after enforcement denies the capability, without denying the basic feed', () => {
  const f=fixture(); f.add('one','$10M');state.filters=false;
  const result=f.read({...DEFAULT_NEWS_FILTERS,search:'no matches',sort:'oldest'});
  expect(result.filtersAllowed).toBe(false);expect(result.articles).toHaveLength(1);
  f.scope.userId='outsider';expect(()=>f.read()).toThrow();
});
it('rejects malformed input and preserves injection text as bound search values', () => {
  const f=fixture();f.add('one','$10M');expect(f.read({...DEFAULT_NEWS_FILTERS,search:"' OR 1=1 --"}).articles).toHaveLength(0);
  for (const input of [{sort:'id; DROP TABLE news_articles'}, {tickers:"ABC')--"}, {minCap:'50',maxCap:'30'}, {from:'2026-02-30'}, {capStatus:'unknown',minCap:'1'}]) expect(()=>parseNewsFilters(input)).toThrow();
  expect(()=>f.read(DEFAULT_NEWS_FILTERS,-1)).toThrow();expect(()=>f.read(DEFAULT_NEWS_FILTERS,0,'2999-01-01T00:00:00.000Z')).toThrow();
});
it('uses recorded USD values or explicit display suffixes and Eastern DST-aware boundaries', () => {
  expect(marketCapUsd('$1.5B')).toBe(1500000000);expect(marketCapUsd('123')).toBeNull();expect(marketCapUsd('N/A',12345678)).toBe(12345678);
  expect(marketCapUsd('$50M', 0)).toBe(50000000);
  expect(marketCapUsd('$50M', '50')).toBe(50000000);
  expect(marketCapUsd('$50M', 50000000)).toBe(50000000);
  expect(marketCapUsd('$1.5B', 1500)).toBe(1500000000);
  expect(marketCapUsd('5.00 M', 4999999)).toBe(4999999);
  expect(marketCapUsd('144 M', 144123456)).toBe(144123456);
  expect(marketCapUsd('N/A', 0)).toBeNull();
  expect(marketCapUsd(null, '12345678')).toBe(12345678);
  expect(easternDayStart('2026-03-08')).toBe('2026-03-08T05:00:00.000Z');expect(easternDayStart('2026-03-08',true)).toBe('2026-03-09T04:00:00.000Z');
  expect(easternDayStart('2026-11-01')).toBe('2026-11-01T04:00:00.000Z');expect(easternDayStart('2026-11-01',true)).toBe('2026-11-02T05:00:00.000Z');
});

it('keeps unread paging stable when an article is read between pages', () => {
 const f=fixture();for(let i=0;i<101;i++)f.add(String(i).padStart(3,'0'),'$10M');
 const filters={...DEFAULT_NEWS_FILTERS,read:'unread' as const};const first=f.read(filters);
 f.db.prepare('INSERT INTO news_article_read_receipts VALUES(?,?,?)').run(first.articles[0].id,'one',new Date(Date.parse(first.asOf)+1).toISOString());
 f.db.prepare('INSERT INTO news_article_read_receipts VALUES(?,?,?)').run('100','one',new Date(Date.parse(first.asOf)+1).toISOString());
 const next=f.read(filters,100,first.asOf);expect(next.articles.map(a=>a.id)).toEqual(['100']);expect(next.articles[0].isRead).toBe(true);
});

it('qualifies cap sorting over a production-sized synthetic population without a migration', () => {
 const f=fixture(); f.db.transaction(()=>{for(let i=0;i<12000;i++)f.add(String(i).padStart(5,'0'),`$${i%400+1}M`);})();
 const start=performance.now(); const page=f.read({...DEFAULT_NEWS_FILTERS,sort:'cap_asc',minCap:'100',maxCap:'300'});
 expect(page.articles).toHaveLength(100);expect(page.more).toBe(true);
 const evidence={qualification:'synthetic SQLite eligible feed',population:12000,queryMilliseconds:Math.round((performance.now()-start)*100)/100,order:'cap_asc',filters:'100M<=cap<300M',migration:false};
 mkdirSync('/tmp/traderlink-news-unified-qa-20261118',{recursive:true});writeFileSync('/tmp/traderlink-news-unified-qa-20261118/query-performance.json',JSON.stringify(evidence,null,2));
});

it.each(['zero placeholder', 'legacy millions'])('uses displayed cap units with %s numeric metadata', representation => {
  const f = fixture();
  for (const [id, display, numeric] of [
    ['nano', '260 k', 0.26], ['below-five', '2.7 M', 2.7], ['five', '5.0 M', 5], ['twenty', '14.0 M', 14],
    ['thirty', '30.0 M', 30], ['fifty', '46.0 M', 46], ['billion', '1.2 B', 1200],
  ] as const) {
    f.add(id, display);
    f.db.prepare('UPDATE news_articles SET metadata_json=? WHERE id=?')
      .run(JSON.stringify({ marketCap: display, marketCapValue: representation === 'zero placeholder' ? 0 : numeric }), id);
  }
  expect(f.read({ ...DEFAULT_NEWS_FILTERS, maxCap: '5' }).articles.map(a => a.id)).toEqual(['below-five', 'nano']);
  expect(f.read({ ...DEFAULT_NEWS_FILTERS, maxCap: '30' }).articles.map(a => a.id)).toEqual(['below-five', 'five', 'nano', 'twenty']);
  expect(f.read({ ...DEFAULT_NEWS_FILTERS, minCap: '30', sort: 'cap_asc' }).articles.map(a => a.id)).toEqual(['thirty', 'fifty', 'billion']);
});

it('supports every offered sort and recorded category with deterministic time/ID ties',()=>{
 const f=fixture();f.add('a','$50M',{ticker:'ZZZ',type:'press_release_financing'});f.add('b','$20M',{ticker:'AAA',type:'sec_current_report'});f.add('c',null,{ticker:'AAA',date:'2026-01-02T16:00:00.000Z'});
 expect(f.read({...DEFAULT_NEWS_FILTERS,sort:'oldest'}).articles.map(a=>a.id)).toEqual(['a','b','c']);
 expect(f.read({...DEFAULT_NEWS_FILTERS,sort:'ticker'}).articles.map(a=>a.id)).toEqual(['c','b','a']);
 expect(f.read({...DEFAULT_NEWS_FILTERS,type:'financing'}).articles).toHaveLength(3);
 expect(f.read({...DEFAULT_NEWS_FILTERS,type:'sec'}).articles).toHaveLength(3);
 expect(f.read({...DEFAULT_NEWS_FILTERS,capStatus:'unknown'}).articles.map(a=>a.id)).toEqual(['c']);
 expect(f.read({...DEFAULT_NEWS_FILTERS,capStatus:'known',summary:'available'}).articles.map(a=>a.id)).toEqual(['a','b']);
});
it('keeps a relative-date pagination snapshot stable across Eastern midnight',()=>{
 vi.useFakeTimers({toFake:['Date']});
 try{
  vi.setSystemTime(new Date('2026-01-11T04:59:00.000Z'));
  const f=fixture();for(let i=0;i<180;i++)f.add('day-'+i,'$20M',{date:'2026-01-10T16:00:00.000Z'});
  f.add('next-day','$20M',{date:'2026-01-11T05:00:00.000Z'});
  const filters={...DEFAULT_NEWS_FILTERS,datePeriod:'today'},first=f.read(filters);
  expect(first.articles).toHaveLength(100);
  vi.setSystemTime(new Date('2026-01-11T05:01:00.000Z'));
  const second=f.read(filters,first.nextOffset,first.asOf);
  expect(second.articles).toHaveLength(80);expect(second.articles.some(article=>article.id==='next-day')).toBe(false);
 }finally{vi.useRealTimers();}
});

it("keeps the restored PR Scanner channel isolated across filtered pagination while the unified feed retains all channels",()=>{
 const f=fixture();f.add("scanner-old","$2M",{tag:"default",date:"2026-01-01T12:00:00.000Z"});f.add("scanner-new","$3M",{tag:"spike",date:"2026-01-02T12:00:00.000Z"});f.add("other-channel","$1M",{tag:"market_cap_under_30m"});
 const repository=new PressReleaseDashboardRepository(f.db), first=repository.listPage({channel:"news_filtered",scope:f.scope,limit:1,filters:{...DEFAULT_NEWS_FILTERS,maxCap:"5"}});
 expect(first.articles.map(row=>row.id)).toEqual(["scanner-new"]);expect(first.more).toBe(true);
 const second=repository.listPage({channel:"news_filtered",scope:f.scope,limit:1,filters:first.filters,asOf:first.asOf,offset:first.nextOffset});
 expect(second.articles.map(row=>row.id)).toEqual(["scanner-old"]);expect(second.more).toBe(false);
 expect(f.read().articles.map(row=>row.id)).toContain("other-channel");
});

it('ignores retired type and summary criteria without dropping factual market-cap filtering', () => {
 const f=fixture();f.add('summary','$2M',{type:'press_release',summary:'PC summary'});f.add('source-only','$3M',{type:'sec_current_report',summary:null});f.add('outside','$40M');
 const filters={...DEFAULT_NEWS_FILTERS,maxCap:'5',type:'earnings',summary:'available'};
 expect(f.read(filters).articles.map(a=>a.id).sort()).toEqual(['source-only','summary']);
 expect(parseNewsFilters(filters)).not.toHaveProperty('type');expect(parseNewsFilters(filters)).not.toHaveProperty('summary');
});
