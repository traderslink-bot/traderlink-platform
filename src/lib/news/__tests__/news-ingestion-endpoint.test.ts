// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
const queue=vi.hoisted(()=>({enqueue:vi.fn(),delivery:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/src/modules/platform/server/database/open-platform-database",()=>({openPlatformDatabase:()=>({close:()=>{}})}));
vi.mock("@/src/modules/platform/server/notifications/platform-web-push-configuration",()=>({loadPlatformWebPushConfiguration:()=>({encryption:{}})}));
vi.mock("@/src/modules/news/server/press-release-web-push-repository",()=>({PressReleaseWebPushRepository:class{enqueueArticle=queue.enqueue;}}));
vi.mock("@/src/modules/platform/server/notifications/platform-web-push-delivery-service",()=>({PlatformWebPushDeliveryService:class{runAvailable=queue.delivery;}}));
import { POST } from "@/app/api/news/articles/route";
import { resetNewsDatabaseForTests } from "../news-article-store";
const directory=mkdtempSync(join(tmpdir(),"news-endpoint-")),path=join(directory,"synthetic.sqlite");
beforeAll(async()=>{process.env.TRADERSLINK_NEWS_DB_PATH=path;process.env.NEWS_PUBLISH_TOKEN="synthetic-publisher-token";await resetNewsDatabaseForTests();});
afterAll(async()=>{await resetNewsDatabaseForTests();delete process.env.TRADERSLINK_NEWS_DB_PATH;delete process.env.NEWS_PUBLISH_TOKEN;rmSync(directory,{recursive:true,force:true});});
const request=(body:unknown,authorized=true)=>new Request("http://localhost/api/news/articles",{method:"POST",headers:{"Content-Type":"application/json",...(authorized?{"x-news-publish-token":"synthetic-publisher-token"}:{})},body:JSON.stringify(body)});
it("rejects an unauthenticated publisher before any storage or delivery",async()=>{expect((await POST(request({},false))).status).toBe(401);expect(queue.enqueue).not.toHaveBeenCalled();});
it.each([false,true])("returns one established public webpage for both destinations and retries: scanner-first=%s",async scannerFirst=>{
 const fetch=vi.spyOn(globalThis,"fetch").mockRejectedValue(new Error("No external network authorized"));
 try {
  const base={ticker:"ENDP",headline:"Collected by PC",publishedAt:"2026-11-20T15:00:00.000Z",sourceUrl:`https://publisher.example/endpoint-${scannerFirst}`,summary:"Saved PC analysis",articleText:"Saved article text"};
  const tags=scannerFirst?["spike","market_cap_under_30m"]:["market_cap_under_30m","spike"];
  const answers=[];
  for(const routeTag of [...tags,tags[0],tags[1]]){const response=await POST(request({...base,routeTag,sourceEventId:`endpoint-${scannerFirst}-${routeTag}`}));expect(response.status).toBe(200);answers.push(await response.json());expect(queue.enqueue.mock.lastCall?.[0].routeTag).toBe(routeTag);}
  for(const answer of answers){expect(answer.article.id).toBe(answers[0].article.id);expect(answer.articleUrl).toBe(answers[0].articleUrl);expect(answer.articleUrl).toMatch(/^https:\/\/traderslink\.pro\/news\/ENDP\//);expect(answer.freeArticleUrl).toMatch(/^https:\/\/traderslink\.pro\/news\/free\/ENDP\//);}
  const db=new Database(path);try{expect(db.prepare("SELECT count(*) n FROM news_articles WHERE id=?").get(answers[0].article.id)).toEqual({n:1});expect(db.prepare("SELECT count(*) n FROM news_article_category_memberships WHERE article_id=?").get(answers[0].article.id)).toEqual({n:2});}finally{db.close();}
  expect(fetch).not.toHaveBeenCalled();
 } finally{fetch.mockRestore();}
});
it('returns a stable permanent issuer conflict without writes, delivery, or a wrong-ticker reader URL',async()=>{
 const base={ticker:'ORIG',headline:'Original issuer',publishedAt:'2026-11-20T15:00:00.000Z',sourceUrl:'https://publisher.example/issuer-conflict',routeTag:'spike',sourceEventId:'original-issuer-event',metadata:{marketCap:'$2M',supportResistanceLevels:'Original levels'}};
 expect((await POST(request(base))).status).toBe(200);const db=new Database(path);const before=db.serialize();const calls=queue.enqueue.mock.calls.length;
 try {
  const replies=[];for(let i=0;i<2;i++){const response=await POST(request({...base,ticker:'OTHER',sourceEventId:'other-issuer-event',metadata:{marketCap:'$900M',supportResistanceLevels:'Other levels'}}));expect(response.status).toBe(409);replies.push(await response.json());}
  expect(replies[0]).toEqual(replies[1]);expect(replies[0]).toMatchObject({ok:false,code:'news_article_issuer_conflict',retryable:false});expect(replies[0]).not.toHaveProperty('articleUrl');expect(queue.enqueue.mock.calls).toHaveLength(calls);expect(db.serialize()).toEqual(before);
 }finally{db.close();}
});
