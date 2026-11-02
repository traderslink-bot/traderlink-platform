// @vitest-environment jsdom
import { act,createElement } from "react";
import type { ButtonHTMLAttributes,ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach,beforeAll,describe,expect,it,vi } from "vitest";

vi.mock("@/app/dashboard-template",()=>({
  DashboardPanel:({title,action,children}:{title:string;action?:ReactNode;children:ReactNode})=>createElement("section",null,createElement("h2",null,title),action,children),
  DashboardPrimaryAction:({children,...props}:ButtonHTMLAttributes<HTMLButtonElement>)=>createElement("button",props,children),
}));
import { ScannerAuditClient } from "@/app/(dashboard)/admin/screeners/audit/scanner-audit-client";

beforeAll(()=>{(globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{vi.unstubAllGlobals();document.body.replaceChildren();});
describe("ScannerAuditClient",()=>{
  it("renders health and a clear empty daily-review state",async()=>{
    const fetch=vi.fn(async(input:RequestInfo|URL)=>{const url=String(input);
      if(url.includes("/health"))return Response.json({health:{state:"complete",lastCycleAtUtc:"2026-11-02T15:00:00.000Z",lastCycleId:"cycle",lastStatus:"ready",tradingDate:"2026-11-02",session:"regular",cyclesToday:1,observationsToday:120,evidenceBytesToday:2741,controlDatabaseBytes:176128,bytesPerObservation:22.8,projectedTwentyDayBytes:6566400000,queueDepth:0,droppedCycles:0,lastWriteDurationMs:12,lastError:null}});
      if(url.includes("/daily"))return Response.json({review:{tradingDate:"2026-11-02",sessions:[],rejectionReasons:[]}});
      return Response.json({code:"unexpected"},{status:500});});vi.stubGlobal("fetch",fetch);
    const container=document.createElement("div");document.body.append(container);const root=createRoot(container);
    await act(async()=>{root.render(createElement(ScannerAuditClient));await new Promise(resolve=>setTimeout(resolve,0));});
    expect(container.textContent).toContain("Audit health");expect(container.textContent).toContain("complete");expect(container.textContent).toContain("120");
    expect(container.textContent).toContain("2.7 KB");expect(container.textContent).toContain("176.1 KB");expect(container.textContent).toContain("6.6 GB");expect(container.textContent).not.toMatch(/\d(?:[.,]\d+)?BB\b/);
    const button=[...container.querySelectorAll("button")].find(value=>value.textContent==="Load review");expect(button).toBeTruthy();
    await act(async()=>{button?.click();await new Promise(resolve=>setTimeout(resolve,0));});
    expect(container.textContent).toContain("No audit cycles were recorded for this date.");await act(async()=>root.unmount());
  });
  it("offers older timeline pages when the latest page has no matching ticker",async()=>{
    const fetch=vi.fn(async(input:RequestInfo|URL)=>{const url=String(input);
      if(url.includes("/health"))return Response.json({health:{state:"missing",lastCycleAtUtc:null,lastCycleId:null,lastStatus:null,tradingDate:null,session:null,cyclesToday:0,observationsToday:0,evidenceBytesToday:0,controlDatabaseBytes:0,bytesPerObservation:null,projectedTwentyDayBytes:null,queueDepth:0,droppedCycles:0,lastWriteDurationMs:null,lastError:null}});
      if(url.includes("before="))return Response.json({points:[{cycleId:"older",atUtc:"2026-11-02T14:00:00.000Z",session:"regular",decision:{symbol:"AAA",observation:{price:1},momentumScore:null,momentumRank:null,momentumFailures:["recent_price_move_below_minimum"]}}],nextBeforeUtc:null});
      if(url.includes("/timeline"))return Response.json({points:[],nextBeforeUtc:"2026-11-02T14:30:00.000Z"});
      return Response.json({code:"unexpected"},{status:500});});vi.stubGlobal("fetch",fetch);
    const container=document.createElement("div");document.body.append(container);const root=createRoot(container);
    await act(async()=>{root.render(createElement(ScannerAuditClient));await new Promise(resolve=>setTimeout(resolve,0));});
    const ticker=container.querySelector('input[maxlength="15"]') as HTMLInputElement;expect(ticker).toBeTruthy();
    await act(async()=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;setter?.call(ticker,"AAA");ticker.dispatchEvent(new Event("input",{bubbles:true}));});
    const load=[...container.querySelectorAll("button")].find(value=>value.textContent==="Load timeline");await act(async()=>{load?.click();await new Promise(resolve=>setTimeout(resolve,0));});
    const earlier=[...container.querySelectorAll("button")].find(value=>value.textContent==="Load earlier observations");expect(earlier).toBeTruthy();
    await act(async()=>{earlier?.click();await new Promise(resolve=>setTimeout(resolve,0));});expect(container.textContent).toContain("AAA");await act(async()=>root.unmount());
  });
  it("discards a completed review response after the selected date changes",async()=>{
    let resolveReview:((response:Response)=>void)|undefined;const pending=new Promise<Response>(resolve=>{resolveReview=resolve;});
    const fetch=vi.fn((input:RequestInfo|URL)=>String(input).includes("/health")
      ?Promise.resolve(Response.json({health:{state:"missing",lastCycleAtUtc:null,lastCycleId:null,lastStatus:null,tradingDate:null,session:null,cyclesToday:0,observationsToday:0,evidenceBytesToday:0,controlDatabaseBytes:0,bytesPerObservation:null,projectedTwentyDayBytes:null,queueDepth:0,droppedCycles:0,lastWriteDurationMs:null,lastError:null}}))
      :pending);vi.stubGlobal("fetch",fetch);
    const container=document.createElement("div");document.body.append(container);const root=createRoot(container);
    await act(async()=>{root.render(createElement(ScannerAuditClient));await new Promise(resolve=>setTimeout(resolve,0));});
    const load=[...container.querySelectorAll("button")].find(value=>value.textContent==="Load review");act(()=>load?.click());
    const date=container.querySelector('input[type="date"]') as HTMLInputElement;await act(async()=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;setter?.call(date,"2026-11-03");date.dispatchEvent(new Event("input",{bubbles:true}));});
    await act(async()=>{resolveReview?.(Response.json({review:{tradingDate:"2026-11-02",sessions:[{session:"regular",cycles:999,partialCycles:0,observations:999,gainerQualified:0,momentumQualified:0,gainerDisplayed:0,momentumDisplayed:0}],rejectionReasons:[]}}));await pending;await new Promise(resolve=>setTimeout(resolve,0));});
    expect(container.textContent).not.toContain("999 cycles");expect(container.textContent).toContain("Load review");await act(async()=>root.unmount());
  });
});
