"use client";

// Only navigation metadata is retained. Review/student drafts never leave their
// React/form memory. Track entry positions from the first dashboard visit so a
// review can restore arbitrary Back/Forward jumps without truncating history.
export const COACHING_HISTORY_CHANGE="coaching-review-history-change";
const field="traderlinkHistoryEntry";
export type CoachingHistoryEntry={generation:string;index:number;key:string};
export function coachingHistoryEntry(state:unknown):CoachingHistoryEntry|null{
 if(!state||typeof state!=="object")return null;
 const value=(state as Record<string,unknown>)[field];if(!value||typeof value!=="object")return null;
 const item=value as Partial<CoachingHistoryEntry>;
 return typeof item.generation==='string'&&typeof item.key==='string'&&typeof item.index==='number'&&Number.isSafeInteger(item.index)?item as CoachingHistoryEntry:null;
}

// The Navigation API supplies real positions even for entries created before
// tracking began. Never infer a direction from an untracked entry's URL.
export function coachingBrowserHistoryIndex():number|null{
 if(typeof window==='undefined')return null;
 const index=(window as Window&{navigation?:{currentEntry?:{index?:number}}}).navigation?.currentEntry?.index;
 return typeof index==='number'&&Number.isSafeInteger(index)&&index>=0?index:null;
}

export function installCoachingHistoryTracking(){
 if(typeof window==='undefined')return;
 const tracked=window as Window&{traderlinkHistoryTracking?:boolean};if(tracked.traderlinkHistoryTracking)return;
 tracked.traderlinkHistoryTracking=true;
 const push=window.history.pushState.bind(window.history),replace=window.history.replaceState.bind(window.history);
 const initial=coachingHistoryEntry(window.history.state)??{generation:crypto.randomUUID(),index:0,key:crypto.randomUUID()};
 replace({...window.history.state,[field]:initial},'',window.location.href);
 let last={entry:initial,href:window.location.href};
 const remember=()=>{const entry=coachingHistoryEntry(window.history.state);if(entry)last={entry,href:window.location.href};window.dispatchEvent(new Event(COACHING_HISTORY_CHANGE));};
 // A null-state pop may be an old entry OR a native fragment creation.
 // Without a real browser position, leave it unindexed for the draft guard.
 let popped=false;
 window.addEventListener('popstate',()=>{
  popped=true;
  const entry=coachingHistoryEntry(window.history.state);
  if(entry&&entry.key!==last.entry.key)last={entry,href:window.location.href};
 },true);
 window.addEventListener('hashchange',event=>{
  const wasPop=popped;popped=false;
  if(event.oldURL!==last.href)return;
  const previous=new URL(event.oldURL),next=new URL(event.newURL);
  if(previous.origin!==next.origin||previous.pathname!==next.pathname||previous.search!==next.search)return;
  const current=coachingHistoryEntry(window.history.state);
  if(wasPop||!current||current.key!==last.entry.key)return;
  const entry={generation:last.entry.generation,index:last.entry.index+1,key:crypto.randomUUID()};
  replace({...window.history.state,[field]:entry},'',window.location.href);remember();
 });
 window.history.pushState=(data:unknown,unused:string,url?:string|URL|null)=>{
  if(data!==null&&typeof data!=='object'){push(data,unused,url);return;}
  const previous=coachingHistoryEntry(window.history.state);
  const entry={generation:previous?.generation??crypto.randomUUID(),index:previous?previous.index+1:0,key:crypto.randomUUID()};
  push({...data as object,[field]:entry},unused,url);
  remember();
 };
 window.history.replaceState=(data:unknown,unused:string,url?:string|URL|null)=>{
  if(data!==null&&typeof data!=='object'){replace(data,unused,url);return;}
  const entry=coachingHistoryEntry(window.history.state)??{generation:crypto.randomUUID(),index:0,key:crypto.randomUUID()};
  replace({...data as object,[field]:entry},unused,url);
  remember();
 };
}
