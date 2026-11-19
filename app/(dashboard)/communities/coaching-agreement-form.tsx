'use client';

import {useEffect,useRef,type ReactNode} from 'react';
import Box from '@mui/material/Box';
import {CommunityPublicationForm} from './community-publication-form';
import {coachingAgreementWithFeedbackAction} from './community-actions';

/** Retain entered values on a rejected agreement and announce the useful error. */
export function CoachingAgreementForm({children,disabled=false}:{children:ReactNode;disabled?:boolean}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=root.current;if(!element)return;
  let previous='';
  const observer=new MutationObserver(()=>{
   const alert=element.querySelector<HTMLElement>('[role="alert"]'),message=alert?.textContent??'';
   if(alert&&message&&message!==previous){alert.tabIndex=-1;alert.focus({preventScroll:true});alert.scrollIntoView({block:'nearest'});}
   previous=message;
  });
  observer.observe(element,{subtree:true,childList:true,characterData:true});
  return()=>observer.disconnect();
 },[]);
 return <Box ref={root}><CommunityPublicationForm action={coachingAgreementWithFeedbackAction} disabled={disabled}>{children}</CommunityPublicationForm></Box>;
}
