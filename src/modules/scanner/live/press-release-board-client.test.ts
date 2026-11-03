// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

vi.mock("@/app/dashboard-template",()=>({DashboardPanel:({children}:{children:ReactNode})=>createElement("section",null,children)}));
vi.mock("next/dynamic",()=>({default:()=>()=>null}));
vi.mock("@/app/(dashboard)/press-releases/press-release-actions",()=>({markPressReleaseRead:vi.fn()}));
import { ScreenerPressReleaseBoard } from "@/app/(dashboard)/screeners/screener-press-release-board";

beforeAll(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();document.body.replaceChildren();});

it("renders thirty newest-first articles in one scroll region with one news/float request pair",async()=>{
  vi.useFakeTimers();
  const articles=Array.from({length:30},(_,index)=>({id:`article-${index}`,ticker:`T${index}`,headline:`Headline ${index}`,marketCap:"1M",isRead:true}));
  const fetch=vi.fn(async(input:RequestInfo|URL)=>{
    if(String(input).includes("view=expanded-summary"))return Response.json({articles});
    if(String(input).startsWith("/api/admin/screeners/floats?"))return Response.json({floats:{T0:{shares:500000}}});
    if(String(input).includes("articleId=article-0"))return Response.json({article:articles[0]});
    throw Error("Unexpected request");
  });
  vi.stubGlobal("fetch",fetch);
  const container=document.createElement("div");document.body.append(container);const root=createRoot(container);
  try{
    await act(async()=>{root.render(createElement(ScreenerPressReleaseBoard));});
    const regions=container.querySelectorAll('[role="region"][aria-label="PR Scanner articles"]');
    expect(regions.length).toBe(1);
    const buttons=[...regions[0].querySelectorAll('button')];
    expect(buttons.length).toBe(30);
    expect(buttons[0].textContent).toContain("Headline 0");
    expect(buttons[29].textContent).toContain("Headline 29");
    expect(buttons[0].textContent).toContain("Float 500K");
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async()=>{await vi.advanceTimersByTimeAsync(30000);});
    expect(fetch).toHaveBeenCalledTimes(4);
    await act(async()=>buttons[0].click());
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(String(fetch.mock.calls[4][0])).toContain("articleId=article-0");
  }finally{await act(async()=>root.unmount());}
});
