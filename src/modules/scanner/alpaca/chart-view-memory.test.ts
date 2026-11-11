import { expect, it } from "vitest";
import { canRestoreChartPrice, ChartViewMemory, defaultIndicatorDisplay, restoreChartRange, type ChartViewSnapshot } from "@/app/(dashboard)/charts/chart-view-memory";
import { singleChart } from "./chart-multiview";
const view: ChartViewSnapshot = {symbol:"OMH",timeframe:"1m",sessions:"[true,true,true]",basisDate:"2026-11-10",range:{from:100,to:180},logicalRange:{from:1.25,to:4.75},axis:{first:80,last:200,count:7,sessions:"[true,true,true]"},anchor:{time:100,offset:0.25},priceRange:{from:1,to:4},autoScale:false,preferenceAutoScale:true,logarithmic:false};
function fixture(){const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};return {values,storage,memory:new ChartViewMemory(()=>storage)};}
it("persists only small view state across page/store lifetimes, isolated by owner, workspace and timeframe",()=>{
 const {memory,storage,values}=fixture();memory.retain("owner-a","main",singleChart("OMH"));memory.write("owner-a","main","chart-1",view);
 const reopened=new ChartViewMemory(()=>storage);expect(reopened.read("owner-a","main","chart-1","OMH","1m",view.sessions)).toEqual(view);
 expect(reopened.read("owner-b","main","chart-1","OMH","1m",view.sessions)).toBeNull();expect(reopened.read("owner-a","scanner","chart-1","OMH","1m",view.sessions)).toBeNull();expect(reopened.read("owner-a","main","chart-1","OMH","5m",view.sessions)).toBeNull();
 expect([...values.values()][0].length).toBeLessThan(1500);expect([...values.values()][0]).not.toContain('"bars"');
});
it("deletes closed/replaced panels and rejects late unmount writes",()=>{
 const {memory,storage}=fixture();memory.retain("owner","main",singleChart("OMH"));memory.write("owner","main","chart-1",view);
 memory.retain("owner","main",{version:1,groups:[],selectedPanel:null});memory.write("owner","main","chart-1",view);
 expect(new ChartViewMemory(()=>storage).read("owner","main","chart-1","OMH","1m",view.sessions)).toBeNull();
 memory.retain("owner","main",singleChart("SMX"));memory.write("owner","main","chart-1",view);expect(memory.read("owner","main","chart-1","OMH","1m",view.sessions)).toBeNull();
});
it("clears drawer views without allowing cleanup to repopulate storage",()=>{const {memory,values}=fixture();memory.retain("o","scanner",singleChart("OMH"));memory.write("o","scanner","chart-1",view);memory.clear("o","scanner");memory.write("o","scanner","chart-1",view);expect(memory.read("o","scanner","chart-1","OMH","1m",view.sessions)).toBeNull();expect([...values.values()].join("")).not.toContain('"OMH"');});
it("restores precise historical anchors after data is prepended and keeps live-follow zoom",()=>{
 expect(restoreChartRange(view,[60,80,100,120,140,160,180,200,220])).toEqual({from:2.25,to:5.75});
 const live={...view,logicalRange:{from:3,to:10}};expect(restoreChartRange(live,[80,100,120,140,160,180,200,220,240])).toEqual({from:5,to:12});
 expect(restoreChartRange(view,[300,400])).toBeNull();
});
it("tolerates unavailable/corrupt storage and rejects invalid ranges",()=>{
 const memory=new ChartViewMemory(()=>{throw Error("blocked");});memory.retain("o","main",singleChart("OMH"));memory.write("o","main","chart-1",view);expect(memory.read("o","main","chart-1","OMH","1m",view.sessions)).toEqual(view);
 memory.write("o","main","chart-1",{...view,logicalRange:{from:0,to:Infinity}});expect(memory.read("o","main","chart-1","OMH","1m",view.sessions)).toEqual(view);
 const corrupt=new ChartViewMemory(()=>({getItem:()=>'{broken',setItem:()=>{},removeItem:()=>{}}));expect(corrupt.read("o","main","chart-1","OMH","1m",view.sessions)).toBeNull();
});

it("does not restore manual price ranges across adjustment dates or changed scale settings",()=>{
 expect(canRestoreChartPrice(view,{autoScale:true,logarithmic:false},"2026-11-10")).toBe(true);
 expect(canRestoreChartPrice(view,{autoScale:true,logarithmic:false},"2026-11-11")).toBe(false);
 expect(canRestoreChartPrice(view,{autoScale:false,logarithmic:false},"2026-11-10")).toBe(false);
 expect(canRestoreChartPrice(view,{autoScale:true,logarithmic:true},"2026-11-10")).toBe(false);
});

it("retains display choices for the same chart while pruning closed or replaced charts",()=>{
  const memory=new ChartViewMemory(()=>undefined);
  const layout={version:1 as const,selectedPanel:"one",groups:[
    {id:"group-1",symbol:"NCT",panels:[{id:"one",timeframe:"1m" as const}]},
    {id:"group-2",symbol:"OMH",panels:[{id:"two",timeframe:"5m" as const}]},
  ]};
  memory.retain("owner","main",layout);
  const display={hidden:new Set(["EMA"] as const),enabled:{SMA:false}};
  memory.writeIndicatorDisplay("owner","main","one","NCT",display);
  expect(memory.readIndicatorDisplay("owner","main","one","NCT")).toBe(display);
  expect(memory.readIndicatorDisplay("owner","main","two","OMH")).toBe(defaultIndicatorDisplay);
  expect(memory.readIndicatorDisplay("owner","scanner","one","NCT")).toBe(defaultIndicatorDisplay);
  memory.retain("owner","main",{...layout,groups:[{...layout.groups[0],symbol:"SMX"},layout.groups[1]]});
  expect(memory.readIndicatorDisplay("owner","main","one","SMX")).toBe(defaultIndicatorDisplay);
  memory.retain("owner","main",layout);
  expect(memory.readIndicatorDisplay("owner","main","one","NCT")).toBe(defaultIndicatorDisplay);
});
