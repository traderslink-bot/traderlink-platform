'use client';
import {useEffect,useState,type RefObject} from 'react';
export function useMobileWorkspaceViewport(rootRef:RefObject<HTMLDivElement|null>,enabled:boolean,tabbed:boolean){
const [height,setHeight]=useState(480);
  useEffect(()=>{
    if(!enabled)return;
    let frame=0;const safe=document.createElement('div');Object.assign(safe.style,{position:'fixed',visibility:'hidden',pointerEvents:'none',height:'env(safe-area-inset-bottom)',width:'0'});document.body.append(safe);
    const measure=()=>{const top=(rootRef.current?.getBoundingClientRect().top??0)+window.scrollY;const viewport=window.visualViewport;const h=Math.max(100,Math.floor((viewport?.height??window.innerHeight)-Math.max(0,top)-Math.max(8,safe.getBoundingClientRect().height)));setHeight(old=>old===h?old:h);};
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
    const observer=new ResizeObserver(schedule);if(rootRef.current?.parentElement)observer.observe(rootRef.current.parentElement);
    window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);schedule();
    return()=>{cancelAnimationFrame(frame);safe.remove();observer.disconnect();window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('scroll',schedule);};
  },[enabled,tabbed,rootRef]);
return height;
}
