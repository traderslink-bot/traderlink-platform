// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { initialConfiguration } from "./settings";
import { DEFAULT_PREMARKET_PULLBACK_CONTROLS } from "./premarket-pullbacks";
vi.mock("@/app/dashboard-template",()=>({DashboardPanel:({title,action,children}:{title?:string;action?:ReactNode;children:ReactNode})=>createElement("section",null,createElement("h2",null,title),action,children),DashboardSecondaryAction:({children}:{children:ReactNode})=>createElement("button",null,children),DashboardPrimaryAction:({children,onClick,disabled}:{children:ReactNode;onClick:()=>void;disabled:boolean})=>createElement("button",{onClick,disabled},children)}));
vi.mock("@/app/(dashboard)/charts/trading-view-chart",()=>({TradingViewChart:()=>null}));
vi.mock("@/app/(dashboard)/screeners/screener-press-release-board",()=>({useMarketEventsData:()=>({}),ScreenerPressReleaseBoard:()=>null}));
vi.mock("@/app/(dashboard)/screeners/screener-market-halts-card",()=>({ScreenerMarketHaltsCard:()=>null}));
import { LiveScreenersClient } from "@/app/(dashboard)/screeners/live-screeners-client";
beforeAll(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;});
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;vi.useRealTimers();vi.unstubAllGlobals();document.body.replaceChildren();});
it("saves the dedicated enable control without changing Gainer, Momentum or decline controls",async()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-02T15:00:00Z"));
  const configuration={...initialConfiguration(),enabled:true};let saved:Record<string,unknown>|undefined;
  const fetch=vi.fn(async(input:RequestInfo|URL,options?:RequestInit)=>{
    if(String(input)==="/api/admin/screeners/settings"){
      if(options?.method==="POST"){saved=JSON.parse(String(options.body));return Response.json({configuration:{...(saved!.configuration as object),revision:1}});}
      return Response.json({configuration});
    }
    if(String(input)==="/api/admin/screeners/provider")return Response.json({provider:"alpaca",revision:0,moomooAvailable:false});
    if(String(input)!=="/api/screeners/live")throw Error("unexpected request");
    const empty={rows:[],focus:[],total:0};return Response.json({status:"ready",tradingDate:"2026-11-02",session:"regular",updatedAtUtc:"2026-11-02T15:00:00Z",universeCount:0,receivedCount:0,missingSymbols:[],missingFloatCount:0,gainers:empty,momentum:empty,issues:[]});
  });vi.stubGlobal("fetch",fetch);
  class FakeSource extends EventTarget {onerror:((event:Event)=>void)|null=null;close(){}}
  vi.stubGlobal("EventSource",FakeSource);
  const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  await act(async()=>root!.render(createElement(LiveScreenersClient,{admin:true})));
  const label=[...container.querySelectorAll("label")].find(item=>item.textContent?.includes("Enable HOD Drops"))!;
  expect(label).toBeDefined();const toggle=label.querySelector("input")!;expect(toggle.checked).toBe(true);
  await act(async()=>toggle.click());
  const save=[...container.querySelectorAll("button")].find(button=>button.textContent==="Save settings")!;
  await act(async()=>save.click());
  expect(saved).toMatchObject({expectedRevision:0,configuration:{...configuration,premarketPullbacks:{...DEFAULT_PREMARKET_PULLBACK_CONTROLS,enabled:false}}});
  expect(container.textContent).toContain("Scanner settings saved.");
  expect(fetch.mock.calls.filter(call=>call[1]?.method==="POST")).toHaveLength(1);
});
