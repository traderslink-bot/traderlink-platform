import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ScannerProviderControls } from "@/app/(dashboard)/screeners/scanner-provider-controls";
import { adminControlView } from "./server/admin-control-view";

it("keeps named admin options, real switching payloads and acknowledgement recovery without storing names",async()=>{
  let row=adminControlView({feature:'charts',provider:'alpaca',revision:0,available:true});const calls:{method:string;body?:string}[]=[];let lost=false;
  const fetcher=vi.fn<typeof fetch>(async(_url,init)=>{calls.push({method:init?.method??'GET',body:typeof init?.body==='string'?init.body:undefined});
    if(init?.method==='POST'){const body=JSON.parse(String(init.body));row=adminControlView({...row,provider:body.provider,revision:row.revision+1});if(lost)throw Error('network acknowledgement lost');}
    return Response.json({selections:[row]});});
  vi.stubGlobal('fetch',fetcher);const host=document.createElement('div'),root=createRoot(host);document.body.append(host);
  try{
    await act(async()=>root.render(<ScannerProviderControls/>));expect(host.textContent).toContain('Alpaca');expect(host.textContent).toContain('Use Moomoo');
    await act(async()=>{(host.querySelector('input') as HTMLInputElement).click();});
    expect(JSON.parse(calls.find(c=>c.method==='POST')!.body!)).toEqual({feature:'charts',provider:'moomoo',revision:0});
    expect(host.textContent).toContain('Moomoo');expect(localStorage.getItem('traderslink.market-data.updated')).toMatch(/^\d+$/);
    lost=true;await act(async()=>{(host.querySelector('input') as HTMLInputElement).click();});
    expect(row.provider).toBe('alpaca');expect(host.textContent).toContain('Alpaca');expect(host.textContent).toContain('could not be switched');
    expect((host.querySelector('input') as HTMLInputElement).checked).toBe(false);
  }finally{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();localStorage.clear();}
});

it("preserves the Watchlist previous-provider description and explicit repair action",()=>{
  const row=adminControlView({feature:'watchlist',provider:'custom',revision:2,available:true,synchronized:false});
  expect(row.controls.description).toContain('EODHD');expect(row.controls.description).toContain('Moomoo');
  expect(row.controls.alternate.label).toBe('Use previous setup');expect(row.controls.repair).toEqual({provider:'alpaca',label:'Complete switch'});
});
