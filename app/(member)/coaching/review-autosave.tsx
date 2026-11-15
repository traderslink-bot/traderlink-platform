"use client";

import {createContext,useContext,useState,useSyncExternalStore,type ReactNode} from 'react';

export type ReviewSaveState={dirty:boolean;pending:boolean;error:string};
export type ReviewDraftController={flush:()=>Promise<void>};
type Snapshot=ReviewSaveState&{revision:number};
function createScope(){
 const controllers=new Map<string,ReviewDraftController>(),states=new Map<string,ReviewSaveState>(),listeners=new Set<()=>void>();
 let snapshot:Snapshot={dirty:false,pending:false,error:'',revision:0},flushing:Promise<void>|null=null;
 const publish=()=>{const values=[...states.values()];snapshot={dirty:values.some(s=>s.dirty),pending:values.some(s=>s.pending),error:values.find(s=>s.error)?.error??'',revision:snapshot.revision+1};listeners.forEach(listener=>listener());};
 return {
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  getSnapshot:()=>snapshot,
  register:(id:string,controller:ReviewDraftController)=>{controllers.set(id,controller);return()=>{if(controllers.get(id)===controller){controllers.delete(id);states.delete(id);publish();}};},
  update:(id:string,state:ReviewSaveState)=>{const old=states.get(id);if(old?.dirty===state.dirty&&old.pending===state.pending&&old.error===state.error)return;states.set(id,state);publish();},
  flush:()=>{
   if(flushing)return flushing;
   flushing=(async()=>{for(const controller of controllers.values())await controller.flush();if(snapshot.dirty||snapshot.pending||snapshot.error)throw new Error(snapshot.error||'Your latest feedback has not finished saving.');})().finally(()=>{flushing=null;});
   return flushing;
  },
 };
}
type ReviewScope=ReturnType<typeof createScope>;
const Context=createContext<ReviewScope|null>(null);
export function ReviewAutosaveProvider({children}:{children:ReactNode}){const [scope]=useState(createScope);return <Context.Provider value={scope}>{children}</Context.Provider>;}
export function useReviewAutosaveScope(){return useContext(Context);}
const empty:Snapshot={dirty:false,pending:false,error:'',revision:0};
const noopSubscribe=()=>()=>{};
const emptySnapshot=()=>empty;
export function useReviewSaveState(){const scope=useReviewAutosaveScope();return useSyncExternalStore(scope?.subscribe??noopSubscribe,scope?.getSnapshot??emptySnapshot,emptySnapshot);}
