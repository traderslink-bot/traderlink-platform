'use client';
import {useEffect,useState} from 'react';
import {mergeMobileLayoutSave,defaultMobileLayout,defaultMobileLayouts,readMobileLayouts,type MobileLayout,type MobileLayouts,type MobileOrientation} from './scanner-mobile-layout';
type DraftSnapshot={name:string;sourceName:string;layout:MobileLayout};
type Draft=DraftSnapshot&{history:DraftSnapshot[]};
const snapshot=({name,sourceName,layout}:DraftSnapshot):DraftSnapshot=>({name,sourceName,layout});
export function useMobileWorkspaceLayout(owner:string|null|undefined,orientation:MobileOrientation){
 const key=owner?`traderslink.workspace.mobile.v1:${owner}`:null;
 const [state,setState]=useState<{key:string|null;value:MobileLayouts}>(()=>({key:null,value:defaultMobileLayouts()}));
 const [drafts,setDrafts]=useState<Partial<Record<MobileOrientation,Draft>>>({});
 const [error,setError]=useState('');
 useEffect(()=>{const frame=requestAnimationFrame(()=>{let value=defaultMobileLayouts();try{if(key){const saved=localStorage.getItem(key);value=readMobileLayouts(JSON.parse(saved??'null'));if(saved===null){const mode=localStorage.getItem('traderslink.scanner.mobile-layout.v1')==='tabs'?'tabs':'stacked';for(const lane of ['portrait','landscape'] as const)value[lane].layouts[0].layout.mode=mode;}}}catch{/* Defaults remain usable. */}setState({key,value});setDrafts({});setError('');});return()=>cancelAnimationFrame(frame);},[key]);
 const ready=!!key&&state.key===key;
 const value=state.key===key?state.value:defaultMobileLayouts(),lane=value[orientation];
 const draft=state.key===key?drafts[orientation]:undefined;
 const layout=draft?.layout??lane.layouts.find(l=>l.name===lane.active)?.layout??defaultMobileLayout(orientation);
 const persist=(next:MobileLayouts)=>{
  if(!ready)return false;
  try{
   const saved=localStorage.getItem(key!);const latest=saved===null?value:readMobileLayouts(JSON.parse(saved));
   let merged:MobileLayouts;
   try{merged=mergeMobileLayoutSave(value,next,latest,orientation);}catch{setState({key,value:latest});setError('This layout changed in another tab. Cancel and reopen it, or save with a different name.');return false;}
   localStorage.setItem(key!,JSON.stringify(merged));setState({key,value:merged});setError('');return true;
  }catch{setError('Changes could not be saved. Your saved layout is unchanged. Try again.');return false;}
 };
 const update=(next:MobileLayout)=>{
  if(!ready)return;
  if(draft)setDrafts(old=>({...old,[orientation]:{...draft,layout:next,history:[...draft.history.slice(-19),snapshot(draft)]}}));
  else persist({...value,[orientation]:{...lane,layouts:[...lane.layouts.filter(l=>l.name!==lane.active),{name:lane.active,layout:next}]}});
 };
 const cancel=()=>{setDrafts(old=>({...old,[orientation]:undefined}));setError('');};
 return {layout,lane,editing:!!draft,name:draft?.name??lane.active,selectedName:draft?.sourceName??lane.active,error,ready,
  clearError:()=>setError(''),
  update,start:()=>{if(!ready)return;setDrafts(old=>({...old,[orientation]:{name:lane.active,sourceName:lane.active,layout,history:[]}}));},cancel,
  setName:(name:string)=>{if(draft)setDrafts(old=>({...old,[orientation]:{...draft,name}}));},
  select:(name:string)=>{const selected=lane.layouts.find(l=>l.name===name);if(selected&&draft)setDrafts(old=>({...old,[orientation]:{name,sourceName:name,layout:selected.layout,history:[...draft.history.slice(-19),snapshot(draft)]}}));},
  save:()=>{if(!ready||!draft?.name.trim())return false;const name=draft.name.trim();if(!persist({...value,[orientation]:{active:name,layouts:[...lane.layouts.filter(l=>l.name!==name),{name,layout:draft.layout}]}}))return false;cancel();return true;},
  reset:()=>update(defaultMobileLayout(orientation)),canUndo:!!draft?.history.length,
  undo:()=>{if(draft?.history.length)setDrafts(old=>({...old,[orientation]:{...draft,...draft.history.at(-1)!,history:draft.history.slice(0,-1)}}));},
 };
}
