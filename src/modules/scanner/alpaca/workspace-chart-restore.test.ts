import {describe,it,expect} from 'vitest';
import {readWorkspaceChartLayout,workspaceChartKey,workspaceChartMemoryLayout} from '@/app/(dashboard)/screeners/workspace/use-workspace-chart-layout';
import {ChartViewMemory} from '@/app/(dashboard)/charts/chart-view-memory';
import {singleChart} from './chart-multiview';
describe('workspace chart restoration',()=>{
 it('restores the selected ticker and timeframes without changing IDs',()=>{const layout=singleChart('SMTK','15m');expect(readWorkspaceChartLayout(JSON.stringify(layout))).toEqual(layout);expect(workspaceChartKey('a')).not.toBe(workspaceChartKey('b'));});
 it('rejects malformed, excessive and empty layouts without replacing startup behavior',()=>{for(const raw of [null,'{bad','x'.repeat(8193),JSON.stringify({version:1,groups:[],selectedPanel:null})])expect(readWorkspaceChartLayout(raw)).toBeNull();});
 it('registers actual renderer IDs and isolates compact view settings from the drawer',()=>{const memory=new ChartViewMemory(()=>undefined),layout=singleChart('SMTK','15m'),mapped=workspaceChartMemoryLayout(layout);expect(mapped.groups[0].panels[0].id).toBe('workspace-card-chart-1');memory.retain('owner','workspace',mapped);const display={enabled:{EMA:false},hidden:new Set<'EMA'>(['EMA'])};memory.writeIndicatorDisplay('owner','workspace','workspace-card-chart-1','SMTK',display);memory.retain('owner','scanner',singleChart('OMH'));expect(memory.readIndicatorDisplay('owner','workspace','workspace-card-chart-1','SMTK')).toBe(display);memory.retain('owner','workspace',workspaceChartMemoryLayout(singleChart('OMH')));expect(memory.readIndicatorDisplay('owner','workspace','workspace-card-chart-1','OMH')).not.toBe(display);});
});

it('a delayed automatic initializer cannot replace a newer user chart selection',async()=>{
 const {createElement,act,useLayoutEffect}=await import('react');
 const {createRoot}=await import('react-dom/client');
 const {useWorkspaceChartLayout}=await import('@/app/(dashboard)/screeners/workspace/use-workspace-chart-layout');
 const {vi}=await import('vitest');
 const frames=new Map<number,FrameRequestCallback>();let serial=0;
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.set(++serial,callback);return serial;});
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>frames.delete(id));
 let api:ReturnType<typeof useWorkspaceChartLayout>|undefined;
 function Probe(){const value=useWorkspaceChartLayout('initializer-race');useLayoutEffect(()=>{api=value;},[value]);return null;}
 const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
 try{
  await act(async()=>root.render(createElement(Probe)));
  await act(async()=>{for(const [id,callback] of [...frames]){frames.delete(id);callback(0);}});
  expect(api?.ready).toBe(true);
  const explicit=singleChart('OPTT','5m');
  await act(async()=>{api!.change(explicit);api!.change(current=>current??singleChart('SHFS','1m'));});
  expect(api!.layout).toEqual(explicit);
  expect(readWorkspaceChartLayout(localStorage.getItem(workspaceChartKey('initializer-race')))).toEqual(explicit);
 }finally{await act(async()=>root.unmount());node.remove();vi.unstubAllGlobals();}
});
