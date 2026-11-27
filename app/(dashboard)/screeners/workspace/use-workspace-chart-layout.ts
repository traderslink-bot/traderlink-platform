'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type SetStateAction} from 'react';
import {chartSymbol,type ChartTimeframe} from '@/src/modules/scanner/alpaca/candles';
import {chartCount,parseChartMultiview,reconcileChartTickers,singleChart,type ChartMultiview} from '@/src/modules/scanner/alpaca/chart-multiview';
import {keepSelectedWorkspaceChart,replaceWorkspaceChart} from './workspace-chart-panels';
import {chartViews} from '../../charts/chart-view-memory';
import {workspaceChartArrangement,type WorkspaceChartLayout} from './workspace-chart-arrangement';

export const workspaceChartKey=(owner:string,broker=false)=>broker?
 `traderslink.workspace.broker-chart.v1:${owner}`:`traderslink.workspace.charts.v1:${owner}`;
function parseWorkspaceChartLayout(value:WorkspaceChartLayout):WorkspaceChartLayout{
 const {arrangement,...chartLayout}=value;
 const layout=parseChartMultiview(chartLayout);
 return arrangement && chartCount(layout)>1
  ? {...layout,arrangement:workspaceChartArrangement(layout,arrangement)} : layout;
}
export function readWorkspaceChartLayout(raw:string|null):WorkspaceChartLayout|null{
 try{if(!raw||raw.length>8192)return null;const layout=parseWorkspaceChartLayout(JSON.parse(raw));return layout.groups.length?layout:null;}catch{return null;}
}
export function workspaceChartMemoryLayout(layout:ChartMultiview):ChartMultiview{
 return {...layout,selectedPanel:layout.selectedPanel?`workspace-card-${layout.selectedPanel}`:null,
  groups:layout.groups.map(group=>({...group,panels:group.panels.map(panel=>({...panel,id:`workspace-card-${panel.id}`}))}))};
}
/** Persist coordinates/configuration only; no chart instances, candles or subscriptions. */
export function useWorkspaceChartLayout(owner:string|undefined, singlePanel=false){
 const storageKey=owner?workspaceChartKey(owner,singlePanel):null;
 const [state,setState]=useState<{key:string|null;layout:WorkspaceChartLayout|null}>({key:null,layout:null});
 const current=useRef(state);
 const committedKey=useRef(storageKey);
 useLayoutEffect(()=>{
  committedKey.current=storageKey;
  return()=>{committedKey.current=null;};
 },[storageKey]);
 useEffect(()=>{
  if(!owner||!storageKey)return;
  const read=()=>{
   try{
    const layout=readWorkspaceChartLayout(localStorage.getItem(storageKey));
    return layout&&singlePanel?keepSelectedWorkspaceChart(layout):layout;
   }catch{return null;}
  };
  const frame=requestAnimationFrame(()=>{
   const layout=read();
   if(layout&&!singlePanel)chartViews.retain(owner,'workspace',workspaceChartMemoryLayout(layout));
   current.current={key:storageKey,layout};setState(current.current);
  });
  const sync=(event:StorageEvent)=>{
   if(event.key!==storageKey||event.storageArea!==localStorage||committedKey.current!==storageKey)return;
   const layout=read();
   current.current={key:storageKey,layout};setState(current.current);
  };
  if(singlePanel)window.addEventListener("storage",sync);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener("storage",sync);};
 },[owner,singlePanel,storageKey]);
 const change=useCallback((update:SetStateAction<WorkspaceChartLayout|null>)=>{
  if(!owner||!storageKey||committedKey.current!==storageKey||current.current.key!==storageKey)return;
  const candidate=typeof update==='function'?update(current.current.layout):update;
  if(candidate===current.current.layout)return;
  const parsed=candidate?parseWorkspaceChartLayout({arrangement:current.current.layout?.arrangement,...candidate}):null;
  const layout=parsed&&singlePanel?keepSelectedWorkspaceChart(parsed):parsed;
  if(!singlePanel)chartViews.retain(owner,'workspace',workspaceChartMemoryLayout(layout??{version:1,groups:[],selectedPanel:null}));
  try{if(layout)localStorage.setItem(storageKey,JSON.stringify(layout));else localStorage.removeItem(storageKey);}catch{/* Keep this session usable if browser storage is unavailable. */}
  current.current={key:storageKey,layout};setState(current.current);
 },[owner,singlePanel,storageKey]);
 const openTicker=useCallback((ticker:string,timeframe:ChartTimeframe,replacePanel?:string)=>{
  if(!owner||!storageKey||committedKey.current!==storageKey||current.current.key!==storageKey)return "unavailable";
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
 },[change,owner,storageKey]);
 return {layout:state.key===storageKey?state.layout:null,ready:!!owner&&state.key===storageKey,change,openTicker};
}
