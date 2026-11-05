// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { DEFAULT_PREMARKET_PULLBACK_CONTROLS as controls } from "./premarket-pullbacks";
import type { PremarketPullbackResults } from "./contracts";
vi.mock("@/app/dashboard-template",()=>({DashboardPanel:({title,action,children}:{title:string;action:ReactNode;children:ReactNode})=>createElement("section",null,createElement("h2",null,title),action,children)}));
import { PremarketPullbacksCard } from "@/app/(dashboard)/screeners/premarket-pullbacks-card";
beforeAll(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;});
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;vi.unstubAllGlobals();document.body.replaceChildren();});
const results:PremarketPullbackResults={controls,total:1,missingReferenceCount:0,rows:[{symbol:"AAA",exchange:"NASDAQ",company:"Test",price:7,premarketHigh:10,premarketVolume:1000,sessionVolume:2000,float:null,changePercent:40,belowHighPercent:30,backToHighPercent:42.8571429,oneMinuteVolume:100,fiveMinuteVolume:400,spreadPercent:null,receivedAtUtc:"2026-11-02T15:00:00Z",news:[{id:"test",headline:"Test news",url:"https://example.com/news",typeLabel:"PR",createdAt:"2026-11-02T14:00:00Z"}]}]};
it("shows factual return distance, expanded context, news, chart and full drawer without a new fetch",async()=>{
  const fetch=vi.fn();vi.stubGlobal("fetch",fetch);const chart=vi.fn();const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  await act(async()=>root!.render(createElement(PremarketPullbacksCard,{results,notice:null,onOpenChart:chart})));
  expect(container.textContent).toContain("Change");expect(container.textContent).toContain("+40%");expect(container.textContent).toContain("PM High");expect(container.querySelector("tbody tr")?.textContent).toContain("2K");expect(container.querySelector("tbody tr")?.textContent).not.toContain("1K");expect(container.textContent).not.toContain("Back to PM high");expect(container.textContent).not.toMatch(/recovering|holding|retesting/i);
  await act(async()=>container.querySelector('tbody tr')!.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  expect(container.textContent).toContain("30%");expect(container.textContent).toContain("Premarket volume");expect(container.querySelector('a[href="https://example.com/news"]')).not.toBeNull();
  await act(async()=>(container.querySelector('[aria-label="Open AAA chart"]') as HTMLElement).click());expect(chart.mock.calls[0][0].symbol).toBe("AAA");
  await act(async()=>(container.querySelector('[aria-label="Open Premarket High Pullbacks full view"]') as HTMLElement).click());const drawer=document.body.querySelector('[role="dialog"]')!;expect(drawer.querySelectorAll('thead th')).toHaveLength(7);
  await act(async()=>(drawer.querySelector('[aria-label="Close Premarket High Pullbacks full view"]') as HTMLElement).click());expect(fetch).not.toHaveBeenCalled();
});
it("honors disabled and closed states",async()=>{const container=document.createElement("div");document.body.append(container);root=createRoot(container);await act(async()=>root!.render(createElement(PremarketPullbacksCard,{results:undefined,notice:"Active 4:00am - 8:00pm est",onOpenChart:vi.fn()})));expect(container.textContent).toContain("Active 4:00am - 8:00pm est");await act(async()=>root!.render(createElement(PremarketPullbacksCard,{results:{...results,controls:{...controls,enabled:false}},notice:null,onOpenChart:vi.fn()})));expect(container.textContent).toContain("Disabled");expect(container.querySelector('table')).toBeNull();});
it("uses the standard scanner alert for an empty qualifying list",async()=>{const container=document.createElement("div");document.body.append(container);root=createRoot(container);await act(async()=>root!.render(createElement(PremarketPullbacksCard,{results:{...results,total:0,rows:[]},notice:null,onOpenChart:vi.fn()})));const alert=container.querySelector('[role="alert"]');expect(alert?.textContent).toContain("No stocks currently qualify for this list.");expect(container.querySelector('table')).toBeNull();});
it("shows sub-dollar prices to three decimals",async()=>{const container=document.createElement("div");document.body.append(container);root=createRoot(container);await act(async()=>root!.render(createElement(PremarketPullbacksCard,{results:{...results,rows:[{...results.rows[0],price:.33,premarketHigh:.45}]},notice:null,onOpenChart:vi.fn()})));expect(container.querySelector("tbody tr")?.textContent).toContain("$0.330");expect(container.querySelector("tbody tr")?.textContent).toContain("$0.450");});
