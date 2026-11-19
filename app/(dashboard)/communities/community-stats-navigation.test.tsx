// @vitest-environment jsdom
// Hydration and client navigation only, with a local DTO transport fixture.
// This does not qualify Next routing, deployed UI or native authorization.
import {act} from "react";
import {hydrateRoot,type Root} from "react-dom/client";
import {renderToString} from "react-dom/server";
import {createTheme,ThemeProvider} from "@mui/material/styles";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import type {CommunityStatsReport,CommunityStatsTab} from "@/src/modules/communities/contracts/community-stats-contracts";
import {CommunityStatsDashboard} from "./community-stats-dashboard";
const today=new Date().toISOString().slice(0,10),prior=(days:number)=>new Date(Date.parse(today+"T00:00:00Z")-(days-1)*86400000).toISOString().slice(0,10);
const requests:URL[]=[];let root:Root|null=null;let chartMaximum=0;
const view=()=> <ThemeProvider theme={createTheme()}><CommunityStatsDashboard communitySlug="synthetic"/></ThemeProvider>;
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function mount(){const container=document.createElement('div');document.body.append(container);container.innerHTML=renderToString(view());await act(async()=>{root=hydrateRoot(container,view());await wait(10);});await act(async()=>{await wait(350);});return container;}
beforeEach(()=>{requests.length=0;chartMaximum=0;vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});vi.stubGlobal('fetch',vi.fn(async(input:string)=>{const url=new URL(input,location.origin);requests.push(url);const report:CommunityStatsReport={tab:url.searchParams.get('tab') as CommunityStatsTab,window:{fromDate:url.searchParams.get('from')!,throughDate:url.searchParams.get('through')!,asOfUtc:new Date().toISOString(),timezone:'UTC',quietDays:7,calendar:'calendar_days'},communityName:'Synthetic',ready:true,scope:'community',canReadNamed:true,canReadMembers:true,canReadTeam:true,canExport:true,isOwner:true,sources:[],metrics:[],columns:[],rows:[],totalRows:0,page:1,pageSize:25,trend:chartMaximum?[{date:today,web:chartMaximum,discord:null}]:[],segments:{},cohorts:[],activation:null,member:null,catalog:[],notes:[],catalogTotal:0,catalogMatchTotal:0,sections:[],roles:[]};return Response.json(report);}));});
afterEach(async()=>{await act(async()=>{root?.unmount();root=null;});document.body.replaceChildren();vi.unstubAllGlobals();});
describe('Stats validated report URL persistence',()=>{
 it('hydrates directly into the saved Server window, then preserves a new tab on remount',async()=>{
  history.replaceState(null,'',`/communities/synthetic/stats/activity?tab=server&from=${prior(90)}&through=${today}`);const container=await mount();expect(requests).toHaveLength(1);expect(requests[0].searchParams.get('tab')).toBe('server');expect(requests[0].searchParams.get('from')).toBe(prior(90));expect(container.querySelector('button[aria-current="page"]')?.textContent).toBe('Server');
  const messages=[...container.querySelectorAll('nav button')].find(button=>button.textContent==='Messages')!;await act(async()=>{messages.dispatchEvent(new MouseEvent('click',{bubbles:true}));});await act(async()=>{await wait(350);});expect(new URL(location.href).searchParams.get('tab')).toBe('messages');expect(new URL(location.href).searchParams.get('from')).toBe(prior(90));
  await act(async()=>{root?.unmount();root=null;});container.remove();requests.length=0;const reloaded=await mount();expect(requests).toHaveLength(1);expect(requests[0].searchParams.get('tab')).toBe('messages');expect(reloaded.querySelector('button[aria-current="page"]')?.textContent).toBe('Messages');
 });
 it('rejects malformed URL dates, removed sections, invalid roles and unsafe pagination',async()=>{
  history.replaceState(null,'','/communities/synthetic/stats/activity?tab=voice&from=2026-99-99&through=9999-01-01&role=not-a-role&page=99999999999999999');await mount();const query=requests[0].searchParams;expect(query.get('tab')).toBe('overview');expect(query.get('from')).toBe(prior(30));expect(query.get('through')).toBe(today);expect(query.has('role')).toBe(false);expect(query.get('page')).toBe('1');expect([...document.querySelectorAll<HTMLButtonElement>('button')].find(button=>button.textContent==='Export chart')?.disabled).toBe(true);
 });
 it.each([1,3])('shows distinct integer chart ticks for a maximum of %i',async maximum=>{
  chartMaximum=maximum;history.replaceState(null,'','/communities/synthetic/stats/activity');await mount();const svg=document.querySelector('.cs-trend-plot svg')!;const ticks=[...svg.querySelectorAll('g > text')].map(node=>Number(node.textContent));expect(ticks).toContain(maximum);expect(ticks.length).toBe(new Set(ticks).size);expect(ticks.every(value=>Number.isInteger(value)&&value>0)).toBe(true);
 });
 it('keeps valid Pages filters consistent between first request, URL and Excel link',async()=>{
  history.replaceState(null,'',`/communities/synthetic/stats/activity?tab=pages&from=${prior(30)}&through=${today}&contentKind=alert&search=synthetic&author=synthetic-author`);const container=await mount();const excel=container.querySelector<HTMLAnchorElement>('a[href*="format=xlsx"]')!;expect(excel).not.toBeNull();const query=new URL(excel.href).searchParams;for(const key of ['tab','from','through','contentKind','search','author'])expect(query.get(key)).toBe(requests[0].searchParams.get(key));expect(new URL(location.href).searchParams.get('contentKind')).toBe('alert');
 });
});
