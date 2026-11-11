// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { DEFAULT_PREMARKET_PULLBACK_CONTROLS } from "./premarket-pullbacks";
import { PremarketPullbacksCard } from "@/app/(dashboard)/screeners/premarket-pullbacks-card";
import { DeclineBook } from "./declines";
import type { DailyUniverse, NormalizedSnapshot } from "./contracts";
vi.mock("@/app/dashboard-template",()=>({DashboardPanel:({title,action,children}:{title:string;action:ReactNode;children:ReactNode})=>createElement("section",null,createElement("h2",null,title),action,children)}));
import { DeclinesCard } from "@/app/(dashboard)/screeners/declines-card";
beforeAll(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;});
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;vi.unstubAllGlobals();document.body.replaceChildren();});
it("shows Top Losers only, ignores drop context, opens full view and never fetches separately",async()=>{
  const now=Date.parse("2026-11-02T22:00:00Z");
  const universe:DailyUniverse={version:1,tradingDate:"2026-11-02",acceptedAtUtc:new Date(now).toISOString(),lastCollectionAtUtc:new Date(now).toISOString(),latestUploadCount:1,sourceHashes:[],stocks:[{symbol:"AAA",exchange:"NASDAQ",marketCapAtCollection:1e6}]};
  const base:NormalizedSnapshot={symbol:"AAA",company:"Synthetic",session:"after_hours",tradingDate:universe.tradingDate,
    price:.55,providerAt:now,receivedAt:now,priceTimeBasis:"session_observation",baseline:3,regularClosePrice:.55,
    volume:100,dollarVolume:200,bid:null,ask:null,marketCap:1e6,dayHigh:3,dayLow:1,providerVolumeRatio:null};
  const book=new DeclineBook();book.evaluate({universe,session:"after_hours",now,snapshots:[base],floats:new Map()});
  const results=book.evaluate({universe,session:"after_hours",now:now+60000,snapshots:[{...base,price:.33,receivedAt:now+60000,volume:1000}],floats:new Map()});
  const cardResults={...results,losers:results.losers.map(row=>({...row,drop:results.rapid[0]?.drop}))};
  const fetch=vi.fn();vi.stubGlobal("fetch",fetch);const chart=vi.fn();
  const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  const haltByTicker=new Map([["AAA",{id:"halt-1",ticker:"AAA",market:"NASDAQ",haltTimeEt:"17:01:00",reasonCode:"LUDP",reason:"Volatility trading pause",quoteTimeEt:null,tradeTimeEt:null}]]);
  await act(async()=>root!.render(createElement(DeclinesCard,{results:cardResults,notice:null,session:"after_hours",onOpenChart:chart,haltByTicker})));
  const table=container.querySelector('table[aria-label="Top Losers stocks"]')!;
  expect(table.querySelector('[data-halt-indicator="AAA"]')).not.toBeNull();
  expect(table.textContent).toContain("-40%");expect(table.textContent).toContain("$0.330");
  await act(async()=>table.querySelector('tbody tr')!.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  expect(table.textContent).toContain("Comparison price");expect(table.textContent).not.toContain("Back to pre-drop price");
  expect(table.textContent).toContain("1K");
  await act(async()=>(table.querySelector('[aria-label="Open AAA chart"]') as HTMLElement).click());
  expect(chart.mock.calls[0][0].symbol).toBe("AAA");
  expect(container.querySelector('[role="tab"]')).toBeNull();expect(container.textContent).not.toContain("Rapid Drops");expect(container.textContent).toContain("Top Losers Post Market");
  expect(container.querySelector('table[aria-label="Top Losers stocks"]')).not.toBeNull();
  await act(async()=>(container.querySelector('[aria-label="Open Top Losers full view"]') as HTMLElement).click());
  const drawer=document.body.querySelector('[role="dialog"][aria-label="Top Losers full view"]')!;
  expect(drawer.querySelectorAll('thead th').length).toBe(8);
  await act(async()=>(drawer.querySelector('[aria-label="Close Top Losers full view"]') as HTMLElement).click());
  expect(fetch).not.toHaveBeenCalled();
});

it("uses the supplied closed/unavailable notice instead of pretending data is ready",async()=>{
  const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  await act(async()=>root!.render(createElement(DeclinesCard,{results:undefined,notice:"Active 4:00am - 8:00pm est",session:null,onOpenChart:vi.fn()})));
  expect(container.textContent).toContain("Active 4:00am - 8:00pm est");expect(container.querySelector('table')).toBeNull();
});

it("uses standard scanner alerts for an empty Top Losers list",async()=>{
  const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  const emptyResults={rapid:[],losers:[],rapidTotal:0,loserTotal:0,controls:{enabled:true,minimumDropPercent:30,windowMinutes:5,retentionMinutes:15,displayLimit:20}};
  await act(async()=>root!.render(createElement(DeclinesCard,{results:emptyResults,notice:null,session:"regular",onOpenChart:vi.fn()})));
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("No stocks currently declining in this comparison.");
});

it("shows the session-high drop on flagged NCT without replacing it with the rapid-event drop",async()=>{
  const at="2026-11-11T16:35:24.000Z";
  const results={controls:DEFAULT_PREMARKET_PULLBACK_CONTROLS,total:1,missingReferenceCount:0,rows:[{
    symbol:"NCT",exchange:"NASDAQ" as const,company:"NCT",price:0.8505,premarketHigh:0.65,regularHigh:1.1101,
    postMarketHigh:null,referenceSession:"regular" as const,referenceHigh:1.1101,premarketVolume:1000,sessionVolume:10000,
    float:null,changePercent:null,belowHighPercent:23.3853,backToHighPercent:30.52,oneMinuteVolume:null,fiveMinuteVolume:null,
    spreadPercent:null,receivedAtUtc:at,news:[],rapidDrop:{
      detectedAtUtc:at,startAtUtc:at,startPrice:1.07,detectionPrice:0.7,lowPrice:0.7,lowAtUtc:at,
      dropPercent:-20.51,maximumDropPercent:-34.58,reboundPercent:21.5,backToStartPercent:25.8,durationSeconds:30,sharesDuringDrop:500,
    },
  }]};
  const container=document.createElement("div");
  document.body.append(container);
  root=createRoot(container);
  await act(async()=>root!.render(createElement(PremarketPullbacksCard,{results,notice:null,onOpenChart:vi.fn()})));
  const cells=container.querySelectorAll("tbody tr:first-child td");
  expect(cells[2].querySelector('[aria-label="Recent rapid drop"]')).not.toBeNull();
  expect(cells[4].textContent).toBe("23%");
  expect(cells[5].textContent).toBe("$1.11REG");
});
