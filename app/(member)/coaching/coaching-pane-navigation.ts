"use client";

import {useEffect,useRef} from 'react';

type ListPosition={focusId:string;scrolls:{element:HTMLElement;top:number;left:number}[];x:number;y:number};

/** In-memory return position for one selected student's list; never stores drafts. */
export function useCoachingPaneReturn(rootId:string,listReady:boolean){
 const position=useRef<ListPosition|null>(null),requested=useRef<{activeBefore:Element|null}|null>(null);
 useEffect(()=>{
  if(!listReady||!requested.current)return;
  const frame=requestAnimationFrame(()=>{
   const request=requested.current;if(!request)return;requested.current=null;
   const root=document.getElementById(rootId),saved=position.current;
   const active=document.activeElement;
   if(!root||!document.hasFocus()||active&&active!==document.body&&active!==request.activeBefore)return;
   if(saved){for(const item of saved.scrolls)if(item.element.isConnected){item.element.scrollTop=item.top;item.element.scrollLeft=item.left;}window.scrollTo(saved.x,saved.y);}
   const row=saved?document.getElementById(saved.focusId):null;
   const target=row&&root.contains(row)?row:root.querySelector<HTMLElement>('[data-coaching-list-fallback]');
   target?.focus({preventScroll:true});
  });
  return()=>cancelAnimationFrame(frame);
 },[rootId,listReady]);
 function rememberList(focusId:string){
  requested.current=null;
  const scrolls:ListPosition['scrolls']=[];
  for(let element=document.getElementById(rootId);element;element=element.parentElement)scrolls.push({element,top:element.scrollTop,left:element.scrollLeft});
  position.current={focusId,scrolls,x:window.scrollX,y:window.scrollY};
 }
 function restoreList(){requested.current={activeBefore:document.activeElement};}
 return {rememberList,restoreList};
}
