"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {Box,Button,Dialog,DialogActions,DialogContent,DialogTitle} from "@mui/material";
import {useRouter} from "next/navigation";
import {CoachingReviewDirtyContext} from "./coaching-resource-context";
import {coachingBrowserHistoryIndex,installCoachingHistoryTracking,COACHING_HISTORY_CHANGE} from "@/app/coaching-review-history";

export function CoachingReviewDraftGuard({children,readOnly=false}:{children:ReactNode;readOnly?:boolean}){
 const root=useRef<HTMLDivElement|null>(null),router=useRouter();
 const [destination,setDestination]=useState<string|null>(null),[backPending,setBackPending]=useState(false),[unsaved,setUnsaved]=useState(false);
 const leaveByBack=useRef<()=>void>(()=>{}),confirmedDeparture=useRef(false);
 const dirty=()=>{
  const element=root.current;if(!element||readOnly)return false;
  if(element.querySelector('[data-coaching-unsaved="true"]'))return true;
  return [...element.querySelectorAll('form input,form textarea,form select')].some(field=>{
   if(field.closest("[data-coaching-controlled-draft]")||(field instanceof HTMLElement&&field.matches(":disabled")))return false;
   if(field instanceof HTMLInputElement){if(['hidden','submit','button','file'].includes(field.type))return false;return ['checkbox','radio'].includes(field.type)?field.checked!==field.defaultChecked:field.value!==field.defaultValue;}
   if(field instanceof HTMLTextAreaElement)return field.value!==field.defaultValue;
   if(field instanceof HTMLSelectElement)return [...field.options].some(option=>option.selected!==option.defaultSelected);
   return false;
  });
 };
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const refresh=()=>setUnsaved(dirty());
  const observer=new MutationObserver(refresh);
  observer.observe(element,{subtree:true,childList:true,attributes:true,attributeFilter:['data-coaching-unsaved','value','checked','selected']});
  element.addEventListener('input',refresh);element.addEventListener('change',refresh);refresh();
  const click=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!(event.target instanceof Element))return;
   if(event.target.closest('[data-coaching-resource-view]'))return;
   const link=event.target.closest('a[href]');if(!(link instanceof HTMLAnchorElement)||link.target==='_blank'||link.hasAttribute('download')||!dirty())return;
   const href=new URL(link.href);if(href.origin!==window.location.origin||(href.href===window.location.href&&atReview()))return;
   event.preventDefault();event.stopPropagation();setDestination(href.pathname+href.search+href.hash);
  };
  const unload=(event:BeforeUnloadEvent)=>{if(confirmedDeparture.current){confirmedDeparture.current=false;return;}if(dirty()){event.preventDefault();event.returnValue='';}};
  installCoachingHistoryTracking();
  const reviewUrl=new URL(window.location.href);
  const atReview=()=>window.location.pathname===reviewUrl.pathname&&window.location.search===reviewUrl.search;
  let checkpoint={href:window.location.href,index:coachingBrowserHistoryIndex()},restoring=false,bypass=false;
  let restoreDelta=0,restoreTimer:ReturnType<typeof setTimeout>|undefined;
  const remember=()=>{if(!restoring&&atReview())checkpoint={href:window.location.href,index:coachingBrowserHistoryIndex()};};
  const confirmHere=()=>{
   restoring=false;clearTimeout(restoreTimer);
   const href=window.location.href;
   // Keep feedback mounted even when an old entry has no trustworthy position.
   // On discard reload the actual destination; never guess Forward or rewrite it.
   leaveByBack.current=()=>{confirmedDeparture.current=true;window.location.assign(href);};
   setBackPending(true);
  };
  const pop=(event:PopStateEvent)=>{
   if(bypass){clearTimeout(restoreTimer);bypass=false;confirmedDeparture.current=false;remember();return;}
   if(restoring){
    event.stopImmediatePropagation();clearTimeout(restoreTimer);restoring=false;
    if(window.location.href!==checkpoint.href||coachingBrowserHistoryIndex()!==checkpoint.index){confirmHere();return;}
    const delta=-restoreDelta;
    leaveByBack.current=()=>{
     bypass=true;confirmedDeparture.current=true;
     restoreTimer=setTimeout(()=>{bypass=false;confirmedDeparture.current=false;confirmHere();},1000);
     window.history.go(delta);
    };
    setBackPending(true);return;
   }
   if(atReview()){remember();setBackPending(false);setDestination(null);return;}
   if(!dirty())return;
   event.stopImmediatePropagation();
   const index=coachingBrowserHistoryIndex();
   const distance=index!==null&&checkpoint.index!==null?checkpoint.index-index:null;
   if(distance===null||distance===0){confirmHere();return;}
   restoring=true;restoreDelta=distance;
   restoreTimer=setTimeout(()=>{if(restoring)confirmHere();},1000);
   window.history.go(distance);
  };
  // The Navigation API fires before popstate and before Next can unmount this
  // review. Cancel a traversal there so the feedback stays in its form while
  // the coach decides whether to discard it.
  type ReviewNavigation=EventTarget&{traverseTo?:(key:string)=>{finished:Promise<unknown>}};
  const navigation=(window as Window&{navigation?:ReviewNavigation}).navigation;
  const navigate=(event:Event)=>{
   if(confirmedDeparture.current){confirmedDeparture.current=false;return;}
   const traversal=event as Event&{navigationType?:string;destination?:{url?:string;key?:string;index?:number}};
   if(traversal.navigationType!=='traverse'||!event.cancelable||!dirty())return;
   const target=traversal.destination;
   if(!target?.url)return;
   const next=new URL(target.url);
   if(next.pathname===reviewUrl.pathname&&next.search===reviewUrl.search)return;
   event.preventDefault();
   const sourceIndex=coachingBrowserHistoryIndex();
   leaveByBack.current=()=>{
    confirmedDeparture.current=true;
    bypass=true;
    if(target.key&&navigation?.traverseTo){void navigation.traverseTo(target.key).finished.catch(()=>{bypass=false;confirmedDeparture.current=false;confirmHere();});return;}
    if(sourceIndex!==null&&typeof target.index==='number'){window.history.go(target.index-sourceIndex);return;}
    window.location.assign(target.url!);
   };
   setBackPending(true);
  };
  window.addEventListener(COACHING_HISTORY_CHANGE,remember);
  document.addEventListener('click',click,true);window.addEventListener('beforeunload',unload);window.addEventListener('popstate',pop,true);navigation?.addEventListener('navigate',navigate);
  return()=>{clearTimeout(restoreTimer);window.removeEventListener(COACHING_HISTORY_CHANGE,remember);observer.disconnect();element.removeEventListener('input',refresh);element.removeEventListener('change',refresh);document.removeEventListener('click',click,true);window.removeEventListener('beforeunload',unload);window.removeEventListener('popstate',pop,true);navigation?.removeEventListener('navigate',navigate);};
 },[readOnly]);
 const keepEditing=()=>{setDestination(null);setBackPending(false);};
 return <CoachingReviewDirtyContext.Provider value={unsaved}><Box ref={root}>{children}</Box><Dialog open={Boolean(destination)||backPending} onClose={keepEditing} aria-labelledby="review-unsaved-title"><DialogTitle id="review-unsaved-title">Unsaved review feedback</DialogTitle><DialogContent>Save your drafts before reviewing and sending. Continuing discards unsaved changes.</DialogContent><DialogActions><Button autoFocus onClick={keepEditing}>Keep editing</Button><Button color="error" onClick={()=>{const href=destination;const back=backPending;keepEditing();if(back)leaveByBack.current();else if(href){if(new URL(href,window.location.href).href===window.location.href){confirmedDeparture.current=true;window.location.assign(href);}else router.push(href);}}}>Discard and continue</Button></DialogActions></Dialog></CoachingReviewDirtyContext.Provider>;
}
