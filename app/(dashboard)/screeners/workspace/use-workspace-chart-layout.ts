'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type SetStateAction} from 'react';
import {chartSymbol,type ChartTimeframe} from '@/src/modules/scanner/alpaca/candles';
import {chartCount,parseChartMultiview,reconcileChartTickers,singleChart,type ChartMultiview} from '@/src/modules/scanner/alpaca/chart-multiview';
import {replaceWorkspaceChart} from './workspace-chart-panels';
import {chartViews} from '../../charts/chart-view-memory';

export const workspaceChartKey=(owner:string)=>`traderslink.workspace.charts.v1:${owner}`;
export function readWorkspaceChartLayout(raw:string|null):ChartMultiview|null{
 try{if(!raw||raw.length>8192)return null;const layout=parseChartMultiview(JSON.parse(raw));return layout.groups.length?layout:null;}catch{return null;}
}
export function workspaceChartMemoryLayout(layout:ChartMultiview):ChartMultiview{
 return {...layout,selectedPanel:layout.selectedPanel?`workspace-card-${layout.selectedPanel}`:null,
  groups:layout.groups.map(group=>({...group,panels:group.panels.map(panel=>({...panel,id:`workspace-card-${panel.id}`}))}))};
}
/** Persist coordinates/configuration only; no chart instances, candles or subscriptions. */
export function useWorkspaceChartLayout(owner:string|undefined){
 const [state,setState]=useState<{owner:string|null;layout:ChartMultiview|null}>({owner:null,layout:null});
 const current=useRef(state);
 const committedOwner=useRef(owner);
 useLayoutEffect(()=>{
  committedOwner.current=owner;
  return()=>{committedOwner.current=undefined;};
 },[owner]);
 useEffect(()=>{
  if(!owner)return;
  const frame=requestAnimationFrame(()=>{
   let layout:ChartMultiview|null=null;
   try{layout=readWorkspaceChartLayout(localStorage.getItem(workspaceChartKey(owner)));}catch{/* Startup chart remains available without storage. */}
   if(layout)chartViews.retain(owner,'workspace',workspaceChartMemoryLayout(layout));
   current.current={owner,layout};setState(current.current);
  });
  return()=>cancelAnimationFrame(frame);
 },[owner]);
 const change=useCallback((update:SetStateAction<ChartMultiview|null>)=>{
  if(!owner||committedOwner.current!==owner||current.current.owner!==owner)return;
  const candidate=typeof update==='function'?update(current.current.layout):update;
  if(candidate===current.current.layout)return;
  const layout=candidate?parseChartMultiview(candidate):null;
  chartViews.retain(owner,'workspace',workspaceChartMemoryLayout(layout??{version:1,groups:[],selectedPanel:null}));
  try{if(layout)localStorage.setItem(workspaceChartKey(owner),JSON.stringify(layout));else localStorage.removeItem(workspaceChartKey(owner));}catch{/* Keep this session usable if browser storage is unavailable. */}
  current.current={owner,layout};setState(current.current);
 },[owner]);
 const openTicker=useCallback((ticker:string,timeframe:ChartTimeframe,replacePanel?:string)=>{
  if(!owner||committedOwner.current!==owner||current.current.owner!==owner)return "unavailable";
  const symbol=chartSymbol(ticker);
  const layout=current.current.layout??singleChart(symbol,timeframe);
  const group=layout.groups.find(item=>item.symbol===symbol);
  if(group){
   const selectedPanel=group.panels.some(panel=>panel.id===layout.selectedPanel)
    ?layout.selectedPanel:group.panels[0].id;
   change(selectedPanel===layout.selectedPanel?layout:{...layout,selectedPanel});
   return "opened";
  }
  const count=chartCount(layout);
  if(count===1){
   change({...layout,groups:[{...layout.groups[0],symbol}]});
   return "opened";
  }
  if(count>=4){
   const action=layout.fullGridAction??"ask";
   if(!replacePanel&&action==="keep")return "full";
   const panelId=replacePanel??(action==="selected"?layout.selectedPanel:null);
   if(!panelId)return "choose";
   const next=replaceWorkspaceChart(layout,panelId,symbol);
   if(next===layout)return "choose";
   change(next);
   return "opened";
  }
  const next=reconcileChartTickers(layout,[...layout.groups.map(item=>item.symbol),symbol],timeframe);
  change({...next,selectedPanel:next.groups.at(-1)!.panels[0].id});
  return "opened";
 },[change,owner]);
 return {layout:state.owner===owner?state.layout:null,ready:!!owner&&state.owner===owner,change,openTicker};
}
