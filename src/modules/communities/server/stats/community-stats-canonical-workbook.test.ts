// @vitest-environment node
import Database from 'better-sqlite3';
import {describe,expect,it,vi} from 'vitest';
import {communityStatsWorkbookSheets,streamStatsWorkbook} from './community-stats-workbook';
vi.mock('./community-stats-repository',async original=>({...await original<typeof import('./community-stats-repository')>(),communityStatsStorageReady:()=>true}));
vi.mock('./community-stats-attribution-ready',()=>({statsAttributionReady:()=>false}));
import {exportCommunityStatsIdentity} from './community-stats-retention';
import {createCommunityStatsReviewFixture} from './community-stats-review-fixture';

describe('canonical populations remain truthful in Excel',()=>{
 it('carries the exact report rows, date population and unknown contributor into worksheets',()=>{
  const report={...createCommunityStatsReviewFixture(),tab:'authors' as const,canExport:true,columns:['Analyst','Alerts published','Watchlists published','Avg viewers per new post'],rows:[{Analyst:'A','Alerts published':2,'Watchlists published':null,'Avg viewers per new post':1}],totalRows:1};
  const sheets=[...communityStatsWorkbookSheets(report,()=>report)];
  const details=[...sheets[0].rows];expect(details).toContainEqual({Field:'Publication population',Value:'First publications in selected UTC dates; same native item counted once'});
  expect(details).toContainEqual({Field:'Audience population',Value:'Opens in selected UTC dates, including older posts'});
  const data=sheets.find(sheet=>sheet.columns.includes('Watchlists published'))!;
  expect([...data.rows]).toEqual(report.rows);
  const workbook=Buffer.concat([...streamStatsWorkbook(sheets)].map(chunk=>Buffer.from(chunk)));
  expect(workbook.subarray(0,4).toString('hex')).toBe('504b0304');expect(workbook.includes(Buffer.from('Avg viewers per new post'))).toBe(true);
 });
 it('keeps first-publisher n/a instead of substituting current publisher in page details',()=>{
  const report={...createCommunityStatsReviewFixture(),tab:'pages' as const,catalog:[{id:'watchlist-item:i',type:'watchlist' as const,targetKind:'watchlist_item' as const,title:'ABC',path:'/board?focus=i',authorUserId:null,authorName:null,contributorName:null,publisherUserId:'moderator',state:'published' as const,mode:'tracked_page' as const}]};
  const sheets=[...communityStatsWorkbookSheets(report,()=>report,undefined,{'Page filter':'watchlist-item:i'})];
  const selected=sheets.find(sheet=>sheet.title==='ABC')!;expect([...selected.rows][0]).toMatchObject({'First published by':'n/a'});
 });
 it('reuses the existing personal export and excludes another actor sharing a Discord ID',()=>{
  const db=new Database(':memory:');
  try{
   db.exec(`CREATE TABLE community_stats_events(community_id TEXT,event_id TEXT,discord_user_id TEXT,platform_user_id TEXT,surface TEXT,kind TEXT,occurred_at_utc TEXT,received_at_utc TEXT,content_id TEXT,canonical_content_id TEXT,placement_id TEXT,content_type TEXT,title TEXT,path TEXT,username TEXT,display_name TEXT,nickname TEXT,nickname_state TEXT,identity_observed_at_utc TEXT);
    CREATE TABLE community_stats_identity_links(community_id TEXT,platform_user_id TEXT,discord_user_id TEXT,from_utc TEXT,until_utc TEXT);`);
   const insert=db.prepare("INSERT INTO community_stats_events(community_id,event_id,discord_user_id,platform_user_id,surface,kind,occurred_at_utc,content_id,canonical_content_id) VALUES('c',?,'12345',?,'web','web_visit','2026-02-01T00:00:00.000Z','watchlist-item:i','i')");
   insert.run('web:a:one','a');insert.run('web:b:one','b');
   const result=exportCommunityStatsIdentity(db,'a','2026-02-02T00:00:00.000Z','c');
   expect(result).toHaveLength(1);expect(result[0]).toMatchObject({platform_user_id:'a',content_id:'watchlist-item:i',canonical_content_id:'i'});
  }finally{db.close();}
 });

});
