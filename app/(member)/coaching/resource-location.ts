"use client";
import {useSyncExternalStore} from 'react';
import {COACHING_HISTORY_CHANGE,installCoachingHistoryTracking} from '@/app/coaching-review-history';
function subscribe(listener:()=>void){installCoachingHistoryTracking();window.addEventListener('popstate',listener);window.addEventListener('hashchange',listener);window.addEventListener(COACHING_HISTORY_CHANGE,listener);return()=>{window.removeEventListener('popstate',listener);window.removeEventListener('hashchange',listener);window.removeEventListener(COACHING_HISTORY_CHANGE,listener);};}
/** Read-only resources are URL state; navigating them never unmounts feedback or
 * puts private feedback in history. Back/Forward reload only the chosen report. */
export function useIndependentResourceLocation(){
 const hash=useSyncExternalStore(subscribe,()=>window.location.hash,()=>''),parameters=new URLSearchParams(hash.slice(1));
 function change(values:Record<string,string|null>,replace=false){
  const next=new URLSearchParams(window.location.hash.slice(1));for(const [key,value] of Object.entries(values)){if(value===null)next.delete(key);else next.set(key,value);}
  const suffix=next.toString(),url=window.location.pathname+window.location.search+(suffix?`#${suffix}`:'');
  // Passing Next's internal state makes it skip URL synchronization. Let
  // Next preserve its own tree while our history tracker adds entry metadata.
  window.history[replace?'replaceState':'pushState'](null,'',url);
 }
 return {parameters,change};
}
