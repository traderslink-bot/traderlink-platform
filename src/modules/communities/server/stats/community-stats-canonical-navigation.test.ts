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
import {CommunityBreadcrumbs} from '@/app/community-sidebar';
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

const membersUrl='/communities/unit/stats/activity?tab=members&from=2026-10-01&through=2026-10-18&quiet=7&calendar=calendar_days&page=2&role=12&segment=discord_any';
const menu={base:'/communities/unit',name:'Unit',viewerId:'synthetic-owner',focused:true,items:[{label:'Overview',href:'/communities/unit'},{label:'Stats',children:[{label:'Overview',href:'/communities/unit/stats/activity'},{label:'Analysts',href:'/communities/unit/stats/analysts'}]}]};
async function settle(){await act(async()=>{await new Promise(resolve=>setTimeout(resolve,290));});}
function button(text:string){const value=[...host.querySelectorAll<HTMLButtonElement>('button')].find(node=>node.textContent===text);expect(value,`button ${text}`).toBeDefined();return value!;}
async function click(text:string){await act(async()=>button(text).click());}
function field(label:string){const value=[...host.querySelectorAll('label')].find(node=>node.firstChild?.textContent===label)?.querySelector<HTMLSelectElement>('select');expect(value,`field ${label}`).toBeDefined();return value!;}
async function select(label:string,value:string){await act(async()=>{const node=field(label);node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));});}
function navigationReports(){
 const requested:string[]=[];
 vi.mocked(fetch).mockImplementation(async(input)=>{
  const url=new URL(String(input),'http://localhost');requested.push(url.search);
  // The real stopped-posting reader returns its list before the ordinary detail loop.
  const detail=url.searchParams.get('segment')==='stopped_posting'?null:url.searchParams.get('member');
  return Response.json({...createCommunityStatsReviewFixture(),tab:url.searchParams.get('tab'),metrics:[],trend:[],sections:[],columns:['Discord username'],rows:[{'Discord username':'member_one',memberId:'99'}],totalRows:60,roles:[{id:'12',name:'Review role'},{id:'13',name:'Other role'}],page:Number(url.searchParams.get('page')),member:detail?{name:'member_one',participation:{discord:{lastObservedAtUtc:null},web:{lastObservedAtUtc:null}},measures:[],events:[],eventPage:Number(url.searchParams.get('memberPage')),totalEvents:60}:null});
 });return requested;
}
async function mountMembers(url=membersUrl){
 window.history.replaceState({nextMarker:'preserved'},'',url);navigationReports();
 await act(async()=>root.render(createElement(StrictMode,null,createElement(CommunityBreadcrumbs,{menu,path:'/communities/unit/stats/activity'}),createElement(CommunityStatsDashboard,{communitySlug:'unit'}))));await settle();
}
async function historyMove(direction:'back'|'forward'){
 await act(async()=>{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('history did not settle')),1000);window.addEventListener('popstate',()=>{clearTimeout(timer);resolve();},{once:true});window.history[direction]();});});await settle();
}
describe('mounted Stats report and member navigation',()=>{
 beforeEach(()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});});
 afterEach(()=>{vi.restoreAllMocks();});
 it('preserves role/activity/page and returns focus/scroll with Close, Back and Forward without duplicate StrictMode entries',async()=>{
  await mountMembers();expect(field('Current Discord role').value).toBe('12');expect(field('Member activity').value).toBe('discord_any');
  const push=vi.spyOn(window.history,'pushState');Object.defineProperty(window,'scrollY',{configurable:true,value:460});button('member_one').focus();
  await click('member_one');await settle();expect(push).toHaveBeenCalledTimes(1);expect(window.history.state.nextMarker).toBe('preserved');
  expect(new URLSearchParams(window.location.search).get('page')).toBe('2');expect(new URLSearchParams(window.location.search).get('segment')).toBe('discord_any');
  expect(host.querySelector('[aria-label="Community breadcrumb"]')?.textContent).toContain('Members/Member detail');expect(document.activeElement?.textContent).toBe('member_one');
  await click('Next activity');await settle();expect(push).toHaveBeenCalledTimes(1);
  await click('Close member');await settle();
  // Close uses the known originating history entry; wait for the actual browser event.
  if(new URLSearchParams(window.location.search).has('member'))await new Promise(resolve=>setTimeout(resolve,20));
  await settle();expect(new URLSearchParams(window.location.search).has('member')).toBe(false);expect(field('Current Discord role').value).toBe('12');expect(field('Member activity').value).toBe('discord_any');expect(host.textContent).toContain('Page 2 of 3');
  expect(window.scrollTo).toHaveBeenCalledWith({top:460,behavior:'instant'});expect(document.activeElement).toBe(button('member_one'));
  await historyMove('forward');expect(new URLSearchParams(window.location.search).get('memberPage')).toBe('2');expect(host.textContent).toContain('Activity totals');
  await historyMove('back');expect(host.textContent).not.toContain('Activity totals');
 });
 it('keeps original stopped-posting dates distinct from its derived API window and restores actual filters',async()=>{
  await mountMembers(membersUrl.replace('discord_any','stopped_posting')+'&postingPrior=90&postingQuiet=14&postingDays=3');
  await click('member_one');await settle();expect(new URLSearchParams(window.location.search).get('from')).toBe('2026-10-01');expect(field('Previous posting period').value).toBe('90');expect(host.textContent).toContain('Activity totals');expect(host.querySelector('[data-stats-list]')).toBeNull();
  const request=new URL(String(vi.mocked(fetch).mock.calls.at(-1)?.[0]),'http://localhost');expect(request.searchParams.get('member')).toBe('99');expect(request.searchParams.has('segment')).toBe(false);expect(request.searchParams.get('from')).not.toBe('2026-10-01');expect(new URLSearchParams(window.location.search).get('segment')).toBe('stopped_posting');
  await historyMove('back');expect(field('Member activity').value).toBe('stopped_posting');expect(field('Previous posting period').value).toBe('90');
 });
 it('safely closes a direct link without leaving Stats and reloads the same query',async()=>{
  await mountMembers(membersUrl+'&member=99&memberPage=2');const back=vi.spyOn(window.history,'back');
  await click('Close member');await settle();expect(back).not.toHaveBeenCalled();expect(window.location.pathname).toBe('/communities/unit/stats/activity');expect(field('Current Discord role').value).toBe('12');expect(host.textContent).toContain('Page 2 of 3');
  await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(createElement(CommunityStatsDashboard,{communitySlug:'unit'})));await settle();expect(field('Member activity').value).toBe('discord_any');expect(host.textContent).toContain('Page 2 of 3');
 });
 it('adds one entry per report change and keeps page search while returning through supported reports',async()=>{
  await mountMembers();expect(host.querySelector('input[type=search]')).toBeNull();const push=vi.spyOn(window.history,'pushState');
  await click('Pages');await settle();expect(push).toHaveBeenCalledTimes(1);
  const search=host.querySelector<HTMLInputElement>('input[type=search]')!;await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(search,'breakout');search.dispatchEvent(new Event('input',{bubbles:true}));});await settle();expect(push).toHaveBeenCalledTimes(1);
  await click('Analysts');await settle();expect(push).toHaveBeenCalledTimes(2);expect(host.querySelector<HTMLInputElement>('input[type=search]')?.value).toBe('breakout');
  await historyMove('back');expect(host.querySelector<HTMLInputElement>('input[type=search]')?.value).toBe('breakout');
  await historyMove('back');expect(field('Member activity').value).toBe('discord_any');expect(host.querySelector('input[type=search]')).toBeNull();
 });
 it('rehydrates a real Back transition instead of overwriting it with current filters',async()=>{
  await mountMembers();await click('member_one');await settle();await select('Current Discord role','13');await settle();expect(field('Current Discord role').value).toBe('13');
  await historyMove('back');expect(field('Current Discord role').value).toBe('12');expect(new URLSearchParams(window.location.search).get('role')).toBe('12');
 });
 it('ignores cross-community return metadata and falls back to the list heading if its row disappears',async()=>{
  await mountMembers(membersUrl+'&member=99');window.history.replaceState({...window.history.state,communityStatsNavigation:{community:'other',href:window.location.pathname+window.location.search,scrollY:999,focusMember:'99',token:'foreign',returnHref:'/communities/other'}},'');
  const back=vi.spyOn(window.history,'back');await click('Close member');await settle();expect(back).not.toHaveBeenCalled();expect(window.scrollTo).not.toHaveBeenCalledWith({top:999,behavior:'instant'});expect(document.activeElement?.textContent).toBe('Members');
 });
 it('waits for the matching return report before restoring scroll/focus and ignores a late detail response',async()=>{
  await mountMembers();const replies:((value:Response)=>void)[]=[];
  vi.mocked(fetch).mockImplementation(()=>new Promise(resolve=>replies.push(resolve)));
  await click('member_one');await settle();expect(replies).toHaveLength(1);
  await historyMove('back');expect(replies).toHaveLength(2);expect(host.textContent).not.toContain('member_one');expect(window.scrollTo).not.toHaveBeenCalled();
  await act(async()=>replies[0](Response.json({...createCommunityStatsReviewFixture(),metrics:[],trend:[],sections:[],rows:[{'Discord username':'stale_detail'}]})));expect(host.textContent).not.toContain('stale_detail');expect(window.scrollTo).not.toHaveBeenCalled();
  await act(async()=>replies[1](Response.json({...createCommunityStatsReviewFixture(),metrics:[],trend:[],sections:[],columns:['Discord username'],rows:[],roles:[{id:'12',name:'Review role'}],totalRows:0})));
  expect(document.activeElement?.textContent).toBe('Members');expect(window.scrollTo).toHaveBeenCalled();
 });
 it('keeps a known member return origin across an intervening report',async()=>{
  await mountMembers();Object.defineProperty(window,'scrollY',{configurable:true,value:630});await click('member_one');await settle();
  await click('Pages');await settle();await historyMove('back');expect(host.textContent).toContain('Activity totals');
  const back=vi.spyOn(window.history,'back');await click('Close member');await settle();expect(back).toHaveBeenCalledTimes(1);expect(field('Member activity').value).toBe('discord_any');expect(host.textContent).toContain('Page 2 of 3');expect(document.activeElement).toBe(button('member_one'));expect(window.scrollTo).toHaveBeenCalledWith({top:630,behavior:'instant'});
 });
 it.each([{name:'desktop',headerBottom:65},{name:'mobile safe area',headerBottom:85}])('clears the fixed header on $name when scrolling/focusing the Overview fallback heading',async({headerBottom})=>{
  await mountMembers();const header=document.createElement('header');header.style.cssText='position:fixed;top:0';document.body.append(header);
  try{
   vi.spyOn(header,'getBoundingClientRect').mockReturnValue(new DOMRect(0,0,800,headerBottom));
   const heading=host.querySelector<HTMLHeadingElement>('h1')!,margins:string[]=[];heading.scrollIntoView=()=>margins.push(heading.style.scrollMarginTop);
   await click('Overview');await settle();expect(host.querySelector('[data-stats-list]')).toBeNull();expect(margins).toEqual([`${headerBottom+16}px`]);expect(document.activeElement).toBe(heading);
  }finally{header.remove();}
  // Geometry is the shell contract, not a claim of real browser viewport visibility.
 });
 it.each(['/workspace','/communities/other/stats/activity'])('does not rewrite a real departing %s location while the old Stats tree can remain mounted',async destination=>{
  const parameters=new URLSearchParams(membersUrl.split('?')[1]);parameters.sort();const query='?'+parameters;window.history.replaceState(null,'',destination+query);window.history.pushState(null,'',membersUrl);await mountMembers();
  const replace=vi.spyOn(window.history,'replaceState'),push=vi.spyOn(window.history,'pushState'),requests=vi.mocked(fetch).mock.calls.length;vi.mocked(window.scrollTo).mockClear();
  await historyMove('back');expect(window.location.pathname).toBe(destination);expect(window.location.search).toBe(query);expect(replace).not.toHaveBeenCalled();expect(push).not.toHaveBeenCalled();expect(vi.mocked(fetch).mock.calls).toHaveLength(requests);expect(window.scrollTo).not.toHaveBeenCalled();expect(host.querySelector('[aria-label="Stats reports"]')).toBeNull();
 });
 it('passes app-owned navigation state to Next native history without impersonating its internal calls',async()=>{
  await mountMembers();window.history.replaceState({...window.history.state,__NA:true,_N:true,__PRIVATE_NEXTJS_INTERNALS_TREE:['synthetic-next-tree'],customView:'keep'},'');
  const original=window.history.state,push=vi.spyOn(window.history,'pushState'),replace=vi.spyOn(window.history,'replaceState');
  await click('Pages');await settle();expect(push).toHaveBeenCalledTimes(1);
  const data=push.mock.calls[0][0];expect(data.__NA).toBeUndefined();expect(data._N).toBeUndefined();expect(data.__PRIVATE_NEXTJS_INTERNALS_TREE).toBeUndefined();expect(data.customView).toBe('keep');expect(data.communityStatsNavigation.community).toBe('unit');expect(original.__NA).toBe(true);expect(original.__PRIVATE_NEXTJS_INTERNALS_TREE).toEqual(['synthetic-next-tree']);
  // This asserts the external caller contract. Actual Next copies its internals;
  // jsdom's unpatched history is not presented as a full Next router/browser test.
  const search=host.querySelector<HTMLInputElement>('input[type=search]')!;await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(search,'momentum');search.dispatchEvent(new Event('input',{bubbles:true}));});await settle();
  const transition=replace.mock.calls.filter(call=>String(call[2]).includes('search=momentum')).at(-1)!;expect(transition[0].__NA).toBeUndefined();expect(transition[0].customView).toBe('keep');expect(push).toHaveBeenCalledTimes(1);
 });
 it('relabels only the existing Stats activity breadcrumb and keeps detail off the list link',async()=>{
  window.history.replaceState(null,'',membersUrl+'&member=99&memberPage=2');await act(async()=>root.render(createElement(CommunityBreadcrumbs,{menu,path:'/communities/unit/stats/activity'})));
  const crumb=host.querySelector('[aria-label="Community breadcrumb"]')!;const link=[...crumb.querySelectorAll('a')].find(node=>node.textContent==='Members')!;expect(link.getAttribute('href')).toContain('role=12');expect(link.getAttribute('href')).not.toContain('member=');expect(crumb.textContent).toContain('Member detail');
  window.history.replaceState(null,'','/communities/unit/stats/activity?tab=%3Cscript%3E');await act(async()=>window.dispatchEvent(new Event('community-stats-location')));expect(crumb.textContent).toContain('Overview');expect(crumb.textContent).not.toContain('<script>');
  await act(async()=>root.render(createElement(CommunityBreadcrumbs,{menu,path:'/communities/unit/stats/analysts'})));expect(host.textContent).toContain('Analysts');expect(host.textContent).not.toContain('Member detail');
  await act(async()=>root.render(createElement(CommunityBreadcrumbs,{menu:{...menu,kind:'coaching'},path:'/communities/unit/stats/activity'})));expect(host.querySelector('[aria-label="Coaching breadcrumb"]')?.textContent).toContain('Overview');
 });
});
