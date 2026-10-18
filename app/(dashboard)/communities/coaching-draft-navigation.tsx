"use client";

import {useEffect, useRef, useState} from "react";
import {coachingBrowserHistoryIndex,installCoachingHistoryTracking,COACHING_HISTORY_CHANGE} from "@/app/coaching-review-history";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export function focusCoachingEditor(id: string) {
  const editor = document.getElementById(id);
  editor?.focus({preventScroll:true});
  editor?.scrollIntoView({block:"start"});
}

function formContents(id: string): string | null {
  const form = document.getElementById(id);
  if(form instanceof HTMLFormElement)return JSON.stringify([...new FormData(form).entries()].filter(([name])=>!name.startsWith("$ACTION_")));
  // Student sections contain multiple independent forms. Compare their current
  // values in memory without storing private message/Journal drafts elsewhere.
  if(!form)return null;
  return JSON.stringify([...form.querySelectorAll("form")].map(item=>[...new FormData(item).entries()].filter(([name])=>!name.startsWith("$ACTION_")).map(([name,value])=>[name,value instanceof File?[value.name,value.size,value.type,value.lastModified]:value])));
}

/** Protect local editor switches without storing private drafts outside the form. */
export function useCoachingDraftNavigation(formId: string, formKey: string|((hash:string)=>string), guardStudentHistory=false) {
  const [hash,setHash]=useState("");
  const renderedPage=useRef<string|null>(null);
  const baselineKey=typeof formKey==='function'?formKey(hash):formKey;
  const allowNavigation=useRef(false);
  const allowedTarget=useRef<{href:string;index:number|null}|null>(null);
  const permissionTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  function clearPermission(){clearTimeout(permissionTimer.current);allowNavigation.current=false;allowedTarget.current=null;}
  function permitNavigation(target:{href:string;index:number|null}|null=null,onExpired?:()=>void){
    clearPermission();allowNavigation.current=true;allowedTarget.current=target;
    permissionTimer.current=setTimeout(()=>{clearPermission();onExpired?.();},1000);
  }
  function consumePermission(){
    if(!allowNavigation.current)return false;
    const target=allowedTarget.current;
    const allowed=!target||(window.location.href===target.href&&(target.index===null||coachingBrowserHistoryIndex()===target.index));
    clearPermission();return allowed;
  }
  const baseline = useRef<string | null>(null);
  const focusOnChange = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const afterDialog = useRef<"form" | "trigger">("trigger");
  const [pending, setPending] = useState<(() => void) | null>(null);

  useEffect(() => {
    baseline.current = formContents(formId);
    if (focusOnChange.current) {
      focusOnChange.current = false;
      focusCoachingEditor(formId);
    }
  }, [formId, baselineKey, guardStudentHistory?hash:null]);

  function dirty(){
    const contents=formContents(formId);
    return Boolean(document.getElementById(formId)?.querySelector('[data-coaching-unsaved="true"]'))||(baseline.current!==null&&contents!==null&&contents!==baseline.current);
  }

  // Gate the rendered fragment as well as the URL. A popstate/hashchange must
  // never unmount the original form before its dirty state has been considered.
  useEffect(()=>{
    if(!guardStudentHistory)return;
    installCoachingHistoryTracking();
    const page=new URL(window.location.href);
    renderedPage.current=page.origin+page.pathname+page.search;
    const samePage=()=>window.location.pathname===page.pathname&&window.location.search===page.search;
    let checkpoint={href:window.location.href,index:coachingBrowserHistoryIndex()};
    let restoring=false,restoreDelta=0;
    let replayTarget:{href:string;index:number|null}|null=null;
    let restoreTimer:ReturnType<typeof setTimeout>|undefined;
    setHash(window.location.hash);
    const commit=(render=true)=>{
      checkpoint={href:window.location.href,index:coachingBrowserHistoryIndex()};
      if(render&&samePage())setHash(window.location.hash);
    };
    // With no trustworthy position, do not walk in a guessed direction. Keep
    // the original React form mounted at the destination until the user decides.
    const confirmHere=()=>{
      restoring=false;clearTimeout(restoreTimer);clearPermission();
      trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
      commit(false);
      setPending(()=>()=>{
        if(samePage()){clearPermission();commit();}
        else{permitNavigation({href:checkpoint.href,index:null});window.location.assign(checkpoint.href);}
      });
    };
    const restore=()=>{
      const index=coachingBrowserHistoryIndex();
      const distance=index!==null&&checkpoint.index!==null?checkpoint.index-index:null;
      if(distance===null||distance===0){confirmHere();return;}
      replayTarget={href:window.location.href,index};
      restoring=true;restoreDelta=distance;
      // A browser may ignore a stale/out-of-range go(). Never remain stuck.
      restoreTimer=setTimeout(()=>{if(restoring)confirmHere();},1000);
      window.history.go(distance);
    };
    const pop=(event:PopStateEvent)=>{
      if(restoring){
        event.stopImmediatePropagation();
        clearTimeout(restoreTimer);restoring=false;
        const index=coachingBrowserHistoryIndex();
        const atSource=window.location.href===checkpoint.href&&checkpoint.index!==null&&index===checkpoint.index;
        if(!atSource){confirmHere();return;}
        const delta=-restoreDelta;
        trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
        const target=replayTarget;
        const replay=()=>{
          permitNavigation(target,()=>{trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setPending(()=>replay);});
          window.history.go(delta);
        };
        setPending(()=>replay);
        return;
      }
      if(consumePermission()){commit();return;}
      if(window.location.href===checkpoint.href){commit(false);return;}
      if(dirty()){event.stopImmediatePropagation();restore();}else commit();
    };
    const fragment=()=>{
      if(restoring||window.location.href===checkpoint.href)return;
      if(consumePermission()){commit();return;}
      if(dirty())restore();else commit();
    };
    const remember=()=>{if(!restoring&&window.location.href===checkpoint.href)commit(false);};
    const unload=(event:BeforeUnloadEvent)=>{if(consumePermission())return;if(dirty()){event.preventDefault();event.returnValue='';}};
    window.addEventListener('popstate',pop,true);
    window.addEventListener('hashchange',fragment);
    window.addEventListener(COACHING_HISTORY_CHANGE,remember);
    window.addEventListener('beforeunload',unload);
    return()=>{clearTimeout(restoreTimer);clearPermission();window.removeEventListener('popstate',pop,true);window.removeEventListener('hashchange',fragment);window.removeEventListener(COACHING_HISTORY_CHANGE,remember);window.removeEventListener('beforeunload',unload);};
  },[formId,guardStudentHistory]);

  function requestChange(change: () => void) {
    clearPermission();
    const navigate=()=>{
      const before=window.location.href;
      if(guardStudentHistory)permitNavigation();
      change();
      // An unknown history target can already have the requested fragment.
      // Explicit menu navigation must still commit that section after consent.
      if(guardStudentHistory){
        const actual=new URL(window.location.href);
        if(window.location.href===before&&actual.origin+actual.pathname+actual.search!==renderedPage.current){
          permitNavigation({href:before,index:null});window.location.reload();return;
        }
        setHash(window.location.hash);if(window.location.href===before)clearPermission();
      }
    };
    if (dirty()) {
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPending(() => navigate);
    } else {
      focusOnChange.current = true;
      navigate();
    }
  }

  const confirmation = <Dialog open={pending !== null} disableRestoreFocus
    aria-labelledby={`${formId}-discard-title`}
    aria-describedby={`${formId}-discard-description`}
    onClose={() => {afterDialog.current = "trigger"; setPending(null);}}
    slotProps={{transition:{onExited:() => {
      if (afterDialog.current === "form") focusCoachingEditor(formId);
      else trigger.current?.focus();
    }}}}>
    <DialogTitle id={`${formId}-discard-title`}>Discard unsaved changes?</DialogTitle>
    <DialogContent><DialogContentText id={`${formId}-discard-description`}>
      Your unsaved changes will be lost if you continue.
    </DialogContentText></DialogContent>
    <DialogActions>
      <Button autoFocus onClick={() => {afterDialog.current = "trigger"; setPending(null);}}>Keep editing</Button>
      <Button color="error" onClick={() => {
        afterDialog.current = "form";
        pending?.();
        setPending(null);
      }}>Discard changes</Button>
    </DialogActions>
  </Dialog>;

  function isRenderedLocation(href:string){
    const destination=new URL(href,window.location.href);
    return destination.origin+destination.pathname+destination.search===renderedPage.current&&destination.hash===hash;
  }
  return {requestChange, confirmation, hash, isRenderedLocation};
}
