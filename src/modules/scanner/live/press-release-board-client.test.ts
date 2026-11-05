// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

vi.mock("@/app/dashboard-template",()=>({DashboardPanel:({children}:{children:ReactNode})=>createElement("section",null,children)}));
vi.mock("@/app/(dashboard)/press-releases/press-release-actions",()=>({markPressReleaseRead:vi.fn()}));
import { ScreenerPressReleaseBoard, selectCompactArticles } from "@/app/(dashboard)/screeners/screener-press-release-board";

beforeAll(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;});
let root:Root|null=null;
afterEach(async()=>{vi.useRealTimers();vi.unstubAllGlobals();if(root)await act(async()=>root!.unmount());root=null;document.body.replaceChildren();});

const article=(id:string,ticker:string,publishedAt:string,routeTag="default")=>({
  id,ticker,headline:`Headline ${id}`,marketCap:"$12M",isRead:false,publishedAt,
  articleText:"Full stored article text.",eventType:"press_release",negatives:[],positives:["Material update"],
  publicPath:`/news/${ticker}/${id}`,riskFlags:[],routeTag,sourceUrl:"https://example.com/source",
  summary:"Short summary.",summaryUnavailable:false,supportResistanceLevels:[],
});

it("keeps at most ten compact releases while preferring today",()=>{
  const previous=[article("old-1","OLD1","2026-11-04T15:30:00.000Z"),article("old-2","OLD2","2026-11-04T14:30:00.000Z"),article("old-3","OLD3","2026-11-04T13:30:00.000Z")];
  expect(selectCompactArticles([article("today-1","NEW1","2026-11-05T15:30:00.000Z"),...previous],{today:"2026-11-05",previous:"2026-11-04"}).map(item=>item.id)).toEqual(["today-1","old-1","old-2","old-3"]);
  expect(selectCompactArticles([article("today-3","NEW3","2026-11-05T16:30:00.000Z"),article("today-2","NEW2","2026-11-05T16:00:00.000Z"),article("today-1","NEW1","2026-11-05T15:30:00.000Z"),...previous],{today:"2026-11-05",previous:"2026-11-04"}).map(item=>item.id)).toEqual(["today-3","today-2","today-1","old-1","old-2","old-3"]);
});

it("combines active halts with three PRs and uses one drawer for lists and article reading",async()=>{
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-05T15:31:00.000Z"));
  const scanner=[
    article("today-1","AAA","2026-11-05T15:30:00.000Z"),
    article("today-2","BBB","2026-11-05T14:30:00.000Z"),
    article("today-3","CCC","2026-11-05T13:30:00.000Z"),
    article("today-4","DDD","2026-11-05T12:30:00.000Z"),
    article("previous-1","OLD","2026-11-04T15:30:00.000Z"),
  ];
  const under30=[article("cap-1","CAP","2026-11-05T16:00:00.000Z","market_cap_under_30m")];
  const fetch=vi.fn(async(input:RequestInfo|URL)=>{
    const url=String(input);
    if(url==="/api/market-halts/current")return Response.json({tradingDate:"2026-11-05",updatedAtUtc:"2026-11-05T15:00:00Z",rows:[
      {id:"active",ticker:"HALT",market:"NASDAQ",haltTimeEt:"10:30:00",reasonCode:"LUDP",reason:"Pause",quoteTimeEt:"10:35:00",tradeTimeEt:"10:40:00",source:"nasdaq",sourceUrl:"https://example.com/halts"},
      {id:"resumed",ticker:"DONE",market:"NASDAQ",haltTimeEt:"09:30:00",reasonCode:"LUDP",reason:"Pause",quoteTimeEt:"09:35:00",tradeTimeEt:"09:40:00",source:"nasdaq",sourceUrl:"https://example.com/halts"},
    ]});
    if(url.includes("channel=market_cap_under_30m"))return Response.json({articles:under30,easternDate:"2026-11-05",previousTradingDate:"2026-11-04"});
    if(url.includes("view=expanded-summary"))return Response.json({articles:scanner,easternDate:"2026-11-05",previousTradingDate:"2026-11-04"});
    if(url.startsWith("/api/admin/screeners/floats?"))return Response.json({exchanges:{AAA:"NASDAQ",BBB:"NYSE",CCC:"NASDAQ"},floats:{AAA:{shares:500000},BBB:{shares:600000},CCC:{shares:700000}}});
    if(url.includes("articleId=cap-1"))return Response.json({article:under30[0]});
    throw Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch",fetch);
  const onOpenChart=vi.fn();
  const container=document.createElement("div");document.body.append(container);root=createRoot(container);
  await act(async()=>{root!.render(createElement(ScreenerPressReleaseBoard,{onOpenChart}));});
  await act(async()=>{await Promise.resolve();await Promise.resolve();});

  expect(container.textContent).toContain("Market Events");
  expect(container.textContent).toContain("HALT");
  expect(container.textContent).toContain("Quote 10:35 ET");
  expect(container.textContent).toContain("Trade 10:40 ET");
  expect(container.textContent).not.toContain("DONE");
  expect(container.textContent).toContain("Headline today-1");
  expect(container.textContent).toContain("Headline today-3");
  expect(container.textContent).toContain("Headline today-4");
  expect(container.textContent).toContain("Headline previous-1");
  expect(container.textContent).toContain("All News");
  expect(container.textContent).toContain("View all");
  const haltRegion=container.querySelector('[aria-label="Current halts"]') as HTMLElement;
  const prRegion=container.querySelector('[aria-label="Latest PR Scanner releases"]') as HTMLElement;
  expect(haltRegion).not.toBeNull();
  expect(prRegion).not.toBeNull();
  expect(getComputedStyle(haltRegion).maxHeight).toBe("90px");
  expect(getComputedStyle(haltRegion).marginBottom).toBe("10px");
  expect(getComputedStyle(prRegion).maxHeight).toBe("126px");
  expect(getComputedStyle(prRegion).overflow).toBe("auto");
  await act(async()=>{(container.querySelector('[aria-label="Open AAA chart"]') as HTMLElement).click();});
  expect(onOpenChart).toHaveBeenCalledWith({symbol:"AAA",exchange:"NASDAQ"});
  expect(container.textContent).toContain("Float 500K");
  expect(container.querySelector('[aria-label="Open DDD chart"]')).toBeNull();

  const viewAll=[...container.querySelectorAll("button")].find(button=>button.textContent==="View all") as HTMLElement;
  expect(viewAll.closest('[aria-label="Latest PR Scanner releases"]')).not.toBeNull();
  await act(async()=>viewAll.click());
  const drawer=document.body.querySelector('[role="dialog"][aria-label="PR workspace"]')!;
  expect(drawer).not.toBeNull();
  expect(drawer.querySelector('[aria-label="PR Scanner articles"]')?.querySelectorAll("button")).toHaveLength(4);

  const underTab=[...drawer.querySelectorAll('[role="tab"]')].find(tab=>tab.textContent==="Under $30M") as HTMLElement;
  await act(async()=>underTab.click());
  await act(async()=>{await Promise.resolve();await Promise.resolve();});
  expect(drawer.textContent).toContain("Headline cap-1");
  await act(async()=>([...drawer.querySelectorAll("button")].find(button=>button.textContent?.includes("Headline cap-1")) as HTMLElement).click());
  await act(async()=>{await Promise.resolve();await Promise.resolve();});
  expect(drawer.textContent).toContain("Full stored article text.");
  expect(drawer.querySelectorAll('[role="dialog"]')).toHaveLength(0);
  await act(async()=>([...drawer.querySelectorAll("button")].find(button=>button.textContent?.includes("Back to list")) as HTMLElement).click());
  expect(drawer.textContent).toContain("Headline cap-1");
});
