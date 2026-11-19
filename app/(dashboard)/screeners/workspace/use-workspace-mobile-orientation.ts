'use client';
import {useEffect,useState} from 'react';
import type {MobileOrientation} from './scanner-mobile-layout';
/** Keyboard height changes must not select another saved layout. */
export function useWorkspaceMobileOrientation(enabled:boolean):MobileOrientation{
 const [orientation,setOrientation]=useState<MobileOrientation>('portrait');
 useEffect(()=>{
  if(!enabled)return;
  let width=window.innerWidth,frame=0;
  const measure=()=>{
   const nextWidth=window.innerWidth;
   const typing=document.activeElement instanceof HTMLElement&&document.activeElement.matches('input,textarea,[contenteditable="true"]');
   if(!typing||nextWidth!==width)setOrientation(window.matchMedia('(orientation:landscape)').matches?'landscape':'portrait');
   width=nextWidth;
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  window.addEventListener('resize',schedule);schedule();
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);};
 },[enabled]);
 return orientation;
}
