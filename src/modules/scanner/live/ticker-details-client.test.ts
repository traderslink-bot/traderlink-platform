// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
vi.mock("@/app/dashboard-template",()=>({DashboardPrimaryAction:({children,disabled,onClick}:{children:string;disabled:boolean;onClick:()=>void})=>createElement('button',{disabled,onClick},children)}));
import { ScannerTickerDetails } from "@/app/(dashboard)/screeners/scanner-ticker-details";
let root:Root|undefined;
beforeAll(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.replaceChildren();vi.unstubAllGlobals();});
it('generates only on demand using the selected symbol, retains a map after a failed refresh',async()=>{
 const resistance={side:'resistance',price:2.3,distancePct:.15,label:'Example zone',strengthLabel:'strong',sourceLabel:'Daily example'};
 const map={symbol:'TEST',referencePrice:2,referencePriceAsOf:1793979900000,calculatedAt:1793979900000,cacheStatus:'fresh',levelMap:{currentPrice:2,rangeState:'normal',nearestResistance:resistance,nearestSupport:null,nextStrongResistance:resistance,nextStrongSupport:null,resistanceLevels:[resistance],supportLevels:[]},nearestSupportResistanceCard:null,fullLadderCard:null};
 const fetcher=vi.fn().mockResolvedValueOnce(Response.json({state:'ready',map,preview:true})).mockResolvedValueOnce(Response.json({state:'unavailable',message:'Market data is unavailable.'},{status:503}));vi.stubGlobal('fetch',fetcher);
 const host=document.createElement('div');document.body.append(host);root=createRoot(host);
 await act(async()=>root!.render(createElement(ScannerTickerDetails,{symbol:'TEST',stock:undefined})));
 expect(fetcher).not.toHaveBeenCalled();const button=[...host.querySelectorAll('button')].find(button=>button.textContent==='Generate Levels')!;
 await act(async()=>button.click());expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({symbol:'TEST'});expect(host.textContent).toContain('2.30');expect(host.textContent).not.toContain('+15.0%');expect(host.textContent).not.toContain('Generated ');expect(host.textContent).not.toContain('Sample');expect(host.textContent).not.toContain('Preview example');expect(host.querySelector('[data-level-columns]')?.children.length).toBe(2);
 expect(host.textContent).toContain('Recent News');expect(host.querySelector('[role=tab]')).toBeNull();
 await act(async()=>button.click());expect(host.textContent).toContain('Market data is unavailable.');expect(host.textContent).toContain('2.30');expect(button.disabled).toBe(false);
});
