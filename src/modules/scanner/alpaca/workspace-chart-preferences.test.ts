import {act,createElement,useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {ChartPreferencesContext,useChartPreferences} from '@/app/(dashboard)/charts/use-chart-preferences';
import {DEFAULT_CHART_PREFERENCES} from './chart-preferences';

it('four workspace chart consumers reuse the actual parent preference load and updates',async()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 let finish:((response:Response)=>void)|undefined;
 const transport=vi.fn((url:string,init?:RequestInit)=>{
  if(init?.method==='POST'){const body=JSON.parse(init.body as string);return Promise.resolve(Response.json({...body,revision:2}));}
  return new Promise<Response>(resolve=>{finish=resolve;});
 });vi.stubGlobal('fetch',transport);
 const root=createRoot(document.createElement('div'));
 const children=new Map<number,ReturnType<typeof useChartPreferences>>();let parent:ReturnType<typeof useChartPreferences>|undefined;
 function Child({id}:{id:number}){const value=useChartPreferences();useLayoutEffect(()=>{children.set(id,value);return()=>{children.delete(id);};},[id,value]);return null;}
 function Workspace({show}:{show:boolean}){const value=useChartPreferences();useLayoutEffect(()=>{parent=value;},[value]);return createElement(ChartPreferencesContext.Provider,{value},show?[0,1,2,3].map(id=>createElement(Child,{id,key:id})):null);}
 try{
  await act(async()=>root.render(createElement(Workspace,{show:true})));expect(transport).toHaveBeenCalledTimes(1);expect([...children.values()].every(child=>!child.ready)).toBe(true);
  await act(async()=>{finish!(Response.json({ownerKey:'qa-owner',journalAccountRef:'qa-account',revision:1,preferences:DEFAULT_CHART_PREFERENCES}));});
  for(let i=0;i<20&&![...children.values()].every(child=>child.ready);i++)await act(async()=>{await new Promise(resolve=>setTimeout(resolve,5));});
  expect(children.size).toBe(4);expect([...children.values()].every(child=>child.ready&&child.ownerKey==='qa-owner')).toBe(true);expect(transport).toHaveBeenCalledTimes(1);
  await act(async()=>root.render(createElement(Workspace,{show:false})));await act(async()=>root.render(createElement(Workspace,{show:true})));expect(transport).toHaveBeenCalledTimes(1);expect(children.size).toBe(4);
  await act(async()=>parent!.change({...parent!.preferences,timeframe:'15m'}));expect([...children.values()].every(child=>child.preferences.timeframe==='15m')).toBe(true);expect(transport).toHaveBeenCalledTimes(2);expect(transport.mock.calls[1][1]?.method).toBe('POST');
 }finally{await act(async()=>root.unmount());vi.unstubAllGlobals();}
});
