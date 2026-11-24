// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { beforeAll, afterAll, expect, it } from "vitest";
import { newsContentMigration } from "@/src/modules/news/server/database/migrations/0015_news_content";
import { newsArticleIngestionMembershipsMigration } from "@/src/modules/news/server/database/migrations/0227_news_article_ingestion_memberships";
import { calculateNewsArticleContentSha256, getNewsArticle, resetNewsDatabaseForTests, upsertNewsArticle, type NewsArticleInput } from "../news-article-store";
const dir=mkdtempSync(join(tmpdir(),"news-legacy-aliases-")),file=join(dir,"synthetic.sqlite");
const definitions=[
 {id:'cap-a',ticker:'AAA',url:'shared',route:'market_cap_under_30m',created:'2026-11-19T10:00:00.000Z'},
 {id:'z-scanner',ticker:'BBB',url:'shared',route:'spike',created:'2026-11-20T10:00:00.000Z'},
 {id:'a-scanner',ticker:'CCC',url:'shared',route:'default',created:'2026-11-20T10:00:00.000Z'},
 {id:'new-cap',ticker:'DDD',url:'other',route:'market_cap_30m_to_50m',created:'2026-11-21T10:00:00.000Z'},
 {id:'old-cap',ticker:'EEE',url:'other',route:'market_cap_50m_to_100m',created:'2026-11-18T10:00:00.000Z'},
];
function facts(d:typeof definitions[number]) {
 const sourceUrl=`https://publisher.example/${d.url}`;
 return {sourceEventId:`event-${d.id}`,canonicalSourceKey:`${d.ticker}|${sourceUrl}`,ticker:d.ticker,slug:`legacy-${d.ticker}`,headline:`Original ${d.ticker}`,summary:`Summary ${d.ticker}`,articleText:`PC text ${d.ticker}`,sourceUrl,eventType:'press_release',routeTag:d.route,publishedAt:d.created,metadataJson:JSON.stringify({marketCap:`${d.ticker==='CCC'?250:5} M`,supportResistanceLevels:`${d.ticker} original Levels`}),positivesJson:'[]',negativesJson:'[]',riskFlagsJson:'[]',diagnosticsJson:'{}',rawPayloadJson:JSON.stringify({issuer:d.ticker})};
}
function input(d:typeof definitions[number],event=`event-${d.id}`):NewsArticleInput {
 const c=facts(d);return{sourceEventId:event,ticker:c.ticker,headline:c.headline,summary:c.summary,articleText:c.articleText,sourceUrl:c.sourceUrl,eventType:c.eventType,routeTag:c.routeTag,publishedAt:c.publishedAt,metadata:JSON.parse(c.metadataJson),rawPayload:JSON.parse(c.rawPayloadJson)};
}
function insert(db:Database.Database,table:string,row:Record<string,unknown>){db.prepare(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(()=>'?').join(',')})`).run(...Object.values(row));}
function seed(db:Database.Database,reverse=false){
 db.pragma('foreign_keys=ON');for(const sql of newsContentMigration.statements)db.exec(sql);
 for(const d of reverse?[...definitions].reverse():definitions){const c=facts(d),hash=calculateNewsArticleContentSha256(c);const row={id:d.id,source_event_id:c.sourceEventId,canonical_source_key:c.canonicalSourceKey,ticker:c.ticker,slug:c.slug,headline:c.headline,summary:c.summary,article_text:c.articleText,source_url:c.sourceUrl,event_type:c.eventType,route_tag:c.routeTag,published_at:c.publishedAt,created_at:d.created,updated_at:d.created,metadata_json:c.metadataJson,positives_json:c.positivesJson,negatives_json:c.negativesJson,risk_flags_json:c.riskFlagsJson,diagnostics_json:c.diagnosticsJson,raw_payload_json:c.rawPayloadJson,revision:1,content_sha256:hash};insert(db,'news_articles',row);
  const {id,...rest}=row;delete (rest as Partial<typeof row>).updated_at;insert(db,'news_article_versions',{...rest,version_id:createHash('sha256').update(`${id}\n1\n${hash}\n`).digest('hex'),article_id:id,changed_at:d.created,change_source:'publisher'});
 }
}
function migrate(db:Database.Database){db.transaction(()=>{for(const sql of newsArticleIngestionMembershipsMigration.statements)db.exec(sql);})();}
function mapping(db:Database.Database){return db.prepare('SELECT normalized_url,article_id FROM news_article_source_urls ORDER BY normalized_url').all();}
beforeAll(async()=>{await resetNewsDatabaseForTests();const db=new Database(file);seed(db);migrate(db);db.close();process.env.TRADERSLINK_NEWS_DB_PATH=file;});
afterAll(async()=>{await resetNewsDatabaseForTests();delete process.env.TRADERSLINK_NEWS_DB_PATH;rmSync(dir,{recursive:true,force:true});});
it('ranks one URL target deterministically without changing historical rows, versions, events or ticker-specific facts',()=>{
 const maps=[];for(const reverse of [false,true]){const db=new Database(':memory:');try{seed(db,reverse);const before=db.prepare('SELECT * FROM news_articles ORDER BY id').all(),versions=db.prepare('SELECT * FROM news_article_versions ORDER BY article_id').all();migrate(db);expect(db.prepare('SELECT * FROM news_articles ORDER BY id').all()).toEqual(before);expect(db.prepare('SELECT * FROM news_article_versions ORDER BY article_id').all()).toEqual(versions);expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);expect(db.prepare('SELECT article_id FROM news_article_source_events ORDER BY article_id').all()).toEqual(definitions.map(d=>({article_id:d.id})).sort((a,b)=>a.article_id.localeCompare(b.article_id)));maps.push(mapping(db));}finally{db.close();}}
 expect(maps[0]).toEqual(maps[1]);expect(maps[0]).toEqual([{normalized_url:'https://publisher.example/other',article_id:'old-cap'},{normalized_url:'https://publisher.example/shared',article_id:'a-scanner'}]);
});
it('keeps every established public-reader identity and its original issuer content',async()=>{
 for(const d of definitions){const a=await getNewsArticle(d.ticker,`legacy-${d.ticker}`);expect(a).toMatchObject({id:d.id,ticker:d.ticker,slug:`legacy-${d.ticker}`,summary:`Summary ${d.ticker}`});expect(a?.metadata.supportResistanceLevels).toBe(`${d.ticker} original Levels`);}
});
it('retries old events and accepts new same-ticker alias events without duplicate growth or event retargeting',async()=>{
 for(const d of definitions){expect((await upsertNewsArticle(input(d))).id).toBe(d.id);expect((await upsertNewsArticle(input(d,`new-${d.id}`))).id).toBe(d.id);expect((await upsertNewsArticle(input(d,`new-${d.id}`))).id).toBe(d.id);}
 const db=new Database(file);try{expect(db.prepare('SELECT count(*) n FROM news_articles').get()).toEqual({n:5});expect(db.prepare('SELECT count(*) n FROM news_article_versions').get()).toEqual({n:5});expect(db.prepare('SELECT count(*) n FROM news_article_source_events').get()).toEqual({n:10});for(const d of definitions)expect(db.prepare('SELECT article_id FROM news_article_source_events WHERE source_event_id=?').get(`event-${d.id}`)).toEqual({article_id:d.id});expect(mapping(db)[1]).toEqual({normalized_url:'https://publisher.example/shared',article_id:'a-scanner'});}finally{db.close();}
});
it('adds a second destination on the original alias without copying its issuer facts into the designated target',async()=>{
 const d=definitions[0];const a=await upsertNewsArticle({...input(d,'scanner-cap-a'),routeTag:'spike'});expect(a.id).toBe('cap-a');expect(a.ticker).toBe('AAA');const target=await getNewsArticle('CCC','legacy-CCC');expect(target?.metadata).toEqual(JSON.parse(facts(definitions[2]).metadataJson));
 const db=new Database(file);try{expect(db.prepare('SELECT route_tag FROM news_article_category_memberships WHERE article_id=? ORDER BY route_tag').all('cap-a')).toEqual([{route_tag:'market_cap_under_30m'},{route_tag:'spike'}]);expect(db.prepare('SELECT count(*) n FROM news_articles').get()).toEqual({n:5});}finally{db.close();}
});
it('fails closed for unfamiliar issuers and changed event issuers before any row, membership or event mutation',async()=>{
 const db=new Database(file);try{const before=db.serialize();for(const extra of [{ticker:'UNSEEN',sourceEventId:'unknown-event'},{ticker:'BBB',sourceEventId:'event-cap-a'}])await expect(upsertNewsArticle({...input(definitions[0]),...extra,metadata:{marketCap:'$900M',supportResistanceLevels:'Foreign issuer Levels'}})).rejects.toThrow();expect(db.serialize()).toEqual(before);}finally{db.close();}
});
