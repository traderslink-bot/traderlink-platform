import {act,createElement,StrictMode,useLayoutEffect} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {useWorkspaceChartLayout,workspaceChartKey} from '@/app/(dashboard)/screeners/workspace/use-workspace-chart-layout';
import {singleChart} from './chart-multiview';

type API=ReturnType<typeof useWorkspaceChartLayout>;
let frames:Map<number,FrameRequestCallback>,serial:number;
const roots=new Set<Root>();
beforeEach(()=>{
 localStorage.clear();frames=new Map();serial=0;
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.set(++serial,callback);return serial;});
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>frames.delete(id));
});
afterEach(async()=>{for(const root of roots)await act(async()=>root.unmount());roots.clear();vi.restoreAllMocks();vi.unstubAllGlobals();});
async function mount(owner:string|undefined,strict=false){
 let api:API|undefined;const root=createRoot(document.createElement('div'));roots.add(root);
 function Probe({owner}:{owner:string|undefined}){const value=useWorkspaceChartLayout(owner);useLayoutEffect(()=>{api=value;},[value]);return null;}
 const render=async(owner:string|undefined)=>{await act(async()=>root.render(strict?createElement(StrictMode,null,createElement(Probe,{owner})):createElement(Probe,{owner})));};
 await render(owner);
 return {get api(){return api!;},render,unmount:async()=>{await act(async()=>root.unmount());roots.delete(root);}};
}
async function hydrate(){await act(async()=>{for(const [id,callback] of [...frames]){frames.delete(id);callback(0);}});}

describe('workspace chart lifecycle',()=>{
 it('keeps the live callback enabled after Strict Mode repeats effect setup',async()=>{
  const h=await mount('alpha',true);await hydrate();expect(h.api.ready).toBe(true);const selected=singleChart('OPTT','5m');await act(async()=>h.api.change(selected));expect(h.api.layout).toEqual(selected);expect(JSON.parse(localStorage.getItem(workspaceChartKey('alpha'))!)).toEqual(selected);
 });
 it('rejects a previous owner callback before the new owner hydration frame',async()=>{
  const first=singleChart('SMTK','15m'),second=singleChart('OPTT','5m');
  localStorage.setItem(workspaceChartKey('alpha'),JSON.stringify(first));localStorage.setItem(workspaceChartKey('beta'),JSON.stringify(second));
  const h=await mount('alpha');await hydrate();const oldChange=h.api.change;
  await h.render('beta');expect(h.api.ready).toBe(false);expect(h.api.layout).toBeNull();
  await act(async()=>oldChange(singleChart('RAIN','1m')));
  expect(JSON.parse(localStorage.getItem(workspaceChartKey('alpha'))!)).toEqual(first);
  await hydrate();expect(h.api.layout).toEqual(second);
 });
 it('does not let a callback from a closed workspace rewrite its saved configuration',async()=>{
  const first=singleChart('SMTK','15m');localStorage.setItem(workspaceChartKey('alpha'),JSON.stringify(first));
  const h=await mount('alpha');await hydrate();const oldChange=h.api.change;await h.unmount();
  await act(async()=>oldChange(singleChart('RAIN','1m')));
  expect(JSON.parse(localStorage.getItem(workspaceChartKey('alpha'))!)).toEqual(first);
 });
 it('cancels the old hydration frame when ownership changes before it runs',async()=>{
  const first=singleChart('SMTK','15m'),second=singleChart('OPTT','5m');localStorage.setItem(workspaceChartKey('alpha'),JSON.stringify(first));localStorage.setItem(workspaceChartKey('beta'),JSON.stringify(second));
  const h=await mount('alpha');await h.render('beta');await hydrate();expect(h.api.ready).toBe(true);expect(h.api.layout).toEqual(second);
 });
 it('keeps startup and ticker selection usable when browser storage is blocked',async()=>{
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new DOMException('Blocked','SecurityError');});vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Blocked','SecurityError');});
  const h=await mount('alpha');await hydrate();expect(h.api.ready).toBe(true);expect(h.api.layout).toBeNull();const selected=singleChart('OPTT','5m');await act(async()=>h.api.change(selected));expect(h.api.layout).toEqual(selected);
 });
 it('ignores a no-op initializer without writing storage again',async()=>{
  const first=singleChart('SMTK','15m');localStorage.setItem(workspaceChartKey('alpha'),JSON.stringify(first));const h=await mount('alpha');await hydrate();const write=vi.spyOn(Storage.prototype,'setItem');await act(async()=>h.api.change(current=>current??singleChart('RAIN','1m')));expect(write).not.toHaveBeenCalled();expect(h.api.layout).toEqual(first);
 });
});
