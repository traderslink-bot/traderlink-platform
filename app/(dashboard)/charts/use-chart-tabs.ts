"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {initialChartTabs,parseChartTabs,chartTabsInventory,type ChartTabs} from "@/src/modules/scanner/alpaca/chart-tabs";
import {EMPTY_MULTIVIEW} from "@/src/modules/scanner/alpaca/chart-multiview";
import {PLATFORM_MUTATION_REQUEST_HEADER} from "@/src/modules/platform/contracts/platform-request-security";
import {chartViews} from "./chart-view-memory";

export function useChartTabs(){
 const [book,setBook]=useState<ChartTabs>(()=>initialChartTabs(EMPTY_MULTIVIEW));
 const [ready,setReady]=useState(false),[message,setMessage]=useState("");
 const owner=useRef(""),revision=useRef(0),alive=useRef(false),queue=useRef(Promise.resolve()),serial=useRef(0);
 useEffect(()=>{alive.current=true;const controller=new AbortController();
  void fetch('/api/charts/tabs',{cache:'no-store',signal:controller.signal}).then(async response=>{
   if(!response.ok)throw Error();const result=await response.json();if(typeof result.ownerKey!=="string"||!Number.isSafeInteger(result.revision))throw Error();
   const next=parseChartTabs(result.layout);owner.current=result.ownerKey;revision.current=result.revision;chartViews.retain(owner.current,"main",chartTabsInventory(next));setBook(next);setReady(true);
  }).catch(()=>{if(!controller.signal.aborted)setMessage("Saved chart tabs could not load. Reload to try again.");});
  return()=>{alive.current=false;controller.abort();};
 },[]);
 const change=useCallback((value:ChartTabs)=>{
  const next=parseChartTabs(value);if(!owner.current)return;
  chartViews.retain(owner.current,"main",chartTabsInventory(next));setBook(next);
  const sequence=++serial.current;setMessage("Saving view…");
  queue.current=queue.current.then(async()=>{try{
   const response=await fetch('/api/charts/tabs',{method:'POST',credentials:'same-origin',keepalive:new TextEncoder().encode(JSON.stringify(next)).length<60000,headers:{'Content-Type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},body:JSON.stringify({ownerKey:owner.current,revision:revision.current,layout:next})});
   if(!response.ok)throw Error(response.status===409?"Chart tabs changed elsewhere. Reload before editing again.":"Chart tabs were not saved. Make the change again to retry.");
   const result=await response.json();revision.current=result.revision;if(alive.current&&serial.current===sequence)setMessage("View saved");
  }catch(error){if(alive.current&&serial.current===sequence)setMessage(error instanceof Error?error.message:"Chart tabs were not saved.");}});
 },[]);
 return {book,change,ready,message};
}
