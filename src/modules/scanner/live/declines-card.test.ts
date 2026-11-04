// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { DeclineBook } from "./declines";
import type { DailyUniverse, NormalizedSnapshot } from "./contracts";
vi.mock("@/app/dashboard-template",()=>({DashboardPanel:({title,action,children}:{title:string;action:ReactNode;children:ReactNode})=>createElement("section",null,createElement("h2",null,title),action,children)}));
import { DeclinesCard } from "@/app/(dashboard)/screeners/declines-card";
beforeAll(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;});
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;vi.unstubAllGlobals();document.body.replaceChildren();});
it("shows both tabs, expands drop context, opens the full view and never fetches separately",async()=>{
  const now=Date.parse("2026-11-02T22:00:00Z");
  const universe:DailyUniverse={version:1,tradingDate:"2026-11-02",acceptedAtUtc:new Date(now).toISOString(),lastCollectionAtUtc:new Date(now).toISOString(),latestUploadCount:1,sourceHashes:[],stocks:[{symbol:"AAA",exchange:"NASDAQ",marketCapAtCollection:1e6}]};
  const base:NormalizedSnapshot={symbol:"AAA",company:"Synthetic",session:"after_hours",tradingDate:universe.tradingDate,
    price:2,providerAt:now,receivedAt:now,priceTimeBasis:"session_observation",baseline:3,regularClosePrice:2,
    volume:100,dollarVolume:200,bid:null,ask:null,marketCap:1e6,dayHigh:3,dayLow:1,providerVolumeRatio:null};
  const book=new DeclineBook();book.evaluate({universe,session:"after_hours",now,snapshots:[base],floats:new Map()});
  const results=book.evaluate({universe,session:"after_hours",now:now+60000,snapshots:[{...base,price:1.2,receivedAt:now+60000,volume:1000}],floats:new Map()});
  const fetch=vi.fn();vi.stubGlobal("fetch",fetch);const chart=vi.fn();
  const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  await act(async()=>root!.render(createElement(DeclinesCard,{results,notice:null,session:"after_hours",onOpenChart:chart})));
  const table=container.querySelector('table[aria-label="Rapid Drops stocks"]')!;
  expect(table.textContent).toContain("-40%");
  await act(async()=>table.querySelector('tbody tr')!.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  expect(table.textContent).toContain("Back to pre-drop price");expect(table.textContent).toContain("+66.67%");
  expect(table.textContent).toContain("900");
  await act(async()=>(table.querySelector('[aria-label="Open AAA chart"]') as HTMLElement).click());
  expect(chart.mock.calls[0][0].symbol).toBe("AAA");
  const losers=[...container.querySelectorAll('[role="tab"]')].find(tab=>tab.textContent==="Top Losers") as HTMLElement;
  await act(async()=>losers.click());expect(container.textContent).not.toContain("Since today’s regular close");
  expect(container.querySelector('table[aria-label="Top Losers stocks"]')).not.toBeNull();
  await act(async()=>(container.querySelector('[aria-label="Open Rapid Drops full view"]') as HTMLElement).click());
  const drawer=document.body.querySelector('[role="dialog"][aria-label="Rapid Drops full view"]')!;
  expect(drawer.querySelectorAll('thead th').length).toBe(8);
  await act(async()=>(drawer.querySelector('[aria-label="Close Rapid Drops full view"]') as HTMLElement).click());
  expect(fetch).not.toHaveBeenCalled();
});

it("uses the supplied closed/unavailable notice instead of pretending data is ready",async()=>{
  const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  await act(async()=>root!.render(createElement(DeclinesCard,{results:undefined,notice:"Active 4:00am - 8:00pm est",session:null,onOpenChart:vi.fn()})));
  expect(container.textContent).toContain("Active 4:00am - 8:00pm est");expect(container.querySelector('table')).toBeNull();
});

it("uses standard scanner alerts for empty Rapid Drops and Top Losers lists",async()=>{
  const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  const emptyResults={rapid:[],losers:[],rapidTotal:0,loserTotal:0,controls:{enabled:true,minimumDropPercent:30,windowMinutes:5,retentionMinutes:15,displayLimit:20}};
  await act(async()=>root!.render(createElement(DeclinesCard,{results:emptyResults,notice:null,session:"regular",onOpenChart:vi.fn()})));
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("No rapid drops currently detected.");
  const losers=[...container.querySelectorAll('[role="tab"]')].find(tab=>tab.textContent==="Top Losers") as HTMLElement;
  await act(async()=>losers.click());
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("No stocks currently declining in this comparison.");
});
