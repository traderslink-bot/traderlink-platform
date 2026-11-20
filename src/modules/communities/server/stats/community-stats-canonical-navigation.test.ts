// @vitest-environment jsdom
import {renderToString} from 'react-dom/server';
import {act,createElement,StrictMode} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const navigation=vi.hoisted(()=>({path:'/communities/unit/watchlist/board'}));
vi.mock('next/navigation',()=>({usePathname:()=>navigation.path}));
vi.mock('@/app/(dashboard)/communities/community-branded-feed-page',()=>({CommunityBrandedFeedPage:()=>null}));
import WatchlistRoute from '@/app/(dashboard)/communities/[communitySlug]/watchlist/[...feed]/page';
import {CommunityStatsDashboard} from '@/app/(dashboard)/communities/community-stats-dashboard';
import {createCommunityStatsReviewFixture} from './community-stats-review-fixture';
import {CommunityStatsVisitRecorder} from '@/app/(dashboard)/communities/community-stats-visit-recorder';
let root:Root,host:HTMLDivElement,posts:Record<string,unknown>[];
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);posts=[];sessionStorage.clear();navigation.path='/communities/unit/watchlist/board';vi.stubGlobal('fetch',vi.fn(async(_url:unknown,init:RequestInit)=>{posts.push(JSON.parse(String(init.body)));return new Response(null,{status:202});}));host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
async function render(focus:string|null){await act(async()=>root.render(createElement(StrictMode,null,createElement(CommunityStatsVisitRecorder,{communitySlug:'unit',focus}))));}
describe('actual mounted postcommit recorder',()=>{
 it('keeps one UUID through StrictMode and rerender; focus/back produces new committed navigation identities',async()=>{
  await render(null);expect(posts.length).toBeGreaterThan(0);expect(new Set(posts.map(row=>row.navigationId)).size).toBe(1);
  const first=posts[0].navigationId;await render('item');expect(posts.at(-1)?.focus).toBe('item');expect(posts.at(-1)?.navigationId).not.toBe(first);
  const targeted=posts.at(-1)?.navigationId;await render('item');expect(posts.at(-1)?.navigationId).toBe(targeted);
  await render(null);expect(posts.at(-1)?.navigationId).not.toBe(first);expect(posts.at(-1)?.navigationId).not.toBe(targeted);
 });
 it('emits no UI, hydration label, hover or automatic item exposures',async()=>{
  await render(null);expect(host.childElementCount).toBe(0);expect(posts.every(row=>!('focus' in row))).toBe(true);
  const before=posts.length;host.dispatchEvent(new MouseEvent('mouseover'));expect(posts).toHaveLength(before);
 });
 it('does not track a different community or private route',async()=>{
  navigation.path='/account/privacy';await render(null);expect(posts).toHaveLength(0);
 });
 it('hides stale report rows during filter loading and ignores a superseded response',async()=>{
  window.history.replaceState(null,'','/communities/unit/stats/activity?tab=pages');
  const replies:((response:Response)=>void)[]=[];
  vi.mocked(fetch).mockImplementation(()=>new Promise(resolve=>replies.push(resolve)));
  const value=(name:string)=>({...createCommunityStatsReviewFixture(),tab:'pages',columns:['Page'],rows:[{Page:name}],totalRows:1,sections:[],trend:[]});
  await act(async()=>root.render(createElement(CommunityStatsDashboard,{communitySlug:'unit',initialTab:'pages'})));
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,300));});
  expect(replies).toHaveLength(1);await act(async()=>replies[0](Response.json(value('First report'))));
  expect(host.textContent).toContain('First report');
  const search=host.querySelector<HTMLInputElement>('input[type=search]')!;
  async function change(text:string){await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(search,text);search.dispatchEvent(new Event('input',{bubbles:true}));});}
  await change('second');expect(host.textContent).not.toContain('First report');
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,300));});expect(replies).toHaveLength(2);
  await change('final');await act(async()=>replies[1](Response.json(value('Stale report'))));expect(host.textContent).not.toContain('Stale report');
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,300));});expect(replies).toHaveLength(3);
  await act(async()=>replies[2](Response.json(value('Final report'))));expect(host.textContent).toContain('Final report');
  await change('error');await act(async()=>{await new Promise(resolve=>setTimeout(resolve,300));});
  await act(async()=>replies[3](Response.json({status:'unavailable'},{status:403})));
  expect(host.querySelector('[role=alert]')).not.toBeNull();expect(host.textContent).not.toContain('Final report');expect(host.querySelector('input[type=search]')).toBe(search);
 });

 it('does not record during server rendering or a speculative render',()=>{
  expect(renderToString(createElement(CommunityStatsVisitRecorder,{communitySlug:'unit',focus:'item'}))).toBe('');expect(posts).toHaveLength(0);
 });

 it('propagates awaited registered Watchlist route focus to its actual server renderer contract',async()=>{
  const focused=await WatchlistRoute({params:Promise.resolve({communitySlug:'unit',feed:['board']}),searchParams:Promise.resolve({focus:'native-item'})});
  expect(focused.props).toMatchObject({communitySlug:'unit',pageType:'watchlist',segments:['board'],focus:'native-item'});
  const board=await WatchlistRoute({params:Promise.resolve({communitySlug:'unit',feed:['board']}),searchParams:Promise.resolve({})});
  expect(board.props.focus).toBeNull();
 });

});
